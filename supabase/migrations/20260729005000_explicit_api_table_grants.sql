begin;

-- Keep local, preview, and hosted projects aligned. Table privileges permit an
-- operation to reach RLS; policies remain the authority for individual rows.
grant usage on schema public to anon, authenticated, service_role;

grant select on all tables in schema public to anon;
grant select, insert, update, delete on all tables in schema public
  to authenticated;
grant usage, select on all sequences in schema public to authenticated;

grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;

commit;
