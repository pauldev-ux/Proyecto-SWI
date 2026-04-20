import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

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
  estado: 'pendiente' | 'en_proceso' | 'completado' | 'rechazado';
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
export class AnalyticsComponent implements OnInit {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  // ===== DATOS =====
  departamentos: Departamento[] = [
    { id: 'd1', nombre: 'Inicio', icono: '🚀', color: '#667eea', orden: 1 },
    { id: 'd2', nombre: 'Recursos Humanos', icono: '👥', color: '#f093fb', orden: 2 },
    { id: 'd3', nombre: 'Legal', icono: '⚖️', color: '#FF9800', orden: 3 },
    { id: 'd4', nombre: 'Finanzas', icono: '💰', color: '#4CAF50', orden: 4 },
    { id: 'd5', nombre: 'Ventas', icono: '🏪', color: '#2196F3', orden: 5 }
  ];

  nodos: Nodo[] = [
    {
      id: 'n1',
      nombre: 'Solicitud Iniciada',
      idDepartamento: 'd1',
      idTramite: 't1',
      estado: 'completado',
      icono: '📋',
      descripcion: 'Cliente inicia el trámite',
      x: 0, y: 0, ancho: 140, alto: 80,
      ordenEnDept: 1
    },
    {
      id: 'n2',
      nombre: 'Verificación RRHH',
      idDepartamento: 'd2',
      idTramite: 't1',
      estado: 'completado',
      icono: '👤',
      descripcion: 'RRHH verifica los datos',
      x: 0, y: 0, ancho: 140, alto: 80,
      ordenEnDept: 1
    },
    {
      id: 'n3',
      nombre: 'Revisión Legal',
      idDepartamento: 'd3',
      idTramite: 't1',
      estado: 'en_proceso',
      icono: '📄',
      descripcion: 'Equipo legal revisa',
      x: 0, y: 0, ancho: 140, alto: 80,
      ordenEnDept: 1
    },
    {
      id: 'n4',
      nombre: 'Validación Presupuesto',
      idDepartamento: 'd4',
      idTramite: 't1',
      estado: 'pendiente',
      icono: '💰',
      descripcion: 'Finanzas valida costo',
      x: 0, y: 0, ancho: 140, alto: 80,
      ordenEnDept: 1
    },
    {
      id: 'n5',
      nombre: 'Aprobación Final',
      idDepartamento: 'd5',
      idTramite: 't1',
      estado: 'pendiente',
      icono: '✓',
      descripcion: 'Ventas aprueba',
      x: 0, y: 0, ancho: 140, alto: 80,
      ordenEnDept: 1
    },
    {
      id: 'n6',
      nombre: 'Solicitud Iniciada',
      idDepartamento: 'd1',
      idTramite: 't2',
      estado: 'completado',
      icono: '📋',
      descripcion: 'Segunda solicitud',
      x: 0, y: 0, ancho: 140, alto: 80,
      ordenEnDept: 2
    },
    {
      id: 'n7',
      nombre: 'Verificación RRHH',
      idDepartamento: 'd2',
      idTramite: 't2',
      estado: 'en_proceso',
      icono: '👤',
      descripcion: 'RRHH verifica',
      x: 0, y: 0, ancho: 140, alto: 80,
      ordenEnDept: 2
    }
  ];

  conexiones: Conexion[] = [
    { id: 'c1', origen: 'n1', destino: 'n2', etiqueta: 'OK', tipo: 'secuencial', idTramite: 't1' },
    { id: 'c2', origen: 'n2', destino: 'n3', etiqueta: 'OK', tipo: 'secuencial', idTramite: 't1' },
    { id: 'c3', origen: 'n3', destino: 'n4', etiqueta: 'OK', tipo: 'secuencial', idTramite: 't1' },
    { id: 'c4', origen: 'n4', destino: 'n5', etiqueta: 'OK', tipo: 'secuencial', idTramite: 't1' },
    { id: 'c5', origen: 'n6', destino: 'n7', etiqueta: 'OK', tipo: 'secuencial', idTramite: 't2' }
  ];

