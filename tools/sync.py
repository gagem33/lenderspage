#!/usr/bin/env python3
"""Drive -> lenders.json sync. The half of the pipeline a machine can be trusted with.

The pipeline spec (CLAUDE.md #1) is:

    bank PDF -> extract -> per-bank diff -> Gage approves -> data updates

Step 2 is an agent reading rendered pages (EXTRACTION_GUIDE section 9). It cannot be a
script, and pretending otherwise is how wrong numbers reach the desk. Everything
around it can and should be deterministic, and that is what this file is:

    scan      what changed in Drive, and which lenders look stale
    ingest    a downloaded PDF (base64 from the Drive tool) -> a real file on disk
    snapshot  record the current Drive state so the next scan is a diff
    new       scaffold an empty proposal for the agent to fill in
    diff      validate a proposal and render it for approval
    approve   mark fields approved or rejected
    apply     write ONLY approved fields into lenders.json

The approval gate is enforced here, not by convention:

  * `apply` refuses to run while any change is still undecided (approved: null).
  * `apply` refuses if a change's `old` no longer matches what is in lenders.json --
    that means the proposal was built against a stale copy and the diff Gage read
    is not the diff that would be written.
  * every change must carry a page number and a verbatim quote, or it is invalid.
    EXTRACTION_GUIDE section 6: "If you can't quote it, you didn't find it."

Usage:

    python3 tools/sync.py scan   [--listing drive.json]
    python3 tools/sync.py ingest --result RESULT.txt --out sync/pdfs
    python3 tools/sync.py snapshot --listing drive.json
    python3 tools/sync.py new LENDER_ID --doc "Program Sheet"
    python3 tools/sync.py diff  sync/proposals/FILE.json
    python3 tools/sync.py approve sync/proposals/FILE.json --all
    python3 tools/sync.py apply sync/proposals/FILE.json [--dry-run]
"""
import sys, os, re, json, base64, hashlib, argparse, datetime, difflib, html as _html

ROOT     = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LENDERS  = os.path.join(ROOT, 'lenders.json')
SOURCES  = os.path.join(ROOT, 'SOURCES.md')
SYNCDIR  = os.path.join(ROOT, 'sync')
SNAPSHOT = os.path.join(SYNCDIR, 'drive-snapshot.json')
LEDGER   = os.path.join(SYNCDIR, 'applied.jsonl')
ACKFILE  = os.path.join(SYNCDIR, 'acknowledged.json')
PROPOSAL_SCHEMA = 'lenderhub.proposal.v1'

# The Drive folder the manifest describes. SOURCES.md section 1.
DRIVE_FOLDER_ID = '1kf_mJ09Sxfg--PQ-xqOXdkouYUJ8ryz9'

_TTY = sys.stdout.isatty()
def _c(code, s):
    return f'\033[{code}m{s}\033[0m' if _TTY else s
def red(s):    return _c('31', s)
def green(s):  return _c('32', s)
def yellow(s): return _c('33', s)
def bold(s):   return _c('1',  s)
def dim(s):    return _c('2',  s)


# ---------------------------------------------------------------- loading

def load_lenders():
    with open(LENDERS, encoding='utf-8') as f:
        return json.load(f)

def write_lenders(records):
    """Byte-compatible with what node's JSON.stringify(x, null, 2) produced.

    Verified: indent=2, ensure_ascii=False, no trailing newline round-trips the
    committed file exactly. Keeping that true is what makes an applied change
    show up in git as the fields that changed and nothing else.
    """
    text = json.dumps(records, indent=2, ensure_ascii=False)
    with open(LENDERS, 'w', encoding='utf-8') as f:
        f.write(text)

def lender_by_id(records, lid):
    for r in records:
        if r.get('id') == lid:
            return r
    return None


# ---------------------------------------------------------------- SOURCES.md manifest

MANIFEST_ROW = re.compile(r'^\|(?P<cells>.+)\|\s*$')

def parse_manifest():
    """Read the section 2 table out of SOURCES.md.

    SOURCES.md is the authority for which Drive file is which lender's document
    (section 4). Parsing it beats keeping a second copy in JSON that can drift.
    """
    rows, in_table = [], False
    with open(SOURCES, encoding='utf-8') as f:
        for line in f:
            if line.startswith('## 2. Manifest'):
                in_table = True
                continue
            if in_table and line.startswith('## '):
                break
            if not in_table:
                continue
            m = MANIFEST_ROW.match(line.rstrip('\n'))
            if not m:
                continue
            cells = [c.strip() for c in m.group('cells').split('|')]
            if len(cells) < 6:
                continue
            if cells[0] in ('id', '---') or set(cells[0]) <= {'-', ':'}:
                continue
            file_id = cells[3].strip('`').strip()
            if not file_id:
                continue
            rows.append({
                'id':        cells[0],
                'doc':       cells[1],
                'date':      cells[2],
                'file_id':   file_id,
                'app_date':  cells[4],
                'text_layer': cells[5],
            })
    return rows


