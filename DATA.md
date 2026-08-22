# Lender Hub — DATA.md

The lender data contract. What a lender record is, what each field means, where values come from, and the rules for changing them. Any PDF → extract → diff → approve flow depends on this file being accurate.

Audit basis: `index.html` on `main`, pulled 2026-08-22. 20 lenders in `LENDERS`.

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
| gls | GLS / Global Lending | Sub-Prime | 2026 (v53) |
| capitalone | Capital One | All Tiers (0–9) | January 2026 |
| westlake | Westlake Financial | Deep Sub-Prime | July 2026 |
| kia | Kia Finance | Near-Prime | Jan 6, 2026 · K500/K506 July 7, 2026 |
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
| `sections` | object of HTML strings | 20/20 | **All detailed program data is HTML, not data.** See 1.3 |

### 1.3 `sections` — the real problem

Section keys: `fico`, `id`, `income`, `ltv`, `backend`, `reserve`, `vehicles` (standard), plus `program` and `incentives` (one lender each). Each holds an HTML `content` string of `info-row` key/value pairs, tables, and note boxes.

The same concept is labeled differently across lenders. Examples found:
- GAP cap: "GAP Max", "GAP Maximum", "GAP", "GAP (Standard)"
- LTV: "Max LTV", "Front-End LTV", "Total LTV", "New Vehicles", "Used <70K miles"
- Income: "Min Income", "Minimum Income", "Min Income (Single)", "Min Income A+/A2"
- Self-employed: "Self-Employed", "Self-Employed / 1099"

Consequence: you cannot diff a new PDF against current data, because the current data has no stable keys. The compare table only works on the ~8 top-level summary fields, and even those are strings.

---

## 2. Target schema (v2)

Principle: **every comparable value gets a typed field. Prose is allowed only in a `notes` field next to the value it qualifies.**

One record per lender. Shown as JSON; maps 1:1 to a Supabase row (`lenders` table, JSONB `program` column) or to a JS object.

```jsonc
{
  "id": "amcredit",
  "name": "AmeriCredit",
  "full_name": "AmeriCredit (GM Financial)",
  "abbr": "GMF",
  "color_class": "lc-amcredit",

  "source": {
    "doc_title": "Retail Underwriting Guidelines",
    "effective_date": "2026-06-12",   // ISO. Required.
    "drive_file_id": "",              // Google Drive file ID of the PDF
    "verified_date": "2026-07-14",    // last time Gage confirmed against portal/PDF
    "verified_by": "gage"
  },

  "segment": "near_prime",            // enum, see §3.1
  "state_restriction": null,          // null | ["TX"]

  "credit": {
    "fico_min": 500,                  // number | null (null = no published floor)
    "fico_basis": "tier",             // "score" | "tier" | "none"
    "tiers": ["A+","A1","A2","A3","B1","B2","B3"],  // [] if score-based
    "bureaus": { "primary": ["equifax","transunion","experian"], "state_map": {}, "note": "" },
    "bk_ch7": "discharged",           // "discharged" | "considered" | "not_allowed" | null
    "bk_ch13": "discharged",
    "itin_accepted": true,
    "min_age": 18,
    "notes": ""
  },

  "income": {
    "min_monthly": 2200,              // number | null
    "min_monthly_joint": null,
    "paystub_max_age_days": 45,
    "self_employed_docs": "3 consecutive bank stmts ≤45 days, no NSF, ending bal ≥2× payment",
    "gross_up_pct": 25,               // non-taxable income gross-up
    "rideshare_income": false,        // eligible?
    "min_job_time_months": null,
    "notes": ""
  },

  "residency": {
    "id_required": "Government-issued",
    "por_docs": "Utility bill or paystub ≤45 days",
    "por_max_age_days": 45,
    "min_residence_months": 12,
    "notes": ""
  },

  "terms": {
    "max_term_months": 84,
    "max_term_conditions": "84 only for B2+ on vehicles ≤4 yrs",
    "min_amount_financed": 7500,
    "max_amount_financed": null,
    "ltv_front_max_pct": 125,         // front-end (before backend products)
    "ltv_total_max_pct": 135,         // including backend
    "ltv_basis": "JD Power / KBB by state",   // which book
    "max_pti_pct": null,
    "approval_expiry_days": 30,
    "first_payment_window_days": [19, 47],
    "notes": ""
  },

  "vehicle": {
    "max_age_years": 9,
    "max_mileage": 100000,            // number | null (null = no published max)
    "new_definition": "Current/future year ≤7,500 mi",
    "ineligible": ["commercial","livery","rideshare","exotic","motorcycle","rv","gray_market","branded_title"],
    "notes": ""
  },

  "backend": {
    "gap_max_usd": 1500,              // number | null
    "gap_min_ltv_pct": 65,
    "vsc_max_usd": null,
    "total_backend_max_usd": null,
    "total_backend_max_pct_of_book": null,
    "notes": "GAP not allowed NY indirect; service contract counts toward advance"
  },

  "reserve": {
    "structure": "participation",     // "participation" | "flat" | "both" | "none"
    "max_participation_pct": 2,
    "flat_usd": 200,
    "split": "70/30",
    "chargeback_window": "3 payments / 3 cycles",
    "assignment_fee_usd": 150,
    "rate_markup_allowed": true,
    "notes": ""
  },

  "term_matrix": [                    // optional. Age × mileage → max term. Only if bank publishes one.
    { "model_years": "2021-2026", "mileage_max": 59999, "max_term": 75 }
  ],

  "unique_feature": "ITIN accepted; 70/30 split",
  "free_notes": ""                    // anything that doesn't fit. Keep short.
}
```