  // ===== ESTADO DEL EDITOR =====
  nodoSeleccionado: Nodo | null = null;
  nodoEnEdicion: Nodo | null = null;
  formularioNodo: Nodo = this.crearNodoVacio();

  // ===== CANVAS =====
  canvas: HTMLCanvasElement | null = null;
  ctx: CanvasRenderingContext2D | null = null;
  layoutInfo: LayoutInfo = this.crearLayoutInfo();

  // ===== MODAL =====
  modalAbierto: boolean = false;
  modalConexion: boolean = false;
  nuevaConexion: any = { origen: '', destino: '', etiqueta: '', tipo: 'secuencial', idTramite: '' };

  // ===== DRAG & DROP =====
  arrastrando: boolean = false;
  offsetX: number = 0;
  offsetY: number = 0;

  // ===== TRAMITES =====
  tramites: string[] = ['t1', 't2'];
  tramiteSeleccionado: string = 't1';

  constructor() {}

  ngOnInit(): void {
    this.cargarDepartamentos();
    this.calcularLayout();
    setTimeout(() => {
      this.inicializarCanvas();
      this.dibujar();
    }, 100);
  }

  // ===================== INICIALIZACIÓN ======================

  cargarDepartamentos(): void {
    // En producción: this.departamentos = await this.departamentoService.obtener();
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

  crearNodoVacio(): Nodo {
    const deptActual = this.departamentos[0];
    return {
      id: `n${Date.now()}`,
      nombre: '',
      idDepartamento: deptActual.id,
      idTramite: this.tramiteSeleccionado,
      estado: 'pendiente',
      icono: '📋',
      descripcion: '',
      x: 0, y: 0,
      ancho: 140, alto: 80,
      ordenEnDept: 1
    };
  }

  // ===================== LAYOUT & CÁLCULO ======================

  calcularLayout(): void {
    // Contar nodos por departamento
    const nodosEnDept: { [deptId: string]: Nodo[] } = {};
    this.departamentos.forEach(d => nodosEnDept[d.id] = []);

    this.nodos.forEach(nodo => {
      if (!nodosEnDept[nodo.idDepartamento]) {
        nodosEnDept[nodo.idDepartamento] = [];
      }
      nodosEnDept[nodo.idDepartamento].push(nodo);
    });

    // Ordenar nodos por trámite dentro de cada departamento
    this.departamentos.forEach(d => {
      const nododoDept = nodosEnDept[d.id];
      nododoDept.sort((a, b) => {
        if (a.idTramite !== b.idTramite) {
          return a.idTramite.localeCompare(b.idTramite);
        }
        return (a.ordenEnDept || 0) - (b.ordenEnDept || 0);
      });
    });

    const numDepts = this.departamentos.length;
    const canvasWidth = this.canvas?.width || 1400;
    this.layoutInfo.columnWidth = Math.floor((canvasWidth - 40) / numDepts);

    let maxNodosEnFila = 0;
    this.departamentos.forEach((dept, deptIdx) => {
      const nodosEnEsteDept = nodosEnDept[dept.id];
      this.layoutInfo.nodosEnColumna[dept.id] = nodosEnEsteDept.length;
      maxNodosEnFila = Math.max(maxNodosEnFila, nodosEnEsteDept.length);

      nodosEnEsteDept.forEach((nodo, idx) => {
        const x = 20 + deptIdx * this.layoutInfo.columnWidth + 
                  (this.layoutInfo.columnWidth - this.layoutInfo.nodoWidth) / 2;
        const y = this.layoutInfo.paddingY + idx * this.layoutInfo.rowHeight;
        nodo.x = x;
        nodo.y = y;
      });
    });

    this.layoutInfo.maxNodosEnFila = maxNodosEnFila;
  }

  // ===================== UTILIDADES ======================

  obtenerDepartamento(id: string): Departamento | undefined {
    return this.departamentos.find(d => d.id === id);
  }

  obtenerNodosEnDepartamento(idDept: string): Nodo[] {
    return this.nodos.filter(n => n.idDepartamento === idDept).sort((a, b) => {
      if (a.idTramite !== b.idTramite) {
        return a.idTramite.localeCompare(b.idTramite);
      }
      return (a.ordenEnDept || 0) - (b.ordenEnDept || 0);
    });
  }

  obtenerNombreDepartamento(idDept: string): string {
    const dept = this.obtenerDepartamento(idDept);
    return dept ? dept.nombre : 'Desconocido';
  }

  obtenerColorDepartamento(idDept: string): string {
    const dept = this.obtenerDepartamento(idDept);
    return dept ? dept.color : '#999999';
  }

  obtenerNombreNodo(id: string): string {
    const nodo = this.nodos.find(n => n.id === id);
    return nodo ? nodo.nombre : 'Desconocido';
  }

  obtenerEstadoColor(estado: string): string {
    const colores: {[key: string]: string} = {
      'pendiente': '#95a5a6',
      'en_proceso': '#f39c12',
      'completado': '#27ae60',
      'rechazado': '#e74c3c'
    };
    return colores[estado] || '#95a5a6';
  }

  inicializarCanvas(): void {
    this.canvas = this.canvasRef?.nativeElement;
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
      this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
      this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
      this.canvas.addEventListener('click', (e) => this.onClick(e));
      this.canvas.addEventListener('dblclick', (e) => this.onDoubleClick(e));
      window.addEventListener('keydown', (e) => this.onKeyDown(e));
    }
  }

