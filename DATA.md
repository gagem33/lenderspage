# Lender Hub — DATA.md

The lender data contract. What a lender record is, what each field means, where values come from, and the rules for changing them. Any PDF → extract → diff → approve flow depends on this file being accurate.

Audit basis: `lenders.json` on `main`, 20 lenders. Current-state audit pulled 2026-08-22 from `index.html`, before the data moved to `lenders.json` on 2026-08-26; the counts in §1 were re-measured 2026-08-28 and still hold. §2's target was rewritten 2026-08-28 — see the decisions there.

---

## 1. Current state (what exists today)

### 1.1 Lenders (20)

| id | name | segmentLabel | effectiveDate (as stored) |
|---|---|---|---|
| amcredit | AmeriCredit | Near-Prime | June 12, 2026 |
| exeter | Exeter Finance | Sub-Prime | June 12, 2026 |
| regional | Regional Acceptance | Sub-Prime | May 27, 2026 |
| truist | Truist | Prime | July 20, 2026 |
| td | TD Auto Finance | Near-Prime | June 30, 2026 |
| wellsfargo | Wells Fargo | Prime | June 16, 2026 |
| ally | Ally Financial | Prime+ | April 1, 2026 |
| fifththird | Fifth Third Bank | Near-Prime | July 23, 2026 |
| gls | GLS / Global Lending | Sub-Prime | July 27, 2026 (v53) |
| capitalone | Capital One | All Tiers (0–9) | January 2026 |
| westlake | Westlake Financial | Deep Sub-Prime | July 2026 |
| kia | Kia Finance | Near-Prime | Jan 6, 2026 · K500/K506 Sept 1, 2026 |
| bofa | Bank of America | Prime | June 18, 2026 |
| chase | Chase Auto | Prime | May 10, 2026 |
| pnc | PNC Bank | Prime | March 16, 2026 |
| dfc | Driveway Finance | Prime | August 13, 2025 |
| cps | Consumer Portfolio Services | Sub-Prime | January 1, 2026 |
| usbank | U.S. Bank | Prime | April 1, 2026 |
| flagship | Flagship Credit | Sub-Prime | July 2026 |
| santander | Santander | Full-Spectrum | June 1, 2026 |

Segment counts: Prime 7 · Near-Prime 4 · Sub-Prime 5 · Prime+ 1 · Deep Sub-Prime 1 · Full-Spectrum 1 · All Tiers (0–9) 1. Oldest sheet: Driveway Finance (Aug 2025) — flag for re-verification.

### 1.2 Top-level fields per lender (as stored today)

| Field | Type today | Present in | Problem |
|---|---|---|---|
| `id` | string | 20/20 | — |
| `name`, `fullName`, `abbr`, `colorClass` | string | 20/20 | — |
| `docTitle` | string | 20/20 | — |
| `effectiveDate` | free-text string | 20/20 | 17 different formats ("June 12, 2026", "July 2026", "2026 (v53)", "Jan 6, 2026 · K500/K506 July 7, 2026"). Not sortable, not diffable. |
| `segment` / `segmentLabel` | string | 20/20 | 7 labels, no defined tier mapping |
| `ficoMin` | number or null | 20/20 | null for 8 lenders (tier-based programs). Null ≠ "no minimum". |
| `ficoNotes` | string | 20/20 | — |
| `maxTerm` | number or null | 20/20 | 1 null |
| `maxMileage` | string | 20/20 | "100,000 mi", "No max (Prime 150K)", "N/A" — mixed units/meaning |
| `maxLTV` | string | 20/20 | "150%", "150–175%", "145% total", "140–150% incl. backend", "130% (140% ICON+)". Front-end vs total LTV is conflated. |
| `gapMax` | string | 20/20 | "$1,500", "State-specific", "Per Buy Program" |
| `reserveStructure` | string | 20/20 | prose |
| `chargebackWindow` | string | 18/20 | prose |
| `uniqueFeature` | string | 17/20 | prose |
| `idReq`, `por`, `poi` | string | 20/20 | prose |
| `bureaus` | object `{primary[], note, stateMap{}}` | 20/20 | OK — only structured field |
| `stateRestriction` | string | 2/20 | absent = no restriction (implicit) |
| `source` | object `{date, precision, status, doc, driveFileId, syncedAt, warning?}` | 20/20 | Added 2026-08-26 for spec #4. Written by `sync.py freshness`, never by hand. `date` is ISO and sortable — the machine-readable twin of the free-text `effectiveDate` above it. Age is **not** stored; the page subtracts from today. `warning` is optional and editorial, set through a proposal (kia only). |
| `core` | object | 20/20 | **The typed core (§2), added 2026-08-28.** Sits beside `sections`, does not replace it. Written by hand from the lender's PDF, validated by `tools/core.py`. |
| `sections` | object of HTML strings | 20/20 | **All detailed program data is HTML, not data.** See 1.3 |

