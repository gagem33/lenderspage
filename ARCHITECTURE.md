# Lender Hub — ARCHITECTURE.md

How the app is wired today. Factual, from `main` on 2026-08-22. Not a design doc — the target design lives in `CLAUDE.md` (open questions) and `DATA.md` (target schema).

---

## 1. Repo contents

| File | Size | Status |
|---|---|---|
| `index.html` | ~96 KB | **The app.** HTML + CSS + JS inline. No lender data. |
| `lenders.json` | ~201 KB | **The data.** 20 lender records, fetched at boot. |
| `tools/pdf_triage.py` | — | Classifies a source PDF's text layer and renders pages. |
| `.gitignore` | — | — |

Two files matter. They split on 2026-08-26: the app is code, `lenders.json` is
data, and a Drive sync touches only the second one.

**`file://` no longer works.** Browsers block a `file://` page from fetching
`lenders.json`, so opening `index.html` by double-clicking shows a load error
with instructions. Serve the folder instead:

```
python3 -m http.server        # then http://localhost:8000
```

## 2. Hosting and services

```
Browser ──► Vercel (static, lender-hub.vercel.app)
 │ serves index.html, which fetches lenders.json (same origin)
 │
 └──► fonts.googleapis.com  (the only off-origin request the page makes)
```

- No build step. Push to `main` → Vercel deploys.
- **No backend.** No database, no auth, no API. Removed 2026-08-25; the Supabase
  project is empty. Verify with `grep -c supabase index.html` → 0.
- Nothing is stored anywhere. Everything the page shows ships in the repo —
  chrome in `index.html`, program values in `lenders.json`.

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
lenders.json ──fetch──► boot() ──► LENDERS ──► init()
                                    │
                                    ├─► compare table / sidebar / quick lists
                                    ├─► lender detail (render on click)
                                    └─► tools (read a few top-level fields)
```

`boot()` awaits the fetch before calling `init()`, so every render path can keep
assuming `LENDERS` is populated. A failed fetch replaces the page with an error
rather than rendering an empty app.

Updating program values is now a `lenders.json` edit and a push — no code change.
What should *produce* that edit is the Drive sync in `CLAUDE.md`'s spec, items
1–2: Claude reads the PDFs, shows a per-bank diff, Gage approves, it deploys.
The records still carry the v1 shape (`DATA.md` §1), not the typed v2 schema.

## 7. Google Drive (outside the app)

39 bank PDFs in `LENDERHUB/LENDERHUBSOURCES` (`1kf_mJ09Sxfg--PQ-xqOXdkouYUJ8ryz9`), manifest in `SOURCES.md`. The app has no link to them — nothing in the browser reads Drive. `DATA.md` v2 adds `source.drive_file_id` per lender so each record points at its source document.

**The sync (built 2026-08-26).** `tools/sync.py` is the path from those PDFs to
`lenders.json`. It runs on a laptop, not on a server, and nothing about it is
scheduled — the folder is not watched.

```
Drive folder ──list──► sync.py scan      new / changed / stale
      │
      ├──download──► sync.py ingest ──► sync/pdfs/*.pdf      (gitignored)
      │                                      │
      │                              pdf_triage.py --render
      │                                      │
      │                                 sync/pages/*.png     (gitignored)
      │                                      │
      │                              agent reads the images
      │                                      ▼
      │                           sync/proposals/*.json      (committed)
      │                                      │
      │                              sync.py diff ──► Gage
      │                                      │
      │                            approve / reject each field
      │                                      ▼
      └───────────────────────────► sync.py apply ──► lenders.json
                                                 └─► sync/applied.jsonl
```

`apply` refuses to write on an undecided field, on an `old` value that no longer
matches `lenders.json`, or on a change with no page number and verbatim quote.
Working files live under `sync/`; the PDFs and renders are gitignored because they
are Gage's bank documents and the repo is public. Details in `docs/SYNC.md`.

## 8. What this means for the next changes

1. ~~**Removing Sales Pace**~~ — done 2026-08-24. The Supabase client bootstrap was kept and renamed, as this section advised.
2. ~~**Deleting dead files**~~ — done. `app.js`, `base.css`, `style.css` are gone.
3. **Migrating to DATA.md v2** = extract `LENDERS` to `lenders.json`, fetch it on load, rewrite `buildLenderDetail` to render structured fields instead of HTML blobs, and fix the two tools that parse `maxLTV`. This is the big one and should be done per-lender behind a flag, not all at once.
4. **Anything new that writes data** needs a backend, and there isn't one any more. That is a design conversation before it is a commit — see `CLAUDE.md` working rules.
