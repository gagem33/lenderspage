#!/usr/bin/env python3
"""Check that a proposal's HTML is well-formed before it is ever applied.

The extraction step edits `sections.*.content`, which is raw HTML, by string
surgery. The realistic failure mode is not a wrong number -- `sync.py diff`
shows those -- it is an unbalanced <div> that silently swallows the rest of a
lender's page at render time. A browser will not complain; it will just show
less.

This parses every proposed value, checks tag balance and nesting, and counts the
rows and table cells on each side of the change so a transcription can be
verified against the page it came from.

    python3 tools/check_proposal.py sync/proposals/FILE.json
"""
import sys, os, json, argparse
from html.parser import HTMLParser

VOID = {'br', 'hr', 'img', 'input', 'meta', 'link', 'source', 'col'}


class Balance(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack, self.errors = [], []

    def handle_starttag(self, tag, attrs):
        if tag not in VOID:
            self.stack.append(tag)

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        if not self.stack:
            self.errors.append(f'</{tag}> with nothing open')
        elif self.stack[-1] != tag:
            self.errors.append(f'</{tag}> closes <{self.stack[-1]}>')
            if tag in self.stack:
                while self.stack and self.stack.pop() != tag:
                    pass
        else:
            self.stack.pop()

    def finish(self):
        if self.stack:
            self.errors.append('never closed: ' + ', '.join(f'<{t}>' for t in reversed(self.stack)))
        return self.errors


def shape(html):
    return {
        'rows':   html.count('class="info-row"'),
        'cells':  html.count('<td>'),
        'tables': html.count('<table'),
    }


def check(path):
    with open(path, encoding='utf-8') as f:
        p = json.load(f)
    bad = 0
    print(f'{p["lender_id"]}  ({len(p.get("changes", []))} change(s))\n')
    for i, ch in enumerate(p.get('changes', [])):
        label = '.'.join(map(str, ch.get('path', [])))
        new = ch.get('new')
        old_v = ch.get('old')
        # A change can add a whole section object ({icon, label, content}) rather
        # than edit an HTML string. Check the content inside it.
        if isinstance(new, dict):
            missing = [k for k in ('icon', 'label', 'content') if k not in new]
            if missing:
                bad += 1
                print(f'  [{i}] {label}  INCOMPLETE SECTION -- missing {", ".join(missing)}')
                continue
            new = new['content']
            old_v = old_v['content'] if isinstance(old_v, dict) else (old_v or '')
            label += ' (new section)'
        if not isinstance(new, str) or '<' not in new:
            print(f'  [{i}] {label}: not HTML, skipped')
            continue
        b = Balance()
        b.feed(new)
        errs = b.finish()
        a, z = shape(old_v or ''), shape(new)
        delta = (f"rows {a['rows']}->{z['rows']}  cells {a['cells']}->{z['cells']}  "
                 f"tables {a['tables']}->{z['tables']}")
        if errs:
            bad += 1
            print(f'  [{i}] {label}  MALFORMED')
            for e in errs:
                print(f'        {e}')
        else:
            print(f'  [{i}] {label}  ok   {delta}')
        if z['rows'] < a['rows'] or z['cells'] < a['cells']:
            print(f'        NOTE: this change removes rows or cells -- intended?')
    print()
    if bad:
        print(f'{bad} change(s) would render broken HTML.')
        return 1
    print('All proposed HTML is well-formed.')
    return 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('proposal', nargs='+')
    a = ap.parse_args()
    rc = 0
    for path in a.proposal:
        rc |= check(path)
    return rc


if __name__ == '__main__':
    sys.exit(main())
