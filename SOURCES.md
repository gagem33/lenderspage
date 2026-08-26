# Lender Hub — SOURCES.md

Manifest of source documents. Maps each lender `id` (DATA.md) to its PDFs in the **LENDERHUB/LENDERHUBSOURCES** Drive folder, with file IDs so the agent can fetch them directly and fill `source.drive_file_id`.

Folder: `LENDERHUB/LENDERHUBSOURCES` — Drive ID `1kf_mJ09Sxfg--PQ-xqOXdkouYUJ8ryz9`
Inventory taken 2026-08-22, recounted 2026-08-25. **39 PDFs** + 1 README. All uploaded 2026-07-29.
(This line said 38 until 2026-08-25. `DFC - Funding Guidelines` was in the table below all along
and was never counted.)

---

## 1. Folder conventions (as actually used)

Filename pattern: `{Bank} - {Doc Type} - {MMDDYY}.pdf`
Example: `Exeter - Program Sheet - 061226.pdf` → Exeter, Program Sheet, effective 2026-06-12.

The `_README` Google Doc in the folder points here. If they ever disagree, this file wins.

**Bank name in filename → lender `id`:**

| Filename prefix | `id` |
|---|---|
| 5th3rd | fifththird |
| Ally | ally |
| AmeriCredit | amcredit |
| Bank of America | bofa |
| CapOne | capitalone |
| Chase | chase |
| CPS | cps |
| DFC | dfc |
| Exeter | exeter |
| Flagship | flagship |
| Global | gls |
| Kia / KIA | kia |
| PNC | pnc |
| Regional | regional |
| Santander | santander |
| TD | td |
| Truist | truist |
| USBank | usbank |
| Wells Fargo | wellsfargo |
| Westlake | westlake |

**Doc types seen and what they're for:**

| Doc type in filename | Authority for | Maps to EXTRACTION_GUIDE §2 |
|---|---|---|
| Program Sheet | Credit, LTV, terms, vehicle, backend, reserve | Dealer Program / Reference Sheet (or full guidelines if multi-page) |
| Program Guidelines / Underwriting Guidelines / Program Rules | Same, full detail. Higher authority than Program Sheet. | Underwriting / Program Guidelines |
| Funding Guidelines | POI, POR, ID, stips, first payment, funding timelines | Underwriting guidelines — funding section only. Do not pull LTV/term from these unless the Program Sheet lacks them. |
| Program Highlights | Summary | Reference Sheet, lowest authority |
| Proof of Residence | `residency.*` only | Addendum |
| 84 month Program Sheet / Prime Program Sheet | Sub-program terms | Addendum to the base Program Sheet; conditions go in `max_term_conditions` / notes |
| K500&K506 (Kia) | Bulletin | Bulletin — effective date supersedes base |

When a lender has both a Program Sheet and Guidelines/Rules, extract from Guidelines first and use the Program Sheet to cross-check. Conflicts → ambiguity list.

---

## 2. Manifest

`date` = MMDDYY from filename, shown as ISO. **App** = `effectiveDate` currently stored in `index.html`. ≠ means the filename date and the app's stored date don't match — re-verify.