# ---------------------------------------------------------------- dates

MONTHS = {m.lower(): i for i, m in enumerate(
    ['January','February','March','April','May','June','July',
     'August','September','October','November','December'], 1)}
for _full, _n in list(MONTHS.items()):
    MONTHS[_full[:3]] = _n

def parse_app_dates(s):
    """lenders.json effectiveDate strings are free text. Return (dates, precision).

    precision is 'day', 'month' or None. Real values in the file today include
    'June 12, 2026', 'July 2026', '2026 (v53)' and Kia's compound
    'Jan 6, 2026 - K500/K506 July 7, 2026'. A compound string yields both dates;
    the caller compares against the newest, because a bulletin supersedes the base
    sheet (SOURCES.md section 1).
    """
    if not s:
        return [], None
    days = [datetime.date(int(y), MONTHS[mo.lower()], int(d))
            for mo, d, y in re.findall(r'([A-Za-z]{3,9})\.?\s+(\d{1,2}),\s*(\d{4})', s)
            if mo.lower() in MONTHS]
    if days:
        return sorted(days), 'day'
    months = [datetime.date(int(y), MONTHS[mo.lower()], 1)
              for mo, y in re.findall(r'([A-Za-z]{3,9})\.?\s+(\d{4})', s)
              if mo.lower() in MONTHS]
    if months:
        return sorted(months), 'month'
    return [], None

FILENAME_DATE = re.compile(r'-\s*(\d{2})(\d{2})(\d{2})\s*\.pdf$', re.I)

def parse_filename_date(title):
    """'Exeter - Program Sheet - 061226.pdf' -> date(2026, 6, 12). SOURCES.md section 1."""
    m = FILENAME_DATE.search(title)
    if not m:
        return None
    mm, dd, yy = (int(g) for g in m.groups())
    try:
        return datetime.date(2000 + yy, mm, dd)
    except ValueError:
        return None

# Doc types that do NOT set a lender's effective date. SOURCES.md section 1 is
# explicit that Funding Guidelines cover stips and funding only, and Proof of
# Residence covers residency only -- neither is authority for the program date.
# Comparing against them is how capitalone looked 26 days stale when it was not.
NON_AUTHORITY_DOCS = ('funding guidelines', 'proof of residence')

def doc_type_from_title(title):
    """'Kia - Standard New - National - 010626.pdf' -> 'Standard New - National'."""
    parts = [x.strip() for x in title.split(' - ')]
    return ' - '.join(parts[1:-1]) if len(parts) >= 3 else ''

def is_authority_doc(title):
    doc = doc_type_from_title(title).lower()
    return not any(doc.startswith(n) for n in NON_AUTHORITY_DOCS)


BANK_TO_ID = {
    '5th3rd': 'fifththird', 'ally': 'ally', 'americredit': 'amcredit',
    'bank of america': 'bofa', 'capone': 'capitalone', 'chase': 'chase',
    'cps': 'cps', 'dfc': 'dfc', 'exeter': 'exeter', 'flagship': 'flagship',
    'global': 'gls', 'kia': 'kia', 'pnc': 'pnc', 'regional': 'regional',
    'santander': 'santander', 'td': 'td', 'truist': 'truist',
    'usbank': 'usbank', 'wells fargo': 'wellsfargo', 'westlake': 'westlake',
}

def id_from_title(title):
    """Filename prefix -> lender id, per the table in SOURCES.md section 1."""
    prefix = title.split(' - ')[0].strip().lower()
    return BANK_TO_ID.get(prefix)


# ---------------------------------------------------------------- freshness

# How old a program sheet may get before the desk should re-check it. Gage set
# the first threshold on 2026-08-26: 90 days is the point a bank is worth a look.
# Past a year the document is not "aging", it is out of date -- dfc sat at 378
# days behind a wrong filename until 2026-08-26, and nothing on the page said so.
AGE_CHECK = 90
AGE_STALE = 365

FRESHNESS_PAINT = {
    'ok': green, 'month-only': dim, 'acknowledged': dim,
    'stale': red, 'ahead': yellow, 'undated': yellow, 'no-pdf': yellow,
}

