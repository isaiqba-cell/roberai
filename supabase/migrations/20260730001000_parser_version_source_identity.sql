-- Raw bytes can be reparsed by a newer deterministic parser. Source identity
-- therefore belongs to the explicit per-URL version, not URL + content hash.

alter table public.size_chart_sources
  drop constraint if exists size_chart_sources_source_url_content_hash_key;

create index if not exists size_chart_sources_url_hash_idx
  on public.size_chart_sources (source_url, content_hash);
