create extension if not exists "pgcrypto";

create table if not exists public.claim_batches (
    id uuid primary key default gen_random_uuid(),
    source_name text not null,
    imported_by text,
    total_items integer not null default 0,
    created_at timestamptz not null default now()
);

create table if not exists public.claim_cases (
    id uuid primary key default gen_random_uuid(),
    batch_id uuid references public.claim_batches(id) on delete set null,
    source_file text,
    customer_id text,
    contract_id text,
    channel text,
    category text,
    category_label text,
    priority text,
    priority_label text,
    attention_score integer,
    attention_level text,
    attention_level_label text,
    business_status text,
    business_status_label text,
    recommended_next_action text,
    recommended_next_action_label text,
    claim_text text,
    documents_received jsonb not null default '[]'::jsonb,
    missing_information jsonb not null default '[]'::jsonb,
    friction_flags jsonb not null default '[]'::jsonb,
    duplicate_suspected boolean not null default false,
    duplicate_cluster_size integer not null default 1,
    client_request_subject text,
    client_request_message text,
    operator_summary text,
    ai_provider text,
    ai_model text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.operator_actions (
    id uuid primary key default gen_random_uuid(),
    claim_case_id uuid references public.claim_cases(id) on delete cascade,
    action_type text not null,
    action_detail text,
    actor_name text,
    created_at timestamptz not null default now()
);

create table if not exists public.document_checks (
    id uuid primary key default gen_random_uuid(),
    claim_case_id uuid references public.claim_cases(id) on delete set null,
    document_type text not null,
    document_type_label text,
    completion_ratio integer not null default 0,
    readiness_status text,
    readiness_status_label text,
    message_tone text,
    output_channel text,
    missing_required_labels jsonb not null default '[]'::jsonb,
    client_request_subject text,
    client_request_message text,
    operator_summary text,
    created_at timestamptz not null default now()
);

create index if not exists idx_claim_cases_customer_id on public.claim_cases(customer_id);
create index if not exists idx_claim_cases_contract_id on public.claim_cases(contract_id);
create index if not exists idx_claim_cases_attention_level on public.claim_cases(attention_level);
create index if not exists idx_claim_cases_business_status on public.claim_cases(business_status);
create index if not exists idx_claim_cases_created_at on public.claim_cases(created_at desc);
