# Lender data accuracy audit — 2026-08-22

App data: `LENDERS` in `index.html` at commit `3e60889`.
Sources: PDFs in `LENDERHUB/LENDERHUBSOURCES`, read by Drive file ID per `SOURCES.md` §2.
Method: `EXTRACTION_GUIDE.md` §6 confidence rules. Program Sheet / Guidelines are primary;
Funding Guidelines used for POI / POR / ID only, per `SOURCES.md` §1.

**No lender data was changed. No deployment was made.** This is a read-only comparison.

## Categories

- **WRONG** — value in app ≠ value in PDF. App value, PDF value, page.
- **MISSING** — PDF states something material the app doesn't carry.
- **STALE** — app `effectiveDate` ≠ newest PDF date.
- **UNVERIFIABLE** — app has a value the PDF doesn't contain. Not guessed at, not assumed wrong.
- **OK** — nothing found.

Page numbers come from the running footer in each PDF (e.g. "AmeriCredit | Retail
Underwriting Guidelines 3"). Where a PDF has no footer, page is given as the
ordinal position of the text in the document and marked `~`.

---

## 1. amcredit — AmeriCredit (GM Financial)

Source: Program Sheet `1BcVmDpbQotQpB93acjWvX2uH3BRcjP37` — "Retail Underwriting Guidelines", What's New as of June 12, 2026.

### WRONG

| Field | App value | PDF value | Page |
|---|---|---|---|
| `sections.backend` → GAP Min LTV | `65% (80% IN / 70% CA)` | **70%** — "does not purchase … contracts that include a GAP product if the advance rate is less than 70%". Indiana is 80%. There is no 70% California rule; CA's rule is that GAP and CL&D cannot be included for covered service members. | 3 |
| `sections.backend` → GAP — Not Allowed | `advances <65%` | advances **<70%** | 3 |

The June 12, 2026 cover page lists its only change as "1. Updated GAP LTV
restrictions — See page 3 for details". The app's 65% is almost certainly the
superseded figure. This is the single most consequential finding for this lender:
it under-states the advance floor at which GAP can be sold by 5 points.

### MISSING

| What the PDF says | Page |
|---|---|
| Ohio ZIP exception — consumers in ZIPs 43400–43699 and 44000–44999 pull **TransUnion** as primary bureau, against the state map. | 10 |
| "New" also covers **previous**-year vehicles ≤7,500 mi (non-GM ≤5,000) through **March 31** of the current year. App only has current/future year. | 7 |
| Minimum term is **12 months**. | 3 |
| Current model-year vehicles over **5,000 miles** require a value adjustment (Triton dealerships: 6,500). | 2 |
| Vehicles sold as-is without repair are valued at **80% of invoice/book** + TT&L + L/A&H + service contract + GAP, and must be disclosed. | 7 |
| Insurance: full coverage, max **$1,000** collision and **$1,000** comprehensive deductible; no 30-day binders including spot-delivery insurance. | 6 |
| A nonrefundable **acquisition fee** (separate from the $150 assignment fee) may be assessed based on credit risk; cannot be charged to the customer. | 1 |
| Simple-interest contracts only. | 1 |
| PTI and DTI percentages are set by credit risk; all pay-stub debt deductions count, including 401(k) loans, child support and garnishments. | 6 |

### UNVERIFIABLE

| App value | Why |
|---|---|
| `bureaus.stateMap` — EQ: CA NV OR WA ID MT WY UT CO NM AZ HI AK · EX: NC SC GA FL AL MS · TU: all others | Page 10 is a **map graphic**. Extracted text lists state abbreviations and a three-way legend but carries no state→bureau assignment. Cannot confirm or refute from this PDF. The Ohio ZIP exception above is the only state-level bureau rule the text does state. |
| `sections.vehicles` → Book Value Guide — KBB for AZ,CA,CO,HI,ID,MT,NM,NV,OR,UT,WA,WY; JD Power elsewhere | Page 11 is also a **map graphic**. Text confirms only that KBB and J.D. Power are the two guides and that the guide is state-specific. |
| `sections.ltv` note — "**Updated Jan 8, 2026:** Max term by age & mileage above." | This PDF is the June 12, 2026 edition and contains no reference to January 8, 2026. The term matrix itself matches the PDF exactly. The date attribution is unsupported by this source. |
| `sections.id` → ID Required — "**Government-issued**; standard identity verification" | Page 6 says only "All applicants must pass standard identity verification checks." No document type is specified. Note the app's own top-level `idReq` gets this right ("no specific ID type required on sheet") — the two fields contradict each other. |
| `sections.income` → VA/Pension — "Paystub or bank statement ≤45 days specifying depositor" | Correct for pension/retirement. For **veteran affairs** the PDF requires a **case number** for verbal verification with the VA, not a paystub or bank statement. The app merges two different requirements into one row. |

### Verified correct (no action)

Term matrix (all 30 cells), 84-month rule (B2+, ≤4-year vehicle), FICO floor 500,
max mileage 100,000, max age 9 years, LTV 125/125/135 by mileage band, Canadian
125%/115%, min amount financed $7,500 / $15,000, approval expiry 30 days, first
payment 19–47 days, participation 2%, $200 flat at buy rate, 70/30 split,
chargeback 3 payments and 3 cycles, assignment fee $150, min income $2,200 /
$2,400 by tier, gross-up 25%, file depth 3 years / 5 trade lines, BK Ch7 & Ch13
discharged, ITIN, min age 18, ineligible-vehicle list, GAP $1,500 or state max,
NY indirect GAP prohibition, CA covered-service-member prohibition.

### STALE

None. App `effectiveDate` "June 12, 2026" matches the PDF's stated date.

---

## 2. exeter — Exeter Finance

Sources: Program Sheet `1fE1EdXQaWcqwyc_HGpYQs8UrUu0cVJpS` — rate sheet + program guidelines, both "Updated 6.12.26".
Funding Guidelines `15kVW67-Yhae_s6QvJ7TzmZH_1mq-tGe5` — "Funding Checklist", used for POI/POR/ID only.
No page numbers in either PDF; `~` positions are ordinal.

### WRONG

| Field | App value | PDF value | Page |
|---|---|---|---|
| `sections.ltv` → Standard Max Term | `78 months` | **Up to 84 months.** The program table reads "Term … Up to 84 months" for both Exeter and ExeterPLUS, with "75 to 84 month terms available for qualified customers/vehicles". The age × mileage table caps at 72 for <9 yr / <100k. **78 appears nowhere in the document.** | ~2 |
| `sections.ltv` → Max Amount Financed | `$50,000` | **Up to $57,500** (both Exeter and ExeterPLUS) | ~2 |
| `sections.reserve` → Standard Participation | `Up to 2% (power flat; varies by tier)` | The 2% power flat is the **ExeterPLUS** figure. Standard Exeter participation is **"See callback"**. Program Details: "Up to 2% of amount financed paid as a power flat **for ExeterPLUS approvals**". | ~2, ~3 |
| `reserveStructure` (top level) | `Up to 2% power flat (varies by tier)` | Same mis-attribution — reads as the standard program's rate. | ~2, ~3 |
| `bureaus.note` | `Uses middle score` | "Minimum 400 **average** credit score." The PDF says average, not middle. (`EXTRACTION_GUIDE.md` §5 repeats "uses middle score" — that quirk entry is also wrong and should be corrected.) | ~3 |

Term and max-amount-financed are both deal-limiting. A desk working from 78 months
would leave four months of term on the table; a $50,000 cap would turn away deals
Exeter would buy up to $57,500.

### MISSING

| What the PDF says | Page |
|---|---|
| **Max DTI 77–87%** (Standard) / up to 87% (PLUS). App carries PTI but no DTI at all. | ~2 |
| **NJ**: if cash price <$10,000, max term must be 48 months or less. | ~2 |
| Mileage above **160,000** is subject to the applicable program tier. | ~2, ~4 |
| Approvals expire **30 days** from original submission date. | ~3 |
| Self-employed and contract workers need **2+ years** of employment. | ~1 |
| Military personnel must provide a current **Leave and Earnings Statement**. | ~1 |
| Proof of insurance: **6-month** comprehensive/collision, $1,000 max deductible; no month-to-month, business/commercial, or 30-day drive-away policies. | ~1 |
| Book value: **J.D. Power clean trade** in all states except AZ, CA, CO, HI, ID, MT, NM, NV, OR, UT, WA, WY, where **KBB** applies. App has no book-value field for Exeter. | ~4 |
| New vehicle definition: current model year, **not titled**, **<6,000 miles**, valued at invoice. Previous-year new vehicles use invoice Jan–Mar and the value guide Apr–Dec. | ~4 |
| "Like invoice" allowance chart for vehicles absent from J.D. Power/KBB: 0–6,000 mi 90% · 6,001–12,000 85% · 12,001–18,000 80% · 18,001–25,000 75% · 25,000+ 60%. | ~4 |
| Credit: **no repossessions in the last 2 months** (unless part of a bankruptcy). ExeterPLUS: no repos in 12 months, no multiple repos, **two or more tradelines**. No straw purchases. No multiple discharged bankruptcies. | ~3 |
| Employees of the submitting dealership are **ineligible**. | ~3 |
| First payment must be submitted if the contract is received within **5 days** of the first payment due date. | ~3 |
| Maintenance / tire & wheel capped at **$1,500** (app lists GAP, VSC and total but omits this line). | ~2, ~3 |
| ExeterPLUS Bronze/Silver VSC **$4,000**; PLUS total backend is lesser of **$4,500** (Bronze/Silver) or **$5,000** (Gold) and 25% of book. App carries only the Gold VSC figure. | ~2, ~3 |
| Acquisition fee "as low as $0", assessed on credit risk; contract assignment fee non-refundable. Neither may be charged to the applicant. | ~2, ~3 |
| Minimum amount financed must be satisfied on the **front-end** loan amount, excluding back-end products. | ~2 |

### UNVERIFIABLE

| App value | Why |
|---|---|
| `bureaus.primary` — equifax, transunion, experian; note "Pulls all three bureaus" | Neither PDF names a bureau anywhere. The scoring basis is stated ("average credit score") but not which bureaus feed it. |

### Cross-document ambiguity (EXTRACTION_GUIDE §6 — two values, store neither)

- **KBB state list.** Program Guidelines: AZ, CA, CO, HI, ID, MT, NM, NV, OR, UT, WA, WY (12 states). Funding Checklist: **AK**/AZ/CA/CO/HI/ID/MT/NM/NV/OR/UT/WA/WY (13 — adds Alaska). The app carries neither, so nothing is wrong today, but the two source documents disagree.
- **Guide name.** Program Guidelines say "J.D. Power"; Funding Checklist says "NADA". These are the same publication post-rebrand, but the docs are inconsistent.
- **Funding Checklist date.** The document is stamped "Revised 10.01.2025" and its filename in `SOURCES.md` carries 2026-06-12. The manifest date does not match the document's own revision date.

### Verified correct (no action)

FICO 400 / zero considered, ExeterPLUS 620, rate as low as 10.95%, front-end 135%,
total LTV 150%, max mileage 200,000, age limit 13 years, <$10,000 book → 66-month
cap, PTI 15–21%, min amount financed $6,000, CPO +$1,000 book, GAP $1,200 or state
max, GAP min 70% front-end LTV, GAP barred in MA and NY, VSC $3,500 full / $2,500
powertrain over 90k mi or 9 yrs, PLUS Gold VSC $4,500, total backend lesser of
$4,000 and 25% of book, VSC minimum 24 months/24,000 miles, rate markup not
permissible, chargeback if first 3 payments not made in full, non-PLUS
participation window 20 days, PLUS 30 days, down payment in full with CA/NV
exception, hail damage repaired before contracting, ineligible-vehicle list, all
POI thresholds ($1,700 single / $2,500 joint), 25% gross-up, temp workers 6+
months, rideshare ineligible, ITIN letter, government-issued ID at contracting,
POR within 30 days, prefunding confirmation call, BK Ch7 considered / Ch13
discharged / dismissed 12+ months.

### STALE

None. App `effectiveDate` "June 12, 2026" matches both "Updated 6.12.26" stamps.

---

## 3. regional — Regional Acceptance (Texas only)

Sources: Program Sheet `13dk1uBsz8kLhtDIsoRLD-v62w9eMOu04` — "Consumer Rates / Indirect Auto Finance Program TX", **Effective: 05/27/2026** (p1).
Underwriting Guidelines `1ILGWQes91nVYi89dVD2rjhEmA5OoPeLs` — "General Dealer Underwriting Guidelines", **Revised 02/2026**, pages numbered 1–2.

This lender has the largest error count in the audit. The dealer-compensation
matrix does not match the rate sheet in any cell.

### WRONG

**a) `sections.reserve` — the entire flat/discount matrix.** Every one of the 28
cells differs from the rate sheet. App values run roughly +0.25 pt / +$100 above
the PDF on the flat tiers, and the discount tiers do not correspond at all.