def freshness(records, listing, ack=None):
    """Per lender: what date the app claims, what Drive has, and whether they agree.

    One computation, two consumers -- `scan` prints it, `freshness --write` bakes it
    into lenders.json so the page can show it. They cannot drift apart, which is the
    whole point: spec #4 says freshness comes from the source document automatically,
    and a number the terminal knows but the desk cannot see does not satisfy that.

    `date` is stored, age is not. An age baked into a file is wrong the next morning;
    the browser subtracts it from today at render time.
    """
    ack = ack or {}
    newest = {}
    for f in listing:
        lid = id_from_title(f['title'])
        d = parse_filename_date(f['title'])
        if not lid or not d or not is_authority_doc(f['title']):
            continue
        if lid not in newest or d > newest[lid][0]:
            newest[lid] = (d, f['title'], f.get('id'))

    today = datetime.date.today()
    out = []
    for r in records:
        lid = r['id']
        dates, precision = parse_app_dates(r.get('effectiveDate', ''))
        app_date = dates[-1] if dates else None   # newest wins: a bulletin supersedes
        drive = newest.get(lid)
        status, label, note = 'ok', 'ok', ''

        if not drive:
            status, label, note = 'no-pdf', 'NO PDF', 'no source document in Drive'
        elif app_date is None:
            status, label = 'undated', 'UNDATED'
            note = f"app shows {r['effectiveDate']!r}"
        elif precision == 'month':
            # 'July 2026' vs a file dated 2026-07-08 is agreement, not staleness.
            same_month = (app_date.year, app_date.month) == (drive[0].year, drive[0].month)
            if drive[0] < app_date or same_month:
                status, label = 'month-only', 'month-only'
                note = f"app shows {r['effectiveDate']!r}, newest file is {drive[0].isoformat()}"
                if same_month:
                    app_date = drive[0]
            else:
                status, label = 'stale', 'STALE'
                note = f'Drive has {drive[0].isoformat()}, app shows only {r["effectiveDate"]!r}'
        elif drive[0] > app_date:
            status, label = 'stale', 'STALE'
            note = f'Drive has {drive[0].isoformat()} ({drive[1]}), app shows {app_date.isoformat()}'
        elif app_date > drive[0]:
            status, label = 'ahead', 'AHEAD'
            note = (f'app shows {app_date.isoformat()} but the newest source doc is '
                    f'{drive[0].isoformat()} -- which is right?')
        else:
            note = f'{app_date.isoformat()}  ({(today - app_date).days}d old)'

        if lid in ack and status in ('stale', 'undated', 'ahead'):
            status, label = 'acknowledged', 'ack'
            note = f'{note}  [reviewed {ack[lid].get("reviewed", "?")}]'

        out.append({
            'id': lid, 'status': status, 'label': label, 'note': note,
            'date': app_date.isoformat() if app_date else None,
            'precision': precision,
            'doc': drive[1] if drive else None,
            'drive_file_id': drive[2] if drive else None,
        })
    return out


# ---------------------------------------------------------------- scan

def load_listing(path):
    """Accept the raw JSON the Drive search tool returns, or a bare list of files."""
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
    files = data.get('files', data) if isinstance(data, dict) else data
    return [f for f in files if f.get('mimeType') == 'application/pdf']

def load_acknowledged():
    """Divergences already judged, so the monthly report shows only new questions.

    A freshness report that flags the same four lenders every month is one that
    stops being read. Anything in here has been looked at; anything not in here
    is a live question.
    """
    if not os.path.exists(ACKFILE):
        return {}
    with open(ACKFILE, encoding='utf-8') as f:
        return json.load(f).get('acknowledged', {})


