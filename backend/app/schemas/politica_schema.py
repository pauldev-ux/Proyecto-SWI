from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from enum import Enum

class TipoFlujoEnum(str, Enum):
    LINEAL = "lineal"
    ALTERNATIVO = "alternativo"
    ITERATIVO = "iterativo"
    PARALELO = "paralelo"

class EstadoPoliticaEnum(str, Enum):
    BORRADOR = "borrador"
    ACTIVA = "activa"
    INACTIVA = "inactiva"
    ELIMINADA = "eliminada"

# ===== Schemas de Política de Negocio =====

class NodoSchema(BaseModel):
    id: str
    nombre: str
    departamento: str
    descripcion: Optional[str] = ""
    tipo_flujo: TipoFlujoEnum = TipoFlujoEnum.LINEAL
    requiere_formulario: bool = True
    orden: int = 0

class ConexionSchema(BaseModel):
    id: str
    nodo_origen: str
    nodo_destino: str
    tipo: str = "lineal"
    condicion: Optional[str] = None

class PoliticaNegocioCreateSchema(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=255)
    descripcion: str
    nodos: List[Dict[str, Any]]
    conexiones: List[Dict[str, Any]]
    departamentos: List[str]

class PoliticaNegocioUpdateSchema(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    nodos: Optional[List[Dict[str, Any]]] = None
    conexiones: Optional[List[Dict[str, Any]]] = None
    departamentos: Optional[List[str]] = None
    estado: Optional[EstadoPoliticaEnum] = None

class PoliticaNegocioSchema(BaseModel):
    id: Optional[str] = None
    nombre: str
    descripcion: str
    nodos: List[Dict[str, Any]]
    conexiones: List[Dict[str, Any]]
    departamentos: List[str]
    estado: EstadoPoliticaEnum
    creado_por: str
    colaboradores: List[str] = []
    fecha_creacion: Optional[dict] = None
    fecha_actualizacion: Optional[dict] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "nombre": "Instalación de Medidor",
                "descripcion": "Política para instalar nuevos medidores",
                "departamentos": ["Atención al Cliente", "Instalación", "Verificación"],
                "estado": "activa"
            }
        }
