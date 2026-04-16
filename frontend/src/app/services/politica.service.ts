import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PoliticaNegocio } from '../models';

@Injectable({
  providedIn: 'root'
})
export class PoliticaService {
  private apiUrl = 'http://localhost:8000/api/v1/politicas';

  constructor(private http: HttpClient) {}

  crearPolitica(politica: PoliticaNegocio, creadoPor: string): Observable<PoliticaNegocio> {
    return this.http.post<PoliticaNegocio>(this.apiUrl, politica, {
      params: { creado_por: creadoPor }
    });
  }

  obtenerPolitica(id: string): Observable<PoliticaNegocio> {
    return this.http.get<PoliticaNegocio>(`${this.apiUrl}/${id}`);
  }

  listarPoliticas(creadoPor?: string): Observable<PoliticaNegocio[]> {
    let params = {};
    if (creadoPor) {
      params = { creado_por: creadoPor };
    }
    return this.http.get<PoliticaNegocio[]>(this.apiUrl, { params });
  }

  actualizarPolitica(id: string, politica: Partial<PoliticaNegocio>): Observable<PoliticaNegocio> {
    return this.http.put<PoliticaNegocio>(`${this.apiUrl}/${id}`, politica);
  }

  activarPolitica(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/activar`, {});
  }

  eliminarPolitica(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  agregarColaborador(politicaId: string, usuarioId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${politicaId}/colaborador`, {
      usuario_id: usuarioId
    });
  }
}
