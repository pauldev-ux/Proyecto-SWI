import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tramite } from '../models';

@Injectable({
  providedIn: 'root'
})
export class TramiteService {
  private apiUrl = 'http://localhost:8000/api/v1/tramites';

  constructor(private http: HttpClient) {}

  crear(tramite: Tramite): Observable<Tramite> {
    return this.http.post<Tramite>(this.apiUrl, tramite);
  }

  listar(estado?: string, departamento?: string): Observable<Tramite[]> {
    let params: any = {};
    if (estado) params.estado = estado;
    if (departamento) params.departamento = departamento;
    
    return this.http.get<Tramite[]>(this.apiUrl, { params });
  }

  obtenerPorId(id: string): Observable<Tramite> {
    return this.http.get<Tramite>(`${this.apiUrl}/${id}`);
  }

  actualizar(id: string, tramite: Partial<Tramite>): Observable<Tramite> {
    return this.http.put<Tramite>(`${this.apiUrl}/${id}`, tramite);
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  cambiarEstado(id: string, nuevoEstado: string): Observable<Tramite> {
    return this.http.put<Tramite>(`${this.apiUrl}/${id}/estado/${nuevoEstado}`, {});
  }

  listarPorCliente(cliente: string): Observable<Tramite[]> {
    return this.http.get<Tramite[]>(`${this.apiUrl}/cliente/${cliente}`);
  }

  obtenerPorReferencia(referencia: string): Observable<Tramite> {
    return this.http.get<Tramite>(`${this.apiUrl}/referencia/${referencia}`);
  }

  obtenerFlujoPorReferencia(referencia: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/referencia/${referencia}/flujo`);
  }

  listarPorDepartamento(departamento: string): Observable<Tramite[]> {
    return this.http.get<Tramite[]>(`${this.apiUrl}/departamento/${departamento}`);
  }
}