### 1.3 `sections` — the real problem

*(Read §2 with this. The measurement there — 627 distinct labels, 537 on a single lender — shows the problem is only partly one of inconsistent naming.)*

Section keys: `fico`, `id`, `income`, `ltv`, `backend`, `reserve`, `vehicles` (standard), plus `program` and `incentives` (one lender each). Each holds an HTML `content` string of `info-row` key/value pairs, tables, and note boxes.

The same concept is labeled differently across lenders. Examples found:
- GAP cap: "GAP Max", "GAP Maximum", "GAP", "GAP (Standard)"
- LTV: "Max LTV", "Front-End LTV", "Total LTV", "New Vehicles", "Used <70K miles"
- Income: "Min Income", "Minimum Income", "Min Income (Single)", "Min Income A+/A2"
- Self-employed: "Self-Employed", "Self-Employed / 1099"

Consequence: you cannot diff a new PDF against current data, because the current data has no stable keys. The compare table only works on the ~8 top-level summary fields, and even those are strings.

---

## 2. Target schema (v2 core)

**Decided 2026-08-28, after measuring what is actually in `sections`.**

The earlier target replaced `sections` entirely with typed fields. The data says
that cannot work. Across the 20 lenders there are **828 info-rows carrying 627
distinct labels, and 537 of those appear on exactly one lender.** Only 20 labels
are shared by four or more lenders; exactly one (`Max Mileage`) by ten or more.
There are also 79 tables. §1.3 read the problem as one of inconsistent naming.
That is true for a handful — GAP, LTV, income — but roughly 86% of the content is
genuinely bank-specific, and a fixed schema has nowhere to put it except a prose
`notes` field, which is the HTML problem with extra steps.

So v2 is **a typed core beside the existing detail, not instead of it**:

- **Typed** — the values Gage compares across banks and the tools compute on.
  Roughly a dozen fields. These get types, units, and conditions.
- **Kept as-is** — `sections`, unchanged. Bank-specific detail, rate grids and
  term matrices stay HTML and stay searchable. They are for reading, not
  computing.
- **Untouched** — `source`, which already does its job (§1.2). Written by
  `sync.py freshness`, ISO-dated, never edited by hand.

### 2.1 A limit is a number plus the condition it holds under

The single most common shape in this data is not a number. It is a number that
changes with the term, the state, or the program:

- truist — 120,000 miles, but 50,000 on 76–84 month terms
- ally — 150,000 miles, but 75,000 on 76–84 month terms
- cps — 130% LTV, 140% on ICON+
- truist — $1,200 GAP, but in Texas the lesser of $1,200 or 5% of amount financed

Storing only the headline number makes the deal structurer overstate a bank on a
long-term deal. Storing only the worst case makes it drop banks that would have
bought. So every limit is:

```jsonc
{
  "value": 120000,          // number | null (null = not published)
  "except": [               // [] when the limit is unconditional
    { "when": { "term_months_gte": 76 }, "value": 50000 }
  ],
  "note": ""                // prose only for what the predicates cannot express
}
```

