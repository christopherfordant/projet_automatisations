-- MANUAL ONLY. NOT EXECUTED BY PYTEST OR BY THIS DELIVERY.
-- Requires a separately authorized, empty, disposable LOCAL database named
-- n8n_recipe_disposable. No n8n credentials or remote connection parameters.
\set ON_ERROR_STOP on
BEGIN;
DO $$
BEGIN
  IF current_database() <> 'n8n_recipe_disposable' THEN
    RAISE EXCEPTION 'Disposable recipe database required';
  END IF;
  IF inet_server_addr() IS NOT NULL
     AND inet_server_addr() NOT IN ('127.0.0.1'::inet, '::1'::inet) THEN
    RAISE EXCEPTION 'Local server required';
  END IF;
  IF EXISTS (SELECT FROM pg_class WHERE relnamespace = 'public'::regnamespace)
     OR EXISTS (SELECT FROM pg_proc WHERE pronamespace = 'public'::regnamespace) THEN
    RAISE EXCEPTION 'Empty public schema required; never use an application database';
  END IF;
END;
$$;

\ir ../../supabase/schema/001_mutuelle_core.sql
\ir ../../supabase/schema/002_mutuelle_ingest_helpers.sql

DO $$
DECLARE
  payload jsonb := '{"items":[{"claim_text":"Synthetic question","channel":"email"}]}';
  first_id uuid;
  second_id uuid;
  batches_before bigint;
BEGIN
  IF to_regprocedure('public.save_claim_batch(text,text,jsonb)') IS NULL
     OR to_regprocedure('public.save_claim_batch(text,text,jsonb,text)') IS NOT NULL THEN
    RAISE EXCEPTION 'Unexpected local SQL function signatures';
  END IF;
  first_id := public.save_claim_batch('synthetic.csv', 'offline-recipe', payload);
  second_id := public.save_claim_batch('synthetic.csv', 'offline-recipe', payload);
  -- Characterize current SQL: two saves produce two batches, not idempotence.
  IF first_id = second_id OR (SELECT count(*) FROM public.claim_batches) <> 2
     OR (SELECT count(*) FROM public.claim_cases) <> 2 THEN
    RAISE EXCEPTION 'Unexpected replay behavior';
  END IF;
  SELECT count(*) INTO batches_before FROM public.claim_batches;
  BEGIN
    PERFORM public.save_claim_batch('synthetic-invalid.csv', 'offline-recipe',
      '{"items":[{"claim_text":"Synthetic","attention_score":"not-an-integer"}]}'::jsonb);
    RAISE EXCEPTION 'Expected an invalid integer cast';
  EXCEPTION WHEN invalid_text_representation THEN
    NULL;
  END;
  IF (SELECT count(*) FROM public.claim_batches) <> batches_before THEN
    RAISE EXCEPTION 'Failed save was not atomic';
  END IF;
END;
$$;
ROLLBACK;
