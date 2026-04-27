from typing import Optional
from datetime import datetime
from enum import Enum

class RolUsuario(str, Enum):
    ADMIN = "admin"
    CLIENTE = "cliente"
    FUNCIONARIO = "funcionario"

class Usuario:
    def __init__(
        self,
        username: str,
        nombre: str,
        contraseña_hash: str,
        rol: RolUsuario = RolUsuario.FUNCIONARIO,
        departamento: Optional[str] = None,
        activo: bool = True,
        _id: Optional[str] = None,
        fecha_creacion: Optional[datetime] = None,
        ultimo_login: Optional[datetime] = None
    ):
        self._id = _id
        self.username = username
        self.nombre = nombre
        self.contraseña_hash = contraseña_hash
        self.rol = rol if isinstance(rol, RolUsuario) else RolUsuario(rol)
        self.departamento = departamento
        self.activo = activo
        self.fecha_creacion = fecha_creacion or datetime.utcnow()
        self.ultimo_login = ultimo_login

    def to_dict(self) -> dict:
        return {
            "_id": self._id,
            "username": self.username,
            "nombre": self.nombre,
            "contraseña_hash": self.contraseña_hash,
            "rol": self.rol.value,
            "departamento": self.departamento,
            "activo": self.activo,
            "fecha_creacion": self.fecha_creacion,
            "ultimo_login": self.ultimo_login
        }

    def to_dict_sin_contraseña(self) -> dict:
        data = self.to_dict()
        data.pop("contraseña_hash", None)
        return data