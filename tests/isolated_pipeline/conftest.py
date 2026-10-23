"""Offline-only fixtures; no n8n runtime, credentials, or listening server."""

import asyncio
import importlib
import importlib.util
import json
import os
from pathlib import Path
import shutil
import socket
import subprocess

import httpx
import pytest
from fastapi import FastAPI


ROOT = Path(__file__).resolve().parents[2]


@pytest.fixture(scope="session")
def isolated_loop():
    # CPython on Windows creates a loopback socketpair for its internal wake-up
    # pipe. Create it before the application-network guard, then reuse one loop.
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(autouse=True)
def no_network(monkeypatch, isolated_loop):
    attempts = []

    def deny(*args, **kwargs):
        attempts.append("blocked")
        raise AssertionError("Network access is forbidden in the isolated suite")

    for name in ("connect", "connect_ex"):
        monkeypatch.setattr(socket.socket, name, deny)
    monkeypatch.setattr(socket, "create_connection", deny)
    monkeypatch.setattr(socket, "getaddrinfo", deny)
    yield
    assert not attempts, "A test attempted real network access"


@pytest.fixture
def run_node_code():
    node = shutil.which("node")
    if node is None:
        pytest.fail("Existing Node.js is required; nothing is installed automatically")
    runner = Path(__file__).with_name("run_parser.cjs")

    def run(code, body):
        # No inherited tokens, NODE_OPTIONS, user profile, or network globals in the VM.
        env = {k: os.environ[k] for k in ("SystemRoot", "WINDIR", "TEMP", "TMP") if k in os.environ}
        completed = subprocess.run(
            [node, str(runner)],
            input=json.dumps({"code": code, "body": body}),
            capture_output=True,
            text=True,
            encoding="utf-8",
            timeout=5,
            env=env,
            cwd=ROOT,
            check=True,
        )
        return json.loads(completed.stdout)

    return run


@pytest.fixture
def parse_csv(run_node_code):
    workflow = json.loads(
        (ROOT / "n8n/workflows/full_csv_claims_pipeline.json").read_text(encoding="utf-8-sig")
    )
    code = next(n["parameters"]["jsCode"] for n in workflow["nodes"] if n["type"].endswith(".code"))

    def parse(content, **metadata):
        return run_node_code(code, {"csv_content": content, **metadata})[0]["json"]

    return parse


@pytest.fixture
def offline_api(monkeypatch, tmp_path, isolated_loop):
    from app.core import config
    from app.providers.mock_provider import MockProvider
    from app.services import local_state_store

    settings = config.Settings(
        _env_file=None,
        DEFAULT_AI_PROVIDER="mock",
        DEFAULT_AI_MODEL="offline-test",
        PERPLEXITY_API_KEY="",
        GAMMA_API_KEY="",
        OPENAI_API_KEY="",
        LOCAL_STATE_DB_PATH=str(tmp_path / "unused.sqlite"),
    )
    monkeypatch.setattr(config, "get_settings", lambda: settings)
    # Import the actual route without initializing its unrelated disk state store.
    monkeypatch.setattr(local_state_store, "LocalStateStore", lambda: object())
    # Load the actual route source under a private module name so its temporary
    # store/service objects cannot contaminate other tests' canonical module.
    spec = importlib.util.spec_from_file_location(
        "_isolated_automations_routes", ROOT / "src/app/api/routes/automations.py"
    )
    routes = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(routes)
    service_module = importlib.import_module("app.services.automation_service")
    assert Path(service_module.__file__).resolve().is_relative_to(ROOT / "src")
    monkeypatch.setattr(service_module, "get_settings", lambda: settings)

    def mock_only(name=None):
        assert name in (None, "mock"), "Only the offline mock provider is allowed"
        return MockProvider()

    monkeypatch.setattr(service_module, "get_provider", mock_only)
    monkeypatch.setattr(routes, "service", service_module.AutomationService())
    app = FastAPI()
    app.include_router(routes.router)
    app.state.isolated_test_loop = isolated_loop
    # Real FastAPI route and schema, in process; no TCP or n8n engine.
    return app, service_module


async def _post_batch(app, payload):
    transport = httpx.ASGITransport(app=app, raise_app_exceptions=False)
    async with httpx.AsyncClient(transport=transport, base_url="http://offline.invalid") as client:
        return await client.post("/automations/claims-intake/batch", json=payload)


def post_batch(app, payload):
    return app.state.isolated_test_loop.run_until_complete(_post_batch(app, payload))
