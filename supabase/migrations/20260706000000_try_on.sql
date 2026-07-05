-- Photo-based virtual try-on (Phases T1-T2).
-- A user's reference photo is sensitive personal data, more sensitive than
-- the body measurements already covered by favorite_reference_items /
-- profiles.body. It is never stored publicly, never analyzed for anything
-- beyond generating the account holder's own try-on renders, and deleting
-- the source photo cascade-deletes every render derived from it.

create table if not exists try_on_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  storage_path text not null,
  status text check (status in ('active', 'deleted')) not null default 'active',
  created_at timestamptz default now()
);

create table if not exists try_on_renders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  try_on_photo_id uuid references try_on_photos(id) on delete cascade,
  variant_id uuid references product_variants(id) on delete cascade,
  storage_path text,
  provider text check (provider in ('mock', 'huggingface', 'replicate')) not null default 'mock',
  status text check (status in ('pending', 'ready', 'failed')) not null default 'pending',
  created_at timestamptz default now(),
  unique (try_on_photo_id, variant_id)
);

alter table try_on_photos enable row level security;
alter table try_on_renders enable row level security;

create policy "try on photos own" on try_on_photos for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "try on renders own" on try_on_renders for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Private bucket: source photos live under photos/{user_id}/..., renders
-- under renders/{user_id}/... Never public; always accessed via short-lived
-- signed URLs generated server-side (see supabase/functions/generate-try-on).
insert into storage.buckets (id, name, public)
values ('try-on-assets', 'try-on-assets', false)
on conflict (id) do nothing;

create policy "try on assets own read" on storage.objects for select
  using (bucket_id = 'try-on-assets' and (storage.foldername(name))[2] = auth.uid()::text);
create policy "try on assets own write" on storage.objects for insert
  with check (bucket_id = 'try-on-assets' and (storage.foldername(name))[2] = auth.uid()::text);
create policy "try on assets own delete" on storage.objects for delete
  using (bucket_id = 'try-on-assets' and (storage.foldername(name))[2] = auth.uid()::text);
