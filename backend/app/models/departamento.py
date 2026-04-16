from datetime import datetime

class Departamento:
    """Modelo de Departamento"""
    
    def __init__(
        self,
        nombre: str,
        codigo: str = None,
        activo: bool = True,
        _id = None
    ):
        self._id = _id
        self.nombre = nombre
        self.codigo = codigo
        self.activo = activo
        self.fecha_creacion = datetime.utcnow() if _id is None else None
        self.fecha_actualizacion = None
