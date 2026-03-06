from fastapi import FastAPI

from app.api.routes.automations import router as automations_router
from app.api.routes.health import router as health_router
from app.api.routes.providers import router as providers_router
from app.core.config import get_settings


settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.include_router(health_router)
app.include_router(providers_router)
app.include_router(automations_router)

