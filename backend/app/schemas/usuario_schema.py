from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
from datetime import datetime

class RolUsuarioEnum(str, Enum):
    ADMIN = "admin"
    DISEÑADOR = "diseñador"
    FUNCIONARIO = "funcionario"

class UsuarioRegistroSchema(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    nombre: str = Field(..., min_length=1, max_length=255)
    contraseña: str = Field(..., min_length=6)

class UsuarioCreateSchema(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    nombre: str = Field(..., min_length=1, max_length=255)
    contraseña: str = Field(..., min_length=6)
    rol: RolUsuarioEnum = RolUsuarioEnum.FUNCIONARIO
    departamento: Optional[str] = None

class UsuarioUpdateSchema(BaseModel):
    nombre: Optional[str] = None
    username: Optional[str] = None
    rol: Optional[str] = None
    departamento: Optional[str] = None
    activo: Optional[bool] = None

class UsuarioSchema(BaseModel):
    id: Optional[str] = None
    username: str
    nombre: str
    rol: RolUsuarioEnum
    departamento: Optional[str] = None
    activo: bool
    fecha_creacion: Optional[datetime] = None

class LoginSchema(BaseModel):
    username: str
    contraseña: str

class TokenSchema(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioSchema