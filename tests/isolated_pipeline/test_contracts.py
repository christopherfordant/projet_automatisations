"""Characterization tests, not a production readiness or n8n execution claim."""

import json
from pathlib import Path
import re
import subprocess

import pytest

from conftest import post_batch


ROOT = Path(__file__).resolve().parents[2]
NOMINAL = "channel,customer_id,contract_id,claim_text\nemail,DEMO-1,DEMO-CASE,Question generale"


def test_nominal_parser_and_real_api_contract(parse_csv, offline_api):
    app, _ = offline_api
    payload = parse_csv(NOMINAL, provider="mock", source_name="synthetic.csv")
    response = post_batch(app, payload)
    assert response.status_code == 200
    result = response.json()
    assert result["summary"]["total_items"] == 1
    assert result["items"][0]["ai_provider"] == "mock"


def test_header_aliases_and_channel_normalization(parse_csv):
    result = parse_csv("Channel,Client-ID,Case ID,Description\nPORTAIL,DEMO-2,CASE-2,Question")
    assert result["items"][0] == {
        "source_file": "csv_pipeline_import",
        "channel": "portail",
        "customer_id": "DEMO-2",
        "contract_id": "CASE-2",
        "provider": "mock",
        "claim_text": "Question",
        "attached_documents": [],
    }


def test_commas_escaped_quotes_and_documents(parse_csv):
    result = parse_csv(
        'channel,claim_text,documents\nemail,"Bonjour, dit ""Alex""","facture,devis"'
    )
    assert result["items"][0]["claim_text"] == 'Bonjour, dit "Alex"'
    assert result["items"][0]["attached_documents"] == ["facture", "devis"]


@pytest.mark.parametrize("newline", ["\n", "\r\n"])
def test_multiline_csv_is_one_item(parse_csv, offline_api, newline):
    app, _ = offline_api
    result = parse_csv(f'channel,claim_text{newline}email,"Premiere ligne{newline}Deuxieme ligne"')
    assert len(result["items"]) == 1
    assert result["items"][0]["claim_text"] == f"Premiere ligne{newline}Deuxieme ligne"
    response = post_batch(app, result)
    assert response.status_code == 200
    assert response.json()["summary"]["total_items"] == 1


@pytest.mark.parametrize("newline", ["\n", "\r\n"])
def test_multiline_quotes_commas_and_following_record(parse_csv, newline):
    content = (
        f"channel,claim_text,documents{newline}"
        f'email,"Bonjour, dit ""Alex""{newline}Suite","facture,devis"{newline}'
        f"portail,Autre question,{newline}"
    )
    items = parse_csv(content)["items"]
    assert len(items) == 2
    assert items[0]["claim_text"] == f'Bonjour, dit "Alex"{newline}Suite'
    assert items[0]["attached_documents"] == ["facture", "devis"]
    assert items[1]["claim_text"] == "Autre question"
    assert items[1]["attached_documents"] == []


def test_blank_records_are_ignored_but_blank_lines_inside_quotes_are_preserved(parse_csv):
    content = '\r\n  \r\nchannel,claim_text\r\n\r\nemail,"Debut\n\nFin"\r\n \t\r\n'
    items = parse_csv(content)["items"]
    assert len(items) == 1
    assert items[0]["claim_text"] == "Debut\n\nFin"


def test_empty_fields_and_outer_whitespace_remain_supported(parse_csv):
    items = parse_csv('channel,claim_text,customer_id,documents\n email , "Question" , ,""')[
        "items"
    ]
    assert items[0]["channel"] == "email"
    assert items[0]["claim_text"] == "Question"
    assert items[0]["customer_id"] is None
    assert items[0]["attached_documents"] == []


@pytest.mark.parametrize(
    "record",
    [
        'email,"Non ferme',
        'email,"Premiere ligne\nNon ferme',
        'email,Texte"invalide',
        'email,"Ferme"suite',
        'email,Valide\nportail,"Non ferme',
    ],
)
def test_malformed_csv_rejected_without_returning_partial_items(parse_csv, record):
    with pytest.raises(subprocess.CalledProcessError) as error:
        parse_csv("channel,claim_text\n" + record)
    assert "CSV_INVALID_FORMAT" in error.value.stderr
    assert error.value.stdout == ""


@pytest.mark.parametrize(
    "csv", ["", "channel,claim_text", "channel,claim_text\nemail,", 'channel,claim_text\nemail,""']
)
def test_empty_or_invalid_payload_rejected_by_actual_schema(parse_csv, offline_api, csv):
    app, _ = offline_api
    response = post_batch(app, parse_csv(csv))
    assert response.status_code == 422


