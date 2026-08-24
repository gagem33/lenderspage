-- Stage 2 of 3: move the lender RPCs onto the bcrypt hash, pin their search_path,
-- and close the two tables. Mirrors the existing sp_* configuration.
--
-- The error string 'invalid pin' is load-bearing API: index.html regex-matches it
-- to clear the stale PIN from sessionStorage and re-prompt. It is preserved exactly.

-- Helper, mirroring public.sp_pin_ok. Not granted to anon: it is only ever called
-- from inside the SECURITY DEFINER functions below.
create or replace function public.lender_pin_ok(p_pin text)
returns boolean
language sql
security definer
set search_path to ''
as $function$
  select coalesce(
    (select extensions.crypt(p_pin, p.pin_hash) = p.pin_hash
       from public.lender_edit_pin p
      where p.pin_hash is not null
      limit 1),
    false);
$function$;

revoke all on function public.lender_pin_ok(text) from public;
revoke all on function public.lender_pin_ok(text) from anon, authenticated;

create or replace function public.lender_mark_verified(p_pin text, p_lender_id text)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if not public.lender_pin_ok(p_pin) then
    raise exception 'invalid pin';
  end if;
  insert into public.lender_updates (lender_id, last_verified, notes)
  values (p_lender_id, current_date, '[]'::jsonb)
  on conflict (lender_id) do update set last_verified = current_date;
end;
$function$;

create or replace function public.lender_add_note(p_pin text, p_lender_id text, p_note text)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if not public.lender_pin_ok(p_pin) then
    raise exception 'invalid pin';
  end if;
  insert into public.lender_updates (lender_id, last_verified, notes)
  values (
    p_lender_id, current_date,
    jsonb_build_array(jsonb_build_object('date', current_date, 'text', p_note))
  )
  on conflict (lender_id) do update
    set last_verified = current_date,
        notes = public.lender_updates.notes || jsonb_build_object('date', current_date, 'text', p_note);
end;
$function$;

create or replace function public.lender_get_updates()
returns table(lender_id text, last_verified date, notes jsonb)
language sql
security definer
set search_path to ''
as $function$
  select lender_id, last_verified, notes from public.lender_updates;
$function$;

-- Close both tables to direct PostgREST access. All client access is via the
-- three RPCs above (verified: index.html uses .rpc() only, never .from()).
alter table public.lender_edit_pin enable row level security;
alter table public.lender_updates  enable row level security;
revoke all on public.lender_edit_pin from anon, authenticated;
revoke all on public.lender_updates  from anon, authenticated;
