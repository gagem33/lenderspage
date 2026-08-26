# Lender Hub — EXTRACTION_GUIDE.md

How to read a bank's program PDF and turn it into a DATA.md v2 record. Read `DATA.md` first — this file maps bank language onto that schema.

The job is extraction, not interpretation. If the PDF doesn't say it, the field is `null`. Never infer a number from another lender's norms.

---

## 1. Output contract

Every extraction run produces, and only produces:

1. A JSON object in the DATA.md v2 shape for the lender.
2. A **diff** against the current record: field, old value, new value, PDF page number, verbatim source text (≤1 line).
3. A list of fields the PDF did not cover (left unchanged, flagged "not in source").
4. A list of ambiguities needing Gage's call.

**Nothing is written until Gage approves the diff.** No exceptions. No "minor" auto-updates.

---

## 2. Document types

Identify which one you have before extracting. The doc title is usually on page 1.

| Type | What it looks like | What to pull |
|---|---|---|
| **Underwriting / Program Guidelines** | Prose + tables. 4–20 pages. Sections on credit, income, vehicle, LTV, backend, funding. | Nearly every schema field. This is the base document. |
| **Rate Sheet** | Grid: tier (rows) × term (cols) → rate. Often 1–2 pages. | `credit.tiers`, `terms.max_term_months` (highest column), sometimes `reserve.*`. Do NOT invent rate fields — the schema doesn't store rates yet. Note their presence in `free_notes`. |
| **Bulletin / Update / Addendum** | Short. "Effective [date], the following changes…" | Only the fields it mentions. Everything else unchanged. `effective_date` becomes the bulletin date; record the base doc's date in `source.notes`. |
| **Dealer Program / Reference Sheet** | 1-page summary of the guidelines. | Summary fields. Treat it as lower authority than full guidelines if both exist; flag conflicts. |
| **Advance / LTV grid** (e.g. Kia) | Table: FICO band × vehicle age/mileage → LTV %. | `ltv_front_max_pct` / `ltv_total_max_pct` = the max in the grid; grid itself → `term_matrix`-style array; note it's tiered in `terms.notes`. |

Current doc title per lender is listed in DATA.md §1.1 and in `source.doc_title`.

---

## 3. Glossary — bank language → schema field

Banks use different words for the same thing. Map, don't guess.

### LTV / Advance
| Bank says | Schema field | Note |
|---|---|---|
| "Max LTV", "LTV", "Loan-to-value" (no qualifier) | `terms.ltv_total_max_pct` | Default to total; flag ambiguity |
| "Front-end LTV", "Front LTV", "Vehicle advance", "Max advance" | `terms.ltv_front_max_pct` | Before backend products |
| "Total LTV", "Total advance", "Incl. backend", "All-in" | `terms.ltv_total_max_pct` | |
| "Book", "Book value", "Value" | `terms.ltv_basis` | Which guide: JD Power / KBB / NADA / Black Book. Also note wholesale vs retail, and any CPO bump (+$X) |
| "Advance" in $ (not %) | `terms.max_amount_financed` | Some subprime banks cap in dollars |

### Credit
| Bank says | Schema field |
|---|---|
| "Min FICO", "Minimum score", "Beacon", "Score floor" | `credit.fico_min` |
| "Tier", "Grade", "Program" (A+, T1, Tier 0, P0, S/A/B…) | `credit.tiers` + `credit.fico_basis = "tier"` |
| "No score", "Zero FICO", "Thin file", "No-hit" | `credit.fico_min = null` + note in `credit.notes` |
| "Bureau", "Pull", "Score model" | `credit.bureaus` |
| "Middle score", "Lowest middle" | `credit.bureaus.note` |
| "BK", "Bankruptcy", "Ch 7 / Ch 13", "Discharged / Dismissed / Open" | `credit.bk_ch7`, `credit.bk_ch13` |
| "ITIN", "Non-SSN" | `credit.itin_accepted` |
| "File depth", "Trade lines", "Years in bureau" | `credit.notes` |

### Income
| Bank says | Schema field |
|---|---|
| "Min income", "Gross monthly", "Monthly income requirement" | `income.min_monthly` (joint → `min_monthly_joint`) |
| "Paystub within X days", "Dated within", "Recent" | `income.paystub_max_age_days` |
| "POI" | the whole `income` block |
| "Gross-up", "Non-taxable", "+25%" | `income.gross_up_pct` |
| "1099", "Self-employed", "Bank statements" | `income.self_employed_docs` |
| "Rideshare", "Gig", "Uber/Lyft/DoorDash" | `income.rideshare_income` (true = eligible) |
| "Time on job", "Employment length" | `income.min_job_time_months` |

