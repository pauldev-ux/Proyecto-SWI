from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database.connection import connect_to_mongo, disconnect_from_mongo
from app.routes import usuario_routes, politica_routes, tramite_routes, departamento_routes, dashboard_routes

# Crear aplicación FastAPI
app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Sistema de Gestión de Políticas de Negocio con MongoDB"
)

# Configurar CORS
origins = [
    "http://localhost:4200",
    "http://localhost:4300",
    "http://localhost:3000",
    "https://localhost:4200",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Eventos de ciclo de vida
@app.on_event("startup")
async def startup_db_client():
    """Conectar a MongoDB al iniciar"""
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    """Desconectar de MongoDB al apagar"""
    await disconnect_from_mongo()

# Incluir rutas
app.include_router(usuario_routes.router, prefix=settings.API_V1_STR)
app.include_router(politica_routes.router, prefix=settings.API_V1_STR)
app.include_router(tramite_routes.router, prefix=settings.API_V1_STR)
app.include_router(departamento_routes.router, prefix=settings.API_V1_STR)
app.include_router(dashboard_routes.router, prefix=settings.API_V1_STR)

# Ruta raíz
@app.get("/")
async def root():
    """Endpoint raíz"""
    return {
        "mensaje": "Sistema de Gestión de Políticas de Negocio",
        "versión": "1.0.0",
        "documentación": "/docs"
    }

@app.get("/health")
async def health_check():
    """Health check"""
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
