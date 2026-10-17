#!/usr/bin/env python3
"""Sagt, ob das OpenWiki (openwiki/) gegenüber dem Baum veraltet ist.

Aufruf:
    python3 scripts/wiki-stand.py            # Bericht; Exit 1 = auffrischen
    python3 scripts/wiki-stand.py --streng   # Exit 1 auch bei „knapp davor"

Grundlage ist der Commit, den der letzte OpenWiki-Lauf dokumentiert hat
(`openwiki/.last-update.json`, Feld `gitHead`). Gezählt werden nur Dateien,
die das Wiki beschreibt — Code unter `src/`, `worker/`, `public/sw.js`, die
öffentlichen Befehle aus `package.json`. Reine Doku- und Skript-Änderungen
lösen keinen Lauf aus (Regel in AGENTS.md), außer den drei Kerndokus, auf
denen die Architekturseiten fußen.

Auslöser für „auffrischen":
  * eine der Kerndokus hat sich geändert (architecture, domain-model, testing)
  * ein Ordner unter `src/` ist dazugekommen oder verschwunden
  * ein öffentlicher Befehl in `package.json` ist dazu/weggefallen
  * mehr als SCHWELLE Dateien aus dem beschriebenen Bereich geändert
"""
import json
import os
import subprocess
import sys

SCHWELLE = 30
SCHWELLE_STRENG = 15
KERNDOKU = {
    'docs/architecture.md',
    'docs/domain-model.md',
    'docs/testing.md',
}
BESCHRIEBEN = ('src/', 'worker/', 'public/sw.js', 'public/sounds/', 'astro.config.mjs')


def git(*args):
    r = subprocess.run(['git', *args], capture_output=True, text=True)
    if r.returncode != 0:
        print(f'git {" ".join(args)} fehlgeschlagen: {r.stderr.strip()}', file=sys.stderr)
        sys.exit(2)
    return r.stdout


def befehle(rev):
    """Die Namen der Skripte aus package.json in einem Commit."""
    try:
        roh = git('show', f'{rev}:package.json')
    except SystemExit:
        return set()
    return set(json.loads(roh).get('scripts', {})) if roh.strip() else set()


def main() -> int:
    streng = '--streng' in sys.argv
    schwelle = SCHWELLE_STRENG if streng else SCHWELLE
    stand_datei = 'openwiki/.last-update.json'
    if not os.path.exists(stand_datei):
        print('kein openwiki/.last-update.json — wurde das Wiki je gebaut?')
        return 2
    stand = json.load(open(stand_datei, encoding='utf-8'))
    basis = stand.get('gitHead', '')
    if not basis:
        print('im Stand fehlt gitHead — kein Vergleich möglich')
        return 2

    if subprocess.run(['git', 'cat-file', '-e', basis], capture_output=True).returncode != 0:
        print(f'Basis-Commit {basis[:8]} ist im Baum nicht vorhanden (Flachklon?) — kein Vergleich möglich')
        return 2

    commits = int(git('rev-list', '--count', f'{basis}..HEAD').strip() or 0)
    geaendert = [l for l in git('diff', '--name-status', basis, 'HEAD').splitlines() if l.strip()]

    beschrieben = []
    alle = []
    for zeile in geaendert:
        felder = zeile.split('\t')
        status, pfad = felder[0], felder[-1]
        alle.append((status, pfad))
        if pfad.startswith(BESCHRIEBEN):
            beschrieben.append((status, pfad))

    # Die Kerndokus selbst stehen nicht im „beschriebenen Bereich" (docs/), ihre
    # Änderung ist trotzdem ein Auslöser: die Architekturseiten fußen darauf.
    kerndoku = sorted(p for _, p in alle if p in KERNDOKU)
    neue_ordner = set()
    for status, pfad in beschrieben:
        if status.startswith(('A', 'D')) and pfad.startswith('src/'):
            teile = pfad.split('/')
            if len(teile) >= 3:                       # src/<schicht>/<ordner>/…
                neue_ordner.add('/'.join(teile[:3]) + '/')

    print(f'Wiki-Stand: letzter Lauf dokumentiert {basis[:8]} '
          f'({stand.get("command", "?")}, {stand.get("updatedAt", "?")[:10]})')
    print(f'Seitdem: {commits} Commit(s), {len(geaendert)} Datei(en) geändert, '
          f'davon {len(beschrieben)} aus dem beschriebenen Bereich')

    ausloeser = []
    if kerndoku:
        ausloeser.append(f'Kerndoku geändert: {", ".join(kerndoku)}')
    if neue_ordner:
        ausloeser.append(f'Ordner unter src/ dazu oder weg: {", ".join(sorted(neue_ordner))}')
    jetzt, vorher = befehle('HEAD'), befehle(basis)
    if jetzt != vorher:
        dazu, weg = sorted(jetzt - vorher), sorted(vorher - jetzt)
        teile = []
        if dazu:
            teile.append('dazu: ' + ', '.join(dazu))
        if weg:
            teile.append('weg: ' + ', '.join(weg))
        ausloeser.append('öffentliche Befehle geändert (' + '; '.join(teile) + ')')

    if len(beschrieben) > schwelle:
        ausloeser.append(f'{len(beschrieben)} Dateien aus dem beschriebenen Bereich '
                         f'(Schwelle {schwelle}{" — streng" if streng else ""})')

    if ausloeser:
        print('Ergebnis: AUFFRISCHEN — ' + '; '.join(ausloeser))
        print('Aufruf (Kostet ~1 h und unter 1 USD, siehe AGENTS.md):')
        print('  OPENWIKI_TELEMETRY_DISABLED=1 OPENWIKI_PROVIDER=openai-compatible \\')
        print('  OPENAI_COMPATIBLE_BASE_URL=https://api.deepseek.com/v1 \\')
        print('  OPENAI_COMPATIBLE_API_KEY="$DEEPSEEK_API_KEY" OPENWIKI_MODEL_ID=deepseek-flash \\')
        print('  openwiki --update -l de && bash scripts/wiki-export.sh')
        return 1

    print(f'Ergebnis: bleibt — kein Auslöser ({len(beschrieben)} von {schwelle} Dateien, '
          f'keine Kerndoku, keine Struktur- oder Befehlsänderung).')
    return 0


if __name__ == '__main__':
    sys.exit(main())