Anything a bank does not publish is `null`, never `""`, never `"N/A"`. Null means "not published", which is itself useful information.

---

## 3. Enums and rules

### 3.1 `segment`
`prime_plus` · `prime` · `near_prime` · `sub_prime` · `deep_sub_prime` · `full_spectrum`

Map from today's labels: "Prime+" → prime_plus; "All Tiers (0–9)" → full_spectrum.

### 3.2 LTV
Always store two numbers: `ltv_front_max_pct` and `ltv_total_max_pct`. If the bank publishes one number and doesn't say which, store it as `ltv_total_max_pct` and note the ambiguity in `terms.notes`. Ranges ("150–175%") → store the max and put the condition in notes.

### 3.3 Dates
ISO `YYYY-MM-DD` only. If a PDF says "July 2026", use the first of the month and note it. If a lender has two dates (base guide + supplemental bulletin), `effective_date` is the newer one; list the other in `source.notes`.

### 3.4 Verified vs effective
- `effective_date` = what the bank's document says.
- `verified_date` = when Gage last confirmed the record matches the bank's current portal/sheet.
A record with `verified_date` older than 60 days shows as stale in the UI. (Currently tracked in Supabase `lender_updates`; move to the record.)

### 3.5 Changing a value
Every change to a program value requires: source PDF (Drive file ID) + effective date. No "I heard from the rep" edits without a note saying so.

---

## 4. Migration from current `LENDERS` → v2

| Today | v2 | Transform |
|---|---|---|
| `effectiveDate` | `source.effective_date` | normalize to ISO; see §3.3 |
| `segmentLabel` | `segment` | enum map §3.1 |
| `ficoMin` | `credit.fico_min` + `credit.fico_basis` | null → fico_basis "tier" if ficoNotes mentions tiers, else "none" |
| `maxTerm` | `terms.max_term_months` | as-is |
| `maxMileage` | `vehicle.max_mileage` | parse number; "No max"/"N/A" → null |
| `maxLTV` | `terms.ltv_front_max_pct` / `ltv_total_max_pct` | parse; see §3.2 |
| `gapMax` | `backend.gap_max_usd` | parse; non-numeric → null + note |
| `reserveStructure`, `chargebackWindow` | `reserve.*` | extract numbers; rest → notes |
| `idReq`, `por`, `poi` | `residency.*`, `income.*` | extract numbers (days, $/mo); rest → notes |
| `sections.*.content` (HTML) | all structured fields | **manual extraction, one lender at a time, against the source PDF.** Do not regex the HTML. |
| `stateRestriction` | `state_restriction` | "Texas Only" → ["TX"] |
| `uniqueFeature` | `unique_feature` | as-is |

Migration order: pick one sub-prime and one prime lender first (e.g. `exeter`, `chase`), migrate by hand, confirm the UI can render from v2, then do the rest. The detail page renders from structured fields; the HTML `sections` go away.

---

## 5. Open questions

- Does the compare table need every v2 field, or a curated column set with "show all" toggle? (Gage: "I use everything.")
- `term_matrix` exists for AmeriCredit; how many other lenders publish one?
- Store in Supabase JSONB or keep as a `lenders.json` in the repo? JSONB enables the approve-diff flow with history; JSON in repo is simpler and git is the history. **Recommendation: `lenders.json` in repo now, Supabase later if the approval UI needs it.**
