# CLAUDE.md

Guidance for Claude Code (and humans) working in this repository.

---

## 1. The architecture rule — read this first

**`index.html` IS the application.** It is a single self-contained file: HTML,
all CSS, and all JavaScript inline. There is no build step, no bundler, no
package manager, no test suite.

**`app.js`, `style.css`, and `base.css` are DEAD. Never edit them.**

They are not loaded by anything. `index.html` links exactly two external
resources — Google Fonts and the Supabase JS client from jsDelivr — and zero
local files. Editing the dead files produces no effect in the running app,
and the mistake is invisible until someone notices the change never shipped.

How to re-verify in one command:

```sh
grep -oE 'src="[^"]*"|href="[^"]*"' index.html
```

If that output contains no local paths, the rule still holds.

These files are a superseded generation of the app, last touched 2026-03-18
while `index.html` continued to 2026-07-29. They are incompatible with the
current app, not merely stale:

| | `app.js` / `style.css` / `base.css` | `index.html` |
|---|---|---|
| CSS tokens | `--color-bg`, `--color-accent` | `--bg`, `--gold` |
| Palette | Navy + amber | Green + cream, dual-theme |
| Lenders | 17 | 20 |
| Lender colors | 17 `.lc-*` classes | 20 `.lc-*` classes |

`style.css` makes 196 `var(--color-*)` references and `index.html` defines none
of those variables, so wiring it back in would render the app unstyled.

> **If these files still exist in your working tree,** the deletion commit has
> not landed yet. Treat them as read-only regardless.

---

## 2. Section map of `index.html`

The file is ~2,631 lines with three languages interleaved. Line numbers drift
as the file is edited — re-derive with the grep in each row rather than
trusting the number after a large change.

| Lines | Contents | Re-find with |
|---|---|---|
| 1–11 | `<head>`, Google Fonts, inline SVG favicon | `grep -n '<head>' index.html` |
| 12–888 | **Inline CSS** — design tokens, dark + `[data-theme="light"]` palettes, layout, components | `grep -n '<style>' index.html` |
| ~778–797 | The 20 `.lc-*` lender brand-color classes | `grep -n '\.lc-' index.html` |
| 890–1282 | **HTML body** — header, sidebar, 3 views, 6 tool modals | `grep -n '<body>' index.html` |
| 1283 | Supabase JS v2 via CDN — the only external script | `grep -n 'supabase-js' index.html` |
| 1284–2629 | **Inline JS** (all rows below are inside this block) | `grep -n '</style>' index.html` |
| 1288–1736 | `LENDERS[]` — the 20-lender dataset. ~65% of the file. | `grep -n 'const LENDERS' index.html` |
| 1737–1750 | Utilities (`$`, `$$`, `fmt`, `segClass`, `segBadge`, `dotColor`) + theme | `grep -n '─── UTILITIES' index.html` |
| 1753–1830 | Sidebar builder, compare table, `QUICK_LISTS` | `grep -n '─── QUICK LISTS' index.html` |
| 1832–1893 | `buildLenderDetail()` — hero, stat grid, collapsible sections | `grep -n 'function buildLenderDetail' index.html` |
| 1894–2001 | Lender update tracking (Supabase-backed; `LU_STALE_DAYS = 90`) | `grep -n '─── LENDER UPDATE TRACKING' index.html` |
| 2002–2178 | Navigation, search, mobile sidebar, segment filters, `init()` | `grep -n '─── NAVIGATION' index.html` |
| 2179–2437 | The 6 tools + KFA tab delegation | `grep -n '─── MODAL HELPERS' index.html` |
| 2438–2629 | Sales Pace Tracker (PIN gate, MTD stats, projections, 45s poll) | `grep -n '─── SALES PACE TRACKER' index.html` |

The `// ─── SECTION ───` banner comments are the reliable landmarks. Keep them
when editing, and add one for any new top-level feature.

### The three views

`showView(name, lenderId)` swaps `.active` between:

- `#view-compare` — landing page: all-lender comparison table + quick lists
- `#view-lender` — per-lender detail, rendered into by `buildLenderDetail()`
- `#view-pace` — Sales Pace Tracker, PIN-gated, Supabase-backed

---

## 3. The `LENDERS[]` schema