def cmd_scan(a):
    records = load_lenders()
    manifest = parse_manifest()
    by_file_id = {r['file_id']: r for r in manifest}

    listing = None
    if a.listing:
        listing = load_listing(a.listing)
    elif os.path.exists(SNAPSHOT):
        listing = load_listing(SNAPSHOT)
        print(dim(f'(no --listing given; using last snapshot {os.path.relpath(SNAPSHOT, ROOT)})'))
    if listing is None:
        print(yellow('No Drive listing and no snapshot. Ask the agent to list the folder:'))
        print(dim(f'  Drive search_files  parentId = \'{DRIVE_FOLDER_ID}\''))
        print(dim('  save the JSON, then: python3 tools/sync.py scan --listing drive.json'))
        return 1

    prev = {}
    if os.path.exists(SNAPSHOT) and a.listing:
        for f in load_listing(SNAPSHOT):
            prev[f['id']] = f

    live = {f['id']: f for f in listing}
    new, changed, untracked = [], [], []
    for fid, f in live.items():
        if prev and fid not in prev:
            new.append(f)
        elif prev and (f.get('modifiedTime') != prev[fid].get('modifiedTime')
                       or f.get('fileSize') != prev[fid].get('fileSize')):
            changed.append(f)
        if fid not in by_file_id:
            untracked.append(f)
    missing = [r for r in manifest if r['file_id'] not in live]

    print(bold(f'\nDrive folder: {len(live)} PDFs   Manifest: {len(manifest)} rows   '
               f'lenders.json: {len(records)} lenders\n'))

    if new:
        print(bold(red(f'NEW since last snapshot ({len(new)})')))
        for f in new:
            print(f"  {f['title']}\n    {dim(f['id'])}")
        print()
    if changed:
        print(bold(red(f'CHANGED since last snapshot ({len(changed)})')))
        for f in changed:
            print(f"  {f['title']}\n    {dim(f['id'])}")
        print()
    if untracked:
        print(bold(yellow(f'IN DRIVE, NOT IN SOURCES.md ({len(untracked)})')))
        for f in untracked:
            print(f"  {f['title']}\n    {dim(f['id'])}  -- add a manifest row")
        print()
    if missing:
        print(bold(yellow(f'IN SOURCES.md, NOT IN DRIVE ({len(missing)})')))
        for r in missing:
            print(f"  {r['id']} / {r['doc']}  {dim(r['file_id'])}  -- re-uploaded? the ID changes")
        print()
    if not (new or changed or untracked or missing):
        print(green('Drive and SOURCES.md agree. No new or changed files.\n'))

    print(bold('Freshness -- newest Drive document vs lenders.json effectiveDate\n'))
    ack = load_acknowledged()
    rows = [(f['id'], FRESHNESS_PAINT[f['status']](f['label']), f['note'])
            for f in freshness(records, listing, ack)]

    live_issues = [f for f in freshness(records, listing, ack)
                   if f['status'] in ('stale', 'undated', 'ahead')]
    width = max(len(r[0]) for r in rows)
    for lid, flag, note in rows:
        print(f'  {lid.ljust(width)}  {flag:<20} {dim(note)}')
    print()
    if live_issues:
        print(bold(red(f'{len(live_issues)} lender(s) need a look.')))
    else:
        print(green('No unreviewed date problems.'))
    if ack:
        print(dim(f'{len(ack)} acknowledged divergence(s) hidden -- see '
                  f'{os.path.relpath(ACKFILE, ROOT)}'))
    print()
    return 0


def cmd_freshness(a):
    """Bake each lender's source date into lenders.json so the page can show it.

    Spec #4: freshness comes from the source PDF automatically, with no button and
    nothing to maintain by hand. That is only true if the number reaches the desk,
    and until now it reached a terminal. This writes a `source` block per lender;
    `index.html` turns it into a badge.

    Age is deliberately NOT stored -- only the date. A stored age is wrong tomorrow.
    """
    records = load_lenders()
    listing = load_listing(a.listing) if a.listing else (
        load_listing(SNAPSHOT) if os.path.exists(SNAPSHOT) else None)
    if listing is None:
        print(red('No Drive listing and no snapshot. Run scan --listing first.'))
        return 1

    rows = {f['id']: f for f in freshness(records, listing, load_acknowledged())}
    today = datetime.date.today().isoformat()
    changed = []
    for r in records:
        f = rows.get(r['id'])
        if not f:
            continue
        src_block = {
            'date':        f['date'],
            'precision':   f['precision'],
            'status':      f['status'],
            'doc':         f['doc'],
            'driveFileId': f['drive_file_id'],
            'syncedAt':    today,
        }
        # A warning is editorial -- it says the document is current but its CONTENT
        # is not, which no date can express. Kia is the live case. Set through a
        # proposal like any other value, so never clobber one here.
        if isinstance(r.get('source'), dict) and r['source'].get('warning'):
            src_block['warning'] = r['source']['warning']
        before = r.get('source')
        if before != src_block:
            changed.append((r['id'], f['status'], f['date']))
        r['source'] = src_block

    if a.dry_run:
        print(green(f'[dry run] would update source on {len(changed)} lender(s):'))
        for lid, st, d in changed:
            print(f'  {lid:<12} {st:<12} {d}')
        return 0

    write_lenders(records)
    with open(LENDERS, encoding='utf-8') as f:
        json.load(f)
    print(green(f'Wrote source freshness for {len(records)} lender(s); '
                f'{len(changed)} changed.'))
    for lid, st, d in changed:
        print(f'  {lid:<12} {st:<12} {d}')
    return 0


# ---------------------------------------------------------------- ingest

