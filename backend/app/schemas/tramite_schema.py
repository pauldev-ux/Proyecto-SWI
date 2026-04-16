from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class EstadoTramiteEnum(str, Enum):
    SOLICITADO = "solicitado"
    EN_PROCESO = "en_proceso"
    ACEPTADO = "aceptado"
    COMPLETADO = "completado"
    RECHAZADO = "rechazado"

class PrioridadEnum(str, Enum):
    BAJA = "baja"
    NORMAL = "normal"
    ALTA = "alta"
    URGENTE = "urgente"

class TramiteCreateSchema(BaseModel):
    """Schema para crear un trámite"""
    referencia: str = Field(..., min_length=1, max_length=255, description="Referencia única del trámite")
    cliente: str = Field(..., min_length=1, max_length=255, description="Nombre del cliente")
    asunto: str = Field(..., min_length=1, max_length=1000, description="Asunto del trámite")
    departamento: Optional[str] = Field(None, description="Departamento responsable")
    prioridad: Optional[PrioridadEnum] = Field(PrioridadEnum.NORMAL, description="Prioridad del trámite")
    usuario_asignado: Optional[str] = Field(None, description="Usuario asignado al trámite")

class TramiteUpdateSchema(BaseModel):
    """Schema para actualizar un trámite"""
    referencia: Optional[str] = Field(None, min_length=1, max_length=255)
    cliente: Optional[str] = Field(None, min_length=1, max_length=255)
    asunto: Optional[str] = Field(None, min_length=1, max_length=1000)
    departamento: Optional[str] = None
    estado: Optional[EstadoTramiteEnum] = None
    prioridad: Optional[PrioridadEnum] = None
    usuario_asignado: Optional[str] = None

class TramiteSchema(BaseModel):
    """Schema de respuesta de trámite"""
    id: Optional[str] = None
    referencia: str
    cliente: str
    asunto: str
    departamento: Optional[str] = None
    estado: EstadoTramiteEnum
    prioridad: PrioridadEnum
    usuario_asignado: Optional[str] = None
    fecha_creacion: Optional[datetime] = None
    fecha_actualizacion: Optional[datetime] = None

    class Config:
        from_attributes = True
