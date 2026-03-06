from fastapi import APIRouter

from app.schemas.automation import AutomationRequest, DocumentAnalysisRequest
from app.services.automation_service import AutomationService


router = APIRouter(prefix="/automations", tags=["automations"])
service = AutomationService()


@router.post("/intake")
async def intake(payload: AutomationRequest) -> dict[str, object]:
    return await service.run_intake(payload)


@router.post("/document-analysis")
async def document_analysis(payload: DocumentAnalysisRequest) -> dict[str, object]:
    return await service.run_document_analysis(payload)