`when` uses a **closed vocabulary**, so the tools can evaluate it rather than
display it. Adding a predicate is a schema change, deliberately:

| predicate | value | means |
|---|---|---|
| `term_months_gte` / `_lte` | number | term at or beyond / within |
| `amount_financed_gte` / `_lte` | number | deal size band |
| `state` | `"TX"` | state-specific rule |
| `program` | `"ICON+"` | named program or tier the bank publishes |
| `vehicle_condition` | `"new"` \| `"used"` | |
| `tier` | `"T1 (A1)"` | the bank's own tier label, verbatim from its sheet |
| `book_value_gte` / `_lte` | number | collateral value band |
| `mileage_gte` / `_lte` | number | odometer band |

`book_value` and `mileage` were added 2026-08-28 with the remaining 18: capitalone
keys its LTV to **book value** (150% at or above $10K, 175% below) rather than
amount financed, and amcredit's 135% needs a used vehicle **under 50,000 miles**.

Added `tier` on 2026-08-28, when truist turned out to publish LTV as a **48-cell
grid** — 6 tiers × 2 term bands × {front LTV, total LTV, DTI, PTI}. Term alone
could not express it.

**Bands, not open ends.** Where a limit steps by term, give each exception both
bounds (`term_months_gte` *and* `_lte`) so exactly one matches. Open-ended
predicates overlap, and then the answer depends on evaluation order. Validation
warns when two exceptions can match the same deal; if it happens anyway the
**lowest** value wins, because understating a limit costs a resubmit and
overstating costs a funding decline.

**`value` is the floor, not the headline.** Base is what holds when nothing about
the deal is known; exceptions raise it once a tier, term or program is supplied.
truist's base total LTV is therefore 130%, not the 155% on its card — 155% is one
cell of the 48 (tier 1–2, ≤75 months). A tool that starts from the best cell
overstates every deal that isn't that cell.

**`"unresolved": true`** marks an exception whose *value* the sheet publishes but
whose *condition* it does not. cps is the case: "Up to 130% LTV regular term, 115%
extended term", with no definition anywhere of where regular ends. The better
value never applies automatically — the tool shows it as "up to 130%, condition
not published" so the gap is visible and askable, instead of being resolved by a
guess.

A condition the vocabulary cannot express sets `value: null` on the exception and
explains it in `note` — the tools then treat that case as *unknown*, never as
*allowed*. Unknown is the safe default: it makes the tool say "check the sheet"
rather than quote a limit it cannot stand behind.

### 2.2 The typed core

```jsonc
{
  "id": "truist",
  "segment": "prime",                 // enum, §3.1

  "credit": {
    "fico_min":   { "value": 620, "except": [], "note": "" },
    "fico_basis": "score",            // "score" | "tier" | "none"
    "tiers": []                       // [] when score-based
  },

  "limits": {
    "max_term_months":   { "value": 84,     "except": [], "note": "" },
    "max_mileage":       { "value": 120000, "except": [
                             { "when": { "term_months_gte": 76 }, "value": 50000 } ] },
    "max_vehicle_age_yr":{ "value": 9,      "except": [], "note": "" },
    "ltv_front_max_pct": { "value": null,   "except": [], "note": "" },
    "ltv_total_max_pct": { "value": 155,    "except": [], "note": "" },
    "min_amount_financed": { "value": 7500, "except": [], "note": "" },
    "max_amount_financed": { "value": null, "except": [], "note": "" },
    "gap_max_usd":       { "value": 1200,   "except": [
                             { "when": { "state": "TX" }, "value": null,
                               "note": "lesser of $1,200 or 5% of amount financed" } ] }
  },

  "rates": {
    "basis": "none",                  // "grid" | "floor" | "none"
    "floor_apr_pct": null,            // lowest published buy rate
    "ceiling_apr_pct": null,          // usury or program cap
    "grid_section": null,             // key into sections.* holding the full grid
    "note": ""
  }
}
```

