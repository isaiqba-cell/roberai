begin;

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_table text not null,
  target_id text not null,
  before_json jsonb,
  after_json jsonb,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_created_at_idx
  on public.audit_log (created_at desc);
create index audit_log_target_idx
  on public.audit_log (target_table, target_id, created_at desc);

alter table public.audit_log enable row level security;
create policy "admin read" on public.audit_log
  for select to authenticated using (public.is_admin());

create or replace function public.admin_review_size_chart_source(
  p_source_id uuid,
  p_decision text,
  p_rows jsonb default '[]'::jsonb,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  before_source jsonb;
  after_source jsonb;
  target_status text;
  target_row jsonb;
  target_entry_id uuid;
  target_size_label text;
  target_spec jsonb;
begin
  if auth.role() <> 'service_role' and not public.is_admin() then
    raise exception 'Admin role required';
  end if;

  if p_decision not in ('approve', 'reject') then
    raise exception 'Decision must be approve or reject';
  end if;

  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) > 500 then
    raise exception 'Edited rows must be an array with at most 500 entries';
  end if;

  select to_jsonb(sources.*)
  into before_source
  from public.size_chart_sources as sources
  where sources.id = p_source_id
  for update;

  if before_source is null then
    raise exception 'Source not found';
  end if;

  for target_row in select value from jsonb_array_elements(p_rows)
  loop
    if nullif(target_row ->> 'entryId', '') is null
      or nullif(target_row ->> 'sizeLabel', '') is null
      or jsonb_typeof(target_row -> 'spec') <> 'object' then
      raise exception 'Every edited row requires entryId, sizeLabel, and spec';
    end if;

    target_entry_id := (target_row ->> 'entryId')::uuid;
    target_size_label := left(target_row ->> 'sizeLabel', 40);
    target_spec := target_row -> 'spec';

    update public.size_chart_entries as entries
    set
      size_label = target_size_label,
      canonical_spec = target_spec
    where entries.id = target_entry_id
      and entries.size_chart_id in (
        select charts.id
        from public.size_charts as charts
        where charts.source_id = p_source_id
      );

    if not found then
      raise exception 'Edited row does not belong to this source';
    end if;

    update public.garment_reference_catalog
    set canonical_spec = target_spec
    where size_chart_source_id = p_source_id
      and size_label = target_size_label;

    update public.product_variants as variants
    set garment_spec = target_spec
    from public.products as products
    where variants.product_id = products.id
      and products.size_chart_source_id = p_source_id
      and variants.size_label = target_size_label;
  end loop;

  target_status := case
    when p_decision = 'approve' then 'published'
    else 'rejected'
  end;

  update public.size_chart_sources
  set
    status = target_status,
    confidence = case when p_decision = 'approve' then 1 else confidence end,
    needs_review = false,
    metadata_json = metadata_json || jsonb_build_object(
      'reviewReason', nullif(trim(coalesce(p_reason, '')), ''),
      'reviewedAt', now()
    ),
    updated_at = now()
  where id = p_source_id;

  update public.size_charts
  set status = target_status
  where source_id = p_source_id;

  update public.garment_reference_catalog
  set status = target_status
  where size_chart_source_id = p_source_id;

  update public.products
  set status = target_status
  where size_chart_source_id = p_source_id;

  update public.styles
  set
    status = target_status,
    active = (p_decision = 'approve')
  where size_chart_source_id = p_source_id;

  update public.product_measurements
  set
    status = target_status,
    approved = (p_decision = 'approve')
  where size_chart_source_id = p_source_id;

  update public.style_measurements
  set
    status = target_status,
    approved = (p_decision = 'approve')
  where size_chart_source_id = p_source_id;

  update public.retailer_links
  set status = target_status, updated_at = now()
  where size_chart_source_id = p_source_id;

  select to_jsonb(sources.*)
  into after_source
  from public.size_chart_sources as sources
  where sources.id = p_source_id;

  insert into public.audit_log (
    actor_user_id,
    action,
    target_table,
    target_id,
    before_json,
    after_json,
    metadata_json
  )
  values (
    auth.uid(),
    'source.' || p_decision,
    'size_chart_sources',
    p_source_id::text,
    before_source,
    after_source,
    jsonb_build_object(
      'editedRowCount', jsonb_array_length(p_rows),
      'reason', nullif(trim(coalesce(p_reason, '')), '')
    )
  );

  return after_source;
end;
$$;

revoke all on function public.admin_review_size_chart_source(
  uuid,
  text,
  jsonb,
  text
) from public;
grant execute on function public.admin_review_size_chart_source(
  uuid,
  text,
  jsonb,
  text
) to authenticated, service_role;

