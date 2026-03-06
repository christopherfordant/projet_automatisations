from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_healthcheck() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"


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
