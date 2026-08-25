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
 │ serves index.html — one file, everything inline
 │
 └──► fonts.googleapis.com  (the only other request the page makes)
```

- No build step. Push to `main` → Vercel deploys.
- **No backend.** No database, no auth, no API. Removed 2026-08-25; the Supabase
  project is empty. Verify with `grep -c supabase index.html` → 0.
- Nothing is stored anywhere. Everything the page shows is in `index.html`.

## 3. Inside `index.html`

Approximate line map (drifts as the file changes — grep, don't trust line numbers):

| Region | Lines | What |
|---|---|---|
| CSS | 1–~1280 | All styles, CSS variables, dark/light theme via `data-theme` |
| HTML shell | ~1280 | Sidebar, 3 views, 6 tool modals |
| `LENDERS` | ~1288–1755 | The data. 20 objects. See DATA.md |
| Render functions | ~1742–2040 | `buildSidebar`, `buildCompareTable`, `buildQuickLists`, `buildLenderDetail`, `showView`, `handleSearch`, `filterSidebar` |

| `init()` | ~2108 | Boots everything, wires modals and tools |
| Tools | ~2197–2440 | Income calc, date calc, bureau search, LTV calc, deal structurer, side-by-side compare |


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

## 4. Backend

There isn't one. Removed 2026-08-25.

Two features used Supabase and both are gone: the Sales Pace tracker
(2026-08-24) and lender update tracking (2026-08-25). The database is empty —
zero tables, zero functions, zero security-advisor findings. The applied
migrations are in `supabase/migrations/`; the history is in
`docs/supabase-contract.md`.

If a backend is ever needed again, read that file's closing section first — it
records two real security findings that were fixed here, and both are easy to
reintroduce.

## 5. Browser state

- `detailOpenSections` — which detail sections are open, per lender, in memory
  for the session. Survives the re-renders inside a session; not persisted.
- Theme preference — in-memory `theme` variable + `data-theme` attribute. Not persisted.
- **Nothing else.** No localStorage, no sessionStorage, no cookies. The page
  stopped using `sessionStorage` when the PIN was removed on 2026-08-25.

## 6. Data flow today

```
index.html LENDERS (hardcoded)
 │
 ├─► compare table / sidebar / quick lists (render on load)
 ├─► lender detail (render on click)
 └─► tools (read a few top-level fields)
```

One source, no fetches. Where that source should come from next — a sync from
the Drive PDFs into `lenders.json` — is `CLAUDE.md`'s product spec, items 1–2.

Program data and verification data are stored in two different places and joined only by `lender.id` in the browser. There is no way to update program values without editing `index.html` and redeploying.

## 7. Google Drive (outside the app)

~21 bank PDFs in Gage's WORK folder (`1VZpc9iLo4BqQIiR-Ju5s36mmaTQiKyiC`). The app has no link to them. `DATA.md` v2 adds `source.drive_file_id` per lender so each record points at its source document.

## 8. What this means for the next changes

1. ~~**Removing Sales Pace**~~ — done 2026-08-24. The Supabase client bootstrap was kept and renamed, as this section advised.
2. ~~**Deleting dead files**~~ — done. `app.js`, `base.css`, `style.css` are gone.
3. **Migrating to DATA.md v2** = extract `LENDERS` to `lenders.json`, fetch it on load, rewrite `buildLenderDetail` to render structured fields instead of HTML blobs, and fix the two tools that parse `maxLTV`. This is the big one and should be done per-lender behind a flag, not all at once.
4. **Anything new that writes data** needs a backend, and there isn't one any more. That is a design conversation before it is a commit — see `CLAUDE.md` working rules.
