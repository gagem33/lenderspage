# Lender Hub — Southwest Kia Dallas

Internal dealership reference for finance partners. A single static page
covering **20 lenders**: program guidelines, FICO and LTV limits, term and
mileage caps, reserve structures, chargeback windows, and docs/stips — plus six
desking tools.

Built for the desk and the sales floor, not for customers. Nothing here is
public-facing.

---

## What's in it

**Three views**

| View | What it does |
|---|---|
| Compare | All 20 lenders in one table, plus 9 quick lists (84-month terms, 150K+ miles, ITIN accepted, open BK, DACA, first-time buyer, and more) |
| Lender detail | Per-lender program sheet — FICO, LTV, reserve, backend, vehicle rules, docs & stips, plus a program-tracking panel |

**Six tools**, in the header — Income Calculator, Bureau Score Search, LTV
Calculator, Deal Structurer, Side-by-Side Compare, and a 20-Day Calculator.

**Program tracking** — each lender shows when its guidelines were last verified
and flags anything over 90 days stale. Logging a verification or a note needs
the team PIN.

---

## Running it

There is **no build step, no bundler, no package manager, and no test suite.**

```sh
open index.html
```

That's the whole workflow. `index.html` is self-contained — HTML, all CSS, and
all JavaScript inline. Its only external dependencies are Google Fonts and the
Supabase JS client, both from CDNs, so it needs a network connection but no
local tooling.

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

`gagem33/lenderspage` is a **public** repo. Nothing here is customer data, but
it does mean the Supabase project URL and publishable key at
`index.html:2439-2440` are readable by anyone — which matters given the findings
in [`docs/supabase-contract.md`](docs/supabase-contract.md) section 1. Treat
everything committed here as published.

## Repository layout

```
index.html                  The entire application (~2,600 lines)
CLAUDE.md                   Architecture, LENDERS[] schema, how to add a lender
docs/supabase-contract.md   The six backend RPCs, verified — and two security findings
.gitignore
```

Four files. That is the whole repository.

`app.js`, `style.css`, and `base.css` were deleted in `db25883` — they were an
incompatible earlier generation of the app that nothing loaded. Revert that
commit if you need them back.

---

## Backend

Three Supabase RPCs back the program-tracking panel: `lender_get_updates`,
`lender_mark_verified` and `lender_add_note`. All access is by RPC — the tables
themselves are closed to anonymous callers.

The SQL applied on 2026-08-24 is in [`supabase/migrations/`](supabase/migrations).
Everything older still lives only in the Supabase dashboard.

See [`docs/supabase-contract.md`](docs/supabase-contract.md) for the full
contract.

> The two critical security findings that document used to carry — a plaintext,
> world-readable PIN and two anonymously writable tables — were **fixed on
> 2026-08-24**. Section 1 has the detail. One item is still open there:
> rotating the PIN, whose value was exposed for the life of the project.

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
