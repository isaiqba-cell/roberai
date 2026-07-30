-- Parser revisions replace the previous interpretation of identical source
-- bytes. Retire all rows tied to the superseded parser before the new version
-- is published so stale sizes cannot remain public.

create or replace function public.supersede_size_chart_parser_revision()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  previous_parser_version text;
  next_parser_version text;
begin
  if new.supersedes_source_id is null or new.origin <> 'scraped' then
    return new;
  end if;

  next_parser_version := nullif(new.metadata_json ->> 'parserVersion', '');
  if next_parser_version is null then
    return new;
  end if;

  select coalesce(
    nullif(metadata_json ->> 'parserVersion', ''),
    'legacy'
  )
  into previous_parser_version
  from public.size_chart_sources
  where id = new.supersedes_source_id;

  if previous_parser_version is not distinct from next_parser_version then
    return new;
  end if;

  update public.size_chart_sources
  set
    status = 'rejected',
    needs_review = false,
    metadata_json = metadata_json || jsonb_build_object(
      'supersededByParserVersion', next_parser_version,
      'supersededAt', now()
    ),
    updated_at = now()
  where id = new.supersedes_source_id;

  update public.size_charts
  set status = 'rejected'
  where source_id = new.supersedes_source_id;

  update public.garment_reference_catalog
  set status = 'rejected'
  where size_chart_source_id = new.supersedes_source_id;

  update public.products
  set status = 'rejected'
  where size_chart_source_id = new.supersedes_source_id;

  update public.styles
  set status = 'rejected', active = false
  where size_chart_source_id = new.supersedes_source_id;

  update public.product_measurements
  set status = 'rejected', approved = false
  where size_chart_source_id = new.supersedes_source_id;

  update public.style_measurements
  set status = 'rejected', approved = false
  where size_chart_source_id = new.supersedes_source_id;

  update public.retailer_links
  set status = 'rejected', updated_at = now()
  where size_chart_source_id = new.supersedes_source_id;

  return new;
end;
$$;

drop trigger if exists supersede_size_chart_parser_revision
  on public.size_chart_sources;
create trigger supersede_size_chart_parser_revision
  after insert on public.size_chart_sources
  for each row execute function public.supersede_size_chart_parser_revision();

revoke all on function public.supersede_size_chart_parser_revision()
  from public;

comment on function public.supersede_size_chart_parser_revision() is
  'Retires rows from a source version when a newer parser revision replaces it.';
