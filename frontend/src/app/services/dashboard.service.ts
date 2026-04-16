import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface EstadisticasDashboard {
  estadoGeneral: {
    totalTramites: number;
    departamentosActivos: number;
    usuariosTotales: number;
    tramitesEsteMes: number;
  };
  tramitesPorEstado: { [key: string]: number };
  tramitesPorDepartamento: Array<{ departamento: string; cantidad: number }>;
  ultimosTramites: Array<{
    id: string;
    referencia: string;
    cliente: string;
    estado: string;
    prioridad: string;
    fechaCreacion: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = 'http://localhost:8000/api/v1/dashboard';

  constructor(private http: HttpClient) {}

  obtenerEstadisticas(): Observable<EstadisticasDashboard> {
    return this.http.get<EstadisticasDashboard>(`${this.apiUrl}/estadisticas`);
  }
}