| LTV band | Tier | App | PDF (p1) |
|---|---|---|---|
| 0–90% | T1 | 3% / $1,200 | **2.75% / $1,100** |
| 0–90% | T2 | 2.5% / $1,000 | **2.25% / $900** |
| 0–90% | T3 | 2% / $800 | **1.75% / $700** |
| 0–90% | T4 | 1.5% / $600 | **1.25% / $500** |
| 0–90% | T5 | 0% | **0.25% / $100 (flat)** |
| 0–90% | T6 | −1.5% | **1.25% / $500 discount (min)** |
| 0–90% | T7 | −3.5% | **3.25% / $900 discount (min)** |
| >90–100% | T1 | 2.5% / $1,000 | **2.25% / $900** |
| >90–100% | T4 | 1% / $400 | **0.75% / $300** |
| >90–100% | T5 | −0.5% | **0.00% / $0** |
| >90–100% | T6 | −2.5% | **2.00% / $800** |
| >90–100% | T7 | −4.5% | **4.00% / $1,200** |
| >100–115% | T1 | 2% / $800 | **1.75% / $700** |
| >100–115% | T4 | 0.5% / $200 | **0.25% / $100** |
| >100–115% | T6 | −4.5% | **3.75% / $1,100** |
| >100–115% | T7 | −6.5% | **5.75% / $1,500** |
| >115% | T1 | 1.5% / $600 | **1.25% / $500** |
| >115% | T4 | 0% | **0.25% / $100 (discount)** |
| >115% | T6 | −4.5% | **3.75% / $1,100** |
| >115% | T7 | −6.5% | **5.75% / $1,500** |

Remaining cells (T2/T3 in the lower bands, T5 at >100%) differ on the same
pattern. Note the app's own top-level `reserveStructure` — "Flat (T1–4) up to
2.75% / $1,100; discount (T5–7) up to 5.75%, min $1,500" — **matches the PDF
correctly**. The summary field and the detail table contradict each other.

**b) Flat vs discount is a function of LTV band, not tier.** The app's note reads
"T1–T4: flat pay (positive %). T5–T7: dealer discount (negative %)." The rate
sheet sets the flat/discount flag per band:

| Band | Flat tiers | Discount tiers |
|---|---|---|
| 0–90% | T1–**T5** | T6, T7 |
| >90–100% | T1–T4 | T5–T7 |
| >100–115% | T1–T4 | T5–T7 |
| >115% | T1–**T3** | **T4**–T7 |

So T5 is a flat at 0–90%, and T4 becomes a discount above 115%. Both are the
opposite of what the app tells the desk.

**c) Term / mileage allowances.**

| Field | App value | PDF value (p1) |
|---|---|---|
| 84-month mileage cap, T1–T4 | `20,000` | **30,000** |
| 78-month mileage cap, T1–T4 | `30,000` | **40,000** |
| `uniqueFeature` | `84mo on T1–4 with ≤20K miles` | ≤**30K** miles |
| `sections.fico` tier table, T1–T4 max term | `84mo (≤20K mi)` | 84mo (≤**30K** mi) |

**d) Valuation basis.**

| Field | App value | PDF value |
|---|---|---|
| `sections.ltv` → Valuation Basis | `NADA Trade-In` | **NADA Clean Trade**, or **KBB Wholesale in approved markets**. Current-year new is up to 125% of **manufacturer's invoice including destination** (previous-year new on invoice through June). | UW p1 |

"Trade-In" and "Clean Trade" are different book values; the app also omits the
invoice basis for new units and the KBB Wholesale alternative entirely.

### MISSING

| What the PDF says | Page |
|---|---|
| **Maximum amount financed: 160% "out the door" LTV.** The app carries only the 125% front-end advance. This is the total-LTV ceiling and it is absent. | UW p1 |
| **Ineligible collateral by brand:** Isuzu, Jaguar, Land Rover, Porsche, Saab, Suzuki; >3/4-ton trucks; commercial-use (ride-hailing, food/package delivery, unfinished work vans); salvage/flood/branded title/grey market; **vehicles without air conditioning**. The app has no vehicle section for Regional at all. | UW p1 |
| **Capacity ratios** — Debt-to-gross-income 50% (T6–7) / 55% (T1–5); payment-to-gross-income 18% (T4–7) / 20% (T1–3). | UW p1 |
| **54-month row** of the term/mileage table: 125,000 mi (T1–T5), 115,000 mi (T6–T7). The app's table jumps 60 → 48. | p1 |
| Rate participation is **not allowed**; RAC pays flats only in certain tiers. | UW p1 |
| Bankruptcy: no multiple or open BKs; dismissed >3 years considered case-by-case; **no time limit on discharge**. | UW p1 |
| No auto repossessions or trade lines reporting I-5/I-8/I-9 in the past **6 months**. | UW p1 |
| At least **one redeeming trade line** must report on the bureau. | UW p1 |
| No delinquent child support. | UW p1 |
| **$725 rent factor** applied when no rent or mortgage payment is provided; rent must be current at funding. | UW p1 |
| Invoice allowance for units over 3,000 miles with no book value: <6,000 mi up to 90% · <12,000 85% · <18,000 80% · <25,000 75% · >25,000 call RAC. Like invoice matches first 8 VIN characters. | p1 |
| Generally **one vehicle financed per licensed applicant**; concurrent financing elsewhere must be disclosed before decision. | UW p2 |
| Minimum of **3 references**; book-out sheet and deal structure required for payment calls. | UW p2 |
| Military POI is a current **LES ≤60 days**; ratios based on YTD entitlements. | UW p2 |
| Front-end advance and total-amount-financed definitions (front-end = base sales price incl. non-backend products − down payment/trade/rebate; total = front-end + TT&L + doc fee + warranty + GAP). | p1 |
| Oldest model-year band on the rate sheet is **2016–2021**, implying a model-year floor the app does not record. | p1 |

