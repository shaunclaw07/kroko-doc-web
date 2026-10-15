#!/usr/bin/env python3
"""Prueft, ob jede in Markdown-Doku genannte Pfadangabe im Baum existiert.

Aufruf:
    python3 doku-pfade-pruefen.py <repo-wurzel> <datei.md> [<datei.md> ...]

Verfahren: In Backticks genannte Zeichenketten mit Verzeichnis-Praefix werden
gesammelt, Klammer-Listen ({a,b}.ts) und Sternchen bzw. '...' expandiert und
gegen das Dateisystem gehalten. Exit 0 = alles vorhanden, 1 = mindestens eine
Angabe zeigt ins Leere. Code-Zaeune (```) werden vorher entfernt und Backticks je
Zeile gepaart. Die Ausgabe ist eine KANDIDATENLISTE: Routen (/plans/:id),
Platzhalter (<id>) und reine Dateinamen ohne Praefix werden bewusst uebersprungen, also jeden
Treffer ansehen, bevor er als Fehler gilt.
"""
import re
import sys
from pathlib import Path

PRAEFIXE = (
    "src/", "app/", "lib/", "packages/", "test/", "tests/",
    "scripts/", "docs/", "data/", ".scratch/", "public/",
)


def ohne_zaeune(text):
    """Code-Zaeune und dreifache Backticks im Fliesstext entfernen.

    Sonst verschiebt jeder Zaun die Paarung der Backticks um eins, und danach enthaelt jeder
    "Span" Fliesstext und faellt durchs Sieb (gemessen am 14.10.2026: in docs/testing.md wurden
    0 von 73 Angaben ueberhaupt angesehen).
    """
    zeilen = []
    im_zaun = False
    for zeile in text.splitlines():
        if zeile.lstrip().startswith("```"):
            im_zaun = not im_zaun
            continue
        if not im_zaun:
            zeilen.append(zeile.replace("```", ""))
    return zeilen


def kandidaten(text):
    # Je Zeile paaren: eine vergessene Backtick verdirbt so hoechstens ihre eigene Zeile.
    for roh in (r for z in ohne_zaeune(text) for r in re.findall(r"`([^`]+)`", z)):
        t = roh.strip()
        if not t.startswith(PRAEFIXE):
            continue
        if " " in t or ":" in t.split("/")[-1]:  # Route wie /plans/:id/tausch
            continue
        if "<" in t:  # Platzhalter wie public/sounds/voices/<id>.mp3
            continue
        yield t


def expandiere(wurzel, muster):
    """{a,b}.ts -> [a.ts, b.ts]; * bzw. ... -> glob; sonst [muster]."""
    treffer = re.fullmatch(r"(.+?)\{([^}]+)\}(.*)", muster)
    if treffer:
        kopf, innen, rest = treffer.groups()
        ergebnis = []
        for teil in innen.split(","):
            ergebnis.extend(expandiere(wurzel, f"{kopf}{teil.strip()}{rest}"))
        return ergebnis
    if "*" in muster or "..." in muster:
        basis = muster.replace("...", "*")
        return [str(p.relative_to(wurzel)) for p in wurzel.glob(basis)]
    return [muster]


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        return 2
    wurzel = Path(sys.argv[1]).resolve()
    dateien = sys.argv[2:]
    fehlend = []
    geprueft = 0
    for name in dateien:
        pfad = wurzel / name
        if not pfad.is_file():
            fehlend.append(f"{name}: Datei fehlt")
            continue
        for roh in kandidaten(pfad.read_text(encoding="utf-8")):
            for ziel in expandiere(wurzel, roh):
                geprueft += 1
                if not (wurzel / ziel.rstrip("/")).exists():
                    fehlend.append(f"{name}: `{roh}` -> {ziel}")
    print(f"Pfad-Angaben geprueft: {geprueft}")
    if fehlend:
        print(f"NICHT GEFUNDEN ({len(fehlend)}):")
        for f in fehlend:
            print("  " + f)
        return 1
    print("Alle genannten Pfade existieren.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
