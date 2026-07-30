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

  select brands.slug
  into target_slug
  from public.brands as brands
  where regexp_replace(lower(brands.name), '[^a-z0-9]+', '', 'g') =
    regexp_replace(lower(trim(p_brand_name)), '[^a-z0-9]+', '', 'g')
  order by
    case when brands.origin = 'seeded' then 0 else 1 end,
    brands.slug
  limit 1;

  if target_slug is null then
    target_slug := regexp_replace(
      regexp_replace(lower(trim(p_brand_name)), '[^a-z0-9]+', '-', 'g'),
      '(^-|-$)',
      '',
      'g'
    );
  end if;
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
