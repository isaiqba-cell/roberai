begin;

-- Keep profile rows in sync with Supabase Auth and give every account a
-- non-privileged role by default.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    updated_at = now();

  insert into public.user_roles (user_id, role)
  values (new.id, 'member')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update of email, raw_user_meta_data on auth.users
  for each row execute function public.handle_new_auth_user();

insert into public.profiles (id, email, display_name, avatar_url)
select
  id,
  email,
  coalesce(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name'),
  coalesce(raw_user_meta_data ->> 'avatar_url', raw_user_meta_data ->> 'picture')
from auth.users
on conflict (id) do nothing;

insert into public.user_roles (user_id, role)
select id, 'member'
from public.profiles
on conflict (user_id, role) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, service_role;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Provenance is versioned by URL and content hash so a changed source creates
-- a new row without erasing the previous parse.
create table public.size_chart_sources (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands(id) on delete set null,
  model_name text,
  category text not null default 'jeans',
  source_url text not null,
  raw_snapshot_path text,
  fetch_method text not null check (fetch_method in ('seed', 'http', 'manual')),
  parse_method text not null check (parse_method in ('seed', 'deterministic', 'llm', 'manual')),
  confidence numeric not null check (confidence between 0 and 1),
  status text not null default 'needs_review'
    check (status in ('published', 'needs_review', 'rejected')),
  content_hash text not null,
  fetched_at timestamptz not null,
  origin text not null default 'manual'
    check (origin in ('seeded', 'scraped', 'manual')),
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_url, content_hash)
);

create index size_chart_sources_brand_status_idx
  on public.size_chart_sources (brand_id, status);
create index size_chart_sources_refresh_idx
  on public.size_chart_sources (status, fetched_at);

create table public.retailer_links (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  style_id uuid references public.styles(id) on delete cascade,
  merchant_name text not null,
  retailer_domain text not null,
  url_template text not null,
  source_url text,
  status text not null default 'needs_review'
    check (status in ('published', 'needs_review', 'rejected')),
  origin text not null default 'manual'
    check (origin in ('seeded', 'scraped', 'manual')),
  utm_defaults jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (product_id is not null or style_id is not null)
);

create unique index retailer_links_product_url_idx
  on public.retailer_links (product_id, url_template)
  where product_id is not null;
create unique index retailer_links_style_url_idx
  on public.retailer_links (style_id, url_template)
  where style_id is not null;

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  attempts integer not null default 0 check (attempts >= 0),
  max_attempts integer not null default 3 check (max_attempts between 1 and 10),
  run_after timestamptz not null default now(),
  last_error text,
  locked_at timestamptz,
  locked_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index jobs_drain_idx on public.jobs (status, run_after, created_at);

-- Add a consistent publication/origin boundary to existing catalog tables.
alter table public.brands
  add column if not exists status text not null default 'needs_review',
  add column if not exists origin text not null default 'manual';
alter table public.brands
  add constraint brands_publication_status_check
    check (status in ('published', 'needs_review', 'rejected')),
  add constraint brands_origin_check
    check (origin in ('seeded', 'scraped', 'manual'));
update public.brands
set status = 'published'
where size_chart_confidence in ('verified', 'ai_normalized');

alter table public.merchants
  add column if not exists status text not null default 'needs_review',
  add column if not exists origin text not null default 'manual';
alter table public.merchants
  add constraint merchants_publication_status_check
    check (status in ('published', 'needs_review', 'rejected')),
  add constraint merchants_origin_check
    check (origin in ('seeded', 'scraped', 'manual'));
update public.merchants set status = 'published' where active = true;

alter table public.categories
  add column if not exists status text not null default 'needs_review',
  add column if not exists origin text not null default 'manual';
alter table public.categories
  add constraint categories_publication_status_check
    check (status in ('published', 'needs_review', 'rejected')),
  add constraint categories_origin_check
    check (origin in ('seeded', 'scraped', 'manual'));
update public.categories set status = 'published';

alter table public.products
  add column if not exists origin text not null default 'manual',
  add column if not exists size_chart_source_id uuid
    references public.size_chart_sources(id) on delete set null;
update public.products
set status = case when status = 'active' then 'published' else 'needs_review' end;
alter table public.products drop constraint if exists products_status_check;
alter table public.products
  alter column status set default 'needs_review',
  alter column status set not null,
  add constraint products_status_check
    check (status in ('published', 'needs_review', 'rejected')),
  add constraint products_origin_check
    check (origin in ('seeded', 'scraped', 'manual'));

