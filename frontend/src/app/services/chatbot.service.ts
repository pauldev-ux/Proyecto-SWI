import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Tramite } from '../models';

export interface BorradorTramite {
  accion: string;
  solicitante_id: string | null;
  ruta_departamentos: string[];
  prioridad: string;
  asunto: string | null;
  faltantes: string[];
  requiere_confirmacion: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private apiUrl = `${environment.apiUrl}/chatbot`;

  constructor(private http: HttpClient) {}

  interpretarMensaje(mensaje: string): Observable<BorradorTramite> {
    return this.http.post<BorradorTramite>(`${this.apiUrl}/interpretar`, { mensaje });
  }

  confirmarTramite(borrador: BorradorTramite): Observable<Tramite> {
    return this.http.post<Tramite>(`${this.apiUrl}/confirmar`, borrador);
  }
}