import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TramiteService } from '../../services/tramite.service';
import { DepartamentoService } from '../../services/departamento.service';
import { UsuarioService } from '../../services/usuario.service';
import { Tramite, Departamento, Usuario } from '../../models';

@Component({
  selector: 'app-tramites',
  templateUrl: './tramites.component.html',
  styleUrls: ['./tramites.component.css']
})
export class TramitesComponent implements OnInit {
  tramites: Tramite[] = [];
  departamentos: Departamento[] = [];
  clientes: Usuario[] = [];

  formulario!: FormGroup;

  editando = false;
  cargando = false;
  error: string | null = null;
  exito: string | null = null;
  mostrarFormulario = false;
  tramiteEditandoId: string | null = null;

  busqueda = '';
  filtroEstado = '';

  usuarioActual: Usuario | null = null;

  rutaSeleccionada: string[] = [];
  departamentoDisponibleSeleccionado = '';

  estados: Tramite['estado'][] = [
    'solicitado',
    'en_proceso',
    'aceptado',
    'completado',
    'rechazado',
    'observado'
  ];

  prioridades: Tramite['prioridad'][] = [
    'baja',
    'normal',
    'alta',
    'urgente'
  ];

  constructor(
    private fb: FormBuilder,
    private tramiteService: TramiteService,
    private departamentoService: DepartamentoService,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarDepartamentos();
    this.cargarClientes();
    this.cargarUsuarioActualDesdeServicio();
  }