### UNVERIFIABLE

| App value | Why |
|---|---|
| `bureaus.primary` = transunion; note "Primarily TransUnion" | Neither document names a credit bureau anywhere. |
| `chargebackWindow` = `N/A` | Neither document mentions chargebacks. "N/A" asserts a fact the sources do not state; per DATA.md this should be null/not-published rather than N/A. |
| `idReq` — "any state ID acceptable" | UW p2 requires "valid government-issued photo ID (e.g. resident state driver license)". It gives an example, not a permission for any state's ID. |

### Cross-document ambiguity

- **Effective date.** Program Sheet states "Effective: 05/27/2026". Underwriting Guidelines state "Revised 02/2026" but are filed in `SOURCES.md` under 2026-05-27. The two documents carry different dates; the manifest lists one.

### Verified correct (no action)

Texas-only restriction, tier-based with no FICO floor, ELT 56124067800, max front-end
advance by tier (125/125/125/125/120/115/110), 75/72/66/60/48-month mileage rows,
T5–T7 max terms, max mileage 130,000, GAP $1,000 or state max at ≥70% LTV,
warranty $3,000 / $4,000 by collateral value, 24-month/24,000-mile minimum warranty
term, $100 processing fee and $100 returned-contract fee, min income $1,900
individual / $2,200 joint, no gross-up, W2 paystub with YTD ≤60 days, self-employed
2 years returns + 4506-C, POR document list and 60-day/no-prepaid-phone rules.

### STALE

App `effectiveDate` "May 27, 2026" matches the Program Sheet. The Underwriting
Guidelines are older (Revised 02/2026) — not a staleness error in the app, but the
two sources are four months apart and `SOURCES.md` dates them both 05-27.

---

## 4. truist — Truist Dealer Financial Services

Source: Program Sheet `1dwSi3YQ1N7TnbXrQADGRMkaPpWnUMnxz` — "Program Guide Reference Sheet", **Effective July 20, 2026**. Four pages, explicitly numbered.

Note: parts of this PDF's text layer are character-corrupted (the GAP paragraph and
several headings render as mojibake). The tables extracted cleanly; findings below
are drawn only from legible text.

### WRONG

**a) `sections.reserve` — the flat pay scale. 25 of 28 rows are wrong**, both in
band boundaries and in amount. The app's bands are coarser than the PDF's and every
overlapping amount is inflated.

| Amount financed | App flat | PDF flat (p3) |
|---|---|---|
| $20,000–$24,999 | $275 | **$250** |
| $25,000–$29,999 | $350 | **$300** |
| $30,000–$34,999 | $450 | **$350** |
| $35,000–$39,999 | $525 | **$400** |
| $40,000–$44,999 | $600 | **$450** |
| $45,000–$49,999 | $650 | **$500** |
| $50,000–$54,999 | $725 | band is **$50,000–$59,999 → $600** |
| $55,000–$59,999 | $800 | same band → **$600** |
| $60,000–$69,999 | $900 | **$700** |
| $70,000–$79,999 | $1,050 | **$800** |
| $80,000–$99,999 | $1,200 | splits: $80–89,999 **$900** · $90–99,999 **$1,000** |
| $100,000–$119,999 | $1,500 | splits: $100–109,999 **$1,100** · $110–119,999 **$1,200** |
| $120,000–$149,999 | $1,800 | splits into three: **$1,300 / $1,400 / $1,500** |
| $150,000–$199,999 | $2,100 | splits into five: **$1,600 / $1,700 / $1,800 / $1,900 / $2,000** |
| $200,000–$239,999 | $2,400 | splits into four: **$2,100 / $2,200 / $2,300 / $2,400** |

Only $10,000–$14,999 ($150), $15,000–$19,999 ($200) and $240,000–$400,000 ($2,600)
are correct. On a typical $35,000 deal the app over-states the flat by **$125**.

**b) DTI and PTI are not uniform across tiers.**

| Field | App value | PDF value | Page |
|---|---|---|---|
| `sections.fico` → Max DTI | `65% (all tiers)` | 65% for T1–T4; **60% for T5 (B3) and T6 (C1)** | 1 |
| `sections.fico` → Max PTI (≤75mo) | `20%` | 20% for T1–T4; **15% for T5 and T6** | 1 |
| `sections.fico` → Max PTI (76–84mo) | `18%` | 18% for T1–T4; **15% for T5 and T6** | 1 |

**c) CPO age/mileage condition attached to the wrong row.**

| Field | App value | PDF value | Page |
|---|---|---|---|
| `sections.backend` → CPO Bonus | "+$750 advance" (Standard, no condition) / "+$1,500 advance (**up to 5 yrs old, ≤50K miles**)" (Luxury) | The 5-year (2021 and newer) / 50,000-mile condition governs **both** programs — "Manufacturer certified pre-owned vehicles that are up to five (5) years old (2021 and newer) and have 50,000 miles or less are eligible: $750 additional add for Standard Program makes. $1500 additional add for Luxury Program makes." | 4 |

**d) Flat-cancel rule is garbled.**

| Field | App value | PDF value | Page |
|---|---|---|---|
| `chargebackWindow` | `Flat cancel: charged if no payment within 20 days` | Flat cancels must be **completed** within 20 days of funding **and no payment may have been made**. "No payment made" is an eligibility condition for cancelling, not a chargeback trigger. | 1 |
| `sections.reserve` → Flat Cancel Fee | `$150 debited if not received within 20 days of funding` | "$150 flat cancel fee applies **only if the original contract is not being replaced**; if the fee is not submitted, $150 will be deducted from dealer reserve." The trigger is non-replacement, not lateness. | 1 |

### MISSING

| What the PDF says | Page |
|---|---|
| **The entire maximum-term-by-model-year matrix.** 2026/2027, 2025, 2024, 2023 → 84 months (T1–T4); 2022 → 75; 2021 and 2020 → 72; 2019 and older → 72 (T1–T3) and **60 (T4)**. T5 column: 84/84/84/75/75/72/72/60. T6 column: 84/84/84/72/72/60/60/60. The app carries a flat `maxTerm: 84` with no age gradation at all. | 1 |
| **GAP state rules — including Texas.** "Oregon and Texas: maximum amount financed for GAP should not exceed $1,200 or **5% of amount financed**, whichever is less." Also: New York — GAP cannot be financed; California — premium ≤$1,200 or 4% of amount financed, LTV must exceed 70% (total financed ÷ MSRP/KBB Retail); South Carolina and Indiana — LTV must be greater than **80%** (front-end ÷ MSRP/JD Power Retail); Colorado — greater of $800 or a stated percentage. The app has no GAP state rules. **This store is in Texas; the 5% test applies to every Truist deal it writes.** | 1 |
| **GAP LTV floor:** not eligible if LTV is ≤70% (front-end advance ÷ invoice or JD Power Clean Trade). | 1 |
| **Total LTV for 76–84-month terms:** 140% (T1/T2), 135% (T3/T4/T5), 130% (T6). App records front-end only for that term band. | 1 |
| **Collateral value basis:** Invoice for new 2026/2027; **JD Power Clean Trade-In** for all other models new and used over 6,000 miles; **KBB Lending** required in AZ, CA, CO, IA, ID, NE, NM, NV, OR, UT, WA, WY. | 1 |
| **Due dates must be set between the 2nd and the 25th** of the month. | 2 |
| Truist does **not** finance contracts with deferred down payments. | 1 |
| 90-day first payment is unavailable over 75 months and only available on **700+** credit scores; **max 45 days to first payment in PA**. | 1 |
| The $25 loan processing fee **cannot be passed to the consumer**. | 1 |
| New-vehicle definition: current model year and newer, **untitled**, under 6,000 miles. | 1 |
| Exotic vehicles absent from the clean trade-in guide are valued at **Manheim Adjusted Value**; upfits and dealer-installed options may be added but **do not increase value for advance purposes**. | 1 |
| **CPO make lists** — Standard ($750): Chevrolet, Chrysler, Dodge, Fiat, Ford, GMC, Honda, Hyundai, **Kia**, Jeep, Mazda, Mitsubishi, Nissan, Ram, Subaru, Toyota, VW. Luxury ($1,500): Acura, Alfa Romeo, Audi, BMW, Buick, Cadillac, Genesis, Infiniti, Jaguar, Land Rover, Lexus, Lincoln, Mercedes-Benz, Mini, Porsche, Volvo. | 4 |
| **Ford Blue Certified and CarBravo Certified** non-Ford/non-GM vehicles, 2021 or newer with ≤50,000 miles, get the $750 add regardless of make; the luxury add does not apply. | 4 |
| Three POR documents the `sections.id` list omits: **online property verification**, **automobile insurance renewal bill <6 months** (cards and policies not accepted), **unexpired trade-in registration**. The app's top-level `por` does mention the insurance renewal, so the two fields disagree with each other. | 2 |

