from typing import Optional, Dict, Any, List
from bson.objectid import ObjectId
from datetime import datetime

class DepartamentoService:
    """Servicio para gestionar departamentos"""
    
    def __init__(self, db):
        self.db = db
        self.collection = db["departamentos"]
    
    async def crear_departamento(
        self,
        nombre: str,
        codigo: Optional[str] = None
    ) -> Dict[str, Any]:
        """Crear un nuevo departamento"""
        # Verificar que el código no exista si se proporciona
        if codigo:
            existe = await self.collection.find_one({"codigo": codigo})
            if existe:
                raise ValueError(f"El código '{codigo}' ya está registrado")
        
        # Verificar que el nombre no exista
        existe = await self.collection.find_one({"nombre": nombre})
        if existe:
            raise ValueError(f"El departamento '{nombre}' ya existe")
        
        departamento = {
            "nombre": nombre,
            "codigo": codigo,
            "activo": True,
            "fecha_creacion": datetime.utcnow(),
            "fecha_actualizacion": None
        }
        
        resultado = await self.collection.insert_one(departamento)
        departamento["_id"] = resultado.inserted_id
        return departamento
    
    async def obtener_departamento_por_id(self, departamento_id: str) -> Optional[Dict[str, Any]]:
        """Obtener un departamento por ID"""
        try:
            return await self.collection.find_one({"_id": ObjectId(departamento_id)})
        except:
            return None
    
    async def obtener_departamento_por_codigo(self, codigo: str) -> Optional[Dict[str, Any]]:
        """Obtener un departamento por código"""
        return await self.collection.find_one({"codigo": codigo})
    
    async def obtener_departamento_por_nombre(self, nombre: str) -> Optional[Dict[str, Any]]:
        """Obtener un departamento por nombre"""
        return await self.collection.find_one({"nombre": nombre})
    
    async def listar_departamentos(self, activos_solo: bool = False) -> List[Dict[str, Any]]:
        """Listar todos los departamentos"""
        query = {}
        if activos_solo:
            query["activo"] = True
        
        cursor = self.collection.find(query).sort("nombre", 1)
        return await cursor.to_list(length=None)
    
    async def actualizar_departamento(
        self,
        departamento_id: str,
        datos: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Actualizar un departamento"""
        try:
            # Verificar si se intenta cambiar el código a uno que ya existe
            if "codigo" in datos and datos["codigo"]:
                existe = await self.collection.find_one({
                    "codigo": datos["codigo"],
                    "_id": {"$ne": ObjectId(departamento_id)}
                })
                if existe:
                    raise ValueError(f"El código '{datos['codigo']}' ya está en uso")
            
            # Verificar si se intenta cambiar el nombre a uno que ya existe
            if "nombre" in datos:
                existe = await self.collection.find_one({
                    "nombre": datos["nombre"],
                    "_id": {"$ne": ObjectId(departamento_id)}
                })
                if existe:
                    raise ValueError(f"El departamento '{datos['nombre']}' ya existe")
            
            # Agregar fecha de actualización
            datos["fecha_actualizacion"] = datetime.utcnow()
            
            resultado = await self.collection.find_one_and_update(
                {"_id": ObjectId(departamento_id)},
                {"$set": datos},
                return_document=True
            )
            return resultado
        except Exception as e:
            raise e
    
    async def eliminar_departamento(self, departamento_id: str) -> bool:
        """Eliminar un departamento (soft delete - marcar como inactivo)"""
        try:
            resultado = await self.collection.find_one_and_update(
                {"_id": ObjectId(departamento_id)},
                {"$set": {"activo": False, "fecha_actualizacion": datetime.utcnow()}},
                return_document=True
            )
            return resultado is not None
        except:
            return False
    
    async def eliminar_departamento_permanentemente(self, departamento_id: str) -> bool:
        """Eliminar un departamento de forma permanente"""
        try:
            resultado = await self.collection.delete_one({"_id": ObjectId(departamento_id)})
            return resultado.deleted_count > 0
        except:
            return False
    
    async def restaurar_departamento(self, departamento_id: str) -> bool:
        """Restaurar un departamento inactivo"""
        try:
            resultado = await self.collection.find_one_and_update(
                {"_id": ObjectId(departamento_id)},
                {"$set": {"activo": True, "fecha_actualizacion": datetime.utcnow()}},
                return_document=True
            )
            return resultado is not None
        except:
            return False