def cmd_ingest(a):
    """Turn the Drive download tool's output into a PDF on disk.

    The tool returns {content: <base64>, title, mimeType, id}. A program sheet is
    big enough that the harness spills it to a file rather than returning it
    inline -- which is what we want, because the bytes never need to pass through
    anyone's context to become a PDF.
    """
    with open(a.result, encoding='utf-8') as f:
        env = json.load(f)
    if 'content' not in env:
        print(red('No `content` key. Is this the Drive download result?'))
        return 1
    raw = base64.b64decode(env['content'])
    if not raw.startswith(b'%PDF-'):
        print(red(f'Decoded {len(raw)} bytes but it is not a PDF (magic: {raw[:8]!r}).'))
        return 1
    os.makedirs(a.out, exist_ok=True)
    name = env.get('title') or f"{env.get('id', 'file')}.pdf"
    dest = os.path.join(a.out, name)
    with open(dest, 'wb') as f:
        f.write(raw)
    digest = hashlib.sha256(raw).hexdigest()
    print(f'{green("wrote")} {dest}')
    print(f'  {len(raw):,} bytes   sha256 {digest[:16]}   drive id {env.get("id","?")}')
    print(dim(f'\nNext: python3 tools/pdf_triage.py "{dest}" --render --dpi 300'))
    return 0


def cmd_snapshot(a):
    files = load_listing(a.listing)
    os.makedirs(SYNCDIR, exist_ok=True)
    payload = {
        'captured':  datetime.date.today().isoformat(),
        'folder_id': DRIVE_FOLDER_ID,
        'files': sorted(
            [{k: f.get(k) for k in ('id', 'title', 'fileSize', 'modifiedTime', 'mimeType')}
             for f in files],
            key=lambda f: f['title']),
    }
    with open(SNAPSHOT, 'w', encoding='utf-8') as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)
        f.write('\n')
    print(f'{green("snapshot")} {os.path.relpath(SNAPSHOT, ROOT)}  ({len(payload["files"])} PDFs)')
    return 0


# ---------------------------------------------------------------- proposals

def get_path(obj, path):
    cur = obj
    for key in path:
        if isinstance(cur, dict):
            if key not in cur:
                return None, False
            cur = cur[key]
        elif isinstance(cur, list):
            try:
                cur = cur[int(key)]
            except (ValueError, IndexError):
                return None, False
        else:
            return None, False
    return cur, True

# Where a brand-new section belongs on the lender detail page. The page renders
# Object.values(lender.sections), so dict order *is* display order, and a key
# created by set_path would otherwise land at the very bottom. This only places
# keys that did not exist before -- existing sections keep the order they have.
# `rates` sits with LTV & Terms because that is where CLAUDE.md spec #3 puts it.
SECTION_ORDER = ['fico', 'id', 'income', 'program', 'ltv', 'rates', 'gap',
                 'backend', 'reserve', 'vehicles', 'smallbusiness', 'incentives']

def place_new_section(rec, key):
    """Move a newly created sections[key] to its canonical slot.

    Inserts it directly after the nearest preceding SECTION_ORDER key that the
    record actually has; if it has none, the new section goes first. Every other
    key keeps its relative position, so applying a proposal never silently
    reshuffles sections it did not touch.
    """
    sections = rec.get('sections')
    if not isinstance(sections, dict) or key not in sections or key not in SECTION_ORDER:
        return False
    existing = [k for k in sections if k != key]
    anchor = None
    for cand in SECTION_ORDER[:SECTION_ORDER.index(key)]:
        if cand in existing:
            anchor = cand
    at = existing.index(anchor) + 1 if anchor else 0
    ordered = existing[:at] + [key] + existing[at:]
    if ordered == list(sections):
        return False
    rec['sections'] = {k: sections[k] for k in ordered}
    return True

def set_path(obj, path, value):
    cur = obj
    for key in path[:-1]:
        if isinstance(cur, list):
            cur = cur[int(key)]
        else:
            if key not in cur or not isinstance(cur[key], (dict, list)):
                cur[key] = {}
            cur = cur[key]
    last = path[-1]
    if isinstance(cur, list):
        cur[int(last)] = value
    else:
        cur[last] = value

def load_proposal(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)

def save_proposal(path, p):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(p, f, indent=2, ensure_ascii=False)
        f.write('\n')

