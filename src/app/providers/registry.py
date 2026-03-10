from app.core.config import get_settings
from app.providers.base import AIProvider
from app.providers.mock_provider import MockProvider
from app.providers.ollama_provider import OllamaProvider
from app.providers.perplexity_provider import PerplexityProvider


def get_provider(provider_name: str | None = None) -> AIProvider:
    settings = get_settings()
    selected = (provider_name or settings.default_ai_provider).lower()

    if selected == "ollama":
        return OllamaProvider()
    if selected == "perplexity":
        return PerplexityProvider()
    return MockProvider()


def get_provider_catalog() -> list[dict[str, str]]:
    settings = get_settings()
    return [
        {
            "name": "ollama",
            "mode": "local",
            "base_url": settings.ollama_base_url,
            "status": "configured",
        },
        {
            "name": "perplexity",
            "mode": "remote",
            "base_url": settings.perplexity_base_url,
            "status": "configured" if settings.perplexity_api_key else "missing_api_key",
        },
        {
            "name": "mock",
            "mode": "local",
            "base_url": "n/a",
            "status": "fallback",
        },
    ]