One array of 20 objects at `index.html:1288`. Everything else — sidebar,
compare table, quick lists, detail pages, and all six tools — derives from it.
Adding a field here can surface it in several places at once.

### Top-level fields

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Stable key. Used in URLs, `QUICK_LISTS.ids`, and all Supabase RPC calls. **Renaming one silently breaks saved lender-update rows.** |
| `name` | `string` | Short display name (sidebar, compare table) |
| `fullName` | `string` | Long name (detail hero) |
| `abbr` | `string` | 2–4 chars, shown in the colored icon tile |
| `colorClass` | `string` | Must match a `.lc-*` class in the inline CSS — see §4 |
| `docTitle` | `string` | Source document name |
| `effectiveDate` | `string` | Human-readable date, e.g. `'June 12, 2026'`. **Free text, not parsed** — no format enforcement anywhere. |
| `segment` | `'prime'\|'near'\|'sub'\|'deep'` | Drives color coding and sidebar filters |
| `segmentLabel` | `string` | Display form of `segment` |
| `ficoMin` | `number \| null` | See quirks below |
| `ficoNotes` | `string` | Always rendered as a note box on the detail page |
| `maxTerm` | `number \| null` | Months. See quirks. |
| `maxMileage` | `string` | e.g. `'100,000 mi'` — parsed by `miNum()` |
| `maxLTV` | `string` | e.g. `'135%'` — parsed by `pctNum()` |
| `gapMax` | `string` | e.g. `'$1,500'` |
| `reserveStructure` | `string` | Summary line |
| `chargebackWindow` | `string` | See quirks — one magic value |
| `uniqueFeature` | `string` | Rendered as a highlighted "Notable" box |
| `idReq`, `por`, `poi` | `string` | Merged into one synthetic "Docs & Stips" section at render time |
| `bureaus` | `object` | `{ primary: string[], note: string, stateMap?: object }` |
| `stateRestriction` | `string?` | Optional. Present on 2 lenders (`'Texas Only'`). Renders a red chip. |
| `sections` | `object` | See below |

### `sections` — the detail-page body

An **object**, not an array. Each value is `{ icon, label, content }` where
`content` is a **raw HTML string** injected via `innerHTML`.

Observed keys and how many of the 20 lenders have each:

`fico` (20) · `backend` (19) · `ltv` (18) · `reserve` (18) · `id` (16) ·
`vehicles` (16) · `income` (13)

Kia and Santander have no `ltv` or `reserve` section.

### Typing quirks — the things that will bite you

1. **`sections` keys are decorative.** Rendering uses
   `Object.values(lender.sections)`, so key names never appear in the UI —
   only the `label` does. **Display order is JS object insertion order.** To
   reorder sections you must physically reorder the keys in the source. Two
   lenders can use the same key for differently-labeled content and nothing
   complains.

2. **`ficoMin` is `number | null`,** never a string. `null` means tier-based
   underwriting and renders as `N/A` in the stat grid. `buildLenderDetail()`
   guards with `typeof lender.ficoMin === 'number'` and falls back to the chip
   `"FICO Tier-Based"`. Observed values: `400, 500, 520, 580, 620, 640, 650,
   675, 680, null`.

3. **`maxTerm` is `number | null`.** `null` renders as `"Term per Buy Program"`
   in the chip and `"Per Prog."` in the stat grid. Note `QUICK_LISTS` tests
   `l.maxTerm >= 84`, which is safely `false` for `null`.

4. **`chargebackWindow` has one magic string:** the exact value
   `'NO CHARGEBACKS'` is compared with `===` and renders as `✓ None`. Every
   other value is **truncated to 16 characters** in the stat grid
   (`.substring(0, 16)`), so longer text is silently cut. Prose values in use
   range from `'N/A'` to `'Flat cancel: charged if no payment within 20 days'`.

5. **Numbers live inside strings.** `maxLTV` and `maxMileage` are parsed with
   regex helpers that strip all non-digits (`pctNum`, `miNum`). `'135%'` → `135`.
   A malformed string degrades to `0` rather than throwing, so a typo becomes a
   lender quietly missing from quick lists instead of an error.

