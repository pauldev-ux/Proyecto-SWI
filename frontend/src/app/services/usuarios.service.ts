import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Usuario {
  id?: string;
  username: string;
  nombre: string;
  rol: string;
  departamento?: string;
  activo: boolean;
  fecha_creacion?: string;
}

export interface UsuarioCreate {
  username: string;
  nombre: string;
  contraseña: string;
  rol: string;
  departamento?: string;
}

export interface UsuarioRegistro {
  username: string;
  nombre: string;
  contraseña: string;
}

export interface UsuarioUpdate {
  nombre?: string;
  username?: string;
  rol?: string;
  departamento?: string;
  activo?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  private apiUrl = 'http://localhost:8000/api/v1/usuarios';

  constructor(private http: HttpClient) {}

  listarUsuarios(rol?: string): Observable<Usuario[]> {
    const url = rol ? `${this.apiUrl}?rol=${encodeURIComponent(rol)}` : this.apiUrl;
    return this.http.get<Usuario[]>(url);
  }

  listarClientes(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}?rol=cliente`);
  }

  obtenerUsuario(id: string): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`);
  }

  crearUsuario(usuario: UsuarioCreate): Observable<Usuario> {
    return this.http.post<Usuario>(this.apiUrl, usuario);
  }

  registrarCliente(usuario: UsuarioRegistro): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/registro`, usuario);
  }

  actualizarUsuario(id: string, datos: UsuarioUpdate): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/${id}`, datos);
  }

  eliminarUsuario(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}