alter table public.product_variants
  add column if not exists origin text not null default 'manual';
alter table public.product_variants
  add constraint product_variants_origin_check
    check (origin in ('seeded', 'scraped', 'manual'));

alter table public.product_media
  add column if not exists origin text not null default 'manual';
alter table public.product_media
  add constraint product_media_origin_check
    check (origin in ('seeded', 'scraped', 'manual'));

alter table public.product_measurements
  add column if not exists status text not null default 'needs_review',
  add column if not exists origin text not null default 'manual',
  add column if not exists size_chart_source_id uuid
    references public.size_chart_sources(id) on delete set null;
alter table public.product_measurements
  add constraint product_measurements_status_check
    check (status in ('published', 'needs_review', 'rejected')),
  add constraint product_measurements_origin_check
    check (origin in ('seeded', 'scraped', 'manual'));
update public.product_measurements set status = 'published' where approved = true;

alter table public.size_charts
  add column if not exists source_id uuid
    references public.size_chart_sources(id) on delete set null,
  add column if not exists origin text not null default 'manual';
update public.size_charts
set status = case
  when status = 'approved' then 'published'
  when status = 'pending_review' then 'needs_review'
  else status
end;
alter table public.size_charts drop constraint if exists size_charts_status_check;
alter table public.size_charts
  alter column status set default 'needs_review',
  alter column status set not null,
  add constraint size_charts_status_check
    check (status in ('published', 'needs_review', 'rejected')),
  add constraint size_charts_origin_check
    check (origin in ('seeded', 'scraped', 'manual'));

alter table public.size_chart_entries
  add column if not exists origin text not null default 'manual';
alter table public.size_chart_entries
  add constraint size_chart_entries_origin_check
    check (origin in ('seeded', 'scraped', 'manual'));

alter table public.fit_taxonomy
  add column if not exists status text not null default 'needs_review',
  add column if not exists origin text not null default 'manual';
alter table public.fit_taxonomy
  add constraint fit_taxonomy_status_check
    check (status in ('published', 'needs_review', 'rejected')),
  add constraint fit_taxonomy_origin_check
    check (origin in ('seeded', 'scraped', 'manual'));

alter table public.styles
  add column if not exists status text not null default 'needs_review',
  add column if not exists origin text not null default 'manual',
  add column if not exists size_chart_source_id uuid
    references public.size_chart_sources(id) on delete set null;
alter table public.styles
  add constraint styles_status_check
    check (status in ('published', 'needs_review', 'rejected')),
  add constraint styles_origin_check
    check (origin in ('seeded', 'scraped', 'manual'));
update public.styles set status = 'published' where active = true;

alter table public.style_variants
  add column if not exists origin text not null default 'manual';
alter table public.style_variants
  add constraint style_variants_origin_check
    check (origin in ('seeded', 'scraped', 'manual'));

alter table public.style_measurements
  add column if not exists status text not null default 'needs_review',
  add column if not exists origin text not null default 'manual',
  add column if not exists size_chart_source_id uuid
    references public.size_chart_sources(id) on delete set null;
alter table public.style_measurements
  add constraint style_measurements_status_check
    check (status in ('published', 'needs_review', 'rejected')),
  add constraint style_measurements_origin_check
    check (origin in ('seeded', 'scraped', 'manual'));
update public.style_measurements set status = 'published' where approved = true;

alter table public.style_fit_vectors
  add column if not exists origin text not null default 'manual';
alter table public.style_fit_vectors
  add constraint style_fit_vectors_origin_check
    check (origin in ('seeded', 'scraped', 'manual'));

alter table public.style_similarity_edges
  add column if not exists status text not null default 'needs_review',
  add column if not exists origin text not null default 'manual';
alter table public.style_similarity_edges
  add constraint style_similarity_edges_status_check
    check (status in ('published', 'needs_review', 'rejected')),
  add constraint style_similarity_edges_origin_check
    check (origin in ('seeded', 'scraped', 'manual'));
update public.style_similarity_edges set status = 'published' where approved = true;

alter table public.garment_reference_catalog
  add column if not exists status text not null default 'needs_review',
  add column if not exists origin text not null default 'manual',
  add column if not exists size_chart_source_id uuid
    references public.size_chart_sources(id) on delete set null;
