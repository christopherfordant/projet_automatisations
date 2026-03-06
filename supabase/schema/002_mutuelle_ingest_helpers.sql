create or replace function public.save_claim_batch(
    p_source_name text,
    p_imported_by text,
    p_payload jsonb
)
returns uuid
language plpgsql
security definer
as $$
declare
    v_batch_id uuid;
    v_item jsonb;
begin
    insert into public.claim_batches (source_name, imported_by, total_items)
    values (
        coalesce(p_source_name, 'batch_import'),
        p_imported_by,
        coalesce(jsonb_array_length(coalesce(p_payload->'items', '[]'::jsonb)), 0)
    )
    returning id into v_batch_id;

    for v_item in
        select value
        from jsonb_array_elements(coalesce(p_payload->'items', '[]'::jsonb))
    loop
        insert into public.claim_cases (
            batch_id,
            source_file,
            customer_id,
            contract_id,
            channel,
            category,
            category_label,
            priority,
            priority_label,
            attention_score,
            attention_level,
            attention_level_label,
            business_status,
            business_status_label,
            recommended_next_action,
            recommended_next_action_label,
            claim_text,
            documents_received,
            missing_information,
            friction_flags,
            duplicate_suspected,
            duplicate_cluster_size,
            client_request_subject,
            client_request_message,
            operator_summary,
            ai_provider,
            ai_model
        )
        values (
            v_batch_id,
            coalesce(v_item->>'source_file', p_source_name),
            nullif(v_item->>'customer_id', ''),
            nullif(v_item->>'contract_id', ''),
            nullif(v_item->>'channel', ''),
            nullif(v_item->>'category', ''),
            nullif(v_item->>'category_label', ''),
            nullif(v_item->>'priority', ''),
            nullif(v_item->>'priority_label', ''),
            nullif(v_item->>'attention_score', '')::integer,
            nullif(v_item->>'attention_level', ''),
            nullif(v_item->>'attention_level_label', ''),
            nullif(v_item->>'business_status', ''),
            nullif(v_item->>'business_status_label', ''),
            nullif(v_item->>'recommended_next_action', ''),
            nullif(v_item->>'recommended_next_action_label', ''),
            nullif(v_item->>'claim_text', ''),
            coalesce(v_item->'documents_received', '[]'::jsonb),
            coalesce(v_item->'missing_information_labels', '[]'::jsonb),
            coalesce(v_item->'friction_flag_labels', '[]'::jsonb),
            coalesce((v_item->>'duplicate_suspected')::boolean, false),
            coalesce(nullif(v_item->>'duplicate_cluster_size', '')::integer, 1),
            nullif(v_item->>'client_request_subject', ''),
            nullif(v_item->>'client_request_message', ''),
            nullif(v_item->>'operator_summary', ''),
            nullif(v_item->>'ai_provider', ''),
            nullif(v_item->>'ai_model', '')
        );
    end loop;

    return v_batch_id;
end;
$$;


create or replace function public.save_document_check(
    p_claim_case_id uuid,
    p_payload jsonb
)
returns uuid
language plpgsql
security definer
as $$
declare
    v_document_check_id uuid;
begin
    insert into public.document_checks (
        claim_case_id,
        document_type,
        document_type_label,
        completion_ratio,
        readiness_status,
        readiness_status_label,
        message_tone,
        output_channel,
        missing_required_labels,
        client_request_subject,
        client_request_message,
        operator_summary
    )
    values (
        p_claim_case_id,
        nullif(p_payload->>'document_type', ''),
        nullif(p_payload->>'document_type_label', ''),
        coalesce(nullif(p_payload->>'completion_ratio', '')::integer, 0),
        nullif(p_payload->>'readiness_status', ''),
        nullif(p_payload->>'readiness_status_label', ''),
        nullif(p_payload->>'message_tone', ''),
        nullif(p_payload->>'output_channel', ''),
        coalesce(p_payload->'missing_required_labels', '[]'::jsonb),
        nullif(p_payload->>'client_request_subject', ''),
        nullif(p_payload->>'client_request_message', ''),
        nullif(p_payload->>'operator_summary', '')
    )
    returning id into v_document_check_id;

    return v_document_check_id;
end;
$$;


create or replace function public.log_operator_action(
    p_claim_case_id uuid,
    p_action_type text,
    p_action_detail text,
    p_actor_name text
)
returns uuid
language plpgsql
security definer
as $$
declare
    v_action_id uuid;
begin
    insert into public.operator_actions (
        claim_case_id,
        action_type,
        action_detail,
        actor_name
    )
    values (
        p_claim_case_id,
        p_action_type,
        p_action_detail,
        p_actor_name
    )
    returning id into v_action_id;

    return v_action_id;
end;
$$;


create or replace view public.claim_cases_ready_for_followup as
select
    id,
    customer_id,
    contract_id,
    category_label,
    business_status_label,
    attention_level_label,
    client_request_subject,
    client_request_message,
    created_at
from public.claim_cases
where jsonb_array_length(coalesce(missing_information, '[]'::jsonb)) > 0
  and coalesce(client_request_message, '') <> '';


create or replace view public.operator_dashboard_metrics as
select
    count(*) as total_cases,
    count(*) filter (where attention_level = 'critical') as critical_queue,
    count(*) filter (where business_status = 'blocked') as blocked_cases,
    count(*) filter (where jsonb_array_length(coalesce(missing_information, '[]'::jsonb)) > 0) as followup_ready,
    count(*) filter (
        where business_status in ('ready_to_route', 'ready_for_priority_queue')
    ) as ready_to_route
from public.claim_cases;


create or replace view public.operator_dashboard_worklist as
select
    id,
    customer_id,
    contract_id,
    category_label,
    priority_label,
    attention_level_label,
    business_status_label,
    recommended_next_action_label,
    client_request_subject,
    client_request_message,
    created_at
from public.claim_cases
order by created_at desc;
