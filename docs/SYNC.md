# Lender Hub — SYNC.md

How a new bank PDF becomes a live change on the site.

Read `EXTRACTION_GUIDE.md` first for how to read a PDF. This file is the mechanics
around it: what the tool does, what it refuses to do, and what only Gage can do.

---

## 1. What is automatic and what is not

**Nothing watches the Drive folder.** Dropping a PDF in it changes nothing. The
sync runs when Gage says "sync" — monthly, or any time (spec #2).

| Step | Who |
|---|---|
| Bank posts a new sheet | the bank |
| Save the PDF into `LENDERHUB/LENDERHUBSOURCES`, named `{Bank} - {Doc Type} - {MMDDYY}.pdf` | **Gage** |
| Ask for a sync | **Gage** |
| List the folder, spot what's new | agent + `sync.py scan` |
| Download, triage, render, read the pages | agent + `pdf_triage.py` |
| Write a proposal: field, old, new, page, verbatim quote | agent |
| Show the diff | `sync.py diff` |
| **Approve or reject each field** | **Gage** |
| Write `lenders.json`, log the change | `sync.py apply` |
| Commit, push, Vercel redeploys | agent |

The only automatic stretch is the last one: once `lenders.json` is committed the
site updates itself in about a minute.

---

## 2. The three refusals

`apply` is the gate, and it is enforced in code rather than by good intentions.
It refuses to write when:

1. **Any change is still undecided.** `approved: null` on even one field stops the
   whole proposal. There is no "apply the obvious ones" path.
2. **A change's `old` no longer matches `lenders.json`.** This means the proposal
   was built against a stale copy — the diff Gage read is not the diff that would
   be written. Re-extract.
3. **A change has no page number or no verbatim quote.** `EXTRACTION_GUIDE` §6:
   "If you can't quote it, you didn't find it."

A rejected field is never written, and the rejection is recorded in the ledger.

---

## 3. Commands

```bash
# What changed in Drive, and which lenders look stale.
python3 tools/sync.py scan --listing drive.json

# Remember the current Drive state so the next scan is a diff.
python3 tools/sync.py snapshot --listing drive.json

# Decode a downloaded PDF onto disk (never committed — see .gitignore).
python3 tools/sync.py ingest --result <drive-download-result> --out sync/pdfs

# Read it. The image is the authority, not the text layer.
python3 tools/pdf_triage.py "sync/pdfs/FILE.pdf" --render --dpi 300 --out sync/pages

# Start a proposal, then fill in `changes` from what the pages say.
python3 tools/sync.py new chase --doc "Program Sheet"

# Review.
python3 tools/sync.py diff sync/proposals/chase-2026-08-26.json

# Decide. Indices come from the diff output.
python3 tools/sync.py approve sync/proposals/chase-2026-08-26.json --all
python3 tools/sync.py approve sync/proposals/chase-2026-08-26.json --fields 0,2 --reject 1

# Write it.
python3 tools/sync.py apply sync/proposals/chase-2026-08-26.json --dry-run
python3 tools/sync.py apply sync/proposals/chase-2026-08-26.json

# Last step, every time: refresh what the page shows about document age.
python3 tools/sync.py freshness --dry-run
python3 tools/sync.py freshness
```

Run `freshness` after any apply, and after any Drive change. It rewrites each
lender's `source` block — the ISO date its `effectiveDate` resolves to, the
document that date came from, its Drive ID, and today as `syncedAt`. The page
turns that into the age badge; green under 90 days, amber past 90, red past a
year. It stores the date and not the age, so the badge is right tomorrow too.

It preserves an existing `source.warning` rather than recomputing it. A warning
says the document is current but its *contents* are not, which no date can
express — Kia is the live case. Set one through a proposal like any other value,
and delete it by hand when it stops being true.

`drive.json` is whatever the agent's Drive tool returns for
`parentId = '1kf_mJ09Sxfg--PQ-xqOXdkouYUJ8ryz9'`. The scan also accepts the
committed snapshot if no listing is given.

---

## 4. What `scan` tells you

Three questions at once.

**Did anything land in Drive?** `NEW` and `CHANGED` compare against
`sync/drive-snapshot.json`. `IN DRIVE, NOT IN SOURCES.md` means a file arrived
without a manifest row. `IN SOURCES.md, NOT IN DRIVE` usually means a re-upload —
Drive issues a new ID, so the manifest row needs updating (`SOURCES.md` §4).

**Is a lender showing an old date?** It compares the newest *authority* document
per lender against `effectiveDate`. Funding Guidelines and Proof of Residence are
excluded on purpose: `SOURCES.md` §1 says they cover stips and residency only, and
counting them made three lenders look stale that were not.

**Has someone already looked at it?** Divergences listed in
`sync/acknowledged.json` print as `ack` instead of `STALE`. Today that hides
`td`, `gls`, `kia` and `dfc`, all settled on 2026-08-26. **Delete a lender's entry
when a new PDF arrives for it** — the question genuinely reopens.

Statuses: `ok` · `month-only` (app stores "July 2026", file is more precise —
agreement, not staleness) · `STALE` · `AHEAD` (app claims a newer date than any
source document) · `UNDATED` · `NO PDF` · `ack`.

---

## 5. Proposal format

```json
{
  "schema": "lenderhub.proposal.v1",
  "lender_id": "chase",
  "created": "2026-08-26",
  "sources": [{
    "drive_file_id": "1UZCajZt9a2pvWahnBzcs4K5WraU4IX8m",
    "title": "Chase - Program Sheet - 051026.pdf",
    "doc_type": "Program Sheet",
    "effective_date": "2026-05-10"
  }],
  "changes": [{
    "path": ["sections", "backend", "content"],
    "old": "…exact current value…",
    "new": "…proposed value…",
    "page": 1,
    "quote": "MSRP is less than (or equal to) $12,000: 35% of MSRP",
    "note": "why this changed",
    "approved": null
  }],
  "not_in_source": ["ficoMin"],
  "ambiguities": [{"field": "bureaus.note", "note": "needs Gage's call"}]
}
```

`path` addresses any depth — `["maxLTV"]` or `["sections","ltv","content"]`.
`approved` is `null` (undecided), `true` or `false`.

Proposals are committed. Together with `sync/applied.jsonl` and git history they
are the audit trail: what was proposed, what was approved, what was rejected, and
which PDF page each value came from.

---

## 6. Long values diff by content

Most real program data lives in `sections.*.content` as an HTML blob. Truncating
two 1,000-character blobs to one line shows two identical lines and hides the
change, which makes approval theatre. For long strings the diff strips the markup
and compares row by row, so what shows up is the rows that moved:

```
      @@ -1,3 +1,5 @@
       Aftermarket / VPP — New (MSRP >$12K) Greater of $4,500 or 20% of MSRP
      +Aftermarket / VPP — New (MSRP ≤$12K) 35% of MSRP
```

---

## 7. What this does not do

- **No schema change.** Proposals write v1 records exactly as they are today. The
  typed v2 schema in `DATA.md` §2 is still unbuilt, and the sync does not depend
  on it.
- **No provenance inside `lenders.json`.** Per-field source and verified-date would
  be a data model change, and `CLAUDE.md` says ask first. Provenance lives beside
  the data — in the proposal and the ledger — until that conversation happens.
- **No rate sheets.** `EXTRACTION_GUIDE` §8; the schema has nowhere to put them.
- **No unattended runs.** The extraction step is an agent reading rendered pages.
  It cannot be a cron job, and the approval gate means it should not be one.
