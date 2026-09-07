import asyncio
from types import SimpleNamespace

import httpx

from app.api.routes import health as health_route_module
from app.providers.base import PromptRequest
from app.providers.ollama_provider import OllamaProvider
from app.providers.perplexity_provider import PerplexityProvider
from app.services.verified_web_lookup import VerifiedWebLookupService


class _FailingResponse:
    def raise_for_status(self) -> None:
        request = httpx.Request("POST", "http://provider.test")
        response = httpx.Response(503, request=request)
        raise httpx.HTTPStatusError("provider unavailable", request=request, response=response)


class _FailingAsyncClient:
    async def __aenter__(self) -> "_FailingAsyncClient":
        return self

    async def __aexit__(self, *args: object) -> None:
        return None

    async def post(self, *args: object, **kwargs: object) -> _FailingResponse:
        return _FailingResponse()


def test_claims_api_rejects_empty_claim_text() -> None:
    from fastapi.testclient import TestClient

    from app.main import app

    response = TestClient(app).post(
        "/automations/claims-intake",
        json={"channel": "email", "claim_text": "", "attached_documents": []},
    )

    assert response.status_code == 422


def test_ollama_propagates_provider_http_error(monkeypatch) -> None:
    monkeypatch.setattr(
        "app.providers.ollama_provider.httpx.AsyncClient",
        lambda **kwargs: _FailingAsyncClient(),
    )

    with_exception = None
    try:
        asyncio.run(
            OllamaProvider().generate(
                PromptRequest(
                    system_prompt="system",
                    user_prompt="user",
                    model="test-model",
                )
            )
        )
    except httpx.HTTPStatusError as error:
        with_exception = error

    assert with_exception is not None
    assert with_exception.response.status_code == 503


def test_perplexity_requires_api_key(monkeypatch) -> None:
    monkeypatch.setattr(
        "app.providers.perplexity_provider.get_settings",
        lambda: SimpleNamespace(perplexity_api_key=""),
    )

    try:
        asyncio.run(
            PerplexityProvider().generate(
                PromptRequest(system_prompt="system", user_prompt="user", model="ignored")
            )
        )
    except ValueError as error:
        assert "PERPLEXITY_API_KEY" in str(error)
    else:
        raise AssertionError("Le provider doit refuser une clé Perplexity absente.")


def test_verified_lookup_rejects_untrusted_domain() -> None:
    service = VerifiedWebLookupService()

    assert service._is_allowed_domain("example.com") is False
    assert service._is_allowed_domain("ameli.fr") is True


def test_health_reports_postgres_down(monkeypatch) -> None:
    async def fake_http_check(url: str) -> dict[str, object]:
        return {"status": "up", "kind": "http", "target": url}

    async def fake_tcp_check(name: str, host: str, port: int) -> dict[str, object]:
        status = "down" if name == "postgres" else "up"
        return {
            "status": status,
            "kind": "tcp",
            "target": f"{host}:{port}",
            "service": name,
        }

    monkeypatch.setattr(health_route_module, "_check_http_service", fake_http_check)
    monkeypatch.setattr(health_route_module, "_check_tcp_service", fake_tcp_check)

    from fastapi.testclient import TestClient

    from app.main import app

    payload = TestClient(app).get("/health/n8n-stack").json()

    assert payload["status"] == "degraded"
    assert payload["services"]["postgres"]["status"] == "down"
