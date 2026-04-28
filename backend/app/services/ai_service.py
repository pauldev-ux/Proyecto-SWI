import json
from openai import AsyncOpenAI
from app.core.config import settings
from typing import Dict, Any

class AIService:
    """Servicio para interacción con modelos de Lenguaje Natural (LLMs)"""
    
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        if self.api_key:
            self.client = AsyncOpenAI(api_key=self.api_key)
        else:
            self.client = None

    async def interpretar_instruccion_tramite(self, texto: str) -> Dict[str, Any]:
        """Interpreta una instrucción en lenguaje natural para crear un trámite."""
        
        # Si no hay API key, retornar un formato vacío simulado o lanzar error
        if not self.client:
            raise ValueError("No se ha configurado la API Key de OpenAI.")

        prompt_system = """Eres un asistente virtual especializado en la creación de trámites de una empresa.
Tu objetivo es extraer la información de la solicitud del usuario y devolver UNICAMENTE un objeto JSON válido.
No devuelvas ningún texto adicional ni uses bloques de código (```json ... ```) si no es estrictamente necesario, devuelve directamente la estructura.

El JSON debe tener la siguiente estructura exacta:
{
  "accion": "crear_tramite",
  "solicitante_id": "nombre o id del solicitante (o null si no se menciona)",
  "ruta_departamentos": ["Departamento 1", "Departamento 2"] (lista en orden de paso, vacía si no se menciona),
  "prioridad": "normal" (o "baja", "alta", "urgente" según se infiera. Por defecto "normal"),
  "asunto": "breve resumen de la intención (o null si no se menciona explícitamente)",
  "faltantes": [],
  "requiere_confirmacion": true
}

Si notas que falta la ruta de departamentos o el solicitante, agrégalo a la lista "faltantes" (ejemplo: ["solicitante", "ruta_departamentos"]).
Asegúrate de deducir bien la lista de departamentos en el orden exacto en el que el trámite debe pasar.
"""
        
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": prompt_system},
                    {"role": "user", "content": texto}
                ],
                temperature=0.0,
                response_format={ "type": "json_object" }
            )
            
            contenido = response.choices[0].message.content
            datos_extraidos = json.loads(contenido)
            
            # Garantizar que los campos existan aunque el LLM falle en darlos todos
            if "faltantes" not in datos_extraidos:
                datos_extraidos["faltantes"] = []
                
            if not datos_extraidos.get("solicitante_id"):
                if "solicitante" not in datos_extraidos["faltantes"]:
                    datos_extraidos["faltantes"].append("solicitante")
            
            if not datos_extraidos.get("ruta_departamentos") or len(datos_extraidos.get("ruta_departamentos")) == 0:
                if "ruta" not in datos_extraidos["faltantes"]:
                    datos_extraidos["faltantes"].append("ruta_departamentos")
                    
            return datos_extraidos
            
        except json.JSONDecodeError:
            raise ValueError("El modelo no devolvió un JSON válido.")
        except Exception as e:
            raise RuntimeError(f"Error al procesar con IA: {str(e)}")
