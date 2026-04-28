from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    """Configuración de la aplicación"""
    
    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_NAME: str = "politicas_negocio_db"
    
    # JWT
    SECRET_KEY: str = "your-secret-key-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Sistema de Gestión de Políticas de Negocio"
    
    # OpenAI
    OPENAI_API_KEY: Optional[str] = None
    
    class Config:
        env_file = ".env"

settings = Settings()
