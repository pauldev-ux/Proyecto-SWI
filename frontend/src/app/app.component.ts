import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UsuarioService } from './services/usuario.service';
import { Usuario } from './models';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'WorkflowSW1';
  usuarioActual: Usuario | null = null;
  sidebarAbierto = true;

  constructor(
    private usuarioService: UsuarioService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.usuarioService.obtenerUsuarioActual().subscribe(usuario => {
      this.usuarioActual = usuario;
    });
  }

  estaAutenticado(): boolean {
    return !!this.usuarioActual;
  }

  obtenerRolLabel(): string {
    if (!this.usuarioActual) {
      return '';
    }

    switch (this.usuarioActual.rol) {
      case 'admin':
        return 'Administrador';
      case 'funcionario':
        return 'Funcionario';
      case 'cliente':
        return 'Cliente';
      default:
        return this.usuarioActual.rol;
    }
  }

  puedeVerDashboard(): boolean {
    return this.usuarioActual?.rol === 'admin' || this.usuarioActual?.rol === 'funcionario';
  }

  puedeVerTramites(): boolean {
    return this.usuarioActual?.rol === 'admin' || this.usuarioActual?.rol === 'funcionario';
  }

  puedeVerMonitor(): boolean {
    return this.usuarioActual?.rol === 'admin' || this.usuarioActual?.rol === 'funcionario';
  }

  puedeVerAnalytics(): boolean {
    return this.usuarioActual?.rol === 'admin'
      || this.usuarioActual?.rol === 'funcionario'
      || this.usuarioActual?.rol === 'cliente';
  }

  puedeVerDepartamentos(): boolean {
    return this.usuarioActual?.rol === 'admin';
  }

  puedeVerAsistente(): boolean {
    return this.usuarioActual?.rol === 'admin';
  }

  puedeVerUsuarios(): boolean {
    return this.usuarioActual?.rol === 'admin';
  }

  toggleSidebar(): void {
    this.sidebarAbierto = !this.sidebarAbierto;
  }

  logout(): void {
    this.usuarioService.logout();
    this.router.navigate(['/login']);
  }
}