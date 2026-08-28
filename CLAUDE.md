# Lender Hub — CLAUDE.md

Read `aboutme.md` first for how Gage works. This file is the project brain: vision, stack, status, decisions. Keep it current.

## Companion files (read in this order)

| File | What it is |
|---|---|
| `aboutme.md` | How Gage works. Communication, decision, and build rules. |
| `ARCHITECTURE.md` | How the app is wired today. Repo, data flow, tools. No backend since 2026-08-25. |
| `DATA.md` | Lender record schema — current state audit + target v2 + migration. |
| `SOURCES.md` | Manifest of bank PDFs in Drive, with file IDs per lender. |
| `EXTRACTION_GUIDE.md` | How to read a bank PDF into the v2 schema. Glossary, quirks, confidence rules, approval process. **§9 is the one to read first** — render pages and read the images; text layers lie. |
| `docs/SYNC.md` | How a new bank PDF becomes a live change. The sync's mechanics, its three refusals, and the proposal format. |

---

## Vision

A lender program reference for the desk/F&I at Southwest Kia Dallas. Gage uses it to compare every bank side-by-side and pick the right lender for a specific customer + deal. Accuracy of program data is the whole point — a stale LTV or tier floor is worse than no data.

**Not** a product to sell. Audience is Gage and his desk. Single editor: Gage.

## Jobs, in priority order

1. **Keep program data current.** Today Gage checks bank portals manually. Target: upload a bank's program PDF → AI extracts values → shows a diff against current data → Gage approves → data updates. Never silent writes.
2. **Structure deals / pick the right bank.** Compare all lenders across all fields at once. There is no short list of "key fields" — Gage uses everything (LTV, credit tier, term, advance, backend, fees, income, vehicle age/miles, etc.).
3. **Quick lookup mid-deal.**
4. **Training reference** for new F&I/desk people (lowest priority).

## What Gage wants this to be — answered 2026-08-25

Ten questions, ten answers. This is the spec. When something here conflicts with
an older note in this file or another doc, **this section wins.**

| # | Question | Answer |
|---|---|---|
| 1 | How does Drive data reach the app? | **Claude syncs it.** Read the PDFs → extract → show a per-bank diff → Gage approves → deploy. Never a silent write |
| 2 | How often | **Monthly**, plus on demand whenever Gage says so |
| 3 | Rate sheets / buy rates | **In scope.** Rates belong next to LTV and term on the lender page — new; the app has never modelled them |
| 4 | How to know data is current | **From the source PDF, automatically.** Show each lender's effective date + last sync; flag when the PDF is expired or missing. No buttons, nothing to maintain by hand |
| 5 | What he does mid-deal | **All four:** which bank buys this deal · look up one bank's rule · compare two or three side by side · check stips before funding |
| 6 | Who else uses it | **Just Gage.** Optimise for his speed; no hand-holding needed |
| 7 | Phone or desktop | **Both, genuinely.** Desk for structuring, phone for lookups |
| 8 | Compare table density | **Pick-your-columns, remembered.** Not a fixed curated set, not everything always |
| 9 | Deal structurer | **Rank the lenders**, best first, and say why each ranked where it did — not just filter |
| 10 | Design direction | **Faster to navigate.** Keyboard shortcuts, better search, jump-to-lender. Leave the visual style alone |

Note on #4: this replaced the Mark Verified / Add Note panel, which Gage had
deleted the same day. Freshness is a property of the source document, not
something a person should have to remember to click.

## Stack

- Frontend: `index.html` (inline vanilla JS + CSS) plus `lenders.json`, fetched at boot. Hosted on Vercel → `lender-hub.vercel.app`
- **Opening `index.html` from a `file://` path no longer works** — browsers block the fetch. Serve the folder (`python3 -m http.server`) and use `http://localhost:8000`. The page says so if you forget
- **Backend: none.** As of 2026-08-25 the app is a pure static page. It makes no network request except Google Fonts. The Supabase project is empty — every table and function was dropped
- Repo: `github.com/gagem33/lenderspage`
- Sync tooling: `tools/sync.py` (scan / ingest / new / diff / approve / apply) + `tools/pdf_triage.py`. Python 3 + PyMuPDF, run by hand. No service, nothing scheduled

