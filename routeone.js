/* LenderHub — Bank Matrix (RouteOne Oct-2026 layer)
 * LOCAL-ONLY while it carries dealer-only lender data. Reads lenders-routeone.json (not lenders.json).
 * If that file is absent (e.g. a public deploy) this script does nothing and the app is unchanged.
 * Plain JS, no build step, same conventions as index.html (string templates, delegated listeners).
 */
(function () {
'use strict';

const RO = { data: null, byId: {}, byExisting: {}, noSheetByExisting: {}, ready: false };
window.RO = RO;

// ── tiny helpers ─────────────────────────────────────────────
const q  = (s, c) => (c || document).querySelector(s);
const qa = (s, c) => [...(c || document).querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Text from the cheat sheet: **bold**, "(inf.)" and "not stated" get visual flags so uncertainty never disappears.
function rich(s) {
  return esc(s)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\(inf\.\)/g, '<span class="ro-inf" title="Desk inference, not written by the lender">(inf.)</span>')
    .replace(/\bnot stated\b/gi, m => `<span class="ro-ns" title="The document is silent. This is not a no.">${m}</span>`);
}
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function fmtDate(iso, prec) {
  if (!iso) return 'no date';
  const [y, m, d] = iso.split('-').map(Number);
  return prec === 'month' ? `${MON[m - 1]} ${y}` : `${MON[m - 1]} ${d}, ${y}`;
}
function fmtShort(iso) {
  if (!iso) return 'no date';
  const [y, m, d] = iso.split('-').map(Number);
  return `${m}/${d}/${y}`;
}
function ageOf(iso) {
  if (!iso) return null;
  const days = Math.floor((Date.now() - new Date(iso + 'T12:00:00').getTime()) / 864e5);
  let text, cls = 'green';
  if (days < 0) text = 'upcoming';
  else if (days < 1) text = 'today';
  else if (days < 60) text = days + 'd old';
  else if (days < 365) text = Math.round(days / 30.4) + ' mo old';
  else text = (days / 365).toFixed(1) + ' yrs old';
  if (days >= 365) cls = 'red'; else if (days >= 90) cls = 'amber';
  return { days, text, cls };
}
function ageBadge(iso) {
  const a = ageOf(iso);
  return a ? `<span class="ro-age ${a.cls}">${a.text}</span>` : '<span class="ro-age amber">no date</span>';
}
const UNIT = {
  pct:  v => v + '%',
  mo:   v => v + ' mo',
  usd:  v => '$' + Math.round(v).toLocaleString('en-US'),
  mi:   v => (v >= 1000 ? (v / 1000) + 'K' : v) + ' mi',
  yr:   v => v + ' yrs',
  fico: v => v === 0 ? 'None' : String(v),
  none: v => String(v),
};
const ENUM_TXT = { yes: 'Yes', cond: 'Cond.', no: 'No' };
const SEG_TXT = { prime: 'Prime', near: 'Near-prime', sub: 'Subprime' };

// ── data ─────────────────────────────────────────────────────
const FIELD = {};
function field(k) { return FIELD[k]; }
function val(b, k) { return b.cmp[k] || {}; }

function index(data) {
  RO.data = data;
  data.fields.forEach(f => { FIELD[f.key] = f; });
  data.banks.forEach(b => {
    RO.byId[b.id] = b;
    if (b.existing_id) RO.byExisting[b.existing_id] = b;
  });
  data.no_sheet.forEach(n => { if (n.existing_id) RO.noSheetByExisting[n.existing_id] = n; });
}
RO.has = id => !!(RO.ready && (RO.byExisting[id] || RO.noSheetByExisting[id]));

// ── state (columns, sort and filters are remembered, spec #8) ─
const DEFAULT_COLS = ['min_fico','max_term','max_total_ltv','max_mileage','max_pti','min_income','reserve_cap','flat_max_pct','bk','cosigner','business'];
const S = {
  open: false, tab: 'matrix', bank: null, sel: [],
  sortKey: 'name', sortDir: 1,
  cols: DEFAULT_COLS.slice(),
  f: { text: '', seg: [], fico: '', term: '', miles: '', ltv: '', income: '', pti: '', amt: '', unk: true,
       bk: '', repo: '', cosigner: '', business: '', selfemp: '', itin: '', term84: '' },
  hideSame: false, filtersOpen: false, nsOpen: false, mview: 'cards',
};
const MQ = window.matchMedia ? window.matchMedia('(max-width: 720px)') : { matches: false };
const isMobile = () => !!MQ.matches;
const LS = 'lenderhub.ro.v1';
function save() { try { localStorage.setItem(LS, JSON.stringify({ cols: S.cols, sortKey: S.sortKey, sortDir: S.sortDir, f: S.f, mview: S.mview })); } catch (e) {} }
function load() {
  try {
    const o = JSON.parse(localStorage.getItem(LS) || 'null');
    if (!o) return;
    if (Array.isArray(o.cols)) S.cols = o.cols.filter(k => FIELD[k]);
    if (o.sortKey) S.sortKey = o.sortKey;
    if (o.sortDir) S.sortDir = o.sortDir;
    if (o.f) Object.assign(S.f, o.f);
    if (o.mview === 'table' || o.mview === 'cards') S.mview = o.mview;
  } catch (e) {}
}

// ── cell rendering + sort values ─────────────────────────────
function flagMark(v) {
  return v.f === 'inf' ? '<sup class="ro-flag inf" title="Desk inference">inf</sup>'
       : v.f === 'verify' ? '<sup class="ro-flag verify" title="Conflict or uncertain read. Verify.">⚠</sup>' : '';
}
function cellHTML(b, k) {
  const f = field(k), v = val(b, k), title = v.n ? ` title="${esc(v.n)}"` : '';
  if (f.kind === 'num') {
    if (v.none) return `<span class="ro-none"${title}>No limit</span>${flagMark(v)}`;
    if (v.v == null) return `<span class="ro-dash"${title || ' title="Not stated in the RouteOne sheet"'}>—</span>`;
    return `<span${title}>${UNIT[f.unit](v.v)}</span>${flagMark(v)}`;
  }
  if (f.kind === 'enum') {
    if (!v.v) return `<span class="ro-dash"${title || ' title="Not stated in the RouteOne sheet (this is not a no)"'}>—</span>`;
    return `<span class="ro-en ${v.v}"${title}>${ENUM_TXT[v.v]}</span>${flagMark(v)}`;
  }
  const t = v.v || '';
  return t ? `<span class="ro-txt"${title}>${esc(t)}</span>${flagMark(v)}` : `<span class="ro-dash"${title}>—</span>`;
}
const ENUM_RANK = { yes: 3, cond: 2, '': 1, no: 0 };
function sortVal(b, k) {
  if (k === 'name') return b.name.toLowerCase();
  if (k === 'date') return b.doc_date || null;
  if (k === 'seg') return b.segments.length ? Math.min(...b.segments.map(s => ({ prime: 0, near: 1, sub: 2 }[s]))) : null;
  const f = field(k), v = val(b, k);
  if (f.kind === 'num') return v.none ? Infinity : (v.v == null ? null : v.v);
  if (f.kind === 'enum') return v.v ? ENUM_RANK[v.v] : null;
  return v.v ? v.v.toLowerCase() : null;
}

// ── filtering ────────────────────────────────────────────────
// Rule: a bank that does not state a limit is "not ruled out", not "failed". With the toggle on (default) it
// passes numeric filters and the row carries a ? so you can see it passed on missing data.
function applyFilters(b) {
  const f = S.f, assumed = [];
  const num = (k, test) => {
    const v = val(b, k);
    if (v.none) return true;
    if (v.v == null) { if (f.unk) { assumed.push(k); return true; } return false; }
    return test(v.v);
  };
  if (f.text && !(b.name + ' ' + b.short).toLowerCase().includes(f.text.toLowerCase())) return null;
  if (f.seg.length && !b.segments.some(s => f.seg.includes(s))) return null;
  if (f.fico !== '' && !num('min_fico', x => x <= +f.fico)) return null;
  if (f.term && !num('max_term', x => x >= +f.term)) return null;
  if (f.miles && !num('max_mileage', x => x >= +f.miles)) return null;
  if (f.ltv && !num('max_total_ltv', x => x >= +f.ltv)) return null;
  if (f.income !== '' && !num('min_income', x => x <= +f.income)) return null;
  if (f.pti !== '' && !num('max_pti', x => x >= +f.pti)) return null;
  if (f.amt !== '') {
    if (!num('min_amt', x => x <= +f.amt)) return null;
    if (!num('max_amt', x => x >= +f.amt)) return null;
  }
  for (const k of ['bk','repo','cosigner','business','selfemp','itin','term84']) {
    const want = f[k]; if (!want) continue;
    const v = val(b, k).v || '';
    if (want === 'yes' && !(v === 'yes' || v === 'cond')) return null;
    if (want === 'ok' && v === 'no') return null;
  }
  return { assumed };
}
function rows() {
  const out = [];
  RO.data.banks.forEach(b => { const r = applyFilters(b); if (r) out.push({ b, assumed: r.assumed }); });
  const k = S.sortKey, d = S.sortDir;
  out.sort((x, y) => {
    const a = sortVal(x.b, k), c = sortVal(y.b, k);
    if (a == null && c == null) return x.b.name.localeCompare(y.b.name);
    if (a == null) return 1;
    if (c == null) return -1;
    if (a < c) return -1 * d;
    if (a > c) return 1 * d;
    return x.b.name.localeCompare(y.b.name);
  });
  return out;
}
function activeFilterCount() {
  const f = S.f; let n = 0;
  if (f.text) n++; if (f.seg.length) n++;
  ['fico','term','miles','ltv','income','pti','amt','bk','repo','cosigner','business','selfemp','itin','term84'].forEach(k => { if (f[k] !== '') n++; });
  return n;
}

// ── MATRIX view ──────────────────────────────────────────────
function opt(v, label, cur) { return `<option value="${v}"${String(cur) === String(v) ? ' selected' : ''}>${label}</option>`; }
function enumSel(k, label) {
  return `<label class="ro-f"><span>${label}</span><select data-rof="${k}">${opt('', 'Any', S.f[k])}${opt('yes', 'Yes or conditional', S.f[k])}${opt('ok', 'Not a stated no', S.f[k])}</select></label>`;
}
function filtersHTML() {
  const f = S.f;
  return `<div class="ro-filters">
    <label class="ro-f"><span>Search</span><input type="search" data-rof="text" value="${esc(f.text)}" placeholder="Bank name"></label>
    <div class="ro-f ro-f-seg"><span>Tier</span><div class="ro-chips">${['prime','near','sub'].map(s =>
      `<button type="button" class="ro-chip${f.seg.includes(s) ? ' on' : ''}" data-roseg="${s}" aria-pressed="${f.seg.includes(s)}">${SEG_TXT[s]}</button>`).join('')}</div></div>
    <label class="ro-f"><span>Customer FICO</span><input type="number" inputmode="numeric" data-rof="fico" value="${esc(f.fico)}" placeholder="e.g. 640"></label>
    <label class="ro-f"><span>Max term ≥</span><select data-rof="term">${opt('', 'Any', f.term)}${[60,66,72,75,78,84].map(n => opt(n, n + ' mo', f.term)).join('')}</select></label>
    <label class="ro-f"><span>Max miles ≥</span><select data-rof="miles">${opt('', 'Any', f.miles)}${[100000,120000,125000,150000,180000,200000].map(n => opt(n, (n / 1000) + 'K', f.miles)).join('')}</select></label>
    <label class="ro-f"><span>Total LTV ≥</span><select data-rof="ltv">${opt('', 'Any', f.ltv)}${[125,135,140,145,150,155].map(n => opt(n, n + '%', f.ltv)).join('')}</select></label>
    <label class="ro-f"><span>Amount financed</span><input type="number" inputmode="numeric" data-rof="amt" value="${esc(f.amt)}" placeholder="$"></label>
    <label class="ro-f"><span>Cust. income / mo ≥</span><input type="number" inputmode="numeric" data-rof="income" value="${esc(f.income)}" placeholder="$"></label>
    <label class="ro-f"><span>Cust. PTI % ≤</span><input type="number" inputmode="decimal" data-rof="pti" value="${esc(f.pti)}" placeholder="%"></label>
    ${enumSel('bk', 'Takes bankruptcy')}${enumSel('repo', 'Takes repo history')}${enumSel('cosigner', 'Accepts co-signer')}
    ${enumSel('business', 'Business-titled')}${enumSel('selfemp', 'Self-employed income')}${enumSel('itin', 'ITIN / DACA')}${enumSel('term84', '84-month available')}
    <label class="ro-f ro-f-unk"><input type="checkbox" data-rof="unk"${f.unk ? ' checked' : ''}> <span>Keep banks that don't state the limit (marked <b>?</b>)</span></label>
    <button type="button" class="ro-btn" id="ro-reset">Reset filters</button>
  </div>`;
}
function colPickerHTML() {
  const groups = {};
  RO.data.fields.forEach(f => (groups[f.group] = groups[f.group] || []).push(f));
  return `<details class="ro-cols"><summary class="ro-btn">Columns</summary><div class="ro-cols-pop">
    ${Object.entries(groups).map(([g, fs]) => `<div class="ro-cols-g"><b>${g}</b>${fs.map(f =>
      `<label><input type="checkbox" data-rocol="${f.key}"${S.cols.includes(f.key) ? ' checked' : ''}> ${f.label}</label>`).join('')}</div>`).join('')}
    <div class="ro-cols-act"><button type="button" class="ro-btn" id="ro-cols-reset">Default columns</button><button type="button" class="ro-btn primary" id="ro-cols-done">Done</button></div>
  </div></details>`;
}
function segCell(b) {
  if (!b.segments.length) return '<span class="ro-dash">—</span>';
  return b.segments.map(s => SEG_TXT[s].replace('Near-prime', 'Near').replace('Subprime', 'Sub')).join(' · ') +
    (b.seg_inf ? ' <sup class="ro-flag inf" title="Desk inference: the sheet does not name its credit tier">inf</sup>' : '');
}
function th(key, label, cls) {
  const on = S.sortKey === key, dir = on ? (S.sortDir === 1 ? 'ascending' : 'descending') : 'none';
  return `<th class="${cls || ''}" aria-sort="${dir}"><button type="button" class="ro-sort${on ? ' on' : ''}" data-rosort="${key}">${label}<i>${on ? (S.sortDir === 1 ? '▲' : '▼') : ''}</i></button></th>`;
}
const SORT_LABEL = { name: 'Bank name', seg: 'Credit tier', date: 'Doc date' };
function pickBox(b, on) {
  return `<label class="ro-pickl"><input type="checkbox" data-ropick="${b.id}" aria-label="Select ${esc(b.name)} to compare"${on ? ' checked' : ''}></label>`;
}
function assumedMark(assumed) {
  return assumed.length ? `<span class="ro-q" title="Passes the filters only because it doesn't state: ${esc(assumed.map(k => FIELD[k].short).join(', '))}">?</span>` : '';
}
function tableHTML(rs, cols) {
  const body = rs.map(({ b, assumed }) => {
    const on = S.sel.includes(b.id);
    return `<tr data-id="${b.id}" class="${on ? 'sel' : ''}">
      <td class="ro-pick">${pickBox(b, on)}</td>
      <th scope="row" class="ro-bankcell"><button type="button" class="ro-link" data-roopen="${b.id}">${esc(b.short)}</button>${assumedMark(assumed)}<small>${esc(b.class_label)}</small></th>
      <td class="ro-seg">${segCell(b)}</td>
      <td class="ro-date" title="${esc(b.doc_date_label)}">${b.doc_date ? fmtDate(b.doc_date, b.date_prec) : 'no date'}<br>${ageBadge(b.doc_date)}</td>
      ${cols.map(k => `<td class="k-${FIELD[k].kind}">${cellHTML(b, k)}</td>`).join('')}
    </tr>`;
  }).join('');
  const inner = `<div class="ro-table-wrap${isMobile() ? ' ro-scrollx' : ''}"><table class="ro-table" id="ro-table">
      <thead><tr><th class="ro-pick"></th>${th('name', 'Bank', 'ro-bankcell')}${th('seg', 'Tier')}${th('date', 'Doc date')}${cols.map(k => th(k, FIELD[k].short)).join('')}</tr></thead>
      <tbody>${body || `<tr><td colspan="${cols.length + 4}" class="ro-empty">No bank matches every filter. Loosen one, or reset.</td></tr>`}</tbody>
    </table></div>`;
  return isMobile() ? `<div class="ro-xwrap">${inner}</div>` : inner;
}
// Phone layout: one compact card per bank. Numbers in a grid, yes/no items as one line of chips.
function cardsHTML(rs, cols) {
  const nums = cols.filter(k => FIELD[k].kind === 'num'), enums = cols.filter(k => FIELD[k].kind === 'enum'), txts = cols.filter(k => FIELD[k].kind !== 'num' && FIELD[k].kind !== 'enum');
  const cards = rs.map(({ b, assumed }) => {
    const on = S.sel.includes(b.id);
    return `<article class="ro-card${on ? ' sel' : ''}" data-id="${b.id}">
      <div class="ro-card-h">
        <div class="ro-card-t"><button type="button" class="ro-link ro-card-name" data-roopen="${b.id}">${esc(b.short)}</button>${assumedMark(assumed)}
          <span class="ro-card-sub">${esc(b.class_label)}</span></div>
        <label class="ro-pickl ro-pickl-card"><input type="checkbox" data-ropick="${b.id}" aria-label="Select ${esc(b.name)} to compare"${on ? ' checked' : ''}><span>Compare</span></label>
      </div>
      <div class="ro-card-meta"><span>${segCell(b)}</span><span class="ro-card-date">${b.doc_date ? fmtDate(b.doc_date, b.date_prec) : 'no date'} ${ageBadge(b.doc_date)}</span></div>
      ${nums.length ? `<dl class="ro-card-grid">${nums.map(k => `<div><dt>${esc(FIELD[k].short)}</dt><dd>${cellHTML(b, k)}</dd></div>`).join('')}</dl>` : ''}
      ${enums.length ? `<div class="ro-card-yn">${enums.map(k => `<span><em>${esc(FIELD[k].short)}</em> ${cellHTML(b, k)}</span>`).join('')}</div>` : ''}
      ${txts.length ? `<dl class="ro-card-txt">${txts.map(k => `<div><dt>${esc(FIELD[k].short)}</dt><dd>${cellHTML(b, k)}</dd></div>`).join('')}</dl>` : ''}
    </article>`;
  }).join('');
  return `<div class="ro-table-wrap ro-cards-wrap" id="ro-cards">${cards || '<p class="ro-empty">No bank matches every filter. Loosen one, or reset.</p>'}</div>`;
}
function sortBarHTML(cols) {
  const keys = ['name', 'seg', 'date', ...cols];
  const lab = k => SORT_LABEL[k] || FIELD[k].short;
  const cards = S.mview === 'cards';
  return `<div class="ro-sortbar">
      <label class="ro-sortsel"><span>Sort</span><select id="ro-sortsel" aria-label="Sort banks by">${keys.map(k => `<option value="${k}"${S.sortKey === k ? ' selected' : ''}>${esc(lab(k))}</option>`).join('')}${keys.includes(S.sortKey) ? '' : `<option value="${S.sortKey}" selected>${esc(lab(S.sortKey))}</option>`}</select></label>
      <button type="button" class="ro-btn ro-dirbtn" id="ro-sortdir" aria-label="Sort direction: ${S.sortDir === 1 ? 'low to high' : 'high to low'}. Tap to reverse." title="${S.sortDir === 1 ? 'Low to high' : 'High to low'}">${S.sortDir === 1 ? '▲' : '▼'}</button>
      <div class="ro-seg2" role="group" aria-label="Layout"><button type="button" class="ro-btn${cards ? ' on' : ''}" data-romview="cards" aria-pressed="${cards}">Cards</button><button type="button" class="ro-btn${cards ? '' : ' on'}" data-romview="table" aria-pressed="${!cards}">Table</button></div>
    </div>`;
}
function matrixHTML() {
  const rs = rows(), total = RO.data.banks.length, n = activeFilterCount();
  const cols = S.cols.filter(k => FIELD[k]);
  const mob = isMobile();
  return `<div class="ro-toolbar">
      <button type="button" class="ro-btn ro-filter-toggle" id="ro-ftoggle" aria-expanded="${S.filtersOpen}" aria-controls="ro-filterwrap">Filters${n ? ` (${n})` : ''}</button>
      ${colPickerHTML()}
      <span class="ro-count" id="ro-count" role="status">${rs.length} of ${total} banks</span>
      <span class="ro-hint">Tap a column to sort. Tick 2–4 banks to compare.</span>
    </div>
    ${mob ? sortBarHTML(cols) : ''}
    <div class="ro-filter-wrap${S.filtersOpen ? ' open' : ''}" id="ro-filterwrap" role="group" aria-label="Filters">
      <div class="ro-sheet-h"><b>Filters</b><button type="button" class="ro-btn primary" id="ro-fdone">Show ${rs.length} bank${rs.length === 1 ? '' : 's'}</button></div>
      ${filtersHTML()}
    </div>
    <div class="ro-backdrop${S.filtersOpen ? ' open' : ''}" id="ro-fbackdrop"></div>
    ${mob && S.mview === 'cards' ? cardsHTML(rs, cols) : tableHTML(rs, cols)}
    ${mob && S.mview === 'table' ? '<p class="ro-swipe" aria-hidden="true">Swipe the table sideways for more columns. Bank names stay put.</p>' : ''}
    <p class="ro-legend">— = <b>not stated</b> in the RouteOne sheet (not a no). <sup class="ro-flag inf">inf</sup> desk inference. <sup class="ro-flag verify">⚠</sup> conflict or uncertain read. Hover a value for the sheet's note. LTV columns show the highest published figure; the bank tab has the full grid. Advance bases differ: Fifth Third and PNC value on retail.</p>
    <div class="ro-comparebar${S.sel.length ? ' show' : ''}" id="ro-comparebar">
      <span id="ro-selcount">${S.sel.length} selected</span>
      <button type="button" class="ro-btn primary" id="ro-do-compare"${S.sel.length >= 2 ? '' : ' disabled'}>Compare side by side</button>
      <button type="button" class="ro-btn" id="ro-clear-sel">Clear</button>
    </div>`;
}
function noSheetHTML() {
  const ns = RO.data.no_sheet;
  return `<div class="ro-nslist" id="ro-nslist"${S.nsOpen ? '' : ' hidden'}><b>No program sheet on RouteOne (${ns.length}):</b>
    <ul>${ns.map(n => `<li>${esc(n.name)}</li>`).join('')}</ul>
    <p>RouteOne only lists forms for these lenders, so nothing was captured in the October pull.
    <button type="button" class="ro-link" data-roopen="__nosheet">Details</button></p></div>`;
}

// ── SIDE-BY-SIDE view ────────────────────────────────────────
const BUCKETS = [
  ['Credit', /credit|tiers/i], ['Advance / LTV', /advance|front-end|total ltv|structure/i], ['Term', /term/i],
  ['Vehicle', /vehicle/i], ['Back end', /back end/i], ['Dealer comp', /comp|rates/i],
];
function bucketOf(t) { for (const [n, re] of BUCKETS) if (re.test(t)) return n; return 'Other'; }
function compareHTML() {
  const picker = RO.data.banks.map(b => `<button type="button" class="ro-chip${S.sel.includes(b.id) ? ' on' : ''}" data-ropickchip="${b.id}" aria-pressed="${S.sel.includes(b.id)}">${esc(b.short)}</button>`).join('');
  const bs = S.sel.map(id => RO.byId[id]).filter(Boolean);
  let table = '<p class="ro-empty">Pick 2 to 4 banks above, or tick them in the matrix.</p>';
  if (bs.length >= 2) {
    const sameRow = k => new Set(bs.map(b => cellText(b, k))).size === 1;
    const glance = RO.data.fields.map(f => {
      const same = sameRow(f.key);
      if (S.hideSame && same) return '';
      return `<tr class="${same ? 'same' : ''}"><th scope="row">${f.label}</th>${bs.map(b => `<td>${cellHTML(b, f.key)}${val(b, f.key).n ? `<small>${esc(val(b, f.key).n)}</small>` : ''}</td>`).join('')}</tr>`;
    }).join('');
    const buckets = [...BUCKETS.map(x => x[0]), 'Other'];
    const notes = buckets.map(bk => {
      const cells = bs.map(b => b.sections.filter(s => bucketOf(s.title) === bk));
      if (cells.every(c => !c.length)) return '';
      return `<tr><th scope="row">${bk}</th>${cells.map(c => `<td class="ro-notes">${c.map(s => `<p><b>${esc(s.title)}.</b> ${rich(s.text)}</p>`).join('') || '<span class="ro-dash">—</span>'}</td>`).join('')}</tr>`;
    }).join('');
    table = `<div class="ro-table-wrap"><table class="ro-table ro-sbs">
      <thead><tr><th></th>${bs.map(b => `<th><button type="button" class="ro-link" data-roopen="${b.id}">${esc(b.name)}</button><small>${esc(b.class_label)}<br>Doc ${b.doc_date ? fmtDate(b.doc_date, b.date_prec) : 'no date'} ${ageBadge(b.doc_date)}</small></th>`).join('')}</tr></thead>
      <tbody><tr class="ro-grp"><th colspan="${bs.length + 1}">At a glance</th></tr>${glance}
      <tr class="ro-grp"><th colspan="${bs.length + 1}">Program notes from the sheets</th></tr>${notes}
      <tr><th scope="row">Best for</th>${bs.map(b => `<td class="ro-notes">${rich(b.best_for || '')}</td>`).join('')}</tr>
      <tr><th scope="row">Verify</th>${bs.map(b => `<td class="ro-notes">${b.verify.length ? b.verify.map(v => `<p class="ro-vfy">${rich(v)}</p>`).join('') : '<span class="ro-dash">—</span>'}</td>`).join('')}</tr>
      </tbody></table></div>`;
  }
  return `<div class="ro-toolbar"><span class="ro-hint">Pick 2 to 4 banks.</span>
      <label class="ro-f-unk"><input type="checkbox" id="ro-hidesame"${S.hideSame ? ' checked' : ''}> <span>Hide rows that match</span></label>
      <button type="button" class="ro-btn" id="ro-clear-sel">Clear</button></div>
    <div class="ro-chips ro-pickrow" role="group" aria-label="Banks to compare">${picker}</div>${table}`;
}
function cellText(b, k) {
  const f = field(k), v = val(b, k);
  if (f.kind === 'num') return v.none ? 'none' : (v.v == null ? '—' : UNIT[f.unit](v.v));
  return v.v || '—';
}

// ── BANK view (tab per bank; also used inside the Bank HUD) ───
function onFileHTML(b) {
  if (!b.existing_id || typeof LENDERS === 'undefined') return '';
  const l = LENDERS.find(x => x.id === b.existing_id);
  if (!l) return '';
  const g = (key) => { try { return cardLimit(l, key, '—').text; } catch (e) { return '—'; } };
  const rowsDef = [['Min FICO', g('fico_min'), 'min_fico'], ['Max term', g('max_term_months'), 'max_term'], ['Total LTV', g('ltv_total_max_pct'), 'max_total_ltv'],
    ['Front LTV', g('ltv_front_max_pct'), 'max_front_ltv'], ['Max mileage', g('max_mileage'), 'max_mileage'], ['GAP max', g('gap_max_usd'), 'gap_max']];
  const fileDate = l.source && l.source.date;
  const newer = fileDate && b.doc_date && b.doc_date > fileDate;
  const diff = newer ? Math.round((new Date(b.doc_date) - new Date(fileDate)) / 864e5) : 0;
  return `<section class="ro-sec"><h4>Already in LenderHub</h4>
    <p class="ro-meta">${esc(l.docTitle || '')} · effective ${esc(l.effectiveDate || '—')}${l.source && l.source.doc ? ' · ' + esc(l.source.doc) : ''}
      ${newer ? `<span class="ro-pill new">RouteOne sheet is ${diff} days newer</span>` : (fileDate && b.doc_date && b.doc_date < fileDate ? '<span class="ro-pill">On-file sheet is newer</span>' : '<span class="ro-pill same">Same sheet date</span>')}</p>
    <table class="ro-mini"><thead><tr><th></th><th>On file</th><th>RouteOne 10/15</th></tr></thead><tbody>
    ${rowsDef.map(([lab, onfile, k]) => `<tr><th scope="row">${lab}</th><td>${onfile}</td><td>${cellHTML(b, k)}</td></tr>`).join('')}
    </tbody></table>
    <p class="ro-meta">The on-file record is untouched. Where the two disagree, trust the newer dated sheet and confirm on the callback.</p></section>`;
}
function bankHTML(b, opts) {
  opts = opts || {};
  const groups = {};
  RO.data.fields.forEach(f => (groups[f.group] = groups[f.group] || []).push(f));
  const glance = Object.entries(groups).map(([g, fs]) => `<div class="ro-gg"><h5>${g}</h5>${fs.map(f => {
    const v = val(b, f.key);
    return `<div class="ro-gi"><span class="ro-gk">${f.label}</span><span class="ro-gv">${cellHTML(b, f.key)}</span>${v.n ? `<span class="ro-gn">${rich(v.n)}</span>` : ''}</div>`;
  }).join('')}</div>`).join('');
  const docs = b.docs.map(d => `<tr><td>${esc(d.title)}</td><td>${d.eff ? fmtDate(d.eff, b.date_prec) : 'no date'}</td><td>${rich(d.note || '')}<br><code>${esc(d.file)}</code></td></tr>`).join('');
  return `<div class="ro-bank">
    <div class="ro-bhead"><div><h3>${esc(b.name)}</h3>
      <p class="ro-meta">${rich(b.class_label)} · ${b.segments.length ? b.segments.map(s => SEG_TXT[s]).join(' / ') : 'no tier'} · Doc ${esc(b.doc_date_label)} ${ageBadge(b.doc_date)}</p></div>
      ${opts.embedded ? '' : (b.existing_id ? `<button type="button" class="ro-btn" data-rohud="${b.existing_id}">Open in Bank HUD</button>` : '<span class="ro-pill">Not yet in the HUD list</span>')}</div>
    ${b.verify.length ? `<div class="ro-warn"><b>Verify before quoting</b>${b.verify.map(v => `<p>${rich(v)}</p>`).join('')}</div>` : ''}
    <section class="ro-sec"><h4>At a glance</h4><div class="ro-glance">${glance}</div></section>
    <section class="ro-sec"><h4>Program notes</h4>${b.sections.map(s => `<div class="ro-note"><span class="ro-nk">${esc(s.title)}</span><span class="ro-nv">${rich(s.text)}</span></div>`).join('')}</section>
    ${b.best_for ? `<section class="ro-sec"><h4>Best for</h4><p>${rich(b.best_for)}</p></section>` : ''}
    <section class="ro-sec"><h4>Source documents (RouteOne, pulled ${esc(RO.data.meta.pulled)})</h4>
      <div class="ro-table-wrap"><table class="ro-mini ro-docs"><thead><tr><th>Document</th><th>Effective</th><th>Notes / file</th></tr></thead><tbody>${docs}</tbody></table></div></section>
    ${onFileHTML(b)}
    <p class="ro-meta ro-conf">${esc(RO.data.meta.confidentiality)}</p>
  </div>`;
}
function noSheetBankHTML(n, embedded) {
  const l = n.existing_id && typeof LENDERS !== 'undefined' ? LENDERS.find(x => x.id === n.existing_id) : null;
  return `<div class="ro-bank"><div class="ro-bhead"><div><h3>${esc(n.name)}</h3><p class="ro-meta">No program sheet on RouteOne</p></div></div>
    <p>${esc(n.note)} Nothing was captured for this lender in the October pull.</p>
    ${l ? `<p class="ro-meta">LenderHub already has ${embedded ? 'this record (open it on the other chips)' : 'an older record'}: ${esc(l.docTitle)} · effective ${esc(l.effectiveDate)}.</p>${embedded ? '' : `<button type="button" class="ro-btn" data-rohud="${n.existing_id}">Open in Bank HUD</button>`}` : ''}</div>`;
}
RO.bankHTML = function (existingId) {
  const b = RO.byExisting[existingId];
  if (b) return bankHTML(b, { embedded: true });
  const n = RO.noSheetByExisting[existingId];
  return n ? noSheetBankHTML(n, true) : '';
};
function banksHTML() {
  const bs = RO.data.banks;
  const cur = S.bank === '__nosheet' ? '__nosheet' : (S.bank && RO.byId[S.bank] ? S.bank : bs[0].id);
  S.bank = cur;
  const tabs = bs.map(b => `<button type="button" role="tab" class="ro-tab${b.id === cur ? ' on' : ''}" aria-selected="${b.id === cur}" data-roopen="${b.id}">${esc(b.short)}</button>`).join('') +
    `<button type="button" role="tab" class="ro-tab dim${cur === '__nosheet' ? ' on' : ''}" aria-selected="${cur === '__nosheet'}" data-roopen="__nosheet">No sheet (${RO.data.no_sheet.length})</button>`;
  const body = cur === '__nosheet'
    ? `<div class="ro-bank"><div class="ro-bhead"><h3>No program sheet on RouteOne</h3></div>${RO.data.no_sheet.map(n => noSheetBankHTML(n)).join('<hr>')}</div>`
    : bankHTML(RO.byId[cur]);
  return `<div class="ro-tabs" role="tablist" aria-label="Banks">${tabs}</div><div class="ro-tabbody" id="ro-tabbody">${body}</div>`;
}

// ── DESK GUIDE view ──────────────────────────────────────────
function guideHTML() {
  const d = RO.data;
  return `<div class="ro-guide">
    <section class="ro-sec"><h4>Read this first</h4><ul class="ro-ul">${d.read_first.map(t => `<li>${rich(t)}</li>`).join('')}</ul></section>
    <section class="ro-sec"><h4>Five-line takeaways</h4><ol class="ro-ol">${d.takeaways.map(t => `<li>${rich(t)}</li>`).join('')}</ol></section>
    <section class="ro-sec"><h4>Which bank for which customer</h4>
      <div class="ro-table-wrap"><table class="ro-table ro-guide-t"><thead><tr><th>Customer</th><th>Call first</th><th>Why (from the docs)</th><th>Watch out</th></tr></thead><tbody>
      ${d.guide.map(g => `<tr><th scope="row">${esc(g.customer)}</th><td data-l="Call first">${rich(g.call_first)}</td><td data-l="Why">${rich(g.why)}</td><td data-l="Watch out">${rich(g.watch)}</td></tr>`).join('')}
      </tbody></table></div></section>
    <section class="ro-sec"><h4>Flags: verify-worthy and conflicting</h4><ol class="ro-ol">${d.flags.map(t => `<li>${rich(t)}</li>`).join('')}</ol></section>
    <section class="ro-sec"><h4>Corrections to the earlier rough notes</h4><ul class="ro-ul">${d.corrections.map(t => `<li>${rich(t)}</li>`).join('')}</ul></section>
  </div>`;
}

// ── shell ────────────────────────────────────────────────────
function panelEl() {
  let p = q('#ro-panel');
  if (p) return p;
  p = document.createElement('div');
  p.id = 'ro-panel'; p.setAttribute('role', 'dialog'); p.setAttribute('aria-modal', 'true'); p.setAttribute('aria-label', 'Bank matrix'); p.hidden = true;
  document.body.appendChild(p);
  p.addEventListener('click', onClick);
  p.addEventListener('input', onInput);
  p.addEventListener('change', onInput);
  p.addEventListener('scroll', e => { if (e.target.classList && e.target.classList.contains('ro-scrollx')) fadeState(); }, true);
  return p;
}
function render() {
  const p = panelEl(), m = RO.data.meta;
  const tabs = [['matrix', 'Matrix'], ['compare', `Side by side${S.sel.length ? ' (' + S.sel.length + ')' : ''}`], ['banks', 'Bank tabs'], ['guide', 'Desk guide']];
  const scrollY = (q('.ro-main', p) || {}).scrollTop || 0;
  const total = RO.data.banks.length + RO.data.no_sheet.length;
  p.innerHTML = `<div class="ro-top"><div class="ro-toprow"><h2>Bank Matrix</h2><button type="button" class="readout-close" id="ro-close">Close</button></div>
      <p class="ro-desc" id="ro-desc">Compare lender programs side by side. Source: RouteOne rate sheets &amp; program guides pulled ${esc(fmtShort(m.pulled))}.</p>
      <div class="ro-cov"><span id="ro-cov">${RO.data.banks.length} of ${total} RouteOne lenders have program sheets</span>
        <button type="button" class="ro-btn ro-nsbtn" id="ro-nsbtn" aria-expanded="${S.nsOpen}" aria-controls="ro-nslist">No sheet (${RO.data.no_sheet.length}) <i>${S.nsOpen ? '▴' : '▾'}</i></button></div>
      ${noSheetHTML()}</div>
    <div class="ro-nav" role="tablist">${tabs.map(([k, l]) => `<button type="button" role="tab" class="ro-nt${S.tab === k ? ' on' : ''}" aria-selected="${S.tab === k}" data-rotab="${k}">${l}</button>`).join('')}</div>
    <div class="ro-main">${S.tab === 'matrix' ? matrixHTML() : S.tab === 'compare' ? compareHTML() : S.tab === 'banks' ? banksHTML() : guideHTML()}</div>`;
  const main = q('.ro-main', p); if (main && scrollY) main.scrollTop = scrollY;
  fadeState();
  const on = q('.ro-tab.on', p); if (on && on.scrollIntoView) { const st = on.parentElement; if (st) st.scrollLeft = Math.max(0, on.offsetLeft - 16); }
}
// matrix-only partial refresh keeps input focus (and the open filter sheet) while typing in filters
const PARTS = ['.ro-table-wrap', '.ro-count', '.ro-comparebar', '.ro-filter-toggle', '.ro-sortbar', '#ro-fdone', '.ro-swipe'];
function refreshMatrix() {
  const p = panelEl();
  if (!q('.ro-table-wrap', p)) return render();
  const tmp = document.createElement('div'); tmp.innerHTML = matrixHTML();
  PARTS.forEach(sel => {
    const a = q(sel, p), b = q(sel, tmp);
    if (a && b) a.replaceWith(b); else if (!a && b && sel === '.ro-swipe') q('.ro-table-wrap', p).after(b); else if (a && !b) a.remove();
  });
  fadeState();
  qa('.ro-nt', p).forEach(b => { if (b.dataset.rotab === 'compare') b.textContent = `Side by side${S.sel.length ? ' (' + S.sel.length + ')' : ''}`; });
}
function fadeState() {
  qa('.ro-scrollx', panelEl()).forEach(w => {
    const end = w.scrollLeft + w.clientWidth >= w.scrollWidth - 4;
    if (w.parentElement) w.parentElement.classList.toggle('at-end', end);
  });
}
function setTab(t) { S.tab = t; render(); const m = q('.ro-main', panelEl()); if (m) m.scrollTop = 0; }
function openBank(id) { S.bank = id; S.tab = 'banks'; render(); const m = q('.ro-main', panelEl()); if (m) m.scrollTop = 0; }
function toggleSel(id, quiet) {
  const i = S.sel.indexOf(id);
  if (i >= 0) S.sel.splice(i, 1);
  else if (S.sel.length >= 4) { if (!quiet) flash('Four banks at most. Untick one first.'); return false; }
  else S.sel.push(id);
  return true;
}
function flash(msg) {
  const p = panelEl(); let t = q('.ro-flash', p);
  if (!t) { t = document.createElement('div'); t.className = 'ro-flash'; t.setAttribute('role', 'status'); p.appendChild(t); }
  t.textContent = msg; t.classList.add('show'); clearTimeout(flash._t); flash._t = setTimeout(() => t.classList.remove('show'), 2400);
}

function onClick(e) {
  const t = e.target;
  let el;
  if ((el = t.closest('#ro-close'))) return close();
  if ((el = t.closest('[data-rosort]'))) {
    const k = el.dataset.rosort;
    if (S.sortKey === k) S.sortDir = -S.sortDir;
    else { S.sortKey = k; const f = FIELD[k]; S.sortDir = (f && f.better === 'high') || k === 'date' ? -1 : 1; }
    save(); return refreshMatrix();
  }
  if ((el = t.closest('[data-roseg]'))) {
    const s = el.dataset.roseg, i = S.f.seg.indexOf(s);
    if (i >= 0) S.f.seg.splice(i, 1); else S.f.seg.push(s);
    el.classList.toggle('on', i < 0); el.setAttribute('aria-pressed', String(i < 0));
    save(); return refreshMatrix();
  }
  if ((el = t.closest('[data-roopen]'))) { if (el.dataset.rotab) S.tab = 'banks'; return openBank(el.dataset.roopen); }
  if ((el = t.closest('[data-rotab]'))) return setTab(el.dataset.rotab);
  if ((el = t.closest('[data-rohud]'))) { const id = el.dataset.rohud; close(); if (typeof showView === 'function') showView('lender', id); return; }
  if ((el = t.closest('[data-ropickchip]'))) { const ok = toggleSel(el.dataset.ropickchip, true); render(); if (!ok) flash('Four banks at most. Untick one first.'); return; }
  if (t.closest('#ro-nsbtn')) { S.nsOpen = !S.nsOpen; return render(); }
  if (t.closest('#ro-ftoggle')) { return setFilters(!S.filtersOpen); }
  if (t.closest('#ro-fdone') || t.closest('#ro-fbackdrop')) return setFilters(false);
  if (t.closest('#ro-sortdir')) { S.sortDir = -S.sortDir; save(); return refreshMatrix(); }
  if ((el = t.closest('[data-romview]'))) { S.mview = el.dataset.romview; save(); return render(); }
  if (t.closest('#ro-cols-done')) { const d = q('.ro-cols', panelEl()); if (d) d.open = false; return; }
  if (t.closest('#ro-reset')) {
    const unk = true; S.f = { text: '', seg: [], fico: '', term: '', miles: '', ltv: '', income: '', pti: '', amt: '', unk, bk: '', repo: '', cosigner: '', business: '', selfemp: '', itin: '', term84: '' };
    save(); return render();
  }
  if (t.closest('#ro-cols-reset')) { S.cols = DEFAULT_COLS.slice(); save(); return render(); }
  if (t.closest('#ro-do-compare')) return setTab('compare');
  if (t.closest('#ro-clear-sel')) { S.sel = []; return render(); }
}
function setFilters(on) {
  S.filtersOpen = on;
  const p = panelEl(), w = q('.ro-filter-wrap', p), bd = q('.ro-backdrop', p), b = q('#ro-ftoggle', p);
  if (w) w.classList.toggle('open', on); if (bd) bd.classList.toggle('open', on); if (b) b.setAttribute('aria-expanded', String(on));
  if (!on && b && isMobile()) b.focus();
}
function onInput(e) {
  const t = e.target;
  if (t.id === 'ro-sortsel') {
    const k = t.value; if (S.sortKey !== k) { S.sortKey = k; const f = FIELD[k]; S.sortDir = (f && f.better === 'high') || k === 'date' ? -1 : 1; }
    save(); return refreshMatrix();
  }
  if (t.dataset.ropick) {
    if (!toggleSel(t.dataset.ropick)) t.checked = false;
    return refreshMatrix();
  }
  if (t.dataset.rocol) {
    const k = t.dataset.rocol, i = S.cols.indexOf(k);
    if (t.checked && i < 0) S.cols.push(k); else if (!t.checked && i >= 0) S.cols.splice(i, 1);
    // keep the catalogue order
    S.cols = RO.data.fields.map(f => f.key).filter(x => S.cols.includes(x));
    save(); return refreshMatrix();
  }
  if (t.id === 'ro-hidesame') { S.hideSame = t.checked; return render(); }
  if (t.dataset.rof) {
    const k = t.dataset.rof;
    S.f[k] = t.type === 'checkbox' ? t.checked : t.value;
    save();
    refreshMatrixKeepFocus();
  }
}
function refreshMatrixKeepFocus() { refreshMatrix(); }

function open(tab) {
  if (!RO.ready) return;
  const p = panelEl();
  if (tab) S.tab = tab;
  S.open = true; render(); p.hidden = false; p.removeAttribute('hidden');
  document.body.classList.add('ro-lock');
  const m = q('.ro-main', p); if (m) m.scrollTop = 0;
  const c = q('#ro-close', p); if (c) c.focus();
}
function close() {
  const p = q('#ro-panel'); if (!p) return;
  S.open = false; p.hidden = true; p.setAttribute('hidden', '');
  document.body.classList.remove('ro-lock');
  const b = q('#ro-open-btn'); if (b) b.focus();
}
RO.open = tab => open(typeof tab === 'string' ? tab : 'matrix'); RO.close = close; RO._state = S;

// Esc closes the panel first (capture phase so index.html's own Esc handler doesn't also fire)
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && S.open) {
    e.preventDefault(); e.stopPropagation();
    if (S.filtersOpen && isMobile()) return setFilters(false);
    close();
  }
}, true);

// ── boot ─────────────────────────────────────────────────────
async function boot() {
  try {
    const res = await fetch('lenders-routeone.json', { cache: 'no-cache' });
    if (!res.ok) return;                        // absent on a public deploy: stay invisible
    const data = await res.json();
    if (!data || !Array.isArray(data.banks) || !data.banks.length) return;
    index(data); load(); RO.ready = true;
    const btn = q('#ro-open-btn');
    if (btn) { btn.hidden = false; btn.removeAttribute('hidden'); btn.addEventListener('click', () => open('matrix')); }
    const inl = q('#ro-open-inline');
    if (inl) { inl.hidden = false; inl.removeAttribute('hidden'); inl.addEventListener('click', () => open('matrix'));
      const c = q('#ro-inline-count'); if (c) c.textContent = `Compare all ${data.banks.length} banks side by side`; }
  } catch (err) { console.warn('RouteOne layer not loaded:', err); }
}
if (MQ.addEventListener) MQ.addEventListener('change', () => { if (RO.ready && S.open) render(); });
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
