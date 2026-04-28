import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ChatbotService, BorradorTramite } from '../../services/chatbot.service';

interface ChatMessage {
  texto: string;
  tipo: 'user' | 'ia' | 'system';
}

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent {
  mensajes: ChatMessage[] = [
    { texto: '¡Hola! Soy tu asistente de IA. Escribe un mensaje para crear un trámite.', tipo: 'ia' }
  ];
  mensajeActual = '';
  cargando = false;
  creandoTramite = false;
  borradorPendiente: BorradorTramite | null = null;

  constructor(
    private chatbotService: ChatbotService,
    private router: Router
  ) {}

  enviarMensaje(event?: any) {
    if (event) {
      event.preventDefault();
    }
    
    const texto = this.mensajeActual.trim();
    if (!texto) return;

    this.mensajes.push({ texto, tipo: 'user' });
    this.mensajeActual = '';
    this.cargando = true;

    this.chatbotService.interpretarMensaje(texto).subscribe({
      next: (borrador) => {
        this.cargando = false;
        this.borradorPendiente = borrador;
        
        let msgIA = 'He interpretado tu solicitud. Revisa la vista previa y confirma la creación.';
        if (borrador.faltantes.length > 0) {
          msgIA = 'Faltan algunos datos o hubo un error al validarlos. Por favor, revisa la vista previa y aclara los datos que faltan.';
        }
        
        this.mensajes.push({ texto: msgIA, tipo: 'ia' });
      },
      error: (err) => {
        this.cargando = false;
        this.mensajes.push({ texto: 'Error al comunicarse con la IA. Inténtalo de nuevo.', tipo: 'system' });
        console.error(err);
      }
    });
  }

  cancelarBorrador() {
    this.borradorPendiente = null;
    this.mensajes.push({ texto: 'Borrador cancelado. ¿En qué más puedo ayudarte?', tipo: 'ia' });
  }

  confirmarCreacion() {
    if (!this.borradorPendiente) return;
    
    this.creandoTramite = true;
    this.chatbotService.confirmarTramite(this.borradorPendiente).subscribe({
      next: (tramiteCreado) => {
        this.creandoTramite = false;
        this.borradorPendiente = null;
        this.mensajes.push({ 
          texto: `¡Trámite creado exitosamente! Referencia: ${tramiteCreado.referencia}`, 
          tipo: 'system' 
        });
        
        // Navegar a la lista de trámites después de 2 segundos
        setTimeout(() => {
          this.router.navigate(['/tramites']);
        }, 2000);
      },
      error: (err) => {
        this.creandoTramite = false;
        this.mensajes.push({ texto: 'Error al crear el trámite en la base de datos.', tipo: 'system' });
        console.error(err);
      }
    });
  }
}
