#!/usr/bin/env python3
"""Typed core (v2) — validate and resolve.

DATA.md §2 defines the shape. This is the reference implementation of the
resolution rule; `resolveLimit()` in index.html mirrors it and the two are kept
identical by `core.py selftest`, which runs the same cases both would see.

  core.py validate            check every record that carries a core
  core.py resolve <id> <key> [k=v ...]    what a limit resolves to for a deal
  core.py selftest            the cases the JS must agree with
"""
import json, sys, os, itertools

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LENDERS = os.path.join(ROOT, 'lenders.json')

NUMERIC = {'term_months_gte', 'term_months_lte',
           'amount_financed_gte', 'amount_financed_lte'}
EXACT = {'state', 'program', 'tier', 'vehicle_condition'}
PREDICATES = NUMERIC | EXACT

LIMIT_KEYS = ['max_term_months', 'max_mileage', 'max_vehicle_age_yr',
              'ltv_front_max_pct', 'ltv_total_max_pct',
              'min_amount_financed', 'max_amount_financed', 'gap_max_usd']


def _match(when, deal):
    """Every predicate must hold. A predicate the deal cannot answer does not
    hold — so an unknown deal falls back to the base value rather than
    inheriting a better one it may not qualify for."""
    for k, want in when.items():
        if k in NUMERIC:
            got = deal.get('term_months') if k.startswith('term') else deal.get('amount_financed')
            if got is None:
                return False
            if k.endswith('_gte') and got < want: return False
            if k.endswith('_lte') and got > want: return False
        else:
            got = deal.get(k)
            if got is None or str(got) != str(want):
                return False
    return True


def resolve(limit, deal):
    """-> (value, why). value None means 'not published' or 'unknown here'."""
    if limit is None:
        return None, 'no typed limit'
    best, why = limit.get('value'), 'base'
    hits = []
    for e in limit.get('except', []):
        if e.get('unresolved'):
            continue                      # value published, condition is not
        if _match(e.get('when', {}), deal):
            hits.append(e)
    if hits:
        # More than one match means overlapping bands, which `validate` warns
        # about. Take the lowest: understating costs a resubmit, overstating
        # costs a funding decline.
        vals = [h for h in hits if h.get('value') is not None]
        if not vals:
            return None, 'condition met but the sheet gives no number'
        pick = min(vals, key=lambda h: h['value'])
        best, why = pick['value'], json.dumps(pick['when'], sort_keys=True)
    return best, why


def _overlap(a, b):
    """Could one deal satisfy both exceptions?"""
    for k in EXACT:
        if k in a and k in b and a[k] != b[k]:
            return False
        if (k in a) != (k in b):
            return False          # one is scoped to a program/tier, the other is not
    for lo, hi in (('term_months_gte', 'term_months_lte'),
                   ('amount_financed_gte', 'amount_financed_lte')):
        a0, a1 = a.get(lo, float('-inf')), a.get(hi, float('inf'))
        b0, b1 = b.get(lo, float('-inf')), b.get(hi, float('inf'))
        if a1 < b0 or b1 < a0:
            return False
    return True


def validate(records):
    errs, warns = [], []
    for r in records:
        core = r.get('core')
        if not core:
            continue
        lid = r['id']
        if core.get('schema') != 1:
            errs.append(f'{lid}: schema must be 1')
        p = core.get('provenance') or {}
        for f in ('drive_file_id', 'effective_date', 'pages'):
            if not p.get(f):
                errs.append(f'{lid}: provenance.{f} missing — DATA.md §3.5')
        if p.get('effective_date') != (r.get('source') or {}).get('date'):
            warns.append(f'{lid}: core effective_date {p.get("effective_date")} '
                         f'!= source.date {(r.get("source") or {}).get("date")}')
        limits = core.get('limits') or {}
        for k in LIMIT_KEYS:
            if k not in limits:
                errs.append(f'{lid}: limits.{k} missing')
        for k, lim in list(limits.items()) + [('credit.fico_min', (core.get('credit') or {}).get('fico_min'))]:
            if lim is None:
                continue
            if 'value' not in lim or 'except' not in lim:
                errs.append(f'{lid}.{k}: needs value and except')
                continue
            whens = []
            for e in lim['except']:
                w = e.get('when', {})
                bad = set(w) - PREDICATES
                if bad:
                    errs.append(f'{lid}.{k}: unknown predicate(s) {sorted(bad)}')
                if 'value' not in e:
                    errs.append(f'{lid}.{k}: exception without a value')
                if not w and not e.get('unresolved'):
                    errs.append(f'{lid}.{k}: empty `when` would always apply — '
                                f'mark it unresolved or give it a condition')
                if w and not e.get('unresolved'):
                    whens.append(w)
            for a, b in itertools.combinations(whens, 2):
                if _overlap(a, b):
                    warns.append(f'{lid}.{k}: exceptions can both match — {a} / {b}')
        rates = core.get('rates') or {}
        if rates.get('basis') not in ('grid', 'floor', 'none'):
            errs.append(f'{lid}: rates.basis must be grid|floor|none')
        if rates.get('basis') == 'floor' and rates.get('floor_apr_pct') is None:
            errs.append(f'{lid}: rates.basis is floor but no floor_apr_pct')
        if rates.get('basis') == 'grid' and not rates.get('grid_section'):
            errs.append(f'{lid}: rates.basis is grid but no grid_section')
    return errs, warns


