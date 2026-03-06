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
