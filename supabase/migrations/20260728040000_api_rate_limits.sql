-- Public API rate limits are stored by HMAC digest. Raw IP addresses and user
-- identifiers never enter the limiter table.
create table public.api_rate_limits (
  key_hash text not null,
  route text not null,
  window_started_at timestamptz not null,
  hits integer not null default 1 check (hits > 0),
  expires_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (key_hash, route, window_started_at)
);

create index api_rate_limits_expiry_idx
  on public.api_rate_limits (expires_at);

alter table public.api_rate_limits enable row level security;
revoke all on public.api_rate_limits from anon, authenticated;

create or replace function public.consume_api_rate_limit(
  p_key_hash text,
  p_route text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  remaining integer,
  retry_after integer
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_window_started timestamptz;
  v_expires_at timestamptz;
  v_hits integer;
begin
  if length(p_key_hash) < 32
    or length(p_route) < 1
    or length(p_route) > 180
    or p_limit < 1
    or p_limit > 10000
    or p_window_seconds < 1
    or p_window_seconds > 86400
  then
    raise exception 'invalid rate limit parameters';
  end if;

  v_window_started := to_timestamp(
    floor(extract(epoch from v_now) / p_window_seconds) * p_window_seconds
  );
  v_expires_at := v_window_started + make_interval(secs => p_window_seconds);

  insert into public.api_rate_limits (
    key_hash,
    route,
    window_started_at,
    hits,
    expires_at,
    updated_at
  ) values (
    p_key_hash,
    p_route,
    v_window_started,
    1,
    v_expires_at,
    v_now
  )
  on conflict (key_hash, route, window_started_at)
  do update set
    hits = public.api_rate_limits.hits + 1,
    updated_at = excluded.updated_at
  returning public.api_rate_limits.hits into v_hits;

  return query select
    v_hits <= p_limit,
    greatest(p_limit - v_hits, 0),
    greatest(ceil(extract(epoch from (v_expires_at - v_now)))::integer, 1);
end;
$$;

revoke all on function public.consume_api_rate_limit(text, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, text, integer, integer)
  to service_role;

comment on table public.api_rate_limits is
  'Fixed-window public API counters keyed by server-side HMAC digests.';
comment on function public.consume_api_rate_limit(text, text, integer, integer) is
  'Atomically consumes one API request; callable only by the service role.';
