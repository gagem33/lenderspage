-- Stage 3 of 3: destroy the plaintext PIN, now that the bcrypt path is proven.
-- Re-verified immediately before the drop; aborts if any row would be lost.

do $$
declare bad int;
begin
  select count(*) into bad
    from public.lender_edit_pin
   where pin_hash is null or pin_hash not like '$2%' or length(pin_hash) <> 60;
  if bad > 0 then
    raise exception 'refusing to drop plaintext: % row(s) lack a valid bcrypt hash', bad;
  end if;
end $$;

alter table public.lender_edit_pin drop column pin;
