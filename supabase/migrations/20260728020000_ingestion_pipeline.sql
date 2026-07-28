begin;

alter table public.size_chart_sources
  add column if not exists source_domain text,
  add column if not exists source_kind text not null default 'unknown',
  add column if not exists measurement_basis text not null default 'unknown',
  add column if not exists detected_unit text not null default 'unknown',
  add column if not exists needs_review boolean not null default true,
  add column if not exists version integer,
  add column if not exists supersedes_source_id uuid
    references public.size_chart_sources(id) on delete set null,
  add column if not exists last_seen_at timestamptz,
  add column if not exists takedown_at timestamptz,
  add column if not exists takedown_reason text;

alter table public.size_chart_sources
  add constraint size_chart_sources_kind_check
    check (source_kind in ('official', 'retailer', 'editorial', 'unknown')),
  add constraint size_chart_sources_basis_check
    check (measurement_basis in ('garment', 'body', 'unknown')),
  add constraint size_chart_sources_unit_check
    check (detected_unit in ('cm', 'in', 'mixed', 'unknown'));

update public.size_chart_sources
set
  source_domain = lower(
    regexp_replace(
      split_part(regexp_replace(source_url, '^https?://', '', 'i'), '/', 1),
      '^www\.',
      '',
      'i'
    )
  ),
  last_seen_at = coalesce(last_seen_at, fetched_at)
where source_domain is null or last_seen_at is null;

with ranked as (
  select
    id,
    row_number() over (
      partition by source_url
      order by fetched_at, created_at, id
    ) as source_version
  from public.size_chart_sources
)
update public.size_chart_sources as sources
set version = ranked.source_version
from ranked
where sources.id = ranked.id;

alter table public.size_chart_sources
  alter column source_domain set not null,
  alter column version set default 1,
  alter column version set not null,
  add constraint size_chart_sources_version_check check (version > 0),
  add constraint size_chart_sources_url_version_key unique (source_url, version);

create index if not exists size_chart_sources_domain_status_idx
  on public.size_chart_sources (source_domain, status);

create or replace function public.assign_size_chart_source_version()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  perform pg_advisory_xact_lock(hashtext(new.source_url));

  select coalesce(max(version), 0) + 1
  into new.version
  from public.size_chart_sources
  where source_url = new.source_url;

  if new.supersedes_source_id is null then
    select id
    into new.supersedes_source_id
    from public.size_chart_sources
    where source_url = new.source_url
    order by version desc
    limit 1;
  end if;

  new.source_domain := lower(
    regexp_replace(
      split_part(regexp_replace(new.source_url, '^https?://', '', 'i'), '/', 1),
      '^www\.',
      '',
      'i'
    )
  );
  new.last_seen_at := coalesce(new.last_seen_at, new.fetched_at);
  return new;
end;
$$;

drop trigger if exists assign_size_chart_source_version
  on public.size_chart_sources;
create trigger assign_size_chart_source_version
  before insert on public.size_chart_sources
  for each row execute function public.assign_size_chart_source_version();

create table public.ingestion_domain_blocks (
  domain text primary key,
  reason text not null,
  source_id uuid references public.size_chart_sources(id) on delete set null,
  blocked_by uuid references public.profiles(id) on delete set null,
  blocked_at timestamptz not null default now(),
  metadata_json jsonb not null default '{}'::jsonb
);

alter table public.ingestion_domain_blocks enable row level security;
create policy "admin manage" on public.ingestion_domain_blocks
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

alter table public.jobs
  add column if not exists dedupe_key text;

create unique index if not exists jobs_active_dedupe_idx
  on public.jobs (dedupe_key)
  where dedupe_key is not null and status in ('pending', 'processing');

alter table public.retailer_links
  add column if not exists size_chart_source_id uuid
    references public.size_chart_sources(id) on delete set null,
  add column if not exists canonical_url text,
  add column if not exists price_cents integer,
  add column if not exists currency text not null default 'USD',
  add column if not exists confidence numeric not null default 0.5,
  add column if not exists content_hash text,
  add column if not exists fetched_at timestamptz,
  add column if not exists metadata_json jsonb not null default '{}'::jsonb;

alter table public.retailer_links
  add constraint retailer_links_confidence_check
    check (confidence between 0 and 1);

