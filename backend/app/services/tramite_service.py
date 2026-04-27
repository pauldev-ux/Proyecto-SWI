from typing import List, Optional, Dict, Any
from bson.objectid import ObjectId
from datetime import datetime

class TramiteService:
    """Servicio para gestionar trámites"""
    
    def __init__(self, db):
        self.db = db
        self.collection = db["tramites"]
    
    async def crear_tramite(
        self,
        referencia: str,
        cliente: str,
        asunto: str,
        departamento: Optional[str] = None,
        ruta_departamentos: Optional[List[str]] = None,
        prioridad: str = "normal",
        usuario_asignado: Optional[str] = None
    ) -> Dict[str, Any]:
        """Crear un nuevo trámite"""
        # Verificar que la referencia no exista
        existe = await self.collection.find_one({"referencia": referencia})
        if existe:
            raise ValueError(f"El trámite con referencia '{referencia}' ya existe")
        
        flujo = ruta_departamentos or ([] if not departamento else [departamento])
        departamento_actual = flujo[0] if flujo else departamento

        tramite = {
            "referencia": referencia,
            "cliente": cliente,
            "asunto": asunto,
            "departamento": departamento_actual,
            "ruta_departamentos": flujo,
            "estado": "solicitado",
            "prioridad": prioridad,
            "usuario_asignado": usuario_asignado,
            "fecha_creacion": datetime.utcnow(),
            "fecha_actualizacion": None
        }
        
        resultado = await self.collection.insert_one(tramite)
        tramite["_id"] = resultado.inserted_id
        return tramite
    
    async def obtener_tramite_por_id(self, tramite_id: str) -> Optional[Dict[str, Any]]:
        """Obtener un trámite por ID"""
        try:
            return await self.collection.find_one({"_id": ObjectId(tramite_id)})
        except:
            return None
    
    async def obtener_tramite_por_referencia(self, referencia: str) -> Optional[Dict[str, Any]]:
        """Obtener un trámite por referencia"""
        return await self.collection.find_one({"referencia": referencia})
    
    async def listar_tramites(self, estado: Optional[str] = None, departamento: Optional[str] = None) -> List[Dict[str, Any]]:
        """Listar trámites con filtros opcionales"""
        query = {}
        if estado:
            query["estado"] = estado
        if departamento:
            query["departamento"] = departamento
        
        cursor = self.collection.find(query).sort("fecha_creacion", -1)
        return await cursor.to_list(length=None)
    
    async def actualizar_tramite(
        self,
        tramite_id: str,
        datos: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Actualizar un trámite"""
        try:
            # Verificar si se intenta cambiar la referencia a una que ya existe
            if "referencia" in datos and datos["referencia"]:
                existe = await self.collection.find_one({
                    "referencia": datos["referencia"],
                    "_id": {"$ne": ObjectId(tramite_id)}
                })
                if existe:
                    raise ValueError(f"La referencia '{datos['referencia']}' ya está en uso")
            
            # Agregar fecha de actualización
            datos["fecha_actualizacion"] = datetime.utcnow()
            
            resultado = await self.collection.find_one_and_update(
                {"_id": ObjectId(tramite_id)},
                {"$set": datos},
                return_document=True
            )
            return resultado
        except Exception as e:
            raise e
    
    async def cambiar_estado(
        self,
        tramite_id: str,
        nuevo_estado: str
    ) -> Optional[Dict[str, Any]]:
        """Cambiar el estado de un trámite y avanzar por el flujo de departamentos"""
        try:
            tramite = await self.obtener_tramite_por_id(tramite_id)
            if not tramite:
                return None

            flujo = tramite.get("ruta_departamentos") or []
            departamento_actual = tramite.get("departamento")
            estado_actual = tramite.get("estado")
            cambios: Dict[str, Any] = {"estado": nuevo_estado, "fecha_actualizacion": datetime.utcnow()}

            if nuevo_estado == "aceptado" and flujo:
                if departamento_actual and departamento_actual in flujo:
                    indice = flujo.index(departamento_actual)
                    if indice < len(flujo) - 1:
                        cambios["departamento"] = flujo[indice + 1]
                        cambios["estado"] = "en_proceso"
                    else:
                        cambios["estado"] = "completado"
                elif flujo:
                    cambios["departamento"] = flujo[0]
                    cambios["estado"] = "en_proceso"

            resultado = await self.collection.find_one_and_update(
                {"_id": ObjectId(tramite_id)},
                {"$set": cambios},
                return_document=True
            )
            return resultado
        except:
            return None
    
    async def eliminar_tramite(self, tramite_id: str) -> bool:
        """Eliminar un trámite"""
        try:
            resultado = await self.collection.delete_one({"_id": ObjectId(tramite_id)})
            return resultado.deleted_count > 0
        except:
            return False
    
    async def listar_por_cliente(self, cliente: str) -> List[Dict[str, Any]]:
        """Listar trámites de un cliente específico"""
        cursor = self.collection.find({"cliente": cliente}).sort("fecha_creacion", -1)
        return await cursor.to_list(length=None)
    
    async def obtener_por_referencia(self, referencia: str) -> Optional[Dict[str, Any]]:
        """Obtener trámite por referencia"""
        return await self.collection.find_one({"referencia": referencia})
    
    async def listar_por_departamento(self, departamento: str) -> List[Dict[str, Any]]:
        """Listar trámites de un departamento específico"""
        cursor = self.collection.find({"departamento": departamento}).sort("fecha_creacion", -1)
        return await cursor.to_list(length=None)
