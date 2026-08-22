# Supabase contract

What the app expects from the backend, and what the backend actually does.

Verified against the live project on **2026-08-22** via read-only inspection
(`pg_get_functiondef`, `information_schema.role_table_grants`, Supabase security
advisors). Nothing was modified.

The server-side SQL still lives **only in the Supabase dashboard** — there is no
migration history and no copy in version control. See [§7](#7-remaining-open-questions) Q3.

| | |
|---|---|
| Project | **LenderHub** (`llhxiyeqroetebsrjbos`, us-east-1, Postgres 17.6) |
| URL / key | hardcoded at `index.html:2439-2440`; key is publishable — safe to ship |
| Client | `supabase-js@2` from jsDelivr (`index.html:1283`), `{ auth: { persistSession: false } }` |
| Auth | none — every call runs as the anonymous role |

---

## 1. SECURITY FINDINGS — read first

### 🔴 CRITICAL — the lender PIN is publicly readable in plaintext

`public.lender_edit_pin` holds the lender-editing PIN as **plaintext**, has
**RLS disabled**, and grants the `anon` role
`SELECT, INSERT, UPDATE, DELETE, TRUNCATE`.

The table is exposed through PostgREST, so anyone who reads the publishable key
out of the page source — it is in plain sight at `index.html:2440` — can fetch
the PIN directly:

```
GET /rest/v1/lender_edit_pin?select=pin
```

The stored PIN is **4 characters**. It is also writable and truncatable by the
same anonymous role.

> This answers the old open question #1 for the lender functions: they *do*
> validate `p_pin` (see below), but validation is irrelevant when the secret it
> checks against can simply be read.

### 🔴 CRITICAL — `lender_updates` is fully open to anonymous writes

`public.lender_updates` also has **RLS disabled** with the same full `anon`
grants. The three lender RPCs are a front door on an unlocked building: a client
can skip them entirely and read, rewrite, or `TRUNCATE` every lender's
verification date and notes without a PIN.

### ✅ The Sales Pace side is correctly locked down

Different story, same database:

- `sp_config`, `sp_daily_sales`, `sp_monthly_goals` all have **RLS enabled**
  with no policies, and **no grants to `anon` or `authenticated` at all**.
  Direct PostgREST access is denied.
- The sales PIN is **bcrypt-hashed** (`sp_config.pin_hash`, via
  `extensions.crypt` / `gen_salt('bf')`), never stored in plaintext.
- All `sp_*` functions pin `SET search_path TO ''` and call a shared
  `sp_pin_ok()` helper.

So the pattern to copy already exists in this project — the lender tables just
never got it.

### ⚠️ Two different PINs, one client-side slot

There are **two independent PINs**:

| Feature | Secret | Storage | Protected? |
|---|---|---|---|
| Lender update tracking | `lender_edit_pin.pin` | plaintext | ✗ world-readable |
| Sales Pace Tracker | `sp_config.pin_hash` | bcrypt | ✓ |

The client stores only one value, `sessionStorage.sp_pin`, and sends it to both.
They work as a single sign-in **only while the two PINs are kept identical by
hand.** Rotating one silently breaks the other, and `sp_change_pin()` rotates
only the sales one.

### ⚠️ The three lender functions have a mutable `search_path`

`lender_get_updates`, `lender_mark_verified`, and `lender_add_note` are
`SECURITY DEFINER` but do **not** `SET search_path`. The `sp_*` functions all do.

### Suggested remediation — review before running

Not applied. Enabling RLS with no policies denies all direct access, which is
the intent here since access should flow through the `SECURITY DEFINER`
functions — but confirm nothing else reads these tables first.

```sql
-- 1. Close the two open tables (mirrors how sp_* is already configured)
ALTER TABLE public.lender_edit_pin ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lender_updates  ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lender_edit_pin FROM anon, authenticated;
REVOKE ALL ON public.lender_updates  FROM anon, authenticated;

-- 2. Pin search_path on the three lender functions
ALTER FUNCTION public.lender_get_updates()                         SET search_path TO '';
ALTER FUNCTION public.lender_mark_verified(text, text)             SET search_path TO '';
ALTER FUNCTION public.lender_add_note(text, text, text)            SET search_path TO '';
-- (their bodies then need public.-qualified table names, as sp_* already uses)
```

**Rotate the lender PIN after this lands** — assume the current one is
compromised. Hashing it like `sp_config` does is the durable fix; that requires
editing `lender_mark_verified` and `lender_add_note` to call a `crypt()` check
instead of `pin = p_pin`.

---

## 2. Auth model

Five of the six client-called RPCs take `p_pin`. All are `SECURITY DEFINER` and
executable by `anon`.

**Every one does validate its PIN.** Confirmed in the function bodies:

- `sp_*` → `if not public.sp_pin_ok(p_pin) then raise exception 'invalid pin'; end if;`
  where `sp_pin_ok` is a bcrypt comparison against `sp_config.pin_hash`.
- `lender_*` writes → `if not exists (select 1 from lender_edit_pin where pin = p_pin)
  then raise exception 'invalid pin'; end if;` — a plaintext equality check.

Validation is real; the lender secret protecting it is not (§1).

### The `invalid pin` string coupling — confirmed live

The client detects a bad PIN by regex-matching the error message:

```js
if (/invalid pin/i.test(error.message || '')) { sessionStorage.removeItem('sp_pin'); /* re-prompt */ }
```

All five functions raise exactly `'invalid pin'`, so this works today. **The
server's error text is load-bearing API.** Change it to `'bad pin'` or
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
| `lender_mark_verified` | plaintext `=` | `void` | ✗ error only |
| `lender_add_note` | plaintext `=` | `void` | ✗ error only |
| `sp_get_month` | bcrypt | `jsonb` | ✓ |
| `sp_upsert_day` | bcrypt | `void` | ✗ error only |
| `sp_set_goal` | bcrypt | `void` | ✗ error only |

Plus `sp_pin_ok`, `sp_change_pin`, and a dead `sp_set_goal` overload — none
called from `index.html`.

---

## 6. Answered — previously open

| # | Question | Answer |
|---|---|---|
| 1 | Do the functions validate `p_pin`? | **Yes, all five.** But the lender secret is world-readable — §1 |
| 2 | Where does the PIN live? | Two of them: `lender_edit_pin.pin` (plaintext) and `sp_config.pin_hash` (bcrypt) |
| 3 | Is RLS enabled? | **`sp_*` yes; `lender_updates` and `lender_edit_pin` NO** — §1 |
| 4 | `SECURITY DEFINER`? `search_path` pinned? | All 9 are DEFINER. `sp_*` pin `search_path TO ''`; the 3 `lender_*` do not |
| 6 | Is `lender_get_updates` intentionally open? | It takes no PIN by design — but the table beneath it is open too |
| 7 | Exact invalid-PIN message? | Literally `invalid pin`, from all five |
| 8 | Timezone for "today"? | **UTC.** Dallas evenings log as tomorrow — §3 |
| 9 | Note `date` format? | `current_date` → `'YYYY-MM-DD'` |
| 10 | `last_verified` type? | `date` — the client parse is safe |
| 11 | Notes ordering? | Appended oldest-first; client reverse is correct |
| 12 | Return types? | `TABLE`, `jsonb`, and `void` ×4 — §5 |
| 13 | `gross` type? | `numeric` — cents survive |
| 14 | Sundays / future dates? | No constraint; only `>= 0` checks |
| 15 | Table names? | `lender_updates`, `lender_edit_pin`, `sp_daily_sales`, `sp_monthly_goals`, `sp_config` |
| 17 | PIN rotation? | `sp_change_pin()` for sales; **nothing for the lender PIN** |

---

## 7. Remaining open questions

Not answerable by inspection — these need your decision or dashboard access
beyond the database.

1. **Is there brute-force protection on the PIN?** No rate limiting exists in
   the SQL. Whether Supabase's platform-level API limits are configured, and
   whether failed attempts are logged anywhere, is a dashboard question.
   Currently moot for the lender PIN, which can just be read.
2. **Is `lender_get_updates` meant to be public?** It exposes verification dates
   and free-text notes to anyone with the key. Deliberate, or an oversight that
   the open table masked?
3. **Where should this SQL live?** It exists only in the dashboard — no
   migrations, no backup in version control, no review trail. Exporting it to
   `supabase/migrations/` would make it reviewable and recoverable.
4. **Who holds each PIN, and who rotates them?** Rotation invalidates every open
   session, and the two PINs must be changed together to stay in sync.
5. **Is point-in-time recovery enabled?** Relevant because `lender_updates` is
   currently `TRUNCATE`-able by anonymous callers.
6. **Should the dead `sp_set_goal` 4-arg overload be dropped?** Confirm nothing
   external calls it first.
7. **Should adding a note also mark a lender verified?** Current behavior, §3 —
   intended or accidental?
