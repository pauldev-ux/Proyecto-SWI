from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from app.schemas.tramite_schema import (
    TramiteCreateSchema,
    TramiteUpdateSchema,
    TramiteSchema
)
from app.services.tramite_service import TramiteService
from app.database.connection import get_db

router = APIRouter(prefix="/tramites", tags=["tramites"])

async def get_tramite_service(db = Depends(get_db)) -> TramiteService:
    """Obtener instancia del servicio de trámites"""
    return TramiteService(db)

@router.post("", response_model=TramiteSchema, status_code=status.HTTP_201_CREATED)
async def crear_tramite(
    tramite: TramiteCreateSchema,
    service: TramiteService = Depends(get_tramite_service)
):
    """Crear un nuevo trámite"""
    try:
        nuevo_tramite = await service.crear_tramite(
            referencia=tramite.referencia,
            cliente=tramite.cliente,
            asunto=tramite.asunto,
            departamento=tramite.departamento,
            prioridad=tramite.prioridad,
            usuario_asignado=tramite.usuario_asignado
        )
        
        return {
            "id": str(nuevo_tramite["_id"]),
            "referencia": nuevo_tramite["referencia"],
            "cliente": nuevo_tramite["cliente"],
            "asunto": nuevo_tramite["asunto"],
            "departamento": nuevo_tramite["departamento"],
            "estado": nuevo_tramite["estado"],
            "prioridad": nuevo_tramite["prioridad"],
            "usuario_asignado": nuevo_tramite["usuario_asignado"],
            "fecha_creacion": nuevo_tramite["fecha_creacion"],
            "fecha_actualizacion": nuevo_tramite["fecha_actualizacion"]
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error al crear trámite")

@router.get("", response_model=List[TramiteSchema])
async def listar_tramites(
    estado: Optional[str] = None,
    departamento: Optional[str] = None,
    service: TramiteService = Depends(get_tramite_service)
):
    """Listar trámites con filtros opcionales"""
    tramites = await service.listar_tramites(estado=estado, departamento=departamento)
    
    return [
        {
            "id": str(t["_id"]),
            "referencia": t["referencia"],
            "cliente": t["cliente"],
            "asunto": t["asunto"],
            "departamento": t["departamento"],
            "estado": t["estado"],
            "prioridad": t["prioridad"],
            "usuario_asignado": t["usuario_asignado"],
            "fecha_creacion": t["fecha_creacion"],
            "fecha_actualizacion": t["fecha_actualizacion"]
        }
        for t in tramites
    ]

@router.get("/{tramite_id}", response_model=TramiteSchema)
async def obtener_tramite(
    tramite_id: str,
    service: TramiteService = Depends(get_tramite_service)
):
    """Obtener un trámite por ID"""
    tramite = await service.obtener_tramite_por_id(tramite_id)
    if not tramite:
        raise HTTPException(status_code=404, detail="Trámite no encontrado")
    
    return {
        "id": str(tramite["_id"]),
        "referencia": tramite["referencia"],
        "cliente": tramite["cliente"],
        "asunto": tramite["asunto"],
        "departamento": tramite["departamento"],
        "estado": tramite["estado"],
        "prioridad": tramite["prioridad"],
        "usuario_asignado": tramite["usuario_asignado"],
        "fecha_creacion": tramite["fecha_creacion"],
        "fecha_actualizacion": tramite["fecha_actualizacion"]
    }

@router.put("/{tramite_id}", response_model=TramiteSchema)
async def actualizar_tramite(
    tramite_id: str,
    tramite: TramiteUpdateSchema,
    service: TramiteService = Depends(get_tramite_service)
):
    """Actualizar un trámite"""
    try:
        # Filtrar solo los campos que se quieren actualizar
        datos = {k: v for k, v in tramite.dict().items() if v is not None}
        
        tramite_actualizado = await service.actualizar_tramite(tramite_id, datos)
        if not tramite_actualizado:
            raise HTTPException(status_code=404, detail="Trámite no encontrado")
        
        return {
            "id": str(tramite_actualizado["_id"]),
            "referencia": tramite_actualizado["referencia"],
            "cliente": tramite_actualizado["cliente"],
            "asunto": tramite_actualizado["asunto"],
            "departamento": tramite_actualizado["departamento"],
            "estado": tramite_actualizado["estado"],
            "prioridad": tramite_actualizado["prioridad"],
            "usuario_asignado": tramite_actualizado["usuario_asignado"],
            "fecha_creacion": tramite_actualizado["fecha_creacion"],
            "fecha_actualizacion": tramite_actualizado["fecha_actualizacion"]
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error al actualizar trámite")

@router.delete("/{tramite_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_tramite(
    tramite_id: str,
    service: TramiteService = Depends(get_tramite_service)
):
    """Eliminar un trámite"""
    success = await service.eliminar_tramite(tramite_id)
    if not success:
        raise HTTPException(status_code=404, detail="Trámite no encontrado")
    
    return None

@router.put("/{tramite_id}/estado/{nuevo_estado}", response_model=TramiteSchema)
async def cambiar_estado(
    tramite_id: str,
    nuevo_estado: str,
    service: TramiteService = Depends(get_tramite_service)
):
    """Cambiar el estado de un trámite"""
    # Validar que el estado sea válido
    estados_validos = ["solicitado", "en_proceso", "aceptado", "completado", "rechazado"]
    if nuevo_estado not in estados_validos:
        raise HTTPException(status_code=400, detail=f"Estado inválido. Debe ser uno de: {', '.join(estados_validos)}")
    
    tramite_actualizado = await service.cambiar_estado(tramite_id, nuevo_estado)
    if not tramite_actualizado:
        raise HTTPException(status_code=404, detail="Trámite no encontrado")
    
    return {
        "id": str(tramite_actualizado["_id"]),
        "referencia": tramite_actualizado["referencia"],
        "cliente": tramite_actualizado["cliente"],
        "asunto": tramite_actualizado["asunto"],
        "departamento": tramite_actualizado["departamento"],
        "estado": tramite_actualizado["estado"],
        "prioridad": tramite_actualizado["prioridad"],
        "usuario_asignado": tramite_actualizado["usuario_asignado"],
        "fecha_creacion": tramite_actualizado["fecha_creacion"],
        "fecha_actualizacion": tramite_actualizado["fecha_actualizacion"]
    }

@router.get("/cliente/{cliente}", response_model=List[TramiteSchema])
async def listar_por_cliente(
    cliente: str,
    service: TramiteService = Depends(get_tramite_service)
):
    """Listar trámites de un cliente específico"""
    tramites = await service.listar_por_cliente(cliente)
    
    return [
        {
            "id": str(t["_id"]),
            "referencia": t["referencia"],
            "cliente": t["cliente"],
            "asunto": t["asunto"],
            "departamento": t["departamento"],
            "estado": t["estado"],
            "prioridad": t["prioridad"],
            "usuario_asignado": t["usuario_asignado"],
            "fecha_creacion": t["fecha_creacion"],
            "fecha_actualizacion": t["fecha_actualizacion"]
        }
        for t in tramites
    ]

@router.get("/departamento/{departamento}", response_model=List[TramiteSchema])
async def listar_por_departamento(
    departamento: str,
    service: TramiteService = Depends(get_tramite_service)
):
    """Listar trámites de un departamento específico"""
    tramites = await service.listar_por_departamento(departamento)
    
    return [
        {
            "id": str(t["_id"]),
            "referencia": t["referencia"],
            "cliente": t["cliente"],
            "asunto": t["asunto"],
            "departamento": t["departamento"],
            "estado": t["estado"],
            "prioridad": t["prioridad"],
            "usuario_asignado": t["usuario_asignado"],
            "fecha_creacion": t["fecha_creacion"],
            "fecha_actualizacion": t["fecha_actualizacion"]
        }
        for t in tramites
    ]
