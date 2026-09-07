from __future__ import annotations

import socket

import httpx
from fastapi import APIRouter

from app.core.config import get_settings


router = APIRouter(tags=["health"])


@router.get("/health")
def healthcheck() -> dict[str, str]:
    settings = get_settings()
    return {
        "status": "ok",
        "environment": settings.app_env,
        "provider": settings.default_ai_provider,
    }


@router.get("/health/n8n-stack")
async def n8n_stack_healthcheck() -> dict[str, object]:
    settings = get_settings()
    services = {
        "fastapi": {
            "status": "up",
            "kind": "application",
            "target": f"http://{settings.app_host}:{settings.app_port}",
        },
        "n8n": await _check_http_service(settings.n8n_base_url),
        "ollama": await _check_tcp_service(
            name="ollama",
            host=settings.ollama_host,
            port=settings.ollama_port,
        ),
        "postgres": await _check_tcp_service(
            name="postgres",
            host=settings.postgres_host,
            port=settings.postgres_port,
        ),
    }
    overall_status = (
        "ok" if all(item["status"] == "up" for item in services.values()) else "degraded"
    )
    return {
        "status": overall_status,
        "environment": settings.app_env,
        "services": services,
    }


async def _check_http_service(url: str) -> dict[str, object]:
    try:
        async with httpx.AsyncClient(timeout=3.0, follow_redirects=True) as client:
            response = await client.get(url)
        return {
            "status": "up",
            "kind": "http",
            "target": url,
            "status_code": response.status_code,
        }
    except httpx.HTTPError as error:
        return {
            "status": "down",
            "kind": "http",
            "target": url,
            "error": str(error),
        }


async def _check_tcp_service(name: str, host: str, port: int) -> dict[str, object]:
    try:
        with socket.create_connection((host, port), timeout=3):
            return {
                "status": "up",
                "kind": "tcp",
                "target": f"{host}:{port}",
                "service": name,
            }
    except OSError as error:
        return {
            "status": "down",
            "kind": "tcp",
            "target": f"{host}:{port}",
            "service": name,
            "error": str(error),
        }
