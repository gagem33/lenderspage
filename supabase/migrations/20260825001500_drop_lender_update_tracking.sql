-- Remove lender update tracking. Gage chose to delete the whole panel rather
-- than just its PIN gate: freshness now comes from each lender's source PDF
-- effective date instead of a hand-maintained "Mark Verified" button.
--
-- This empties the database entirely. index.html no longer loads supabase-js
-- and makes no network request except Google Fonts.
--
-- Data removed: lender_updates held one row -- amcredit, last_verified
-- 2026-07-24, notes []. Recorded here rather than exported; there is nothing
-- else in it.
--
-- Functions first, then the tables they read.

drop function if exists public.lender_add_note(text, text, text);
drop function if exists public.lender_mark_verified(text, text);
drop function if exists public.lender_get_updates();
drop function if exists public.lender_pin_ok(text);

drop table if exists public.lender_updates;
drop table if exists public.lender_edit_pin;
