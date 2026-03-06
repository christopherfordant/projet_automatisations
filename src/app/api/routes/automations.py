from fastapi import APIRouter

from app.schemas.automation import (
    AutomationRequest,
    ClaimIntakeRequest,
    DocumentAnalysisRequest,
)
from app.services.automation_service import AutomationService


router = APIRouter(prefix="/automations", tags=["automations"])
service = AutomationService()


@router.post("/intake")
async def intake(payload: AutomationRequest) -> dict[str, object]:
    return await service.run_intake(payload)


@router.post("/claims-intake")
async def claims_intake(payload: ClaimIntakeRequest) -> dict[str, object]:
    return await service.run_claims_intake(payload)


@router.post("/document-analysis")
async def document_analysis(payload: DocumentAnalysisRequest) -> dict[str, object]:
    return await service.run_document_analysis(payload)
