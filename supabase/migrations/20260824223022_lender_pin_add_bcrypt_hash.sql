-- Stage 1 of 3: hash the lender edit PIN in place, preserving its current value.
-- The plaintext column is NOT dropped here; that happens in stage 3 only after
-- the hash is proven to round-trip. Mirrors how sp_config.pin_hash already works.

alter table public.lender_edit_pin add column if not exists pin_hash text;

update public.lender_edit_pin
   set pin_hash = extensions.crypt(pin, extensions.gen_salt('bf'))
 where pin is not null;

-- Abort if any row fails to verify against its own hash.
do $$
declare bad int;
begin
  select count(*) into bad
    from public.lender_edit_pin
   where pin is not null
     and (pin_hash is null or extensions.crypt(pin, pin_hash) <> pin_hash);
  if bad > 0 then
    raise exception 'pin hash verification failed for % row(s) - aborting', bad;
  end if;
end $$;