def test_invalid_channel_falls_back_to_email_characterization(parse_csv):
    assert parse_csv("channel,claim_text\nunknown,Question")["items"][0]["channel"] == "email"


def test_two_suspected_duplicates_are_kept_in_batch(parse_csv, offline_api):
    app, _ = offline_api
    response = post_batch(app, parse_csv(NOMINAL + "\nportail,DEMO-1,DEMO-CASE,Question generale"))
    result = response.json()
    assert response.status_code == 200
    assert len(result["items"]) == 2
    assert result["summary"]["duplicate_suspicions"] == 2
    assert all(item["duplicate_suspected"] for item in result["items"])


def test_replayed_single_item_not_recognized_across_requests(parse_csv, offline_api):
    app, _ = offline_api
    # Controlled memory persistence illustrates the absence of a cross-request
    # guard in the API. It does not model or validate the actual database.
    saved = []
    for _ in range(2):
        response = post_batch(app, parse_csv(NOMINAL))
        assert response.status_code == 200
        result = response.json()
        assert result["summary"]["duplicate_suspicions"] == 0
        saved.extend(result["items"])
    assert len(saved) == 2


@pytest.mark.parametrize(
    "error", [RuntimeError("synthetic provider failure"), TimeoutError("synthetic timeout")]
)
def test_provider_error_or_uncertainty_does_not_reach_persistence(
    parse_csv, offline_api, monkeypatch, error
):
    app, service_module = offline_api
    calls = []

    class FailedProvider:
        async def generate(self, prompt):
            calls.append("provider")
            raise error

    monkeypatch.setattr(service_module, "get_provider", lambda name=None: FailedProvider())
    response = post_batch(app, parse_csv(NOMINAL))
    saved = []
    if response.status_code == 200:
        saved.extend(response.json()["items"])
    assert response.status_code == 500
    assert calls == ["provider"]  # No implicit retry in the service under test.
    assert saved == []


@pytest.mark.parametrize("after_write", [False, True])
def test_controlled_save_failure_requires_reconciliation(parse_csv, offline_api, after_write):
    app, _ = offline_api
    response = post_batch(app, parse_csv(NOMINAL))
    assert response.status_code == 200
    saved = []

    def save_stub(payload):
        if after_write:
            saved.extend(payload["items"])
        raise TimeoutError("synthetic persistence timeout")

    # Both outcomes are observable only because this test controls the substitute.
    # A caller seeing a timeout cannot infer whether a real commit occurred.
    with pytest.raises(TimeoutError):
        save_stub(response.json())
    assert len(saved) == int(after_write)


def test_local_variants_remain_distinct():
    basic = json.loads(
        (ROOT / "n8n/workflows/full_csv_claims_pipeline.json").read_text(encoding="utf-8-sig")
    )
    variant = json.loads(
        (ROOT / "n8n/workflows/full_csv_claims_pipeline_supabase_idempotency.json").read_text(
            encoding="utf-8-sig"
        )
    )
    assert not any(n["type"].endswith(".postgres") for n in basic["nodes"])
    assert any(n["type"].endswith(".postgres") for n in variant["nodes"])
    basic_code = next(
        n["parameters"]["jsCode"] for n in basic["nodes"] if n["type"].endswith(".code")
    )
    variant_code = next(
        n["parameters"]["jsCode"] for n in variant["nodes"] if n["type"].endswith(".code")
    )
    assert basic_code == variant_code


@pytest.mark.xfail(
    strict=True,
    raises=AssertionError,
    reason="Tracked workflow uses four save arguments, local SQL declares three",
)
def test_workflow_save_matches_local_sql_arity():
    workflow = json.loads(
        (ROOT / "n8n/workflows/full_csv_claims_pipeline_supabase_idempotency.json").read_text(
            encoding="utf-8-sig"
        )
    )
    query = next(
        n["parameters"]["query"] for n in workflow["nodes"] if n["type"].endswith(".postgres")
    )
    sql = (ROOT / "supabase/schema/002_mutuelle_ingest_helpers.sql").read_text(encoding="utf-8-sig")
    signature = re.search(
        r"function\s+public\.save_claim_batch\s*\((.*?)\)\s*returns", sql, re.I | re.S
    ).group(1)
    assert max(map(int, re.findall(r"\$(\d+)", query))) == len(signature.split(","))


@pytest.mark.skip(
    reason="Separate real PostgreSQL recipe required; no database connection authorized in this suite"
)
def test_real_postgres_function_transaction_and_replay():
    """See docs/RECETTE_PIPELINE_ISOLEE.md; a stub does not validate PostgreSQL."""