Everything else — bureaus, income, residency, reserve, backend detail, vehicle
ineligibility lists, term matrices — stays where it is today, in `sections`.

### 2.3 Rates: eligibility first, rate as a tiebreaker

**Decided 2026-08-28.** Only two of the twenty lenders publish a rate grid
(`regional`, 112 cells; `kia`, 264 tier rows). One publishes a buy-rate/flat
table (`bofa`). About six publish a floor or a usury cap and nothing else. About
six publish no rate figures at all — `amcredit`, `wellsfargo`, `usbank`,
`flagship`, plus `fifththird` (its "rate sheet" is a dealer reserve schedule) and
`santander` (buydown rule only).

The structurer therefore ranks on **whether the bank buys the deal** — FICO, LTV,
term, mileage, vehicle age, amount financed, each evaluated with its conditions.
Every lender publishes that. `rates.floor_apr_pct` breaks ties where it exists,
and where it does not the lender shows **"no published rate"** rather than an
assumed one. The hardcoded `prime 6% · near 9% · sub 14% · deep 20%` the current
structurer prices with is removed, not replaced: a made-up number sitting beside
real ones on a live deal is the failure mode this whole file exists to prevent.

`basis: "grid"` points at the section holding the grid so the UI can link to it.
Reading a grid is a human job; the schema does not model its axes.

### 2.4 Nulls

`null` means **the bank does not publish this**, which is information. Never `""`,
never `"N/A"`, never a zero standing in for absent. A tool that meets `null` says
so; it never treats it as unlimited or as zero.

---

## 3. Enums and rules

### 3.1 `segment`
`prime_plus` · `prime` · `near_prime` · `sub_prime` · `deep_sub_prime` · `full_spectrum`

Map from today's labels: "Prime+" → prime_plus; "All Tiers (0–9)" → full_spectrum.

### 3.2 LTV
Two separate fields, `ltv_front_max_pct` and `ltv_total_max_pct`. **Neither is a default for the other.**

Checked 2026-08-28: of the 20 stored records, 6 distinguish front-end from total, 5 give front only, 1 total only, and **8 do not say which their number is** — the information is not in the record, so it has to come from the PDF. The earlier rule here said to assume the ambiguous ones were total. That assumption feeds the LTV calculator and the structurer's ranking, and being wrong by 10–20 points of advance on a live deal is exactly the harm this file exists to prevent. So an unadjudicated number stays `null` in both fields until someone reads the sheet.

Ranges (`150–175%`) are not a single number: store the base in `value` and the upper figure as an `except` with the condition that unlocks it. Where the condition is not known, store the lower number — understating an advance costs a resubmit, overstating costs a funding decline.

### 3.3 Dates
ISO `YYYY-MM-DD` only. If a PDF says "July 2026", use the first of the month and note it. If a lender has two dates (base guide + supplemental bulletin), `effective_date` is the newer one; list the other in `source.notes`.

### 3.4 Freshness comes from the document, not from a person
**Rewritten 2026-08-28.** This section used to define a `verified_date` — when Gage
last confirmed a record against the bank's portal — tracked in Supabase
`lender_updates`. That feature was deleted on 2026-08-25, the Supabase project is
empty, and spec #4 replaced the idea outright: freshness is a property of the
source PDF, because a date nobody has to remember to click cannot go stale through
forgetfulness.

There is one date, `source.date`, ISO, written by `sync.py freshness` from the
authority document. The page subtracts it from today at render — green under 90
days, amber past 90, red past a year. Age is never stored. `source.warning` covers
the one case a date gets wrong: a document that is current while its *contents* have
expired.

**Do not reintroduce `verified_date` or `verified_by` into the schema.** They are
listed here only so the next reader knows they were considered and removed.

### 3.5 Changing a value
Every change to a program value requires: source PDF (Drive file ID) + effective date. No "I heard from the rep" edits without a note saying so.