alter table public.garment_reference_catalog
  add constraint garment_reference_catalog_status_check
    check (status in ('published', 'needs_review', 'rejected')),
  add constraint garment_reference_catalog_origin_check
    check (origin in ('seeded', 'scraped', 'manual'));

-- Guest anchors receive a stable client UUID and can be merged idempotently.
alter table public.user_anchor_items
  add column if not exists client_anchor_id uuid not null default gen_random_uuid(),
  add column if not exists category text not null default 'jeans',
  add column if not exists resolved_spec jsonb,
  add column if not exists resolution_source text,
  add column if not exists anchor_notes jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();
alter table public.user_anchor_items
  add constraint user_anchor_items_category_check
    check (category in ('jeans', 'chinos', 'pants')),
  add constraint user_anchor_items_resolution_source_check
    check (resolution_source is null or resolution_source in ('catalog', 'self_reported', 'seeded', 'scraped'));
create unique index user_anchor_items_client_id_idx
  on public.user_anchor_items (user_id, client_anchor_id);

with ranked as (
  select
    id,
    row_number() over (partition by user_id order by created_at desc, id desc) as position
  from public.user_anchor_items
  where active = true
)
update public.user_anchor_items as anchors
set active = false
from ranked
where anchors.id = ranked.id and ranked.position > 1;

create unique index user_anchor_items_one_active_idx
  on public.user_anchor_items (user_id)
  where active = true;

create or replace function public.merge_guest_anchors(p_anchors jsonb)
returns setof uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  anchor jsonb;
  merged_id uuid;
  current_user_id uuid := auth.uid();
  requested_active boolean;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if jsonb_typeof(p_anchors) <> 'array' then
    raise exception 'Anchors must be an array';
  end if;

  if jsonb_array_length(p_anchors) > 20 then
    raise exception 'At most 20 anchors may be merged at once';
  end if;

  for anchor in select value from jsonb_array_elements(p_anchors)
  loop
    if nullif(anchor ->> 'clientAnchorId', '') is null
      or nullif(anchor ->> 'brandName', '') is null
      or nullif(anchor ->> 'styleName', '') is null
      or nullif(anchor ->> 'taggedSize', '') is null then
      raise exception 'Each anchor requires clientAnchorId, brandName, styleName, and taggedSize';
    end if;

    requested_active := coalesce((anchor ->> 'active')::boolean, false);
    if requested_active then
      update public.user_anchor_items
      set active = false, updated_at = now()
      where user_id = current_user_id and active = true;
    end if;

    insert into public.user_anchor_items (
      user_id,
      client_anchor_id,
      brand_name,
      style_name,
      tagged_size,
      category,
      tight_or_loose_notes,
      active,
      resolved_spec,
      resolution_source,
      anchor_notes,
      updated_at
    )
    values (
      current_user_id,
      (anchor ->> 'clientAnchorId')::uuid,
      left(anchor ->> 'brandName', 120),
      left(anchor ->> 'styleName', 160),
      left(anchor ->> 'taggedSize', 40),
      coalesce(nullif(anchor ->> 'category', ''), 'jeans'),
      nullif(left(anchor ->> 'fitNotes', 500), ''),
      requested_active,
      anchor -> 'resolvedSpec',
      nullif(anchor ->> 'resolutionSource', ''),
      coalesce(anchor -> 'notes', '{}'::jsonb),
      now()
    )
    on conflict (user_id, client_anchor_id) do update
    set
      brand_name = excluded.brand_name,
      style_name = excluded.style_name,
      tagged_size = excluded.tagged_size,
      category = excluded.category,
      tight_or_loose_notes = excluded.tight_or_loose_notes,
      active = excluded.active,
      resolved_spec = excluded.resolved_spec,
      resolution_source = excluded.resolution_source,
      anchor_notes = excluded.anchor_notes,
      updated_at = now()
    returning id into merged_id;

    return next merged_id;
  end loop;
end;
$$;

revoke all on function public.merge_guest_anchors(jsonb) from public;
grant execute on function public.merge_guest_anchors(jsonb) to authenticated;

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'profiles',
    'size_chart_sources',
    'retailer_links',
    'jobs',
    'products',
    'styles',
    'user_anchor_items'
  ]
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', target_table);
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      target_table
    );
  end loop;
end;
$$;

