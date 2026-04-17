import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css']
})
export class AnalyticsComponent implements OnInit {
  activeTab: string = 'swimlane';

  diagramMermaid = `
    graph TD
      A["Recibir Solicitud"] -->|Enviar| B["Revisar Documentos"]
      B -->|Documentos OK| C["Aprobar Pago"]
      B -->|Faltan Docs| B
      C -->|Fondos OK| D["Aprobación Final"]
      C -->|Rechazar| B
      D -->|Aprobado| E["Proceso Completado"]
    
    style A fill:#e8f4f8,stroke:#2196F3,stroke-width:2px,color:#000
    style B fill:#fff3e0,stroke:#FF9800,stroke-width:2px,color:#000
    style C fill:#e8f5e9,stroke:#4CAF50,stroke-width:2px,color:#000
    style D fill:#fff3e0,stroke:#FF9800,stroke-width:2px,color:#000
    style E fill:#c8e6c9,stroke:#4CAF50,stroke-width:2px,color:#000
  `;

  swimlaneDiagram = `
    flowchart TD
      subgraph Ventas["🏢 DEPARTAMENTO: VENTAS"]
        V1["📋 Recibir Solicitud<br/>del Cliente"]
      end
      
      subgraph Legal["⚖️ DEPARTAMENTO: LEGAL"]
        L1["📋 Revisar Documentos<br/>y Contrato"]
        L2["✓ Aprobación Legal"]
      end
      
      subgraph Finanzas["💰 DEPARTAMENTO: FINANZAS"]
        F1["💵 Validar Presupuesto"]
        F2["✓ Aprobar Pago"]
      end
      
      V1 -->|Solicitud Completa| L1
      L1 -->|Documentos OK| F1
      L1 -->|Falta Documentación| L1
      F1 -->|Fondos Disponibles| F2
      F1 -->|Sin Presupuesto| L1
      F2 -->|Pago Aprobado| L2
      L2 -->|✓ Final Aprobado| FIN["🎉 Trámite Completado"]
      
      style V1 fill:#e3f2fd,stroke:#2196F3,stroke-width:3px,color:#000,font-weight:bold
      style L1 fill:#fff3e0,stroke:#FF9800,stroke-width:3px,color:#000,font-weight:bold
      style L2 fill:#fff3e0,stroke:#FF9800,stroke-width:3px,color:#000,font-weight:bold
      style F1 fill:#e8f5e9,stroke:#4CAF50,stroke-width:3px,color:#000,font-weight:bold
      style F2 fill:#e8f5e9,stroke:#4CAF50,stroke-width:3px,color:#000,font-weight:bold
      style FIN fill:#c8e6c9,stroke:#4CAF50,stroke-width:3px,color:#000,font-weight:bold
      
      style Ventas fill:#e3f2fd,stroke:#2196F3,stroke-width:2px
      style Legal fill:#fff3e0,stroke:#FF9800,stroke-width:2px
      style Finanzas fill:#e8f5e9,stroke:#4CAF50,stroke-width:2px
  `;

  procesos = [
    {
      nombre: 'Recibir Solicitud',
      departamento: 'Ventas',
      color: '#2196F3',
      descripcion: 'Cliente presenta solicitud de trámite',
      icono: '📋'
    },
    {
      nombre: 'Revisar Documentos',
      departamento: 'Legal',
      color: '#FF9800',
      descripcion: 'Verificación legal de documentos',
      icono: '📋'
    },
    {
      nombre: 'Validar Presupuesto',
      departamento: 'Finanzas',
      color: '#4CAF50',
      descripcion: 'Evaluación de disponibilidad de fondos',
      icono: '💵'
    },
    {
      nombre: 'Aprobar Pago',
      departamento: 'Finanzas',
      color: '#4CAF50',
      descripcion: 'Autorización de desembolso',
      icono: '✓'
    },
    {
      nombre: 'Aprobación Final',
      departamento: 'Legal',
      color: '#FF9800',
      descripcion: 'Firma y validación final del documento',
      icono: '✓'
    }
  ];

  constructor() { }

  ngOnInit(): void {
  }

  obtenerColorDepartamento(departamento: string): string {
    const colores: {[key: string]: string} = {
      'Ventas': '#2196F3',
      'Legal': '#FF9800',
      'Finanzas': '#4CAF50'
    };
    return colores[departamento] || '#95a5a6';
  }
}