| id | Doc | date | Drive file ID | App effectiveDate | Text layer |
|---|---|---|---|---|---|
| amcredit | Program Sheet | 2026-06-12 | `1BcVmDpbQotQpB93acjWvX2uH3BRcjP37` | June 12, 2026 ✓ | **IMAGE_ONLY** p11 of 11 |
| exeter | Program Sheet | 2026-06-12 | `1fE1EdXQaWcqwyc_HGpYQs8UrUu0cVJpS` | June 12, 2026 ✓ | ok (2p) |
| exeter | Funding Guidelines | 2026-06-12 | `15kVW67-Yhae_s6QvJ7TzmZH_1mq-tGe5` | | ok (1p) |
| regional | Program Sheet | 2026-05-27 | `13dk1uBsz8kLhtDIsoRLD-v62w9eMOu04` | May 27, 2026 ✓ | ok (1p) |
| regional | Underwriting Guidelines | 2026-05-27 | `1ILGWQes91nVYi89dVD2rjhEmA5OoPeLs` | | ok (2p) |
| truist | Program Sheet | 2026-07-20 | `1dwSi3YQ1N7TnbXrQADGRMkaPpWnUMnxz` | July 20, 2026 ✓ | **PARTIAL** p1,2,4 of 4 |
| td | Program Sheet | 2026-06-30 | `1O9q8uW2FdCawn6uauNxv9xYGPZ8fIEvO` | June 30, 2026 ✓ | ok (8p) |
| td | Program Sheet2 | 2026-06-30 | `1X57L74CerUi8vHJ37BujDe00ZhrxEL_D` | | ok (4p) |
| wellsfargo | Program Sheet | 2026-06-16 | `1dXg8-YyViTdr9mbWuTlYRjiluVvcXRbo` | June 16, 2026 ✓ | ok (18p) |
| ally | Program Sheet | 2026-04-01 | `1rm-zFIrAzSg4cLZ_z-GB4Y5r0fcZoZuE` | April 1, 2026 ✓ | ok (7p) |
| ally | 84 month Program Sheet | 2026-04-01 | `1R-6gins9tE5wyy3dqNRUJv6FcaOyXo0Y` | | **IMAGE_ONLY** p1 of 1 |
| ally | Funding Guidelines | 2026-04-01 | `1Oej_ktEK5rLMxX8GXiUhzTF2wWelSYHm` | | ok (10p) |
| fifththird | Program Sheet | 2026-07-23 | `1M5cikg9r9KADCNhRNQQF4w9hzGnc_FoJ` | July 23, 2026 ✓ | ok (2p) |
| gls | Program Sheet | 2026-07-27 | `1FosJDBLX8H9vjNf-ZO3jdQAG1ecWBggs` | "2026 (v53)" ≠ | ok (2p) |
| gls | Funding Guidelines | 2026-07-27 | `1zmQry9GwX75muumyEBX5jP8qmglbTKzq` | | ok (1p) |
| capitalone | Program Sheet | 2026-01-01 | `1iU_bLQVWiuaSeoTZKtUljRYia_9I0Nkl` | "January 2026" ~ | ok (2p) |
| capitalone | Funding Guidelines | 2026-01-27 | `1GPPmk175O3xIiJDdnX2EEs2DKDqL2Vnu` | | ok (1p) |
| capitalone | Funding Guidelines2 | 2026-01-01 | `1Lkf6Duc11I-Vi3jRiaL6PCgu44Xu6D33` | | ok (1p) |
| westlake | Program Sheet | 2026-07-08 | `1KI4qsTOCXRm2tt4kJqOvTFDWKHcl-ESR` | "July 2026" ~ | ok (1p) |
| westlake | Prime Program Sheet | 2026-07-08 | `1fwQ1YndmQi0zq9r5WTDTmAy9hhVje6VI` | | ok (1p) |
| westlake | Program Guidelines | 2026-01-01 | `1FHLl1NXqFdoIBTnwhWpfInJqUfIS610C` | | **IMAGE_ONLY** p1 of 6 |
| kia | Standard New - National | 2026-01-06 | `1w-r5QJqPQDMFZT1rBrfAVfSL2qxTosc9` | Jan 6, 2026 ✓ | ok (1p) |
| kia | K500&K506 | 2026-07-01 | `1IyXoIz8Pia7vRv4o9I6k44e4D-njRDV8` | "K500/K506 July 7" ≠ (file says 07-01) | ok (10p) |
| kia | K500&K506-2 | 2026-07-01 | `1Ur5v1OgYWfrJUkxsZCQqXLVzE2Yq84Xx` | | ok (6p) |
| bofa | Program Sheet | 2026-06-18 | `1xbiqM_pi-0XcddGDV5flk9FaSDbmnHYz` | June 18, 2026 ✓ | ok (3p) |
| bofa | Funding Guidelines | 2026-06-17 | `18W0arwbkG4U36_y0KBP6gCY7NFX8vdyU` | | ok (2p) |
| chase | Program Sheet | 2026-05-10 | `1UZCajZt9a2pvWahnBzcs4K5WraU4IX8m` | May 10, 2026 ✓ | ok (1p) |
| pnc | Program Sheet | 2026-03-16 | `1bWKDBW9sVot4RWU_Shlyxk_w1CWb7Lgw` | March 16, 2026 ✓ | ok (1p) |
| pnc | Funding Guidelines | 2026-03-16 | `1wm-elYRNIu8giTY37o58liJZQeii9-IZ` | | ok (1p) |
| pnc | Proof of Residence | 2026-03-16 | `113xcnne99r6y1pRwU0koYmk1IKedJbq0` | | ok (1p) |
| dfc | Program Sheet | 2025-08-13 | `1VJ5ltQPHIdsv62z8SYOP8C3NXCzNNrvJ` | Aug 13, 2025 ✓ | ok (1p) |
| dfc | Funding Guidelines | 2026-01-01 | `1tjEUJLshnxu5pCEc8RpAObDk7QHqEJuc` | | ok (4p) |
| cps | Program Sheet | 2026-01-01 | `1QkqPCEMlfOvTf2ExbxfNVYMQVEHmAmVq` | January 1, 2026 ✓ | ok (2p) |
| usbank | Program Sheet | 2026-04-01 | `1ffhHRvMuvYytMXS_Rh6gpDr3_gFiRYTY` | April 1, 2026 ✓ | ok (4p) |
| usbank | Program Rules | 2026-04-01 | `1GVzTsNCRy1Dm7gdHEIfzZ3DoYS31EumL` | | ok (3p) |
| usbank | Program Highlights | 2026-04-01 | `1NzDLy0bGvZEFVsw1BCUbHlmlXB6MLG69` | | ok (1p) |
| flagship | Program Sheet | 2026-07-29 | `1yqZG4W6_8CAThHGoJw3_6LfkQyZJUtO5` | "July 2026" ~ | ok (2p) |
| flagship | Funding Guidelines | 2026-07-29 | `10xRDbQvNebRF7J4dMec46kWf1DrCo7wN` | | ok (1p) |
| santander | Program Sheet | 2026-06-01 | `1sIz87MWE15FzQSQPM4N3h8R_h4yxSl2G` | June 1, 2026 ✓ | ok (11p) |