### Residency / ID
| Bank says | Schema field |
|---|---|
| "POR", "Proof of residence", "Address verification" | `residency.por_docs` + `por_max_age_days` |
| "Time at residence" | `residency.min_residence_months` |
| "ID", "Government ID", "DL" | `residency.id_required` |

### Terms
| Bank says | Schema field |
|---|---|
| "Max term", "Up to X months" | `terms.max_term_months` + conditions → `max_term_conditions` |
| "Min amount financed", "Min loan" | `terms.min_amount_financed` |
| "Max amount financed", "Max loan" | `terms.max_amount_financed` |
| "PTI", "Payment-to-income" | `terms.max_pti_pct` |
| "DTI", "Debt-to-income" | `terms.notes` (schema has no DTI field yet — flag if common) |
| "Approval good for", "Approval expires", "Valid for" | `terms.approval_expiry_days` |
| "First payment", "FPD", "Days to first payment" | `terms.first_payment_window_days` |

### Vehicle
| Bank says | Schema field |
|---|---|
| "Max mileage", "Miles", "Odometer" | `vehicle.max_mileage` — number only, no "mi" |
| "Max age", "Model year", "X years or newer" | `vehicle.max_age_years` — convert model year to age from current year and note the year |
| "Ineligible", "Not financed", "Excluded" | `vehicle.ineligible` — use the enum list in DATA.md; add new values only if needed |
| "New" definition | `vehicle.new_definition` |

### Backend
| Bank says | Schema field |
|---|---|
| "GAP max", "GAP cap", "GAP up to" | `backend.gap_max_usd` |
| "GAP min LTV", "GAP not allowed below" | `backend.gap_min_ltv_pct` |
| "VSC", "Service contract", "Warranty", "ESC" | `backend.vsc_max_usd` |
| "Total backend", "Total products", "Aftermarket cap" | `backend.total_backend_max_usd` / `_pct_of_book` |

### Reserve / Dealer comp
| Bank says | Schema field |
|---|---|
| "Participation", "Reserve", "Markup", "Dealer spread" | `reserve.max_participation_pct`; `rate_markup_allowed = true` |
| "Flat", "Flat fee", "Power flat", "Dealer fee" | `reserve.flat_usd`; structure "flat" or "both" |
| "Split", "70/30" | `reserve.split` |
| "Chargeback", "Clawback", "Early payoff" | `reserve.chargeback_window` |
| "Acquisition fee", "Assignment fee", "Processing fee", "Discount fee" | `reserve.assignment_fee_usd` — note which name the bank uses and who pays |
| "Buy rate" | `free_notes` — not stored as a field |

---

## 4. Tier normalization

Do **not** map one bank's tiers onto another's. Store each bank's tiers verbatim in `credit.tiers`. Cross-bank comparison happens on `fico_min`, not tier names.

Known tier systems (from current app data — verify against PDF):

| Lender | Tier scheme |
|---|---|
| AmeriCredit | A+, A1, A2, A3, B1, B2, B3 |
| Ally | S, A, B, C, D, E |
| Capital One | 0–9 |
| TD | 9-tier automated |
| Wells Fargo | 6 tiers, Super Prime → Regular |
| PNC | Tier 0 (800+) … Tier 4 (680–699) |
| Driveway | P0–P11 + P10 No-Hit |
| Regional | T1–T7 |
| CPS | ICON+, Meta/Pref/SUAL, ALPL/Alpha, STD/Delta/FTB |
| Westlake | by Buy Program |
| Kia | FICO bands on LTV grid |

If a PDF gives FICO ranges per tier, store them in `credit.notes` as `"T1: 720+, T2: 680–719, …"`.

---

## 5. Per-lender quirks

Seeded from the current app. **Gage: correct and extend this — it's the section only you can get right.**

