import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { TramiteService } from '../../services/tramite.service';
import { Tramite } from '../../models';

type EstadoPaso = 'pendiente' | 'en_proceso' | 'completado' | 'observado' | 'rechazado';
type EstadoTramite = Tramite['estado'];
type TramiteItem = Tramite;

interface FlujoPaso {
  numero: number;
  departamento: string;
  estado: EstadoPaso;
  actual: boolean;
  completado: boolean;
}

interface FlujoResponse {
  referencia: string;
  departamento_actual?: string | null;
  estado_actual?: string | null;
  ruta_departamentos?: string[];
  pasos?: FlujoPaso[];
}

interface NodoDiagrama {
  id: string;
  paso: number;
  departamento: string;
  estado: EstadoPaso;
  x: number;
  y: number;
  width: number;
  height: number;
  orderInLane: number;
}

interface ConexionDiagrama {
  from: string;
  to: string;
}

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css']
})
export class AnalyticsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('diagramCanvas') diagramCanvas?: ElementRef<HTMLCanvasElement>;

  tramitesDisponibles: TramiteItem[] = [];
  tramiteActual: TramiteItem | null = null;

  referenciaBusqueda = '';
  referenciaSeleccionada = '';

  cargando = false;
  error = '';

  pasosFlujo: FlujoPaso[] = [];
  departamentos: string[] = [];
  siguienteDepartamento = '—';

  nodos: NodoDiagrama[] = [];
  conexiones: ConexionDiagrama[] = [];

  canvasWidth = 1100;
  canvasHeight = 430;

  private ctx: CanvasRenderingContext2D | null = null;

  private readonly paddingX = 40;
  private readonly paddingY = 24;
  private readonly headerHeight = 84;
  private readonly laneWidth = 240;
  private readonly laneGap = 26;
  private readonly nodeWidth = 182;
  private readonly nodeHeight = 90;
  private readonly laneTop = 122;
  private readonly laneRowGap = 132;
  private readonly minCanvasHeight = 420;

  private draggingNodeId: string | null = null;
  private dragOffsetX = 0;
  private dragOffsetY = 0;

  private readonly resizeHandler = () => {
    this.recalcularCanvas();
    this.dibujar();
  };

  constructor(private tramiteService: TramiteService) {}

  ngOnInit(): void {
    this.cargarTramitesDisponibles();
    window.addEventListener('resize', this.resizeHandler);
  }

  ngAfterViewInit(): void {
    this.inicializarCanvas();
    setTimeout(() => {
      this.recalcularCanvas();
      this.dibujar();
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeHandler);
  }

  trackByReferencia(_: number, item: TramiteItem): string {
    return item.referencia;
  }

  cargarTramitesDisponibles(): void {
    this.tramiteService.listar().subscribe({
      next: (data: Tramite[]) => {
        this.tramitesDisponibles = Array.isArray(data) ? data : [];
      },
      error: () => {
        this.tramitesDisponibles = [];
      }
    });
  }

  onSeleccionRapidaChange(): void {
    const referencia = (this.referenciaSeleccionada || '').trim();
    if (!referencia) {
      return;
    }

    this.referenciaBusqueda = referencia;
    this.cargarTramite(referencia);
  }

  buscarTramite(): void {
    const referencia = this.referenciaBusqueda.trim();
    if (!referencia) {
      this.error = 'Ingresa una referencia válida.';
      return;
    }

    this.referenciaSeleccionada = referencia;
    this.cargarTramite(referencia);
  }

  private cargarTramite(referencia: string): void {
    this.cargando = true;
    this.error = '';
    this.tramiteActual = null;
    this.pasosFlujo = [];
    this.departamentos = [];
    this.siguienteDepartamento = '—';
    this.nodos = [];
    this.conexiones = [];
    this.dibujar();

    this.tramiteService.obtenerPorReferencia(referencia).subscribe({
      next: (tramite: Tramite) => {
        this.tramiteService.obtenerFlujoPorReferencia(referencia).subscribe({
          next: (flujo: FlujoResponse) => this.aplicarDatos(tramite, flujo),
          error: () => this.aplicarDatos(tramite, null)
        });
      },
      error: () => {
        this.cargando = false;
        this.error = 'No se encontró el trámite con la referencia ingresada.';
        this.tramiteActual = null;
        this.pasosFlujo = [];
        this.departamentos = [];
        this.siguienteDepartamento = '—';
        this.nodos = [];
        this.conexiones = [];
        this.dibujar();
      }
    });
  }

  private aplicarDatos(tramite: TramiteItem, flujo: FlujoResponse | null): void {
    const pasos = this.normalizarPasos(tramite, flujo);
    const departamentoActual = flujo?.departamento_actual ?? tramite.departamento ?? undefined;
    const estadoActual = this.normalizarEstadoTramite(flujo?.estado_actual ?? tramite.estado);

    this.tramiteActual = {
      ...tramite,
      departamento: departamentoActual,
      estado: estadoActual
    };

    this.pasosFlujo = pasos;
    this.departamentos = this.obtenerDepartamentosDesdePasos(pasos);
    this.siguienteDepartamento = this.calcularSiguienteDepartamento(pasos);

    this.generarDiagramaDesdePasos();
    this.cargando = false;

    setTimeout(() => {
      this.recalcularCanvas();
      this.dibujar();
    });
  }

  private normalizarPasos(tramite: TramiteItem, flujo: FlujoResponse | null): FlujoPaso[] {
  const pasosFlujo = flujo?.pasos ?? [];

  if (pasosFlujo.length > 0) {
    return pasosFlujo
      .map((paso, index) => ({
        numero: paso.numero ?? index + 1,
        departamento: (paso.departamento || '').trim(),
        estado: this.normalizarEstadoPaso(paso.estado),
        actual: !!paso.actual,
        completado: !!paso.completado
      }))
      .filter((paso) => !!paso.departamento);
  }

  const ruta = this.obtenerRutaTramite(tramite, flujo);
  const departamentoActual =
    flujo?.departamento_actual ??
    tramite.departamento ??
    (ruta.length > 0 ? ruta[0] : undefined);

  const indiceActual = ruta.indexOf(departamentoActual || '');

  return ruta.map((departamento, index) => {
    let estado: EstadoPaso = 'pendiente';

    if (tramite.estado === 'rechazado' && departamento === departamentoActual) {
      estado = 'rechazado';
    } else if (tramite.estado === 'observado' && departamento === departamentoActual) {
      estado = 'observado';
    } else if (departamento === departamentoActual) {
      estado = 'en_proceso';
    } else if (indiceActual > index) {
      estado = 'completado';
    }

    return {
      numero: index + 1,
      departamento,
      estado,
      actual: departamento === departamentoActual,
      completado: estado === 'completado'
    };
  });
}

  private obtenerRutaTramite(tramite: TramiteItem, flujo: FlujoResponse | null): string[] {
  const rutaDesdeFlujo = flujo?.ruta_departamentos ?? [];
  const rutaDesdeTramite = tramite.ruta_departamentos ?? [];
  const rutaDesdeDepartamento = tramite.departamento ? [tramite.departamento] : [];

  const rutaCruda = [
    ...rutaDesdeFlujo,
    ...rutaDesdeTramite,
    ...rutaDesdeDepartamento
  ];

  const ruta: string[] = [];
  const vistos = new Set<string>();

  for (const item of rutaCruda) {
    const valor = (item || '').trim();
    if (!valor || vistos.has(valor)) {
      continue;
    }
    vistos.add(valor);
    ruta.push(valor);
  }

  return ruta;
}

  private obtenerDepartamentosDesdePasos(pasos: FlujoPaso[]): string[] {
    const deps: string[] = [];
    const vistos = new Set<string>();

    for (const paso of pasos) {
      const dep = (paso.departamento || '').trim();
      if (!dep || vistos.has(dep)) {
        continue;
      }
      vistos.add(dep);
      deps.push(dep);
    }

    return deps;
  }

  private calcularSiguienteDepartamento(pasos: FlujoPaso[]): string {
    const actual = pasos.find((paso) => paso.actual);
    if (!actual) {
      return '—';
    }

    const index = pasos.findIndex((paso) => paso.actual);
    const siguiente = pasos[index + 1];
    return siguiente?.departamento || 'Finalizado';
  }

  private generarDiagramaDesdePasos(): void {
    this.nodos = [];
    this.conexiones = [];

    if (!this.pasosFlujo.length || !this.departamentos.length) {
      return;
    }

    const contadorPorColumna: Record<string, number> = {};

    this.pasosFlujo.forEach((paso, index) => {
      const colIndex = this.departamentos.indexOf(paso.departamento);
      const orderInLane = (contadorPorColumna[paso.departamento] || 0) + 1;
      contadorPorColumna[paso.departamento] = orderInLane;

      const x =
        this.paddingX +
        colIndex * (this.laneWidth + this.laneGap) +
        (this.laneWidth - this.nodeWidth) / 2;

      const y = this.laneTop + (orderInLane - 1) * this.laneRowGap;

      this.nodos.push({
        id: `nodo-${index + 1}`,
        paso: paso.numero,
        departamento: paso.departamento,
        estado: paso.estado,
        x,
        y,
        width: this.nodeWidth,
        height: this.nodeHeight,
        orderInLane
      });
    });

    for (let i = 0; i < this.nodos.length - 1; i++) {
      this.conexiones.push({
        from: this.nodos[i].id,
        to: this.nodos[i + 1].id
      });
    }
  }

  private inicializarCanvas(): void {
    const canvas = this.diagramCanvas?.nativeElement;
    if (!canvas) {
      return;
    }

    this.ctx = canvas.getContext('2d');
    this.recalcularCanvas();
  }

  private recalcularCanvas(): void {
    const canvas = this.diagramCanvas?.nativeElement;
    if (!canvas) {
      return;
    }

    const cantidadColumnas = Math.max(this.departamentos.length, 1);
    const maxNodosMismaColumna = Math.max(
      ...Object.values(this.contarNodosPorDepartamento()),
      1
    );

    this.canvasWidth = Math.max(
      1080,
      this.paddingX * 2 +
        cantidadColumnas * this.laneWidth +
        (cantidadColumnas - 1) * this.laneGap
    );

    this.canvasHeight = Math.max(
      this.minCanvasHeight,
      this.laneTop + maxNodosMismaColumna * this.laneRowGap + 70
    );

    canvas.width = this.canvasWidth;
    canvas.height = this.canvasHeight;
    canvas.style.width = `${this.canvasWidth}px`;
    canvas.style.height = `${this.canvasHeight}px`;

    this.ctx = canvas.getContext('2d');
  }

  private contarNodosPorDepartamento(): Record<string, number> {
    const result: Record<string, number> = {};

    for (const nodo of this.nodos) {
      result[nodo.departamento] = (result[nodo.departamento] || 0) + 1;
    }

    return result;
  }

  dibujar(): void {
    if (!this.ctx) {
      return;
    }

    const ctx = this.ctx;

    ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.dibujarFondoGrid(ctx);
    this.dibujarColumnas(ctx);

    if (!this.nodos.length) {
      this.dibujarEstadoVacio(ctx);
      return;
    }

    this.dibujarConexiones(ctx);
    this.dibujarNodos(ctx);
  }

  private dibujarFondoGrid(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    ctx.strokeStyle = '#e9eef7';
    ctx.lineWidth = 1;

    const gridSize = 28;

    for (let x = 0; x <= this.canvasWidth; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvasHeight);
      ctx.stroke();
    }

    for (let y = 0; y <= this.canvasHeight; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvasWidth, y);
      ctx.stroke();
    }

    ctx.restore();
  }

  private dibujarColumnas(ctx: CanvasRenderingContext2D): void {
    this.departamentos.forEach((departamento, index) => {
      const x = this.paddingX + index * (this.laneWidth + this.laneGap);
      const hayNodoActual = this.nodos.some(
        (n) => n.departamento === departamento && n.estado === 'en_proceso'
      );

      ctx.save();

      this.drawRoundedRect(
        ctx,
        x,
        this.paddingY,
        this.laneWidth,
        this.headerHeight - 18,
        18
      );
      ctx.fillStyle = hayNodoActual ? '#dbeafe' : '#ffffff';
      ctx.strokeStyle = hayNodoActual ? '#2563eb' : '#d7deea';
      ctx.lineWidth = hayNodoActual ? 2 : 1.2;
      ctx.fill();
      ctx.stroke();

      this.drawRoundedRect(
        ctx,
        x,
        this.headerHeight,
        this.laneWidth,
        this.canvasHeight - this.headerHeight - this.paddingY,
        18
      );
      ctx.fillStyle = hayNodoActual
        ? 'rgba(37, 99, 235, 0.05)'
        : 'rgba(255,255,255,0.65)';
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.font = '700 28px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      this.drawWrappedCenteredText(
        ctx,
        departamento,
        x + this.laneWidth / 2,
        this.paddingY + 30,
        this.laneWidth - 24,
        30
      );

      ctx.restore();
    });
  }

  private dibujarConexiones(ctx: CanvasRenderingContext2D): void {
    for (const conexion of this.conexiones) {
      const origen = this.nodos.find((n) => n.id === conexion.from);
      const destino = this.nodos.find((n) => n.id === conexion.to);

      if (!origen || !destino) {
        continue;
      }

      const x1 = origen.x + origen.width;
      const y1 = origen.y + origen.height / 2;
      const x2 = destino.x;
      const y2 = destino.y + destino.height / 2;
      const middleX = x1 + (x2 - x1) / 2;

      ctx.save();
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(middleX, y1);
      ctx.lineTo(middleX, y2);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      this.dibujarFlecha(ctx, x2, y2, 10, '#64748b');
      ctx.restore();
    }
  }

  private dibujarNodos(ctx: CanvasRenderingContext2D): void {
    for (const nodo of this.nodos) {
      const color = this.obtenerColorNodo(nodo.estado);
      const borde = this.obtenerColorBordeNodo(nodo.estado);

      ctx.save();

      ctx.shadowColor = 'rgba(15, 23, 42, 0.12)';
      ctx.shadowBlur = nodo.estado === 'en_proceso' ? 18 : 10;
      ctx.shadowOffsetY = 4;

      this.drawRoundedRect(ctx, nodo.x, nodo.y, nodo.width, nodo.height, 16);
      ctx.fillStyle = color;
      ctx.strokeStyle = borde;
      ctx.lineWidth = nodo.estado === 'en_proceso' ? 3 : 2;
      ctx.fill();
      ctx.stroke();

      ctx.shadowColor = 'transparent';

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.font = '700 18px Arial';
      ctx.fillText(`Paso ${nodo.paso}`, nodo.x + nodo.width / 2, nodo.y + 28);

      ctx.font = '600 16px Arial';
      this.drawWrappedCenteredText(
        ctx,
        nodo.departamento,
        nodo.x + nodo.width / 2,
        nodo.y + 56,
        nodo.width - 22,
        20
      );

      ctx.restore();
    }
  }

  private dibujarEstadoVacio(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle = '#475569';
    ctx.font = '600 22px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      'Selecciona un trámite para generar su diagrama',
      this.canvasWidth / 2,
      this.canvasHeight / 2 - 10
    );

    ctx.fillStyle = '#94a3b8';
    ctx.font = '400 15px Arial';
    ctx.fillText(
      'Se mostrarán solo las direcciones reales por las que pasa ese trámite.',
      this.canvasWidth / 2,
      this.canvasHeight / 2 + 24
    );
    ctx.restore();
  }

  onMouseDown(event: MouseEvent): void {
    const point = this.obtenerPuntoCanvas(event);
    if (!point) {
      return;
    }

    const nodo = [...this.nodos]
      .reverse()
      .find((item) => this.puntoDentroDeNodo(point.x, point.y, item));

    if (!nodo) {
      return;
    }

    this.draggingNodeId = nodo.id;
    this.dragOffsetX = point.x - nodo.x;
    this.dragOffsetY = point.y - nodo.y;
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.draggingNodeId) {
      return;
    }

    const point = this.obtenerPuntoCanvas(event);
    if (!point) {
      return;
    }

    const nodo = this.nodos.find((item) => item.id === this.draggingNodeId);
    if (!nodo) {
      return;
    }

    nodo.x = this.clamp(
      point.x - this.dragOffsetX,
      12,
      this.canvasWidth - nodo.width - 12
    );

    nodo.y = this.clamp(
      point.y - this.dragOffsetY,
      this.headerHeight + 12,
      this.canvasHeight - nodo.height - 12
    );

    this.dibujar();
  }

  onMouseUp(): void {
    this.draggingNodeId = null;
  }

  onMouseLeave(): void {
    this.draggingNodeId = null;
  }

  obtenerEstadoBadge(estado?: string | null): string {
    const valor = (estado || '').toLowerCase();

    switch (valor) {
      case 'solicitado':
        return 'Solicitado';
      case 'en_proceso':
        return 'En proceso';
      case 'aceptado':
      case 'aprobado':
        return 'Aceptado';
      case 'rechazado':
        return 'Rechazado';
      case 'observado':
        return 'Observado';
      case 'completado':
        return 'Completado';
      default:
        return estado || '—';
    }
  }

  obtenerClaseEstado(estado?: string | null): string {
    const valor = (estado || '').toLowerCase();

    if (valor.includes('rechaz')) {
      return 'estado-rechazado';
    }
    if (valor.includes('observ')) {
      return 'estado-observado';
    }
    if (valor.includes('acept') || valor.includes('aprob') || valor.includes('complet')) {
      return 'estado-completado';
    }
    if (valor.includes('proceso') || valor.includes('solicit')) {
      return 'estado-actual';
    }

    return 'estado-pendiente';
  }

  private normalizarEstadoPaso(estado?: string | null): EstadoPaso {
    const valor = (estado || '').toLowerCase();

    if (valor === 'completado' || valor === 'aceptado' || valor === 'aprobado') {
      return 'completado';
    }
    if (valor === 'en_proceso') {
      return 'en_proceso';
    }
    if (valor === 'observado') {
      return 'observado';
    }
    if (valor === 'rechazado') {
      return 'rechazado';
    }

    return 'pendiente';
  }

  private normalizarEstadoTramite(estado?: string | null): EstadoTramite {
    const valor = (estado || '').toLowerCase();

    if (valor === 'en_proceso') {
      return 'en_proceso';
    }
    if (valor === 'aceptado' || valor === 'aprobado') {
      return 'aceptado';
    }
    if (valor === 'completado') {
      return 'completado';
    }
    if (valor === 'rechazado') {
      return 'rechazado';
    }
    if (valor === 'observado') {
      return 'observado';
    }

    return 'solicitado';
  }

  private obtenerColorNodo(estado: EstadoPaso): string {
    switch (estado) {
      case 'completado':
        return '#16a34a';
      case 'en_proceso':
        return '#2563eb';
      case 'observado':
        return '#f59e0b';
      case 'rechazado':
        return '#ef4444';
      default:
        return '#94a3b8';
    }
  }

  private obtenerColorBordeNodo(estado: EstadoPaso): string {
    switch (estado) {
      case 'completado':
        return '#166534';
      case 'en_proceso':
        return '#1d4ed8';
      case 'observado':
        return '#b45309';
      case 'rechazado':
        return '#b91c1c';
      default:
        return '#64748b';
    }
  }

  private obtenerPuntoCanvas(event: MouseEvent): { x: number; y: number } | null {
    const canvas = this.diagramCanvas?.nativeElement;
    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  }

  private puntoDentroDeNodo(x: number, y: number, nodo: NodoDiagrama): boolean {
    return (
      x >= nodo.x &&
      x <= nodo.x + nodo.width &&
      y >= nodo.y &&
      y <= nodo.y + nodo.height
    );
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  private dibujarFlecha(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string
  ): void {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - size, y - size / 2);
    ctx.lineTo(x - size, y + size / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawWrappedCenteredText(
    ctx: CanvasRenderingContext2D,
    text: string,
    centerX: number,
    startY: number,
    maxWidth: number,
    lineHeight: number
  ): void {
    const words = text.split(' ');
    const lines: string[] = [];
    let current = '';

    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }

    if (current) {
      lines.push(current);
    }

    lines.forEach((line, idx) => {
      ctx.fillText(line, centerX, startY + idx * lineHeight);
    });
  }
}