  dibujar(): void {
    if (!this.ctx || !this.canvas) return;

    this.calcularLayout();
    this.dibujarFondoYGrid();
    this.dibujarLineasDepartamentos();
    this.dibujarConexiones();
    this.dibujarNodos();
  }

  dibujarFondoYGrid(): void {
    if (!this.ctx || !this.canvas) return;

    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

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

    if (conexion.etiqueta) {
      this.ctx.fillStyle = '#333';
      this.ctx.font = 'bold 11px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(conexion.etiqueta, x1 + (x2 - x1) / 2, midY - 10);
    }
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

    const seleccionado = this.nodoSeleccionado?.id === nodo.id;
    const colorBase = this.obtenerColorDepartamento(nodo.idDepartamento);
    const colorEstado = this.obtenerEstadoColor(nodo.estado);

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    this.ctx.fillRect(nodo.x + 2, nodo.y + 2, nodo.ancho, nodo.alto);

    this.dibujarRectRedondeado(
      nodo.x, nodo.y, nodo.ancho, nodo.alto,
      8,
      seleccionado ? colorBase : colorBase + 'CC'
    );

    this.ctx.strokeStyle = seleccionado ? '#333' : colorBase;
    this.ctx.lineWidth = seleccionado ? 3 : 2;
    this.ctx.stroke();

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

    this.ctx.fillStyle = colorEstado;
    this.ctx.fillRect(nodo.x + nodo.ancho - 18, nodo.y, 18, 18);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '10px Arial';
    const estadoIcons: {[key: string]: string} = {
      'pendiente': '⏳',
      'en_proceso': '▶️',
      'completado': '✓',
      'rechazado': '✗'
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

  // ===================== INTERACCIÓN MOUSE ======================

  puntoEnNodo(x: number, y: number, nodo: Nodo): boolean {
    return x >= nodo.x &&
           x <= nodo.x + nodo.ancho &&
           y >= nodo.y &&
           y <= nodo.y + nodo.alto;
  }

  onMouseDown(e: MouseEvent): void {
    const rect = this.canvas!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (let nodo of this.nodos) {
      if (this.puntoEnNodo(x, y, nodo)) {
        this.nodoSeleccionado = nodo;
        this.arrastrando = true;
        this.offsetX = x - nodo.x;
        this.offsetY = y - nodo.y;
        this.dibujar();
        break;
      }
    }
  }

  onMouseMove(e: MouseEvent): void {
    if (this.arrastrando && this.nodoSeleccionado) {
      const rect = this.canvas!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      this.nodoSeleccionado.x = Math.max(0, Math.min(x - this.offsetX, this.canvas!.width - this.nodoSeleccionado.ancho));
      this.nodoSeleccionado.y = Math.max(this.layoutInfo.paddingY, Math.min(y - this.offsetY, this.canvas!.height - this.nodoSeleccionado.alto));

      this.dibujar();
    }
  }

  onMouseUp(e?: MouseEvent): void {
    this.arrastrando = false;
  }

  onClick(e: MouseEvent): void {
    const rect = this.canvas!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.nodoSeleccionado = null;
    for (let nodo of this.nodos) {
      if (this.puntoEnNodo(x, y, nodo)) {
        this.nodoSeleccionado = nodo;
        this.tramiteSeleccionado = nodo.idTramite;
        this.dibujar();
        break;
      }
    }
  }

  onDoubleClick(e: MouseEvent): void {
    const rect = this.canvas!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (let nodo of this.nodos) {
      if (this.puntoEnNodo(x, y, nodo)) {
        this.nodoEnEdicion = { ...nodo };
        this.formularioNodo = { ...nodo };
        this.modalAbierto = true;
        return;
      }
    }
  }

  onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Delete' && this.nodoSeleccionado) {
      this.eliminarNodo();
    }
  }

