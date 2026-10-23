-- Apply only to an authorized database. No automatic installation or cleanup.
create table if not exists public.claim_batch_idempotency (
    request_key text primary key,
    request_document jsonb not null,
    batch_id uuid references public.claim_batches(id) on delete restrict,
    created_at timestamptz not null default now(),
    constraint claim_batch_request_key_valid check (
        length(request_key) between 1 and 200 and request_key = btrim(request_key)
    )
);

alter table public.claim_batch_idempotency enable row level security;
revoke all on public.claim_batch_idempotency from public;

create or replace function public.save_claim_batch(
    p_source_name text,
    p_imported_by text,
    p_payload jsonb,
    p_idempotency_key text
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_document jsonb;
    v_existing public.claim_batch_idempotency%rowtype;
    v_batch_id uuid;
begin
    if p_idempotency_key is null or length(p_idempotency_key) not between 1 and 200
       or p_idempotency_key <> btrim(p_idempotency_key) then
        raise exception using errcode = '22023', message = 'IDEMPOTENCY_KEY_INVALID';
    end if;
    if p_payload is null or jsonb_typeof(p_payload) <> 'object'
       or jsonb_typeof(p_payload->'items') is distinct from 'array' then
        raise exception using errcode = '22023', message = 'BATCH_PAYLOAD_INVALID';
    end if;
    v_document := jsonb_build_object(
        'source_name', p_source_name,
        'imported_by', p_imported_by,
        'payload', p_payload
    );

    -- A concurrent insert of this key waits for commit/rollback. The following
    -- lock serializes the decision; the ledger and batch share one transaction.
    insert into public.claim_batch_idempotency(request_key, request_document)
    values (p_idempotency_key, v_document)
    on conflict (request_key) do nothing;

    select * into strict v_existing
    from public.claim_batch_idempotency
    where request_key = p_idempotency_key
    for update;

    if v_existing.request_document <> v_document then
        raise exception using errcode = '22023', message = 'IDEMPOTENCY_PAYLOAD_CONFLICT';
    end if;
    if v_existing.batch_id is not null then
        return v_existing.batch_id;
    end if;

    v_batch_id := public.save_claim_batch(p_source_name, p_imported_by, p_payload);
    update public.claim_batch_idempotency set batch_id = v_batch_id
    where request_key = p_idempotency_key;
    return v_batch_id;
end;
$$;

-- Callers must use an explicitly authorized service role. The owner can still
-- call the legacy helper internally; no application role is guessed here.
revoke all on function public.save_claim_batch(text, text, jsonb, text) from public;
revoke all on function public.save_claim_batch(text, text, jsonb) from public;
