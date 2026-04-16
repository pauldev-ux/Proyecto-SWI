from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
from app.core.config import settings

class MongoDB:
    """Manejador de conexión a MongoDB"""
    
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[object] = None

async def connect_to_mongo():
    """Conectar a MongoDB"""
    MongoDB.client = AsyncIOMotorClient(settings.MONGODB_URL)
    MongoDB.db = MongoDB.client[settings.MONGODB_NAME]
    print(f"Conectado a MongoDB: {settings.MONGODB_NAME}")

async def disconnect_from_mongo():
    """Desconectar de MongoDB"""
    if MongoDB.client is not None:
        MongoDB.client.close()
        print("Desconectado de MongoDB")

def get_db():
    """Obtener la instancia de la base de datos"""
    return MongoDB.db
