import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

export interface Nodo {
  id: string;
  nombre: string;
  departamento: string;
  x: number;
  y: number;
  ancho: number;
  alto: number;
  icono: string;
  descripcion: string;
}

export interface Conexion {
  id: string;
  origen: string;
  destino: string;
  etiqueta: string;
  tipo: 'secuencial' | 'iterativa';
}

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css']
})
export class AnalyticsComponent implements OnInit {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  nodos: Nodo[] = [
    {
      id: 'n1',
      nombre: 'Recibir Solicitud',
      departamento: 'Ventas',
      x: 100,
      y: 100,
      ancho: 150,
      alto: 80,
      icono: '📋',
      descripcion: 'Cliente presenta solicitud'
    },
    {
      id: 'n2',
      nombre: 'Revisar Documentos',
      departamento: 'Legal',
      x: 350,
      y: 100,
      ancho: 150,
      alto: 80,
      icono: '📋',
      descripcion: 'Verificación legal'
    },
    {
      id: 'n3',
      nombre: 'Validar Presupuesto',
      departamento: 'Finanzas',
      x: 600,
      y: 100,
      ancho: 150,
      alto: 80,
      icono: '💵',
      descripcion: 'Evaluación de fondos'
    },
    {
      id: 'n4',
      nombre: 'Aprobar Pago',
      departamento: 'Finanzas',
      x: 600,
      y: 250,
      ancho: 150,
      alto: 80,
      icono: '✓',
      descripcion: 'Autorización'
    },
    {
      id: 'n5',
      nombre: 'Aprobación Final',
      departamento: 'Legal',
      x: 350,
      y: 250,
      ancho: 150,
      alto: 80,
      icono: '✓',
      descripcion: 'Firma final'
    }
  ];

  conexiones: Conexion[] = [
    { id: 'c1', origen: 'n1', destino: 'n2', etiqueta: 'Solicitud', tipo: 'secuencial' },
    { id: 'c2', origen: 'n2', destino: 'n3', etiqueta: 'OK', tipo: 'secuencial' },
    { id: 'c3', origen: 'n3', destino: 'n4', etiqueta: 'Fondos', tipo: 'secuencial' },
    { id: 'c4', origen: 'n4', destino: 'n5', etiqueta: 'Aprobado', tipo: 'secuencial' }
  ];

  nodoSeleccionado: Nodo | null = null;
  nodoEnEdicion: Nodo | null = null;
  formularioNodo: Nodo = this.crearNodoVacio();
  arrastrando: boolean = false;
  offsetX: number = 0;
  offsetY: number = 0;
  canvas: HTMLCanvasElement | null = null;
  ctx: CanvasRenderingContext2D | null = null;

  modalAbierto: boolean = false;
  modalConexion: boolean = false;
  nuevoNodo: Nodo = this.crearNodoVacio();
  nuevaConexion: any = { origen: '', destino: '', etiqueta: '', tipo: 'secuencial' };

  departamentos = ['Ventas', 'Legal', 'Finanzas'];
  coloresDept: {[key: string]: string} = {
    'Ventas': '#2196F3',
    'Legal': '#FF9800',
    'Finanzas': '#4CAF50'
  };

  constructor() { }

  ngOnInit(): void {
    setTimeout(() => {
      this.inicializarCanvas();
      this.dibujar();
    }, 100);
  }

