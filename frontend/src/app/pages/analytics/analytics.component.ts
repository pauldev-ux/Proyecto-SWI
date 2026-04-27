import { Component, OnInit, ViewChild, ElementRef, OnDestroy, AfterViewInit } from '@angular/core';
import { TramiteService } from '../../services/tramite.service';
import { Tramite } from '../../models';

// ===================== INTERFACES =====================

export interface Departamento {
  id: string;
  nombre: string;
  icono: string;
  color: string;
  orden: number;
}

export interface Nodo {
  id: string;
  nombre: string;
  idDepartamento: string;
  idTramite: string;
  estado: 'pendiente' | 'en_proceso' | 'completado' | 'rechazado' | 'observado';
  icono: string;
  descripcion: string;
  x: number;
  y: number;
  ancho: number;
  alto: number;
  ordenEnDept?: number;
}

export interface Conexion {
  id: string;
  origen: string;
  destino: string;
  etiqueta: string;
  tipo: 'secuencial' | 'iterativa';
  idTramite: string;
}

export interface LayoutInfo {
  columnWidth: number;
  rowHeight: number;
  paddingX: number;
  paddingY: number;
  nodoWidth: number;
  nodoHeight: number;
  nodosEnColumna: { [deptId: string]: number };
  maxNodosEnFila: number;
}

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css']
})
export class AnalyticsComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  // ===== FILTRO =====
  referenciaBusqueda: string = '';
  tramiteActual: Tramite | null = null;
  cargando: boolean = false;
  error: string = '';

  // ===== DATOS =====
  departamentos: Departamento[] = [];
  nodos: Nodo[] = [];
  conexiones: Conexion[] = [];
  pasosFlujo: Array<{ numero: number; departamento: string; estado: string; actual: boolean; completado: boolean }> = [];
  tramitesDisponibles: Tramite[] = []; // Para el dropdown
  siguienteDepartamento: string | null = null;
  
  // ===== CANVAS =====
  canvas: HTMLCanvasElement | null = null;
  ctx: CanvasRenderingContext2D | null = null;
  layoutInfo: LayoutInfo = this.crearLayoutInfo();
  
  private resizeListener = () => {
    this.ajustarTamanoCanvas();
    this.dibujar();
  };

  constructor(private tramiteService: TramiteService) {}

  ngOnInit(): void {
    this.cargarTramitesDisponibles();
    
    window.addEventListener('resize', this.resizeListener);
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.inicializarCanvas();
      this.ajustarTamanoCanvas();
      this.dibujar();
    }, 500);
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeListener);
  }

  cargarTramitesDisponibles(): void {
    this.tramiteService.listar().subscribe({
      next: (tramites) => {
        this.tramitesDisponibles = tramites;
      },
      error: (err) => console.error('Error al cargar trámites disponibles', err)
    });
  }

  onTramiteSeleccionado(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target.value) {
      this.referenciaBusqueda = target.value;
      this.buscarTramite();
    }
  }

  buscarTramite(): void {
    if (!this.referenciaBusqueda.trim()) {
      this.error = 'Ingrese o seleccione una referencia de trámite';
      return;
    }

    this.cargando = true;
    this.error = '';
    this.tramiteActual = null;
    this.nodos = [];
    this.conexiones = [];
    this.pasosFlujo = [];

    this.tramiteService.obtenerPorReferencia(this.referenciaBusqueda.trim()).subscribe({
      next: (tramite) => {
        this.tramiteActual = tramite;
        this.tramiteService.obtenerFlujoPorReferencia(tramite.referencia).subscribe({
          next: (flujo) => {
            this.pasosFlujo = flujo.pasos || [];
            this.siguienteDepartamento = this.calcularSiguienteDepartamento(tramite, flujo);
            this.cargarDatosTramite(tramite, this.pasosFlujo);
            this.cargando = false;
            setTimeout(() => {
              if (!this.ctx) this.inicializarCanvas();
              this.ajustarTamanoCanvas();
              this.dibujar();
            }, 500);
          },
          error: () => {
            this.error = 'No se pudo cargar el flujo del trámite';
            this.cargando = false;
          }
        });
      },
      error: () => {
        this.error = 'No se encontró el trámite con la referencia ingresada.';
        this.tramiteActual = null;
        this.nodos = [];
        this.conexiones = [];
        this.pasosFlujo = [];
        this.cargando = false;
        this.dibujar();
      }
    });
  }

  cargarDatosTramite(tramite: Tramite, pasos: Array<{ numero: number; departamento: string; estado: string; actual: boolean; completado: boolean }> = []): void {
    this.nodos = [];
    this.conexiones = [];
    this.pasosFlujo = pasos;

    if (!tramite) {
      this.departamentos = [];
      return;
    }

    const tramiteId = tramite.id ?? '';
    const ruta = tramite.ruta_departamentos && tramite.ruta_departamentos.length > 0
      ? tramite.ruta_departamentos
      : [tramite.departamento || 'Sin Asignar'];

    this.departamentos = this.crearDepartamentosDesdeRuta(ruta, tramite.departamento);

    ruta.forEach((deptNombre, index) => {
      const dept = this.departamentos[index];
      const estado = this.determinarEstadoNodo(tramite, deptNombre, ruta);

      this.nodos.push({
        id: `n${index + 1}`,
        nombre: `Paso ${index + 1}`,
        idDepartamento: dept.id,
        idTramite: tramiteId,
        estado: estado,
        icono: this.obtenerIconoEstado(estado),
        descripcion: `${deptNombre}`,
        x: 0, y: 0, ancho: 160, alto: 90,
        ordenEnDept: 1
      });
    });

    for (let i = 0; i < this.nodos.length - 1; i++) {
      this.conexiones.push({
        id: `c${i + 1}`,
        origen: this.nodos[i].id,
        destino: this.nodos[i + 1].id,
        etiqueta: 'Siguiente',
        tipo: 'secuencial',
        idTramite: tramiteId
      });
    }
  }

  determinarEstadoNodo(tramite: Tramite, departamento: string, ruta: string[]): 'pendiente' | 'en_proceso' | 'completado' | 'rechazado' | 'observado' {
    const estado = tramite.estado;
    const deptActual = tramite.departamento;
    const indiceActual = deptActual && ruta.indexOf(deptActual) >= 0 ? ruta.indexOf(deptActual) : -1;
    const indiceNodo = ruta.indexOf(departamento);

    if (estado === 'rechazado' && deptActual === departamento) return 'rechazado';
    if (estado === 'observado' && deptActual === departamento) return 'observado';
    if (estado === 'completado') return 'completado';
    if (estado === 'aceptado' && indiceNodo === ruta.length - 1) return 'completado';
    if (indiceNodo === indiceActual) return 'en_proceso';
    if (indiceActual > indiceNodo) return 'completado';

    return 'pendiente';
  }

  calcularSiguienteDepartamento(tramite: Tramite, flujo: any): string | null {
    const ruta = flujo.ruta_departamentos || tramite.ruta_departamentos || [];
    const actual = tramite.departamento;
    const indiceActual = ruta.indexOf(actual);
    if (indiceActual >= 0 && indiceActual < ruta.length - 1) {
      return ruta[indiceActual + 1];
    }
    return null;
  }

  obtenerIconoEstado(estado: string): string {
    switch (estado) {
      case 'completado': return '✅';
      case 'en_proceso': return '🔄';
      case 'rechazado': return '❌';
      case 'observado': return '⚠️';
      default: return '⏳';
    }
  }

  crearDepartamentosDesdeRuta(ruta: string[], actual?: string): Departamento[] {
    const palette = ['#476efb', '#ff9a3c', '#28c76f', '#9b51e0', '#f02d3a', '#0bb783'];
    return ruta.map((nombre, index) => ({
      id: `d${index + 1}`,
      nombre,
      icono: ['🏁','📌','⚙️','🧾','✅','📍'][index] || '🏷️',
      color: palette[index % palette.length],
      orden: index + 1
    }));
  }

  obtenerEstadoBadge(estado: string): string {
    const estados: {[key: string]: string} = {
      'pendiente': 'Pendiente',
      'en_proceso': 'En Proceso',
      'completado': 'Completado',
      'rechazado': 'Rechazado',
      'observado': 'Observado'
    };
    return estados[estado] || estado;
  }

  obtenerColorPaso(estado: string): string {
    const colores: {[key: string]: string} = {
      'pendiente': '#95a5a6',
      'en_proceso': '#f39c12',
      'completado': '#27ae60',
      'rechazado': '#e74c3c',
      'observado': '#d35400'
    };
    return colores[estado] || '#95a5a6';
  }

  crearLayoutInfo(): LayoutInfo {
    return {
      columnWidth: 200,
      rowHeight: 140,
      paddingX: 20,
      paddingY: 100,
      nodoWidth: 140,
      nodoHeight: 80,
      nodosEnColumna: {},
      maxNodosEnFila: 0
    };
  }

  ajustarTamanoCanvas(): void {
    if (this.canvasRef && this.canvasRef.nativeElement) {
      const canvasEl = this.canvasRef.nativeElement;
      const container = canvasEl.parentElement;
      if (container) {
        const containerWidth = container.clientWidth || 800;
        const containerHeight = container.clientHeight || 500;
        canvasEl.width = Math.max(800, containerWidth);
        canvasEl.height = Math.max(500, containerHeight);
      } else {
        canvasEl.width = 800;
        canvasEl.height = 500;
      }
    }
  }

  calcularLayout(): void {
    if (!this.departamentos.length) {
      return;
    }

    const canvasWidth = this.canvas?.width || 1200;
    const numDepts = this.departamentos.length;
    this.layoutInfo.columnWidth = Math.max(200, Math.floor((canvasWidth - 40) / numDepts));

    this.departamentos.forEach((dept, deptIdx) => {
      const nodosEnEsteDept = this.nodos.filter(n => n.idDepartamento === dept.id);
      
      nodosEnEsteDept.forEach((nodo, idx) => {
        const x = 20 + deptIdx * this.layoutInfo.columnWidth + 
                  (this.layoutInfo.columnWidth - this.layoutInfo.nodoWidth) / 2;
        const y = this.layoutInfo.paddingY + idx * this.layoutInfo.rowHeight;
        nodo.x = x;
        nodo.y = y;
      });
    });
  }

  obtenerDepartamento(id: string): Departamento | undefined {
    return this.departamentos.find(d => d.id === id);
  }

  obtenerNodosEnDepartamento(idDept: string): Nodo[] {
    return this.nodos.filter(n => n.idDepartamento === idDept);
  }

  obtenerColorDepartamento(idDept: string): string {
    const dept = this.obtenerDepartamento(idDept);
    return dept ? dept.color : '#999999';
  }

  obtenerEstadoColor(estado: string): string {
    const colores: {[key: string]: string} = {
      'pendiente': '#95a5a6',
      'en_proceso': '#f39c12',
      'completado': '#27ae60',
      'rechazado': '#e74c3c',
      'observado': '#d35400'
    };
    return colores[estado] || '#95a5a6';
  }

  inicializarCanvas(): void {
    this.canvas = this.canvasRef?.nativeElement;
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
    }
  }

  dibujar(): void {
    if (!this.ctx || !this.canvas) return;

    this.calcularLayout();
    
    // Limpiar canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Dibujar un círculo rojo para probar que el canvas funciona
    this.ctx.fillStyle = 'red';
    this.ctx.beginPath();
    this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2, 50, 0, 2 * Math.PI);
    this.ctx.fill();
    
    this.dibujarFondoYGrid();
    this.dibujarLineasDepartamentos();
    this.dibujarConexiones();
    this.dibujarNodos();
  }

  dibujarFondoYGrid(): void {
    if (!this.ctx || !this.canvas) return;

    // Fondo transparente para ver el wrapper
    // this.ctx.fillStyle = '#ffffff';
    // this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.strokeStyle = '#f5f5f5';
    this.ctx.lineWidth = 1;

    for (let i = 0; i < this.canvas.width; i += 20) {
      this.ctx.beginPath();
      this.ctx.moveTo(i, this.layoutInfo.paddingY);
      this.ctx.lineTo(i, this.canvas.height);
      this.ctx.stroke();
    }

    for (let i = this.layoutInfo.paddingY; i < this.canvas.height; i += 20) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, i);
      this.ctx.lineTo(this.canvas.width, i);
      this.ctx.stroke();
    }
  }

  dibujarLineasDepartamentos(): void {
    if (!this.ctx || !this.canvas) return;

    this.ctx.strokeStyle = '#e0e0e0';
    this.ctx.lineWidth = 2;

    this.departamentos.forEach((_, idx) => {
      const x = 20 + (idx + 1) * this.layoutInfo.columnWidth;
      if (idx < this.departamentos.length - 1) {
        this.ctx!.beginPath();
        this.ctx!.moveTo(x, 0);
        this.ctx!.lineTo(x, this.canvas!.height);
        this.ctx!.stroke();
      }
    });
  }

  dibujarConexiones(): void {
    if (!this.ctx || !this.canvas) return;

    for (let conexion of this.conexiones) {
      const nodoO = this.nodos.find(n => n.id === conexion.origen);
      const nodoD = this.nodos.find(n => n.id === conexion.destino);

      if (nodoO && nodoD) {
        this.dibujarLinea(nodoO, nodoD, conexion);
      }
    }
  }

  dibujarLinea(nodoO: Nodo, nodoD: Nodo, conexion: Conexion): void {
    if (!this.ctx) return;

    const x1 = nodoO.x + nodoO.ancho / 2;
    const y1 = nodoO.y + nodoO.alto;
    const x2 = nodoD.x + nodoD.ancho / 2;
    const y2 = nodoD.y;

    const midY = (y1 + y2) / 2;

    this.ctx.strokeStyle = this.obtenerColorDepartamento(nodoD.idDepartamento);
    this.ctx.lineWidth = 3;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.bezierCurveTo(x1, midY, x2, midY, x2, y2);
    this.ctx.stroke();

    this.dibujarFlecha(x2, y2, conexion.tipo === 'iterativa');
  }

  dibujarFlecha(x: number, y: number, iterativa: boolean = false): void {
    if (!this.ctx) return;

    const size = 12;
    this.ctx.fillStyle = this.ctx.strokeStyle;

    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x - size / 2, y - size);
    this.ctx.lineTo(x + size / 2, y - size);
    this.ctx.closePath();
    this.ctx.fill();
  }

  dibujarNodos(): void {
    if (!this.ctx || !this.canvas) return;

    for (let nodo of this.nodos) {
      this.dibujarNodo(nodo);
    }
  }

  dibujarNodo(nodo: Nodo): void {
    if (!this.ctx) return;

    const colorBase = this.obtenerColorDepartamento(nodo.idDepartamento);
    const colorEstado = this.obtenerEstadoColor(nodo.estado);

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    this.ctx.fillRect(nodo.x + 2, nodo.y + 2, nodo.ancho, nodo.alto);

    this.dibujarRectRedondeado(
      nodo.x, nodo.y, nodo.ancho, nodo.alto,
      8,
      colorBase
    );

    this.ctx.strokeStyle = colorBase;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Línea inferior de estado
    this.ctx.fillStyle = colorEstado;
    this.ctx.fillRect(nodo.x + 2, nodo.y + nodo.alto - 4, nodo.ancho - 4, 3);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(nodo.icono, nodo.x + nodo.ancho / 2, nodo.y + 28);

    this.ctx.fillStyle = '#333';
    this.ctx.font = 'bold 10px Arial';
    this.ctx.textAlign = 'center';
    const maxWidth = nodo.ancho - 6;
    this.dibujarTextoEnvuelto(nodo.nombre, nodo.x + nodo.ancho / 2, nodo.y + 48, maxWidth);

    // Icono de estado en esquina
    this.ctx.fillStyle = colorEstado;
    this.ctx.fillRect(nodo.x + nodo.ancho - 18, nodo.y, 18, 18);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '10px Arial';
    const estadoIcons: {[key: string]: string} = {
      'pendiente': '⏳',
      'en_proceso': '▶️',
      'completado': '✓',
      'rechazado': '✗',
      'observado': '⚠️'
    };
    this.ctx.textAlign = 'center';
    this.ctx.fillText(estadoIcons[nodo.estado] || '?', nodo.x + nodo.ancho - 9, nodo.y + 13);
  }

  dibujarRectRedondeado(x: number, y: number, w: number, h: number, r: number, fillColor: string): void {
    if (!this.ctx) return;

    this.ctx.fillStyle = fillColor;
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.lineTo(x + w - r, y);
    this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    this.ctx.lineTo(x + w, y + h - r);
    this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.ctx.lineTo(x + r, y + h);
    this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    this.ctx.lineTo(x, y + r);
    this.ctx.quadraticCurveTo(x, y, x + r, y);
    this.ctx.closePath();
    this.ctx.fill();
  }

  dibujarTextoEnvuelto(texto: string, x: number, y: number, maxWidth: number): void {
    if (!this.ctx) return;

    const palabras = texto.split(' ');
    let linea = '';
    let lineas = [];

    for (let palabra of palabras) {
      const ancho = this.ctx.measureText(linea + palabra).width;
      if (ancho > maxWidth && linea !== '') {
        lineas.push(linea);
        linea = palabra;
      } else {
        linea += (linea ? ' ' : '') + palabra;
      }
    }
    if (linea) lineas.push(linea);

    for (let i = 0; i < Math.min(lineas.length, 2); i++) {
      this.ctx.fillText(lineas[i], x, y + i * 12);
    }
  }
}
