from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class EstadoTramite(str, Enum):
    """Estados de un trámite"""
    SOLICITADO = "solicitado"
    EN_PROCESO = "en_proceso"
    ACEPTADO = "aceptado"
    COMPLETADO = "completado"
    RECHAZADO = "rechazado"

class PrioridadTramite(str, Enum):
    """Prioridades de un trámite"""
    BAJA = "baja"
    NORMAL = "normal"
    ALTA = "alta"
    URGENTE = "urgente"

class Tramite:
    """Modelo de Trámite"""
    
    def __init__(
        self,
        referencia: str,
        cliente: str,
        asunto: str,
        departamento: Optional[str] = None,
        estado: str = EstadoTramite.SOLICITADO,
        prioridad: str = PrioridadTramite.NORMAL,
        usuario_asignado: Optional[str] = None,
        _id = None
    ):
        self._id = _id
        self.referencia = referencia
        self.cliente = cliente
        self.asunto = asunto
        self.departamento = departamento
        self.estado = estado
        self.prioridad = prioridad
        self.usuario_asignado = usuario_asignado
        self.fecha_creacion = datetime.utcnow() if _id is None else None
        self.fecha_actualizacion = None
            "fecha_creacion": self.fecha_creacion,
            "fecha_actualizacion": self.fecha_actualizacion,
            "fecha_completado": self.fecha_completado,
            "tiempo_total_minutos": self.tiempo_total_minutos
        }

class TareaFuncionario:
    """Modelo de Tarea asignada a un funcionario"""
    
    def __init__(
        self,
        tramite_id: str,
        funcionario_id: str,
        actividad_id: str,
        departamento: str,
        estado: EstadoTramite = EstadoTramite.NUEVO,
        datos_tramite: Dict[str, Any] = None,
        _id: Optional[str] = None
    ):
        self._id = _id
        self.tramite_id = tramite_id
        self.funcionario_id = funcionario_id
        self.actividad_id = actividad_id
        self.departamento = departamento
        self.estado = estado
        self.datos_tramite = datos_tramite or {}
        self.fecha_asignacion = datetime.utcnow()
        self.fecha_inicio: Optional[datetime] = None
        self.fecha_completada: Optional[datetime] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convertir a diccionario"""
        return {
            "_id": self._id,
            "tramite_id": self.tramite_id,
            "funcionario_id": self.funcionario_id,
            "actividad_id": self.actividad_id,
            "departamento": self.departamento,
            "estado": self.estado.value,
            "datos_tramite": self.datos_tramite,
            "fecha_asignacion": self.fecha_asignacion,
            "fecha_inicio": self.fecha_inicio,
            "fecha_completada": self.fecha_completada
        }
