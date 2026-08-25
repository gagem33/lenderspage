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

    python3 tools/pdf_triage.py FILE.pdf [--render] [--dpi 200] [--out DIR]
"""
import sys, re, os, argparse

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

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('pdf')
    ap.add_argument('--render', action='store_true', help='write a PNG per page')
    ap.add_argument('--dpi', type=int, default=200)
    ap.add_argument('--out', default='pages')
    a = ap.parse_args()

    doc = pymupdf.open(a.pdf)
    stem = os.path.splitext(os.path.basename(a.pdf))[0]
    verdicts = []
    print(f'{stem}  --  {doc.page_count} page(s)')
    for i, pg in enumerate(doc, 1):
        text = pg.get_text()
        v, why = classify(text, len(pg.get_images()))
        verdicts.append(v)
        print(f'  page {i}: {v:<10} {why}')
        if a.render or v != 'TEXT_OK':
            os.makedirs(a.out, exist_ok=True)
            p = f'{a.out}/{stem}_p{i}.png'
            pg.get_pixmap(dpi=a.dpi).save(p)
            print(f'           rendered -> {p}')

    worst = ('IMAGE_ONLY' if 'IMAGE_ONLY' in verdicts else
             'MOJIBAKE'   if 'MOJIBAKE'   in verdicts else
             'PARTIAL'    if 'PARTIAL'    in verdicts else 'TEXT_OK')
    print(f'  VERDICT: {worst}')
    if worst != 'TEXT_OK':
        print('  -> Read the rendered images. Do NOT quote this text layer.')
    return 0

if __name__ == '__main__':
    sys.exit(main())