6. **`content` is unescaped HTML.** `sections[].content` is interpolated
   straight into a template literal and assigned to `innerHTML`. This data is
   hand-authored and trusted, but never populate it from user input or an API
   response. (User-supplied lender *notes* are separate and correctly escaped
   via `escapeHtml()`.)

---

## 4. How to add a lender — three steps, not one

All three are required. Missing any one fails quietly rather than loudly.

**Step 1 — add the data object** to `LENDERS[]` (`index.html:1288`).
Copy the nearest existing lender of the same `segment` and edit; the shape is
easier to match than to reconstruct. The sidebar, compare table, and all six
tools pick it up automatically.

**Step 2 — add the brand color class** to the inline CSS, near line 778,
matching the `colorClass` you set in step 1:

```css
.lc-newlender { background: linear-gradient(135deg,#123456,#234567); }
```

Skip this and the icon tile renders with no background — legible, easy to miss
in review, and it will reach production.

**Step 3 — update `QUICK_LISTS`** (`index.html:1786`) if the lender qualifies
for any hardcoded list.

**5 of the 9 quick lists use hand-maintained `ids:[...]` arrays** rather than a
computed `test`, because the criteria aren't derivable from the schema:

| Quick list | Selection |
|---|---|
| 84-Month Terms | computed — `test` |
| Advance Over 130% LTV | computed — `test` |
| 150K+ Miles OK | computed — `test` |
| No Hard FICO Floor | computed — `test` |
| ID Card OK — No DL Required | **hardcoded `ids`** |
| ITIN Accepted | **hardcoded `ids`** |
| Open Bankruptcy OK | **hardcoded `ids`** |
| DACA / Non-Permanent Residents | **hardcoded `ids`** |
| First-Time Buyer Friendly | **hardcoded `ids`** |

A new lender is invisible to those five until its `id` is added by hand.

**Also check the `note` strings.** Several quick lists carry prose that
restates the data — e.g. *"Capital One leads at 175%"* and a note naming the
lenders that require a driver's license. These do not update themselves and
will contradict the table if you don't edit them.

### Removing or renaming a lender

`id` is the join key for Supabase lender-update rows (see
`docs/supabase-contract.md`). Changing an `id` orphans that lender's stored
verification date and notes with no error and no migration path. Prefer
editing a lender in place over remove-and-re-add.

---

## 5. Backend

Six Supabase RPCs back the lender update tracker and the Sales Pace Tracker.
**None of their server-side SQL lives in this repo** — it exists only in the
Supabase dashboard.

Full call/return documentation, plus the open questions that can't be answered
from this codebase, are in **[`docs/supabase-contract.md`](docs/supabase-contract.md)**.

Read that before changing anything that touches `spClient`, `luLoad()`, or any
`.rpc(...)` call.

### Auth model — know this before touching it

Both features gate on a shared PIN held in `sessionStorage` and passed as an
ordinary RPC argument (`p_pin`). **This is not client-side security and must
not be treated as such** — the client PIN check is a UX affordance only. Real
enforcement has to live inside the Postgres functions. Whether it actually
does is an open question in the contract doc.

The Supabase URL and publishable key are hardcoded at `index.html:2439-2440`.
Publishable keys are designed to be exposed, so this is expected — but it means
row-level security and the in-function PIN check are the only things protecting
this data.

---

## 6. Conventions and gotchas

- **No build, no tests, no linter.** Verification means opening `index.html` in
  a browser and clicking through. There is nothing to run.
- **Match surrounding style.** The inline JS is deliberately dense — single-line
  functions, terse helpers, `$`/`$$` instead of `querySelector`. Follow it
  rather than reformatting; a reformat produces an unreviewable diff in a file
  this large.
- **Theme is not persisted.** `let theme = 'light'` with `data-theme="light"`
  hardcoded on `<html>`. There is no `localStorage` anywhere in the app. The
  toggle resets on every reload — this is current behavior, not necessarily
  intended.
- **Git history is not a changelog.** Four commits are titled *"Update print
  statement from 'Hello' to 'Goodbye'"* and actually changed 115–1,556 lines of
  `index.html`. There are no print statements in this repo. Read diffs, not
  commit messages.
- **Escaping:** use the existing `escapeHtml()` for anything user-entered.
  Hand-authored lender content is intentionally raw HTML — don't "fix" it.
