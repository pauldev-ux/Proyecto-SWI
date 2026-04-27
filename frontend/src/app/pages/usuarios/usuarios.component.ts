import { Component, OnInit } from '@angular/core';
import { UsuariosService, Usuario, UsuarioCreate, UsuarioUpdate } from '../../services/usuarios.service';
import { DepartamentoService } from '../../services/departamento.service';
import { Departamento } from '../../models';

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  departamentos: Departamento[] = [];
  cargando = false;
  error: string | null = null;
  
  // Para modal de formulario
  mostrarFormulario = false;
  editandoId: string | null = null;
  formulario = {
    username: '',
    nombre: '',
    contrasena: '',
    rol: 'funcionario',
    departamento: ''
  };

  // Para delete
  usuarioAEliminar: Usuario | null = null;
  mostrarConfirmacion = false;

  roles = [
    { valor: 'admin', label: 'Administrador' },
    { valor: 'cliente', label: 'Cliente' },
    { valor: 'funcionario', label: 'Funcionario' }
  ];

  constructor(
    private usuariosService: UsuariosService,
    private departamentoService: DepartamentoService
  ) { }

  ngOnInit(): void {
    this.cargarUsuarios();
    this.cargarDepartamentos();
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

  onRolChange(): void {
    if (this.formulario.rol !== 'funcionario') {
      this.formulario.departamento = '';
    }
  }

  cargarUsuarios(): void {
    this.cargando = true;
    this.error = null;
    this.usuariosService.listarUsuarios().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error al cargar usuarios: ' + (err.error?.detail || err.message);
        this.cargando = false;
      }
    });
  }

  abrirFormularioCrear(): void {
    this.editandoId = null;
    this.formulario = {
      username: '',
      nombre: '',
      contrasena: '',
      rol: 'funcionario',
      departamento: ''
    };
    this.mostrarFormulario = true;
  }

  abrirFormularioEditar(usuario: Usuario): void {
    this.editandoId = usuario.id!;
    this.formulario = {
      username: usuario.username,
      nombre: usuario.nombre,
      contrasena: '', // Campo vacío para edición
      rol: usuario.rol,
      departamento: usuario.departamento || ''
    };
    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.editandoId = null;
    this.error = null;
  }

  guardarUsuario(): void {
    if (!this.formulario.nombre || !this.formulario.username) {
      this.error = 'Nombre y usuario son requeridos';
      return;
    }

    if (this.formulario.rol === 'funcionario' && !this.formulario.departamento) {
      this.error = 'El departamento es obligatorio para funcionarios';
      return;
    }

    if (this.editandoId) {
      this.actualizarUsuario();
    } else {
      this.crearUsuario();
    }
  }

  crearUsuario(): void {
    if (!this.formulario.contrasena) {
      this.error = 'La contraseña es requerida para crear un usuario';
      return;
    }

    const nuevoUsuario: UsuarioCreate = {
      username: this.formulario.username,
      nombre: this.formulario.nombre,
      contraseña: this.formulario.contrasena,
      rol: this.formulario.rol,
      departamento: this.formulario.departamento || undefined
    };

    this.cargando = true;
    this.error = null;
    this.usuariosService.crearUsuario(nuevoUsuario).subscribe({
      next: () => {
        this.cargarUsuarios();
        this.cerrarFormulario();
      },
      error: (err) => {
        this.error = 'Error al crear usuario: ' + (err.error?.detail || err.message);
        this.cargando = false;
      }
    });
  }

  actualizarUsuario(): void {
    const datosActualizar: UsuarioUpdate = {
      username: this.formulario.username,
      nombre: this.formulario.nombre,
      rol: this.formulario.rol,
      departamento: this.formulario.departamento || undefined,
      activo: true
    };

    this.cargando = true;
    this.error = null;
    this.usuariosService.actualizarUsuario(this.editandoId!, datosActualizar).subscribe({
      next: () => {
        this.cargarUsuarios();
        this.cerrarFormulario();
      },
      error: (err) => {
        this.error = 'Error al actualizar usuario: ' + (err.error?.detail || err.message);
        this.cargando = false;
      }
    });
  }

  abrirConfirmacionEliminar(usuario: Usuario): void {
    this.usuarioAEliminar = usuario;
    this.mostrarConfirmacion = true;
  }

  cerrarConfirmacion(): void {
    this.usuarioAEliminar = null;
    this.mostrarConfirmacion = false;
  }

  confirmarEliminar(): void {
    if (!this.usuarioAEliminar) return;

    this.cargando = true;
    this.error = null;
    this.usuariosService.eliminarUsuario(this.usuarioAEliminar.id!).subscribe({
      next: () => {
        this.cargarUsuarios();
        this.cerrarConfirmacion();
      },
      error: (err) => {
        this.error = 'Error al eliminar usuario: ' + (err.error?.detail || err.message);
        this.cargando = false;
      }
    });
  }

  obtenerRolLabel(rol: string): string {
    const rolEncontrado = this.roles.find(r => r.valor === rol);
    return rolEncontrado ? rolEncontrado.label : rol;
  }

  obtenerColorRol(rol: string): string {
    switch (rol) {
      case 'admin':
        return '#e74c3c';
      case 'cliente':
        return '#3498db';
      case 'funcionario':
        return '#27ae60';
      default:
        return '#95a5a6';
    }
  }
}
