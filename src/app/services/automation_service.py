import re

from app.connectors.mutuelle_catalog import CONNECTOR_CATALOG
from app.core.config import get_settings
from app.providers.base import PromptRequest
from app.providers.registry import get_provider
from app.schemas.automation import (
    AutomationRequest,
    ClaimIntakeRequest,
    DocumentAnalysisRequest,
)


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

    async def run_claims_intake(self, payload: ClaimIntakeRequest) -> dict[str, object]:
        settings = get_settings()
        provider = get_provider(payload.provider)
        normalized_text = payload.claim_text.lower()
        resolved_customer_id = payload.customer_id or self._extract_customer_id(payload.claim_text)
        resolved_contract_id = payload.contract_id or self._extract_contract_id(payload.claim_text)

        category = self._classify_claim_category(normalized_text)
        priority = self._classify_priority(normalized_text)
        missing_information = self._collect_missing_information(
            resolved_customer_id,
            resolved_contract_id,
            payload.attached_documents,
            normalized_text,
        )
        next_action = self._recommend_next_action(category, priority, missing_information)

        prompt = PromptRequest(
            system_prompt=(
                "Tu assistes une mutuelle dans la qualification d'une demande entrante. "
                "Tu donnes un court resume operateur en francais."
            ),
            user_prompt=(
                f"Canal: {payload.channel}\n"
                f"Client: {resolved_customer_id or 'inconnu'}\n"
                f"Contrat: {resolved_contract_id or 'inconnu'}\n"
                f"Categorie calculee: {category}\n"
                f"Priorite calculee: {priority}\n"
                f"Texte de la demande:\n{payload.claim_text}"
            ),
            model=settings.default_ai_model,
        )

        ai_result = await provider.generate(prompt)
        return {
            "module": "claims_intake",
            "customer_id": resolved_customer_id,
            "contract_id": resolved_contract_id,
            "category": category,
            "priority": priority,
            "missing_information": missing_information,
            "recommended_next_action": next_action,
            "documents_received": payload.attached_documents,
            "operator_summary": ai_result["content"],
            "ai_provider": ai_result["provider"],
            "ai_model": ai_result["model"],
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

    @staticmethod
    def _classify_claim_category(normalized_text: str) -> str:
        if any(token in normalized_text for token in ("hospital", "chirurg", "soin", "devis")):
            return "health_care_request"
        if any(token in normalized_text for token in ("rembourse", "facture", "feuille de soin")):
            return "reimbursement_followup"
        if any(token in normalized_text for token in ("resili", "resiliation", "radiation")):
            return "contract_change"
        if any(token in normalized_text for token in ("reclam", "plainte", "litige")):
            return "complaint"
        return "general_intake"

    @staticmethod
    def _classify_priority(normalized_text: str) -> str:
        if any(token in normalized_text for token in ("urgent", "bloque", "immediat", "48h")):
            return "high"
        if any(token in normalized_text for token in ("relance", "attente", "retard")):
            return "medium"
        return "normal"

    @staticmethod
    def _collect_missing_information(
        customer_id: str | None,
        contract_id: str | None,
        attached_documents: list[str],
        normalized_text: str,
    ) -> list[str]:
        missing: list[str] = []
        if not customer_id:
            missing.append("customer_id")
        if not contract_id:
            missing.append("contract_id")
        if "devis" in normalized_text and not attached_documents:
            missing.append("supporting_quote")
        if "facture" in normalized_text and not attached_documents:
            missing.append("invoice_copy")
        return missing

    @staticmethod
    def _extract_customer_id(claim_text: str) -> str | None:
        match = re.search(
            r"\b(?:client|adherent|adh[ée]rent|assur[ée]|id client)\s*[:#-]?\s*([A-Z0-9-]{4,})",
            claim_text,
            flags=re.IGNORECASE,
        )
        return match.group(1).upper() if match else None

    @staticmethod
    def _extract_contract_id(claim_text: str) -> str | None:
        match = re.search(
            r"\b(?:dossier|num[ée]ro dossier|ref(?:erence)? dossier|sinistre)\s*[:#-]?\s*([A-Z0-9-]{4,})",
            claim_text,
            flags=re.IGNORECASE,
        )
        return match.group(1).upper() if match else None

    @staticmethod
    def _recommend_next_action(category: str, priority: str, missing_information: list[str]) -> str:
        if missing_information:
            return "request_missing_information"
        if category == "complaint":
            return "route_to_complaints_team"
        if priority == "high":
            return "escalate_to_priority_queue"
        if category == "reimbursement_followup":
            return "route_to_reimbursement_queue"
        return "route_to_standard_operations"
