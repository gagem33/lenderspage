# DATA_DIFF — 2026-09-03

Audit of `lenders.json` against Drive PDFs in `LENDERHUB/LENDERHUBSOURCES`
(`1kf_mJ09Sxfg--PQ-xqOXdkouYUJ8ryz9`). Recounted 2026-09-03: **40 PDFs**.

Rule: do not invent program numbers. Where a number could not be verified from
a rendered page in this pass, the existing value stays and this file says so.

Drive IDs below are the authority documents named in `SOURCES.md`.

---

## Changed in this PR

| Lender | Field | Site value before | Source PDF | Changed to | Why |
|---|---|---|---|---|---|
| gls | `effectiveDate` | `2026 (v53)` | `1FosJDBLX8H9vjNf-ZO3jdQAG1ecWBggs` — `Global - Program Sheet - 072726.pdf` | `July 27, 2026 (v53)` | Filename date is the authority. The sheet itself still only carries the footer `GLS_PG_V53_2026`. Version kept in the label. |
| gls | `source.date` | `null` (status `acknowledged`) | same | `2026-07-27` | Same. Dropped from `sync/acknowledged.json`. |
| kia | `effectiveDate` | `Jan 6, 2026 · K500/K506 Aug 4, 2026` | `1jk6sU4E93VENTOA83bak8wigOFYCrFg1` — `KIA - K500&K506 - SEPT2.pdf` (bulletin **2026-128**). Companion `1tRHuY42SIYFzP-DaxCQNxY2VaDL2-Kay` (**2026-129**). Both: contracts Sep 1–30 2026, funded by Oct 14. | `Jan 6, 2026 · K500/K506 Sept 1, 2026` | Date label only. **Rate tables not changed.** |
| kia | `source` | date `2026-08-04`, file `1erRPv4bOVTOpw5SdyjcOsX-3k3TanEJO` (gone from Drive) | SEPT2 above | date `2026-09-01`, file `1jk6sU4E93VENTOA83bak8wigOFYCrFg1`, plus `source.warning` | August/July K500 IDs are dead. Freshness now points at the live bulletin. Warning states the stored rates are still August. |
| kia | `sections.incentives` banner / header | “Current · Aug 4–31 / fund Sep 14 · 2026-104/105” | same September PDFs | Banner now says September is on file and the **tables are still August, pending extraction** | No cell in any rate table was edited. |
| — | `SOURCES.md` | listed dead July IDs `1IyXoIz8Pia7vRv4o9I6k44e4D-njRDV8`, `1Ur5v1OgYWfrJUkxsZCQqXLVzE2Yq84Xx` and August IDs `1erRPv4bOVTOpw5SdyjcOsX-3k3TanEJO`, `18JxCf14InKJ2pghApWzOcvf9K_Gn-XQN` | Drive listing 2026-09-03 | those four IDs removed; SEPT / SEPT2 / Back-End Advance added | Dead IDs must not stay. Back-End Advance `1Azn5vC-Ul7GJJtreLHGBfzPmA4ZdahC4` was already in the manifest and is still live. |

---

## Date mismatches named in the brief — verdict

| Lender | Claimed mismatch | Verdict | Changed? |
|---|---|---|---|
| td | file `2026-07-01` vs app `June 30, 2026` | **App is right.** Both live files are named `063026`. TD Program Sheet `1O9q8uW2FdCawn6uauNxv9xYGPZ8fIEvO` and Program Sheet2 `1X57L74CerUi8vHJ37BujDe00ZhrxEL_D` print `06/30/2026` / `PROD-9034 Effective 06.30.2026`. The 07-01 filename was a 2026-08-26 naming error, already renamed. | No |
| gls | app `2026 (v53)` vs file `2026-07-27` | Filename is the authority. Sheet has no calendar date, only `GLS_PG_V53_2026`. | Yes — date label only |
| kia | app `K500/K506 July 7` vs old file `07-01`; new files are September | App was already on August 2026-104/105. New current files are September **2026-128 / 2026-129**. July and August Drive IDs are gone. | Date + warning only. **Rates left as August.** |
| dfc | app `Aug 13, 2025` vs file `2026-01-01`; Program Sheet modified 2026-08-26 | **App is right, and not stale relative to the program sheet.** Program Sheet `1VJ5ltQPHIdsv62z8SYOP8C3NXCzNNrvJ` is titled `DFC - Program Sheet - 081325.pdf` and prints `Revision Date: 8/13/2025`. The `2026-01-01` file is **Funding Guidelines** (`1tjEUJLshnxu5pCEc8RpAObDk7QHqEJuc`), not authority for the program date (SOURCES.md §1). Drive `modifiedTime` 2026-08-26 is the rename, not a new sheet. The sheet is 386 days old as of 2026-09-03 — that is real age, not a wrong date. | No |