## Google Drive layout

```
LENDERHUB/
 LENDERHUB.md/ ID 1dSDLq8Kk6AgGfqdQaQJ1rhkxOvO-Y-aC — master copy of these 6 md files
 LENDERHUBSOURCES/ ID 1kf_mJ09Sxfg--PQ-xqOXdkouYUJ8ryz9 — 39 bank PDFs + _README; manifest in SOURCES.md
```

The repo holds a committed copy of the md files. Drive is the master; when they diverge, Drive wins and the repo copy gets updated.

## Current state (as of 2026-08-28)

**Working**
- Pure static page — no backend, no auth, no network calls but fonts
- One card list + quick lists, driven by `lenders.json` fetched at boot (20 lenders). The sidebar, the compare table and the separate lender page were all removed on 2026-08-27
- Six tool modals: income calc, date calc, bureau search, LTV calc, deal structurer, side-by-side compare
- Delegated event listeners on stable parent containers (fixed click-through bug after re-render)
- **UI rebuilt on the Desk identity, 2026-08-27.** Gage picked a dark, terminal-dense direction from three, then asked for a layout where lenders open in place. The sidebar and the separate lender page are gone: one list, twenty cards, each opening where it sits with its sections as chips rather than a scroll. The chip row does not move between sections and seven of Exeter's eight sections need no scrolling at all. IBM Plex Sans and Mono, brass accent on near-black, 3–6px radii. Light mode is a cool neutral, not the old cream
- **Navigation speed (spec #10), 2026-08-26.** `/` or `⌘K`/`Ctrl+K` opens a jump-to box that reaches any lender, tool or view — ranked, arrow keys, Enter. Single keys open the six tools (`i b l d s y`), `c` returns to the lender list, `[` and `]` step through lenders, `?` lists the lot. Search now ranks name matches first and says *where* a hit landed (`in Vehicle Eligibility`), which matters because it searches every section's text. Shortcuts never fire while a field has focus; `⌘K` is the one exception, so it works from inside the search box
- **Source freshness on the page (spec #4), 2026-08-26.** Every lender carries a `source` block written by `sync.py freshness` — ISO date, the document it came from, its Drive ID, and when it was last synced. The page turns that into an age badge: green under 90 days, amber past 90, red past a year. It shows on each card — in the collapsed row and again in the open card's stat strip — for the lenders that want a look. Age is computed at render time, so it is never stale. Kia carries an explicit `source.warning` because its document is current and its *contents* are not — no date can express that
- **Rates on the lender page (spec #3), 2026-08-26.** `regional` carries a `Consumer Rates` section — the sheet's full 112-cell grid, sitting directly under LTV & Terms. Every other lender's rate data (floors, bands, usury caps, buy-rate/flat tables) was already in the record; see the Open Questions entry. Rates are searchable, because the detail search already indexes every section's text
- **Drive sync (built 2026-08-26).** `tools/sync.py` does everything around the extraction step: detects new and changed PDFs against a committed Drive snapshot, reports per-lender freshness, validates a proposal, renders it for approval, and writes only approved fields. The gate is enforced in code — `apply` refuses on any undecided field, on a `old` value that no longer matches `lenders.json`, and on any change lacking a page number and verbatim quote. See `docs/SYNC.md`

**Known issues**
- ~~56 proposed changes sitting undecided.~~ **All 20 lenders applied 2026-08-26** — 56 changes across 18 records (chase and exeter went in earlier the same day). Every application is logged in `sync/applied.jsonl` with its Drive file ID and field list.
- ~~**Kia is showing incentive rates that expired 2026-04-14.**~~ **Fixed 2026-08-27.** Gage pulled bulletins **2026-104 / 2026-105** (contracts Aug 4–31, funded by Sep 14) and the Back-End Advance sheet. Re-extracted in full: 16 model pages, 35 rate tables, 264 tier rows, tabs 9 → 12. `source.warning` deleted, freshness reads `kia ok 2026-08-04 (23d old)`, and the `acknowledged.json` entry is gone. The captive is current.
- **Six lenders had wrong values**, all found by reading renders: `regional` (84mo mileage 20K vs 30K, and a missing 54-month row), `flagship` (min income $3,000 vs $2,000; 60mo mileage 140K vs 160K), `capitalone` (backend section mislabelled throughout; min financed $2,000 vs $4,000), `dfc` (GAP floor 80% vs 70%), `gls` (T3–T4 term 75 vs 72), `fifththird` (no 45K mile gate on 76+ terms).
- Lender data now lives in `lenders.json` (moved 2026-08-26), but its *shape* is unchanged. Summary fields are inconsistently formatted strings; all detailed program data is HTML blobs in `sections`. No schema, no per-field source, no verified date at the field level. See DATA.md §1.
- LTV calc and deal structurer parse the `maxLTV` string directly — they break when the schema migrates. See ARCHITECTURE.md §3.4.
- One lender still has an effective-date mismatch: `gls` stores a version string (`2026 (v53)`), not a date, against a PDF dated 2026-07-27. td and dfc were filename errors and were renamed 2026-08-26; kia was re-extracted 2026-08-27. `sync/acknowledged.json` is down to the single `gls` entry. See SOURCES.md §2.
- **26 dead CSS rules** remain from the removed sidebar, compare table and detail page (`#sidebar*`, `.compare-table*`, `.detail-section*`, plus the `--sidebar` custom property). Inert — left rather than deleted mid-rewrite. Worth one cleanup pass.

## Decisions log

| Date | Decision | Why |
|---|---|---|
| 2026-07 | Delegated listeners instead of re-binding on render | Re-render wiped handlers |
| 2026-07 | Public read of verification status, PIN only for writes | Team sees freshness, only Gage edits |
| 2026-08-22 | Remove Sales Pace | Not a lender tool. (The stated reason — "backend never existed" — was wrong; see 2026-08-24 below. The decision stands on the first reason.) |
| 2026-08-22 | PDF → AI extract → diff → approve is the update model | Accuracy first; no silent writes |
| 2026-08-22 | Audience is SW Kia Dallas desk only | Not building for resale |
| 2026-08-22 | Typed v2 schema (DATA.md) replaces HTML `sections` | Can't diff or compare HTML strings |
| 2026-08-22 | Agent reads PDFs by Drive file ID from SOURCES.md, not by folder scan | Names drift; IDs don't |
| 2026-08-22 | Drive folders consolidated under `LENDERHUB/` | One place for docs + sources |
| 2026-08-24 | Lender PIN bcrypt-hashed; RLS on `lender_edit_pin` + `lender_updates`; anon grants revoked; `search_path` pinned on all lender RPCs | The PIN was plaintext and world-readable through PostgREST on a public repo. Copies the `sp_*` pattern that was already correct |
| 2026-08-24 | PIN value kept, not changed, during the migration | Hashing in place avoids breaking the desk mid-shift. Rotation is a separate, still-outstanding step — `docs/supabase-contract.md` §8 |
| 2026-08-24 | Sales Pace removed from `index.html`; its Supabase objects left alone at first | The UI is not a lender tool. But the `sp_*` RPCs and tables **did** exist and held real sales data (11 days, a goal, config), so dropping them was held back as a separate call |
| 2026-08-24 | `sp_*` tables and functions dropped on Gage's instruction | Data exported first — 11 rows of June 2026 sales + the goal row, sent to Gage as `.sql` and `.csv`, **not** committed since the repo is public. `sp_config` held only a bcrypt PIN hash and was not exported. That export is the only copy |
| 2026-08-25 | Lender update tracking removed entirely — panel, PIN, both tables, all four RPCs | Gage's call when asked whether to drop just the PIN or the whole feature. Freshness now comes from the source PDF's effective date (spec #4), which is better: it can't go stale through forgetfulness |
| 2026-08-25 | **The app has no backend at all.** Supabase project emptied; supabase-js CDN tag removed | Nothing left needed it. Removes the PIN rotation item permanently, and the publishable key in the page source stops mattering |
| 2026-08-25 | Ten-question product spec captured above | Gage: "I am so confused where we are at on this build." The spec is now written down instead of inferred |
| 2026-08-25 | Triage the whole corpus before building the sync | 35 of 39 files extract cleanly; the damage is 6 pages in 4 files. Cheap to know up front. It also flagged AmeriCredit's per-state valuation map, which on 2026-08-26 turned out to be in the app already — see that day's entry |
| 2026-08-26 | `LENDERS` moved from `index.html` into `lenders.json`, fetched at boot | A Drive sync should be a data change, not a code edit. `DATA.md` §5 recommended it; the roadmap made it the prerequisite for the sync. Costs one same-origin fetch and breaks `file://` opening |
| 2026-08-26 | Drive sync built as a **local tool, not a service** | The extraction step is an agent reading rendered pages (EXTRACTION_GUIDE §9). It cannot be a cron job, and the approval gate means it should not be one. Everything around it is deterministic and now automated |
| 2026-08-26 | Approval enforced by three refusals in `apply`, not by convention | "No silent writes" is only true if something refuses. Undecided field, stale `old`, or a missing page/quote each stop the write |
| 2026-08-26 | Provenance stays **beside** `lenders.json`, not inside it | Per-field source and verified-date would be a data model change, and the working rules say ask first. The proposal + `sync/applied.jsonl` + git history carry it meanwhile |
| 2026-08-26 | Freshness compares the **authority document** only | Funding Guidelines and Proof of Residence are not authority for a program date (SOURCES.md §1). Counting them made capitalone, westlake and flagship look stale when they were not |
| 2026-08-26 | **One list defines the shortcuts and the help sheet** | `SHORTCUTS` carries the key, the description and the handler together, and `?` renders from it. A cheat-sheet maintained separately is one that eventually lies about a key |
| 2026-08-26 | **Single-key shortcuts are suppressed while typing; `⌘K` is not** | Gage types customer income into these calculators. A stray `d` opening the deal structurer mid-entry would be worse than having no shortcuts. `⌘K` skips the guard because reaching for the jump box from inside a search field is the normal case |
| 2026-08-26 | **Sidebar search says where it matched** | It searches every section's HTML text, so `gap` returns all 20 lenders. Twenty results with no reason is the same as no filter; `in Backend Products` is the part that makes it usable |
| 2026-08-27 | **One view, not two** | A lender opening inside its own card removes the reason `view-lender` existed. `showView` stays as the navigation entry point so the jump box, quick lists, `[`/`]` and the deal structurer all keep working — they just open a card now |
| 2026-08-27 | **The sidebar was 248px the compare table needed** | It was the reason the table clipped at 1440px. Dropping it fits every column with room to spare, and the jump box plus `[`/`]` already did everything the sidebar's list did |
| 2026-08-27 | **A card's chip row never moves; its bottom edge does** | The pane caps at `min(56vh, 460px)` and shrinks to fit shorter sections. Measured across Exeter's eight: the chips stay pinned at the same y, only one section scrolls at all. Fixing the height instead would buy nothing and add dead space |
| 2026-08-27 | **Three defects died with the code that caused them** | The stat truncated mid-word was a `.substring(0,16)` in `buildLenderDetail`; the 1191px-in-1134px overflow was the compare table; the 65–163px row swing was prose columns. None survive the rewrite |
| 2026-08-27 | **Kia re-extracted off bulletins 2026-104 / 2026-105** | The first current Kia data the app has held. 16 model pages, 35 tables, 264 tier rows. 2026-104 carries the current model year per model; 2026-105 carries MY 2026 plus K4 and Sportage, which 104 omits. Prior model year prices about a point better — Carnival MY 2026 tier 1/2 opens at 1.90% against MY 2027's 2.90% |
| 2026-08-27 | **A `0.00%` is only "not offered" in the 73–84 column** | The first fix over-corrected. Treating `0.00%` as a greyed cell *everywhere* blanked four genuine subvented 0% APR offers — Sorento, Sorento Hybrid, Sportage and Sportage Hybrid, all K500 tier 1/2, 24–48 months — so the desk was shown "not offered" on the best rate in the bulletin. The greyed block is only ever 73–84; elsewhere a zero is a rate. Caught by putting Sportage on screen beside its own PDF, not by any check |
| 2026-08-27 | **The 73–84 column is read from the render, never the text layer** | Those cells say `0.00%` (K500 tiers 3–8) and `#N/A` (K506) but are **greyed out**: the term is not offered. Taken at face value they publish as a 0% APR on a live deal. K500 runs past 72 months on tier 1/2 only; K506 stops at 72. Asserted in code across all 16 models |
| 2026-08-27 | **Kia backend rewritten — the stored comparison was backwards** | It read "20% of amount financed or $5,000 — whichever is **less**". The sheet says the **greater** of 20% of **invoice** or $5,000: wrong operator, wrong base, understating the advance. It also showed the branded PPES/JM&A limits as the only limits; non-branded is 15%/$4,000 and 11%/$3,000 with a $1,000 GAP cap. `gapMax` is now `$1,500 branded / $1,000 non-branded` |
| 2026-08-27 | **The Lease (K502) tab was deleted, not carried** | Neither August bulletin contains lease money and the old figures died in April. A tab showing expired lease money is worse than no tab. Reinstating it needs its own PDF |
| 2026-08-28 | **End-of-day docs pass: the roadmap was describing a finished job** | "Now: run the sync across the corpus" had been done for two days, and "Next" listed three specs that had all shipped. Rewritten around what is actually left — the v2 schema, and Gage's rep conversations. Also corrected: Current State still listed the removed PIN panel as Working and the deleted `app.js`/`base.css`/`style.css` as present, ARCHITECTURE §3.3 still documented `buildLenderDetail`, and the `?` sheet still called `c` the "Compare table" nine days after the table was deleted |
| 2026-08-28 | **#8 is a redesign now, not a port** | Pick-your-columns was specified against a compare table that no longer exists. Reinstating the table just to hang a picker on it would undo the 2026-08-27 layout decision, so the surface is an open design question before it is a schema one |
| 2026-08-27 | **Rate tables are extracted positionally, not from text order** | A first pass silently collapsed K4's two trim-scoped K506 tables into one; a second missed the `For All Other Model #s:` banner variant on Sportage. `find_tables()` plus render checks caught both. Text order cannot express a table that repeats a program code under different trims |
| 2026-08-26 | **Freshness is a stored date, never a stored age** | An age baked into `lenders.json` is wrong the next morning and nobody notices. `source.date` is ISO; `index.html` subtracts from `Date.now()` at render. The only cost is that the badge needs the page open, which is when it matters |
| 2026-08-26 | **Age thresholds: 90 days amber, 365 red** | Gage's call. 90 days is the point a bank is worth re-checking; past a year the document is not aging, it is out of date. `dfc` sat at 378 days behind a wrong filename and nothing on the page said so |
| 2026-08-26 | **One freshness computation, two consumers** | `freshness()` was lifted out of `cmd_scan` so the terminal report and the data the page reads come from the same function. A number the terminal knows and the desk cannot see does not satisfy spec #4, and two implementations would drift |
| 2026-08-26 | **Kia gets an explicit `source.warning`, applied through the gate** | Its bulletin is dated July and would badge green, but the incentive rates inside it died on 2026-04-14. This is the one case a date-based badge gets wrong, so it is stated in words rather than inferred. `sync.py freshness` preserves an existing warning rather than recomputing it |
| 2026-08-26 | **Rates ship as a `sections.rates` entry, not a new schema** | `sections` is already a per-lender dict with bespoke keys (`gap`, `incentives`, `smallbusiness`, `program`), and the detail page renders `Object.values()`. A rate table is therefore a data change, not a data model change — which is what let it go in without a schema conversation |
| 2026-08-26 | **`sync.py` now places a newly created section at a canonical slot** | Dict order *is* display order, so `set_path` would have dropped Consumer Rates at the bottom of the page. `SECTION_ORDER` puts `rates` beside LTV & Terms per spec #3. It only moves keys it just created; sections a proposal did not touch keep the order they have |
| 2026-08-26 | **The "six lenders missing rate data" open question was wrong** | Checked all 20 records against their sheets before extracting. Five of the six already had their rates; `fifththird` has no buy-rate table at all and `santander` publishes no rate figures. Only `regional` was a real gap. Written originally from the sweep's ambiguity flags without reading the records — the same mistake as the AmeriCredit p11 note |
| 2026-08-26 | **`regional` consumer rate grid applied — 112 cells** | 4 model-year bands × 4 front-end LTV bands × 7 tiers, off the TX Program Sheet (`13dk1uBsz8kLhtDIsoRLD-v62w9eMOu04`, eff. 05/27/2026). Read twice — a 300 dpi render of each half and the text layer — and the two agree in document order on all 112, asserted in code rather than by eye |
| 2026-08-26 | **`td` and `dfc` Drive files renamed to match their documents** | Both stated their own dates internally — TD `06/30/2026` (and `PROD-9034 Effective 06.30.2026` on Program Sheet2), DFC `Revision Date: 8/13/2025`. The records were right and the filenames were wrong. Three files renamed; IDs unchanged. `acknowledged.json` is down from four entries to two |
| 2026-08-26 | **Corpus sweep applied** | All 56 changes approved by Gage and written through the gate. 18 records changed; chase and exeter were already done. 20 ledger entries |
| 2026-08-26 | **Full corpus sweep: all 20 lenders read at 300 dpi** | 18 proposals, 56 changes, all undecided. Every lender had something missing; six had values that were flat wrong. Two acknowledged date divergences (td, dfc) turned out to be wrong *filenames*, not wrong data — both documents state their own date internally. See `sync/proposals/` |
| 2026-08-26 | **`exeter` synced — 6 sections** | Reading the 2026-06-12 sheet at 300 dpi found the 20-cell max-term grid (mileage × vehicle age) the record never had, Texas book source (J.D. Power clean trade), DTI 77–87%, the $1,500 maintenance/tire/wheel cap, ExeterPLUS Bronze/Silver VSC, repo and tradeline rules, garnishments, and proof-of-insurance stips. `maxTerm` left at 84 on Gage's call — the bank does 84, case-by-case, not score-driven |
| 2026-08-26 | **First sync applied through the gate: `chase` backend rows** | Reading the Chase sheet at 300 dpi found three rows the record never had — the sub-$12K aftermarket tier (35% of MSRP / Cash Selling Price) and the MBP cap for MSRP/CSP under $12,000 ($3,500). Approved by Gage, written by `sync.py apply`, logged in `sync/applied.jsonl`. The pipeline has now been used for real, not just tested |
| 2026-08-26 | `sync/acknowledged.json` hides settled divergences | td, gls, kia and dfc were adjudicated on 2026-08-26. A report that flags the same four every month stops being read |
| 2026-08-24 | Shared Supabase client renamed `SP_*` → `SB_*` / `sbClient()` / `editPin()`, session key `sp_pin` → `lender_edit_pin` | The `sp` prefix referred to a feature that no longer exists. `ARCHITECTURE.md` §8 had flagged this rename as part of the removal |

## Open questions

- ~~**Three lender programs are missing from the app.**~~ **Resolved 2026-08-26.** `truist` and `ally` were re-extracted by rendering and applied; `amcredit` p11 was never missing. Kept here because the applied values are worth spot-checking:
  - `truist` — Texas GAP cap (lesser of $1,200 or 5% of amount financed), the 48-cell per-tier max-term table, and the JD Power / KBB collateral-book split. Applied 2026-08-26
  - `ally` — the 84-month advance matrix above $100K, the upfit and non-prime rows, and the 5-model-year / 75,000-beginning-mile gate. Applied 2026-08-26
  - `amcredit` — p11's valuation map was already in the app and already correct. No change
- **~160 lender values changed on 2026-08-24 have been checked by nobody but Claude.** Each cites a Drive file ID and page in `AUDIT.md`. Spot-check before trusting them on a live deal.
- ~~**Rate sheets are still unmodelled and it has now cost data on at least six lenders.**~~ **Resolved 2026-08-26 — and the claim was mostly wrong.** Checked every lender's stored record against what its sheet actually publishes. Five of the six named already had their rate data: `gls` 9.95%, `exeter` 10.95%/9.95%, `westlake` 8.79–23.99% / 7.99–19.90%, `cps` "as low as 14.55%", `bofa`'s 9-row buy-rate/flat table, plus `chase`'s 24.99% cap and `ally`'s 24.00%/25.00% usury caps. `fifththird` has **no buy-rate table at all** — its page 1 is a *dealer reserve* rate-adjustment schedule, already stored in `reserve` in full, and the "Rate Sheet (Page 2)" title sits on a funding checklist. `santander`'s sheet publishes **no rate figures**, only the buydown rule, already stored. The one genuine gap was `regional`'s 112-cell consumer grid, now applied. Same failure mode as the AmeriCredit p11 note (SOURCES.md §3): written from the sweep's ambiguity flags without reading the records.
- **Two lenders' sheets may be the wrong program for a franchise store.** The `cps` sheet is headed "Non-Franchised" and the `westlake` sheet is "Independent Dealer Rate Sheet". Southwest Kia is a franchise store. Westlake's Prime Program Sheet is already in Drive (`1fwQ1YndmQi0zq9r5WTDTmAy9hhVje6VI`) and is probably the right one. Worth asking both reps which sheet applies.
- **Unsourced claims about bureaus appear on at least six lenders.** `chase`, `exeter`, `fifththird`, `gls`, `regional` and `capitalone` all assert which bureaus are pulled; none of their documents say so. Either they came from a rep conversation worth recording, or they should come out.
- **Two values in `chase` have no source document.** `bureaus.note` says "All three bureaus; uses middle score" and `chargebackWindow` says "N/A (flat fee model)" — the Program Sheet states neither. Left as-is on 2026-08-26; either find the doc they came from or drop them. Same question probably applies to other lenders.
- **DFC's program sheet is genuinely a year old.** Now that the filename matches the document, the freshness scan reads it honestly: `dfc ok 2025-08-13 (378d old)`. The wrong filename had been masking that. Worth asking the rep whether a 2026 sheet exists.
- **The extraction checks cannot see a wrongly-blanked cell.** Validation confirms every non-blank cell is a well-formed percentage and that 73–84 is live only on tier 1/2. A false negative — a real rate turned into a dash — passes both. The 0% APR error survived until a render was put beside the extraction. Any future rate sweep needs that comparison, not just the assertions.
- **Kia lease (K502) money is not on the page.** The August bulletins are APR only, so the Lease tab was removed rather than left showing March figures. KFA publishes lease separately — it needs its own PDF.
- **Kia's back-end advance sheet is 500 days old** (effective 2025-04-14). It is the newest KFA publishes on back-end, so it is current rather than stale, but worth a rep conversation.
- ~~**The Kia warning has no expiry of its own.**~~ **Cleared 2026-08-27**, by hand and in the same proposal as the re-extraction — which is how it was always meant to go. The mechanism stands for next time: `sync.py freshness` preserves a warning rather than recomputing it, so whoever loads a current bulletin has to delete the banner deliberately.

- `lenders.json` in repo vs Supabase JSONB for v2 data. DATA.md §5 recommends JSON-in-repo first.
- ~~Extraction tooling: manual first or serverless now?~~ **Settled 2026-08-26: local tooling, no service.** `tools/sync.py` automates everything except reading the pages. A serverless extractor would need an API key and a backend, and would still stop at the same approval gate.
- **Should provenance move into `lenders.json`?** Per-field `source_page` / `verified_date` would make freshness a property of each value rather than the record. It is a data model change, so it needs Gage's call. Today provenance lives in the proposal + `sync/applied.jsonl`.
- Compare table with all v2 fields vs curated columns + "show all" toggle. Gage: "I use everything."
- ~~Rates / buy-rate sheets aren't modeled.~~ **Settled 2026-08-26.** Rates live in a `rates` section like every other program area — no schema change, since `sections` already carries per-lender keys (`gap`, `incentives`, `smallbusiness`, `program`). Still open: whether a rate floor should also become a **top-level field**, which is what a compare column (#8) or a stat-grid tile would need. That one is a data model change and needs Gage's call.
- ~~UI restyle: Gage likes it but thinks it can be better.~~ **Done 2026-08-27** — Desk identity plus the card layout. Still open: 26 CSS rules for the removed sidebar, compare table and detail page are now dead and were left in place rather than deleted mid-rewrite. Inert, but worth a cleanup pass.

## Roadmap (Now / Next / Later)

Rewritten 2026-08-28. Everything the old roadmap called "Now" and "Next" has shipped:
the corpus sweep is applied, and specs #3 (rates), #4 (freshness) and #10 (navigation)
went in on 2026-08-26, with the UI rebuild (#7, #10) on 2026-08-27.

- **Done:** Sales Pace removed; 3 dead files deleted; the 4 date mismatches resolved; all 149 audit WRONG findings applied except Kia K506 bonus cash; the Supabase project emptied; the full 20-lender corpus sweep applied through the gate; rates, freshness, navigation and the Desk UI shipped; Kia brought current off the August bulletins
- **Now — nothing is blocking a live deal.** The data is as good as reading the PDFs can make it. What is left is Gage's to do, not code: the rep conversations in Open Questions (Kia lease sheet, Kia back-end at 500 days, DFC at 378 days, whether CPS and Westlake are even the right programs for a franchise store, and the six lenders whose bureau claims no document supports)
- **Next — the v2 schema.** It is now the only thing standing between the app and specs #8 and #9, and it is a data model change, so it starts with a conversation, not a commit. DATA.md holds the target shape
- **Blocked on the v2 schema:**
  - **#9, the ranking deal structurer.** The worse of the two. It prices every deal off a hardcoded `prime 6% · near 9% · sub 14% · deep 20%` and tests only FICO minimum and LTV cap, so it cannot rank on anything Gage actually uses. Real rate data now exists in `sections.rates` for the lenders that publish it — but as HTML, which the structurer cannot read
  - **#8, pick-your-columns.** No longer a port: the compare table it was specified against was deleted on 2026-08-27. The question is now *what surface* a column picker lives on — a returning table, a denser card row, or something else — and that is a design call before it is a schema one
- **Also waiting on a decision:** whether a rate floor becomes a top-level field (needed by any compare column or stat tile), and whether provenance moves into `lenders.json` per field. Both are data model changes; both are in Open Questions
- **Cheap and unblocked:** delete the 26 dead CSS rules; decide whether the two unsourced `chase` values stay or go
- **Later:** a diff UI over `sync.py` so approving a proposal is not a terminal read; training view

## Working rules for this repo

- Ask before changing the data model. There is no Supabase any more — if something needs a backend again, that is a conversation first, not a commit.
- Any change to lender values must cite the source PDF (Drive file ID from SOURCES.md) and effective date.
- Extraction follows EXTRACTION_GUIDE. No writes without Gage's approval of the diff.
- Keep this file's Current State / Decisions / Open Questions updated at the end of every session.