| Lender | Quirk the extractor must know |
|---|---|
| AmeriCredit | Bureau is state-specific (EQ / EX / TU by state list). Min income differs by tier. 84mo only B2+ and ≤4yr vehicle. Publishes an age × mileage → term matrix. |
| Exeter | Two programs in one doc: Standard (400+) and ExeterPLUS (620+). Extract both; store PLUS values in notes or flag for a sub-program field. Uses middle score. Rate markup not allowed. |
| Regional | Texas only. Tier-based, no FICO floor. Flat for T1–4, discount for T5–7. |
| Truist | Both applicants must meet 640. 680+ for 76–84mo. EQ for FL/GA/NC/SC/TX/VA, TU elsewhere. |
| TD | TU Auto FICO 08 only. No BK/repo within 36mo. |
| Wells Fargo | DACA/NPRA eligible. Middle score. |
| Ally | Retail vs lease minimums differ. Credit-card down payment allowed up to $5K. |
| Fifth Third | Texas program only. Min 650 applies to 2013+ units. |
| GLS | Self-employed / 1099 NOT accepted. Zero FICO ok. Equifax primary. |
| Capital One | No published FICO minimums — everything via Dealer Navigator. Tier 0–9. |
| Westlake | Everything keyed to Buy Program. Accepts open BKs with stips. Markup only 600+. |
| Kia Finance | LTV is a grid by FICO band. Separate grids for 12–75mo vs 76+mo. Loyalty upgrades tier. Two effective dates (base + K500/K506 bulletin). |
| Bank of America | Experian only (FICO Auto v8). 720+ for >75mo. File depth: 4yrs, 4 trade lines. |
| Chase | All BKs must be discharged. Middle score. |
| PNC | PNC Custom Score + Experian FICO 09. Tier 0 = 800+. |
| Driveway (DFC) | Equifax FICO 8. P-tiers. Flat fee needs 580+. Sheet dated Aug 2025 — oldest in set. |
| CPS | No min score. ICON+ uses Vantage ≥660, not FICO. Multiple program names within tiers. |
| U.S. Bank | Joint: one ≥675 and none <650 or system decline. Dealer Flex Rate Program. |
| Flagship | Tier-based, live analyst decisions. |
| Santander | Full spectrum. Bureau not stated on sheet. |

Add here anything you know from the portal or rep that the PDF doesn't say, tagged `(rep)` so the source is clear.

---

## 6. Confidence rules

> **Rule zero, added 2026-08-25: render every page and read the image.**
> The text layer is a cross-check, never the source. See §9 for why.

- **Exact number on the page** → store it, cite page.
- **Number only in an example** ("e.g., a $25,000 loan at 125%…") → do not store as a cap. Note it.
- **Two different numbers for the same field** in one doc → store neither. List both in ambiguities with pages.
- **Conditional value** ("up to 84mo for Tier A on ≤4yr units") → store the max, put the condition in the paired `_conditions` or `notes` field. Never drop the condition.
- **"Contact your rep" / "Varies"** → `null` + note.
- **Value depends on tier and the PDF gives the full table** → store the best-tier value in the scalar field and the table in notes or `term_matrix`. Say which tier the scalar came from.
- **PDF is a scan / no text layer** → ~~stop and tell Gage~~ **render it at 200 DPI and read the image.** This is no longer a reason to give up; see §9. Only stop if the *image* is genuinely illegible.
- **Text layer and image disagree** → the image wins, and flag it. Never silently pick one.
- **A table** → transcribe every cell. Count the rows and columns first, state the count, then fill it. If your output has fewer cells than that, you are not finished.
- **"The remaining rows follow the same pattern"** → banned. Never write it, never act on it. Transcribe or leave blank.

Every extracted value in the diff carries: page number + a short verbatim quote. If you can't quote it, you didn't find it.

**And the quote has to come from a page that passed triage.** A mis-encoded text
layer will happily give you a quote — it just won't be words. That is how a
value can be "cited" and still be fiction.

---

## 7. Process

1. Identify document type (§2). Identify lender. Confirm `effective_date` from the doc.
2. Load current record for that lender.
3. Extract field by field using §3 glossary. Apply §5 quirks. Apply §6 confidence rules.
4. Produce the four outputs in §1.
5. Present to Gage. Wait.
6. On approval: write the record, set `source.verified_date` = today, `source.drive_file_id` = the PDF's Drive ID, add a one-line entry to the lender's update log.
7. If rejected or partially approved: apply only approved fields. Re-present.

---

## 8. Known gaps in the schema (flag, don't fix silently)

- ~~No rate / buy-rate storage.~~ **Closed 2026-08-26.** Rates go in a `sections.rates` entry like any other program area — `sync.py` places it beside LTV & Terms. A typed v2 rate field is still unmodelled, so a *comparable* rate (one a compare column could sort on) remains out of scope; see CLAUDE.md open questions.
- No DTI field (PTI only).
- No sub-program structure (Exeter Standard vs PLUS, CPS program names). Currently goes in notes.
- No per-tier income minimums (AmeriCredit).

If a PDF hits one of these repeatedly, propose a schema change in `CLAUDE.md` open questions. Don't bolt fields on mid-extraction.

---

## 9. Reading the PDF — the part that actually goes wrong

Added 2026-08-25, after the audit. The extraction rules above were sound; the
inputs were not. Two of the 38 source PDFs defeated text extraction, in two
different ways, and the failures looked nothing alike.

### The two failure modes

**Image-only.** `Ally - 84 month Program Sheet` has 190 characters of text
across a full page of program terms — bullet glyphs, checkmarks, and the
copyright footer. The other 112 objects on the page are images. The audit read
it, got nothing, and filed the entire lender under UNVERIFIABLE.