CASES = [
    # (lender, limit, deal, expected)
    ('truist', 'ltv_total_max_pct', {}, 130),
    ('truist', 'ltv_total_max_pct', {'tier': 'T1 (A1)', 'term_months': 72}, 155),
    ('truist', 'ltv_total_max_pct', {'tier': 'T1 (A1)', 'term_months': 84}, 140),
    ('truist', 'ltv_total_max_pct', {'tier': 'T6 (C1)', 'term_months': 72}, 130),
    ('truist', 'ltv_total_max_pct', {'term_months': 72}, 130),
    ('truist', 'ltv_front_max_pct', {'tier': 'T1 (A1)', 'term_months': 60}, 130),
    ('truist', 'max_mileage', {'term_months': 72}, 120000),
    ('truist', 'max_mileage', {'term_months': 84}, 50000),
    ('truist', 'max_mileage', {}, 120000),
    ('truist', 'gap_max_usd', {}, 1200),
    ('truist', 'gap_max_usd', {'state': 'TX'}, None),
    ('cps', 'max_mileage', {'term_months': 24}, 200000),
    ('cps', 'max_mileage', {'term_months': 72}, 100000),
    ('cps', 'max_mileage', {'term_months': 78}, 60000),
    ('cps', 'max_mileage', {'term_months': 84, 'program': 'ICON+'}, 80000),
    ('cps', 'ltv_total_max_pct', {}, 115),
    ('cps', 'ltv_total_max_pct', {'program': 'ICON+'}, 140),
    ('cps', 'max_term_months', {}, 78),
    ('cps', 'max_term_months', {'program': 'ICON+'}, 84),
    ('cps', 'gap_max_usd', {'program': 'ICON+'}, 1200),
]


def _limit(rec, key):
    if key == 'fico_min':
        return (rec['core'].get('credit') or {}).get('fico_min')
    return (rec['core'].get('limits') or {}).get(key)


def selftest(records):
    by = {r['id']: r for r in records}
    bad = 0
    for lid, key, deal, want in CASES:
        got, why = resolve(_limit(by[lid], key), deal)
        flag = 'ok ' if got == want else 'FAIL'
        if got != want: bad += 1
        print(f'  {flag} {lid}.{key} {deal} -> {got} (want {want}) [{why}]')
    return bad


def main():
    records = json.load(open(LENDERS, encoding='utf-8'))
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'validate'
    if cmd == 'validate':
        errs, warns = validate(records)
        n = sum(1 for r in records if r.get('core'))
        for w in warns: print('WARN ', w)
        for e in errs:  print('ERROR', e)
        print(f'{n}/{len(records)} records carry a typed core; '
              f'{len(errs)} errors, {len(warns)} warnings')
        return 1 if errs else 0
    if cmd == 'selftest':
        bad = selftest(records)
        print(f'{len(CASES) - bad}/{len(CASES)} cases pass')
        return 1 if bad else 0
    if cmd == 'resolve':
        lid, key = sys.argv[2], sys.argv[3]
        deal = {}
        for kv in sys.argv[4:]:
            k, v = kv.split('=', 1)
            deal[k] = int(v) if v.lstrip('-').isdigit() else v
        rec = {r['id']: r for r in records}[lid]
        val, why = resolve(_limit(rec, key), deal)
        print(f'{lid}.{key} for {deal} -> {val}   [{why}]')
        return 0
    print(__doc__)
    return 2


if __name__ == '__main__':
    sys.exit(main())
