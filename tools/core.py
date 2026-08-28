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

# Each numeric predicate names the deal field it reads. Added 2026-08-28:
# book_value (capitalone keys its LTV to book, not amount financed) and
# mileage (amcredit's 135% needs <= 50,000 miles).
NUMERIC = {'term_months_gte': 'term_months', 'term_months_lte': 'term_months',
           'amount_financed_gte': 'amount_financed', 'amount_financed_lte': 'amount_financed',
           'book_value_gte': 'book_value', 'book_value_lte': 'book_value',
           'mileage_gte': 'mileage', 'mileage_lte': 'mileage'}
EXACT = {'state', 'program', 'tier', 'vehicle_condition'}
PREDICATES = set(NUMERIC) | EXACT

LIMIT_KEYS = ['max_term_months', 'max_mileage', 'max_vehicle_age_yr',
              'ltv_front_max_pct', 'ltv_total_max_pct',
              'min_amount_financed', 'max_amount_financed', 'gap_max_usd']


def _match(when, deal):
    """Every predicate must hold. A predicate the deal cannot answer does not
    hold — so an unknown deal falls back to the base value rather than
    inheriting a better one it may not qualify for."""
    for k, want in when.items():
        if k in NUMERIC:
            got = deal.get(NUMERIC[k])
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
                   ('amount_financed_gte', 'amount_financed_lte'),
                   ('book_value_gte', 'book_value_lte'),
                   ('mileage_gte', 'mileage_lte')):
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

    # --- the other 18, added 2026-08-28 ---
    # capitalone keys LTV to BOOK VALUE, not amount financed
    ('capitalone', 'ltv_total_max_pct', {'book_value': 30000}, 150),
    ('capitalone', 'ltv_total_max_pct', {'book_value': 8000}, 175),
    ('capitalone', 'ltv_total_max_pct', {}, 150),
    ('capitalone', 'ltv_front_max_pct', {'book_value': 20000, 'program': 'Non-Prime'}, 130),
    ('capitalone', 'ltv_front_max_pct', {'book_value': 30000, 'program': 'Non-Prime'}, 120),
    # amcredit's 135% needs a used vehicle under 50,000 miles
    ('amcredit', 'ltv_total_max_pct', {'vehicle_condition': 'used', 'mileage': 40000}, 135),
    ('amcredit', 'ltv_total_max_pct', {'vehicle_condition': 'used', 'mileage': 60000}, 125),
    ('amcredit', 'ltv_total_max_pct', {'vehicle_condition': 'new'}, 125),
    ('amcredit', 'ltv_total_max_pct', {}, 125),
    # santander drops mileage and age hard at 84 months
    ('santander', 'max_mileage', {'term_months': 72}, 150000),
    ('santander', 'max_mileage', {'term_months': 84}, 60000),
    ('santander', 'max_vehicle_age_yr', {'term_months': 72}, 12),
    ('santander', 'max_vehicle_age_yr', {'term_months': 84}, 5),
    ('santander', 'ltv_total_max_pct', {'term_months': 75}, 145),
    ('santander', 'ltv_total_max_pct', {'term_months': 84}, 120),
    # bofa: both caps step at 76 months
    ('bofa', 'ltv_total_max_pct', {'term_months': 60}, 145),
    ('bofa', 'ltv_total_max_pct', {'term_months': 84}, 125),
    ('bofa', 'ltv_front_max_pct', {'term_months': 60}, 130),
    ('bofa', 'min_amount_financed', {'term_months': 84}, 25000),
    ('bofa', 'max_vehicle_age_yr', {'term_months': 84}, 4),
    ('bofa', 'gap_max_usd', {'state': 'NY'}, 225),
    ('bofa', 'gap_max_usd', {'state': 'TX'}, None),
    ('bofa', 'gap_max_usd', {}, 1500),
    # usbank / wellsfargo: one step each, in opposite directions of the boundary
    ('usbank', 'ltv_total_max_pct', {'term_months': 72}, 145),
    ('usbank', 'ltv_total_max_pct', {'term_months': 84}, 120),
    ('wellsfargo', 'ltv_total_max_pct', {'term_months': 72}, 135),
    ('wellsfargo', 'ltv_total_max_pct', {'term_months': 84}, 120),
    # dfc: 13 tiers x new/used
    ('dfc', 'ltv_total_max_pct', {'tier': 'P0', 'vehicle_condition': 'new'}, 135),
    ('dfc', 'ltv_total_max_pct', {'tier': 'P5', 'vehicle_condition': 'used'}, 125),
    ('dfc', 'ltv_total_max_pct', {'tier': 'P11', 'vehicle_condition': 'used'}, 110),
    ('dfc', 'ltv_total_max_pct', {}, 110),
    ('dfc', 'max_term_months', {'tier': 'P9', 'vehicle_condition': 'new'}, 60),
    ('dfc', 'ltv_front_max_pct', {'tier': 'P0', 'vehicle_condition': 'new'}, 120),
    # regional publishes a front cap only -- total must stay unknown
    ('regional', 'ltv_front_max_pct', {'tier': 'Tier 1'}, 125),
    ('regional', 'ltv_front_max_pct', {'tier': 'Tier 7'}, 110),
    ('regional', 'ltv_front_max_pct', {}, 110),
    ('regional', 'ltv_total_max_pct', {}, None),
    ('westlake', 'ltv_total_max_pct', {}, None),
    # pnc's front-end grid; total is flat
    ('pnc', 'ltv_front_max_pct', {'tier': 'Tier 0 (800+)', 'vehicle_condition': 'new', 'term_months': 60}, 125),
    ('pnc', 'ltv_front_max_pct', {'tier': 'Tier 0 (800+)', 'vehicle_condition': 'new', 'term_months': 84}, 115),
    ('pnc', 'ltv_front_max_pct', {'tier': 'Tier 3 (700-724)', 'vehicle_condition': 'new', 'term_months': 60}, 110),
    ('pnc', 'ltv_total_max_pct', {'term_months': 84}, 140),
    # ally: the 84-month tier matrix, and 140% stays unresolved without a tier
    ('ally', 'ltv_total_max_pct', {'tier': 'S Tier', 'term_months': 84, 'vehicle_condition': 'new'}, 135),
    ('ally', 'ltv_total_max_pct', {'tier': 'B Tier', 'term_months': 84, 'vehicle_condition': 'used'}, 115),
    ('ally', 'ltv_total_max_pct', {}, 105),
    ('ally', 'max_mileage', {'term_months': 84}, 75000),
    ('ally', 'max_mileage', {'term_months': 60}, 150000),
    ('ally', 'min_amount_financed', {'term_months': 84}, 20000),
    # unresolved exceptions never apply on their own
    ('td', 'ltv_total_max_pct', {}, 110),
    ('kia', 'ltv_total_max_pct', {}, 105),
    ('exeter', 'max_term_months', {}, 60),
    # simple prose-stated caps
    ('chase', 'ltv_total_max_pct', {}, 150),
    ('gls', 'ltv_total_max_pct', {}, 140),
    ('gls', 'ltv_front_max_pct', {}, 130),
    ('flagship', 'ltv_total_max_pct', {}, 150),
    ('fifththird', 'ltv_total_max_pct', {}, 140),
    ('fifththird', 'ltv_front_max_pct', {}, 115),
    ('exeter', 'ltv_total_max_pct', {}, 150),

    # --- values carried forward from the 2026-08-26 sweep, added 2026-08-28.
    # The typed core had dropped these, and because every record now has a core
    # the string fallback in lenderLimit() can no longer cover for it.
    ('regional', 'max_mileage', {}, 130000),
    ('td', 'max_mileage', {}, 120000),
    ('wellsfargo', 'max_mileage', {}, 150000),
    ('fifththird', 'max_mileage', {}, 140000),
    ('gls', 'max_mileage', {}, 180000),
    ('capitalone', 'max_mileage', {}, 200000),
    ('chase', 'max_mileage', {}, 120000),
    ('dfc', 'max_mileage', {}, 175000),
    ('usbank', 'max_mileage', {}, 125000),
    ('westlake', 'max_mileage', {}, 150000),
    ('amcredit', 'fico_min', {}, 500),
    ('fifththird', 'fico_min', {}, 650),
    ('gls', 'fico_min', {}, 400),
    ('usbank', 'fico_min', {}, 675),
    ('regional', 'max_term_months', {}, 84),
    ('capitalone', 'max_term_months', {}, 84),
    ('td', 'max_term_months', {}, 72),      # unresolved 84 must not apply on its own
    ('kia', 'max_mileage', {}, None),       # sheet says N/A - stays unknown

    # --- corrections found by rendering the cards from the core, 2026-08-28 ---
    # ally's 620 is the prime threshold; the same sheet buys non-prime below it
    ('ally', 'fico_min', {}, 520),
    ('ally', 'fico_min', {'program': 'Prime'}, 620),
    ('ally', 'gap_max_usd', {}, 1500),
    ('ally', 'gap_max_usd', {'book_value': 90000}, 2000),
    ('westlake', 'fico_min', {}, None),     # 700 was a rate band, not a floor
    ('td', 'gap_max_usd', {}, 1500),
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