  inicializarFormulario(): void {
    this.formulario = this.fb.group({
      referencia: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(255)]],
      cliente: ['', Validators.required],
      asunto: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(1000)]],
      departamento: [''],
      ruta_departamentos: [[]],
      prioridad: ['normal', Validators.required]
    });
  }

  cargarDepartamentos(): void {
    this.departamentoService.listar(true).subscribe({
      next: (data) => {
        this.departamentos = data || [];
      },
      error: (err) => {
        console.error('Error al cargar departamentos', err);
        this.departamentos = [];
      }
    });
  }

  cargarClientes(): void {
    this.usuarioService.obtenerUsuarios().subscribe({
      next: (data) => {
        this.clientes = (data || []).filter((u) => u.rol === 'cliente');
      },
      error: (err) => {
        console.error('Error al cargar clientes', err);
        this.clientes = [];
      }
    });
  }

  cargarUsuarioActualDesdeServicio(): void {
    this.usuarioService.obtenerUsuarioActual().subscribe({
      next: (usuario) => {
        this.usuarioActual = usuario;
        this.cargarTramites();
      },
      error: (err) => {
        console.error('Error al cargar usuario actual', err);
        this.error = 'No se pudo cargar el usuario actual';
      }
    });
  }

  cargarTramites(): void {
    this.cargando = true;
    this.limpiarMensajes(false);

    if (this.esFuncionario() && this.usuarioActual?.departamento) {
      this.tramiteService.listarPorDepartamento(this.usuarioActual.departamento).subscribe({
        next: (data) => {
          this.tramites = data || [];
          this.cargando = false;
        },
        error: () => {
          this.error = 'Error al cargar trámites';
          this.cargando = false;
        }
      });
      return;
    }

    if (this.esCliente() && this.usuarioActual?.nombre) {
      this.tramiteService.listarPorCliente(this.usuarioActual.nombre).subscribe({
        next: (data) => {
          this.tramites = data || [];
          this.cargando = false;
        },
        error: () => {
          this.error = 'Error al cargar trámites';
          this.cargando = false;
        }
      });
      return;
    }

    this.tramiteService.listar(this.filtroEstado || undefined).subscribe({
      next: (data) => {
        this.tramites = data || [];
        this.cargando = false;
      },
      error: () => {
        this.error = 'Error al cargar trámites';
        this.cargando = false;
      }
    });
  }

  esAdmin(): boolean {
    return this.usuarioActual?.rol === 'admin';
  }

  esFuncionario(): boolean {
    return this.usuarioActual?.rol === 'funcionario';
  }

  esCliente(): boolean {
    return this.usuarioActual?.rol === 'cliente';
  }

  puedeCrear(): boolean {
    return this.esAdmin();
  }

  puedeEditarEliminar(): boolean {
    return this.esAdmin();
  }

  puedeGestionarEstado(tramite: Tramite): boolean {
    if (!this.esFuncionario() || !this.usuarioActual?.departamento) {
      return false;
    }

    if (!tramite.id) {
      return false;
    }

    if (tramite.departamento !== this.usuarioActual.departamento) {
      return false;
    }

    return !['completado', 'rechazado'].includes(tramite.estado);
  }

  abrirFormulario(): void {
    if (!this.puedeCrear()) {
      return;
    }

    this.mostrarFormulario = true;
    this.editando = false;
    this.tramiteEditandoId = null;
    this.rutaSeleccionada = [];
    this.departamentoDisponibleSeleccionado = '';

    this.formulario.reset({
      referencia: '',
      cliente: '',
      asunto: '',
      departamento: '',
      ruta_departamentos: [],
      prioridad: 'normal'
    });

    this.error = null;
    this.exito = null;
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.rutaSeleccionada = [];
    this.departamentoDisponibleSeleccionado = '';

    this.formulario.reset({
      referencia: '',
      cliente: '',
      asunto: '',
      departamento: '',
      ruta_departamentos: [],
      prioridad: 'normal'
    });

    this.error = null;
    this.exito = null;
  }

  agregarDepartamentoARuta(): void {
    const depto = (this.departamentoDisponibleSeleccionado || '').trim();

    if (!depto) {
      return;
    }

    if (this.rutaSeleccionada.includes(depto)) {
      this.error = 'Ese departamento ya fue agregado a la ruta';
      return;
    }

    this.rutaSeleccionada.push(depto);
    this.departamentoDisponibleSeleccionado = '';
    this.sincronizarRutaEnFormulario();
    this.error = null;
  }

  quitarDepartamentoDeRuta(index: number): void {
    if (index < 0 || index >= this.rutaSeleccionada.length) {
      return;
    }

    this.rutaSeleccionada.splice(index, 1);
    this.sincronizarRutaEnFormulario();
  }

  moverDepartamentoArriba(index: number): void {
    if (index <= 0) {
      return;
    }

    [this.rutaSeleccionada[index - 1], this.rutaSeleccionada[index]] = [
      this.rutaSeleccionada[index],
      this.rutaSeleccionada[index - 1]
    ];

    this.sincronizarRutaEnFormulario();
  }

  moverDepartamentoAbajo(index: number): void {
    if (index < 0 || index >= this.rutaSeleccionada.length - 1) {
      return;
    }

    [this.rutaSeleccionada[index], this.rutaSeleccionada[index + 1]] = [
      this.rutaSeleccionada[index + 1],
      this.rutaSeleccionada[index]
    ];

    this.sincronizarRutaEnFormulario();
  }

  sincronizarRutaEnFormulario(): void {
    const departamentoInicial = this.rutaSeleccionada.length > 0 ? this.rutaSeleccionada[0] : '';

    this.formulario.patchValue(
      {
        ruta_departamentos: [...this.rutaSeleccionada],
        departamento: departamentoInicial
      },
      { emitEvent: false }
    );
  }

  guardar(): void {
    if (!this.puedeCrear()) {
      return;
    }

    if (this.formulario.invalid) {
      this.error = 'Por favor completa los campos requeridos';
      this.formulario.markAllAsTouched();
      return;
    }

    if (this.rutaSeleccionada.length === 0) {
      this.error = 'Debes agregar al menos un departamento a la ruta del trámite';
      return;
    }

    this.cargando = true;
    this.limpiarMensajes(false);

    const datosFormulario = this.formulario.getRawValue();

    const datos: Tramite = {
      ...datosFormulario,
      departamento: this.rutaSeleccionada[0],
      ruta_departamentos: [...this.rutaSeleccionada]
    };

    if (this.editando && this.tramiteEditandoId) {
      this.tramiteService.actualizar(this.tramiteEditandoId, datos).subscribe({
        next: () => {
          this.exito = 'Trámite actualizado exitosamente';
          this.cargando = false;
          this.cerrarFormulario();
          this.cargarTramites();
        },
        error: (err) => {
          this.error = err?.error?.detail || 'Error al actualizar trámite';
          this.cargando = false;
        }
      });
    } else {
      this.tramiteService.crear(datos).subscribe({
        next: () => {
          this.exito = 'Trámite creado exitosamente';
          this.cargando = false;
          this.cerrarFormulario();
          this.cargarTramites();
        },
        error: (err) => {
          this.error = err?.error?.detail || 'Error al crear trámite';
          this.cargando = false;
        }
      });
    }
  }

  editar(tramite: Tramite): void {
    if (!this.puedeEditarEliminar()) {
      return;
    }

    this.editando = true;
    this.tramiteEditandoId = tramite.id || null;
    this.rutaSeleccionada = [...(tramite.ruta_departamentos || [])];
    this.departamentoDisponibleSeleccionado = '';

    this.formulario.patchValue({
      referencia: tramite.referencia,
      cliente: tramite.cliente,
      asunto: tramite.asunto,
      departamento: tramite.departamento || '',
      ruta_departamentos: [...this.rutaSeleccionada],
      prioridad: tramite.prioridad
    });

    this.mostrarFormulario = true;
    this.error = null;
    this.exito = null;
  }

  eliminar(id: string): void {
    if (!this.puedeEditarEliminar()) {
      return;
    }

    if (!confirm('¿Estás seguro de que deseas eliminar este trámite?')) {
      return;
    }

    this.cargando = true;
    this.limpiarMensajes(false);

    this.tramiteService.eliminar(id).subscribe({
      next: () => {
        this.exito = 'Trámite eliminado exitosamente';
        this.cargando = false;
        this.cargarTramites();
      },
      error: () => {
        this.error = 'Error al eliminar trámite';
        this.cargando = false;
      }
    });
  }

  cambiarEstado(tramite: Tramite, nuevoEstado: Tramite['estado']): void {
    if (!tramite.id || !this.puedeGestionarEstado(tramite)) {
      return;
    }

    const textos: Record<Tramite['estado'], string> = {
      solicitado: 'solicitado',
      en_proceso: 'en proceso',
      aceptado: 'aceptado',
      completado: 'completado',
      rechazado: 'rechazado',
      observado: 'observado'
    };

    if (!confirm(`¿Deseas marcar el trámite ${tramite.referencia} como ${textos[nuevoEstado]}?`)) {
      return;
    }

    this.cargando = true;
    this.limpiarMensajes(false);

    this.tramiteService.cambiarEstado(tramite.id, nuevoEstado).subscribe({
      next: () => {
        const siguiente = this.obtenerDepartamentoSiguiente(tramite);

        if (nuevoEstado === 'aceptado') {
          this.exito =
            siguiente !== 'Ninguno'
              ? `Trámite aceptado y enviado a ${siguiente}`
              : 'Trámite aceptado y completado';
        } else if (nuevoEstado === 'observado') {
          this.exito = 'Trámite marcado como observado';
        } else if (nuevoEstado === 'rechazado') {
          this.exito = 'Trámite rechazado';
        } else {
          this.exito = `Estado cambió a ${nuevoEstado}`;
        }

        this.cargando = false;
        this.cargarTramites();
      },
      error: (err) => {
        this.error = err?.error?.detail || 'Error al cambiar estado';
        this.cargando = false;
      }
    });
  }

  aplicarFiltros(): void {
    this.cargarTramites();
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.filtroEstado = '';
    this.cargarTramites();
  }

  filtrarTramites(): Tramite[] {
    let filtrados = [...this.tramites];

    if (this.busqueda.trim()) {
      const termino = this.busqueda.toLowerCase().trim();
      filtrados = filtrados.filter((t) =>
        t.referencia.toLowerCase().includes(termino) ||
        t.cliente.toLowerCase().includes(termino) ||
        t.asunto.toLowerCase().includes(termino) ||
        (t.departamento || '').toLowerCase().includes(termino)
      );
    }

    if (this.filtroEstado) {
      filtrados = filtrados.filter((t) => t.estado === this.filtroEstado);
    }

    return filtrados;
  }

  obtenerColorEstado(estado: string): string {
    const colores: Record<string, string> = {
      solicitado: '#3498db',
      en_proceso: '#f39c12',
      aceptado: '#27ae60',
      completado: '#27ae60',
      rechazado: '#e74c3c',
      observado: '#d35400'
    };
    return colores[estado] || '#95a5a6';
  }

  obtenerColorPrioridad(prioridad: string): string {
    const colores: Record<string, string> = {
      baja: '#bdc3c7',
      normal: '#3498db',
      alta: '#f39c12',
      urgente: '#e74c3c'
    };
    return colores[prioridad] || '#95a5a6';
  }

  obtenerRutaTexto(tramite: Tramite): string {
    return tramite.ruta_departamentos?.length
      ? tramite.ruta_departamentos.join(' → ')
      : 'Sin ruta definida';
  }

  obtenerDepartamentoSiguiente(tramite: Tramite): string {
    const ruta = tramite.ruta_departamentos || [];
    const actual = tramite.departamento;
    const indice = actual ? ruta.indexOf(actual) : -1;

    if (indice >= 0 && indice < ruta.length - 1) {
      return ruta[indice + 1];
    }

    return 'Ninguno';
  }

  trackByTramite(_: number, tramite: Tramite): string {
    return tramite.id || tramite.referencia;
  }

  limpiarMensajes(limpiarExito = true): void {
    this.error = null;
    if (limpiarExito) {
      this.exito = null;
    }
  }
}