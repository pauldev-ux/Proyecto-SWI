from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum

class TipoFlujo(str, Enum):
    """Tipos de flujo permitidos"""
    LINEAL = "lineal"
    ALTERNATIVO = "alternativo"
    ITERATIVO = "iterativo"
    PARALELO = "paralelo"

class EstadoPolitica(str, Enum):
    """Estados de una política de negocio"""
    BORRADOR = "borrador"
    ACTIVA = "activa"
    INACTIVA = "inactiva"
    ELIMINADA = "eliminada"

class Nodo:
    """Representa una actividad/nodo en el diagrama"""
    
    def __init__(
        self,
        id: str,
        nombre: str,
        departamento: str,
        descripcion: str = "",
        tipo_flujo: TipoFlujo = TipoFlujo.LINEAL,
        requiere_formulario: bool = True,
        orden: int = 0
    ):
        self.id = id
        self.nombre = nombre
        self.departamento = departamento
        self.descripcion = descripcion
        self.tipo_flujo = tipo_flujo
        self.requiere_formulario = requiere_formulario
        self.orden = orden

class Conexion:
    """Representa una conexión entre nodos"""
    
    def __init__(
        self,
        id: str,
        nodo_origen: str,
        nodo_destino: str,
        tipo: str = "lineal",  # lineal, condicional
        condicion: Optional[str] = None
    ):
        self.id = id
        self.nodo_origen = nodo_origen
        self.nodo_destino = nodo_destino
        self.tipo = tipo
        self.condicion = condicion

class PoliticaNegocio:
    """Modelo de Política de Negocio"""
    
    def __init__(
        self,
        nombre: str,
        descripcion: str,
        nodos: List[Dict[str, Any]],
        conexiones: List[Dict[str, Any]],
        departamentos: List[str],
        estado: EstadoPolitica = EstadoPolitica.BORRADOR,
        creado_por: str = "",
        colaboradores: List[str] = None,
        _id: Optional[str] = None
    ):
        self._id = _id
        self.nombre = nombre
        self.descripcion = descripcion
        self.nodos = nodos
        self.conexiones = conexiones
        self.departamentos = departamentos
        self.estado = estado
        self.creado_por = creado_por
        self.colaboradores = colaboradores or []
        self.fecha_creacion = datetime.utcnow()
        self.fecha_actualizacion = datetime.utcnow()
        self.versiones = []
    
    def to_dict(self) -> Dict[str, Any]:
        """Convertir a diccionario"""
        return {
            "_id": self._id,
            "nombre": self.nombre,
            "descripcion": self.descripcion,
            "nodos": self.nodos,
            "conexiones": self.conexiones,
            "departamentos": self.departamentos,
            "estado": self.estado.value,
            "creado_por": self.creado_por,
            "colaboradores": self.colaboradores,
            "fecha_creacion": self.fecha_creacion,
            "fecha_actualizacion": self.fecha_actualizacion,
            "versiones": self.versiones
        }
