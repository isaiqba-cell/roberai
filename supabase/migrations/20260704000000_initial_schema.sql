create extension if not exists pgcrypto;
create extension if not exists vector;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  avatar_url text,
  onboarding_completed boolean default false,
  preferred_currency text default 'USD',
  country text default 'US',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists user_roles (
  user_id uuid references profiles(id) on delete cascade,
  role text check (role in ('admin','member')) default 'member',
  primary key (user_id, role)
);

create table if not exists body_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  height_cm numeric,
  weight_kg numeric,
  chest_cm numeric,
  waist_cm numeric,
  hip_cm numeric,
  inseam_cm numeric,
  shoulder_cm numeric,
  shoe_size_us numeric,
  measurement_confidence numeric,
  fit_preference text check (fit_preference in ('slim','regular','relaxed','oversized')),
  measurement_source text check (measurement_source in ('manual','guided_wizard','garment_reference','uploaded','inferred')),
  source_notes text,
  updated_at timestamptz default now()
);

create table if not exists style_preferences (
  user_id uuid references profiles(id) on delete cascade primary key,
  style_tags text[],
  disliked_tags text[],
  color_preferences text[],
  material_preferences text[],
  occasion_preferences text[],
  price_min int,
  price_max int,
  budget_label text,
  updated_at timestamptz default now()
);

create table if not exists fit_preferences (
  user_id uuid references profiles(id) on delete cascade primary key,
  top_fit text,
  bottom_fit text,
  outerwear_fit text,
  shoe_width text,
  preferred_cuts text[],
  avoided_cuts text[],
  notes text,
  updated_at timestamptz default now()
);

create table if not exists favorite_reference_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  brand text,
  category text,
  item_name text,
  size_label text,
  fit_notes text,
  measurements_json jsonb,
  image_url text,
  created_at timestamptz default now()
);

create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  logo_url text,
  positioning text,
  metadata_json jsonb,
  size_chart_confidence text check (size_chart_confidence in ('verified','ai_normalized','unverified'))
);

create table if not exists merchants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  source_type text check (source_type in ('shopify','csv','manual','seed')),
  storefront_url text,
  stripe_account_id text,
  commission_bps int,
  active boolean default true,
  metadata_json jsonb,
  created_at timestamptz default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  parent_id uuid references categories(id)
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid references merchants(id),
  brand_id uuid references brands(id),
  category_id uuid references categories(id),
  external_id text,
  title text not null,
  description text,
  material text,
  category text,
  subcategory text,
  gender_presentation text,
  style_tags text[],
  colors text[],
  materials text[],
  fit_tags text[],
  price_cents int not null,
  currency text default 'USD',
  hero_image_url text,
  images text[],
  searchable_text text,
  style_embedding vector(1024),
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  external_id text,
  size_label text not null,
  color text,
  sku text unique,
  stock int default 100,
  price_cents int,
  compare_at_price_cents int,
  in_stock boolean default true,
  selected_options jsonb,
  garment_spec jsonb,
  measurements_json jsonb,
  stretch_score numeric,
  fit_profile_json jsonb
);

create table if not exists product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  variant_id uuid references product_variants(id),
  url text not null,
  alt text,
  sort_order int default 0
);

create table if not exists product_measurements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  variant_id uuid references product_variants(id) on delete cascade,
  chest_min_cm numeric,
  chest_max_cm numeric,
  waist_min_cm numeric,
  waist_max_cm numeric,
  hip_min_cm numeric,
  hip_max_cm numeric,
  inseam_cm numeric,
  shoulder_cm numeric,
  stretch_pct numeric default 2,
  cut text check (cut in ('slim','regular','relaxed','oversized')),
  source text check (source in ('brand_chart','ai_normalized','manual_admin','seed')),
  approved boolean default false,
  created_at timestamptz default now()
);

create table if not exists size_charts (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id),
  category_id uuid references categories(id),
  raw_source text,
  status text check (status in ('pending_review','approved')) default 'pending_review',
  created_at timestamptz default now()
);

create table if not exists size_chart_entries (
  id uuid primary key default gen_random_uuid(),
  size_chart_id uuid references size_charts(id) on delete cascade,
  size_label text not null,
  canonical_spec jsonb not null
);

create table if not exists inventory_snapshots (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid references merchants(id),
  product_id uuid references products(id),
  variant_id uuid references product_variants(id),
  in_stock boolean,
  inventory_quantity int,
  sellable_quantity int,
  captured_at timestamptz default now()
);

create table if not exists fit_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  variant_id uuid references product_variants(id) on delete cascade,
  confidence int,
  descriptor text,
  recommended_size text,
  explanation_json jsonb,
  dimension_scores jsonb,
  data_quality_score numeric,
  computed_at timestamptz default now(),
  unique (user_id, variant_id)
);

