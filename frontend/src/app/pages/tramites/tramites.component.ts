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
  filtrosAbiertos = false;
  usuarioActual: Usuario | null = null;

  estados = ['solicitado', 'en_proceso', 'aceptado', 'completado', 'rechazado'];
  prioridades = ['baja', 'normal', 'alta', 'urgente'];

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
    this.cargarTramites();
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
        this.departamentos = data;
      },
      error: (err) => {
        console.error('Error al cargar departamentos', err);
      }
    });
  }

  cargarClientes(): void {
    this.usuarioService.obtenerUsuarios().subscribe({
      next: (data) => {
        this.clientes = (data || []).filter(u => u.rol === 'cliente');
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
        this.cargarTramites(); // Recargar con filtro de usuario
      },
      error: (err) => {
        console.error('Error al cargar usuario actual', err);
      }
    });
  }

  cargarTramites(): void {
    this.cargando = true;
    let departamentoFiltro: string | undefined;

    // Aplicar filtros según el rol del usuario
    if (this.usuarioActual) {
      if (this.usuarioActual.rol === 'funcionario' && this.usuarioActual.departamento) {
        // Funcionarios solo ven trámites de su departamento
        departamentoFiltro = this.usuarioActual.departamento;
      } else if (this.usuarioActual.rol === 'cliente') {
        // Clientes solo ven sus propios trámites
        this.tramiteService.listarPorCliente(this.usuarioActual.nombre).subscribe({
          next: (data) => {
            this.tramites = data;
            this.cargando = false;
          },
          error: (err) => {
            this.error = 'Error al cargar trámites';
            this.cargando = false;
          }
        });
        return;
      }
    }

    this.tramiteService.listar(this.filtroEstado || undefined, departamentoFiltro).subscribe({
      next: (data) => {
        this.tramites = data;
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error al cargar trámites';
        this.cargando = false;
      }
    });
  }

  abrirFormulario(): void {
    this.mostrarFormulario = true;
    this.editando = false;
    this.tramiteEditandoId = null;
    this.formulario.reset({ prioridad: 'normal', ruta_departamentos: [] });
    this.error = null;
    this.exito = null;
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.formulario.reset({ prioridad: 'normal' });
    this.error = null;
    this.exito = null;
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.error = 'Por favor completa los campos requeridos';
      return;
    }

    this.cargando = true;
    const datos = this.formulario.value;

    if (this.editando && this.tramiteEditandoId) {
      this.tramiteService.actualizar(this.tramiteEditandoId, datos).subscribe({
        next: () => {
          this.exito = 'Trámite actualizado exitosamente';
          this.cargando = false;
          this.cerrarFormulario();
          this.cargarTramites();
        },
        error: (err) => {
          this.error = err.error?.detail || 'Error al actualizar trámite';
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
          this.error = err.error?.detail || 'Error al crear trámite';
          this.cargando = false;
        }
      });
    }
  }

  editar(tramite: Tramite): void {
    this.editando = true;
    this.tramiteEditandoId = tramite.id || null;
    this.formulario.patchValue({
      referencia: tramite.referencia,
      cliente: tramite.cliente,
      asunto: tramite.asunto,
      departamento: tramite.departamento,
      ruta_departamentos: tramite.ruta_departamentos || [],
      prioridad: tramite.prioridad
    });
    this.mostrarFormulario = true;
    this.error = null;
    this.exito = null;
  }

  eliminar(id: string): void {
    if (confirm('¿Estás seguro de que deseas eliminar este trámite?')) {
      this.cargando = true;
      this.tramiteService.eliminar(id).subscribe({
        next: () => {
          this.exito = 'Trámite eliminado exitosamente';
          this.cargando = false;
          this.cargarTramites();
        },
        error: (err) => {
          this.error = 'Error al eliminar trámite';
          this.cargando = false;
        }
      });
    }
  }

  cambiarEstado(tramite: Tramite, nuevoEstado: string): void {
    this.cargando = true;
    this.tramiteService.cambiarEstado(tramite.id!, nuevoEstado).subscribe({
      next: () => {
        this.exito = `Estado cambió a ${nuevoEstado}`;
        this.cargando = false;
        this.cargarTramites();
      },
      error: (err) => {
        this.error = 'Error al cambiar estado';
        this.cargando = false;
      }
    });
  }

  aplicarFiltros(): void {
    this.cargarTramites();
    this.filtrosAbiertos = false;
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.filtroEstado = '';
    this.cargarTramites();
  }

  filtrarTramites(): Tramite[] {
    let filtrados = this.tramites;

    if (this.busqueda) {
      const termino = this.busqueda.toLowerCase();
      filtrados = filtrados.filter(t =>
        t.referencia.toLowerCase().includes(termino) ||
        t.cliente.toLowerCase().includes(termino) ||
        t.asunto.toLowerCase().includes(termino)
      );
    }

    return filtrados;
  }

  obtenerColorEstado(estado: string): string {
    const colores: { [key: string]: string } = {
      'solicitado': '#3498db',
      'en_proceso': '#f39c12',
      'aceptado': '#27ae60',
      'completado': '#27ae60',
      'rechazado': '#e74c3c'
    };
    return colores[estado] || '#95a5a6';
  }

  obtenerColorPrioridad(prioridad: string): string {
    const colores: { [key: string]: string } = {
      'baja': '#bdc3c7',
      'normal': '#3498db',
      'alta': '#f39c12',
      'urgente': '#e74c3c'
    };
    return colores[prioridad] || '#95a5a6';
  }

  limpiarMensajes(): void {
    this.error = null;
    this.exito = null;
  }
}

