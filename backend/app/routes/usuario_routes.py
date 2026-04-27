from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.schemas.usuario_schema import (
    UsuarioCreateSchema,
    UsuarioRegistroSchema,
    UsuarioUpdateSchema,
    UsuarioSchema,
    LoginSchema,
    TokenSchema,
    RolUsuarioEnum
)
from app.services.usuario_service import UsuarioService
from app.database.connection import get_db

router = APIRouter(prefix="/usuarios", tags=["usuarios"])

async def get_usuario_service(db = Depends(get_db)) -> UsuarioService:
    """Obtener instancia del servicio de usuarios"""
    return UsuarioService(db)

def serializar_usuario(usuario: dict) -> dict:
    return {
        "id": str(usuario["_id"]),
        "username": usuario["username"],
        "nombre": usuario["nombre"],
        "rol": usuario["rol"],
        "departamento": usuario.get("departamento"),
        "activo": usuario["activo"],
        "fecha_creacion": usuario.get("fecha_creacion")
    }


@router.post("/registro", response_model=UsuarioSchema, status_code=status.HTTP_201_CREATED)
async def registrar_usuario(
    usuario: UsuarioRegistroSchema,
    service: UsuarioService = Depends(get_usuario_service)
):
    try:
        nuevo_usuario = await service.crear_usuario(
            username=usuario.username,
            nombre=usuario.nombre,
            contraseña=usuario.contraseña,
            rol=RolUsuarioEnum.CLIENTE.value
        )
        return serializar_usuario(nuevo_usuario)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/", response_model=UsuarioSchema, status_code=status.HTTP_201_CREATED)
async def crear_usuario(
    usuario: UsuarioCreateSchema,
    service: UsuarioService = Depends(get_usuario_service)
):
    try:
        nuevo_usuario = await service.crear_usuario(
            username=usuario.username,
            nombre=usuario.nombre,
            contraseña=usuario.contraseña,
            rol=usuario.rol.value,
            departamento=usuario.departamento
        )
        return serializar_usuario(nuevo_usuario)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login", response_model=TokenSchema)
async def login(
    credenciales: LoginSchema,
    service: UsuarioService = Depends(get_usuario_service)
):
    usuario = await service.obtener_usuario_por_username(credenciales.username)

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos"
        )

    if not usuario.get("activo", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo"
        )

    if not service.verificar_contraseña(
        credenciales.contraseña,
        usuario["contraseña_hash"]
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos"
        )

    await service.registrar_login(str(usuario["_id"]))
    token = service.crear_token_acceso(str(usuario["_id"]), usuario["username"])

    return {
        "access_token": token,
        "token_type": "bearer",
        "usuario": serializar_usuario(usuario)
    }

@router.get("/", response_model=List[UsuarioSchema])
async def listar_usuarios(
    rol: str = None,
    service: UsuarioService = Depends(get_usuario_service)
):
    """Listar todos los usuarios"""
    usuarios = await service.listar_usuarios(rol=rol)
    return [
        {
            "id": str(u["_id"]),
            "username": u["username"],
            "nombre": u["nombre"],
            "rol": u["rol"],
            "departamento": u.get("departamento"),
            "activo": u["activo"],
            "fecha_creacion": u["fecha_creacion"]
        }
        for u in usuarios
    ]

@router.get("/departamento/{departamento}")
async def listar_usuarios_por_departamento(
    departamento: str,
    service: UsuarioService = Depends(get_usuario_service)
):
    """Listar usuarios por departamento"""
    usuarios = await service.listar_usuarios_por_departamento(departamento)
    return [
        {
            "id": str(u["_id"]),
            "username": u["username"],
            "nombre": u["nombre"],
            "rol": u["rol"],
            "departamento": u.get("departamento"),
            "activo": u["activo"]
        }
        for u in usuarios
    ]

@router.get("/{usuario_id}", response_model=UsuarioSchema)
async def obtener_usuario(
    usuario_id: str,
    service: UsuarioService = Depends(get_usuario_service)
):
    """Obtener un usuario por ID"""
    usuario = await service.obtener_usuario_por_id(usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    return {
        "id": str(usuario["_id"]),
        "username": usuario["username"],
        "nombre": usuario["nombre"],
        "rol": usuario["rol"],
        "departamento": usuario.get("departamento"),
        "activo": usuario["activo"],
        "fecha_creacion": usuario["fecha_creacion"]
    }

@router.put("/{usuario_id}", response_model=UsuarioSchema)
async def actualizar_usuario(
    usuario_id: str,
    datos: UsuarioUpdateSchema,
    service: UsuarioService = Depends(get_usuario_service)
):
    """Actualizar un usuario"""
    actualizar = datos.dict(exclude_unset=True)
    usuario = await service.actualizar_usuario(usuario_id, actualizar)
    
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    return serializar_usuario(usuario)

@router.delete("/{usuario_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_usuario(
    usuario_id: str,
    service: UsuarioService = Depends(get_usuario_service)
):
    """Eliminar un usuario"""
    eliminado = await service.eliminar_usuario(usuario_id)
    
    if not eliminado:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    return None
