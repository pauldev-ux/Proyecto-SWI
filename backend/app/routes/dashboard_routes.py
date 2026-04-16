from fastapi import APIRouter, Depends
from app.services.dashboard_service import DashboardService
from app.database.connection import get_db

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

async def get_dashboard_service(db = Depends(get_db)) -> DashboardService:
    """Obtener instancia del servicio de dashboard"""
    return DashboardService(db)

@router.get("/estadisticas")
async def obtener_estadisticas(
    service: DashboardService = Depends(get_dashboard_service)
):
    """Obtener estadísticas generales del sistema"""
    return await service.obtener_estadisticas()