  crearNodoVacio(): Nodo {
    return {
      id: `n${Date.now()}`,
      nombre: '',
      departamento: 'Ventas',
      x: 200,
      y: 200,
      ancho: 150,
      alto: 80,
      icono: '📋',
      descripcion: ''
    };
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
    }
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
        break;
      }
    }
  }

  onMouseMove(e: MouseEvent): void {
    if (this.arrastrando && this.nodoSeleccionado) {
      const rect = this.canvas!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      this.nodoSeleccionado.x = x - this.offsetX;
      this.nodoSeleccionado.y = y - this.offsetY;
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

  puntoEnNodo(x: number, y: number, nodo: Nodo): boolean {
    return x >= nodo.x &&
           x <= nodo.x + nodo.ancho &&
           y >= nodo.y &&
           y <= nodo.y + nodo.alto;
  }

  dibujar(): void {
    if (!this.ctx || !this.canvas) return;

    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Grid
    this.ctx.strokeStyle = '#f0f0f0';
    this.ctx.lineWidth = 1;
    for (let i = 0; i < this.canvas.width; i += 20) {
      this.ctx.beginPath();
      this.ctx.moveTo(i, 0);
      this.ctx.lineTo(i, this.canvas.height);
      this.ctx.stroke();
    }
    for (let i = 0; i < this.canvas.height; i += 20) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, i);
      this.ctx.lineTo(this.canvas.width, i);
      this.ctx.stroke();
    }

    // Conexiones
    for (let conn of this.conexiones) {
      const nodoOrigen = this.nodos.find(n => n.id === conn.origen);
      const nodoDestino = this.nodos.find(n => n.id === conn.destino);
      if (nodoOrigen && nodoDestino) {
        const x1 = nodoOrigen.x + nodoOrigen.ancho / 2;
        const y1 = nodoOrigen.y + nodoOrigen.alto / 2;
        const x2 = nodoDestino.x + nodoDestino.ancho / 2;
        const y2 = nodoDestino.y + nodoDestino.alto / 2;

        if (conn.tipo === 'iterativa') {
          this.dibujarLineaCurva(x1, y1, x2, y2, '#e74c3c');
        } else {
          this.ctx.strokeStyle = '#999';
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.moveTo(x1, y1);
          this.ctx.lineTo(x2, y2);
          this.ctx.stroke();
        }
        this.dibujarFlecha(x1, y1, x2, y2);
      }
    }

    // Nodos
    for (let nodo of this.nodos) {
      const color = this.coloresDept[nodo.departamento];
      const seleccionado = this.nodoSeleccionado?.id === nodo.id;

      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      this.ctx.fillRect(nodo.x + 2, nodo.y + 2, nodo.ancho, nodo.alto);

      this.ctx.fillStyle = seleccionado ? color + 'DD' : color + 'AA';
      this.ctx.strokeStyle = seleccionado ? color : color + '80';
      this.ctx.lineWidth = seleccionado ? 3 : 2;
      this.ctx.fillRect(nodo.x, nodo.y, nodo.ancho, nodo.alto);
      this.ctx.strokeRect(nodo.x, nodo.y, nodo.ancho, nodo.alto);

      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(nodo.icono, nodo.x + nodo.ancho / 2, nodo.y + 25);

      this.ctx.font = '11px Arial';
      const palabras = nodo.nombre.split(' ');
      let y = nodo.y + 42;
      for (let palabra of palabras) {
        this.ctx.fillText(palabra, nodo.x + nodo.ancho / 2, y);
        y += 14;
      }
    }
  }

  dibujarLineaCurva(x1: number, y1: number, x2: number, y2: number, color: string): void {
    if (!this.ctx) return;
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.beginPath();
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2 - 50;
    this.ctx.quadraticCurveTo(cx, cy, x2, y2);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  dibujarFlecha(x1: number, y1: number, x2: number, y2: number): void {
    if (!this.ctx) return;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const angle = Math.atan2(dy, dx);
    const size = 15;

    this.ctx.fillStyle = '#999';
    this.ctx.beginPath();
    this.ctx.moveTo(x2, y2);
    this.ctx.lineTo(x2 - size * Math.cos(angle - Math.PI / 6), y2 - size * Math.sin(angle - Math.PI / 6));
    this.ctx.lineTo(x2 - size * Math.cos(angle + Math.PI / 6), y2 - size * Math.sin(angle + Math.PI / 6));
    this.ctx.closePath();
    this.ctx.fill();
  }

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
      this.conexiones = this.conexiones.filter(c => c.origen !== this.nodoSeleccionado!.id && c.destino !== this.nodoSeleccionado!.id);
      this.nodoSeleccionado = null;
      this.dibujar();
    }
  }

  agregarConexion(): void {
    this.nuevaConexion = { origen: '', destino: '', etiqueta: '', tipo: 'secuencial' };
    this.modalConexion = true;
  }

  guardarConexion(): void {
    if (this.nuevaConexion.origen && this.nuevaConexion.destino) {
      this.conexiones.push({
        id: `c${Date.now()}`,
        origen: this.nuevaConexion.origen,
        destino: this.nuevaConexion.destino,
        etiqueta: this.nuevaConexion.etiqueta,
        tipo: this.nuevaConexion.tipo
      });
      this.cerrarModalConexion();
      this.dibujar();
    }
  }

  eliminarConexion(id: string): void {
    this.conexiones = this.conexiones.filter(c => c.id !== id);
    this.dibujar();
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this.nodoEnEdicion = null;
  }

  getNombreNodo(id: string): string {
    const nodo = this.nodos.find(n => n.id === id);
    return nodo ? nodo.nombre : 'Desconocido';
  }

  cerrarModalConexion(): void {
    this.modalConexion = false;
  }

  exportarJSON(): void {
    const data = { nodos: this.nodos, conexiones: this.conexiones };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagrama.json';
    a.click();
  }

  limpiarDiagrama(): void {
    if (confirm('¿Deseas limpiar todo el diagrama? Esta acción no se puede deshacer.')) {
      this.nodos = [];
      this.conexiones = [];
      this.nodoSeleccionado = null;
      this.dibujar();
    }
  }
}
