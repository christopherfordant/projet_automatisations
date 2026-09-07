import httpx

from app.core.config import get_settings
from app.providers.base import PromptRequest


class OllamaProvider:
    async def generate(self, prompt: PromptRequest) -> dict[str, str]:
        settings = get_settings()
        payload = {
            "model": prompt.model,
            "messages": [
                {"role": "system", "content": prompt.system_prompt},
                {"role": "user", "content": prompt.user_prompt},
            ],
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{settings.ollama_base_url}/chat/completions",
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

        message = data["choices"][0]["message"]["content"]
        return {"provider": "ollama", "model": prompt.model, "content": message}
