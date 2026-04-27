import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { Usuario, TokenResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = 'http://localhost:8000/api/v1/usuarios';
  private usuarioActual = new BehaviorSubject<Usuario | null>(null);
  private tokenActual = new BehaviorSubject<string>('');

  constructor(private http: HttpClient) {
    this.cargarUsuarioGuardado();
  }

  registrar(username: string, nombre: string, contraseña: string): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/registro`, {
      username,
      nombre,
      contraseña
    });
  }

  login(username: string, contraseña: string): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.apiUrl}/login`, {
      username,
      contraseña
    }).pipe(
      tap(response => {
        localStorage.setItem('token', response.access_token);
        localStorage.setItem('usuario', JSON.stringify(response.usuario));
        this.usuarioActual.next(response.usuario);
        this.tokenActual.next(response.access_token);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    this.usuarioActual.next(null);
    this.tokenActual.next('');
  }

  obtenerUsuarioActual(): Observable<Usuario | null> {
    return this.usuarioActual.asObservable();
  }

  obtenerUsuarioActualValue(): Usuario | null {
    return this.usuarioActual.value;
  }

  obtenerToken(): string {
    return this.tokenActual.value || localStorage.getItem('token') || '';
  }

  obtenerUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl);
  }

  obtenerUsuariosPorDepartamento(departamento: string): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/departamento/${departamento}`);
  }

  private cargarUsuarioGuardado(): void {
    const token = localStorage.getItem('token');
    const usuario = localStorage.getItem('usuario');
    
    if (token && usuario) {
      this.tokenActual.next(token);
      try {
        this.usuarioActual.next(JSON.parse(usuario));
      } catch (e) {
        console.error('Error al cargar usuario guardado', e);
      }
    }
  }
}
