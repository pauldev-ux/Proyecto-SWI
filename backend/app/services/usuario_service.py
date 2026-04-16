from typing import Optional, Dict, Any
from bson.objectid import ObjectId
from datetime import datetime, timedelta
from passlib.context import CryptContext
import jwt
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UsuarioService:
    """Servicio para gestionar usuarios"""
    
    def __init__(self, db):
        self.db = db
        self.collection = db["usuarios"]
    
    def hash_contraseña(self, contraseña: str) -> str:
        """Hashear una contraseña"""
        return pwd_context.hash(contraseña)
    
    def verificar_contraseña(self, contraseña: str, hash_contraseña: str) -> bool:
        """Verificar una contraseña contra su hash"""
        return pwd_context.verify(contraseña, hash_contraseña)
    
    async def crear_usuario(
        self,
        username: str,
        nombre: str,
        contraseña: str,
        rol: str = "funcionario",
        departamento: Optional[str] = None
    ) -> Dict[str, Any]:
        """Crear un nuevo usuario"""
        # Verificar que el username no exista
        existe = await self.collection.find_one({"username": username})
        if existe:
            raise ValueError(f"El usuario '{username}' ya está registrado")
        
        usuario = {
            "username": username,
            "nombre": nombre,
            "contraseña_hash": self.hash_contraseña(contraseña),
            "rol": rol,
            "departamento": departamento,
            "activo": True,
            "fecha_creacion": datetime.utcnow(),
            "ultimo_login": None
        }
        
        resultado = await self.collection.insert_one(usuario)
        usuario["_id"] = resultado.inserted_id
        return usuario
    
    async def obtener_usuario_por_username(self, username: str) -> Optional[Dict[str, Any]]:
        """Obtener usuario por username"""
        return await self.collection.find_one({"username": username})
    
    async def obtener_usuario_por_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Obtener usuario por email (deprecated, usar username)"""
        return await self.collection.find_one({"email": email})
    
    async def obtener_usuario_por_id(self, usuario_id: str) -> Optional[Dict[str, Any]]:
        """Obtener usuario por ID"""
        try:
            return await self.collection.find_one({"_id": ObjectId(usuario_id)})
        except:
            return None
    
    async def listar_usuarios(self, rol: Optional[str] = None) -> list:
        """Listar usuarios"""
        query = {}
        if rol:
            query["rol"] = rol
        
        cursor = self.collection.find(query)
        return await cursor.to_list(length=None)
    
    async def listar_usuarios_por_departamento(self, departamento: str) -> list:
        """Listar usuarios por departamento"""
        cursor = self.collection.find({"departamento": departamento, "activo": True})
        return await cursor.to_list(length=None)
    
    async def actualizar_usuario(
        self,
        usuario_id: str,
        datos: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Actualizar un usuario"""
        try:
            resultado = await self.collection.find_one_and_update(
                {"_id": ObjectId(usuario_id)},
                {"$set": datos},
                return_document=True
            )
            return resultado
        except:
            return None
    
    async def registrar_login(self, usuario_id: str) -> bool:
        """Registrar el último login de un usuario"""
        try:
            await self.actualizar_usuario(usuario_id, {"ultimo_login": datetime.utcnow()})
            return True
        except:
            return False
    
    async def eliminar_usuario(self, usuario_id: str) -> bool:
        """Eliminar un usuario"""
        try:
            resultado = await self.collection.delete_one({"_id": ObjectId(usuario_id)})
            return resultado.deleted_count > 0
        except:
            return False
    
    def crear_token_acceso(self, usuario_id: str, username: str) -> str:
        """Crear un JWT token"""
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode = {"sub": usuario_id, "username": username, "exp": expire}
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt
    
    def verificar_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verificar y decodificar un JWT token"""
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            return payload
        except:
            return None