create table if not exists saved_items (
  user_id uuid references profiles(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  variant_id uuid references product_variants(id),
  created_at timestamptz default now(),
  primary key (user_id, product_id)
);

create table if not exists carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  guest_id text,
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid references carts(id) on delete cascade,
  product_id uuid references products(id),
  variant_id uuid references product_variants(id),
  quantity int default 1,
  unit_price int,
  fit_confidence_when_added int
);

create table if not exists addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  line1 text,
  line2 text,
  city text,
  state text,
  postal_code text,
  country text default 'US'
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  address_id uuid references addresses(id),
  stripe_payment_intent_id text,
  subtotal_cents int,
  discount_cents int default 0,
  shipping_cents int default 0,
  fees int default 0,
  total_cents int,
  currency text default 'USD',
  promo_code text,
  status text check (status in ('pending','paid','shipped','delivered','returned','cancelled')) default 'pending',
  shipping_address_json jsonb,
  merchant_breakdown_json jsonb,
  created_at timestamptz default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  variant_id uuid references product_variants(id),
  quantity int,
  unit_price_cents int,
  fit_confidence_at_purchase int
);

create table if not exists returns_feedback (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid references order_items(id) on delete cascade,
  kept boolean,
  fit_feedback text check (fit_feedback in ('too_small','true_to_size','too_large')),
  submitted_at timestamptz default now()
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  user_id uuid references profiles(id),
  rating int check (rating between 1 and 5),
  body text,
  created_at timestamptz default now()
);

create table if not exists chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references chat_sessions(id) on delete cascade,
  role text check (role in ('user','assistant','tool')),
  content jsonb,
  created_at timestamptz default now()
);

create table if not exists recommendation_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  product_id uuid references products(id),
  variant_id uuid references product_variants(id),
  fit_score numeric,
  style_score numeric,
  confidence_score numeric,
  final_score numeric,
  explanation_json jsonb,
  created_at timestamptz default now()
);

create table if not exists search_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  raw_query text,
  parsed_filters jsonb,
  result_count int,
  source text check (source in ('manual','natural_language','stylist')),
  created_at timestamptz default now()
);

create table if not exists notification_preferences (
  user_id uuid references profiles(id) on delete cascade primary key,
  back_in_stock boolean default true,
  price_drop boolean default true,
  order_updates boolean default true,
  wishlist_nudges boolean default true,
  onboarding_reminders boolean default true,
  push_token text,
  updated_at timestamptz default now()
);

create table if not exists analytics_events (
  id bigint generated always as identity primary key,
  user_id uuid,
  event_name text not null,
  properties jsonb,
  created_at timestamptz default now()
);

create table if not exists import_jobs (
  id uuid primary key default gen_random_uuid(),
  provider text,
  status text default 'pending',
  metadata_json jsonb,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table user_roles enable row level security;
alter table body_profiles enable row level security;
alter table style_preferences enable row level security;
alter table fit_preferences enable row level security;
alter table favorite_reference_items enable row level security;
alter table saved_items enable row level security;
alter table carts enable row level security;
alter table cart_items enable row level security;
alter table addresses enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table returns_feedback enable row level security;
alter table chat_sessions enable row level security;
alter table chat_messages enable row level security;
alter table recommendation_events enable row level security;
alter table search_events enable row level security;
alter table notification_preferences enable row level security;
alter table analytics_events enable row level security;

alter table brands enable row level security;
alter table merchants enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table product_media enable row level security;
alter table product_measurements enable row level security;
alter table size_charts enable row level security;
alter table size_chart_entries enable row level security;
alter table inventory_snapshots enable row level security;
alter table reviews enable row level security;
alter table import_jobs enable row level security;

create policy "profiles own read" on profiles for select using (auth.uid() = id);
create policy "profiles own update" on profiles for update using (auth.uid() = id);

create policy "body own" on body_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "style own" on style_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "fit prefs own" on fit_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "reference own" on favorite_reference_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "saved own" on saved_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "addresses own" on addresses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "orders own" on orders for select using (auth.uid() = user_id);
create policy "chat sessions own" on chat_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "search own" on search_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "recommendation own" on recommendation_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notification own" on notification_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "public brand read" on brands for select using (true);
create policy "public merchant read" on merchants for select using (active = true);
create policy "public category read" on categories for select using (true);
create policy "public product read" on products for select using (status = 'active');
create policy "public variant read" on product_variants for select using (true);
create policy "public media read" on product_media for select using (true);
create policy "approved measurements read" on product_measurements for select using (approved = true);
create policy "approved chart read" on size_charts for select using (status = 'approved');
create policy "approved entry read" on size_chart_entries for select using (
  exists (select 1 from size_charts where size_charts.id = size_chart_entries.size_chart_id and size_charts.status = 'approved')
);
create policy "public reviews read" on reviews for select using (true);
