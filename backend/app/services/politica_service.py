from typing import List, Optional, Dict, Any
from bson.objectid import ObjectId
from app.models.politica_negocio import PoliticaNegocio, EstadoPolitica
from datetime import datetime

class PoliticaNegocioService:
    """Servicio para gestionar políticas de negocio"""
    
    def __init__(self, db):
        self.db = db
        self.collection = db["politicas_negocio"]
    
    async def crear_politica(
        self,
        nombre: str,
        descripcion: str,
        nodos: List[Dict[str, Any]],
        conexiones: List[Dict[str, Any]],
        departamentos: List[str],
        creado_por: str
    ) -> Dict[str, Any]:
        """Crear una nueva política de negocio"""
        politica = {
            "nombre": nombre,
            "descripcion": descripcion,
            "nodos": nodos,
            "conexiones": conexiones,
            "departamentos": departamentos,
            "estado": EstadoPolitica.BORRADOR.value,
            "creado_por": creado_por,
            "colaboradores": [creado_por],
            "fecha_creacion": datetime.utcnow(),
            "fecha_actualizacion": datetime.utcnow(),
            "versiones": []
        }
        
        resultado = await self.collection.insert_one(politica)
        politica["_id"] = resultado.inserted_id
        return politica
    
    async def obtener_politica(self, politica_id: str) -> Optional[Dict[str, Any]]:
        """Obtener una política por ID"""
        try:
            return await self.collection.find_one({"_id": ObjectId(politica_id)})
        except:
            return None
    
    async def listar_politicas(self, creado_por: Optional[str] = None) -> List[Dict[str, Any]]:
        """Listar políticas de negocio"""
        query = {}
        if creado_por:
            query["creado_por"] = creado_por
        
        cursor = self.collection.find(query)
        return await cursor.to_list(length=None)
    
    async def actualizar_politica(
        self,
        politica_id: str,
        datos_actualizar: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Actualizar una política de negocio"""
        try:
            datos_actualizar["fecha_actualizacion"] = datetime.utcnow()
            
            resultado = await self.collection.find_one_and_update(
                {"_id": ObjectId(politica_id)},
                {"$set": datos_actualizar},
                return_document=True
            )
            return resultado
        except:
            return None
    
    async def activar_politica(self, politica_id: str) -> bool:
        """Activar una política de negocio"""
        resultado = await self.actualizar_politica(
            politica_id,
            {"estado": EstadoPolitica.ACTIVA.value}
        )
        return resultado is not None
    
    async def eliminar_politica(self, politica_id: str) -> bool:
        """Eliminar una política de negocio (marcar como eliminada)"""
        resultado = await self.actualizar_politica(
            politica_id,
            {"estado": EstadoPolitica.ELIMINADA.value}
        )
        return resultado is not None
    
    async def agregar_colaborador(self, politica_id: str, usuario_id: str) -> bool:
        """Agregar un colaborador a la política"""
        try:
            await self.collection.update_one(
                {"_id": ObjectId(politica_id)},
                {"$addToSet": {"colaboradores": usuario_id}}
            )
            return True
        except:
            return False
    
    async def agregar_version(
        self,
        politica_id: str,
        numero_version: int,
        cambios: str
    ) -> bool:
        """Agregar una nueva versión de la política"""
        try:
            version = {
                "numero": numero_version,
                "fecha": datetime.utcnow(),
                "cambios": cambios
            }
            await self.collection.update_one(
                {"_id": ObjectId(politica_id)},
                {"$push": {"versiones": version}}
            )
            return True
        except:
            return False
