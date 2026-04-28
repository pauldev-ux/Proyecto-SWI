from fastapi import APIRouter, Depends, HTTPException, status

from app.database.connection import get_db
from app.schemas.chatbot_schema import MensajeChatbotSchema, BorradorTramiteSchema
from app.schemas.tramite_schema import TramiteSchema
from app.services.chatbot_service import ChatbotService

router = APIRouter(prefix="/chatbot", tags=["chatbot"])


async def get_chatbot_service(db=Depends(get_db)) -> ChatbotService:
    return ChatbotService(db)


@router.post("/interpretar", response_model=BorradorTramiteSchema)
async def interpretar_mensaje(
    payload: MensajeChatbotSchema,
    service: ChatbotService = Depends(get_chatbot_service),
):
    try:
        return await service.procesar_mensaje(payload.mensaje)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al interpretar el mensaje: {str(e)}")


@router.post("/confirmar", response_model=TramiteSchema, status_code=status.HTTP_201_CREATED)
async def confirmar_tramite(
    borrador: BorradorTramiteSchema,
    service: ChatbotService = Depends(get_chatbot_service),
):
    try:
        return await service.confirmar_creacion(borrador.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al confirmar el trámite: {str(e)}")