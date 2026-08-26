#!/usr/bin/env python3
"""Classify a lender PDF's text layer, and render its pages to PNG.

Why this exists: the 2026-08-22 audit trusted PDF text layers. Two of them lied.

  Ally 84-month sheet   190 chars of bullets and checkmarks across a full page
                        of program terms. Nothing readable. The audit gave up
                        and filed the whole lender under UNVERIFIABLE.

  Truist program sheet  the text layer is a substitution cipher -- the PDF uses
                        a custom font encoding. "Max amount financed for GAP"
                        comes out as "CWn Wcekdj \\_dWdY[Z \\eh =7F". This is the
                        dangerous one: it returns something that looks like
                        text, so a reader can "quote" it and still be wrong.
                        Truist's state-by-state GAP rules never made it into
                        the app because of this.

Rendering the page and reading it as an image solves both. This script decides
which pages need that, and produces them.

    python3 tools/pdf_triage.py FILE.pdf  [--render] [--dpi 200] [--out DIR]
    python3 tools/pdf_triage.py DIR/      [--json triage.json]

Point it at a directory to sweep the whole corpus. Anything that is not
TEXT_OK gets rendered automatically; the summary at the end lists the files
and page numbers to go look at.
"""
import sys, re, os, glob, json, argparse

try:
    import pymupdf
except ImportError:
    sys.exit("pymupdf missing:  pip install pymupdf")

# Words that appear in essentially any English lender document. If a page has
# plenty of text but almost none of these, the text layer is not English.
COMMON = re.compile(r'\b(the|and|or|of|to|for|is|are|not|with|be|must|may|from|'
                    r'all|any|per|will|which|that|value|amount|term|max|maximum|'
                    r'minimum|vehicle|credit|dealer|loan|rate)\b', re.I)

# Signatures of a mis-decoded text layer: backslash-bracket pairs, numeric
# entities, control characters, and long runs with no vowels.
WEIRD = re.compile(r'\\[\[\]_^]|&#\d+;|[\x00-\x08\x0b\x0c\x0e-\x1f]')
NOVOWEL = re.compile(r'\b[bcdfghjklmnpqrstvwxz]{5,}\b', re.I)

def classify(text, n_images):
    """Bias: false positives are cheap, false negatives are not.

    Wrongly rendering a page that was fine costs one image. Wrongly trusting a
    text layer that lied puts a bad number in front of the desk. Every
    threshold here leans toward "render it and look"."""
    t = text.strip()
    n = len(t)
    # A real page of lender program terms runs thousands of characters. A few
    # hundred means the content is in the images and all you have is a footer.
    # The Ally 84-month sheet lands here: 190 chars, 112 images -- and those 190
    # chars are the copyright line, which is fluent English and passes every
    # word-frequency test. Length has to be checked before quality.
    if n < 400 or (n_images > 20 and n < 1500):
        return 'IMAGE_ONLY', f'{n} chars of text, {n_images} images -- content is graphical'
    words = re.findall(r'[A-Za-z]{2,}', t)
    hits  = len(COMMON.findall(t))
    rate  = hits / max(len(words), 1)
    weird = len(WEIRD.findall(t)) + len(NOVOWEL.findall(t))
    wrate = weird / max(n / 1000, 1)          # per 1k chars
    if rate < 0.02 or wrate > 40:
        return 'MOJIBAKE', f'{rate:.1%} common-word rate, {weird} corrupt sequences -- text layer is not readable English'
    if rate < 0.06 or wrate > 8:
        return 'PARTIAL', f'{rate:.1%} common-word rate, {weird} corrupt sequences -- parts of this page are mis-encoded'
    return 'TEXT_OK', f'{rate:.1%} common-word rate, {weird} corrupt sequences'

def triage(path, out, dpi, render_all):
    """Triage one PDF. Returns (stem, page_count, worst, per_page, rendered)."""
    doc  = pymupdf.open(path)
    stem = os.path.splitext(os.path.basename(path))[0]
    per_page, rendered = [], []
    for i, pg in enumerate(doc, 1):
        v, why = classify(pg.get_text(), len(pg.get_images()))
        per_page.append({'page': i, 'verdict': v, 'why': why})
        if render_all or v != 'TEXT_OK':
            os.makedirs(out, exist_ok=True)
            p = f'{out}/{stem}_p{i}.png'
            pg.get_pixmap(dpi=dpi).save(p)
            rendered.append(p)
    seen = [p['verdict'] for p in per_page]
    worst = next((v for v in ('IMAGE_ONLY', 'MOJIBAKE', 'PARTIAL') if v in seen),
                 'TEXT_OK')
    return stem, doc.page_count, worst, per_page, rendered


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('pdf', help='a PDF, or a directory of PDFs to sweep')
    ap.add_argument('--render', action='store_true', help='write a PNG per page')
    ap.add_argument('--dpi', type=int, default=200)
    ap.add_argument('--out', default='pages')
    ap.add_argument('--json', help='write the full result to this path')
    a = ap.parse_args()

    if os.path.isdir(a.pdf):
        # .PDF as well as .pdf -- AmeriCredit's export is uppercase, and a
        # case-sensitive glob silently dropped it the first time this ran.
        targets = sorted(f for f in glob.glob(os.path.join(a.pdf, '*'))
                         if f.lower().endswith('.pdf'))
        if not targets:
            sys.exit(f'no PDFs in {a.pdf}')
    else:
        targets = [a.pdf]

    results = []
    for t in targets:
        stem, pages, worst, per_page, rendered = triage(t, a.out, a.dpi, a.render)
        results.append({'file': stem, 'pages': pages, 'verdict': worst,
                        'per_page': per_page, 'rendered': rendered})
        if len(targets) == 1:
            print(f'{stem}  --  {pages} page(s)')
            for p in per_page:
                print(f"  page {p['page']}: {p['verdict']:<10} {p['why']}")
            for r in rendered:
                print(f'  rendered -> {r}')
            print(f'  VERDICT: {worst}')
            if worst != 'TEXT_OK':
                print('  -> Read the rendered images. Do NOT quote this text layer.')

    if len(targets) > 1:
        bad = [r for r in results if r['verdict'] != 'TEXT_OK']
        if bad:
            print('FILES NEEDING A RENDER\n')
            for r in bad:
                pp = [p['page'] for p in r['per_page'] if p['verdict'] != 'TEXT_OK']
                print(f"  {r['file'][:44]:<46}{r['verdict']:<12}"
                      f"pages {pp} of {r['pages']}")
            print()
        npages = sum(r['pages'] for r in results)
        nrend  = sum(len(r['rendered']) for r in results)
        print(f'{len(results)} files triaged, {npages} pages')
        for v in ('IMAGE_ONLY', 'MOJIBAKE', 'PARTIAL', 'TEXT_OK'):
            n = sum(1 for r in results if r['verdict'] == v)
            if n:
                print(f'  {v:<12}{n} file(s)')
        print(f'  pages needing a render: {nrend} of {npages} '
              f'({nrend * 100 // max(npages, 1)}%)')

    if a.json:
        with open(a.json, 'w') as f:
            json.dump(results, f, indent=1)
        print(f'wrote {a.json}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
