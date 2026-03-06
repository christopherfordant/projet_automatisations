from app.connectors.mutuelle_catalog import CONNECTOR_CATALOG
from app.core.config import get_settings
from app.providers.base import PromptRequest
from app.providers.registry import get_provider
from app.schemas.automation import AutomationRequest, DocumentAnalysisRequest


class AutomationService:
    async def run_intake(self, payload: AutomationRequest) -> dict[str, object]:
        settings = get_settings()
        provider = get_provider(payload.provider)
        prompt = PromptRequest(
            system_prompt=(
                "Tu es un orchestrateur expert d'automatisation pour mutuelles. "
                "Tu qualifies la demande, identifies le module cible et proposes la prochaine action."
            ),
            user_prompt=(
                f"Workflow: {payload.workflow_name}\n"
                f"Contexte: {payload.customer_context}\n"
                f"Entree: {payload.raw_input}"
            ),
            model=settings.default_ai_model,
        )
        result = await provider.generate(prompt)
        return {
            "workflow_name": payload.workflow_name,
            "available_connectors": [item.name for item in CONNECTOR_CATALOG],
            "result": result,
        }

    async def run_document_analysis(self, payload: DocumentAnalysisRequest) -> dict[str, object]:
        settings = get_settings()
        provider = get_provider(payload.provider)
        prompt = PromptRequest(
            system_prompt=(
                "Tu analyses un document metier mutuelle et retournes une lecture exploitable par une API."
            ),
            user_prompt=(
                f"Document: {payload.document_name}\n"
                f"Sortie attendue: {payload.expected_output}\n"
                f"Contenu:\n{payload.document_text}"
            ),
            model=settings.default_ai_model,
        )
        result = await provider.generate(prompt)
        return {
            "document_name": payload.document_name,
            "result": result,
        }