def validate(p, records):
    """Structural checks plus the one that matters: does `old` still match reality?"""
    errors, warnings = [], []
    if p.get('schema') != PROPOSAL_SCHEMA:
        errors.append(f'schema must be {PROPOSAL_SCHEMA!r}, got {p.get("schema")!r}')
    lid = p.get('lender_id')
    rec = lender_by_id(records, lid)
    if rec is None:
        errors.append(f'lender_id {lid!r} is not in lenders.json')
    if not p.get('sources'):
        errors.append('no sources -- every proposal cites the PDF it came from')
    manifest_ids = {r['file_id'] for r in parse_manifest()}
    for s in p.get('sources', []):
        if not s.get('drive_file_id'):
            errors.append('a source has no drive_file_id')
        elif s['drive_file_id'] not in manifest_ids:
            warnings.append(f'source {s["drive_file_id"]} is not in SOURCES.md -- add a row')

    changes = p.get('changes', [])
    if not changes:
        warnings.append('no changes -- the PDF said nothing this record does not already have')

    for i, ch in enumerate(changes):
        where = f'changes[{i}]'
        path = ch.get('path')
        if not path or not isinstance(path, list):
            errors.append(f'{where}: needs a `path` list, e.g. ["maxLTV"] or ["sections","ltv","content"]')
            continue
        if not isinstance(ch.get('page'), int) or ch['page'] < 1:
            errors.append(f'{where} ({".".join(map(str,path))}): needs a page number')
        quote = (ch.get('quote') or '').strip()
        if not quote:
            errors.append(f'{where} ({".".join(map(str,path))}): needs a verbatim quote '
                          '-- EXTRACTION_GUIDE section 6')
        elif len(quote) > 300:
            warnings.append(f'{where}: quote is {len(quote)} chars; section 1 says one line')
        if 'new' not in ch:
            errors.append(f'{where}: no `new` value')
        if rec is not None:
            actual, found = get_path(rec, path)
            declared = ch.get('old')
            if not found and declared is not None:
                errors.append(f'{where} ({".".join(map(str,path))}): `old` is {declared!r} '
                              'but that path does not exist in lenders.json')
            elif found and actual != declared:
                errors.append(
                    f'{where} ({".".join(map(str,path))}): STALE -- `old` says {declared!r}, '
                    f'lenders.json currently has {actual!r}. Re-extract against the current file.')
            if found and actual == ch.get('new'):
                warnings.append(f'{where} ({".".join(map(str,path))}): new value equals current; no-op')
    return errors, warnings


def fmt(v, limit=140):
    s = v if isinstance(v, str) else json.dumps(v, ensure_ascii=False)
    s = s.replace('\n', ' ')
    return s if len(s) <= limit else s[:limit - 1] + '…'


def readable_lines(s):
    """One line per block element, tags stripped -- a diffable view of an HTML blob.

    Most of a lender's real program data lives in `sections.*.content` as HTML.
    Truncating two 900-character blobs to 140 chars shows two identical lines and
    hides the change, which makes the approval step theatre. Diff what the row
    actually says instead.
    """
    t = re.sub(r'</(div|tr|li|p)>', '\n', s)
    t = re.sub(r'<[^>]+>', ' ', t)
    t = _html.unescape(t)
    return [ln for ln in (re.sub(r'\s+', ' ', x).strip() for x in t.split('\n')) if ln]


def print_value_change(old, new, indent='      '):
    """Short values print as -/+. Long ones print as a line diff of their content."""
    long_str = (isinstance(old, str) and isinstance(new, str)
                and (len(old) > 200 or len(new) > 200))
    if not long_str:
        print(f'{indent}{red("- " + fmt(old))}')
        print(f'{indent}{green("+ " + fmt(new))}')
        return
    a, b = readable_lines(old), readable_lines(new)
    shown = 0
    for line in difflib.unified_diff(a, b, lineterm='', n=1):
        if line.startswith(('---', '+++')):
            continue
        if line.startswith('@@'):
            print(f'{indent}{dim(line)}')
        elif line.startswith('-'):
            print(f'{indent}{red(fmt(line, 160))}')
            shown += 1
        elif line.startswith('+'):
            print(f'{indent}{green(fmt(line, 160))}')
            shown += 1
        else:
            print(f'{indent}{dim(fmt(line, 160))}')
    if not shown:
        print(f'{indent}{yellow("(no visible text change -- markup only)")}')
    print(f'{indent}{dim(f"[{len(old):,} chars -> {len(new):,} chars]")}')

def render_diff(p, records):
    rec = lender_by_id(records, p.get('lender_id'))
    name = rec['name'] if rec else p.get('lender_id')
    print(bold(f'\n{name}  ({p.get("lender_id")})'))
    for s in p.get('sources', []):
        print(dim(f'  source: {s.get("title","?")}   effective {s.get("effective_date","?")}   '
                  f'{s.get("drive_file_id","?")}'))
    print()

    changes = p.get('changes', [])
    if not changes:
        print(dim('  no field changes proposed\n'))
    for i, ch in enumerate(changes):
        label = '.'.join(map(str, ch.get('path', [])))
        state = ch.get('approved')
        mark = green('APPROVED') if state is True else (red('REJECTED') if state is False
                                                        else yellow('undecided'))
        print(f'  {bold(f"[{i}] {label}")}   {mark}')
        print_value_change(ch.get('old'), ch.get('new'))
        print(dim(f'      p{ch.get("page","?")}  "{fmt(ch.get("quote"), 100)}"'))
        if ch.get('note'):
            print(dim(f'      note: {ch["note"]}'))
        print()

    if p.get('not_in_source'):
        print(bold('  Not covered by this PDF (left unchanged)'))
        print(dim('    ' + ', '.join(p['not_in_source'])) + '\n')
    if p.get('ambiguities'):
        print(bold(yellow('  Needs your call')))
        for amb in p['ambiguities']:
            if isinstance(amb, dict):
                print(f'    - {amb.get("field","?")}: {amb.get("note","")}')
            else:
                print(f'    - {amb}')
        print()