---

## 4. Migration to the v2 core

Not a rewrite. The typed core is **added beside** the current record; `sections`
and `source` are untouched, so nothing that renders today stops rendering.

| Today | v2 core | Transform |
|---|---|---|
| `ficoMin` + `ficoNotes` | `credit.fico_min`, `credit.fico_basis`, `credit.tiers` | numeric in 10/20 already. `null` → basis `tier` where `ficoNotes` names tiers, else `none` |
| `maxTerm` | `limits.max_term_months` | 19/20 parse as-is |
| `maxMileage` | `limits.max_mileage` | 19/20 parse to a number; **6 carry a condition** (truist, ally, cps, flagship, westlake, kia) that becomes an `except` |
| `maxLTV` | `limits.ltv_front_max_pct` / `ltv_total_max_pct` | 16/20 parse as a number, but **8 records cannot say front or total** — those stay `null` pending a PDF read. See §3.2 |
| `gapMax` | `limits.gap_max_usd` | **only 9/20 are a bare figure.** 11 carry state, program, or size-band conditions |
| `segment` / `segmentLabel` | `segment` | enum map, §3.1 |
| rate figures in `sections` | `rates.*` | floor and ceiling by hand from the sheet; `basis: "grid"` for `regional` and `kia`, pointing at the section |
| everything else in `sections` | — | **stays.** 537 of 627 labels are single-lender; there is nothing to migrate them into |

### 4.1 What is parsing and what needs a person

Parsing gets the number. It cannot get the two things that matter most:

- **Whether an LTV is front-end or total.** 8 lenders. Requires the PDF.
- **The condition attached to a limit.** ~17 across the four fields. The
  condition is usually stated in the record's prose, but turning it into a
  predicate is a reading job, not a regex.

So the order is: parse what parses, leave the rest `null`, and fill the gaps
lender by lender against the source PDFs — through `sync.py`'s gate like any other
value change, citing Drive file ID and page (§3.5). A parsed value is not a
verified one; a wrong number that looks confident is worse than a `null`.

### 4.2 Order

**Built 2026-08-28: `truist` and `cps` carry a core, and both tools read it.**
`tools/core.py validate` checks shape and warns on overlapping bands;
`core.py selftest` runs 20 resolution cases that `index.html` must agree with.

What reading the two sheets changed, beyond typing what was already stored:

- **truist publishes LTV as a 48-cell grid** — 6 tiers × 2 term bands ×
  {front, total, DTI, PTI}. The record's `155%` is one cell of it: total LTV,
  tier 1–2, ≤75 months. At tier 6 on 84 months the total cap is 130% and the
  front cap 115%. The card still says 155%; the tools now say 130–155% and
  which end applies.
- **truist's front and total caps are both published**, so the pair is filled
  rather than left null.
- **cps's sheet is two columns** — a narrow ICON+ column and a general band.
  That settles front vs total: ADVANCE is front (115% of book), MAX LTV is
  total (130%), because the Basic Formula adds tax, license, $200 doc, service
  contract and GAP on top of the advance.
- **cps never defines "extended term"**, so the 130% carries `unresolved` and
  the base stays 115%.

**All 20 typed 2026-08-28.** 96 resolution cases, matched between `core.py` and
the browser.

### 4.3 What the typed core actually covers

`null` means the sheet does not publish it. Across the 20 records:

| field | published | field | published |
|---|---|---|---|
| `ltv_total_max_pct` | 18/20 | `max_term_months` | 19/20 |
| `ltv_front_max_pct` | 13/20 | `max_mileage` | 19/20 |
| `gap_max_usd` | 16/20 | `min_amount_financed` | 7/20 |
| `fico_min` | 11/20 | `max_vehicle_age_yr` | 4/20 |

