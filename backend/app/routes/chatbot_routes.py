from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional, Any, Dict
import datetime
import random
import string

from app.database.connection import get_db
from app.services.chatbot_service import ChatbotService
from app.services.tramite_service import TramiteService
from app.schemas.tramite_schema import TramiteSchema

router = APIRouter(prefix="/chatbot", tags=["chatbot"])

class ChatMessage(BaseModel):
    mensaje: str

class BorradorConfirmacion(BaseModel):
    accion: str
    solicitante_id: str
    ruta_departamentos: List[str]
    prioridad: str
    asunto: Optional[str] = None
    
async def get_chatbot_service(db = Depends(get_db)) -> ChatbotService:
    return ChatbotService(db)

async def get_tramite_service(db = Depends(get_db)) -> TramiteService:
    return TramiteService(db)

def generar_referencia() -> str:
    """Genera una referencia única para el trámite"""
    fecha = datetime.datetime.now().strftime("%Y%m%d")
    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"TRM-{fecha}-{random_str}"

@router.post("/interpretar", response_model=Dict[str, Any])
async def interpretar_mensaje(
    chat_message: ChatMessage,
    service: ChatbotService = Depends(get_chatbot_service)
):
    """
    Recibe un mensaje en lenguaje natural, lo procesa con IA y 
    devuelve un borrador estructurado validado.
    """
    try:
        resultado = await service.procesar_mensaje(chat_message.mensaje)
        return resultado
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/confirmar", response_model=TramiteSchema, status_code=status.HTTP_201_CREATED)
async def confirmar_tramite(
    borrador: BorradorConfirmacion,
    service: TramiteService = Depends(get_tramite_service)
):
    """
    Recibe el borrador validado y crea el trámite real en la base de datos.
    """
    if not borrador.solicitante_id or not borrador.ruta_departamentos:
        raise HTTPException(status_code=400, detail="Faltan datos obligatorios en el borrador (solicitante o ruta).")
        
    try:
        # Generar referencia automáticamente
        referencia = generar_referencia()
        
        # Verificar que la referencia sea única (por si acaso hay colisión)
        while await service.obtener_tramite_por_referencia(referencia):
             referencia = generar_referencia()
             
        nuevo_tramite = await service.crear_tramite(
            referencia=referencia,
            cliente=borrador.solicitante_id,
            asunto=borrador.asunto or "Trámite generado desde asistente",
            departamento=borrador.ruta_departamentos[0], # Empieza en el primero
            ruta_departamentos=borrador.ruta_departamentos,
            prioridad=borrador.prioridad,
            usuario_asignado=None
        )
        
        return {
            "id": str(nuevo_tramite["_id"]),
            "referencia": nuevo_tramite["referencia"],
            "cliente": nuevo_tramite["cliente"],
            "asunto": nuevo_tramite["asunto"],
            "departamento": nuevo_tramite["departamento"],
            "ruta_departamentos": nuevo_tramite.get("ruta_departamentos"),
            "estado": nuevo_tramite["estado"],
            "prioridad": nuevo_tramite["prioridad"],
            "usuario_asignado": nuevo_tramite["usuario_asignado"],
            "fecha_creacion": nuevo_tramite["fecha_creacion"],
            "fecha_actualizacion": nuevo_tramite["fecha_actualizacion"]
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al crear trámite: {str(e)}")
