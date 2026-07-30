-- Seeded benchmark sources are immutable inputs, not remotely refreshable
-- pages. Only schedule refreshes for complete scraped source records.

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
    and sources.origin = 'scraped'
    and sources.takedown_at is null
    and sources.brand_id is not null
    and nullif(trim(coalesce(sources.model_name, '')), '') is not null
    and sources.source_url ~* '^https://[^[:space:]]+$'
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

update public.jobs
set
  status = 'cancelled',
  last_error = 'Cancelled automatically: source is not refreshable.',
  locked_at = null,
  locked_by = null,
  updated_at = now()
where type = 'refresh_size_chart'
  and status in ('pending', 'processing')
  and last_error = 'The refresh source is missing brand or model identity.';
