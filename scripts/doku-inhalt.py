#!/usr/bin/env python3
"""Baut den Abschnitt "## Inhalt" aus den H2-Überschriften einer Doku-Datei.

Aufruf:
    python3 scripts/doku-inhalt.py --pruefen docs/a.md [docs/b.md …]   # Exit 1 bei Abweichung
    python3 scripts/doku-inhalt.py --schreiben docs/a.md […]           # Inhalt neu setzen

Der Anker wird nach der Regel von GitHub gebildet: Überschrift klein, Fett- und
Code-Auszeichnung entfernt, alles außer Buchstaben, Ziffern, Leerzeichen, `-` und `_`
weg, Leerzeichen zu `-`. Die Datei selbst wird nur zwischen der Zeile "## Inhalt" und
der nächsten H2-Überschrift geändert; steht noch kein "## Inhalt" da, wird er vor der
ersten H2-Überschrift eingefügt.
"""
import re
import sys

MARK = '## Inhalt'


def slug(text: str) -> str:
    """Anker wie GitHub (github-slugger): Zeichen der Klassen \u2000–\u206F/\u2E00–\u2E7F
    und ASCII-Satzzeichen fallen weg, JEDES Leerzeichen wird zu einem Bindestrich — ein
    Gedankenstrich hinterlässt deshalb zwei."""
    t = re.sub(r'<[!/a-z].*?>', '', text, flags=re.I)
    t = t.lower().strip()
    t = re.sub(r'[\u2000-\u206F\u2E00-\u2E7F\\\'!"#$%&()*+,./:;<=>?@\[\]^`{|}~]', '', t)
    return re.sub(r'\s', '-', t)


def headings(lines):
    out = []
    infence = False
    for i, l in enumerate(lines):
        if l.lstrip().startswith('```'):
            infence = not infence
            continue
        if infence:
            continue
        m = re.match(r'^## (.+)$', l)
        if m and m.group(1).strip() != 'Inhalt':
            out.append((i, m.group(1).strip()))
    return out


def build(path):
    lines = open(path, encoding='utf-8').read().split('\n')
    hs = headings(lines)
    seen = {}
    entries = []
    for _, t in hs:
        s = slug(t)
        if s in seen:                      # wie github-slugger: -1, -2 …
            seen[s] += 1
            s = f'{s}-{seen[s]}'
        else:
            seen[s] = 0
        entries.append(f'- [{t}](#{s})')
    toc = [MARK, ''] + entries + ['']
    start = next((i for i, l in enumerate(lines) if l.strip() == MARK), None)
    if start is None:
        if not hs:                          # Datei ohne H2: hier gibt es nichts zu verzeichnen
            return lines, 'kein Inhalt (keine H2)'
        first = hs[0][0]
        return lines[:first] + toc + [''] + lines[first:], 'eingefügt'
    end = next(i for i, l in enumerate(lines) if i > start and l.startswith('## '))
    body = [l for l in lines[start + 1:end]]
    while body and body[-1] == '':
        body.pop()
    changed = body != toc[1:-1]
    return lines[:start] + toc + lines[end:], ('geändert' if changed else 'unverändert')


def main(argv):
    mode = '--schreiben' if '--schreiben' in argv else '--pruefen'
    paths = [a for a in argv if not a.startswith('--')]
    bad = 0
    for p in paths:
        new, state = build(p)
        if mode == '--schreiben':
            open(p, 'w', encoding='utf-8').write('\n'.join(new))
            print(f'{p}: Inhalt {state}')
        elif state == 'unverändert':
            print(f'{p}: Inhalt passt')
        elif state == 'kein Inhalt (keine H2)':
            print(f'{p}: keine H2-Überschriften — kein Verzeichnis nötig')
        elif state == 'eingefügt':
            # Datei führt (noch) kein "## Inhalt": das ist eine Einladung, kein Fund.
            print(f'{p}: kein "## Inhalt" geführt (H2-Überschriften vorhanden)')
        else:
            print(f'{p}: Inhalt {state} — mit --schreiben nachziehen')
            bad += 1
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
