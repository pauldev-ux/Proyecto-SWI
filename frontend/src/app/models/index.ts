// Modelos de Usuario
export interface Usuario {
  id?: string;
  username: string;
  nombre: string;
  rol: 'admin' | 'cliente' | 'funcionario';
  departamento?: string;
  activo: boolean;
  fecha_creacion?: Date;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  usuario: Usuario;
}

// Modelos de Departamento
export interface Departamento {
  id?: string;
  nombre: string;
  codigo?: string;
  activo: boolean;
  fecha_creacion?: Date;
  fecha_actualizacion?: Date;
}

// Modelos de Política de Negocio
export interface Nodo {
  id: string;
  nombre: string;
  departamento: string;
  descripcion: string;
  tipo_flujo: 'lineal' | 'alternativo' | 'iterativo' | 'paralelo';
  requiere_formulario: boolean;
  orden: number;
}

export interface Conexion {
  id: string;
  nodo_origen: string;
  nodo_destino: string;
  tipo: string;
  condicion?: string;
}

export interface PoliticaNegocio {
  id?: string;
  nombre: string;
  descripcion: string;
  nodos: Nodo[];
  conexiones: Conexion[];
  departamentos: string[];
  estado: 'borrador' | 'activa' | 'inactiva' | 'eliminada';
  creado_por: string;
  colaboradores: string[];
  fecha_creacion?: Date;
  fecha_actualizacion?: Date;
}

// Modelos de Trámite
export interface Tramite {
  id?: string;
  referencia: string;
  cliente: string;
  asunto: string;
  departamento?: string;
  ruta_departamentos?: string[];
  estado: 'solicitado' | 'en_proceso' | 'aceptado' | 'completado' | 'rechazado' | 'observado';
  prioridad: 'baja' | 'normal' | 'alta' | 'urgente';
  usuario_asignado?: string;
  fecha_creacion?: Date;
  fecha_actualizacion?: Date;
}
