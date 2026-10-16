#!/usr/bin/env python3
"""Headless check of the Bank Matrix (desktop + 390px and 360px phone). Run: python3 -m http.server 8765 (in repo root) then python3 tools/test_routeone.py"""
import json, sys, os
from playwright.sync_api import sync_playwright
BASE = os.environ.get('LH_BASE', 'http://127.0.0.1:8765/index.html')   # LH_BASE=https://lender-hub.vercel.app/index.html to test production
ROOT = os.path.join(os.path.dirname(__file__), '..')
D = json.load(open(os.path.join(ROOT, 'lenders-routeone.json')))
SHOTS = os.path.join(ROOT, '_shots'); os.makedirs(SHOTS, exist_ok=True)
fails = []; passes = 0
def check(name, cond, extra=''):
    global passes
    if cond: passes += 1; print('PASS', name)
    else: fails.append(name); print('FAIL', name, extra)

def names(page):  # visible bank order in matrix
    return page.eval_on_selector_all('#ro-table tbody tr[data-id]', 'els => els.map(e => e.dataset.id)')

def sortval(b, k, asc):
    v = b['cmp'].get(k, {})
    if v.get('none'): return float('inf')
    return v.get('v')

with sync_playwright() as p:
    br = p.chromium.launch(channel='chrome', headless=True)
    ctx = br.new_context(viewport={'width': 1280, 'height': 860})
    page = ctx.new_page()
    errs = []
    page.on('pageerror', lambda e: errs.append(str(e)))
    page.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'fonts.g' not in m.text and 'ERR_' not in m.text and 'Failed to load resource' not in m.text else None)
    page.route('**/fonts.googleapis.com/**', lambda r: r.abort()); page.route('**/fonts.gstatic.com/**', lambda r: r.abort())
    page.goto(BASE); page.wait_for_selector('#lh-list .rank-row', timeout=10000)
    check('existing app still renders its ranked list', page.locator('#lh-list .rank-row').count() >= 10, page.locator('#lh-list .rank-row').count())
    page.wait_for_selector('#ro-open-btn:not([hidden])', timeout=5000)
    check('Matrix button visible after data loads', page.locator('#ro-open-btn').is_visible())

    # ---- matrix
    page.click('#ro-open-btn'); page.wait_for_selector('#ro-table')
    check('matrix shows 15 banks', len(names(page)) == 15, len(names(page)))
    page.screenshot(path=f'{SHOTS}/1-matrix-desktop.png')

    # sort: min_fico asc (first click on a 'low is better' column)
    page.click('[data-rosort="min_fico"]')
    order = names(page)
    stated = [b for b in D['banks'] if sortval(b, 'min_fico', 1) is not None]
    exp = sorted(stated, key=lambda b: (sortval(b, 'min_fico', 1), b['name']))
    check('sort min FICO asc: stated banks first, ascending', order[:len(exp)] == [b['id'] for b in exp], order[:len(exp)])
    check('sort min FICO asc: unstated banks last', set(order[len(exp):]) == {b['id'] for b in D['banks'] if sortval(b, 'min_fico', 1) is None})
    check('aria-sort ascending set', page.locator('th[aria-sort="ascending"]').count() == 1)
    page.click('[data-rosort="min_fico"]')
    order2 = names(page)
    exp2 = sorted(stated, key=lambda b: (-sortval(b, 'min_fico', 1), b['name']))
    check('sort min FICO desc reverses stated banks', order2[:len(exp2)] == [b['id'] for b in exp2], order2[:len(exp2)])
    # max term (high is better: first click = desc)
    page.click('[data-rosort="max_term"]')
    o = names(page)
    top = [b for b in D['banks'] if b['cmp']['max_term'].get('v') == 84]
    check('sort max term: 84-month banks first', all(i in {b['id'] for b in top} for i in o[:len(top)]), o[:len(top)])
    # text sort by name
    page.click('[data-rosort="name"]')
    o = names(page)
    check('sort by bank name asc', o == [b['id'] for b in sorted(D['banks'], key=lambda b: b['name'].lower())], o)
    # total LTV desc
    page.click('[data-rosort="max_total_ltv"]')
    o = names(page)
    check('sort total LTV: Capital One (175) first', o[0] == 'capitalone', o[:3])

    # ---- filters
    page.click('#ro-ftoggle')
    page.select_option('select[data-rof="bk"]', 'yes')
    o = set(names(page)); exp = {b['id'] for b in D['banks'] if b['cmp']['bk'].get('v') in ('yes', 'cond')}
    check('filter takes bankruptcy (yes/cond)', o == exp, (sorted(o), sorted(exp)))
    page.select_option('select[data-rof="bk"]', '')
    page.select_option('select[data-rof="cosigner"]', 'ok')
    o = set(names(page))
    check('filter co-signer "not a stated no" drops US Bank only', o == {b['id'] for b in D['banks']} - {'usbank'}, sorted({b['id'] for b in D['banks']} - o))
    page.select_option('select[data-rof="cosigner"]', '')
    page.select_option('select[data-rof="business"]', 'yes')
    o = set(names(page)); exp = {b['id'] for b in D['banks'] if b['cmp']['business'].get('v') in ('yes', 'cond')}
    check('filter business-titled yes/cond', o == exp, (sorted(o), sorted(exp)))
    check('business filter excludes PNC and Fifth Third', not ({'pnc', 'fifththird'} & o))
    page.select_option('select[data-rof="business"]', '')
    page.select_option('select[data-rof="term"]', '84')
    page.uncheck('input[data-rof="unk"]')
    o = set(names(page)); exp = {b['id'] for b in D['banks'] if b['cmp']['max_term'].get('v', 0) >= 84}
    check('max term >=84, unstated excluded (strict)', o == exp, (sorted(o), sorted(exp)))
    check('strict mode excludes Westlake (term not stated) and GLS (78)', not ({'westlake', 'gls'} & o))
    page.check('input[data-rof="unk"]')
    o = set(names(page))
    check('lenient mode adds Westlake back and marks it ?', 'westlake' in o and page.locator('tr[data-id="westlake"] .ro-q').count() == 1, sorted(o))
    page.select_option('select[data-rof="term"]', '')
    page.fill('input[data-rof="fico"]', '600')
    o = set(names(page)); exp = {b['id'] for b in D['banks'] if (b['cmp']['min_fico'].get('v') is None or b['cmp']['min_fico']['v'] <= 600)}
    check('customer FICO 600 keeps only banks with floor <=600 or unstated', o == exp, (sorted(o), sorted(exp)))
    check('FICO 600 drops BoA, US Bank, Truist, Fifth Third', not ({'bofa', 'usbank', 'truist', 'fifththird'} & o))
    page.fill('input[data-rof="fico"]', '')
    page.click("#ro-panel [data-roseg=sub]")
    o = set(names(page)); exp = {b['id'] for b in D['banks'] if 'sub' in b['segments']}
    check('tier chip Subprime', o == exp, sorted(o))
    page.click("#ro-panel [data-roseg=sub]")
    page.click('#ro-reset')
    check('reset restores 15', len(names(page)) == 15)
    page.fill('input[data-rof="text"]', 'wells')
    check('name search', names(page) == ['wellsfargo'], names(page))
    page.fill('input[data-rof="text"]', '')

    # column picker
    page.click('.ro-cols summary')
    page.check('input[data-rocol="backend_max_usd"]')
    check('column picker adds Back end column', page.locator('#ro-table thead th', has_text='Back end').count() == 1)
    ls = page.evaluate("localStorage.getItem('lenderhub.ro.v1')")
    check('column choice remembered in localStorage', 'backend_max_usd' in (ls or ''))
    page.click('.ro-cols summary')

    # ---- selection + side by side
    page.click('[data-rosort="name"]')
    ids = ['ally', 'bofa', 'td', 'usbank']
    for i in ids[:3]: page.check(f'input[data-ropick="{i}"]')
    check('compare bar shows 3 selected', '3 selected' in page.inner_text('#ro-comparebar'))
    page.click('#ro-do-compare'); page.wait_for_selector('.ro-sbs')
    check('side-by-side has 3 bank columns', page.locator('.ro-sbs thead th').count() == 4)
    check('side-by-side lists every glance field', page.locator('.ro-sbs tbody tr:not(.ro-grp)').count() >= len(D['fields']))
    page.screenshot(path=f'{SHOTS}/2-sidebyside-desktop.png')
    page.click('[data-ropickchip="usbank"]')
    page.click('[data-ropickchip="pnc"]')
    check('4th bank allowed', page.locator('.ro-sbs thead th').count() == 5)
    page.click('[data-ropickchip="gls"]')
    check('5th bank refused', page.locator('.ro-sbs thead th').count() == 5 and page.locator('.ro-flash.show').count() == 1)
    page.check('#ro-hidesame')
    check('hide matching rows reduces rows', page.locator('.ro-sbs tbody tr.same').count() == 0)
    page.click('#ro-clear-sel')

    # ---- bank tabs
    page.click('[data-rotab="banks"]'); page.wait_for_selector('.ro-tab')
    check('tab strip has 15 banks + no-sheet tab', page.locator('.ro-tab').count() == 16)
    for b in D['banks']:
        page.click(f'.ro-tab[data-roopen="{b["id"]}"]')
        h = page.inner_text('.ro-bank h3')
        ok = h == b['name'] and page.locator('.ro-docs tbody tr').count() == len(b['docs']) and page.locator('.ro-note').count() == len(b['sections'])
        check(f'bank tab {b["id"]}: heading, {len(b["docs"])} docs, {len(b["sections"])} note rows', ok, h)
    page.click('.ro-tab[data-roopen="ally"]')
    check('Ally tab shows the conflict flag + verify box', page.locator('.ro-warn').count() == 1 and page.locator('.ro-flag.verify').count() >= 1)
    check('Ally tab shows "Already in LenderHub" comparison', 'already in lenderhub' in page.inner_text('.ro-bank').lower() and '&ndash;' not in page.inner_text('.ro-bank'))
    page.click('.ro-tab[data-roopen="__nosheet"]')
    t = page.inner_text('.ro-bank')
    check('no-sheet tab lists all 7', all(n['name'] in t for n in D['no_sheet']))
    page.click('[data-rotab="guide"]')
    check('desk guide shows 12 customer rows', page.locator('.ro-guide-t tbody tr').count() == 12)
    page.screenshot(path=f'{SHOTS}/3-guide-desktop.png')
    page.click('[data-rotab="banks"]'); page.click('.ro-tab[data-roopen="bofa"]')
    page.screenshot(path=f'{SHOTS}/4-banktab-desktop.png', full_page=False)

    # Esc closes only the panel
    page.keyboard.press('Escape')
    check('Esc closes the matrix', page.locator('#ro-panel').is_hidden())
    page.keyboard.press('m')
    check("'m' shortcut opens the matrix", page.locator('#ro-panel').is_visible())
    page.keyboard.press('Escape')

    # ---- HUD chip
    page.click('#lh-list .rank-row[data-id="truist"]')
    page.wait_for_selector('#readout .hud-chips')
    chips = page.inner_text('#readout .hud-chips')
    check('Bank HUD has the RouteOne chip', 'RouteOne 10/15' in chips, chips)
    page.click('#readout .lh-tb[data-sec="__ro"]')
    check('HUD chip renders Truist RouteOne data', 'Greater of 20% of collateral' in page.inner_text('#readout-pane') or 'Max reserve $8,000' in page.inner_text('#readout-pane'))
    page.screenshot(path=f'{SHOTS}/5-hud-chip.png')
    page.click('#lh-list .rank-row[data-id="exeter"]'); page.click('#readout .lh-tb[data-sec="__ro"]')
    check('no-sheet lender chip says so (Exeter)', 'No program sheet on RouteOne' in page.inner_text('#readout-pane'))
    # old chips still work
    page.click('#lh-list .rank-row[data-id="ally"]')
    page.click('#readout .lh-tb >> nth=0')
    check('existing LTV chip still renders', len(page.inner_text('#readout-pane')) > 50)

    # ---- dark theme
    page.click('#theme-toggle'); page.click('#ro-open-btn'); page.wait_for_selector('#ro-table')
    page.screenshot(path=f'{SHOTS}/6-matrix-dark.png')
    page.keyboard.press('Escape'); page.click('#theme-toggle')
    check('no JS errors (desktop)', not errs, errs[:3])
    # header: one-line description + coverage + tap-to-open no-sheet list (desktop)
    page.keyboard.press('m'); page.wait_for_selector('#ro-desc')
    d = page.inner_text('#ro-desc')
    check('matrix header has the one-line description with source + pull date', d.startswith('Compare lender programs side by side.') and 'RouteOne rate sheets & program guides pulled 10/15/2026' in d, d)
    check('header says 15 of 22 RouteOne lenders have program sheets', page.inner_text('#ro-cov') == '15 of 22 RouteOne lenders have program sheets', page.inner_text('#ro-cov'))
    check('no-sheet list hidden until tapped', page.locator('#ro-nslist').is_hidden())
    page.click('#ro-nsbtn')
    check('No sheet (7) opens the list with all 7 lenders', page.locator('#ro-nslist li').count() == 7 and all(n['name'] in page.inner_text('#ro-nslist') for n in D['no_sheet']))
    page.click('#ro-nsbtn')
    check('No sheet (7) toggles closed again', page.locator('#ro-nslist').is_hidden())
    page.keyboard.press('Escape')
    # theme: remembered, defaults to system
    page.evaluate("localStorage.removeItem('lenderhub.theme')")
    page.click('#theme-toggle'); t1 = page.evaluate("document.documentElement.dataset.theme")
    page.reload(); page.wait_for_selector('#lh-list .rank-row')
    check('desktop theme choice survives reload (localStorage)', page.evaluate("document.documentElement.dataset.theme") == t1 == 'dark' and page.evaluate("localStorage.getItem('lenderhub.theme')") == 'dark')
    ctx.close()

    # ---- mobile (390 and 360)
    LABEL = "button, select, summary, input:not([type=checkbox]):not([type=hidden]), label.ro-pickl, label.ro-f-unk, label.fails-toggle"
    SMALL_JS = """(scope) => [...document.querySelectorAll(scope + ' ' + '%s'.split(', ').join(', ' + scope + ' '))].filter(e => {
        const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
        return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden';
      }).filter(e => { const r = e.getBoundingClientRect(); return Math.min(r.width, r.height) < 43.5; })
      .map(e => (e.tagName + '.' + (e.className || e.id || '') + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height)).slice(0, 60))""" % LABEL
    def small(page, scope): return page.evaluate(SMALL_JS, scope)
    def overflow(page): return page.evaluate('document.documentElement.scrollWidth - window.innerWidth')

    for W in (390, 360):
        tag = f'mobile {W}'
        ctx = br.new_context(viewport={'width': W, 'height': 780}, device_scale_factor=2, has_touch=True, is_mobile=True)
        page = ctx.new_page(); errs = []
        page.on('pageerror', lambda e: errs.append(str(e)))
        page.route('**/fonts.g*/**', lambda r: r.abort())
        page.goto(BASE); page.wait_for_selector('#ro-open-btn:not([hidden])', timeout=8000)
        # -- home / top bar / bottom bar
        check(f'{tag}: home has no horizontal overflow', overflow(page) <= 1, overflow(page))
        check(f'{tag}: home tap targets >= 44px (top bar, deal form, chips, dock)', not small(page, '#header, .deal, #rank, .desk-tools'), small(page, '#header, .deal, #rank, .desk-tools'))
        check(f'{tag}: theme toggle visible and 44px', page.locator('#theme-toggle').is_visible() and min(page.locator('#theme-toggle').bounding_box()['width'], page.locator('#theme-toggle').bounding_box()['height']) >= 44)
        check(f'{tag}: deal form no longer pins to the top (not sticky)', page.evaluate("getComputedStyle(document.querySelector('.deal')).position") == 'static')
        fs = page.evaluate("[...document.querySelectorAll('#lh-search, .deal input, .deal select')].map(e => getComputedStyle(e).fontSize)")
        check(f'{tag}: search + deal fields are 16px (no iOS zoom)', all(f == '16px' for f in fs), fs)
        rr = page.evaluate("[...document.querySelectorAll('#lh-list .rank-row')].map(e => e.getBoundingClientRect().height)")
        check(f'{tag}: lender rows >= 44px tall', rr and min(rr) >= 44, min(rr) if rr else None)
        db = page.evaluate("(() => { const d = document.querySelector('.desk-tools'); return [d.scrollWidth > d.clientWidth, d.getBoundingClientRect().right <= window.innerWidth + 1, d.getBoundingClientRect().left >= 0]; })()")
        check(f'{tag}: bottom dock stays inside the screen and scrolls if it must', db[1] and db[2], db)
        check(f'{tag}: viewport-fit=cover + safe-area padding present', 'viewport-fit=cover' in page.evaluate("document.querySelector('meta[name=viewport]').content") and 'safe-area-inset-bottom' in open(os.path.join(ROOT, 'index.html')).read())
        inl = page.locator('#ro-open-inline')
        check(f'{tag}: inline Bank Matrix entry visible, 44px+', inl.is_visible() and inl.bounding_box()['height'] >= 44)
        page.tap('#ro-open-inline'); page.wait_for_selector('.ro-main .ro-toolbar')
        # -- header: description, coverage, no-sheet list
        d = page.inner_text('#ro-desc')
        check(f'{tag}: description readable (>=12px) and complete', d.startswith('Compare lender programs side by side.') and 'pulled 10/15/2026' in d and page.evaluate("parseFloat(getComputedStyle(document.querySelector('#ro-desc')).fontSize)") >= 12, d)
        check(f'{tag}: header says 15 of 22 lenders have sheets', page.inner_text('#ro-cov') == '15 of 22 RouteOne lenders have program sheets')
        page.tap('#ro-nsbtn'); page.wait_for_selector('#ro-nslist:not([hidden])')
        rb = page.evaluate("(() => { const r = document.querySelector('#ro-nslist').getBoundingClientRect(); return [r.left, r.right, r.bottom, window.innerWidth, window.innerHeight]; })()")
        check(f'{tag}: No sheet (7) list opens on tap, lists 7, fits the screen', page.locator('#ro-nslist li').count() == 7 and rb[0] >= 0 and rb[1] <= rb[3] + 1 and rb[2] <= rb[4], rb)
        check(f'{tag}: No sheet list taps are 44px', not small(page, '#ro-nslist'), small(page, '#ro-nslist'))
        page.screenshot(path=f'{SHOTS}/m{W}-nosheet.png')
        page.tap('#ro-nsbtn'); check(f'{tag}: No sheet list closes', page.locator('#ro-nslist').is_hidden())
        # -- matrix as cards
        check(f'{tag}: matrix shows 15 cards by default', page.locator('.ro-card').count() == 15, page.locator('.ro-card').count())
        check(f'{tag}: matrix panel no page overflow', overflow(page) <= 1, overflow(page))
        check(f'{tag}: matrix tap targets >= 44px', not small(page, '#ro-panel'), small(page, '#ro-panel'))
        page.screenshot(path=f'{SHOTS}/m{W}-matrix-cards.png')
        # sort dropdown + direction
        page.select_option('#ro-sortsel', 'max_term')
        first = page.eval_on_selector('.ro-card', 'e => e.dataset.id')
        check(f'{tag}: sort dropdown by max term puts an 84-month bank first', D['banks'][[b['id'] for b in D['banks']].index(first)]['cmp']['max_term'].get('v') == 84, first)
        page.tap('#ro-sortdir')
        ids = page.eval_on_selector_all('.ro-card', 'els => els.map(e => e.dataset.id)')
        lows = [b['cmp']['max_term'].get('v') for b in D['banks'] if b['id'] == ids[0]]
        check(f'{tag}: direction button flips the sort (lowest term first)', lows and lows[0] is not None and lows[0] < 84, (ids[0], lows))
        page.select_option('#ro-sortsel', 'name')
        check(f'{tag}: sort by name returns A to Z', page.eval_on_selector_all('.ro-card', 'els => els.map(e => e.dataset.id)') == [b['id'] for b in sorted(D['banks'], key=lambda b: b['name'].lower())])
        # -- filters sheet
        page.tap('#ro-ftoggle'); page.wait_for_selector('.ro-filter-wrap.open')
        sh = page.evaluate("(() => { const r = document.querySelector('.ro-filter-wrap').getBoundingClientRect(); return [r.left, r.right, r.bottom, window.innerWidth, window.innerHeight, getComputedStyle(document.querySelector('.ro-filter-wrap')).position]; })()")
        check(f'{tag}: Filters opens a bottom sheet inside the screen', sh[5] == 'fixed' and sh[0] >= 0 and sh[1] <= sh[3] + 1 and abs(sh[2] - sh[4]) <= 1, sh)
        check(f'{tag}: filter sheet tap targets >= 44px and fields 16px', not small(page, '.ro-filter-wrap') and page.evaluate("[...document.querySelectorAll('.ro-filter-wrap input:not([type=checkbox]), .ro-filter-wrap select')].every(e => getComputedStyle(e).fontSize === '16px')"), small(page, '.ro-filter-wrap'))
        page.screenshot(path=f'{SHOTS}/m{W}-filters-sheet.png')
        page.select_option('select[data-rof="cosigner"]', 'ok')
        check(f'{tag}: sheet button shows live count', page.inner_text('#ro-fdone') == 'Show 14 banks', page.inner_text('#ro-fdone'))
        page.tap('[data-roseg=sub]')
        check(f'{tag}: tier chip works inside the sheet without closing it', page.locator('.ro-filter-wrap.open').count() == 1 and page.locator('.ro-card').count() < 14)
        page.tap('#ro-fdone')
        check(f'{tag}: Done closes the sheet; Filters shows (2)', page.locator('.ro-filter-wrap.open').count() == 0 and 'Filters (2)' in page.inner_text('#ro-ftoggle'), page.inner_text('#ro-ftoggle'))
        page.tap('#ro-ftoggle'); page.tap('#ro-reset'); page.tap('#ro-fbackdrop', position={'x': 20, 'y': 20})
        check(f'{tag}: reset + tapping outside closes the sheet; 15 cards back', page.locator('.ro-filter-wrap.open').count() == 0 and page.locator('.ro-card').count() == 15)
        # column picker sheet
        page.tap('.ro-cols summary'); page.wait_for_selector('.ro-cols-pop', state='visible')
        cp = page.evaluate("(() => { const r = document.querySelector('.ro-cols-pop').getBoundingClientRect(); return [r.left, r.right, r.bottom, window.innerWidth, window.innerHeight]; })()")
        check(f'{tag}: Columns opens a sheet inside the screen with 44px rows', cp[0] >= 0 and cp[1] <= cp[3] + 1 and cp[2] <= cp[4] + 1 and not small(page, '.ro-cols-pop'), (cp, small(page, '.ro-cols-pop')))
        page.tap('#ro-cols-done'); check(f'{tag}: Columns Done closes it', not page.locator('.ro-cols-pop').is_visible())
        # -- table view with pinned bank column
        page.tap('[data-romview=table]'); page.wait_for_selector('#ro-table')
        check(f'{tag}: table view no page overflow', overflow(page) <= 1, overflow(page))
        wrap = page.evaluate("(() => { const w = document.querySelector('.ro-table-wrap'); return [w.scrollWidth, w.clientWidth]; })()")
        check(f'{tag}: table scrolls inside its own box', wrap[0] > wrap[1], wrap)
        check(f'{tag}: table tap targets >= 44px', not small(page, '#ro-panel'), small(page, '#ro-panel'))
        x0 = page.evaluate("document.querySelector('.ro-table tbody .ro-bankcell').getBoundingClientRect().left")
        page.evaluate("document.querySelector('.ro-table-wrap').scrollLeft = 300")
        page.wait_for_timeout(120)
        x1 = page.evaluate("document.querySelector('.ro-table tbody .ro-bankcell').getBoundingClientRect().left")
        check(f'{tag}: bank column stays pinned while scrolling sideways', abs(x0 - x1) <= 1 and page.evaluate("document.querySelector('.ro-table-wrap').scrollLeft") > 100, (x0, x1))
        check(f'{tag}: scroll affordance (fade) shown until the end', page.evaluate("getComputedStyle(document.querySelector('.ro-xwrap'), '::after').opacity") == '1' and page.locator('.ro-swipe').count() == 1)
        page.evaluate("document.querySelector('.ro-table-wrap').scrollLeft = 99999"); page.wait_for_timeout(150)
        check(f'{tag}: fade disappears at the end', page.evaluate("document.querySelector('.ro-xwrap').classList.contains('at-end')"))
        page.screenshot(path=f'{SHOTS}/m{W}-matrix-table.png')
        page.tap('[data-rosort="max_term"]')
        check(f'{tag}: header sort works in table view', page.locator('th[aria-sort="descending"]').count() + page.locator('th[aria-sort="ascending"]').count() == 1)
        page.tap('[data-romview=cards]')
        # -- compare
        page.tap('input[data-ropick="ally"]'); page.tap('input[data-ropick="chase"]')
        cb = page.evaluate("(() => { const r = document.querySelector('#ro-comparebar').getBoundingClientRect(); return [r.left, r.right, r.bottom, window.innerWidth, window.innerHeight]; })()")
        check(f'{tag}: compare bar visible, full width, above the bottom edge', cb[0] >= 0 and cb[1] <= cb[3] and cb[2] <= cb[4] and not small(page, '#ro-comparebar'), cb)
        page.tap('#ro-do-compare'); page.wait_for_selector('.ro-sbs')
        check(f'{tag}: side-by-side no page overflow', overflow(page) <= 1, overflow(page))
        check(f'{tag}: side-by-side tap targets >= 44px', not small(page, '#ro-panel'), small(page, '#ro-panel'))
        sbs = page.evaluate("(() => { const w = document.querySelector('.ro-table-wrap'); return [w.scrollWidth, w.clientWidth]; })()")
        check(f'{tag}: side-by-side scrolls inside its box', sbs[0] > sbs[1], sbs)
        pk = page.evaluate("(() => { const e = document.querySelector('.ro-pickrow'); return [e.scrollWidth > e.clientWidth, getComputedStyle(e).flexWrap]; })()")
        check(f'{tag}: bank picker is a single scrollable row', pk[0] and pk[1] == 'nowrap', pk)
        page.screenshot(path=f'{SHOTS}/m{W}-sidebyside.png')
        # -- bank tabs
        page.tap('[data-rotab="banks"]'); page.wait_for_selector('.ro-tab')
        tb = page.evaluate("(() => { const t = document.querySelector('.ro-tabs'); return [t.scrollWidth, t.clientWidth, getComputedStyle(t).position, Math.min(...[...t.children].map(c => c.getBoundingClientRect().height))]; })()")
        check(f'{tag}: bank tabs are a scrollable pill row, 44px tall, pinned', tb[0] > tb[1] and tb[2] == 'sticky' and tb[3] >= 44, tb)
        check(f'{tag}: bank tab tap targets >= 44px', not small(page, '#ro-panel'), small(page, '#ro-panel'))
        page.tap('.ro-tab[data-roopen="td"]')
        check(f'{tag}: tapping a pill opens that bank', 'TD' in page.inner_text('.ro-bank h3') and page.locator('.ro-tab.on').count() == 1, page.inner_text('.ro-bank h3'))
        check(f'{tag}: bank tab no page overflow', overflow(page) <= 1, overflow(page))
        page.tap('.ro-tab[data-roopen="__nosheet"]')
        check(f'{tag}: the "No sheet (7)" pill is reachable and lists all 7', all(n['name'] in page.inner_text('.ro-tabbody') for n in D['no_sheet']))
        page.tap('.ro-tab[data-roopen="santander"]'); page.screenshot(path=f'{SHOTS}/m{W}-banktab.png')
        docs = page.evaluate("(() => { const w = document.querySelector('.ro-docs').closest('.ro-table-wrap'); return getComputedStyle(w).overflowX; })()")
        check(f'{tag}: documents table scrolls instead of overflowing the page', docs in ('auto', 'scroll') and overflow(page) <= 1, docs)
        # -- guide
        page.tap('[data-rotab="guide"]')
        check(f'{tag}: guide no page overflow', overflow(page) <= 1, overflow(page))
        check(f'{tag}: guide shows 12 customer cards', page.locator('.ro-guide-t tbody tr').count() == 12)
        page.screenshot(path=f'{SHOTS}/m{W}-guide.png')
        # -- Esc closes sheet first
        page.tap('[data-rotab="matrix"]'); page.tap('#ro-ftoggle'); page.keyboard.press('Escape')
        check(f'{tag}: Esc closes the filter sheet before the panel', page.locator('.ro-filter-wrap.open').count() == 0 and page.locator('#ro-panel').is_visible())
        page.tap('#ro-close')
        check(f'{tag}: Close returns to the app', page.locator('#ro-panel').is_hidden() and overflow(page) <= 1)
        check(f'{tag}: no JS errors', not errs, errs[:3])
        ctx.close()

    # ---- theme: remembers the choice, defaults to the phone's setting
    for scheme, first, second in (('dark', 'dark', 'paper'), ('light', 'paper', 'dark')):
        ctx = br.new_context(viewport={'width': 390, 'height': 780}, is_mobile=True, has_touch=True, color_scheme=scheme)
        page = ctx.new_page(); page.route('**/fonts.g*/**', lambda r: r.abort())
        page.goto(BASE); page.wait_for_selector('#lh-list .rank-row')
        th = lambda: page.evaluate("document.documentElement.dataset.theme")
        check(f'theme: first visit follows phone setting ({scheme})', th() == first and page.evaluate("localStorage.getItem('lenderhub.theme')") is None, th())
        page.tap('#theme-toggle')
        check(f'theme: toggle visible and flips ({scheme} -> {second})', th() == second and page.evaluate("localStorage.getItem('lenderhub.theme')") == second)
        page.reload(); page.wait_for_selector('#lh-list .rank-row')
        check(f'theme: choice survives reload even though phone says {scheme}', th() == second, th())
        page.tap('#ro-open-btn'); page.wait_for_selector('#ro-panel:not([hidden])')
        pb = page.evaluate("getComputedStyle(document.querySelector('#ro-panel')).backgroundColor")
        lum = sum(int(x) for x in pb[pb.index('(') + 1:-1].split(',')[:3])
        check(f'theme: Bank Matrix follows the saved theme ({second})', th() == second and ((lum < 200) if second == 'dark' else (lum > 600)), (pb, th()))
        if second == 'dark': page.screenshot(path=f'{SHOTS}/m390-matrix-dark.png')
        ctx.close()
    br.close()

print(f'\n{passes} passed, {len(fails)} failed')
if fails: print('FAILED:', fails); sys.exit(1)
