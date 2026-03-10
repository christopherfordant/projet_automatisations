import asyncio

from app.schemas.automation import (
    ClaimIntakeBatchRequest,
    ClaimIntakeRequest,
    DocumentCompletenessRequest,
)
from app.services.automation_service import AutomationService


def test_claims_intake_adds_attention_and_friction_flags() -> None:
    service = AutomationService()

    result = asyncio.run(
        service.run_claims_intake(
            ClaimIntakeRequest(
                channel="email",
                claim_text=(
                    "Bonjour, client CL-1001, dossier DOS-2002, je fais une deuxieme relance "
                    "urgente pour une hospitalisation et une prise en charge sans retour."
                ),
                attached_documents=[],
                provider="mock",
            )
        )
    )

    assert result["attention_score"] >= 60
    assert result["attention_level"] in {"elevated", "critical"}
    assert "Relance detectee" in result["friction_flag_labels"]
    assert "Contexte medical urgent" in result["friction_flag_labels"]


def test_claims_intake_batch_marks_duplicate_cases() -> None:
    service = AutomationService()

    payload = ClaimIntakeBatchRequest(
        items=[
            ClaimIntakeRequest(
                channel="email",
                customer_id="CL-3001",
                contract_id="DOS-9912",
                claim_text="Je relance un remboursement de facture sans retour.",
                attached_documents=["facture dentaire"],
                provider="mock",
            ),
            ClaimIntakeRequest(
                channel="portail",
                customer_id="CL-3001",
                contract_id="DOS-9912",
                claim_text="Nouvelle relance pour le meme remboursement sans retour.",
                attached_documents=["facture dentaire"],
                provider="mock",
            ),
        ]
    )

    result = asyncio.run(service.run_claims_intake_batch(payload))

    assert result["summary"]["duplicate_suspicions"] == 2
    assert result["summary"]["critical_attention"] >= 0
    assert all(item["duplicate_suspected"] for item in result["items"])
    assert all(item["duplicate_cluster_size"] == 2 for item in result["items"])
    assert all("Possible doublon batch" in item["friction_flag_labels"] for item in result["items"])


def test_claims_intake_missing_info_generates_client_message() -> None:
    service = AutomationService()

    result = asyncio.run(
        service.run_claims_intake(
            ClaimIntakeRequest(
                channel="email",
                customer_id="CL-8122",
                claim_text="Bonjour, je souhaite un remboursement de facture.",
                attached_documents=[],
                provider="mock",
            )
        )
    )

    assert "Informations manquantes" in result["client_request_subject"]
    assert "Numero dossier" in result["client_request_message"]
    assert "Copie de facture" in result["client_request_message"]


def test_document_completeness_returns_missing_required_documents() -> None:
    service = AutomationService()

    result = asyncio.run(
        service.run_document_completeness(
            DocumentCompletenessRequest(
                document_type="optical_quote",
                customer_id="CL-4001",
                contract_id="DOS-7788",
                document_text="Bonjour, je transmets mon devis optique avec mon numero adherent pour etude.",
                attached_documents=["devis optique", "numero adherent"],
                message_tone="direct",
                output_channel="sms",
                provider="mock",
            )
        )
    )

    assert result["document_type_label"] == "Devis optique"
    assert result["readiness_status"] == "partial"
    assert "Ordonnance" in result["missing_required_labels"]
    assert result["client_request_subject"] == ""
    assert "Ordonnance" in result["client_request_message"]
    assert "dossier finalisable" in result["client_request_message"]


def test_document_completeness_can_be_ready() -> None:
    service = AutomationService()

    result = asyncio.run(
        service.run_document_completeness(
            DocumentCompletenessRequest(
                document_type="reimbursement",
                customer_id="CL-5001",
                contract_id="DOS-9900",
                document_text=(
                    "Bonjour, client CL-5001, dossier DOS-9900, je joins la facture et le numero adherent "
                    "pour mon remboursement."
                ),
                attached_documents=["facture", "numero adherent", "reference dossier"],
                message_tone="commercial",
                output_channel="courrier",
                provider="mock",
            )
        )
    )

    assert result["readiness_status"] == "ready"
    assert result["completion_ratio"] == 100
    assert result["missing_required_labels"] == []
    assert "Dossier complet" in result["client_request_subject"]
    assert "merci pour votre envoi" in result["client_request_message"].lower()
    assert "salutations distinguees" in result["client_request_message"].lower()