  // ===================== GESTIÓN DE NODOS ======================

  agregarNodo(): void {
    this.formularioNodo = this.crearNodoVacio();
    this.nodoEnEdicion = null;
    this.modalAbierto = true;
  }

  editarNodo(): void {
    if (this.nodoSeleccionado) {
      this.formularioNodo = { ...this.nodoSeleccionado };
      this.nodoEnEdicion = this.nodoSeleccionado;
      this.modalAbierto = true;
    }
  }

  guardarNodo(): void {
    if (this.formularioNodo.nombre) {
      if (this.nodoEnEdicion) {
        // Editar nodo existente
        const idx = this.nodos.findIndex(n => n.id === this.nodoEnEdicion!.id);
        if (idx >= 0) {
          this.nodos[idx] = this.formularioNodo;
          this.nodoSeleccionado = this.formularioNodo;
        }
      } else {
        // Crear nuevo nodo
        this.nodos.push(this.formularioNodo);
      }
      this.cerrarModal();
      this.dibujar();
    }
  }

  eliminarNodo(): void {
    if (this.nodoSeleccionado) {
      this.nodos = this.nodos.filter(n => n.id !== this.nodoSeleccionado!.id);
      this.conexiones = this.conexiones.filter(
        c => c.origen !== this.nodoSeleccionado!.id && c.destino !== this.nodoSeleccionado!.id
      );
      this.nodoSeleccionado = null;
      this.dibujar();
    }
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this.nodoEnEdicion = null;
  }

  // ===================== GESTIÓN DE CONEXIONES ======================

  agregarConexion(): void {
    this.nuevaConexion = {
      origen: '',
      destino: '',
      etiqueta: '',
      tipo: 'secuencial',
      idTramite: this.tramiteSeleccionado
    };
    this.modalConexion = true;
  }

  guardarConexion(): void {
    if (this.nuevaConexion.origen && this.nuevaConexion.destino) {
      this.conexiones.push({
        id: `c${Date.now()}`,
        origen: this.nuevaConexion.origen,
        destino: this.nuevaConexion.destino,
        etiqueta: this.nuevaConexion.etiqueta,
        tipo: this.nuevaConexion.tipo,
        idTramite: this.nuevaConexion.idTramite
      });
      this.cerrarModalConexion();
      this.dibujar();
    }
  }

  eliminarConexion(id: string): void {
    this.conexiones = this.conexiones.filter(c => c.id !== id);
    this.dibujar();
  }

  cerrarModalConexion(): void {
    this.modalConexion = false;
  }

  // ===================== EXPORTAR & FUNCIONES UTILIDAD ======================

  exportarJSON(): void {
    const data = {
      departamentos: this.departamentos,
      nodos: this.nodos,
      conexiones: this.conexiones
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagrama-tramites-${new Date().getTime()}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  limpiarDiagrama(): void {
    if (confirm('¿Deseas limpiar todo el diagrama? Esta acción no se puede deshacer.')) {
      this.nodos = [];
      this.conexiones = [];
      this.nodoSeleccionado = null;
      this.tramiteSeleccionado = this.tramites[0];
      this.dibujar();
    }
  }
}