✓ match · ~ app date is month-only, filename is more precise · ≠ mismatch, verify which is right

**Text layer** = `tools/pdf_triage.py` verdict, run over the whole folder on 2026-08-25. `ok` means the page text can be quoted. Anything bold has to be read from a 200 DPI render instead — see §4.

**Mismatches to resolve:** `gls` (the sheet carries no date at all, only the footer `GLS_PG_V53_2026`), `kia` bulletin (07-01 vs 07-07).

**Resolved 2026-08-26 by renaming the file, not the record.** `td` and `dfc` both stated their own dates internally — TD's footer reads `06/30/2026` on every page of the Program Sheet and `PROD-9034 Effective 06.30.2026` on Program Sheet2, DFC's header reads `Revision Date: 8/13/2025`. The records were right and the filenames were wrong, so the two Drive files were renamed to match their documents. Renaming does not change a Drive file ID (§4), so the IDs above are unchanged.

---

## 3. Text-layer triage — full corpus, 2026-08-25

`python3 tools/pdf_triage.py <folder> --out pages --json triage.json`

**39 files · 141 pages · 6 pages (4%) cannot be read from their text layer.**

| Verdict | Files | What it means |
|---|---|---|
| TEXT_OK | 35 | Quote the text layer. Still render to cross-check tables. |
| PARTIAL | 1 | Some of the page is mis-encoded. Render it. |
| IMAGE_ONLY | 3 | The content is a picture. Render it. |
| MOJIBAKE | 0 | — |

The four that need rendering, and what's actually on those pages:

| File | Page(s) | Verdict | What is there | Status |
|---|---|---|---|---|
| `Ally - 84 month Program Sheet` | 1 of 1 | IMAGE_ONLY | The entire 84-month program: $20,000 minimum amount financed, FICO 620 under $100K EDC/AWV and 680 at or above, models through 5 years / 75,000 beginning miles, the tier advance matrix, 1.50% max dealer finance income | **Gap.** None of it is in `index.html`. The audit filed it UNVERIFIABLE |
| `Truist - Program Sheet` | 1, 2, 4 of 4 | PARTIAL | State-by-state GAP rules (SC, IN, OR, TX, NY, CA, CO) and the per-tier maximum-term table. Page 3, the flat reserve scale, is clean | **Gap.** The GAP section is absent from the app; the term table was mis-read (`2023` came out as `20(3`) |
| `AmeriCredit - Program Sheet` | 11 of 11 | IMAGE_ONLY | "Monthly Value Guide by State" — a US map. **Kelley Blue Book** for AZ, CA, CO, HI, ID, MT, NM, NV, OR, UT, WA, WY; **J.D. Power everywhere else, including Texas** | **Already correct in the app.** Verified 2026-08-26 by rendering the page and comparing: `index.html` carries exactly this state list. The 2026-08-25 note calling it a gap was wrong — it was written without checking `index.html` |
| `Westlake - Program Guidelines` | 1 of 6 | IMAGE_ONLY | A logo cover page: "PROGRAM GUIDELINES / JANUARY 2026", footer `v.120925_2` | **Benign.** A true positive for the classifier, nothing to extract. Pages 2–6 carry the program |

Three things this run establishes:

- **An IMAGE_ONLY verdict is not a verdict about the app.** The classifier says a page cannot be read from its text layer. Whether the app already holds that page's content is a separate question, answered only by reading `index.html`. AmeriCredit p11 was filed as a data gap on 2026-08-25 without that second check, and it was not one.
- The corpus is in better shape than the two known failures suggested. 35 of 39 files extract cleanly end to end; the damage is concentrated in 6 pages.
- Per-page beats per-file. Truist page 3 is clean while 1, 2 and 4 are not, and AmeriCredit is 10 clean pages followed by one that is a picture. A file-level verdict would have thrown away good pages or trusted bad ones.

Only `Westlake` p1 was a false positive, and rendering it cost one image. That is the trade the classifier is tuned for.

Re-run the sweep whenever a PDF is added or replaced. The verdicts live in the **Text layer** column of §2.

---

## 4. Rules for this folder

- One lender may have several docs. The manifest above is the authority for which is which.
- New PDF arrives → name it `{Bank} - {Doc Type} - {MMDDYY}.pdf` using the prefix table in §1, drop it in the folder, add a row here. Old file can stay; newest date per doc type wins.
- `source.drive_file_id` in a lender record = the Program Sheet (or Guidelines) file ID, not the Funding Guidelines. If the record pulled from multiple docs, list the extras in `source.notes`.
- The agent reads PDFs from Drive by file ID. It does not scan the folder by name — names are for humans, IDs are for the agent. If you rename a file the ID doesn't change; if you re-upload, it does, so update the row.