alter table public.size_chart_sources enable row level security;
alter table public.retailer_links enable row level security;
alter table public.jobs enable row level security;
alter table public.fit_scores enable row level security;

-- Remove legacy public-read policies that exposed review-state rows.
drop policy if exists "public brand read" on public.brands;
drop policy if exists "public merchant read" on public.merchants;
drop policy if exists "public category read" on public.categories;
drop policy if exists "public product read" on public.products;
drop policy if exists "public variant read" on public.product_variants;
drop policy if exists "public media read" on public.product_media;
drop policy if exists "approved measurements read" on public.product_measurements;
drop policy if exists "approved chart read" on public.size_charts;
drop policy if exists "approved entry read" on public.size_chart_entries;
drop policy if exists "public fit taxonomy read" on public.fit_taxonomy;
drop policy if exists "public styles read" on public.styles;
drop policy if exists "public style variants read" on public.style_variants;
drop policy if exists "approved style measurements read" on public.style_measurements;
drop policy if exists "public style vectors read" on public.style_fit_vectors;
drop policy if exists "approved similarity edges read" on public.style_similarity_edges;
drop policy if exists "garment reference catalog public read" on public.garment_reference_catalog;

create policy "published brands read" on public.brands
  for select to anon, authenticated using (status = 'published');
create policy "published merchants read" on public.merchants
  for select to anon, authenticated using (status = 'published' and active = true);
create policy "published categories read" on public.categories
  for select to anon, authenticated using (status = 'published');
create policy "published products read" on public.products
  for select to anon, authenticated using (status = 'published');
create policy "published variants read" on public.product_variants
  for select to anon, authenticated using (
    exists (
      select 1 from public.products
      where products.id = product_variants.product_id and products.status = 'published'
    )
  );
create policy "published media read" on public.product_media
  for select to anon, authenticated using (
    exists (
      select 1 from public.products
      where products.id = product_media.product_id and products.status = 'published'
    )
  );
create policy "published measurements read" on public.product_measurements
  for select to anon, authenticated using (
    status = 'published'
    and approved = true
    and exists (
      select 1 from public.products
      where products.id = product_measurements.product_id
        and products.status = 'published'
    )
  );
create policy "published chart sources read" on public.size_chart_sources
  for select to anon, authenticated using (status = 'published');
create policy "published charts read" on public.size_charts
  for select to anon, authenticated using (
    status = 'published'
    and (
      source_id is null
      or exists (
        select 1 from public.size_chart_sources
        where size_chart_sources.id = size_charts.source_id
          and size_chart_sources.status = 'published'
      )
    )
  );
create policy "published chart entries read" on public.size_chart_entries
  for select to anon, authenticated using (
    exists (
      select 1 from public.size_charts
      where size_charts.id = size_chart_entries.size_chart_id
        and size_charts.status = 'published'
    )
  );
create policy "published inventory read" on public.inventory_snapshots
  for select to anon, authenticated using (
    exists (
      select 1 from public.products
      where products.id = inventory_snapshots.product_id
        and products.status = 'published'
    )
  );
create policy "published taxonomy read" on public.fit_taxonomy
  for select to anon, authenticated using (status = 'published');
create policy "published styles read" on public.styles
  for select to anon, authenticated using (status = 'published' and active = true);
create policy "published style variants read" on public.style_variants
  for select to anon, authenticated using (
    exists (
      select 1 from public.styles
      where styles.id = style_variants.style_id
        and styles.status = 'published'
        and styles.active = true
    )
  );
create policy "published style measurements read" on public.style_measurements
  for select to anon, authenticated using (
    status = 'published'
    and approved = true
    and exists (
      select 1 from public.styles
      where styles.id = style_measurements.style_id
        and styles.status = 'published'
        and styles.active = true
    )
  );
create policy "published style vectors read" on public.style_fit_vectors
  for select to anon, authenticated using (
    exists (
      select 1 from public.styles
      where styles.id = style_fit_vectors.style_id
        and styles.status = 'published'
        and styles.active = true
    )
  );
create policy "published similarity edges read" on public.style_similarity_edges
  for select to anon, authenticated using (
    status = 'published'
    and approved = true
    and exists (
      select 1 from public.styles
      where styles.id = style_similarity_edges.source_style_id
        and styles.status = 'published'
        and styles.active = true
    )
    and exists (
      select 1 from public.styles
      where styles.id = style_similarity_edges.target_style_id
        and styles.status = 'published'
        and styles.active = true
    )
  );
