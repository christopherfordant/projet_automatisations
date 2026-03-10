from fastapi.testclient import TestClient

from app.api.routes import automations as automations_route_module
from app.main import app
from app.services.local_state_store import LocalStateStore


client = TestClient(app)


def test_healthcheck() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"


def test_n8n_stack_healthcheck_returns_service_map() -> None:
    response = client.get("/health/n8n-stack")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] in {"ok", "degraded"}
    assert payload["services"]["fastapi"]["status"] == "up"
    assert set(payload["services"]) == {"fastapi", "n8n", "ollama", "postgres"}


def test_home_page_is_available() -> None:
    response = client.get("/")
    assert response.status_code == 200
    assert "Tester des workflows back-office sans coder" in response.text


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
    assert payload["business_status"] == "blocked"
    assert payload["business_status_label"] == "Bloque"


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
    assert payload["summary"]["business_statuses"]["Pret pour file prioritaire"] == 1


def test_claims_intake_complaint_is_marked_for_review() -> None:
    response = client.post(
        "/automations/claims-intake",
        json={
            "channel": "telephone",
            "customer_id": "CL-4000",
            "contract_id": "DOS-4000",
            "claim_text": "Bonjour, je souhaite faire une reclamation sur le traitement de mon dossier.",
            "attached_documents": [],
            "provider": "mock",
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["business_status"] == "to_review"
    assert payload["business_status_label"] == "A revoir"


def test_operator_state_can_be_saved_and_loaded(tmp_path, monkeypatch) -> None:
    store = LocalStateStore(str(tmp_path / "operator_state.db"))
    monkeypatch.setattr(automations_route_module, "state_store", store)

    payload = {
        "manual_status_overrides": {
            "Formulaire::CL-1::DOS-1::Texte": {"value": "blocked", "label": "Bloque"}
        },
        "action_log_entries": [
            {
                "timestamp": "10/03/2026 12:00:00",
                "action": "Batch lance",
                "source": "2 ligne(s)",
                "caseRef": "2 dossier(s)",
                "detail": "1 prioritaire(s), 1 incomplet(s)",
            }
        ],
        "last_batch_items": [
            {
                "customer_id": "CL-1",
                "contract_id": "DOS-1",
                "claim_text": "Texte",
                "priority": "high",
                "missing_information": [],
            }
        ],
        "selected_item_key": "Formulaire::CL-1::DOS-1::Texte",
    }

    save_response = client.put("/automations/operator-state", json=payload)
    assert save_response.status_code == 200
    saved = save_response.json()
    assert saved["manual_status_overrides"] == payload["manual_status_overrides"]
    assert saved["selected_item_key"] == payload["selected_item_key"]
    assert saved["saved_at"]

    load_response = client.get("/automations/operator-state")
    assert load_response.status_code == 200
    loaded = load_response.json()
    assert loaded["manual_status_overrides"] == payload["manual_status_overrides"]
    assert loaded["action_log_entries"][0]["action"] == "Batch lance"
    assert loaded["last_batch_items"][0]["contract_id"] == "DOS-1"