### UNVERIFIABLE

None. Every value the app carries for Truist is addressed by the source document.

### Verified correct (no action)

Bureau split (TransUnion FICO Auto 9, Equifax for FL/GA/NC/SC/TX/VA), both
applicants 640+, 680+ for 76–84 months, front-end and total LTV by tier for
<75-month terms (130/155, 130/155, 125/145, 120/140, 120/135, 120/130), front-end
LTV for 76–84 months (120/120/115/115/115/115), max mileage 120,000 and 50,000,
minimum collateral $20,000 and $12,000, first payment 15–60 days with 61–90 by
underwriter approval ≤75 months, approvals good 30 days, contracts presented within
7 days, $25 processing fee, no cash out, no credit card down payments, backend
approved product list, Credit Life and A&H excluded, backend cap (greater of $4,200
or 20% of collateral, absolute max $10,000), max rate spread 2.00%/1.50%, max
dealer reserve $8,000, ineligible collateral list, client-residence/titling rule,
address verification trigger at <1.5 years.

### STALE

None. App `effectiveDate` "July 20, 2026" matches the PDF's "Effective July 20, 2026".

---

## 5. td — TD Auto Finance

Sources: Program Sheet `1O9q8uW2FdCawn6uauNxv9xYGPZ8fIEvO` — "TDAF Retail Program Guide", doc 84-291-8462, **Effective 06/30/2026**, 7 numbered pages.
Program Sheet2 `1X57L74CerUi8vHJ37BujDe00ZhrxEL_D` — "TDAF Retail Program Overview", doc PROD-9034, **Effective 06.30.2026**, 4 numbered pages. Cited below as **PO**.

**The `SOURCES.md` date flag for `td` resolves in the app's favour.** Both documents
state 06/30/2026 in their own footers. The app's "June 30, 2026" is correct; the
manifest's 2026-07-01, derived from the filename, is the value that is wrong.

### WRONG

| Field | App value | PDF value | Page |
|---|---|---|---|
| `sections.backend` → GAP Maximum | `$1,300 (state law may reduce)` | **$1,500** (unless otherwise limited by state law). The app's own top-level `gapMax` says $1,500 — the two fields contradict each other. | 1 |
| `sections.ltv` → Max Mileage (gas, T1–6) | `120,000 (under 72mo); 100,000 (73mo+)` | "Tiers 1–6 **≤ 72 months** = 120,000 miles; Tiers 1–6 **≥ 73 months** = 100,000". At exactly 72 months the app applies the 100,000 cap; the PDF allows 120,000. | 1 |

**Enhanced flat-fee / BPS table.** The app's BPS labels do not line up with the
payouts. The PDF's ladder is +50 or +75 BPS → 2%, +100 → 3%, +150 → 4%, +200 → 5%;
the app has each payout attached to the BPS step above it.

| Term band | BPS step | App | PDF (PO p1) |
|---|---|---|---|
| 64–72 mo | +100 BPS | 2% / $3,000 | **3% / $4,500** |
| 64–72 mo | +150 BPS | 3% / $4,500 | **4% / $6,000** |
| 64–72 mo | +200 BPS | 4% / $6,000 | **5% / $7,500** |
| 73–84 mo | +150 BPS | 3% / $4,500 | **4% / $6,000** |
| 73–84 mo | +200 BPS | 4% / $6,000 | **no +200 step exists** — 73–84 tops out at +150 |
| 64–72 mo | app row "Max (64–72mo) 5% / $7,500" | unlabelled | that is the **+200 BPS** row |
| 48–63 mo | **+75 BPS → 2% / $1,000** | row absent | present |
| 64–72 / 73–84 | **+50 BPS → 2% / $3,000** | row absent | present |
| Buy rate | shown only under 48–63 | applies to **24–84** months, 1% / $500 | PO p1 |

**Maximum age / term.** The app's model-year term grid does not match the PDF's.

| Model year | App (T1–T2 / T3–T8) | PDF (PO p2) |
|---|---|---|
| 2023–2021 | 84 / 75 | **75** |
| 2019–2018 | 72 or 66 / 66 or 60 | **60** |
| 2017 | 60 / 60 | **48** |
| 2020 | 72 | 72 if amount financed is below the threshold, **66** at or above it |

> **OCR caveat, per EXTRACTION_GUIDE §6.** `Program Sheet2` is a PowerPoint export
> and its tier columns interleave in the text layer. The **row values above are
> legible and reliable**; the **per-tier attribution is not** — I cannot confirm from
> the text which tier column each figure sits in. Treat the row values as findings
> and re-read the tier split from the PDF visually before changing anything.
> The same caveat applies to the front-end and total LTV grids on PO pages 1–2.

### MISSING

| What the PDF says | Page |
|---|---|
| **Maximum backend by invoice/book value** — ≤$10,000 → $2,000 · $10,000.01–$15,000 → $3,000 · $15,000.01–$20,000 → $4,500 · $20,000.01–$25,000 → $5,000 · >$25,000 → 15%/18%/20% of invoice or book, or $3,500/$5,000, whichever is greater, not to exceed max total LTV. The app records only the service-contract cap. | PO p1 |
| **CPO program: TDAF adds 5% to the book-out value** for certified pre-owned. The app has no CPO field for TD. | PO p2 |
| **Booking policy** — J.D. Power Gold Book monthly "Clean Trade" in all states except AZ, CA, CO, HI, ID, MT, NV, NM, OR, UT, WA, WY, where KBB weekly "Lending Value" applies. Plus the full fallback cascade: auction price if purchased at auction within 90 days; the other book; 85% of like factory invoice less $0.15/mile over 15,000 miles; 100% of prior year's book; exotics at 85% of NADA Average Retail with a <90-day auction receipt. **Black Book is not accepted.** | 7 |
| New-vs-used valuation: ≤1 year old, **unregistered**, ≤8,000 miles is valued as **new**; 2 years and older is valued as used. | 1 |
| Maximum amount financed **per customer $300,000** (app has the $250,000 per-transaction figure only). | 1 |
| Maximum mileage — **diesel 120,000**; and no tier or term limits for gas vehicles under 100,000 miles. | 1 |
| **New Jersey**: unpaid cash balance ≤$10,000 cannot exceed 48-month terms. | PO p2 |
| Liens must be perfected within **21 days**; titles received within **90 days** of contract date. | 2, PO p3 |
| TDAF does **not** offer vehicle refinancing. | 1 |
| Contracts or titles in the name of a **trust** are not eligible. | 2 |
| Business applications require an individual co-applicant; pricing based on the individual's credit. | 1, PO p2 |
| **Two references** with verifiable address and phone are required on the application. | 2, 3 |
| **Notice to Cosigner** required in all states for any buyer/cobuyer not on the title; **Texas** is one of eight states with its own accepted NTC form list. | 4 |
| Buy-down: any rate may be bought down by dealer payment of a non-refundable acquisition fee, which **cannot be passed to the customer**. | 5 |
| Irregular payment plans are not available. | 5 |
| Flat cancels require TDAF review case-by-case via a two-step process (message Retail Credit, then call 800-200-1513). | 6 |
| Time at present address under **2 years** → both present and previous addresses required. | 2 |
| Chargeback protection requires six scheduled payments received **and the sixth payment due date reached**. The app omits the second condition. | 6 |
| Ineligible collateral the app omits: vehicles **over one ton**, commercial vans (Sprinter, Ram ProMaster), cab-and-chassis and flatbeds, commercial up-fits, boats, **Reconditioned and Bonded titles**, and the luxury-brand lists — Bugatti, Pagani, Koenigsegg (new and used); McLaren, Aston Martin, Bentley, Rolls Royce, Ferrari, Lamborghini (used only). | 5 |
| Medium Duty: 1500/2500/3500 series require an **upfit** (4500/5500 with or without); LTV valuation 2025+ = 100% of invoice + 100% of upfit, new 2024 = 85% of invoice + 100% of upfit; upfit must be permanently affixed and cannot exceed 40% of combined value, labor excluded. Ineligible: Ram C/V Tradesman, ProMaster, Sprinter, Chevy Low Cab, used vehicles, passenger/livery, van conversions, waste/toxic haulers, tow trucks, car haulers, used upfits, cherry pickers. | PO p2 |
| Non-major OEMs are named: **Rivian, Fisker, Lucid, VinFast**. The app renders this as "non-major OEM EVs", which is an interpretation of the category rather than the PDF's wording. | 5 |

