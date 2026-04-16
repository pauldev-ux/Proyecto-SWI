import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Departamento } from '../models';

@Injectable({
  providedIn: 'root'
})
export class DepartamentoService {
  private apiUrl = 'http://localhost:8000/api/v1/departamentos';

  constructor(private http: HttpClient) {}

  crear(departamento: Departamento): Observable<Departamento> {
    return this.http.post<Departamento>(this.apiUrl, departamento);
  }

  listar(activosSolo: boolean = false): Observable<Departamento[]> {
    return this.http.get<Departamento[]>(this.apiUrl, {
      params: { activos_solo: activosSolo.toString() }
    });
  }

  obtenerPorId(id: string): Observable<Departamento> {
    return this.http.get<Departamento>(`${this.apiUrl}/${id}`);
  }

  actualizar(id: string, departamento: Partial<Departamento>): Observable<Departamento> {
    return this.http.put<Departamento>(`${this.apiUrl}/${id}`, departamento);
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  restaurar(id: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/restaurar`, {});
  }
}
