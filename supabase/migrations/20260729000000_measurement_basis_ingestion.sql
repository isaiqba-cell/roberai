-- Keep factual body-size charts in the source index without allowing them to
-- masquerade as model-specific garment construction in matching.

create or replace function public.guard_garment_reference_measurement_basis()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  source_basis text;
begin
  if new.size_chart_source_id is null then
    return new;
  end if;

  select measurement_basis
  into source_basis
  from public.size_chart_sources
  where id = new.size_chart_source_id;

  if source_basis = 'body' then
    return null;
  end if;

  return new;
end;
$$;

drop trigger if exists guard_garment_reference_measurement_basis
  on public.garment_reference_catalog;
create trigger guard_garment_reference_measurement_basis
before insert or update on public.garment_reference_catalog
for each row execute function public.guard_garment_reference_measurement_basis();

delete from public.garment_reference_catalog as catalog
using public.size_chart_sources as sources
where catalog.size_chart_source_id = sources.id
  and sources.origin = 'scraped'
  and sources.measurement_basis = 'body';

create or replace function public.claim_ingestion_jobs(
  p_worker_id text,
  p_limit integer default 3
)
returns setof public.jobs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.role() <> 'service_role' then
    raise exception 'Service role required';
  end if;

  if p_limit < 1 or p_limit > 25 then
    raise exception 'Job claim limit must be between 1 and 25';
  end if;

  update public.jobs
  set
    status = case when attempts >= max_attempts then 'failed' else 'pending' end,
    run_after = case
      when attempts >= max_attempts then run_after
      else now() + interval '1 minute'
    end,
    last_error = coalesce(last_error, 'Worker lease expired'),
    locked_at = null,
    locked_by = null,
    updated_at = now()
  where status = 'processing'
    and locked_at < now() - interval '15 minutes';

  return query
  with candidates as (
    select id
    from public.jobs
    where status = 'pending'
      and run_after <= now()
      and type in (
        'ingest_reference',
        'ingest_size_chart',
        'refresh_size_chart'
      )
    order by run_after, created_at
    for update skip locked
    limit p_limit
  )
  update public.jobs as jobs
  set
    status = 'processing',
    attempts = jobs.attempts + 1,
    locked_at = now(),
    locked_by = left(p_worker_id, 200),
    updated_at = now()
  from candidates
  where jobs.id = candidates.id
  returning jobs.*;
end;
$$;

revoke all on function public.claim_ingestion_jobs(text, integer) from public;
grant execute on function public.claim_ingestion_jobs(text, integer)
  to service_role;

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
  target_slug text;
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

  target_slug := regexp_replace(
    regexp_replace(lower(trim(p_brand_name)), '[^a-z0-9]+', '-', 'g'),
    '(^-|-$)',
    '',
    'g'
  );
  if target_slug = '' then
    target_slug := 'brand-' || substr(md5(trim(p_brand_name)), 1, 10);
  end if;

  target_key := 'manual-chart:' || encode(
    extensions.digest(
      lower(trim(p_brand_name)) || ':' ||
      lower(trim(p_model_name)) || ':' ||
      lower(trim(coalesce(p_source_url, ''))),
      'sha256'::text
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
      'ingest_size_chart',
      jsonb_strip_nulls(jsonb_build_object(
        'brandSlug', left(target_slug, 120),
        'brandName', left(trim(p_brand_name), 160),
        'modelName', left(trim(p_model_name), 200),
        'category', 'jeans',
        'requestedFrom', 'admin',
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

comment on function public.guard_garment_reference_measurement_basis() is
  'Prevents body-size charts from entering model-specific garment matching.';
