# Lender Hub — ARCHITECTURE.md

How the app is wired today. Factual, from `main` on 2026-08-22. Not a design doc — the target design lives in `CLAUDE.md` (open questions) and `DATA.md` (target schema).

---

## 1. Repo contents

| File | Size | Status |
|---|---|---|
| `index.html` | ~307 KB | **The entire app.** HTML + CSS + JS + lender data, all inline. |
| `app.js` | — | Dead. Not referenced by `index.html`. |
| `base.css`, `style.css` | — | Dead. Not linked from `index.html`. |
| `.gitignore` | 8 B | — |

Only `index.html` matters. The other three are leftovers from an earlier split and can be deleted once confirmed nothing external loads them.

## 2. Hosting and services

```
Browser ──► Vercel (static, lender-hub.vercel.app)
 │ serves index.html
 │
 ├──► cdn.jsdelivr.net @supabase/supabase-js@2 (loaded at runtime)
 │
 └──► Supabase llhxiyeqroetebsrjbos.supabase.co
 publishable key hardcoded in index.html (SB_KEY)
 auth: none (persistSession:false). All access via RPCs.
```

- No build step. Push to `main` → Vercel deploys.
- No server code. Everything is client-side JS + Supabase RPCs.
- Supabase free tier: project auto-pauses after inactivity. Restore in dashboard, wait ~60–90s, then SQL works.

## 3. Inside `index.html`

Approximate line map (drifts as the file changes — grep, don't trust line numbers):

| Region | Lines | What |
|---|---|---|
| CSS | 1–~1280 | All styles, CSS variables, dark/light theme via `data-theme` |
| HTML shell | ~1280 | Sidebar, 3 views, 6 tool modals |
| `LENDERS` | ~1288–1755 | The data. 20 objects. See DATA.md |
| Render functions | ~1742–2040 | `buildSidebar`, `buildCompareTable`, `buildQuickLists`, `buildLenderDetail`, `showView`, `handleSearch`, `filterSidebar` |
| Lender updates (`lu*`) | ~1898–2003 | Verified/notes panel, Supabase RPC calls, PIN handling |
| `init()` | ~2108 | Boots everything, wires modals and tools |
| Tools | ~2197–2440 | Income calc, date calc, bureau search, LTV calc, deal structurer, side-by-side compare |
| Supabase client | end of the script | `sbClient()` + `editPin()`. All that remains of the removed Sales Pace block |

### 3.1 Views

Two `div.view` elements toggled by `showView(name, lenderId)`:
- `view-compare` — default. Sidebar + compare table + quick lists.
- `view-lender` — one lender's detail page, built by `buildLenderDetail(lender)`.

`view-pace` (Sales Pace) was removed 2026-08-24.

### 3.2 Render model

Everything is string-templated `innerHTML`. No framework. Re-rendering a region wipes its DOM, so event handlers are bound via **delegation on stable parent containers**, not on rendered children. Keep this pattern; it's the fix for the click-through bug from July.

### 3.3 Lender detail page

`buildLenderDetail` renders header fields from the top-level lender keys, then dumps each `sections.*.content` HTML string verbatim. This is why the detail page can't be driven by structured data yet — the content *is* HTML.

### 3.4 Tools (modals)

Six modals wired by `makeModal(btnId, modalId, closeId)` in `init()`:

| Tool | Reads from `LENDERS` | Notes |
|---|---|---|
| Income calc | nothing | pure math |
| Date calc | nothing | pure math |
| Bureau search | `bureaus` | |
| LTV calc | `maxLTV`, `segment`, `name` | parses the `maxLTV` string — fragile against formats like "150–175%" |
| Deal structurer | `ficoMin`, `maxLTV`, `maxTerm`, `segment` | same fragility |
| Side-by-side compare | top-level fields | |

The LTV calc and deal structurer are the two places where moving to DATA.md v2 typed fields will change behavior. Anything touching `maxLTV` string parsing needs to be updated when the schema migrates.

## 4. Supabase

### 4.1 Tables (from July session — verify in dashboard)
- `lender_edit_pin` — single row, the team PIN. Read only via RPC.
- `lender_updates` — one row per lender: `lender_id`, `verified_at`, `note`, `updated_at`.

### 4.2 RPCs
| RPC | Called from | Exists? |
|---|---|---|
| `lender_get_updates()` | `luLoad()` | yes |
| `lender_mark_verified(lender_id, pin)` | `luBindPanel` | yes |
| `lender_add_note(lender_id, pin, note)` | `luBindPanel` | yes |
| `lender_pin_ok(pin)` | the two writers above | yes — internal, not callable by `anon` |

The three `sp_*` RPCs were **dropped from the database on 2026-08-24**, along
with their three tables. Nothing named `sp_*` remains.

⚠️ This table used to mark those RPCs `Exists? no`. That was wrong — live
inspection on 2026-08-22 found all six functions and all three tables populated.
The data was exported to Gage before the drop. See `docs/supabase-contract.md` §4.

Public can read `lender_updates` through the RPC. Writes require the PIN passed as an argument; the RPC checks it server-side. No Supabase auth is used anywhere.

### 4.3 Client
One shared client, lazily created by `sbClient()`, with `SB_URL` / `SB_KEY`.
Named `spGetClient` / `SP_*` until 2026-08-24 — the prefix came from Sales Pace
even though the lender-update code was the other caller. Renamed when that
feature was removed, since the prefix no longer referred to anything.

## 5. Browser state

- `sessionStorage['lender_edit_pin']` — the PIN after first successful entry, per tab. Cleared on a wrong-PIN response. Was `sp_pin` until 2026-08-24; renamed with the client above, so anyone mid-session re-enters the PIN once.
- Theme preference — in-memory `theme` variable + `data-theme` attribute. Not persisted.
- No other persistence. No localStorage.

## 6. Data flow today

```
index.html LENDERS (hardcoded)
 │
 ├─► compare table / sidebar / quick lists (render on load)
 ├─► lender detail (render on click)
 └─► tools (read a few top-level fields)

Supabase lender_updates
 │
 └─► luLoad() on init ─► verified/notes badges on detail page
```

Program data and verification data are stored in two different places and joined only by `lender.id` in the browser. There is no way to update program values without editing `index.html` and redeploying.

## 7. Google Drive (outside the app)

~21 bank PDFs in Gage's WORK folder (`1VZpc9iLo4BqQIiR-Ju5s36mmaTQiKyiC`). The app has no link to them. `DATA.md` v2 adds `source.drive_file_id` per lender so each record points at its source document.

## 8. What this means for the next changes

1. ~~**Removing Sales Pace**~~ — done 2026-08-24. The Supabase client bootstrap was kept and renamed, as this section advised.
2. ~~**Deleting dead files**~~ — done. `app.js`, `base.css`, `style.css` are gone.
3. **Migrating to DATA.md v2** = extract `LENDERS` to `lenders.json`, fetch it on load, rewrite `buildLenderDetail` to render structured fields instead of HTML blobs, and fix the two tools that parse `maxLTV`. This is the big one and should be done per-lender behind a flag, not all at once.
4. **Anything new that writes data** must go through a Supabase RPC that checks the PIN. Don't add table-level write policies.
