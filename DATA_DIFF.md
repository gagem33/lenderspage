# DATA_DIFF — 2026-09-03

Audit of `lenders.json` against Drive PDFs in `LENDERHUB/LENDERHUBSOURCES`
(`1kf_mJ09Sxfg--PQ-xqOXdkouYUJ8ryz9`). Recounted 2026-09-03: **40 PDFs**.

Rule: do not invent program numbers. Where a number could not be verified from
a rendered page in this pass, the existing value stays and this file says so.

Drive IDs below are the authority documents named in `SOURCES.md`.

---

## Production fix — Kia September applied (this PR)

Live `lender-hub.vercel.app` was already serving the merged HUD from PR #29
(`37d503c`, last-modified 2026-09-03 15:13 UTC). The visible failure was the
Kia chip: it still said **“August tables (Sept pending)”** and the stored
grids were 2026-104/105.

September rates are now the user-facing Kia view. Authority:

| Doc | Bulletin | Drive ID | Window |
|---|---|---|---|
| `KIA - K500&K506 - SEPT2.pdf` | **2026-128** | `1jk6sU4E93VENTOA83bak8wigOFYCrFg1` | Contracts **Sep 1–30, 2026**. Funded by **Oct 14, 2026**. Internal only. |
| `KIA - K500&K506 - SEPT.pdf` | **2026-129** | `1tRHuY42SIYFzP-DaxCQNxY2VaDL2-Kay` | Same window. Prior-MY / K4 / Sportage Hybrid companion. |

Verified facts applied as printed (and confirmed on 300 dpi renders of
Carnival p1, Sorento p6, Sportage p8 of SEPT2):

- K500 tiers: T1/T2 720+; T3 700–719; T4 680–699; T5 660–679; T6 640–659; T7 620–639; T8 580–619
- K506 tiers: T1 740+; T2 720–739; T3 700–719; T4 680–699; T5 660–679; T6 640–659; T7 620–639; T8 580–619
- Term buckets: 24–48, 49–60, 61–66, 67–72, 73–84. **K506 73–84 is N/A on every extracted 506 table.** K500 73–84 is live on T1/2 only (text-layer `0.00%` on T3–8 is grey / not offered).
- K500 reserve: markup N/A; flat up to $200 (T1–3) or $150 (T4–8). Flats: T1–3 Premier $200 / VIP $150 / Partner $100; T4–8 Premier $150 / VIP $100 / Partner $50. **No flat below FICO 620.**
- K506 reserve: markup 1% or flat up to $450. T8 prints markup only (no flat).

APR cells were taken from `find_tables()` in document order, then 73–84 was
forced to a dash except K500 T1/2, matching the render. A `0.00%` outside
73–84 is a real APR (Sorento / Sorento Hybrid / Sportage MY2026 / Sportage
Hybrid MY2026, K500 T1/2 24–48). LTV ladder, backend, and every other
lender’s program numbers were not edited.

| Lender | Field | Site value before | Changed to |
|---|---|---|---|
| kia | `effectiveDate` | `Jan 6, 2026 · K500/K506 Sept 1, 2026` | `Jan 6, 2026 · K500/K506 Sep 1–30, 2026` |
| kia | `source.warning` | August-tables-pending text | **deleted** |
| kia | `sections.incentives.label` | `KFA Incentives — August tables (Sept pending)` | `KFA Incentives — Sep 1–30, 2026` |
| kia | `sections.incentives.content` | August 2026-104/105 grids + pending banner | September 2026-128/129 grids + verified badge (Drive IDs, Sep 1–30, fund Oct 14) |
| kia | Carnival MY2027 K500 T5 24–48 (example) | `9.00%` (August) | `9.50%` (2026-128 p1) |
| kia | Carnival MY2027 K500 T8 24–48 | `11.00%` | `11.25%` |
| kia | Sportage Hybrid MY2027 K500 T1/2 24–48 | `1.99%` (August 104) | `0.90%` (2026-129 p6) |

No LTV, GAP, term, mileage, or other-lender value was invented or changed.

---

## Earlier the same day (PR #29, already on main)

## Changed in PR #29

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

## Kia September extraction — done 2026-09-03

Rendered Carnival / Sorento / Sportage at 300 dpi. 73–84 is N/A except K500
T1/2. Real `0.00%` APRs on K500 T1/2 24–48 kept as rates. See the production
fix section at the top.
