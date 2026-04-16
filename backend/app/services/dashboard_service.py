from typing import Dict, Any, List
from datetime import datetime, timedelta
from bson.objectid import ObjectId

class DashboardService:
    """Servicio para obtener estadísticas del dashboard"""
    
    def __init__(self, db):
        self.db = db
        self.tramites_collection = db["tramites"]
        self.departamentos_collection = db["departamentos"]
        self.usuarios_collection = db["usuarios"]
    
    async def obtener_estadisticas(self) -> Dict[str, Any]:
        """Obtener estadísticas principales del dashboard"""
        
        # Contar trámites por estado
        tramites_por_estado = await self._contar_tramites_por_estado()
        
        # Contar trámites por departamento
        tramites_por_departamento = await self._contar_tramites_por_departamento()
        
        # Contar departamentos activos
        departamentos_activos = await self.departamentos_collection.count_documents({"activo": True})
        
        # Contar usuarios
        total_usuarios = await self.usuarios_collection.count_documents({})
        
        # Trámites totales
        total_tramites = await self.tramites_collection.count_documents({})
        
        # Últimos trámites creados
        ultimos_tramites = await self._obtener_ultimos_tramites(5)
        
        # Trámites este mes
        tramites_este_mes = await self._contar_tramites_este_mes()
        
        return {
            "estadoGeneral": {
                "totalTramites": total_tramites,
                "departamentosActivos": departamentos_activos,
                "usuariosTotales": total_usuarios,
                "tramitesEsteMes": tramites_este_mes
            },
            "tramitesPorEstado": tramites_por_estado,
            "tramitesPorDepartamento": tramites_por_departamento,
            "ultimosTramites": ultimos_tramites
        }
    
    async def _contar_tramites_por_estado(self) -> Dict[str, int]:
        """Contar trámites agrupados por estado"""
        pipeline = [
            {
                "$group": {
                    "_id": "$estado",
                    "count": {"$sum": 1}
                }
            },
            {
                "$sort": {"_id": 1}
            }
        ]
        
        resultado = {}
        async for doc in self.tramites_collection.aggregate(pipeline):
            estado = doc["_id"] or "sin_estado"
            resultado[estado] = doc["count"]
        
        # Asegurar que todos los estados existan
        estados = ["solicitado", "en_proceso", "aceptado", "completado", "rechazado"]
        for estado in estados:
            if estado not in resultado:
                resultado[estado] = 0
        
        return resultado
    
    async def _contar_tramites_por_departamento(self) -> List[Dict[str, Any]]:
        """Contar trámites agrupados por departamento"""
        pipeline = [
            {
                "$group": {
                    "_id": "$departamento",
                    "count": {"$sum": 1}
                }
            },
            {
                "$sort": {"count": -1}
            },
            {
                "$limit": 10
            }
        ]
        
        resultado = []
        async for doc in self.tramites_collection.aggregate(pipeline):
            resultado.append({
                "departamento": doc["_id"] or "Sin Departamento",
                "cantidad": doc["count"]
            })
        
        return resultado
    
    async def _obtener_ultimos_tramites(self, limite: int = 5) -> List[Dict[str, Any]]:
        """Obtener los últimos trámites creados"""
        tramites = await self.tramites_collection.find(
            {},
            {"referencia": 1, "cliente": 1, "estado": 1, "fecha_creacion": 1, "prioridad": 1}
        ).sort("fecha_creacion", -1).limit(limite).to_list(length=None)
        
        return [
            {
                "id": str(t["_id"]),
                "referencia": t.get("referencia", "N/A"),
                "cliente": t.get("cliente", "N/A"),
                "estado": t.get("estado", "desconocido"),
                "prioridad": t.get("prioridad", "normal"),
                "fechaCreacion": t.get("fecha_creacion", None).isoformat() if t.get("fecha_creacion") else None
            }
            for t in tramites
        ]
    
    async def _contar_tramites_este_mes(self) -> int:
        """Contar trámites creados este mes"""
        ahora = datetime.utcnow()
        primer_dia_mes = datetime(ahora.year, ahora.month, 1)
        
        count = await self.tramites_collection.count_documents({
            "fecha_creacion": {"$gte": primer_dia_mes}
        })
        
        return count
