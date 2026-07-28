begin;

create or replace function public.set_active_anchor(p_anchor_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.user_anchor_items
    where id = p_anchor_id and user_id = current_user_id
  ) then
    raise exception 'Anchor not found';
  end if;

  update public.user_anchor_items
  set active = false, updated_at = now()
  where user_id = current_user_id and active = true;

  update public.user_anchor_items
  set active = true, updated_at = now()
  where id = p_anchor_id and user_id = current_user_id;

  return true;
end;
$$;

revoke all on function public.set_active_anchor(uuid) from public;
grant execute on function public.set_active_anchor(uuid) to authenticated;

commit;
