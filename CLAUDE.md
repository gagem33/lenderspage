# Lender Hub — CLAUDE.md

Read `aboutme.md` first for how Gage works. This file is the project brain: vision, stack, status, decisions. Keep it current.

## Companion files (read in this order)

| File | What it is |
|---|---|
| `aboutme.md` | How Gage works. Communication, decision, and build rules. |
| `ARCHITECTURE.md` | How the app is wired today. Repo, Supabase, data flow, tools. |
| `DATA.md` | Lender record schema — current state audit + target v2 + migration. |
| `SOURCES.md` | Manifest of bank PDFs in Drive, with file IDs per lender. |
| `EXTRACTION_GUIDE.md` | How to read a bank PDF into the v2 schema. Glossary, quirks, confidence rules, approval process. |

---

## Vision

A lender program reference for the desk/F&I at Southwest Kia Dallas. Gage uses it to compare every bank side-by-side and pick the right lender for a specific customer + deal. Accuracy of program data is the whole point — a stale LTV or tier floor is worse than no data.

**Not** a product to sell. Audience is Gage and his desk. Single editor: Gage.

## Jobs, in priority order

1. **Keep program data current.** Today Gage checks bank portals manually. Target: upload a bank's program PDF → AI extracts values → shows a diff against current data → Gage approves → data updates. Never silent writes.
2. **Structure deals / pick the right bank.** Compare all lenders across all fields at once. There is no short list of "key fields" — Gage uses everything (LTV, credit tier, term, advance, backend, fees, income, vehicle age/miles, etc.).
3. **Quick lookup mid-deal.**
4. **Training reference** for new F&I/desk people (lowest priority).

## Stack

- Frontend: single `index.html`, inline vanilla JS, CSS. Hosted on Vercel → `lender-hub.vercel.app`
- Backend: Supabase project `llhxiyeqroetebsrjbos` (free tier — auto-pauses; restore before running SQL)
- Repo: `github.com/gagem33/lenderspage`

## Google Drive layout

```
LENDERHUB/
 LENDERHUB.md/ ID 1dSDLq8Kk6AgGfqdQaQJ1rhkxOvO-Y-aC — master copy of these 6 md files
 LENDERHUBSOURCES/ ID 1kf_mJ09Sxfg--PQ-xqOXdkouYUJ8ryz9 — 38 bank PDFs + _README; manifest in SOURCES.md
```

The repo holds a committed copy of the md files. Drive is the master; when they diverge, Drive wins and the repo copy gets updated.

## Current state (as of 2026-08-22)

**Working**
- Sidebar + compare table + quick lists + lender detail pages, driven by the `LENDERS` object in `index.html` (20 lenders)
- Six tool modals: income calc, date calc, bureau search, LTV calc, deal structurer, side-by-side compare
- Lender update tracking: Mark Verified / Add Note per lender, PIN-gated. Tables `lender_edit_pin`, `lender_updates`; RPCs `lender_get_updates`, `lender_mark_verified`, `lender_add_note`
- Delegated event listeners on stable parent containers (fixed click-through bug after re-render)

**Known issues**
- `app.js`, `base.css`, `style.css` are dead. None are referenced by `index.html`. Delete.
- Sales Pace tracker references RPCs (`sp_get_month`, `sp_upsert_day`, `sp_set_goal`) that do not exist in the DB. **Decision: remove the feature entirely.**
- Lender data is hardcoded JS. Summary fields are inconsistently formatted strings; all detailed program data is HTML blobs in `sections`. No schema, no per-field source, no verified date at the field level. See DATA.md §1.
- LTV calc and deal structurer parse the `maxLTV` string directly — they break when the schema migrates. See ARCHITECTURE.md §3.4.
- Four lenders have effective-date mismatches between the app and the Drive PDFs (td, gls, kia bulletin, dfc). See SOURCES.md §2.

## Decisions log

| Date | Decision | Why |
|---|---|---|
| 2026-07 | Delegated listeners instead of re-binding on render | Re-render wiped handlers |
| 2026-07 | Public read of verification status, PIN only for writes | Team sees freshness, only Gage edits |
| 2026-08-22 | Remove Sales Pace | Not a lender tool; backend never existed |
| 2026-08-22 | PDF → AI extract → diff → approve is the update model | Accuracy first; no silent writes |
| 2026-08-22 | Audience is SW Kia Dallas desk only | Not building for resale |
| 2026-08-22 | Typed v2 schema (DATA.md) replaces HTML `sections` | Can't diff or compare HTML strings |
| 2026-08-22 | Agent reads PDFs by Drive file ID from SOURCES.md, not by folder scan | Names drift; IDs don't |
| 2026-08-22 | Drive folders consolidated under `LENDERHUB/` | One place for docs + sources |

## Open questions

- `lenders.json` in repo vs Supabase JSONB for v2 data. DATA.md §5 recommends JSON-in-repo first.
- Extraction tooling: manual "paste PDF → Claude → JSON → approve" first, or build a serverless function now? Recommend manual until the schema has survived ~5 lenders.
- Compare table with all v2 fields vs curated columns + "show all" toggle. Gage: "I use everything."
- Rates / buy-rate sheets aren't modeled. Several PDFs are rate sheets. Decide if they belong in scope.
- UI restyle: Gage likes it but thinks it can be better. Not before data work.

## Roadmap (Now / Next / Later)

- **Now:** remove Sales Pace; delete 3 dead files; resolve the 4 date mismatches
- **Next:** migrate 2 lenders (exeter, chase) to v2 by hand from their Drive PDFs using EXTRACTION_GUIDE; make the detail page and the two string-parsing tools render from v2; then do the other 18
- **Later:** automate extraction + diff UI; UI pass; training view

## Working rules for this repo

- Ask before changing the data model or adding a Supabase table/RPC.
- Any change to lender values must cite the source PDF (Drive file ID from SOURCES.md) and effective date.
- Extraction follows EXTRACTION_GUIDE. No writes without Gage's approval of the diff.
- Supabase free tier pauses; if a migration "succeeds" instantly after restore, wait 60s and re-run.
- Keep this file's Current State / Decisions / Open Questions updated at the end of every session.
