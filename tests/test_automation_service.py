import asyncio

from app.schemas.automation import ClaimIntakeBatchRequest, ClaimIntakeRequest
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
