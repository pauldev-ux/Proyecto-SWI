import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  formularioLogin!: FormGroup;
  formularioRegistro!: FormGroup;
  cargando = false;
  error: string | null = null;
  mostrarRegistro = false;

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.inicializarFormularios();
  }

  inicializarFormularios(): void {
    // Formulario de login
    this.formularioLogin = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      contraseña: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Formulario de registro
    this.formularioRegistro = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      contraseña: ['', [Validators.required, Validators.minLength(6)]],
      confirmarContraseña: ['', [Validators.required]]
    });
  }

  deshabilitarFormularios(): void {
    this.formularioLogin.disable();
    this.formularioRegistro.disable();
  }

  habilitarFormularios(): void {
    this.formularioLogin.enable();
    this.formularioRegistro.enable();
  }

  ingresar(): void {
    if (this.formularioLogin.invalid) {
      this.error = 'Por favor completa todos los campos correctamente';
      return;
    }

    this.cargando = true;
    this.error = null;
    this.deshabilitarFormularios();

    

    const { username, contraseña } = this.formularioLogin.getRawValue();

    this.usuarioService.login(username, contraseña).subscribe({
      next: () => {
        //this.router.navigate(['/dashboard']);
        this.redirigirSegunRol();
      },
      error: (err) => {
        this.cargando = false;
        this.habilitarFormularios();
        this.error = err.error?.detail || 'Error al iniciar sesión';
      }
    });
  }

  registrarse(): void {
    if (this.formularioRegistro.invalid) {
      this.error = 'Por favor completa todos los campos correctamente';
      return;
    }

    if (this.formularioRegistro.get('contraseña')?.value !== this.formularioRegistro.get('confirmarContraseña')?.value) {
      this.error = 'Las contraseñas no coinciden';
      return;
    }

    this.cargando = true;
    this.error = null;
    this.deshabilitarFormularios();

    const { nombre, username, contraseña } = this.formularioRegistro.getRawValue();

    this.usuarioService.registrar(username, nombre, contraseña).subscribe({
      next: () => {
        this.error = null;
        this.mostrarRegistro = false;
        this.habilitarFormularios();
        this.formularioLogin.reset();
        this.formularioLogin.get('username')?.setValue(username);
        // Auto login después del registro
        this.usuarioService.login(username, contraseña).subscribe({
          next: () => {
            //this.router.navigate(['/dashboard']);
            this.redirigirSegunRol();
          },
          error: () => {
            this.cargando = false;
            // Si falla el auto-login, mostrar mensaje para que ingrese manualmente
            this.error = 'Registro exitoso. Por favor inicia sesión';
          }
        });
      },
      error: (err) => {
        this.cargando = false;
        this.habilitarFormularios();
        this.error = err.error?.detail || 'Error al registrarse. Intenta con otro usuario';
      }
    });
  }

  cambiarModo(): void {
    this.mostrarRegistro = !this.mostrarRegistro;
    this.error = null;
    this.cargando = false;
    if (!this.mostrarRegistro) {
      this.formularioLogin.reset();
    } else {
      this.formularioRegistro.reset();
    }
  }

  private redirigirSegunRol(): void {
  const usuario = this.usuarioService.obtenerUsuarioActualValue();

  if (usuario?.rol === 'cliente') {
    this.router.navigate(['/analytics']);
    return;
  }

  this.router.navigate(['/dashboard']);
}
}
