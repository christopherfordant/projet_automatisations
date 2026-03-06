from app.providers.base import PromptRequest


class MockProvider:
    async def generate(self, prompt: PromptRequest) -> dict[str, str]:
        return {
            "provider": "mock",
            "model": prompt.model,
            "content": (
                "Simulation locale: structure de reponse prete pour brancher un moteur IA "
                "compatible OpenAI."
            ),
        }