### Ambiguity (EXTRACTION_GUIDE §6 — two values, store neither)

- **2020 model-year term threshold.** The overview shows both "72 if amount financed is <$50,000 / 66 if ≥$50,000" and "72 if amount financed is <$75,000 / 66 if ≥$75,000". Both appear on PO p2. These are probably per-tier variants, but the column scrambling makes it impossible to say which threshold belongs to which tier. Do not store either until read visually.

### Verified correct (no action)

TransUnion Auto FICO 08 as primary bureau via RouteOne and Dealertrack, BK and repo
36-month ineligibility, cannabis-activity exclusion, SSN-or-ITIN application
requirement, no PO box without physical address, "do not include ID copies in the
funding package", POR list and ages (utility/phone ≤60 days, paystub ≤30, bank
statement ≤30, tribal chapter letter), POI list (paystub ≤30 days with start/end
date, prior-year W-2, self-employed tax return + 1099 + 3 months statements,
1-800-200-1513 for other income), $250,000 per-transaction maximum, minimum amount
financed $7,500 (24–75 mo) and $15,000 (76–84 mo), first payment 22–45 days,
approvals valid 30 days, max total LTV 150%, GAP ineligible below 70% front-end
LTV, dealer self-funded warranty ineligible, tire & wheel and maintenance eligible,
80/20 reserve split, TDAF pays the greater of reserve or enhanced flat
automatically, max markup 2.00% (24–72) and 1.75% (73–84), six-payment chargeback
protection, service contract cap (15% of invoice/book or $4,000, greater, and the
$7,000 ceiling for tiers 3–8 under $70,000 book), open 7 days a week, RouteOne
Remote eSign and Dealertrack Remote Signing, medium-duty credit guidelines
(tiers 1–7, 72-month max, 120% LTV tiers 1–5 / 115% tiers 6–7, 33,000 lb GVWR).

### STALE

**No.** App `effectiveDate` "June 30, 2026" matches both source documents.
`SOURCES.md` §2 lists this lender as a mismatch (`≠`, file 07-01 vs app 06-30) — that
flag is incorrect and the manifest row should be corrected to 2026-06-30.

---

## 6. wellsfargo — Wells Fargo Auto

Source: Program Sheet `1dXg8-YyViTdr9mbWuTlYRjiluVvcXRbo` — "Dealer program reference guide", OF-742 (06/16/26), **Effective June 16, 2026**, 18 numbered pages.

### WRONG

| Field | App value | PDF value | Page |
|---|---|---|---|
| `sections.backend` → GAP | `$1,200` | **$1,500** for both waiver and insurance products, subject to state requirements. The app's own top-level `gapMax` says $1,500 — the two fields contradict each other. | 3 |
| `sections.backend` → Windshield | `Greater of $2,000 or 3% (not financeable in **KY, FL, SC**)` | Greater of $2,000 or 3% of adjusted collateral value; footnote 4: "May not be financed for consumers residing in **FL**." Kentucky and South Carolina are not named. | 3 |
| `sections.ltv` → 84-Mo LTV Restriction | `120% for T1/T2 only (PTI ≤**13%**)` | "84 months (payment to income) **<=15%**; up to 120%". Tiers 1 and 2 only is correct; the PTI threshold is 15%, not 13%. | 2 |

The GAP figure is the consequential one — the desk is leaving $300 of GAP coverage
unsold on every Wells Fargo deal it structures from the detail page.

### MISSING

| What the PDF says | Page |
|---|---|
| **Aftermarket advance ceiling: 50% of adjusted collateral value**, covering back-end and front-end products combined. The app lists individual product caps but not the overall advance limit. | 3 |
| Front-end product allowances the app omits: **Surface protection $2,000**, **Paintless dent repair $1,500**, **Etch $700**, and combo products = sum of standalone allowances. | 3 |
| **Minimum term to finance: 12 months.** | 2 |
| **New-vehicle definition**: current, future, or one-year-prior model with **10,000 miles or less**. | 2, 9 |
| **Vehicle valuation** — new = invoice cost or book value minus any manufacturer rebate to the extent it exceeds **$5,000**; used = book value. Primary book by state: **KBB** for AK, CA, CO, HI, ID, MT, NV, OR, UT, WA; **J.D. Power/NADA** everywhere else. Supplemental invoices are not part of collateral value. | 9 |
| Full alternate-valuation cascade: auction receipt, Manheim Market Report, NADA low retail, NADA classic car prices, prior model year within a 5,000-mile tolerance, secondary book, 85% of invoice (current/future/one-prior year over 10,000 miles), 50% of invoice (older). | 9 |
| **Excluded collateral categories** — all-terrain vehicles, cab & chassis, commercial vehicles class 4 and above, branded/salvaged titles, motorcycles, gray market, lemon law, livery, manufacturer buybacks, discontinued U.S. makes, water/flood damage, neighborhood electric vehicles, **unrepaired hail damage**, **upfits**. The app carries only the excluded-makes list. | 8 |
| **Nine excluded makes the app omits**: Chevrolet 4500/5500/6500, Coda, Cross Lander, DaimlerChrysler, Freightliner, GEM, International, Peterbilt. | 8 |
| Simple-interest contracts only; no precomputed interest. | 7 |
| Acquisition fees may not be passed to the customer and cannot affect the customer's APR. | 7 |
| Third-party brokering is prohibited. | 7 |
| Contracts with a balloon payment, or the balloon box checked, **won't be funded**. | 7 |
| Spousal income counts **only** if the spouse is a listed co-applicant. | 7 |
| All Wells Fargo customers are co-buyers with equal responsibility; **co-sign loans are not accepted**. | 4 |
| Contracts received with the **first payment already past due won't be funded**. | 4 |
| Business applications may not use income from federally illegal activity (e.g. cannabis) even where state-legal. | 7 |
| POR: **valid proof of income** (paystubs, bank statements, W-2) is itself an acceptable POR document in the ≤60-day bucket; tribal POR letters need letterhead, issue date within 60 days, authorized signature, and may show a PO Box. Personal correspondence, ads and envelopes are **not** acceptable POR. | 5 |
| POI: from **Jan 1 – Apr 15** the prior year's return isn't required if unfiled — the last signed 1040 from the past two years suffices. A W-2 showing fewer than 90 days of income requires a current paystub. After 90 days of pay, **only bonus income** is annualized. Employment letters must be dated within 30 days and carry employer contact, hire date, position, compensation and average hours. | 6 |
| Title must be perfected within **30 days** of contract date; **Texas ELT code 58250788800**. | 15 |
| Aftermarket cancellation debits must be disputed within **60 days** of appearing on the reserve statement. | 10 |

### UNVERIFIABLE

| App value | Why |
|---|---|
| `bureaus.primary` — all three; note "Pulls all three, uses middle score" | The guide never names a credit bureau or a scoring method. `EXTRACTION_GUIDE.md` §5 repeats the "middle score" claim; it is not supported by this document either. |
| `ficoNotes` / `sections.fico` → "6 tiers (Super Prime → Regular)", "T1 Super Prime → T6 Regular" | The guide references "Tiers 1 and 2" for 84-month eligibility but never enumerates six tiers or names them. |
| `chargebackWindow` = "See callback" | The guide describes aftermarket cancellation debits but states no reserve chargeback window. "See callback" is consistent with the document's general language ("communicated to dealers via callbacks and/or funding notifications") but is not a stated chargeback rule. |

### Verified correct (no action)

Max LTV 135% new and used, the full vehicle-age × mileage term matrix (all 24 cells),
84-month restriction to tiers 1–2 with no thin file or first-time buyers, minimum
amount financed $5,000.01 (≤63 mo) and $7,500.01 (>63 mo), max mileage 150,000,
first payment 19–45 days, approvals valid 30 days, VSC (greater of $4,350 or 18%),
tire and wheel (greater of $1,550 or 7%), maintenance (greater of $2,350 or 15%),
total back-end (greater of $6,000 or 20%, max $12,500), anti-theft $1,500, key
replacement $1,000, GAP front-end LTV floors (70%, 80% in SC and IN, 70% in CA),
dealer compensation maximum $5,000, compensation communicated via callbacks, the
complete DACA/NPRA rule set including the ITIN-assignment-letter exclusion, both POR
buckets and their document lists, POI rules for paystub age, W-2 through Feb 28,
annualization, overtime 90-day rule, self-employed full signed return with bank
statements excluded, military LES ≤30 days, retirement income and 1099-R through
Feb 28, no deferred or credit-card down payments, no cryptocurrency down payments,
prohibited-financing list (refinance, lease buyout, cash-out, commercial, Uber/Lyft).

### STALE

None. App `effectiveDate` "June 16, 2026" matches the document's "Effective June 16, 2026".