def test_claims_intake_can_attach_verified_web_sources(monkeypatch) -> None:
    service = AutomationService()

    async def fake_lookup_claim_sources(missing_information: list[str]) -> list[dict[str, object]]:
        assert "invoice_copy" in missing_information
        return [
            {
                "lookup_key": "invoice_copy",
                "title": "Feuille de soins papier",
                "url": "https://www.ameli.fr/example",
                "domain": "ameli.fr",
                "checked_at": "2026-03-09T10:00:00+00:00",
                "verified": True,
                "snippet": "Source officielle.",
            }
        ]

    monkeypatch.setattr(service.web_lookup_service, "lookup_claim_sources", fake_lookup_claim_sources)

    result = asyncio.run(
        service.run_claims_intake(
            ClaimIntakeRequest(
                channel="email",
                customer_id="CL-8122",
                claim_text="Bonjour, je souhaite un remboursement de facture.",
                attached_documents=[],
                web_lookup_enabled=True,
                provider="mock",
            )
        )
    )

    assert result["web_lookup_used"] is True
    assert result["verified_web_sources"][0]["domain"] == "ameli.fr"


def test_claims_intake_selects_company_specific_workflow() -> None:
    service = AutomationService()

    result = asyncio.run(
        service.run_claims_intake(
            ClaimIntakeRequest(
                carrier_profile="macif",
                channel="email",
                customer_id="CL-9911",
                contract_id="DOS-9911",
                claim_text="Bonjour, je depose une reclamation sur le retard de traitement de mon dossier.",
                attached_documents=["courrier reclamation"],
                provider="mock",
            )
        )
    )

    assert result["carrier_profile"] == "macif"
    assert result["target_workflow"] == "macif_reclamations_sensibles"
    assert result["target_workflow_label"] == "Triage des reclamations sensibles"


def test_document_completeness_can_attach_verified_web_sources(monkeypatch) -> None:
    service = AutomationService()

    async def fake_lookup_document_sources(
        document_type: str,
        missing_required_documents: list[str],
    ) -> list[dict[str, object]]:
        assert document_type == "complaint"
        assert "historique echanges" in missing_required_documents
        return [
            {
                "lookup_key": "document_type:complaint",
                "title": "Litige avec une mutuelle",
                "url": "https://www.service-public.fr/example",
                "domain": "service-public.fr",
                "checked_at": "2026-03-09T10:00:00+00:00",
                "verified": True,
                "snippet": "Source officielle.",
            }
        ]

    monkeypatch.setattr(
        service.web_lookup_service,
        "lookup_document_sources",
        fake_lookup_document_sources,
    )

    result = asyncio.run(
        service.run_document_completeness(
            DocumentCompletenessRequest(
                document_type="complaint",
                customer_id="CL-4001",
                contract_id="DOS-7788",
                document_text="Bonjour, je depose une reclamation ecrite avec mon numero dossier.",
                attached_documents=["courrier de reclamation", "numero dossier"],
                message_tone="neutral",
                output_channel="email",
                web_lookup_enabled=True,
                provider="mock",
            )
        )
    )

    assert result["web_lookup_used"] is True
    assert result["verified_web_sources"][0]["domain"] == "service-public.fr"


def test_document_completeness_selects_company_specific_workflow() -> None:
    service = AutomationService()

    result = asyncio.run(
        service.run_document_completeness(
            DocumentCompletenessRequest(
                carrier_profile="maaf",
                document_type="optical_quote",
                customer_id="CL-4001",
                contract_id="DOS-7788",
                document_text="Bonjour, je transmets mon devis optique avec mon numero adherent pour etude.",
                attached_documents=["devis optique", "numero adherent"],
                message_tone="neutral",
                output_channel="email",
                provider="mock",
            )
        )
    )

    assert result["carrier_profile"] == "maaf"
    assert result["target_workflow"] == "maaf_devis_optique_dentaire"
    assert result["target_workflow_label"] == "Controle devis optique et dentaire"
