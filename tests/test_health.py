from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_healthcheck() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"


def test_home_page_is_available() -> None:
    response = client.get("/")
    assert response.status_code == 200
    assert "Tester le module claims intake sans coder" in response.text


def test_claims_intake_returns_structured_response() -> None:
    response = client.post(
        "/automations/claims-intake",
        json={
            "channel": "email",
            "claim_text": "Bonjour, j'ai une relance urgente pour un remboursement de facture en retard.",
            "attached_documents": ["facture dentaire"],
            "provider": "mock",
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["module"] == "claims_intake"
    assert payload["category"] == "reimbursement_followup"
    assert payload["priority"] == "high"
    assert "customer_id" in payload["missing_information"]
    assert payload["recommended_next_action"] == "request_missing_information"


def test_claims_intake_extracts_identifiers_from_text() -> None:
    response = client.post(
        "/automations/claims-intake",
        json={
            "channel": "email",
            "claim_text": (
                "Bonjour, client CL-2048, dossier DOS-7788, "
                "j'ai une relance urgente pour un remboursement de facture."
            ),
            "attached_documents": ["facture dentaire"],
            "provider": "mock",
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["customer_id"] == "CL-2048"
    assert payload["contract_id"] == "DOS-7788"
    assert "customer_id" not in payload["missing_information"]
    assert "contract_id" not in payload["missing_information"]


def test_claims_intake_returns_business_labels() -> None:
    response = client.post(
        "/automations/claims-intake",
        json={
            "channel": "email",
            "claim_text": "Bonjour, j'ai une relance urgente pour un remboursement de facture.",
            "attached_documents": [],
            "provider": "mock",
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["category_label"] == "Suivi de remboursement"
    assert payload["priority_label"] == "Haute"
    assert "Copie de facture" in payload["missing_information_labels"]


def test_claims_intake_batch_returns_summary() -> None:
    response = client.post(
        "/automations/claims-intake/batch",
        json={
            "items": [
                {
                    "channel": "email",
                    "customer_id": "CL-1",
                    "contract_id": "DOS-1",
                    "claim_text": "Remboursement urgent de facture.",
                    "attached_documents": ["facture"],
                    "provider": "mock",
                },
                {
                    "channel": "telephone",
                    "claim_text": "Je souhaite resilier mon contrat.",
                    "attached_documents": [],
                    "provider": "mock",
                },
            ]
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["summary"]["total_items"] == 2
    assert payload["summary"]["high_priority"] == 1
    assert payload["summary"]["categories"]["Suivi de remboursement"] == 1
