from dataclasses import dataclass
from typing import Protocol


@dataclass(slots=True)
class PromptRequest:
    system_prompt: str
    user_prompt: str
    model: str


class AIProvider(Protocol):
    async def generate(self, prompt: PromptRequest) -> dict[str, str]: ...
