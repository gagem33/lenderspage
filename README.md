# Lender Hub — Southwest Kia Dallas

Internal dealership reference for finance partners. A single static page
covering **20 lenders**: program guidelines, FICO and LTV limits, term and
mileage caps, reserve structures, chargeback windows, and docs/stips — plus six
desking tools.

Built for the desk and the sales floor, not for customers. Nothing here is
public-facing.

---

## What's in it

**One view**

A search-first Desk Scan: type a deal (FICO / term / new-used / miles / LTV)
and the field drops banks that fail a hard published limit. Open a lender for
a constraint scan, then chips for every program section. Quick lists sit below.

**Six tools**, in the header — Income Calculator, Bureau Score Search, LTV
Calculator, Deal Structurer, Side-by-Side Compare, and a 20-Day Calculator.

**Freshness** comes from the source PDF date, not a button. Green under 90 days,
amber past 90, red past a year. Kia currently warns that September bulletins
are on file and the stored rates are still August.

---

## Running it

There is **no build step, no bundler, no package manager, and no test suite.**

```sh
open index.html
```

That's the whole workflow. `index.html` is self-contained — HTML, all CSS, and
all JavaScript inline. Its only external dependency is Google Fonts, so it needs
a network connection for the typeface and nothing else. No local tooling, no
build, no API.

Verification means opening the file in a browser and clicking through. There is
nothing to run and nothing to install.

> **Before editing anything, read [`CLAUDE.md`](CLAUDE.md).** It documents the
> data schema, the three-step process for adding a lender, and several ways the
> file fails quietly rather than loudly.

---

## Deploying

Static hosting on **Vercel**. The whole site is one HTML file, so there is no
build — Vercel just serves it.

| | |
|---|---|
| Project | `lender-hub` (team *Gage's projects*, hobby plan) |
| Production URL | **https://lender-hub.vercel.app** |
| Dashboard | https://vercel.com/gages-projects-e4fe3de8/lender-hub |
| Framework preset | none — served as static files |
| Git integration | linked to `gagem33/lenderspage` |
| Production branch | `main` |
| Deploy trigger | **automatic on push to `main`** |

Pushing to `main` deploys to production. There is no manual promote step and no
staging environment.

Two additional aliases point at the same deployment:
`lender-hub-gages-projects-e4fe3de8.vercel.app` and
`lender-hub-git-main-gages-projects-e4fe3de8.vercel.app` (the branch alias,
which always tracks the tip of `main`).

Pushing any other branch produces a **preview deployment** at its own URL —
useful for reviewing a change before it reaches the floor.

No `vercel.json` is tracked, so all of the above is configured in the Vercel
dashboard rather than in version control. `.gitignore` excludes `.vercel`.

### The GitHub repository is public

`gagem33/lenderspage` is a **public** repo. Nothing here is customer data, and
since the backend was removed on 2026-08-25 there are no keys or secrets in the
page either. Lender program terms are the sensitive part — they are the banks'
material, so treat everything committed here as published.

## Repository layout

```
index.html                  The entire application (~2,600 lines)
CLAUDE.md                   Architecture, LENDERS[] schema, how to add a lender
docs/supabase-contract.md   Obsolete — what the backend was, and why it's gone
.gitignore
```

Four files. That is the whole repository.

`app.js`, `style.css`, and `base.css` were deleted in `db25883` — they were an
incompatible earlier generation of the app that nothing loaded. Revert that
commit if you need them back.

---

## Backend

**There isn't one.** As of 2026-08-25 this is a pure static page — no database,
no auth, no API. The only network request it makes is Google Fonts.

It used to have a Supabase backend for a sales tracker and a lender
update-tracking panel. Both features were removed, and the database was emptied
along with them. The migrations that did it are in
[`supabase/migrations/`](supabase/migrations); the history is in
[`docs/supabase-contract.md`](docs/supabase-contract.md).

Lender data lives in `lenders.json`, fetched at boot. Keeping it current
is a Drive sync through `tools/sync.py` — see `docs/SYNC.md` and `CLAUDE.md`.

---

## Keeping the data current

Lender guidelines change constantly, and the whole point of this page is being
right on the desk. Each lender carries an `effectiveDate` from its source
program sheet, and the tracker flags anything unverified for more than 90 days.

**TODO — the review process is undefined.** None of the following is written
down anywhere:

- **How often** should lender programs be re-checked against current rate
  sheets? The 90-day flag is a default nobody chose deliberately.
- **Who owns** the review — one person, or each desk manager for their lenders?
- **What counts as verified** — reading the current program sheet, or
  confirming with the rep?
- **Where do source documents live?** `docTitle` names them but nothing links
  to them.
- **What happens when a program changes mid-cycle** — who updates the page, and
  how fast?

This matters more than the usual doc-debt: wrong LTV, GAP, or chargeback figures
get quoted to customers and structured into deals. Worth settling deliberately
rather than by habit.