---

## 7. ally — Ally Financial

Sources: Program Sheet `1rm-zFIrAzSg4cLZ_z-GB4Y5r0fcZoZuE` — "Ally Consumer Retail Product", **Effective April 1, 2026**, 7 numbered pages; page 7 is the Aftermarket Product Matrix stamped **July 7, 2026**.
"Funding Guidelines" `1Oej_ktEK5rLMxX8GXiUhzTF2wWelSYHm` — this file is actually the **Underwriting Policies & Provisions, Revised April 7, 2026** (10 numbered pages). Cited as **P&P**. `SOURCES.md` mislabels its doc type.
84-month Program Sheet `1R-6gins9tE5wyy3dqNRUJv6FcaOyXo0Y` — **unreadable, see below**.

### WRONG

| Field | App value | PDF value | Page |
|---|---|---|---|
| `sections.backend` → GAP min LTV | `min 60% LTV` | **70%** for non-commercial retail. 60%/80% applies to commercial and ComTRAC, not retail. IN and SC require **80%** on all DCA transactions (70% for GAP Insurance in IN only); CA is 70% on all DCA. | 7, P&P 4 |
| `sections.backend` → Maintenance | `Greater of $2,000 or **15%** of EDC/AWV` | Greater of $2,000 or **10%** of EDC/AWV. The 15% belongs to Mechanical Service (greater of $5,000 or 15%), which the app has right. | P&P 4 |
| `sections.ltv` → Used 2019–2015 | `Max 75 months (FICO ≥620, AMF >$5K, Mileage <100K)` | The model-year bands are **New/CSU–2021 → 84**, **2020–2016 → 75**, **2015–2014 → 63 (S–B tiers only)**. The app's year range is off by one on both ends and the 63-month band is missing entirely. | 1 |
| `sections.reserve` → $75K–$149,999 row, 76–84 mo column | `2.00% (D/E)` | Max DFI for 76–84 months is **1.50%** at every amount band. "All D & E Tiers → 2.00%" is a separate rule spanning all terms, which the app also states correctly on its own line — putting it in this cell reads as if $75K+ deals get 2.00% at 84 months. | 1 |
| `uniqueFeature` | `auction CPO $1K bonus` | The **$1,000 add is for OEM or approved non-OEM Certified Pre-Owned** certification, with a signed CPOV Acknowledgement Form. Auction pricing is a separate valuation method (SmartAuction price good 120 days, other auctions 90 days). The app merges two unrelated rules. | P&P 3, 5 |

### MISSING

| What the PDF says | Page |
|---|---|
| **The entire Non-Prime max advance grid** (FICO <620), tiers S–E: New ≤72 mo 135/130/125/120/115/115 · Used ≤72 135/130/130/125/115/115 · New and Used 73–75 130/125/120/115 · New and Used 76–84 125/120/115. The app names the non-prime tiers but carries no advance figures for them. | 1, P&P 1 |
| **$795 Dealer Acquisition Usury Fee** — assessed on standard-rate retail where the buy rate meets or exceeds the state statutory limit (or Ally's internal ceiling). **Not waived for Champions Club dealers.** Where both fees qualify, only the higher is assessed. Neither fee may be passed to the customer or shown on the contract. | P&P 2 |
| Contracts not received within **15 days** of contract date may be ineligible for purchase; contracts not complete within **20 days** are subject to payoff. | P&P 1 |
| Title documents must be submitted **no more than 30 days** from date of sale. | P&P 9 |
| Used-vehicle valuation: JD Power Clean Trade-In, or **KBB Lending Value** for dealers in AZ, CA, CO, HI, ID, NM, NV, OR, UT, WA, WY, **or auction purchase price** (SmartAuction good 120 days; all other purchases 90 days). | P&P 3, 5 |
| **Dealer-installed option maximums**: XM/CD $500 · chrome wheels $1,000 · power sunroof $500 · rear spoiler $250 · audio/video $500 · leather upgrade $500 · trucks only: running boards $250, bed liner $250. | P&P 5 |
| Nine aftermarket products the app omits: **Key Fob Replacement** $1,000/$1,500 · **Windshield Protection** greater of $1,200 (or $1,500) or 4% · **Paint, Fabric & Leather** $1,500/$2,000 · **Paintless Dent Repair** $1,200/$1,500 · **Theft/catalytic converter** $1,500/$2,000 · **Bundled Products** $2,500/$3,000 · **Cleaning Treatment** $500 · **Nitrogen Tire Fill** $200 · **Pulsating Third Brake Light** $800 · **Battery Performance Protection** (non-EV $1,000; EV greater of $3,000 or 10%) · **Vehicle Value Protection** $1,500. | 7, P&P 4 |
| Ally **will not accept contracts that include joint disability coverage**. | P&P 4 |
| Hail-damaged, Lemon Law and OEM buyback vehicles require the Acquisitions Analyst for eligibility. | P&P 1 |
| POI documents the app omits: military **LES (Base Pay + BAS + BAH only)**; child support/alimony (court award letter + last 4 consecutive payments, or Child Support Payment Center history); disability (short-term needs an award letter **plus** verification of continued income; long-term needs an award letter or 4 recent statements); unemployment; **seasonal income — prior 2 years' 1040**; rental income — 1040 with Schedule E. Also: if a paystub lacks YTD figures, the previous year's W-2 is required, and stated income must match Schedule C line 31 plus depreciation. | P&P 10 |
| POR documents the app omits: land-line phone bill, Ally account statement, real-estate/escrow tax bill, HUD/mortgage closing statement, SSN documentation. Proof of Name also accepts a **divorce decree**. | P&P 10 |

### UNVERIFIABLE

| App value | Why |
|---|---|
| `bureaus` — all three, "uses middle score" | Neither document names a bureau or a scoring method. `EXTRACTION_GUIDE.md` §5 does not claim middle score for Ally, but the app does. |
| `sections.fico` → "Tiers (Prime) S, A, B, C" / "(Non-Prime) S, A, B, C, D, E" | The tier letters are confirmed, but the split — C being the last prime tier and D/E non-prime only — is not stated. P&P shows CB score minimums of 520 for **all six** tiers S–E. |

### Unreadable source (EXTRACTION_GUIDE §6)

**`ally 84 month Program Sheet` (`1R-6gins9tE5wyy3dqNRUJv6FcaOyXo0Y`) has no extractable text.** The
entire file returns only bullet and checkmark glyphs. It is an image-only PDF. Any
84-month-specific terms it carries could not be checked against the app. This file
needs to be re-exported with a text layer, or read visually.

### Cross-document conflict (store neither)

**GAP advance-rate floor for commercial / ComTRAC.** The Aftermarket Product Matrix on
Program Sheet page 7 says **60%**; the same matrix in the P&P (page 4) says **80%**.
Retail non-commercial is 70% in both, so the app's retail figure is unaffected — but the
two Ally documents disagree on the commercial number.

### Verified correct (no action)

Retail minimum CB score **520** and lease **550** (P&P p1 — both confirmed), the complete
prime max-advance grid for EDC/AWV <$100K across all three term bands, max rate 24.00%
new / 25.00% used, minimum all-in amount financed $5,000, **minimum $20,000 for 76–84
month terms** (P&P p1), **maximum mileage on used 150,000** (P&P p1), approvals valid 30
days, total aftermarket cap (greater of $5,000 or 30%, max $10,000 under $80K and $15,000
at or above), GAP $1,500/$2,000, GAP excluded in NY and DC, GAP Plus available except AK,
DC, NE, NY, TX, Mechanical Service greater of $5,000 or 15%, Tire & Wheel greater of
$1,500 or 7%, Etch $1,200/$1,500, the full retail dealer participation table (flats
$150/$250/$350/$450/$500 by amount band; max DFI 2.50% ≤60, 2.00% 61–75, 1.50% 76–84, and
2.00% for all D & E tiers), Dealer Acquisition Fee up to $795 non-Champions Club and
$0/$500 Champions Club, the Feb 1 2026 ADR Retail Bonus Reward note, credit-card down
payment up to $5,000 with name matching, ineligible vehicles (salvage, totaled,
water/flood, frame damage, odometer rollback), SmartLease and ComTRAC availability, and
all POI/POR/ID items the app does carry.

### STALE

**Yes.** App `effectiveDate` is "April 1, 2026". Two source components are newer:
the Underwriting Policies & Provisions were **revised April 7, 2026**, and the
Aftermarket Product Matrix is stamped **July 7, 2026**. Per `DATA.md` §3.3 the
effective date should be the newest of the set — July 7, 2026 — with the others
recorded in `source.notes`.

---

## 8. fifththird — Fifth Third Bank (Texas only)

Source: Program Sheet `1M5cikg9r9KADCNhRNQQF4w9hzGnc_FoJ` — "Consumer Auto Program Guide — TEXAS", **July 23, 2026**, 2 numbered pages.

### WRONG

**a) The model-year term table is wrong in every row.** The app's year bands are all
shifted later than the PDF's, and one term value and one whole row are invented.

