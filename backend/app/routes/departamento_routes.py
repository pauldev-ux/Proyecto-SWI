from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.schemas.departamento_schema import (
    DepartamentoCreateSchema,
    DepartamentoUpdateSchema,
    DepartamentoSchema
)
from app.services.departamento_service import DepartamentoService
from app.database.connection import get_db

router = APIRouter(prefix="/departamentos", tags=["departamentos"])

async def get_departamento_service(db = Depends(get_db)) -> DepartamentoService:
    """Obtener instancia del servicio de departamentos"""
    return DepartamentoService(db)

@router.post("", response_model=DepartamentoSchema, status_code=status.HTTP_201_CREATED)
async def crear_departamento(
    departamento: DepartamentoCreateSchema,
    service: DepartamentoService = Depends(get_departamento_service)
):
    """Crear un nuevo departamento"""
    try:
        nuevo_departamento = await service.crear_departamento(
            nombre=departamento.nombre,
            codigo=departamento.codigo
        )
        return {
            "id": str(nuevo_departamento["_id"]),
            "nombre": nuevo_departamento["nombre"],
            "codigo": nuevo_departamento["codigo"],
            "activo": nuevo_departamento["activo"],
            "fecha_creacion": nuevo_departamento["fecha_creacion"],
            "fecha_actualizacion": nuevo_departamento["fecha_actualizacion"]
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("", response_model=List[DepartamentoSchema])
async def listar_departamentos(
    activos_solo: bool = False,
    service: DepartamentoService = Depends(get_departamento_service)
):
    """Listar todos los departamentos"""
    departamentos = await service.listar_departamentos(activos_solo=activos_solo)
    return [
        {
            "id": str(d["_id"]),
            "nombre": d["nombre"],
            "codigo": d["codigo"],
            "activo": d["activo"],
            "fecha_creacion": d["fecha_creacion"],
            "fecha_actualizacion": d["fecha_actualizacion"]
        }
        for d in departamentos
    ]

@router.get("/{departamento_id}", response_model=DepartamentoSchema)
async def obtener_departamento(
    departamento_id: str,
    service: DepartamentoService = Depends(get_departamento_service)
):
    """Obtener un departamento por ID"""
    departamento = await service.obtener_departamento_por_id(departamento_id)
    if not departamento:
        raise HTTPException(status_code=404, detail="Departamento no encontrado")
    
    return {
        "id": str(departamento["_id"]),
        "nombre": departamento["nombre"],
        "codigo": departamento["codigo"],
        "activo": departamento["activo"],
        "fecha_creacion": departamento["fecha_creacion"],
        "fecha_actualizacion": departamento["fecha_actualizacion"]
    }

@router.put("/{departamento_id}", response_model=DepartamentoSchema)
async def actualizar_departamento(
    departamento_id: str,
    datos: DepartamentoUpdateSchema,
    service: DepartamentoService = Depends(get_departamento_service)
):
    """Actualizar un departamento"""
    actualizar = datos.dict(exclude_unset=True)
    
    try:
        departamento = await service.actualizar_departamento(departamento_id, actualizar)
        
        if not departamento:
            raise HTTPException(status_code=404, detail="Departamento no encontrado")
        
        return {
            "id": str(departamento["_id"]),
            "nombre": departamento["nombre"],
            "codigo": departamento["codigo"],
            "activo": departamento["activo"],
            "fecha_creacion": departamento["fecha_creacion"],
            "fecha_actualizacion": departamento["fecha_actualizacion"]
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{departamento_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_departamento(
    departamento_id: str,
    service: DepartamentoService = Depends(get_departamento_service)
):
    """Eliminar un departamento (soft delete - marcar como inactivo)"""
    exitoso = await service.eliminar_departamento(departamento_id)
    if not exitoso:
        raise HTTPException(status_code=404, detail="Departamento no encontrado")
    return None

@router.post("/{departamento_id}/restaurar")
async def restaurar_departamento(
    departamento_id: str,
    service: DepartamentoService = Depends(get_departamento_service)
):
    """Restaurar un departamento inactivo"""
    exitoso = await service.restaurar_departamento(departamento_id)
    if not exitoso:
        raise HTTPException(status_code=404, detail="Departamento no encontrado")
    
    departamento = await service.obtener_departamento_por_id(departamento_id)
    return {
        "id": str(departamento["_id"]),
        "nombre": departamento["nombre"],
        "codigo": departamento["codigo"],
        "activo": departamento["activo"],
        "fecha_creacion": departamento["fecha_creacion"],
        "fecha_actualizacion": departamento["fecha_actualizacion"],
        "mensaje": "Departamento restaurado exitosamente"
    }
