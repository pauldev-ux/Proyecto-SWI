import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DepartamentoService } from '../../services/departamento.service';
import { Departamento } from '../../models';

@Component({
  selector: 'app-departamentos',
  templateUrl: './departamentos.component.html',
  styleUrls: ['./departamentos.component.css']
})
export class DepartamentosComponent implements OnInit {
  departamentos: Departamento[] = [];
  formulario!: FormGroup;
  editando = false;
  cargando = false;
  error: string | null = null;
  exito: string | null = null;
  mostrarFormulario = false;
  departamentoEditandoId: string | null = null;
  busqueda = '';
  mostrarInactivos = false;

  constructor(
    private fb: FormBuilder,
    private departamentoService: DepartamentoService
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarDepartamentos();
  }

  inicializarFormulario(): void {
    this.formulario = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(1)]],
      codigo: ['', [Validators.minLength(1), Validators.maxLength(50)]]
    });
  }

  cargarDepartamentos(): void {
    this.cargando = true;
    this.departamentoService.listar(false).subscribe({
      next: (data) => {
        this.departamentos = data;
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error al cargar departamentos';
        this.cargando = false;
      }
    });
  }

  abrirFormulario(): void {
    this.mostrarFormulario = true;
    this.editando = false;
    this.departamentoEditandoId = null;
    this.formulario.reset();
    this.error = null;
    this.exito = null;
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.formulario.reset();
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

    if (this.editando && this.departamentoEditandoId) {
      this.departamentoService.actualizar(this.departamentoEditandoId, datos).subscribe({
        next: () => {
          this.exito = 'Departamento actualizado exitosamente';
          this.cargando = false;
          this.cerrarFormulario();
          this.cargarDepartamentos();
        },
        error: (err) => {
          this.error = err.error?.detail || 'Error al actualizar departamento';
          this.cargando = false;
        }
      });
    } else {
      this.departamentoService.crear(datos).subscribe({
        next: () => {
          this.exito = 'Departamento creado exitosamente';
          this.cargando = false;
          this.cerrarFormulario();
          this.cargarDepartamentos();
        },
        error: (err) => {
          this.error = err.error?.detail || 'Error al crear departamento';
          this.cargando = false;
        }
      });
    }
  }

  editar(departamento: Departamento): void {
    this.editando = true;
    this.departamentoEditandoId = departamento.id || null;
    this.formulario.patchValue({
      nombre: departamento.nombre,
      codigo: departamento.codigo
    });
    this.mostrarFormulario = true;
    this.error = null;
    this.exito = null;
  }

  eliminar(id: string): void {
    if (confirm('¿Estás seguro de que deseas eliminar este departamento?')) {
      this.cargando = true;
      this.departamentoService.eliminar(id).subscribe({
        next: () => {
          this.exito = 'Departamento eliminado exitosamente';
          this.cargando = false;
          this.cargarDepartamentos();
        },
        error: (err) => {
          this.error = 'Error al eliminar departamento';
          this.cargando = false;
        }
      });
    }
  }

  restaurar(id: string): void {
    if (confirm('¿Deseas restaurar este departamento?')) {
      this.cargando = true;
      this.departamentoService.restaurar(id).subscribe({
        next: () => {
          this.exito = 'Departamento restaurado exitosamente';
          this.cargando = false;
          this.cargarDepartamentos();
        },
        error: (err) => {
          this.error = 'Error al restaurar departamento';
          this.cargando = false;
        }
      });
    }
  }

  filtrarDepartamentos(): Departamento[] {
    let filtrados = this.departamentos;

    if (!this.mostrarInactivos) {
      filtrados = filtrados.filter(d => d.activo);
    }

    if (this.busqueda) {
      const termino = this.busqueda.toLowerCase();
      filtrados = filtrados.filter(d =>
        d.nombre.toLowerCase().includes(termino) ||
        d.codigo?.toLowerCase().includes(termino)
      );
    }

    return filtrados;
  }

  limpiarMensajes(): void {
    this.error = null;
    this.exito = null;
  }
}