| App row | App terms / min value | PDF row | PDF terms / min value |
|---|---|---|---|
| 2024–2026 | 24–84, $20K for 76+ | **2023 & newer** | 24–84, $20,000 for 76+ |
| 2021–2023 | 24–75, $12.5K for 67+ | **2019–2022** | 24–75, $12,500 for 67+ |
| 2018–2020 | 24–**72**, $10K for 61+ | **2017–2018** | 24–**66**, $10,000 for 61+ |
| 2016–2017 | 24–63 | **2014–2016** | 24–63 |
| 2013–2015 | 24–60 | *(no such row)* | the PDF's oldest band is 2014–2016 |

A 2019 unit is shown in the app as capped at 75 months when the sheet allows 75; a
2018 unit shows 72 when the sheet allows 66; a 2017 unit shows 63 when the sheet
allows 66. Every model-year lookup on this lender's page returns the wrong term.

**b) Other wrong values.**

| Field | App value | PDF value | Page |
|---|---|---|---|
| `ficoMin` / `ficoNotes` / `sections.fico` | `650 for **2013+** units` | "Minimum 650 FICO on units **2014** and newer." | 1 |
| `sections.ltv` → Max Amount Funded | `$100,000 (plus allowable backend)` | "Maximum amount funded **$125,000** plus allowable backend." | 2 |
| `sections.fico` → Elite bonus point | `+1 for **2020 or older**` | "**2021** or Older Unit — 1 Bonus Point" | 1 |
| `sections.fico` → Elite bonus point | `+1 for **75+mo**` | "**76-84 month** contracts — 1 Bonus Point" | 1 |

### MISSING

| What the PDF says | Page |
|---|---|
| **76+ month terms are capped at 45,000 miles.** The app's 140,000-mile figure is the program maximum, but long terms carry a far tighter cap. | 1 |
| **GAP Administration Fee — $50** on every contract including GAP, charged to the monthly reserve statement. A direct per-deal cost the app doesn't show. | 1 |
| **Small-deal flat rules**: contracts 48+ months need a total amount financed of **$10,000 or more** to earn the percentage flat. Contracts **24–47 months at $7,500+** and contracts **48+ months between $7,500 and $9,999.99** receive a **$100 flat** instead. The app's reserve table implies the percentage applies to every deal. | 1 |
| The flat table applies to **48–84 month** terms only. | 1 |
| Chargeback also triggers on a **balance reduction of more than 25%** of the original loan balance before 3 payments or 120 days; product refunds to borrowers are charged back; payoffs are excluded from the 3-payment requirement. | 1 |
| **Unrepaired hail damage up to $3,000 is financeable** if the approved vehicle value is reduced by the damage amount. This is a deal-enabling rule the app omits entirely. | 2 |
| **Maximum MSRP/JD Power Retail value of $150,000.** | 2 |
| **Minimum term is 24 months.** | 2 |
| Doc fee over **$225.00** requires the dealer to comply with specific Texas regulations and show proof on request. The app has the $399 cap but not the $225 trigger. | 2 |
| **Model year flip**: effective April 1st, all previous-year models are valued as "Used" on the approved guide. | 2 |
| For used current-model vehicles not yet in JD Power, use **KBB**; if still unavailable, book the JD Power previous-year model with the same trim/options. | 2 |
| **EV charging stations are not eligible for financing.** | 2 |
| Only vehicles from **mainstream manufacturers** are financed. | 2 |
| Manufacturer CPO can be included in Retail value for recognized JD Power units. | 1 |
| All other products and their sales tax apply to the **front-end advance**, which may raise the buy rate. | 1 |
| Signed Title Guarantees required for all out-of-state customers. | 2 |
| Reserve discrepancies must be raised within **4 months** of statement date. | 2 |
| Flat-cancelled contracts require a new application and a new credit decision. | 2 |
| Elite status earns for the remainder of the current quarter **plus the full following quarter**; Elite dealers also receive the enhanced backend policy. | 1 |
| Loans **titled to a business** are excluded (app lists trust/POA/straw/brokered but not this). | 2 |
| **TX ELT code 31067686500.** | 2 |

### UNVERIFIABLE

| App value | Why |
|---|---|
| `bureaus.primary` — all three; note "All three bureaus" | The guide never names a credit bureau. |

### Verified correct (no action)

Texas-only restriction, front-end advance 115% including doc fees and TT&L and
excluding qualified backend, total LTV cap 140%, MSRP/JD Power Retail valuation,
Black Book not accepted, max mileage 140,000, minimum amount financed $6,000
excluding backend, maximum 45 days to first payment, approvals valid 30 days, the
complete rate-adjustment flat table (5.00% at +1.00 down to 0.00% at −1.25), buy
rate pays 3% with flats at 100% and no cap or split, Elite tier thresholds and
payouts (30–64 → 0.25%, 65–94 → 0.50%, 95+ → 0.75%), standard backend 20% up to
$7,500, Elite backend 25% up to $10,000, guaranteed $4,000 minimum backend, VSC
greater of $3,500 or 15% with 24-month minimum, maintenance greater of $1,500 or
10% and prepaid-scheduled-only, GAP lesser of $1,850 or 5% of amount financed with
a 70% front-end advance minimum, CLAH no longer accepted, doc fee cap $399, cash or
cash-equivalent down payments, no trust accounts, no power of attorney, no straw
purchases, no brokered contracts, verifiable physical address, applicant-only
income, no marijuana-related income, and the ineligible-vehicle list.

### STALE

None. App `effectiveDate` "July 23, 2026" matches the sheet's own date on both pages.

---

## 9. gls — GLS / Global Lending Services

Sources: Program Sheet `1FosJDBLX8H9vjNf-ZO3jdQAG1ecWBggs` — "Program Guidelines", doc code **GLS_PG_V53_2026**, 2 numbered pages.
Funding Guidelines `1zmQry9GwX75muumyEBX5jP8qmglbTKzq` — "Dealer Funding Checklist", cited as **FC**.

### WRONG

| Field | App value | PDF value | Page |
|---|---|---|---|
| `sections.ltv` → Front-End LTV | `Up to **125%**` | **130%** ("Front-End (as high as) 130%") | 1 |
| `sections.ltv` → Total LTV | `Up to **135%**` | **140%** ("Loan to Value (as high as) 140%"). The app's own top-level `maxLTV` says 140% — the two contradict each other. | 1 |
| `sections.backend` → Select Program Backend | `Up to **4%**` | Select back-end is **$5,200** (warranty up to $4,000, GAP $1,200). The 4% figure is Select's **dealer flat**, not a backend cap — the app has merged dealer compensation into the backend table. | 1 |
| `sections.ltv` term table, 20,001–120,000 mi | single row, `72 months` | Two separate bands: **20,001–80,000** → Select **75**, T1–T4 72; **80,001–120,000** → Select 72, T1–T4 72. The app collapses them and loses Select's 75-month band. | 1 |

Front-end and total LTV are both understated by five points. On a $25,000 book that
is $1,250 of advance the desk is not asking for.

### MISSING

| What the PDF says | Page |
|---|---|
| **Select-tier backend figures**: warranty up to **$4,000** and total back-end up to **$5,200** (the app shows only the T1–T4 figures of $3,500 and $4,600). | 1 |
| **Advantage tier** flat of 2% is absent from `sections.reserve` (the top-level `reserveStructure` does mention it). | 1 |
| Term footnotes: **66 months for book values under $10,000**; **66 months for vehicles over 10 years old**; **T3–T4 max term 72** (the app shows 75 for all of T1–T4 at 0–20,000 miles). | 1 |
| **Vehicle valuation rules** — new: manufacturer's invoice for untitled units under 3,000 miles. Used: JD Power clean trade or **KBB wholesale**, KBB in AZ, CA, CO, ID, NM, NV, OR, UT, WA, WY. Prior-year new: invoice January–March, guide April–December. **Current-year used: invoice required, valued at 90% of invoice less $0.25 per mile, less all rebates and incentives.** | 2 |
| Rates as low as **9.95%**; down payment as low as **$0**; acquisition fee as low as **$0**. | 1 |
| Acquisition and contract fees **may not be passed on to the customer**. | 2 |
| **Child support / alimony** income is accepted — state agency or court order covering the loan term plus 3 months of bank statements. The app's income section omits it. | 2, FC |
| Ineligible vehicles the app omits: **heavy duty**, **manufacturer buybacks**, and **any vehicle not listed in JD Power/KBB**. | 2 |
| "What to avoid": **open bankruptcies**, **repossessions in the past 4 months**. | 1 |
| Contracts must be **simple interest**; most Bankers System and LAW contracts accepted. | 2 |
| Payment calls — final vehicle structure must be submitted and approved before funding. | 2 |
| Loan-to-value is calculated as amount financed ÷ approved book; minimum and maximum amount financed **may vary by dealer status**; front-end includes TT&L and max sales-price limits apply. | 2 |
| Expedited funding: current paystub + current utility bill + **3 references** funds the deal. | 1 |
| Funding package requires **minimum 6 months of insurance**, a **minimum of 3 personal references**, and a separate odometer statement where the title application lacks the field. Packages incomplete after **5 days** are returned to the dealer. | FC |