**A `null` is not free.** Because every record now carries a core, `lenderLimit()`'s
string fallback never fires, so an untyped limit reads as *unknown* rather than as
the v1 string's number — and a tool that meets `unknown` skips that test entirely.
That is how 16 values nearly went missing on 2026-08-28: 11 lenders' mileage, 4
FICO floors and 2 terms were typed as `null` while `lenders.json` still held a
PDF-verified number for them. They are carried forward with a note saying they
come from the 2026-08-26 sweep rather than a fresh page cite.

**Check a migration against what the old layer answered, not just against itself.**
The gap was invisible from inside the schema — validate passed, every key was
present on every record, all cases were green. Diffing the new answer against the
v1 string, lender by lender, is what found it. What reading the other 18 sheets turned up:

- **The floor-vs-headline problem is not unique to truist.** `dfc` publishes a
  13-tier × new/used grid and the card shows its best cell (135%); `pnc`, `regional`,
  `ally` and `capitalone` all do the same thing in different shapes.
- **`regional`'s 125% is a front-end cap, and it publishes no total at all.** Its
  own sheet defines total as front-end advance + tax, tag, license, doc, warranty
  and GAP — with no percentage limit on the result. The LTV calculator had been
  comparing a total-LTV number against it.
- **Five lenders drop a limit at 76+ months** and the card shows only the low-term
  figure: `usbank` 145%→120%, `wellsfargo` 135%→120%, `bofa` 145%→125% (and age
  10yr→4yr, min financed $7,500→$25,000), `santander` 145%→120% (and mileage
  150,000→60,000, age 12yr→5yr), `truist` 155%→140%.
- **Three records' LTV is not in the document their `source` block names.**
  `ally`'s points at the 84-month sheet (ceiling 135%, not the 140% shown), `td`'s
  at a documentation guide with no LTV in it, `kia`'s at an APR-only bulletin. All
  three are sourced from the correct sibling file, recorded in `provenance.note`.
  `core.py validate` warns on the date divergence rather than hiding it.
- **`westlake`'s Prime sheet publishes no total LTV**, so the card's
  "140–150% incl. backend" is unsupported by it. Left `null`. This is entangled
  with the open question of whether the Prime or Independent Dealer sheet applies.
- **A text layer without its heading lies.** AmeriCredit's "A Tiers – Maximum LTV
  125%" sits under a **Canadian Vehicles** heading; taken at face value it would
  have capped the bank 10 points low. Rendering the page is what caught it.

*(Original plan:)* `truist` and `cps` first — between them they carry a term-conditioned mileage cap,
a state-conditioned GAP rule, a program-conditioned LTV, and an unadjudicated
front/total. If the shape in §2.1 holds for those two it holds for the other 18.
Then wire the LTV calculator and the deal structurer to read the typed fields
instead of parsing `maxLTV` strings, and only then do the remaining lenders.

---

## 5. Open questions

- **How does the compare surface use the typed core?** Pick-your-columns (#8) was
  specified against a compare table that was deleted on 2026-08-27, so the surface
  is an open design question before it is a schema one. The typed core is what any
  such surface would need either way.
- **Do `sections` and the typed core drift?** Once `limits.max_mileage` is typed and
  `sections.vehicles` still says "120,000 mi" in prose, there are two copies of one
  fact. Options: render the prose row from the typed value, drop the duplicated
  rows, or accept the drift and check it in the sync. Not urgent until the core is
  populated, but it does not fix itself.
- **`term_matrix`.** `amcredit`, `exeter` and `truist` publish age × mileage → term
  grids. They stay in `sections` under the current decision. If the structurer
  should rank on them, they need a typed shape of their own.
- ~~Supabase JSONB or `lenders.json` in the repo?~~ **Settled 2026-08-26:
  `lenders.json`.** Git is the history and the diff. There is no Supabase project
  any more, so returning to one would be a fresh decision.
- ~~Does the compare table need every v2 field or a curated set?~~ Superseded: the
  table no longer exists, and the typed core is deliberately small enough that
  "all of it" is a reasonable default.