create or replace function public.admin_retry_ingestion_job(
  p_job_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  before_job jsonb;
  after_job jsonb;
begin
  if auth.role() <> 'service_role' and not public.is_admin() then
    raise exception 'Admin role required';
  end if;

  select to_jsonb(jobs.*)
  into before_job
  from public.jobs as jobs
  where jobs.id = p_job_id
  for update;

  if before_job is null then
    raise exception 'Job not found';
  end if;

  if before_job ->> 'status' = 'processing' then
    raise exception 'A processing job cannot be retried';
  end if;

  update public.jobs
  set
    status = 'pending',
    attempts = 0,
    run_after = now(),
    last_error = null,
    locked_at = null,
    locked_by = null,
    updated_at = now()
  where id = p_job_id;

  select to_jsonb(jobs.*)
  into after_job
  from public.jobs as jobs
  where jobs.id = p_job_id;

  insert into public.audit_log (
    actor_user_id,
    action,
    target_table,
    target_id,
    before_json,
    after_json
  )
  values (
    auth.uid(),
    'job.retry',
    'jobs',
    p_job_id::text,
    before_job,
    after_job
  );

  return after_job;
end;
$$;

revoke all on function public.admin_retry_ingestion_job(uuid) from public;
grant execute on function public.admin_retry_ingestion_job(uuid)
  to authenticated, service_role;

create or replace function public.admin_enqueue_ingestion(
  p_brand_name text,
  p_model_name text,
  p_source_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_job public.jobs%rowtype;
  target_key text;
begin
  if auth.role() <> 'service_role' and not public.is_admin() then
    raise exception 'Admin role required';
  end if;

  if nullif(trim(p_brand_name), '') is null
    or nullif(trim(p_model_name), '') is null then
    raise exception 'Brand and model are required';
  end if;

  if nullif(trim(coalesce(p_source_url, '')), '') is not null
    and p_source_url !~* '^https://[^[:space:]]+$' then
    raise exception 'Source URL must use HTTPS';
  end if;

  target_key := 'manual:' || encode(
    digest(
      lower(trim(p_brand_name)) || ':' ||
      lower(trim(p_model_name)) || ':' ||
      lower(trim(coalesce(p_source_url, ''))),
      'sha256'
    ),
    'hex'
  );

  perform pg_advisory_xact_lock(hashtext(target_key));

  select jobs.*
  into target_job
  from public.jobs as jobs
  where jobs.dedupe_key = target_key
    and jobs.status in ('pending', 'processing')
  limit 1;

  if target_job.id is null then
    insert into public.jobs (type, payload, dedupe_key)
    values (
      'ingest_reference',
      jsonb_strip_nulls(jsonb_build_object(
        'brandName', left(trim(p_brand_name), 160),
        'modelName', left(trim(p_model_name), 200),
        'sourceUrl', nullif(trim(coalesce(p_source_url, '')), '')
      )),
      target_key
    )
    returning * into target_job;
  end if;

  insert into public.audit_log (
    actor_user_id,
    action,
    target_table,
    target_id,
    before_json,
    after_json
  )
  values (
    auth.uid(),
    'job.enqueue',
    'jobs',
    target_job.id::text,
    null,
    to_jsonb(target_job)
  );

  return to_jsonb(target_job);
end;
$$;

revoke all on function public.admin_enqueue_ingestion(text, text, text)
  from public;
grant execute on function public.admin_enqueue_ingestion(text, text, text)
  to authenticated, service_role;

create or replace function public.admin_takedown_size_chart_source(
  p_source_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  before_source jsonb;
  after_source jsonb;
begin
  if auth.role() <> 'service_role' and not public.is_admin() then
    raise exception 'Admin role required';
  end if;

  select to_jsonb(sources.*)
  into before_source
  from public.size_chart_sources as sources
  where sources.id = p_source_id;

  if before_source is null then
    raise exception 'Source not found';
  end if;

  perform public.takedown_size_chart_source(p_source_id, p_reason);

  select to_jsonb(sources.*)
  into after_source
  from public.size_chart_sources as sources
  where sources.id = p_source_id;

  insert into public.audit_log (
    actor_user_id,
    action,
    target_table,
    target_id,
    before_json,
    after_json,
    metadata_json
  )
  values (
    auth.uid(),
    'source.takedown',
    'size_chart_sources',
    p_source_id::text,
    before_source,
    after_source,
    jsonb_build_object('reason', left(trim(p_reason), 1000))
  );

  return after_source;
end;
$$;

revoke all on function public.admin_takedown_size_chart_source(uuid, text)
  from public;
grant execute on function public.admin_takedown_size_chart_source(uuid, text)
  to authenticated, service_role;

revoke execute on function public.takedown_size_chart_source(uuid, text)
  from authenticated;

commit;
