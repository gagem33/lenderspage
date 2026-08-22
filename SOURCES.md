# Lender Hub — SOURCES.md

Manifest of source documents. Maps each lender `id` (DATA.md) to its PDFs in the **LENDERHUB/LENDERHUBSOURCES** Drive folder, with file IDs so the agent can fetch them directly and fill `source.drive_file_id`.

Folder: `LENDERHUB/LENDERHUBSOURCES` — Drive ID `1kf_mJ09Sxfg--PQ-xqOXdkouYUJ8ryz9`
Inventory taken 2026-08-22. 38 PDFs + 1 README. All uploaded 2026-07-29.

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

| id | Doc | date | Drive file ID | App effectiveDate |
|---|---|---|---|---|
| amcredit | Program Sheet | 2026-06-12 | `1BcVmDpbQotQpB93acjWvX2uH3BRcjP37` | June 12, 2026 ✓ |
| exeter | Program Sheet | 2026-06-12 | `1fE1EdXQaWcqwyc_HGpYQs8UrUu0cVJpS` | June 12, 2026 ✓ |
| exeter | Funding Guidelines | 2026-06-12 | `15kVW67-Yhae_s6QvJ7TzmZH_1mq-tGe5` | |
| regional | Program Sheet | 2026-05-27 | `13dk1uBsz8kLhtDIsoRLD-v62w9eMOu04` | May 27, 2026 ✓ |
| regional | Underwriting Guidelines | 2026-05-27 | `1ILGWQes91nVYi89dVD2rjhEmA5OoPeLs` | |
| truist | Program Sheet | 2026-07-20 | `1dwSi3YQ1N7TnbXrQADGRMkaPpWnUMnxz` | July 20, 2026 ✓ |
| td | Program Sheet | 2026-07-01 | `1O9q8uW2FdCawn6uauNxv9xYGPZ8fIEvO` | June 30, 2026 ≠ |
| td | Program Sheet2 | 2026-07-01 | `1X57L74CerUi8vHJ37BujDe00ZhrxEL_D` | |
| wellsfargo | Program Sheet | 2026-06-16 | `1dXg8-YyViTdr9mbWuTlYRjiluVvcXRbo` | June 16, 2026 ✓ |
| ally | Program Sheet | 2026-04-01 | `1rm-zFIrAzSg4cLZ_z-GB4Y5r0fcZoZuE` | April 1, 2026 ✓ |
| ally | 84 month Program Sheet | 2026-04-01 | `1R-6gins9tE5wyy3dqNRUJv6FcaOyXo0Y` | |
| ally | Funding Guidelines | 2026-04-01 | `1Oej_ktEK5rLMxX8GXiUhzTF2wWelSYHm` | |
| fifththird | Program Sheet | 2026-07-23 | `1M5cikg9r9KADCNhRNQQF4w9hzGnc_FoJ` | July 23, 2026 ✓ |
| gls | Program Sheet | 2026-07-27 | `1FosJDBLX8H9vjNf-ZO3jdQAG1ecWBggs` | "2026 (v53)" ≠ |
| gls | Funding Guidelines | 2026-07-27 | `1zmQry9GwX75muumyEBX5jP8qmglbTKzq` | |
| capitalone | Program Sheet | 2026-01-01 | `1iU_bLQVWiuaSeoTZKtUljRYia_9I0Nkl` | "January 2026" ~ |
| capitalone | Funding Guidelines | 2026-01-27 | `1GPPmk175O3xIiJDdnX2EEs2DKDqL2Vnu` | |
| capitalone | Funding Guidelines2 | 2026-01-01 | `1Lkf6Duc11I-Vi3jRiaL6PCgu44Xu6D33` | |
| westlake | Program Sheet | 2026-07-08 | `1KI4qsTOCXRm2tt4kJqOvTFDWKHcl-ESR` | "July 2026" ~ |
| westlake | Prime Program Sheet | 2026-07-08 | `1fwQ1YndmQi0zq9r5WTDTmAy9hhVje6VI` | |
| westlake | Program Guidelines | 2026-01-01 | `1FHLl1NXqFdoIBTnwhWpfInJqUfIS610C` | |
| kia | Standard New - National | 2026-01-06 | `1w-r5QJqPQDMFZT1rBrfAVfSL2qxTosc9` | Jan 6, 2026 ✓ |
| kia | K500&K506 | 2026-07-01 | `1IyXoIz8Pia7vRv4o9I6k44e4D-njRDV8` | "K500/K506 July 7" ≠ (file says 07-01) |
| kia | K500&K506-2 | 2026-07-01 | `1Ur5v1OgYWfrJUkxsZCQqXLVzE2Yq84Xx` | |
| bofa | Program Sheet | 2026-06-18 | `1xbiqM_pi-0XcddGDV5flk9FaSDbmnHYz` | June 18, 2026 ✓ |
| bofa | Funding Guidelines | 2026-06-17 | `18W0arwbkG4U36_y0KBP6gCY7NFX8vdyU` | |
| chase | Program Sheet | 2026-05-10 | `1UZCajZt9a2pvWahnBzcs4K5WraU4IX8m` | May 10, 2026 ✓ |
| pnc | Program Sheet | 2026-03-16 | `1bWKDBW9sVot4RWU_Shlyxk_w1CWb7Lgw` | March 16, 2026 ✓ |
| pnc | Funding Guidelines | 2026-03-16 | `1wm-elYRNIu8giTY37o58liJZQeii9-IZ` | |
| pnc | Proof of Residence | 2026-03-16 | `113xcnne99r6y1pRwU0koYmk1IKedJbq0` | |
| dfc | Program Sheet | 2026-01-01 | `1VJ5ltQPHIdsv62z8SYOP8C3NXCzNNrvJ` | Aug 13, 2025 ≠ |
| dfc | Funding Guidelines | 2026-01-01 | `1tjEUJLshnxu5pCEc8RpAObDk7QHqEJuc` | |
| cps | Program Sheet | 2026-01-01 | `1QkqPCEMlfOvTf2ExbxfNVYMQVEHmAmVq` | January 1, 2026 ✓ |
| usbank | Program Sheet | 2026-04-01 | `1ffhHRvMuvYytMXS_Rh6gpDr3_gFiRYTY` | April 1, 2026 ✓ |
| usbank | Program Rules | 2026-04-01 | `1GVzTsNCRy1Dm7gdHEIfzZ3DoYS31EumL` | |
| usbank | Program Highlights | 2026-04-01 | `1NzDLy0bGvZEFVsw1BCUbHlmlXB6MLG69` | |
| flagship | Program Sheet | 2026-07-29 | `1yqZG4W6_8CAThHGoJw3_6LfkQyZJUtO5` | "July 2026" ~ |
| flagship | Funding Guidelines | 2026-07-29 | `10xRDbQvNebRF7J4dMec46kWf1DrCo7wN` | |
| santander | Program Sheet | 2026-06-01 | `1sIz87MWE15FzQSQPM4N3h8R_h4yxSl2G` | June 1, 2026 ✓ |

✓ match · ~ app date is month-only, filename is more precise · ≠ mismatch, verify which is right

**Mismatches to resolve:** `td` (file 07-01, app 06-30), `gls` (app has a version string, not a date), `kia` bulletin (07-01 vs 07-07), `dfc` (file 01-01-26, app says Aug 2025 — the app is probably stale, not the file).

---

## 3. Rules for this folder

- One lender may have several docs. The manifest above is the authority for which is which.
- New PDF arrives → name it `{Bank} - {Doc Type} - {MMDDYY}.pdf` using the prefix table in §1, drop it in the folder, add a row here. Old file can stay; newest date per doc type wins.
- `source.drive_file_id` in a lender record = the Program Sheet (or Guidelines) file ID, not the Funding Guidelines. If the record pulled from multiple docs, list the extras in `source.notes`.
- The agent reads PDFs from Drive by file ID. It does not scan the folder by name — names are for humans, IDs are for the agent. If you rename a file the ID doesn't change; if you re-upload, it does, so update the row.
