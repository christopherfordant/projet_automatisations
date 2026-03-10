import httpx

from app.core.config import get_settings
from app.providers.base import PromptRequest


class PerplexityProvider:
    async def generate(self, prompt: PromptRequest) -> dict[str, object]:
        settings = get_settings()
        if not settings.perplexity_api_key:
            raise ValueError("PERPLEXITY_API_KEY est requis pour utiliser le provider Perplexity.")

        payload = {
            "model": settings.perplexity_default_model,
            "messages": [
                {"role": "system", "content": prompt.system_prompt},
                {"role": "user", "content": prompt.user_prompt},
            ],
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{settings.perplexity_base_url.rstrip('/')}/chat/completions",
                json=payload,
                headers={
                    "Authorization": f"Bearer {settings.perplexity_api_key}",
                    "Content-Type": "application/json",
                },
            )
            response.raise_for_status()
            data = response.json()

        message = data["choices"][0]["message"]["content"]
        return {
            "provider": "perplexity",
            "model": settings.perplexity_default_model,
            "content": message,
            "citations": data.get("citations", []),
        }