def cmd_new(a):
    records = load_lenders()
    rec = lender_by_id(records, a.lender_id)
    if rec is None:
        print(red(f'No lender {a.lender_id!r} in lenders.json'))
        return 1
    manifest = [r for r in parse_manifest() if r['id'] == a.lender_id]
    if a.doc:
        manifest = [r for r in manifest if r['doc'].lower() == a.doc.lower()] or manifest
    p = {
        'schema': PROPOSAL_SCHEMA,
        'lender_id': a.lender_id,
        'created': datetime.date.today().isoformat(),
        'sources': [{
            'drive_file_id': r['file_id'],
            'title': f"{a.lender_id} - {r['doc']}",
            'doc_type': r['doc'],
            'effective_date': r['date'],
            'text_layer': r['text_layer'],
        } for r in manifest],
        'changes': [],
        'not_in_source': [],
        'ambiguities': [],
    }
    os.makedirs(os.path.join(SYNCDIR, 'proposals'), exist_ok=True)
    dest = a.out or os.path.join(SYNCDIR, 'proposals',
                                 f'{a.lender_id}-{datetime.date.today().isoformat()}.json')
    if os.path.exists(dest) and not a.force:
        print(red(f'{dest} exists. Use --force to overwrite.'))
        return 1
    save_proposal(dest, p)
    print(f'{green("scaffolded")} {os.path.relpath(dest, ROOT)}')
    print(dim(f'  {len(p["sources"])} source(s) from SOURCES.md'))
    return 0


def cmd_diff(a):
    records = load_lenders()
    p = load_proposal(a.proposal)
    errors, warnings = validate(p, records)
    render_diff(p, records)
    for w in warnings:
        print(yellow(f'  warning: {w}'))
    for e in errors:
        print(red(f'  ERROR: {e}'))
    if errors:
        print(red(f'\n{len(errors)} error(s). This proposal cannot be applied.\n'))
        return 1
    undecided = [c for c in p.get('changes', []) if c.get('approved') is None]
    if undecided:
        print(yellow(f'\n{len(undecided)} change(s) still undecided. '
                     f'Approve or reject before applying.'))
        print(dim(f'  python3 tools/sync.py approve {a.proposal} --all'))
        print(dim(f'  python3 tools/sync.py approve {a.proposal} --fields 0,2 --reject 1\n'))
    else:
        print(green('\nAll changes decided. Ready to apply.\n'))
    return 0


def _indices(spec, n):
    out = set()
    for part in spec.split(','):
        part = part.strip()
        if not part:
            continue
        if '-' in part:
            lo, hi = part.split('-', 1)
            out.update(range(int(lo), int(hi) + 1))
        else:
            out.add(int(part))
    bad = [i for i in out if i < 0 or i >= n]
    if bad:
        raise SystemExit(red(f'no such change index: {bad} (0..{n-1})'))
    return out

def cmd_approve(a):
    p = load_proposal(a.proposal)
    changes = p.get('changes', [])
    n = len(changes)
    if not n:
        print(yellow('No changes in this proposal.'))
        return 0
    touched = 0
    if a.all:
        for ch in changes:
            ch['approved'] = True
            touched += 1
    if a.fields:
        for i in _indices(a.fields, n):
            changes[i]['approved'] = True
            touched += 1
    if a.reject:
        for i in _indices(a.reject, n):
            changes[i]['approved'] = False
            touched += 1
    if not touched:
        print(yellow('Nothing selected. Use --all, --fields 0,2 or --reject 1.'))
        return 1
    p['approved_by'] = 'gage'
    p['approved_at'] = datetime.datetime.now().replace(microsecond=0).isoformat()
    save_proposal(a.proposal, p)
    approved = sum(1 for c in changes if c.get('approved') is True)
    rejected = sum(1 for c in changes if c.get('approved') is False)
    left     = sum(1 for c in changes if c.get('approved') is None)
    print(f'{green(str(approved) + " approved")}  {red(str(rejected) + " rejected")}  '
          f'{yellow(str(left) + " undecided")}')
    return 0


