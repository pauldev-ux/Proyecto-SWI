from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.schemas.politica_schema import (
    PoliticaNegocioCreateSchema,
    PoliticaNegocioUpdateSchema,
    PoliticaNegocioSchema
)
from app.services.politica_service import PoliticaNegocioService
from app.database.connection import get_db

router = APIRouter(prefix="/politicas", tags=["politicas"])

async def get_politica_service(db = Depends(get_db)) -> PoliticaNegocioService:
    """Obtener instancia del servicio de políticas"""
    return PoliticaNegocioService(db)

@router.post("/", response_model=PoliticaNegocioSchema, status_code=status.HTTP_201_CREATED)
async def crear_politica(
    politica: PoliticaNegocioCreateSchema,
    creado_por: str,
    service: PoliticaNegocioService = Depends(get_politica_service)
):
    """Crear una nueva política de negocio"""
    nueva_politica = await service.crear_politica(
        nombre=politica.nombre,
        descripcion=politica.descripcion,
        nodos=politica.nodos,
        conexiones=politica.conexiones,
        departamentos=politica.departamentos,
        creado_por=creado_por
    )
    
    return {
        "id": str(nueva_politica["_id"]),
        "nombre": nueva_politica["nombre"],
        "descripcion": nueva_politica["descripcion"],
        "nodos": nueva_politica["nodos"],
        "conexiones": nueva_politica["conexiones"],
        "departamentos": nueva_politica["departamentos"],
        "estado": nueva_politica["estado"],
        "creado_por": nueva_politica["creado_por"],
        "colaboradores": nueva_politica["colaboradores"],
        "fecha_creacion": nueva_politica["fecha_creacion"],
        "fecha_actualizacion": nueva_politica["fecha_actualizacion"]
    }

@router.get("/{politica_id}", response_model=PoliticaNegocioSchema)
async def obtener_politica(
    politica_id: str,
    service: PoliticaNegocioService = Depends(get_politica_service)
):
    """Obtener una política por ID"""
    politica = await service.obtener_politica(politica_id)
    if not politica:
        raise HTTPException(status_code=404, detail="Política no encontrada")
    
    return {
        "id": str(politica["_id"]),
        "nombre": politica["nombre"],
        "descripcion": politica["descripcion"],
        "nodos": politica["nodos"],
        "conexiones": politica["conexiones"],
        "departamentos": politica["departamentos"],
        "estado": politica["estado"],
        "creado_por": politica["creado_por"],
        "colaboradores": politica["colaboradores"],
        "fecha_creacion": politica["fecha_creacion"],
        "fecha_actualizacion": politica["fecha_actualizacion"]
    }

@router.get("/", response_model=List[PoliticaNegocioSchema])
async def listar_politicas(
    creado_por: str = None,
    service: PoliticaNegocioService = Depends(get_politica_service)
):
    """Listar políticas de negocio"""
    politicas = await service.listar_politicas(creado_por=creado_por)
    return [
        {
            "id": str(p["_id"]),
            "nombre": p["nombre"],
            "descripcion": p["descripcion"],
            "nodos": p["nodos"],
            "conexiones": p["conexiones"],
            "departamentos": p["departamentos"],
            "estado": p["estado"],
            "creado_por": p["creado_por"],
            "colaboradores": p["colaboradores"],
            "fecha_creacion": p["fecha_creacion"],
            "fecha_actualizacion": p["fecha_actualizacion"]
        }
        for p in politicas
    ]

@router.put("/{politica_id}", response_model=PoliticaNegocioSchema)
async def actualizar_politica(
    politica_id: str,
    datos: PoliticaNegocioUpdateSchema,
    service: PoliticaNegocioService = Depends(get_politica_service)
):
    """Actualizar una política de negocio"""
    actualizar = datos.dict(exclude_unset=True)
    if "estado" in actualizar:
        actualizar["estado"] = actualizar["estado"].value
    
    politica = await service.actualizar_politica(politica_id, actualizar)
    
    if not politica:
        raise HTTPException(status_code=404, detail="Política no encontrada")
    
    return {
        "id": str(politica["_id"]),
        "nombre": politica["nombre"],
        "descripcion": politica["descripcion"],
        "nodos": politica["nodos"],
        "conexiones": politica["conexiones"],
        "departamentos": politica["departamentos"],
        "estado": politica["estado"],
        "creado_por": politica["creado_por"],
        "colaboradores": politica["colaboradores"],
        "fecha_creacion": politica["fecha_creacion"],
        "fecha_actualizacion": politica["fecha_actualizacion"]
    }

@router.post("/{politica_id}/activar")
async def activar_politica(
    politica_id: str,
    service: PoliticaNegocioService = Depends(get_politica_service)
):
    """Activar una política de negocio"""
    exito = await service.activar_politica(politica_id)
    if not exito:
        raise HTTPException(status_code=404, detail="Política no encontrada")
    
    return {"mensaje": "Política activada exitosamente"}

@router.delete("/{politica_id}")
async def eliminar_politica(
    politica_id: str,
    service: PoliticaNegocioService = Depends(get_politica_service)
):
    """Eliminar una política de negocio"""
    exito = await service.eliminar_politica(politica_id)
    if not exito:
        raise HTTPException(status_code=404, detail="Política no encontrada")
    
    return {"mensaje": "Política eliminada exitosamente"}