create policy "published references read" on public.garment_reference_catalog
  for select to anon, authenticated using (
    status = 'published'
    and (
      size_chart_source_id is null
      or exists (
        select 1 from public.size_chart_sources
        where size_chart_sources.id = garment_reference_catalog.size_chart_source_id
          and size_chart_sources.status = 'published'
      )
    )
  );
create policy "published retailer links read" on public.retailer_links
  for select to anon, authenticated using (
    status = 'published'
    and (
      product_id is null
      or exists (
        select 1 from public.products
        where products.id = retailer_links.product_id
          and products.status = 'published'
      )
    )
    and (
      style_id is null
      or exists (
        select 1 from public.styles
        where styles.id = retailer_links.style_id
          and styles.status = 'published'
          and styles.active = true
      )
    )
  );

-- Complete ownership policies for nested user data that previously had RLS
-- enabled without a path for the owner.
create policy "profiles own insert" on public.profiles
  for insert to authenticated with check (auth.uid() = id);
create policy "roles own read" on public.user_roles
  for select to authenticated using (auth.uid() = user_id);
create policy "fit scores own" on public.fit_scores
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "carts own" on public.carts
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "cart items own" on public.cart_items
  for all to authenticated
  using (
    exists (
      select 1 from public.carts
      where carts.id = cart_items.cart_id and carts.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.carts
      where carts.id = cart_items.cart_id and carts.user_id = auth.uid()
    )
  );
create policy "order items own read" on public.order_items
  for select to authenticated using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id and orders.user_id = auth.uid()
    )
  );
create policy "returns feedback own" on public.returns_feedback
  for all to authenticated
  using (
    exists (
      select 1
      from public.order_items
      join public.orders on orders.id = order_items.order_id
      where order_items.id = returns_feedback.order_item_id
        and orders.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.order_items
      join public.orders on orders.id = order_items.order_id
      where order_items.id = returns_feedback.order_item_id
        and orders.user_id = auth.uid()
    )
  );
create policy "reviews own insert" on public.reviews
  for insert to authenticated with check (auth.uid() = user_id);
create policy "reviews own update" on public.reviews
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "reviews own delete" on public.reviews
  for delete to authenticated using (auth.uid() = user_id);
create policy "chat messages own" on public.chat_messages
  for all to authenticated
  using (
    exists (
      select 1 from public.chat_sessions
      where chat_sessions.id = chat_messages.session_id
        and chat_sessions.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.chat_sessions
      where chat_sessions.id = chat_messages.session_id
        and chat_sessions.user_id = auth.uid()
    )
  );
create policy "analytics own read" on public.analytics_events
  for select to authenticated using (auth.uid() = user_id);
create policy "analytics own insert" on public.analytics_events
  for insert to authenticated with check (auth.uid() = user_id);

-- Admin mutations are authorized in Postgres, never by client-side role logic.
do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'profiles',
    'user_roles',
    'brands',
    'merchants',
    'categories',
    'products',
    'product_variants',
    'product_media',
    'product_measurements',
    'size_chart_sources',
    'size_charts',
    'size_chart_entries',
    'inventory_snapshots',
    'fit_taxonomy',
    'styles',
    'style_variants',
    'style_measurements',
    'style_fit_vectors',
    'style_similarity_edges',
    'garment_reference_catalog',
    'retailer_links',
    'jobs',
    'import_jobs'
  ]
  loop
    execute format('drop policy if exists "admin manage" on public.%I', target_table);
    execute format(
      'create policy "admin manage" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      target_table
    );
  end loop;
end;
$$;

insert into storage.buckets (id, name, public)
values ('size-chart-snapshots', 'size-chart-snapshots', false)
on conflict (id) do update set public = false;

drop policy if exists "size chart snapshots admin read" on storage.objects;
drop policy if exists "size chart snapshots admin write" on storage.objects;
drop policy if exists "size chart snapshots admin delete" on storage.objects;
create policy "size chart snapshots admin read" on storage.objects
  for select to authenticated
  using (bucket_id = 'size-chart-snapshots' and public.is_admin());
create policy "size chart snapshots admin write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'size-chart-snapshots' and public.is_admin());
create policy "size chart snapshots admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'size-chart-snapshots' and public.is_admin());

commit;
