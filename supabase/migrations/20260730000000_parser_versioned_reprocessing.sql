-- A parser correction must be able to create a new provenance version even
-- when the fetched bytes are unchanged. Rejected versions are never reused.

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
    and status <> 'rejected'
    and coalesce(
      nullif(metadata_json ->> 'parserVersion', ''),
      'legacy'
    ) = coalesce(
      nullif(p_source -> 'metadata' ->> 'parserVersion', ''),
      'legacy'
    )
  order by version desc
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

comment on function public.publish_size_chart_extraction(jsonb, jsonb) is
  'Publishes a source version keyed by raw content and parser revision; rejected versions are never reused.';
