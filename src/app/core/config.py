from functools import lru_cache
from urllib.parse import urlparse

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = Field(default="mutuelle-ai-platform", alias="APP_NAME")
    app_env: str = Field(default="local", alias="APP_ENV")
    app_host: str = Field(default="127.0.0.1", alias="APP_HOST")
    app_port: int = Field(default=8000, alias="APP_PORT")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")

    default_ai_provider: str = Field(default="ollama", alias="DEFAULT_AI_PROVIDER")
    default_ai_model: str = Field(default="qwen2.5:7b", alias="DEFAULT_AI_MODEL")

    ollama_base_url: str = Field(default="http://127.0.0.1:11434/v1", alias="OLLAMA_BASE_URL")
    openai_base_url: str = Field(default="https://api.openai.com/v1", alias="OPENAI_BASE_URL")
    openai_api_key: str = Field(default="change-me-if-needed", alias="OPENAI_API_KEY")
    n8n_base_url: str = Field(default="http://127.0.0.1:5678", alias="N8N_BASE_URL")
    postgres_host: str = Field(default="127.0.0.1", alias="POSTGRES_HOST")
    postgres_port: int = Field(default=5432, alias="POSTGRES_PORT")
    web_lookup_timeout_seconds: float = Field(default=12.0, alias="WEB_LOOKUP_TIMEOUT_SECONDS")
    web_lookup_allowed_domains: str = Field(
        default="ameli.fr,service-public.fr,economie.gouv.fr",
        alias="WEB_LOOKUP_ALLOWED_DOMAINS",
    )

    @property
    def ollama_host(self) -> str:
        return urlparse(self.ollama_base_url).hostname or "127.0.0.1"

    @property
    def ollama_port(self) -> int:
        parsed = urlparse(self.ollama_base_url)
        return parsed.port or 11434

    @property
    def n8n_host(self) -> str:
        return urlparse(self.n8n_base_url).hostname or "127.0.0.1"

    @property
    def n8n_port(self) -> int:
        parsed = urlparse(self.n8n_base_url)
        return parsed.port or 5678


@lru_cache
def get_settings() -> Settings:
    return Settings()