def cmd_apply(a):
    records = load_lenders()
    p = load_proposal(a.proposal)
    errors, warnings = validate(p, records)
    for w in warnings:
        print(yellow(f'warning: {w}'))
    if errors:
        for e in errors:
            print(red(f'ERROR: {e}'))
        print(red('\nRefusing to apply.\n'))
        return 1

    changes = p.get('changes', [])
    undecided = [i for i, c in enumerate(changes) if c.get('approved') is None]
    if undecided:
        print(red(f'Refusing to apply: {len(undecided)} change(s) undecided '
                  f'(indices {undecided}).'))
        print(dim('Nothing is written until every field is approved or rejected. '
                  'CLAUDE.md spec #1.'))
        return 1

    approved = [c for c in changes if c.get('approved') is True]
    if not approved:
        print(yellow('Every change was rejected. Nothing to write.'))
        return 0

    rec = lender_by_id(records, p['lender_id'])
    placed = []
    for ch in approved:
        path = ch['path']
        fresh = len(path) == 2 and path[0] == 'sections' and ch.get('old') is None
        set_path(rec, path, ch['new'])
        if fresh and place_new_section(rec, path[1]):
            placed.append(path[1])

    if a.dry_run:
        print(green(f'[dry run] would write {len(approved)} change(s) to {p["lender_id"]}:'))
        for ch in approved:
            print(f'  {".".join(map(str, ch["path"]))}  ->  {fmt(ch["new"], 80)}')
        for k in placed:
            print(dim(f'  new section {k!r} placed at its canonical slot: '
                      f'{" > ".join(rec["sections"])}'))
        return 0

    write_lenders(records)
    with open(LENDERS, encoding='utf-8') as f:
        json.load(f)  # a corrupt lenders.json takes the whole app down; fail loudly here

    os.makedirs(SYNCDIR, exist_ok=True)
    entry = {
        'applied':   datetime.datetime.now().replace(microsecond=0).isoformat(),
        'lender_id': p['lender_id'],
        'proposal':  os.path.relpath(os.path.abspath(a.proposal), ROOT),
        'sources':   [s.get('drive_file_id') for s in p.get('sources', [])],
        'fields':    ['.'.join(map(str, c['path'])) for c in approved],
        'rejected':  ['.'.join(map(str, c['path'])) for c in changes
                      if c.get('approved') is False],
    }
    with open(LEDGER, 'a', encoding='utf-8') as f:
        f.write(json.dumps(entry, ensure_ascii=False) + '\n')

    print(green(f'Applied {len(approved)} change(s) to {p["lender_id"]} in lenders.json'))
    for ch in approved:
        print(f'  {".".join(map(str, ch["path"]))}')
    for k in placed:
        print(dim(f'  new section {k!r} placed at its canonical slot: '
                  f'{" > ".join(rec["sections"])}'))
    print(dim(f'\nLedger: {os.path.relpath(LEDGER, ROOT)}'))
    print(dim('Commit lenders.json and the proposal together, then Vercel redeploys.'))
    return 0


# ---------------------------------------------------------------- cli

def main():
    ap = argparse.ArgumentParser(
        prog='sync.py', description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest='cmd', required=True)

    s = sub.add_parser('scan', help='what changed in Drive, and which lenders look stale')
    s.add_argument('--listing', help='JSON from the Drive search_files tool')
    s.set_defaults(fn=cmd_scan)

    s = sub.add_parser('freshness', help="bake each lender's source date into lenders.json")
    s.add_argument('--listing', help='JSON from the Drive search_files tool')
    s.add_argument('--dry-run', action='store_true')
    s.set_defaults(fn=cmd_freshness)

    s = sub.add_parser('ingest', help='decode a downloaded PDF onto disk')
    s.add_argument('--result', required=True, help='the Drive download tool result file')
    s.add_argument('--out', default=os.path.join('sync', 'pdfs'))
    s.set_defaults(fn=cmd_ingest)

    s = sub.add_parser('snapshot', help='record Drive state so the next scan is a diff')
    s.add_argument('--listing', required=True)
    s.set_defaults(fn=cmd_snapshot)

    s = sub.add_parser('new', help='scaffold an empty proposal')
    s.add_argument('lender_id')
    s.add_argument('--doc', help='doc type from SOURCES.md, e.g. "Program Sheet"')
    s.add_argument('--out')
    s.add_argument('--force', action='store_true')
    s.set_defaults(fn=cmd_new)

    s = sub.add_parser('diff', help='validate a proposal and show it for approval')
    s.add_argument('proposal')
    s.set_defaults(fn=cmd_diff)

    s = sub.add_parser('approve', help='mark changes approved or rejected')
    s.add_argument('proposal')
    s.add_argument('--all', action='store_true', help='approve every change')
    s.add_argument('--fields', help='approve these indices, e.g. 0,2,5-7')
    s.add_argument('--reject', help='reject these indices')
    s.set_defaults(fn=cmd_approve)

    s = sub.add_parser('apply', help='write approved changes into lenders.json')
    s.add_argument('proposal')
    s.add_argument('--dry-run', action='store_true')
    s.set_defaults(fn=cmd_apply)

    a = ap.parse_args()
    return a.fn(a)


if __name__ == '__main__':
    sys.exit(main())
