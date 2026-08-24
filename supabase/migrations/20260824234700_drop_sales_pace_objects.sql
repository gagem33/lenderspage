-- Drop the Sales Pace backend. The UI was removed from index.html in 5e92e47
-- (PR #4); this removes the database objects behind it.
--
-- Data was exported first and handed to Gage on 2026-08-24:
-- sp_daily_sales 11 rows (June 2026), sp_monthly_goals 1 row. NOT committed to
-- the repo, which is public. sp_config held only a bcrypt PIN hash, not exported.
--
-- Functions go first: they exist only to read and write these tables, and
-- leaving them would strand six anon-executable SECURITY DEFINER functions
-- pointing at tables that no longer exist.

drop function if exists public.sp_get_month(text, date);
drop function if exists public.sp_upsert_day(text, date, integer, integer, numeric);
drop function if exists public.sp_set_goal(text, date, integer, integer, numeric);
drop function if exists public.sp_set_goal(text, date, integer, numeric);
drop function if exists public.sp_change_pin(text, text);
drop function if exists public.sp_pin_ok(text);

drop table if exists public.sp_daily_sales;
drop table if exists public.sp_monthly_goals;
drop table if exists public.sp_config;
