from fastapi import APIRouter

from app.providers.registry import get_provider_catalog


router = APIRouter(tags=["providers"])


@router.get("/providers")
def list_providers() -> dict[str, object]:
    return {"items": get_provider_catalog()}

