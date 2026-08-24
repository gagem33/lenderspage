# Supabase contract

What the app expects from the backend, and what the backend actually does.

First verified against the live project on **2026-08-22** via read-only
inspection (`pg_get_functiondef`, `information_schema.role_table_grants`,
Supabase security advisors).

**Updated 2026-08-24**, when the two CRITICAL findings in §1 were fixed by
migration. Re-verified after the change.

Correction to the 2026-08-22 draft: it said there was "no migration history."
There is — `supabase_migrations.schema_migrations` holds the `sp_*` and
`lender_update_tracking` migrations, and now the three from 2026-08-24. What is
still true is that **no copy of the SQL lives in this repo**; the bodies quoted
below are the version of record here. See [§7](#7-remaining-open-questions) Q3.

| | |
|---|---|
| Project | **LenderHub** (`llhxiyeqroetebsrjbos`, us-east-1, Postgres 17.6) |
| URL / key | hardcoded at `index.html:2439-2440`; key is publishable — safe to ship |
| Client | `supabase-js@2` from jsDelivr (`index.html:1283`), `{ auth: { persistSession: false } }` |
| Auth | none — every call runs as the anonymous role |

---

## 1. SECURITY FINDINGS — resolved 2026-08-24

Both CRITICAL findings below were **fixed on 2026-08-24** by three migrations
applied to the live project. The original findings are kept for the record;
each now carries what was actually done.

| Migration | What it did |
|---|---|
| `20260824223022_lender_pin_add_bcrypt_hash` | Added `pin_hash`, populated it from the plaintext PIN, aborted unless every row round-tripped |
| `20260824223037_lender_rpcs_bcrypt_and_rls` | Added `lender_pin_ok()`, moved the three RPCs onto it, pinned `search_path`, enabled RLS, revoked the `anon` grants |
| `20260824223205_lender_pin_drop_plaintext` | Dropped the plaintext `pin` column |

**The PIN value did not change.** It was hashed in place, so the same PIN the
desk already uses still works. It was never read out of the database or printed
during the migration — verification was done in SQL with
`crypt(pin, pin_hash) = pin_hash`.

### ✅ FIXED — the lender PIN was publicly readable in plaintext

`public.lender_edit_pin` held the lender-editing PIN as **plaintext**, had
**RLS disabled**, and granted the `anon` role
`SELECT, INSERT, UPDATE, DELETE, TRUNCATE`.

The table was exposed through PostgREST, so anyone who read the publishable key
out of the page source — it is in plain sight at `index.html:2489` — could fetch
the PIN directly:

```
GET /rest/v1/lender_edit_pin?select=pin     # 200 before, permission denied now
```

The stored PIN was **4 characters**, and was also writable and truncatable by
the same anonymous role.

**Now:** the column is `pin_hash`, bcrypt (`$2…`, 60 chars), and the table has
RLS on with no `anon` grants. `lender_pin_ok()` does the comparison, exactly as
`sp_pin_ok()` already did for the sales side.

> ⚠️ **The PIN itself is still the compromised one.** Hashing protects it from
> here on, but it was world-readable on a public repo for the life of the
> project. See [§8](#8-rotate-the-lender-pin) — rotation is a separate step and
> has not been done.

### ✅ FIXED — `lender_updates` was fully open to anonymous writes

`public.lender_updates` had **RLS disabled** with the same full `anon` grants. A
client could skip the RPCs entirely and read, rewrite, or `TRUNCATE` every
lender's verification date and notes without a PIN.

**Now:** RLS on, no `anon`/`authenticated` grants. All access goes through the
three `SECURITY DEFINER` RPCs, which is safe because the functions are owned by
`postgres` — the table owner — so they bypass RLS while callers cannot.

Verified safe to close: `index.html` reaches the backend **only** via `.rpc()`
and never `.from()` (`grep -n '\.from(\|\.rpc(' index.html`).

### ✅ FIXED — the three lender functions had a mutable `search_path`

`lender_get_updates`, `lender_mark_verified` and `lender_add_note` were
`SECURITY DEFINER` without `SET search_path`. All three now
`SET search_path TO ''` with `public.`-qualified table names, matching `sp_*`.
`lender_pin_ok` is `SET search_path TO ''` and is **not** granted to `anon` or
`authenticated` — it is only callable from inside the definer functions, the
same treatment `sp_pin_ok` gets.

### ✅ The Sales Pace side was already locked down

Different story, same database — this is the pattern the fix copied:

- `sp_config`, `sp_daily_sales`, `sp_monthly_goals` all have **RLS enabled**
  with no policies, and **no grants to `anon` or `authenticated` at all**.
- The sales PIN is **bcrypt-hashed** (`sp_config.pin_hash`, via
  `extensions.crypt` / `gen_salt('bf')`), never stored in plaintext.
- All `sp_*` functions pin `SET search_path TO ''` and call `sp_pin_ok()`.

### ⚠️ Two different PINs, one client-side slot — and they do NOT match

There are **two independent PINs**:

| Feature | Secret | Storage | Protected? |
|---|---|---|---|
| Lender update tracking | `lender_edit_pin.pin_hash` | bcrypt | ✓ (since 2026-08-24) |
| Sales Pace Tracker | `sp_config.pin_hash` | bcrypt | ✓ |

The client stores only one value, `sessionStorage.sp_pin`, and sends it to both.

**Measured 2026-08-24: the two PINs are different.** Checked without reading
either, via `crypt(lender_pin, sp_config.pin_hash) = sp_config.pin_hash`, which
returned false. So a single typed PIN unlocks only one of the two features —
whichever it belongs to. This was true before the migration too; hashing did not
cause it. It stops mattering once Sales Pace is removed
(`CLAUDE.md` decision, 2026-08-22 — still not done).

### What the security advisor says now

The two CRITICAL items are gone. What remains is by design:

- `rls_enabled_no_policy` (INFO) on all five tables — intended. RLS with no
  policy denies all direct access; the `SECURITY DEFINER` functions are the
  only door. The `sp_*` tables have always looked like this.
- `anon_security_definer_function_executable` (WARN) on the RPCs — intended.
  The app has no auth; it calls them anonymously and passes a PIN. This warning
  already applied to every `sp_*` function before the migration.

### Post-migration verification

Run as the `anon` role — the same role PostgREST uses — via `set local role anon`:

| Check | Result |
|---|---|
| `lender_get_updates()` as anon | OK, returns rows |
| `SELECT` on `lender_edit_pin` as anon | `permission denied for table lender_edit_pin` |
| `SELECT` on `lender_updates` as anon | `permission denied for table lender_updates` |
| `TRUNCATE lender_updates` as anon | `permission denied for table lender_updates` |
| `lender_mark_verified` with a wrong PIN | raises `invalid pin`; client regex matches |
| `lender_pin_ok` called by anon | `permission denied for function lender_pin_ok` |
| `lender_mark_verified` with the real PIN | OK — wrote and read back `last_verified` |
| `lender_add_note` with the real PIN | OK — note appended and read back |

The write tests ran against a throwaway `__selftest__` row, which was deleted;
`lender_updates` is back to its original 1 row.

Not verified from here: the public HTTPS endpoint. This sandbox's proxy blocks
`supabase.co`, so the checks above were run server-side as `anon` rather than
over REST. PostgREST cannot exceed the privileges of the role it authenticates
as, so the grant and RLS results carry over — but a browser smoke test of Mark
Verified is still worth doing once.


## 2. Auth model

Five of the six client-called RPCs take `p_pin`. All are `SECURITY DEFINER` and
executable by `anon`.

**Every one does validate its PIN.** Confirmed in the function bodies:

- `sp_*` → `if not public.sp_pin_ok(p_pin) then raise exception 'invalid pin'; end if;`
  where `sp_pin_ok` is a bcrypt comparison against `sp_config.pin_hash`.
- `lender_*` writes → `if not public.lender_pin_ok(p_pin) then raise exception
  'invalid pin'; end if;` where `lender_pin_ok` is a bcrypt comparison against
  `lender_edit_pin.pin_hash`. **Since 2026-08-24**; it was a plaintext equality
  check (`where pin = p_pin`) before that.

Both sides now validate against a hash. See §1 for what changed.

### The `invalid pin` string coupling — confirmed live

The client detects a bad PIN by regex-matching the error message:

```js
if (/invalid pin/i.test(error.message || '')) { sessionStorage.removeItem('sp_pin'); /* re-prompt */ }
```

All five functions raise exactly `'invalid pin'`, so this works today —
re-confirmed after the 2026-08-24 migration, which deliberately preserved the
string. **The server's error text is load-bearing API.** Change it to `'bad pin'` or
`'unauthorized'` and the client stops clearing the stale PIN, degrading to a
"Save failed — try again" loop that never recovers.

Both sides of the coupling:

```sh
grep -n 'invalid pin' index.html    # client
# server: the five function bodies below
```

### Read/write asymmetry

`lender_get_updates` takes **no PIN** — verification dates and notes are
readable by anyone with the publishable key, by design. `sp_get_month` **does**
require one, so sales figures are gated on read.

---

## 3. Lender update tracking

`index.html:1894-2001`. Keyed by `LENDERS[].id` — see `CLAUDE.md` §4 on renaming.

**Table `public.lender_updates`** — PK `lender_id`:

| Column | Type | Notes |
|---|---|---|
| `lender_id` | `text` | matches `LENDERS[].id` |
| `last_verified` | `date` | nullable |
| `notes` | `jsonb` | default `'[]'`, array of `{date, text}` |

### `lender_get_updates()`

```sql
RETURNS TABLE(lender_id text, last_verified date, notes jsonb)
LANGUAGE sql SECURITY DEFINER
AS $$ select lender_id, last_verified, notes from lender_updates; $$
```

No arguments, no PIN. Returns every row — one per lender that has ever been
touched, not one per lender in `LENDERS[]`.

Client-side contract, all now confirmed safe:

- `last_verified` is a Postgres `date`, serialised `'YYYY-MM-DD'`. The client's
  `new Date(last_verified + 'T00:00:00')` parse is correct. **If this column is
  ever widened to `timestamptz` the staleness badge breaks silently**
  (`NaN days since last verified`).
- `notes` is appended with `||`, so it is stored **oldest-first**. The client
  does `.slice().reverse()` for newest-first display — correct as written.
- **Errors are swallowed** (`if (error) return;`). A backend failure here is
  invisible: no badge, no message, no console output.

Staleness is computed client-side: `LU_STALE_DAYS = 90`.

### `lender_mark_verified(p_pin text, p_lender_id text) RETURNS void`

Upserts `last_verified = current_date`; on insert seeds `notes` to `'[]'`.

### `lender_add_note(p_pin text, p_lender_id text, p_note text) RETURNS void`

Appends `{date: current_date, text: p_note}` to `notes` — **and also sets
`last_verified = current_date`.**

> ⚠️ **Undocumented side effect.** Adding a note silently marks the lender
> verified today. The UI presents "Mark Verified Today" and "Add Note" as
> separate actions, but the second does both. You cannot log a note without
> resetting the 90-day staleness clock.

Both return `void`; the client inspects only `error` and refetches via `luLoad()`.

### `lender_pin_ok(p_pin text) RETURNS boolean` — internal

Added 2026-08-24. Not called by the client and not callable by it: `EXECUTE` is
revoked from `PUBLIC`, `anon` and `authenticated`, so it is reachable only from
inside the two `SECURITY DEFINER` writers above. Mirrors `sp_pin_ok`.

```sql
CREATE OR REPLACE FUNCTION public.lender_pin_ok(p_pin text)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select coalesce(
    (select extensions.crypt(p_pin, p.pin_hash) = p.pin_hash
       from public.lender_edit_pin p
      where p.pin_hash is not null
      limit 1),
    false);
$function$
```

Returns `false` — never an error — for a wrong PIN, an empty string, `NULL`, or
a missing/`NULL` hash. The *callers* turn that into `raise exception 'invalid pin'`.

**Table `public.lender_edit_pin`** — single row, `id integer` + `pin_hash text`.
The `pin text` column was dropped 2026-08-24.

### ⚠️ `current_date` is UTC

The database timezone is **UTC** (verified). The dealership is in Dallas
(US/Central, UTC−5/−6), so any verification or note logged after **6:00 PM local
in summer / 7:00 PM in winter** records **tomorrow's date**. This affects both
`last_verified` and every `notes[].date`.

---

## 4. Sales Pace Tracker

`index.html:2438-2629`. PIN-gated on read and write; polls every 45s while
`#view-pace` is active. Month keys are `'YYYY-MM-01'`, day keys `'YYYY-MM-DD'`,
both built from **local browser time**.

**Tables** (all RLS-enabled, no `anon` grants):

| Table | PK | Columns |
|---|---|---|
| `sp_daily_sales` | `sale_date` | `new_units int ≥0`, `used_units int ≥0`, `gross numeric`, `updated_at timestamptz` |
| `sp_monthly_goals` | `month` | `unit_goal int ≥0`, `new_goal int ≥0`, `used_goal int ≥0`, `gross_goal numeric` |
| `sp_config` | `id` (=1) | `pin_hash text` (bcrypt) |

### `sp_get_month(p_pin text, p_month date) RETURNS jsonb`

Truncates `p_month` to month start server-side, so any day in the month works.
Returns a **single jsonb object**:

```js
{ days: [ { sale_date, new_units, used_units, gross } ],   // [] when empty, ordered by sale_date
  goal: { unit_goal, new_goal, used_goal, gross_goal } }   // null when no goal row
```

`days` is `coalesce(..., '[]')` so it is never null; `goal` **is** null when
absent, which the client handles (`|| null`).

Note the server also returns `unit_goal`, which the client ignores — it derives
the total as `new_goal + used_goal` instead. Both are maintained, so they agree.

### `sp_upsert_day(p_pin text, p_date date, p_new int, p_used int, p_gross numeric) RETURNS void`

Upsert on `sale_date`, `updated_at = now()`. Negatives clamped with
`greatest(x, 0)`; blank inputs send `0`, not `null`.

**No constraint on Sundays or future dates.** The UI only generates Mon–Sat rows
for the current month, but a direct call can write any date, and such a row will
be stored and returned by `sp_get_month` while never appearing in the table.

The client does not refetch after a save — it trusts the write and lets the 45s
poll reconcile.

### `sp_set_goal(...) RETURNS void` — ⚠️ two overloads exist

| Signature | Status |
|---|---|
| `(p_pin, p_month, p_new_goal int, p_used_goal int, p_gross_goal numeric)` | **live** — what the client calls; writes `new_goal`, `used_goal`, and a derived `unit_goal` |
| `(p_pin, p_month, p_unit_goal int, p_gross_goal numeric)` | **dead** — leftover from an earlier design; writes `unit_goal` only, leaving `new_goal`/`used_goal` stale |

PostgREST resolves these by argument name, so the live call is unambiguous
today. The 4-arg version is unreferenced dead code that would corrupt the
new/used split if anything called it — the backend twin of the dead files in
this repo. Worth dropping once confirmed unused.

### Functions not called by the client

- `sp_pin_ok(p_pin text) → boolean` — shared bcrypt check used by every `sp_*`.
- `sp_change_pin(p_old text, p_new text)` — rotates `sp_config.pin_hash`;
  requires the old PIN, enforces `length >= 4`. **This is the sales PIN rotation
  mechanism.** There is no equivalent for the lender PIN.

---

## 5. Summary

| RPC | PIN check | Returns | Client uses return? |
|---|---|---|---|
| `lender_get_updates` | none | `TABLE(text, date, jsonb)` | ✓ |
| `lender_mark_verified` | bcrypt | `void` | ✗ error only |
| `lender_add_note` | bcrypt | `void` | ✗ error only |
| `sp_get_month` | bcrypt | `jsonb` | ✓ |
| `sp_upsert_day` | bcrypt | `void` | ✗ error only |
| `sp_set_goal` | bcrypt | `void` | ✗ error only |

Plus `lender_pin_ok`, `sp_pin_ok`, `sp_change_pin`, and a dead `sp_set_goal`
overload — none called from `index.html`. The two `*_pin_ok` helpers are not
callable by `anon` at all.

---

## 6. Answered — previously open

| # | Question | Answer |
|---|---|---|
| 1 | Do the functions validate `p_pin`? | **Yes, all five**, and since 2026-08-24 both sides check a bcrypt hash — §1 |
| 2 | Where does the PIN live? | Two of them: `lender_edit_pin.pin_hash` and `sp_config.pin_hash`, both bcrypt. **They are different values** — §1 |
| 3 | Is RLS enabled? | **Yes, on all five tables** since 2026-08-24 — §1 |
| 4 | `SECURITY DEFINER`? `search_path` pinned? | All 10 are DEFINER, and all now pin `search_path TO ''` |
| 6 | Is `lender_get_updates` intentionally open? | It takes no PIN by design. The table beneath it is now closed, so the RPC is the only way in — but it still returns everything to anyone with the key |
| 7 | Exact invalid-PIN message? | Literally `invalid pin`, from all five |
| 8 | Timezone for "today"? | **UTC.** Dallas evenings log as tomorrow — §3 |
| 9 | Note `date` format? | `current_date` → `'YYYY-MM-DD'` |
| 10 | `last_verified` type? | `date` — the client parse is safe |
| 11 | Notes ordering? | Appended oldest-first; client reverse is correct |
| 12 | Return types? | `TABLE`, `jsonb`, and `void` ×4 — §5 |
| 13 | `gross` type? | `numeric` — cents survive |
| 14 | Sundays / future dates? | No constraint; only `>= 0` checks |
| 15 | Table names? | `lender_updates`, `lender_edit_pin`, `sp_daily_sales`, `sp_monthly_goals`, `sp_config` |
| 17 | PIN rotation? | `sp_change_pin()` for sales; **still nothing for the lender PIN** — rotate by hand, §8 |

---

## 7. Remaining open questions

Not answerable by inspection — these need your decision or dashboard access
beyond the database.

1. **Is there brute-force protection on the PIN?** No rate limiting exists in
   the SQL. Whether Supabase's platform-level API limits are configured, and
   whether failed attempts are logged anywhere, is a dashboard question. This
   matters more now: with the PIN hashed, guessing is the only attack left, and
   a 4-character PIN is a small space.
2. **Is `lender_get_updates` meant to be public?** It exposes verification dates
   and free-text notes to anyone with the key. Deliberate, or an oversight that
   the open table masked?
3. **Where should this SQL live?** There *is* migration history in
   `supabase_migrations.schema_migrations` (correcting the 2026-08-22 draft),
   but no copy in this repo — no review trail on a PR. Exporting to
   `supabase/migrations/` would fix that.
4. **Who holds each PIN, and who rotates them?** Rotation invalidates every open
   session. Note the two PINs are already out of sync (§1), so "changed together"
   is not the current state.
8. **Should a `lender_change_pin` RPC exist?** Rotation is a hand-run SQL
   statement today (§8). Adding one is a new Supabase RPC, which `CLAUDE.md`
   says to ask about first — so it has not been added.
5. **Is point-in-time recovery enabled?** Less urgent now that `lender_updates`
   is no longer `TRUNCATE`-able by anonymous callers, but still unanswered.
6. **Should the dead `sp_set_goal` 4-arg overload be dropped?** Confirm nothing
   external calls it first.
7. **Should adding a note also mark a lender verified?** Current behavior, §3 —
   intended or accidental?

---

## 8. Rotate the lender PIN

**Not done. This is the remaining work from §1.**

Hashing protects the PIN from here on, but the value itself was readable by
anyone with the publishable key — which is in the page source of a public repo —
for the life of the project. Treat it as compromised.

There is no `lender_change_pin` RPC (`sp_change_pin` exists only for the sales
side, and rotates only that PIN). Adding one would mean a new Supabase RPC,
which `CLAUDE.md` says to ask about first. Until then, rotate from the Supabase
dashboard SQL editor:

```sql
update public.lender_edit_pin
   set pin_hash = extensions.crypt('NEW_PIN_HERE', extensions.gen_salt('bf'));
```

Then confirm before closing the editor — this returns `true` if it took:

```sql
select public.lender_pin_ok('NEW_PIN_HERE');
```

Notes:

- Run it in the dashboard, not anywhere that logs the statement. The new PIN is
  in plaintext in that query.
- There is no recovery path. If the new PIN is lost, the only fix is to run this
  statement again with another one.
- This rotates the **lender** PIN only. The Sales Pace PIN is a different value
  (§1) and rotates via `sp_change_pin`.

