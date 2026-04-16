import { Component, OnInit } from '@angular/core';
import { UsuarioService } from '../../services/usuario.service';
import { DashboardService, EstadisticasDashboard } from '../../services/dashboard.service';
import { Usuario } from '../../models';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  usuarioActual: Usuario | null = null;
  estadisticas: EstadisticasDashboard | null = null;
  cargando = true;
  error: string | null = null;

  constructor(
    private usuarioService: UsuarioService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    this.usuarioService.obtenerUsuarioActual().subscribe(usuario => {
      this.usuarioActual = usuario;
    });

    this.cargarEstadisticas();
  }

  cargarEstadisticas(): void {
    this.cargando = true;
    this.error = null;
    this.dashboardService.obtenerEstadisticas().subscribe({
      next: (data) => {
        this.estadisticas = data;
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error al cargar estadísticas';
        this.cargando = false;
        console.error('Error:', err);
      }
    });
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

  logout(): void {
    this.usuarioService.logout();
  }
}

