from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class DepartamentoCreateSchema(BaseModel):
    """Schema para crear un departamento"""
    nombre: str = Field(..., min_length=1, max_length=255, description="Nombre del departamento")
    codigo: Optional[str] = Field(None, min_length=1, max_length=50, description="Código único del departamento")

class DepartamentoUpdateSchema(BaseModel):
    """Schema para actualizar un departamento"""
    nombre: Optional[str] = Field(None, min_length=1, max_length=255)
    codigo: Optional[str] = Field(None, min_length=1, max_length=50)
    activo: Optional[bool] = None

class DepartamentoSchema(BaseModel):
    """Schema de respuesta de departamento"""
    id: Optional[str] = None
    nombre: str
    codigo: Optional[str] = None
    activo: bool
    fecha_creacion: Optional[datetime] = None
    fecha_actualizacion: Optional[datetime] = None

    class Config:
        from_attributes = True
