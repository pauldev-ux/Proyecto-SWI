from typing import Dict, Any
from app.services.ai_service import AIService
from app.services.usuario_service import UsuarioService
from app.services.departamento_service import DepartamentoService

class ChatbotService:
    """Servicio para orquestar la interpretación y validación del Chatbot"""
    
    def __init__(self, db):
        self.db = db
        self.ai_service = AIService()
        self.usuario_service = UsuarioService(db)
        self.departamento_service = DepartamentoService(db)

    async def procesar_mensaje(self, texto: str) -> Dict[str, Any]:
        """
        Interpreta el mensaje con IA y luego valida los datos con la base de datos.
        """
        # 1. Obtener la interpretación estructurada desde la IA
        borrador = await self.ai_service.interpretar_instruccion_tramite(texto)
        
        faltantes = borrador.get("faltantes", [])
        
        # 2. Validar Solicitante
        solicitante_id_o_nombre = borrador.get("solicitante_id")
        if solicitante_id_o_nombre:
            # Buscar primero por username (que suele ser un string como "7", "cliente1")
            usuario = await self.usuario_service.obtener_usuario_por_username(solicitante_id_o_nombre)
            
            # Si no existe, intentar buscar por ID (si es un ObjectId válido)
            if not usuario:
                usuario = await self.usuario_service.obtener_usuario_por_id(solicitante_id_o_nombre)
                
            if not usuario:
                faltantes.append(f"El solicitante '{solicitante_id_o_nombre}' no existe en la base de datos.")
                borrador["solicitante_id"] = None
            else:
                if usuario.get("rol") != "cliente" and usuario.get("rol") != "solicitante":
                    # Si el rol no es estricto, tal vez sea un funcionario haciendo de cliente,
                    # pero generalmente debe ser cliente. Lo dejaremos pasar o advertir.
                    pass
                borrador["solicitante_id"] = usuario["username"]  # Normalizar al username
        
        # 3. Validar Departamentos en la ruta
        ruta_departamentos = borrador.get("ruta_departamentos", [])
        ruta_valida = []
        
        if ruta_departamentos:
            for dep_nombre in ruta_departamentos:
                # Buscar ignorando mayúsculas/minúsculas idealmente, pero usamos la busqueda exacta por ahora.
                # También se podría listar todos y comparar.
                dep = await self.departamento_service.obtener_departamento_por_nombre(dep_nombre)
                if not dep:
                    faltantes.append(f"El departamento '{dep_nombre}' no existe.")
                elif not dep.get("activo", True):
                    faltantes.append(f"El departamento '{dep_nombre}' está inactivo.")
                else:
                    ruta_valida.append(dep["nombre"])
                    
        borrador["ruta_departamentos"] = ruta_valida
        
        if not ruta_valida and "ruta_departamentos" not in faltantes and not faltantes:
             faltantes.append("ruta_departamentos")
             
        # Si la lista de válidos es menor a la extraida, faltan departamentos correctos.
        if len(ruta_valida) < len(ruta_departamentos) and "ruta_departamentos" not in faltantes:
            # Ya se agregó el mensaje especifico arriba
            pass

        borrador["faltantes"] = faltantes
        
        # Si faltan datos o hubo errores, requerimos aclaración
        if len(faltantes) > 0:
            borrador["requiere_confirmacion"] = False
        else:
            borrador["requiere_confirmacion"] = True
            
        return borrador
