-- Scraped measurements are eligible for garment-to-garment matching only when
-- the source explicitly identifies them as garment measurements. Seeded
-- benchmarks remain compatible with their existing basis metadata.

create or replace function public.guard_garment_reference_measurement_basis()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  source_basis text;
  source_origin text;
begin
  if new.size_chart_source_id is null then
    return new;
  end if;

  select measurement_basis, origin
  into source_basis, source_origin
  from public.size_chart_sources
  where id = new.size_chart_source_id;

  if source_origin = 'scraped'
    and source_basis is distinct from 'garment' then
    return null;
  end if;

  return new;
end;
$$;

delete from public.garment_reference_catalog as catalog
using public.size_chart_sources as sources
where catalog.size_chart_source_id = sources.id
  and sources.origin = 'scraped'
  and sources.measurement_basis is distinct from 'garment';

comment on function public.guard_garment_reference_measurement_basis() is
  'Requires explicit garment basis before scraped measurements enter matching.';
