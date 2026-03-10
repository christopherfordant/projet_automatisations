from fastapi import APIRouter

from app.connectors.company_workflow_catalog import (
    COMPANY_WORKFLOW_CATALOG,
    get_company_workflow_profile,
)
from app.schemas.automation import (
    AutomationRequest,
    ClaimIntakeBatchRequest,
    ClaimIntakeRequest,
    DocumentCompletenessRequest,
    DocumentAnalysisRequest,
    OperatorStatePayload,
)
from app.services.automation_service import AutomationService
from app.services.local_state_store import LocalStateStore


router = APIRouter(prefix="/automations", tags=["automations"])
service = AutomationService()
state_store = LocalStateStore()


@router.post("/intake")
async def intake(payload: AutomationRequest) -> dict[str, object]:
    return await service.run_intake(payload)


@router.post("/claims-intake")
async def claims_intake(payload: ClaimIntakeRequest) -> dict[str, object]:
    return await service.run_claims_intake(payload)


@router.post("/claims-intake/batch")
async def claims_intake_batch(payload: ClaimIntakeBatchRequest) -> dict[str, object]:
    return await service.run_claims_intake_batch(payload)


@router.post("/document-analysis")
async def document_analysis(payload: DocumentAnalysisRequest) -> dict[str, object]:
    return await service.run_document_analysis(payload)


@router.post("/document-completeness")
async def document_completeness(payload: DocumentCompletenessRequest) -> dict[str, object]:
    return await service.run_document_completeness(payload)


@router.get("/company-workflows")
async def company_workflows(profile: str | None = None) -> dict[str, object]:
    if profile:
        item = get_company_workflow_profile(profile)
        return {
            "items": [
                {
                    "code": item.code,
                    "label": item.label,
                    "target_company": item.target_company,
                    "positioning": item.positioning,
                    "priority_workflows": item.priority_workflows,
                    "workflow_labels": item.workflow_labels,
                }
            ]
        }

    return {
        "items": [
            {
                "code": item.code,
                "label": item.label,
                "target_company": item.target_company,
                "positioning": item.positioning,
                "priority_workflows": item.priority_workflows,
                "workflow_labels": item.workflow_labels,
            }
            for item in COMPANY_WORKFLOW_CATALOG.values()
        ]
    }


@router.get("/operator-state")
async def operator_state() -> dict[str, object]:
    return state_store.load_operator_state()


@router.put("/operator-state")
async def save_operator_state(payload: OperatorStatePayload) -> dict[str, object]:
    return state_store.save_operator_state(payload.model_dump())
