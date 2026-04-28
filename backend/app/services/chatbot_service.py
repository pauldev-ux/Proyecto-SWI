import re
import unicodedata
from datetime import datetime
from typing import Dict, Any, List, Optional

from app.services.ai_service import AIService
from app.services.usuario_service import UsuarioService
from app.services.departamento_service import DepartamentoService
from app.services.tramite_service import TramiteService


class ChatbotService:
    """Servicio para interpretar, validar y confirmar la creación de trámites."""

    def __init__(self, db):
        self.db = db
        self.ai_service = AIService()
        self.usuario_service = UsuarioService(db)
        self.departamento_service = DepartamentoService(db)
        self.tramite_service = TramiteService(db)

    async def procesar_mensaje(self, texto: str) -> Dict[str, Any]:
        texto = (texto or "").strip()
        if not texto:
            raise ValueError("El mensaje no puede estar vacío.")

        try:
            borrador = await self.ai_service.interpretar_instruccion_tramite(texto)
        except Exception:
            borrador = await self._interpretacion_local(texto)

        borrador = self._normalizar_borrador(borrador)

        faltantes: List[str] = list(borrador.get("faltantes", []))

        usuario = await self._buscar_solicitante(borrador.get("solicitante_id"))
        if borrador.get("solicitante_id") and not usuario:
            faltantes.append(f"El solicitante '{borrador.get('solicitante_id')}' no existe.")
            borrador["solicitante_id"] = None
        elif usuario:
            # Normalizamos al username, que es lo que mejor te funciona en frontend/backend
            borrador["solicitante_id"] = usuario.get("username")

        ruta_valida: List[str] = []
        for dep_nombre in borrador.get("ruta_departamentos", []):
            dep = await self._buscar_departamento_por_nombre(dep_nombre)
            if not dep:
                faltantes.append(f"El departamento '{dep_nombre}' no existe.")
                continue
            if not dep.get("activo", True):
                faltantes.append(f"El departamento '{dep.get('nombre', dep_nombre)}' está inactivo.")
                continue
            nombre_real = dep["nombre"]
            if nombre_real not in ruta_valida:
                ruta_valida.append(nombre_real)

        borrador["ruta_departamentos"] = ruta_valida

        if not borrador.get("solicitante_id") and "solicitante" not in faltantes:
            faltantes.append("solicitante")

        if not ruta_valida and "ruta_departamentos" not in faltantes:
            faltantes.append("ruta_departamentos")

        borrador["prioridad"] = self._normalizar_prioridad(borrador.get("prioridad"))
        borrador["asunto"] = (borrador.get("asunto") or "Trámite generado desde chatbot").strip()
        borrador["faltantes"] = faltantes
        borrador["requiere_confirmacion"] = len(faltantes) == 0

        return borrador

    async def confirmar_creacion(self, borrador: Dict[str, Any]) -> Dict[str, Any]:
        borrador = self._normalizar_borrador(borrador)

        if borrador.get("faltantes"):
            raise ValueError("El borrador todavía tiene datos faltantes o errores de validación.")

        usuario = await self._buscar_solicitante(borrador.get("solicitante_id"))
        if not usuario:
            raise ValueError("El solicitante indicado no existe.")

        ruta: List[str] = []
        for dep_nombre in borrador.get("ruta_departamentos", []):
            dep = await self._buscar_departamento_por_nombre(dep_nombre)
            if not dep:
                raise ValueError(f"El departamento '{dep_nombre}' no existe.")
            if not dep.get("activo", True):
                raise ValueError(f"El departamento '{dep['nombre']}' está inactivo.")
            if dep["nombre"] not in ruta:
                ruta.append(dep["nombre"])

        if not ruta:
            raise ValueError("La ruta del trámite no puede estar vacía.")

        referencia = await self._generar_referencia()
        asunto = (borrador.get("asunto") or "Trámite generado desde chatbot").strip()
        prioridad = self._normalizar_prioridad(borrador.get("prioridad"))

        nuevo_tramite = await self.tramite_service.crear_tramite(
            referencia=referencia,
            cliente=usuario["nombre"],
            asunto=asunto,
            departamento=ruta[0],
            ruta_departamentos=ruta,
            prioridad=prioridad,
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
            "usuario_asignado": nuevo_tramite.get("usuario_asignado"),
            "fecha_creacion": nuevo_tramite["fecha_creacion"],
            "fecha_actualizacion": nuevo_tramite["fecha_actualizacion"],
        }

    async def _buscar_solicitante(self, valor: Optional[str]) -> Optional[dict]:
        if not valor:
            return None

        usuario = await self.usuario_service.obtener_usuario_por_username(valor)
        if usuario:
            return usuario

        try:
            usuario = await self.usuario_service.obtener_usuario_por_id(valor)
        except Exception:
            usuario = None

        return usuario

    async def _buscar_departamento_por_nombre(self, nombre: str) -> Optional[dict]:
        if not nombre:
            return None

        dep = await self.departamento_service.obtener_departamento_por_nombre(nombre)
        if dep:
            return dep

        # fallback case-insensitive directo a la colección
        return await self.db["departamentos"].find_one({
            "nombre": {
                "$regex": f"^{re.escape(nombre)}$",
                "$options": "i"
            }
        })

    async def _generar_referencia(self) -> str:
        base = datetime.utcnow().strftime("TRM-%Y%m%d")
        secuencia = 1

        while True:
            referencia = f"{base}-{secuencia:03d}"
            existente = await self.tramite_service.obtener_por_referencia(referencia)
            if not existente:
                return referencia
            secuencia += 1

    def _normalizar_borrador(self, borrador: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "accion": borrador.get("accion") or "crear_tramite",
            "solicitante_id": borrador.get("solicitante_id"),
            "ruta_departamentos": list(borrador.get("ruta_departamentos") or []),
            "prioridad": borrador.get("prioridad") or "normal",
            "asunto": borrador.get("asunto"),
            "faltantes": list(borrador.get("faltantes") or []),
            "requiere_confirmacion": bool(borrador.get("requiere_confirmacion", False)),
        }

    def _normalizar_prioridad(self, prioridad: Optional[str]) -> str:
        valor = self._normalizar_texto(prioridad or "normal")

        mapa = {
            "baja": "baja",
            "normal": "normal",
            "media": "normal",
            "alta": "alta",
            "urgente": "urgente",
        }
        return mapa.get(valor, "normal")

    async def _interpretacion_local(self, texto: str) -> Dict[str, Any]:
        solicitante = self._extraer_solicitante(texto)
        prioridad = self._extraer_prioridad(texto)
        asunto = self._extraer_asunto(texto)
        ruta = await self._extraer_ruta_departamentos(texto)

        faltantes: List[str] = []
        if not solicitante:
            faltantes.append("solicitante")
        if not ruta:
            faltantes.append("ruta_departamentos")

        return {
            "accion": "crear_tramite",
            "solicitante_id": solicitante,
            "ruta_departamentos": ruta,
            "prioridad": prioridad,
            "asunto": asunto,
            "faltantes": faltantes,
            "requiere_confirmacion": False,
        }

    def _extraer_solicitante(self, texto: str) -> Optional[str]:
        patrones = [
            r"(?:solicitante|usuario|cliente)\s+([A-Za-z0-9_\-]+)",
            r"para\s+el\s+(?:solicitante|usuario|cliente)\s+([A-Za-z0-9_\-]+)",
            r"para\s+([A-Za-z0-9_\-]+)$",
        ]

        for patron in patrones:
            match = re.search(patron, texto, flags=re.IGNORECASE)
            if match:
                return match.group(1).strip()

        return None

    def _extraer_prioridad(self, texto: str) -> str:
        texto_norm = self._normalizar_texto(texto)

        if "urgente" in texto_norm:
            return "urgente"
        if "prioridad alta" in texto_norm or "alta" in texto_norm:
            return "alta"
        if "prioridad baja" in texto_norm or "baja" in texto_norm:
            return "baja"

        return "normal"

    def _extraer_asunto(self, texto: str) -> str:
        match = re.search(
            r"(?:asunto|tema|motivo)\s*[:\-]?\s*(.+?)(?:,| con prioridad| que pase| que comience| que empiece|$)",
            texto,
            flags=re.IGNORECASE
        )
        if match:
            return match.group(1).strip()

        return "Trámite generado desde chatbot"

    async def _extraer_ruta_departamentos(self, texto: str) -> List[str]:
        texto_norm = self._normalizar_texto(texto)
        departamentos_db = await self.db["departamentos"].find(
            {"activo": True},
            {"nombre": 1}
        ).to_list(length=None)

        coincidencias: List[tuple[int, str]] = []

        for dep in departamentos_db:
            nombre_real = dep["nombre"]
            nombre_norm = self._normalizar_texto(nombre_real)

            alias_set = {nombre_norm}
            if nombre_norm == "recursos humanos":
                alias_set.update({"rrhh", "rr. hh.", "rr hh", "rh"})
            if nombre_norm == "finanzas":
                alias_set.update({"finanza"})
            if nombre_norm == "legal":
                alias_set.update({"juridico", "jurídico"})
            if nombre_norm == "ventas":
                alias_set.update({"venta"})

            mejor_pos = None
            for alias in alias_set:
                pos = texto_norm.find(alias)
                if pos != -1 and (mejor_pos is None or pos < mejor_pos):
                    mejor_pos = pos

            if mejor_pos is not None:
                coincidencias.append((mejor_pos, nombre_real))

        coincidencias.sort(key=lambda x: x[0])

        ruta: List[str] = []
        for _, nombre in coincidencias:
            if nombre not in ruta:
                ruta.append(nombre)

        return ruta

    def _normalizar_texto(self, valor: str) -> str:
        valor = (valor or "").strip().lower()
        valor = unicodedata.normalize("NFD", valor)
        valor = "".join(ch for ch in valor if unicodedata.category(ch) != "Mn")
        return valor