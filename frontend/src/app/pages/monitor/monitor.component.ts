import { Component, OnInit } from '@angular/core';
import { UsuarioService } from '../../services/usuario.service';
import { Usuario } from '../../models';

interface MonitorStats {
  label: string;
  value: number;
  icon: string;
  color: string;
  trend: string;
}

interface SystemHealth {
  cpu: number;
  memoria: number;
  database: number;
  api: number;
}

@Component({
  selector: 'app-monitor',
  templateUrl: './monitor.component.html',
  styleUrls: ['./monitor.component.css']
})
export class MonitorComponent implements OnInit {
  usuarioActual: Usuario | null = null;
  
  stats: MonitorStats[] = [
    { label: 'Trámites Activos', value: 5, icon: '⏳', color: '#f39c12', trend: '+2 esta hora' },
    { label: 'Procesados Hoy', value: 12, icon: '✅', color: '#27ae60', trend: '+5 desde ayer' },
    { label: 'En Cola', value: 3, icon: '📋', color: '#3498db', trend: '-1 hace 30min' },
    { label: 'Errores', value: 0, icon: '⚠️', color: '#e74c3c', trend: 'Sin problemas' }
  ];

  systemHealth: SystemHealth = {
    cpu: 45,
    memoria: 62,
    database: 35,
    api: 98
  };

  recentActivities = [
    { id: 1, tipo: 'CREACIÓN', descripcion: 'Nueva política creada: Onboarding', usuario: 'Admin', tiempo: 'hace 5 min' },
    { id: 2, tipo: 'COMPLETADO', descripcion: 'Trámite T-001 completado exitosamente', usuario: 'Sistema', tiempo: 'hace 12 min' },
    { id: 3, tipo: 'ACTUALIZACIÓN', descripcion: 'Política "Compras" actualizada', usuario: 'Gestor', tiempo: 'hace 30 min' },
    { id: 4, tipo: 'ERROR', descripcion: 'Error en sincronización de datos', usuario: 'Sistema', tiempo: 'hace 45 min' },
    { id: 5, tipo: 'CREACIÓN', descripcion: 'Nuevo usuario registrado', usuario: 'Admin', tiempo: 'hace 1 hora' }
  ];

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    this.usuarioService.obtenerUsuarioActual().subscribe(usuario => {
      this.usuarioActual = usuario;
    });
  }

  getHealthColor(value: number): string {
    if (value >= 80) return '#27ae60';
    if (value >= 60) return '#f39c12';
    return '#e74c3c';
  }

  getActivityTypeClass(tipo: string): string {
    return 'activity-badge-' + tipo.toLowerCase();
  }
}
