from pydantic import BaseModel, Field
from typing import List, Optional


class MensajeChatbotSchema(BaseModel):
    mensaje: str = Field(..., min_length=1)


class BorradorTramiteSchema(BaseModel):
    accion: str = "crear_tramite"
    solicitante_id: Optional[str] = None
    ruta_departamentos: List[str] = Field(default_factory=list)
    prioridad: str = "normal"
    asunto: Optional[str] = None
    faltantes: List[str] = Field(default_factory=list)
    requiere_confirmacion: bool = False