create or replace function public.publish_size_chart_extraction(
  p_source jsonb,
  p_rows jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_brand_id uuid;
  target_chart_id uuid;
  target_source_id uuid;
  target_domain text;
  target_status text;
  target_row jsonb;
begin
  if auth.role() <> 'service_role' then
    raise exception 'Service role required';
  end if;

  if jsonb_typeof(p_rows) <> 'array'
    or jsonb_array_length(p_rows) < 1
    or jsonb_array_length(p_rows) > 500 then
    raise exception 'Published extraction requires 1 to 500 rows';
  end if;

  if nullif(p_source ->> 'brandSlug', '') is null
    or nullif(p_source ->> 'brandName', '') is null
    or nullif(p_source ->> 'modelName', '') is null
    or nullif(p_source ->> 'sourceUrl', '') is null
    or nullif(p_source ->> 'contentHash', '') is null then
    raise exception 'Source identity is incomplete';
  end if;

  target_status := coalesce(nullif(p_source ->> 'status', ''), 'needs_review');
  if target_status not in ('published', 'needs_review') then
    raise exception 'Invalid source publication status';
  end if;

  target_domain := lower(
    regexp_replace(
      split_part(
        regexp_replace(p_source ->> 'sourceUrl', '^https?://', '', 'i'),
        '/',
        1
      ),
      '^www\.',
      '',
      'i'
    )
  );

  if exists (
    select 1
    from public.ingestion_domain_blocks
    where domain = target_domain
  ) then
    raise exception 'Source domain is blocked';
  end if;

  insert into public.brands (
    name,
    slug,
    size_chart_confidence,
    status,
    origin
  )
  values (
    left(p_source ->> 'brandName', 160),
    left(p_source ->> 'brandSlug', 120),
    case
      when (p_source ->> 'confidence')::numeric >= 0.7 then 'verified'
      else 'ai_normalized'
    end,
    target_status,
    'scraped'
  )
  on conflict (slug) do update
  set
    name = excluded.name,
    size_chart_confidence = case
      when excluded.size_chart_confidence = 'verified' then 'verified'
      else public.brands.size_chart_confidence
    end,
    status = case
      when excluded.status = 'published' then 'published'
      else public.brands.status
    end
  returning id into target_brand_id;

  select id
  into target_source_id
  from public.size_chart_sources
  where source_url = p_source ->> 'sourceUrl'
    and content_hash = p_source ->> 'contentHash'
  limit 1;

  if target_source_id is null then
    insert into public.size_chart_sources (
      brand_id,
      model_name,
      category,
      source_url,
      raw_snapshot_path,
      fetch_method,
      parse_method,
      confidence,
      status,
      content_hash,
      fetched_at,
      last_seen_at,
      origin,
      source_kind,
      measurement_basis,
      detected_unit,
      needs_review,
      metadata_json
    )
    values (
      target_brand_id,
      left(p_source ->> 'modelName', 200),
      coalesce(nullif(p_source ->> 'category', ''), 'jeans'),
      p_source ->> 'sourceUrl',
      nullif(p_source ->> 'snapshotPath', ''),
      coalesce(nullif(p_source ->> 'fetchMethod', ''), 'http'),
      coalesce(nullif(p_source ->> 'parseMethod', ''), 'deterministic'),
      (p_source ->> 'confidence')::numeric,
      target_status,
      p_source ->> 'contentHash',
      coalesce((p_source ->> 'fetchedAt')::timestamptz, now()),
      now(),
      'scraped',
      coalesce(nullif(p_source ->> 'sourceKind', ''), 'unknown'),
      coalesce(nullif(p_source ->> 'measurementBasis', ''), 'unknown'),
      coalesce(nullif(p_source ->> 'detectedUnit', ''), 'unknown'),
      coalesce((p_source ->> 'needsReview')::boolean, true),
      coalesce(p_source -> 'metadata', '{}'::jsonb)
    )
    returning id into target_source_id;
  else
    update public.size_chart_sources
    set
      last_seen_at = now(),
      raw_snapshot_path = coalesce(
        nullif(p_source ->> 'snapshotPath', ''),
        raw_snapshot_path
      ),
      metadata_json = metadata_json || coalesce(
        p_source -> 'metadata',
        '{}'::jsonb
      ),
      updated_at = now()
    where id = target_source_id;
  end if;

  select id
  into target_chart_id
  from public.size_charts
  where source_id = target_source_id
  limit 1;

  if target_chart_id is null then
    insert into public.size_charts (
      brand_id,
      raw_source,
      status,
      source_id,
      origin
    )
    values (
      target_brand_id,
      p_source ->> 'sourceUrl',
      target_status,
      target_source_id,
      'scraped'
    )
    returning id into target_chart_id;
  else
    update public.size_charts
    set status = target_status, raw_source = p_source ->> 'sourceUrl'
    where id = target_chart_id;
  end if;

  for target_row in select value from jsonb_array_elements(p_rows)
  loop
    if nullif(target_row ->> 'sizeLabel', '') is null
      or jsonb_typeof(target_row -> 'spec') <> 'object' then
      raise exception 'Every extracted row requires sizeLabel and spec';
    end if;

    delete from public.size_chart_entries
    where size_chart_id = target_chart_id
      and size_label = left(target_row ->> 'sizeLabel', 40);

    insert into public.size_chart_entries (
      size_chart_id,
      size_label,
      canonical_spec,
      origin
    )
    values (
      target_chart_id,
      left(target_row ->> 'sizeLabel', 40),
      target_row -> 'spec',
      'scraped'
    );

    insert into public.garment_reference_catalog (
      brand_slug,
      model_name,
      size_label,
      category,
      canonical_spec,
      status,
      origin,
      size_chart_source_id
    )
    values (
      left(p_source ->> 'brandSlug', 120),
      left(p_source ->> 'modelName', 200),
      left(target_row ->> 'sizeLabel', 40),
      coalesce(nullif(p_source ->> 'category', ''), 'jeans'),
      target_row -> 'spec',
      target_status,
      'scraped',
      target_source_id
    )
    on conflict (brand_slug, model_name, size_label) do update
    set
      category = excluded.category,
      canonical_spec = excluded.canonical_spec,
      status = excluded.status,
      origin = excluded.origin,
      size_chart_source_id = excluded.size_chart_source_id;
  end loop;

  return target_source_id;
end;
$$;

revoke all on function public.publish_size_chart_extraction(jsonb, jsonb)
  from public;
grant execute on function public.publish_size_chart_extraction(jsonb, jsonb)
  to service_role;

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
      and type in ('ingest_reference', 'refresh_size_chart')
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

create or replace function public.enqueue_weekly_chart_refreshes(
  p_limit integer default 25
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  inserted_count integer;
begin
  if auth.role() <> 'service_role' then
    raise exception 'Service role required';
  end if;

  if p_limit < 1 or p_limit > 100 then
    raise exception 'Refresh limit must be between 1 and 100';
  end if;

  insert into public.jobs (type, payload, dedupe_key)
  select
    'refresh_size_chart',
    jsonb_build_object(
      'sourceId', sources.id,
      'sourceUrl', sources.source_url,
      'brandId', sources.brand_id,
      'modelName', sources.model_name,
      'category', sources.category
    ),
    'refresh:' || sources.id::text
  from public.size_chart_sources as sources
  where sources.status = 'published'
    and sources.takedown_at is null
    and coalesce(sources.last_seen_at, sources.fetched_at)
      < now() - interval '7 days'
    and not exists (
      select 1
      from public.jobs
      where jobs.dedupe_key = 'refresh:' || sources.id::text
        and jobs.status in ('pending', 'processing')
    )
  order by coalesce(sources.last_seen_at, sources.fetched_at)
  limit p_limit;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

revoke all on function public.enqueue_weekly_chart_refreshes(integer)
  from public;
grant execute on function public.enqueue_weekly_chart_refreshes(integer)
  to service_role;

create or replace function public.takedown_size_chart_source(
  p_source_id uuid,
  p_reason text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_domain text;
begin
  if auth.role() <> 'service_role' and not public.is_admin() then
    raise exception 'Admin role required';
  end if;

  if nullif(trim(p_reason), '') is null then
    raise exception 'A takedown reason is required';
  end if;

  select source_domain
  into target_domain
  from public.size_chart_sources
  where id = p_source_id;

  if target_domain is null then
    return false;
  end if;

  insert into public.ingestion_domain_blocks (
    domain,
    reason,
    source_id,
    blocked_by
  )
  values (
    target_domain,
    left(trim(p_reason), 1000),
    p_source_id,
    auth.uid()
  )
  on conflict (domain) do update
  set
    reason = excluded.reason,
    source_id = excluded.source_id,
    blocked_by = excluded.blocked_by,
    blocked_at = now();

  update public.garment_reference_catalog
  set status = 'rejected'
  where size_chart_source_id in (
    select id from public.size_chart_sources
    where source_domain = target_domain
  );

  update public.size_charts
  set status = 'rejected'
  where source_id in (
    select id from public.size_chart_sources
    where source_domain = target_domain
  );

  update public.products
  set status = 'rejected'
  where size_chart_source_id in (
    select id from public.size_chart_sources
    where source_domain = target_domain
  );

  update public.styles
  set status = 'rejected', active = false
  where size_chart_source_id in (
    select id from public.size_chart_sources
    where source_domain = target_domain
  );

  update public.product_measurements
  set status = 'rejected'
  where size_chart_source_id in (
    select id from public.size_chart_sources
    where source_domain = target_domain
  );

  update public.style_measurements
  set status = 'rejected'
  where size_chart_source_id in (
    select id from public.size_chart_sources
    where source_domain = target_domain
  );

  update public.retailer_links
  set status = 'rejected', updated_at = now()
  where size_chart_source_id in (
    select id from public.size_chart_sources
    where source_domain = target_domain
  );

  update public.size_chart_sources
  set
    status = 'rejected',
    needs_review = true,
    takedown_at = now(),
    takedown_reason = left(trim(p_reason), 1000),
    updated_at = now()
  where source_domain = target_domain;

  update public.jobs
  set
    status = 'cancelled',
    last_error = 'Source domain blocked by takedown',
    locked_at = null,
    locked_by = null,
    updated_at = now()
  where status in ('pending', 'processing')
    and payload ->> 'sourceUrl' like '%://' || target_domain || '%';

  return true;
end;
$$;

revoke all on function public.takedown_size_chart_source(uuid, text)
  from public;
grant execute on function public.takedown_size_chart_source(uuid, text)
  to authenticated, service_role;

revoke all on function public.assign_size_chart_source_version() from public;

commit;
