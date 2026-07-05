-- Garment-to-garment fit matching restructure (Phase R1).
-- Adds jeans/chino/pants construction dimensions and a brand+model+size
-- resolution catalog so a user's reference garment can be compared directly
-- against other brands' garment specs, instead of only against a body profile.

alter table product_measurements
  add column if not exists thigh_cm numeric,
  add column if not exists rise_cm numeric,
  add column if not exists leg_opening_cm numeric,
  add column if not exists hem_cm numeric,
  add column if not exists knee_cm numeric;

alter table favorite_reference_items
  add column if not exists brand_slug text,
  add column if not exists model_name text,
  add column if not exists canonical_spec jsonb,
  add column if not exists resolved_from_catalog boolean not null default false;

-- Brand + model/style name + size resolution table. Seeded densely for jeans
-- (the hero category) using real-world reference brands/models as user-input
-- anchors only; the seeded catalog a user is recommended from stays fictional.
create table if not exists garment_reference_catalog (
  id uuid primary key default gen_random_uuid(),
  brand_slug text not null,
  model_name text not null,
  size_label text not null,
  category text check (category in ('jeans', 'chinos', 'pants')) not null default 'jeans',
  canonical_spec jsonb not null,
  created_at timestamptz default now(),
  unique (brand_slug, model_name, size_label)
);

alter table garment_reference_catalog enable row level security;
create policy "garment reference catalog public read" on garment_reference_catalog
  for select using (true);

alter table fit_scores
  add column if not exists match_path text
    check (match_path in ('garment_to_garment', 'body_to_garment'))
    not null default 'body_to_garment';

alter table recommendation_events
  add column if not exists match_path text
    check (match_path in ('garment_to_garment', 'body_to_garment'))
    not null default 'body_to_garment';
