from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database.connection import connect_to_mongo, disconnect_from_mongo
from app.routes import usuario_routes, tramite_routes, departamento_routes, dashboard_routes, chatbot_routes
from app.services.usuario_service import UsuarioService
from app.database.connection import get_db

# Crear aplicación FastAPI
app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Sistema de Gestión de Trámites y Departamentos con MongoDB"
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
    await crear_admin_default()

async def crear_admin_default():
    """Crear o actualizar el usuario administrador por defecto"""
    db = get_db()
    if db is None:
        return

    service = UsuarioService(db)
    admin_usuario = await service.obtener_usuario_por_username("admin")

    if admin_usuario:
        if admin_usuario.get("rol") != "admin" or not service.verificar_contraseña("123456", admin_usuario["contraseña_hash"]):
            await service.actualizar_usuario(
                str(admin_usuario["_id"]),
                {
                    "rol": "admin",
                    "contraseña_hash": service.hash_contraseña("123456"),
                    "activo": True
                }
            )
    else:
        await service.crear_usuario(
            username="admin",
            nombre="Administrador",
            contraseña="123456",
            rol="admin"
        )

@app.on_event("shutdown")
async def shutdown_db_client():
    """Desconectar de MongoDB al apagar"""
    await disconnect_from_mongo()

# Incluir rutas
app.include_router(usuario_routes.router, prefix=settings.API_V1_STR)
app.include_router(tramite_routes.router, prefix=settings.API_V1_STR)
app.include_router(departamento_routes.router, prefix=settings.API_V1_STR)
app.include_router(dashboard_routes.router, prefix=settings.API_V1_STR)
app.include_router(chatbot_routes.router, prefix=settings.API_V1_STR)

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
    uvicorn.run(app, host="0.0.0.0", port=8000)
