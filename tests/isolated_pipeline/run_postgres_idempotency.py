"""Opt-in proof against an empty disposable LOCAL database, never production."""

import argparse
from concurrent.futures import ThreadPoolExecutor
import json
import os
from pathlib import Path
import re
import subprocess
import time


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--psql", required=True)
    parser.add_argument("--port", required=True, type=int)
    parser.add_argument("--confirm-disposable", action="store_true", required=True)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    env = {k: os.environ[k] for k in ("SystemRoot", "WINDIR", "TEMP", "TMP") if k in os.environ}
    env["PGCONNECT_TIMEOUT"] = "5"
    command = [
        args.psql,
        "-X",
        "-qAt",
        "-v",
        "ON_ERROR_STOP=1",
        "-h",
        "127.0.0.1",
        "-p",
        str(args.port),
        "-U",
        "recipe",
        "-d",
        "n8n_recipe_disposable",
    ]

    def sql(statement, ok=True):
        result = subprocess.run(
            command,
            input="\\set VERBOSITY verbose\n" + statement,
            capture_output=True,
            text=True,
            encoding="utf-8",
            env=env,
            timeout=20,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
        if ok and result.returncode:
            raise AssertionError(result.stderr)
        if not ok:
            assert result.returncode, "Expected SQL failure"
        return result

    assert (
        sql("select current_database(),inet_server_addr();").stdout.strip()
        == "n8n_recipe_disposable|127.0.0.1"
    )
    assert (
        sql(
            "select count(*) from pg_class where relnamespace='public'::regnamespace;"
        ).stdout.strip()
        == "0"
    )
    assert (
        sql(
            "select count(*) from pg_proc where pronamespace='public'::regnamespace;"
        ).stdout.strip()
        == "0"
    )
    schema = "\n".join(
        (root / "supabase/schema" / name).read_text(encoding="utf-8-sig")
        for name in [
            "001_mutuelle_core.sql",
            "002_mutuelle_ingest_helpers.sql",
            "003_claim_batch_idempotency.sql",
        ]
    )
    sql("BEGIN;\n" + schema + "\nCOMMIT;")

    payload = '{"items":[{"claim_text":"Synthetic","channel":"email"}]}'

    def call(key, body=payload):
        # Inputs below are hard-coded synthetic literals, not user SQL input.
        return f"select public.save_claim_batch('synthetic.csv','offline','{body}'::jsonb,'{key}');"

    checks = []
    first = sql(call("replay")).stdout.strip()
    assert first == sql(call("replay")).stdout.strip()
    # JSONB compares document values, not textual object-key order.
    assert (
        first
        == sql(
            call("replay", '{"items":[{"channel":"email","claim_text":"Synthetic"}]}')
        ).stdout.strip()
    )
    checks.append("same key and same JSON values return the same UUID")
    failure = sql(call("replay", '{"items":[{"claim_text":"Changed"}]}'), ok=False)
    assert "IDEMPOTENCY_PAYLOAD_CONFLICT" in failure.stderr
    checks.append("same key with changed payload is rejected")
    for key in ("", " "):
        assert "IDEMPOTENCY_KEY_INVALID" in sql(call(key), ok=False).stderr
    for body in ("null", "{}", '{"items":{}}'):
        assert "BATCH_PAYLOAD_INVALID" in sql(call("invalid", body), ok=False).stderr
    checks.append("invalid keys and payloads rejected")

    bad = '{"items":[{"attention_score":"not-an-integer"}]}'
    sql(call("rollback", bad), ok=False)
    assert (
        sql(
            "select count(*) from public.claim_batch_idempotency where request_key='rollback';"
        ).stdout.strip()
        == "0"
    )
    assert sql("select count(*) from public.claim_batches;").stdout.strip() == "1"
    assert sql(call("rollback")).stdout.strip()
    checks.append("failed save rolls back the key and batch; corrected retry succeeds")

    def wait_for(condition):
        deadline = time.monotonic() + 8
        while time.monotonic() < deadline:
            if sql(condition).stdout.strip() == "t":
                return
            time.sleep(0.2)
        raise AssertionError("Concurrent lock was not observed")

    with ThreadPoolExecutor(max_workers=2) as pool:
        for key, changed, rollback in [
            ("concurrent", False, False),
            ("conflict", True, False),
            ("retry-rollback", False, True),
        ]:
            a = pool.submit(
                sql,
                "set application_name='recipe-first'; BEGIN;"
                + call(key)
                + "select pg_sleep(4);"
                + ("ROLLBACK;" if rollback else "COMMIT;"),
            )
            wait_for(
                "select exists(select from pg_stat_activity where application_name='recipe-first' and wait_event='PgSleep');"
            )
            body = '{"items":[{"claim_text":"Changed"}]}' if changed else payload
            b = pool.submit(
                sql, "set application_name='recipe-second';" + call(key, body), not changed
            )
            wait_for(
                "select exists(select from pg_stat_activity where application_name='recipe-second' and wait_event_type='Lock');"
            )
            ra, rb = a.result(), b.result()
            if changed:
                assert "IDEMPOTENCY_PAYLOAD_CONFLICT" in rb.stderr
            else:
                ida = re.findall(r"[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}", ra.stdout)[0]
                idb = rb.stdout.strip()
                assert (ida != idb) if rollback else (ida == idb)
            assert (
                sql(
                    f"select count(*) from public.claim_batch_idempotency where request_key='{key}' and batch_id is not null;"
                ).stdout.strip()
                == "1"
            )
    checks.append(
        "actual lock contention: identical retry, conflicting retry, and first transaction rollback"
    )
    # Discarding a committed response models an uncertain client outcome.
    sql(call("discarded-response"))
    saved = sql(
        "select batch_id from public.claim_batch_idempotency where request_key='discarded-response';"
    ).stdout.strip()
    assert saved == sql(call("discarded-response")).stdout.strip()
    checks.append("retry after a discarded committed response returns the recorded UUID")

    sql(
        "create role recipe_client; grant execute on function public.save_claim_batch(text,text,jsonb,text) to recipe_client;"
    )
    assert sql("set role recipe_client;" + call("authorized-service")).stdout.strip()
    assert (
        "42501"
        in sql(
            "set role recipe_client; select * from public.claim_batch_idempotency;", ok=False
        ).stderr
    )
    assert (
        "42501"
        in sql(
            "set role recipe_client; select public.save_claim_batch('x','y','{\"items\":[]}'::jsonb);",
            ok=False,
        ).stderr
    )
    checks.append("explicit service grant works; ledger and legacy bypass denied for that role")
    assert (
        sql(
            "select count(*)=count(distinct request_key) and bool_and(batch_id is not null) from public.claim_batch_idempotency;"
        ).stdout.strip()
        == "t"
    )
    assert sql("select count(*) from public.claim_batches;").stdout.strip() == "7"
    print(
        json.dumps(
            {
                "postgres": sql("show server_version;").stdout.strip(),
                "checks": checks,
                "batches": 7,
                "passed": True,
                "scope": "temporary local PostgreSQL, not n8n or production",
            }
        )
    )


if __name__ == "__main__":
    main()