That page contains the minimum amount financed ($20,000), the FICO cutoffs
(620 under $100K EDC/AWV, 680 at or above), the eligible model years and mileage
(5-year-old, 75,000 beginning miles), the full tier-by-tier advance matrix, and
the maximum dealer finance income (1.50%). All of it was sitting there,
perfectly legible — to a reader looking at the page instead of parsing it.

**Mis-encoded — the dangerous one.** `Truist - Program Sheet` embeds fonts with
a custom encoding, so its text layer is a substitution cipher. This:

```
CWn Wcekdj \_dWdY[Z \eh =7F i^ekbZ dej [nY[[Z '"(&&
```

is the page saying:

> Max amount financed for GAP should not exceed $1,200 or state cap, whichever
> is less. … **South Carolina and Indiana**: LTV must be greater than 80%. …
> **New York**: GAP cannot be financed. **California**: premium must not exceed
> $1,200 or 4%. **Colorado**: the greater of $600 or 4%.

None of that is in the app. Not because anyone decided to skip it — because it
was unreadable and nobody noticed it was unreadable. The same encoding mangled
Truist's per-tier maximum-term table, where `2023` came through as `20(3`.

This mode is worse than an image-only page. An empty result announces itself. A
corrupted one returns text you can quote, cite a page for, and be completely
wrong about. **"If you can't quote it, you didn't find it" passes vacuously when
the text layer is lying.**

### What to do instead

```
python3 tools/pdf_triage.py "FILE.pdf" --render          # one file
python3 tools/pdf_triage.py <folder> --json triage.json  # sweep the corpus
```

Per page it reports `TEXT_OK`, `PARTIAL`, `MOJIBAKE` or `IMAGE_ONLY`, and writes
a PNG for anything that isn't clean. Then **read the PNGs.**

The classifier checks length before quality, which is the bug worth knowing
about: Ally's 190 characters are fluent English, so every word-frequency test
passes on that tiny sample. A page of lender terms runs to thousands of
characters; a few hundred means the content is in the images. It also weighs the
image count — 112 images and no text is not a text page.

It leans toward false positives on purpose. Rendering a page that was fine costs
one image. Trusting a text layer that lied puts a wrong number in front of the
desk mid-deal.

Truist is the case that shows why it is per page and not per file: pages 1, 2
and 4 are corrupted, page 3 — the flat reserve scale — is clean. A per-file
verdict would have thrown away a good page or trusted three bad ones.

### What the sweep found — 2026-08-25

Run over the whole folder: **39 files, 141 pages, 6 pages unreadable.** 35 files
are clean end to end. Full table in `SOURCES.md` §3; the short version is that
the corpus is in better shape than the two known failures suggested.

**AmeriCredit page 11 is a US map** — "Monthly Value Guide by State". Kelley Blue
Book for AZ, CA, CO, HI, ID, MT, NM, NV, OR, UT, WA and WY, **J.D. Power
everywhere else, including Texas.** It has 278 characters of text and **zero
raster images**: it is vector art, so the image-count test does nothing and only
the length rule catches it.

The lesson for the classifier: an image-only page does not have to contain
images. Length is the test that generalises.

**And a lesson that is not about the classifier.** This page was written up on
2026-08-25 as a third data gap. It was not one — `index.html` already carried the
full state list, correctly. Rendering it on 2026-08-26 and comparing proved that
in a minute. **A verdict of `IMAGE_ONLY` is a statement about the PDF, never
about the app.** Before calling anything a gap, grep `index.html` for it. Step 6
below exists for exactly this reason: the diff is what tells you whether there is
anything to change.

### The extraction order, end to end

1. **Triage** the PDF. Note the verdict per page.
2. **Render** every page that isn't `TEXT_OK`. In practice, render all of them —
   it costs little and the image is the authority.
3. **Read the images.** Extract into the §1 output contract, with a page number
   and a verbatim quote for every value.
4. **Cross-check against the text layer** where triage said `TEXT_OK`. Agreement
   is confirmation. Disagreement is a flag, not a coin toss — the image wins and
   the conflict goes in the diff.
5. **Count the cells** of every table before and after. A 4×7 matrix produces 28
   values or it is incomplete.
6. **Diff** against the current record, per lender, and show Gage. Nothing is
   written without approval — `CLAUDE.md` spec item 1.

### What this would have caught in the 2026-08-22 audit

| | |
|---|---|
| `ally` | The whole 84-month program, filed UNVERIFIABLE. Fully legible as an image |
| `truist` | Every state-specific GAP rule, and the per-tier term table. Still missing from the app |
| `td` | The "tier columns interleave, per-tier attribution not reliable" caveat — a layout problem the rendered page does not have |
| `capitalone`, `cps` | Same interleaving caveat, same fix |
| `regional` | 20 of 28 matrix cells enumerated, the rest waved through as "the same pattern." They were not. Rule: count the cells |

