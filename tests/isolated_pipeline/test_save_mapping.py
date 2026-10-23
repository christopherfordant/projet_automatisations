"""Verify explicit idempotency mapping without invoking PostgreSQL."""

import json
from pathlib import Path
import re
import subprocess

import pytest

from conftest import post_batch


ROOT = Path(__file__).resolve().parents[2]


@pytest.fixture
def map_save_arguments(run_node_code):
    workflow = json.loads(
        (ROOT / "n8n/workflows/full_csv_claims_pipeline_supabase_idempotency.json").read_text(
            encoding="utf-8-sig"
        )
    )
    params = next(n["parameters"] for n in workflow["nodes"] if n["type"].endswith(".postgres"))
    expression = params["options"]["queryReplacement"]
    assert expression.startswith("={{") and expression.endswith("}}")
    expression = expression[3:-2]
    code = (
        "const input = $json.body;"
        "const $ = name => {"
        "if (name === 'Parse CSV To Items') return {item:{json:input.parsed}};"
        "if (name === 'Require Idempotency Key') return {item:{json:{idempotency_key:input.key}}};"
        "throw new Error('Unexpected upstream');};"
        "return (($json) => (" + expression + "))(input.response);"
    )

    def evaluate(response, parsed, key="synthetic-key"):
        return run_node_code(code, {"response": response, "parsed": parsed, "key": key})

    return evaluate


def test_actual_argument_order_and_full_api_json(map_save_arguments, parse_csv, offline_api):
    app, _ = offline_api
    payload = parse_csv(
        "channel,claim_text\nemail,Question synthetique", source_name="synthetic.csv"
    )
    response = post_batch(app, payload)
    assert response.status_code == 200
    result = response.json()
    args = map_save_arguments(result, payload)
    assert len(args) == 4
    assert args[:2] == ["synthetic.csv", "n8n"]
    assert json.loads(args[2]) == result
    assert args[3] == "synthetic-key"


@pytest.mark.parametrize("metadata", [{}, {"source_name": ""}, {"source_name": None}])
def test_normalized_source_name_fallback(map_save_arguments, parse_csv, metadata):
    parsed = parse_csv("channel,claim_text\nemail,Synthetic", **metadata)
    assert map_save_arguments({"items": []}, parsed)[0] == "csv_pipeline_import"


def test_same_filename_does_not_identify_payload_contents(map_save_arguments):
    first = {"items": [{"claim_text": "Synthetic A"}]}
    second = {"items": [{"claim_text": "Synthetic B"}]}
    a = map_save_arguments(first, {"source_name": "same.csv"})
    b = map_save_arguments(second, {"source_name": "same.csv"})
    assert a[0] == b[0]
    assert a[2] != b[2]
    # Mapping observation only: no SQL execution or replay policy is inferred.


def test_local_sql_declares_source_author_and_payload_only():
    sql = (ROOT / "supabase/schema/002_mutuelle_ingest_helpers.sql").read_text(encoding="utf-8-sig")
    signature = re.search(
        r"function\s+public\.save_claim_batch\s*\((.*?)\)\s*returns", sql, re.I | re.S
    ).group(1)
    assert [" ".join(arg.split()) for arg in signature.split(",")] == [
        "p_source_name text",
        "p_imported_by text",
        "p_payload jsonb",
    ]


@pytest.mark.parametrize("key", [None, "", " ", " key", "key ", 123, "x" * 201])
def test_missing_or_invalid_key_stops_before_http(run_node_code, key):
    workflow = json.loads(
        (ROOT / "n8n/workflows/full_csv_claims_pipeline_supabase_idempotency.json").read_text()
    )
    guard = next(n for n in workflow["nodes"] if n["name"] == "Require Idempotency Key")
    code = (
        "const input = $json.body; const $ = () => ({item:{json:{body:input.webhook}}}); return (($json)=>{"
        + guard["parameters"]["jsCode"]
        + "})(input.parsed);"
    )
    with pytest.raises(subprocess.CalledProcessError) as error:
        run_node_code(code, {"webhook": {"idempotency_key": key}, "parsed": {"items": []}})
    assert "IDEMPOTENCY_KEY_REQUIRED" in error.value.stderr
    assert (
        workflow["connections"]["Parse CSV To Items"]["main"][0][0]["node"]
        == "Require Idempotency Key"
    )
    assert (
        workflow["connections"]["Require Idempotency Key"]["main"][0][0]["node"]
        == "Call FastAPI Batch From CSV"
    )


def test_valid_key_preserves_items_and_is_independent_of_filename(
    run_node_code, map_save_arguments
):
    workflow = json.loads(
        (ROOT / "n8n/workflows/full_csv_claims_pipeline_supabase_idempotency.json").read_text()
    )
    guard = next(n for n in workflow["nodes"] if n["name"] == "Require Idempotency Key")
    code = (
        "const input = $json.body; const $ = () => ({item:{json:{body:input.webhook}}}); return (($json)=>{"
        + guard["parameters"]["jsCode"]
        + "})(input.parsed);"
    )
    original = {"idempotency_key": "request-demo-1", "items": [{"claim_text": "Synthetic"}]}
    assert (
        run_node_code(
            code,
            {
                "webhook": {"idempotency_key": original["idempotency_key"]},
                "parsed": {"items": original["items"]},
            },
        )[0]["json"]
        == original
    )
    assert (
        map_save_arguments({"items": []}, {"source_name": "file.csv"}, "request-demo-1")[3]
        == "request-demo-1"
    )