### UNVERIFIABLE

| App value | Why |
|---|---|
| `sections.id` → ITIN "✓ Accepted" | Neither document mentions ITIN. GLS is also absent from the app's own ITIN quick list, so the detail page and the quick list disagree. |

### Verified correct (no action)

FICO range 400–700 with zero FICO considered, minimum income $1,800/month, max PTI
24%, self-employed and 1099 not accepted, dealership sales/management/F&I personnel
not accepted, 15-second approvals 24/7/365, no book-to-look, clean deals fund in 48
hours, loan amount $7,000–$55,000, contract fee $199, max term 78 months, max
vehicle age 12 years, max mileage 180,000, EV eligibility (max 6 years / 75,000
miles) and the exact EV model list, dealer flats by tier (Select 4%, T1–T2 3%,
T3–T4 2%, Advantage 2%) paid as a percentage of front-end, **NO CHARGEBACKS**,
flats paid on contracts received within 20 days of initial application receipt,
approvals valid 30 days, GAP $1,200 Select / $1,100 others with a **greater-than-80%
front-end LTV** requirement and MA/NY exclusion, warranty 24 months/24,000 miles
covering seals and gaskets, T1–T4 warranty $3,500 and backend $4,600, down payment
must be cash or actual cash value of trade with no hold checks/borrowed funds/credit
cards, **photocopy of a valid U.S. driver's licence for all signers** (confirmed in
the Funding Checklist), the full POR one-doc/two-doc structure, W-2 paystub ≤30
days, part-time/temp W-2 with 6 months on job, SSI/disability/pension award letter
plus 3 months of statements, SSI and disability grossed up 115% with pension treated
as net, and the ineligible-vehicle list as far as it goes.

### STALE

**Not resolvable from the source.** The document carries **no effective date** — only
the version stamp "Program Guidelines v53 2026" / `GLS_PG_V53_2026`. The app's
"2026 (v53)" is therefore a faithful transcription of what the document says.
`SOURCES.md` flags this lender as a mismatch (`≠`) against a 2026-07-27 filename
date, but that date exists only in the filename, not in the document. Per `DATA.md`
§3.3 an ISO date is required; **only the filename can supply one**, and that should
be recorded as a filename-derived date rather than a document date.

---

## 10. capitalone — Capital One Auto Finance

Sources: Program Sheet `1iU_bLQVWiuaSeoTZKtUljRYia_9I0Nkl` — "Executive Diamond Partner / Program guidelines", **Issue date January 2026**, 2 numbered pages.
Funding Guidelines `1GPPmk175O3xIiJDdnX2EEs2DKDqL2Vnu` — "Funding Checklist", **Issue date March 2025**.
Funding Guidelines2 `1Lkf6Duc11I-Vi3jRiaL6PCgu44Xu6D33` — "Funding Guidelines", **Effective date March 2025**. Cited as **FG2**.

> **`SOURCES.md` dates both funding documents to January 2026. Both are stamped March 2025.**

### WRONG

| Field | App value | PDF value | Page |
|---|---|---|---|
| `sections.ltv` → "Low-Book Advance (Book ≥$10K) 150% / (Book <$10K) 175%" | labelled **Low Book Advance** | These are the **Loan to Value** limits ("Loan to Value — Up to 150% for book value ≥ $10K, up to 175% for book value < $10K"). **Low Book Advance is a different thing entirely**: "Greater of {(Book value + $2,000) / Book value} or FE limit." The app has the right numbers under the wrong name and omits the actual low-book formula. | 1, 2 |
| `sections.fico` → Thin File | `$1,000 min **income** for <2yrs on file or <3 trade lines` | The "<2 years on file or <3 trade lines" condition governs **Minimum Down of $1,000**, not minimum income. Minimum income is a flat $1,500/month. | 1 |

### MISSING

| What the PDF says | Page |
|---|---|
| **All-in Back End Limit** — None / up to **$1,200** / up to **$900** by tier group. The app has per-tier VSC caps and a GAP cap but no all-in backend ceiling. | 1 |
| **Monthly payment cap** — up to **$1,000** / up to **$800** by tier. Absent from the app entirely. | 1 |
| **Other Back End** — greater of $2,000 or up to **15% of book value** (a category separate from VSC and GAP). | 1 |
| **Dealer participation or flat cannot exceed the finance charge** from Capital One, and a flat must be contracted at buy rate. | 2, FG2 |
| **Vehicle restrictions — the app has no vehicle section for Capital One at all.** FG2: does not finance **Daewoo, Isuzu, Saab, Suzuki, Oldsmobile, Fisker, VinFast, Smart Cars older than 2008**; no commercial-use vehicles; no vehicle without the **original factory odometer**; no vehicle not originally manufactured for US sale. | FG2 |
| **Down payment sources**: cash, certified funds (cashier's check or money order), personal check, or debit card. **No deferred down payments outside California and Nevada.** | FG2 |
| Pre-qualified leads get tiers 0–9 with **84-month max term for 0–50K miles on tiers 0–5**, and up to **150K miles on all tiers**. The app's Auto Navigator note has the tier access but not these limits. | 2 |
| Definitions the app omits: Front End Advance = (sales price + doc fees + approved front-end products − down payment − net trade − manufacturer rebate) ÷ book value; Loan to Value = total amount financed ÷ book value; Minimum Down may be cash, positive trade **or manufacturer's rebate**. | 2 |
| "Maximum term limits may vary by **mileage, make/model, and book value**." | 2 |
| POR: **concealed carry license** is an accepted document; with two applicants, POR must be dated **prior to the approval date**. | FG2 |
| GAP: refer to state guidelines for specific policy limits. | 2 |

### Ambiguity (EXTRACTION_GUIDE §6 — two values, store neither)

- **Minimum amount financed.** Page 1 says "**Minimum $2,000 FE**"; page 2 says "Amount Financed — **From minimum of $4,000**". Same document, two figures. The app carries $2,000.
- **Maximum vehicle age.** Program Sheet (Jan 2026): "vehicle age **≤ 15 years**". FG2 (Mar 2025): does not finance "any vehicles **older than 12 model years**". The app carries 15. The newer document supports 15, but the two sources conflict and FG2 has not been superseded on its face.

### OCR caveat (EXTRACTION_GUIDE §6)

The Program Sheet is a single-page grid whose **tier columns interleave in the text
layer**. Row values (VSC $7,000/$8K/$6K/$5K/$4K/$3K, minimum-down conditions, all-in
backend None/$1,200/$900, monthly payment $1,000/$800) are legible; **which tier each
belongs to is not reliably recoverable**. The app's tier attribution for the VSC ladder
(T0 through T5) is plausible but could not be confirmed — read it visually before
changing anything.

### UNVERIFIABLE

| App value | Why |
|---|---|
| `bureaus` — all three, "uses middle score" | Neither document names a bureau or scoring method. `EXTRACTION_GUIDE.md` §5 says Capital One publishes no FICO minimums, which the app reflects correctly, but the bureau claim is unsupported. |
| `chargebackWindow` = "See Dealer Navigator callback" | No chargeback rule appears in either document. Consistent with the sheet's "See callback for details" language but not a stated rule. |
| `idReq` = "Not specified (DL / ID card appear only as POR options)" | Accurate as written — this is a correct statement of absence, not an unsupported claim. |

### Verified correct (no action)

Tiers 0–9, no published FICO minimums, all deals via Dealer Navigator, max amount
financed $75,000 prime / $55,000 subprime, front-end advance 120% (book ≥$25K
non-prime or all book values prime) and 130% (book <$25K non-prime), payment-to-income
up to 20%, minimum income $1,500/month, NDI minimum $50 and its full formula, the
sales-price-to-book rule, max vehicle age 15 years and mileage 200,000, the complete
mileage × tier term matrix (84/75/72/48 for tiers 0–5 and 75/75/72/48 for tiers 6–9),
the 84-month condition (age ≤5 years and amount financed >$20K), the 48-month cap for
vehicles 13 years and older, GAP up to $1,200 or state maximum, VSC minimum 2
years/24,000 miles to count as backend, participation 2.5% (≤60 mo) / 2.0% (≤75 mo) /
1.5% (76+ mo), the full flat schedule ($100/$150/$200/$250/$300) contracted at buy
rate, the POR document list and 60-day window, and Auto Navigator pre-qualified leads.

### STALE

App `effectiveDate` "January 2026" matches the Program Sheet's issue date. Per
`DATA.md` §3.3 a month-only date should be normalised to 2026-01-01 with a note. The
two funding documents are **ten months older** than the manifest claims (March 2025,
not January 2026) — worth re-pulling from the portal, since FG2 carries the vehicle
restrictions and its 12-model-year limit conflicts with the current sheet.
