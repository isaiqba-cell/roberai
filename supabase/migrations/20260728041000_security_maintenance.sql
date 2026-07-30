-- Keep limiter storage bounded and make the no-measurements analytics rule a
-- database invariant, not only an application convention.

create index analytics_events_name_created_idx
  on public.analytics_events (event_name, created_at desc);

create or replace function public.prune_expired_api_rate_limits()
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_deleted bigint;
begin
  delete from public.api_rate_limits
  where expires_at < clock_timestamp() - interval '5 minutes';

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function public.prune_expired_api_rate_limits()
  from public, anon, authenticated;
grant execute on function public.prune_expired_api_rate_limits()
  to service_role;

create or replace function public.enforce_analytics_event_privacy()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_allowed_keys text[];
begin
  if new.properties is null or jsonb_typeof(new.properties) <> 'object' then
    raise exception using
      errcode = '23514',
      message = 'analytics properties must be a JSON object';
  end if;

  v_allowed_keys := case new.event_name
    when 'anchor_created' then
      array['source', 'resolution', 'authenticated']
    when 'matches_viewed' then
      array[
        'catalogMode',
        'resultCount',
        'sort',
        'silhouetteBucket',
        'priceCapApplied'
      ]
    when 'slider_used' then
      array['direction', 'silhouetteBucket']
    when 'outbound_click' then
      array['productId', 'variantId', 'retailerDomain', 'source']
    when 'save_toggled' then
      array['productId', 'saved', 'surface', 'authenticated']
    else null
  end;

  if v_allowed_keys is null then
    raise exception using
      errcode = '23514',
      message = 'unsupported analytics event';
  end if;

  if exists (
    select 1
    from jsonb_each(new.properties) as property(key, value)
    where not (property.key = any(v_allowed_keys))
      or jsonb_typeof(property.value) in ('object', 'array')
  ) then
    raise exception using
      errcode = '23514',
      message = 'analytics properties contain a forbidden field or value';
  end if;

  return new;
end;
$$;

drop trigger if exists analytics_event_privacy_guard
  on public.analytics_events;
create trigger analytics_event_privacy_guard
before insert or update on public.analytics_events
for each row execute function public.enforce_analytics_event_privacy();

comment on function public.prune_expired_api_rate_limits() is
  'Deletes fixed-window limiter rows after their retry window has safely elapsed.';
comment on function public.enforce_analytics_event_privacy() is
  'Restricts first-party analytics to the approved flat, measurement-free event contract.';