---

## Program numbers — not changed

No LTV, term, mileage, GAP, fee, income, FICO floor, reserve, or Kia APR cell
was edited. Kia September rates are visible in the Drive text-layer snippet
but EXTRACTION_GUIDE §9 forbids taking a bulletin grid from the text layer
(the 73–84 `0.00%` / `#N/A` trap). Waiting on the follow-up extraction.

| Lender | Fields checked at the label/date layer | Source PDF | Program values |
|---|---|---|---|
| amcredit | `effectiveDate` June 12, 2026 matches `1BcVmDpbQotQpB93acjWvX2uH3BRcjP37` | left as stored |
| exeter | June 12, 2026 · `1fE1EdXQaWcqwyc_HGpYQs8UrUu0cVJpS` | left as stored |
| regional | May 27, 2026 · `13dk1uBsz8kLhtDIsoRLD-v62w9eMOu04` | left as stored |
| truist | July 20, 2026 · `1dwSi3YQ1N7TnbXrQADGRMkaPpWnUMnxz` | left as stored |
| td | June 30, 2026 · `1O9q8uW2FdCawn6uauNxv9xYGPZ8fIEvO` + `1X57L74CerUi8vHJ37BujDe00ZhrxEL_D` | left as stored |
| wellsfargo | June 16, 2026 · `1dXg8-YyViTdr9mbWuTlYRjiluVvcXRbo` | left as stored |
| ally | April 1, 2026 · `1rm-zFIrAzSg4cLZ_z-GB4Y5r0fcZoZuE` (core); 84-mo sheet `1R-6gins9tE5wyy3dqNRUJv6FcaOyXo0Y` | left as stored |
| fifththird | July 23, 2026 · `1M5cikg9r9KADCNhRNQQF4w9hzGnc_FoJ` | left as stored |
| gls | see above — **date only** | program values left as stored |
| capitalone | January 2026 · `1iU_bLQVWiuaSeoTZKtUljRYia_9I0Nkl` | left as stored |
| westlake | July 2026 · Prime `1fwQ1YndmQi0zq9r5WTDTmAy9hhVje6VI` / Independent `1KI4qsTOCXRm2tt4kJqOvTFDWKHcl-ESR` | left as stored (LTV still untyped — see CLAUDE.md open questions) |
| kia | see above — **date + warning only** | LTV ladder, backend, and all APR cells left as stored |
| bofa | June 18, 2026 · `1xbiqM_pi-0XcddGDV5flk9FaSDbmnHYz` | left as stored |
| chase | May 10, 2026 · `1UZCajZt9a2pvWahnBzcs4K5WraU4IX8m` | left as stored |
| pnc | March 16, 2026 · `1bWKDBW9sVot4RWU_Shlyxk_w1CWb7Lgw` | left as stored |
| dfc | August 13, 2025 · `1VJ5ltQPHIdsv62z8SYOP8C3NXCzNNrvJ` | left as stored |
| cps | January 1, 2026 · `1QkqPCEMlfOvTf2ExbxfNVYMQVEHmAmVq` | left as stored |
| usbank | April 1, 2026 · `1ffhHRvMuvYytMXS_Rh6gpDr3_gFiRYTY` | left as stored |
| flagship | July 2026 · `1yqZG4W6_8CAThHGoJw3_6LfkQyZJUtO5` | left as stored |
| santander | June 1, 2026 · `1sIz87MWE15FzQSQPM4N3h8R_h4yxSl2G` | left as stored |

---

## Already gone before this PR (not re-added)

- Sales Pace (`view-pace`, `sp_*`) — removed 2026-08-24. `app.js` / `base.css` / `style.css` are not in the repo.
- Mark Verified / Add Note / PIN panel — removed 2026-08-25 on Gage’s call. Spec #4 replaced it. Not restored.
- Sidebar + giant compare table — removed 2026-08-27. Compare lives as the side-by-side tool.

---

## Waiting on the Kia September extraction follow-up

Do not treat the Drive OCR snippet as the rate grid. Known traps on these
bulletins (same as August): 73–84 shows `0.00%` / `#N/A` on tiers that do not
offer the term; a real `0.00%` APR exists on some K500 24–48 cells. Render,
then extract.
