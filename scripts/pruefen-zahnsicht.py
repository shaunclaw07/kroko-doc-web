"""Liegt ein Zahn unter dem Gesicht? Gemessen an der Zeichnung selbst, für jede Zahnzahl.

Das Gesicht (`creature__face`) wird als letzte Ebene **über** die Zähne gemalt. Ein Auge, eine
Wange oder ein Strich, der in den Zahnring ragt, deckt je nach Zahnzahl einen Zahn zu — am
12.10.2026 gemessen: der Augenfleck des Pandas bei 11 Zähnen 100 %, das Auge des Hais bei 8 Zähnen
82 %. Welcher Zahn betroffen ist, wandert mit der Zahnzahl; deshalb prüft die Sonde alle.

Vorher die Zeichnungen schreiben (jede Zahnzahl je Lebewesen):
    pnpm vitest run src/render-probe.test.ts

Aufruf:
    uv run --with playwright python scripts/pruefen-zahnsicht.py              # alle Tiere, alle Zahnzahlen
    uv run --with playwright python scripts/pruefen-zahnsicht.py panda hai    # Kennungen filtern (Teilwort)
    uv run --with playwright python scripts/pruefen-zahnsicht.py --freiraum panda

Erwartet: `0 Auffälligkeiten`. Exit-Code 1, sobald ein Zahn zu mehr als 2 % unter einer Ebene
liegt, die nicht das untere Zahnfleischband ist (dort stecken die Wurzeln der unteren Zähne
gewollt — das wird nur als Zahl genannt).

`--freiraum <tier>` druckt eine Karte für die linke Kopfhälfte: je Rasterpunkt der Abstand zum
Zahnring und zum Kopfumriss (`Ring/Umriss`). Ein Auge mit Radius r passt dort hin, wo **beide**
Zahlen größer als r sind. `...` liegt im Ring, `---` außerhalb des Kopfes. Der Umriss-Abstand
zählt auch Teilpfade im Kopfinneren (Ohrkreise) — dort ist die kleine Zahl kein Beschnitt.

Gemessen wird mit `isPointInFill` (Zahnfläche) und `elementFromPoint` (was liegt obenauf) in
Chromium — das ist die Deckung, die der Spieler sieht, nicht eine Rechnung über Rechtecke.
"""
from __future__ import annotations

import os
import sys
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright

ORDNER = Path(os.environ.get("TMPDIR") or tempfile.gettempdir()) / "zahn_agent-artwork" / "zahnzahlen"
SCHWELLE = 0.02

VERDECKUNG = """
() => {
  const svg = document.querySelector('svg');
  const stil = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  // Trefferkreis, Leuchten und Bissmarke sind im Spiel unsichtbar — ohne Stylesheet wären sie schwarz.
  stil.textContent = '.tooth__hit,.tooth__glow,.creature__biter{display:none}';
  svg.appendChild(stil);
  const ergebnis = [];
  const N = 24;
  for (const zahn of svg.querySelectorAll('.tooth')) {
    const form = zahn.querySelector('.tooth__shape');
    const kasten = form.getBBox();
    const matrix = form.getScreenCTM();
    let flaeche = 0, band = 0;
    const fremd = {};
    for (let i = 0; i < N; i += 1) for (let j = 0; j < N; j += 1) {
      const punkt = svg.createSVGPoint();
      punkt.x = kasten.x + (i + 0.5) * kasten.width / N;
      punkt.y = kasten.y + (j + 0.5) * kasten.height / N;
      if (!form.isPointInFill(punkt)) continue;
      flaeche += 1;
      const schirm = punkt.matrixTransform(matrix);
      const oben = document.elementFromPoint(schirm.x, schirm.y);
      if (oben === form) continue;
      const ebene = oben && oben.closest ? oben.closest('g[class]') : null;
      const name = ebene ? ebene.getAttribute('class') : '?';
      if (name === 'jaw__lower') { band += 1; continue; }
      const was = name + ' <' + (oben ? oben.tagName : '?') + ' ' +
        ['cx', 'cy', 'fill', 'stroke'].map((a) => oben && oben.getAttribute(a)).filter(Boolean).join(' ') + '>';
      fremd[was] = (fremd[was] || 0) + 1;
    }
    ergebnis.push({ zahn: zahn.dataset.tooth, flaeche, band, fremd });
  }
  return ergebnis;
}
"""

FREIRAUM = r"""
() => {
  const svg = document.querySelector('svg');
  const umriss = svg.querySelector('clipPath path');
  const loch = svg.querySelector('.mouth__hole-shape');
  const bogen = svg.querySelector('.jaw__band--upper').getAttribute('d').match(/A ([\d.]+) ([\d.]+)/);
  const rx = +bogen[1], ry = +bogen[2], cx = +loch.getAttribute('cx'), cy = +loch.getAttribute('cy');
  const laenge = umriss.getTotalLength();
  const rand = [];
  for (let i = 0; i < 1500; i += 1) { const p = umriss.getPointAtLength(laenge * i / 1500); rand.push([p.x, p.y]); }
  const ring = [];
  for (let i = 0; i < 1440; i += 1) { const a = i * Math.PI / 720; ring.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); }
  const abstand = (punkte, x, y) => Math.round(Math.min(...punkte.map((p) => Math.hypot(p[0] - x, p[1] - y))));
  const zeilen = ['Ring ' + rx + ' x ' + ry + ' um ' + cx + '/' + cy + ' — Spalten x 60..300, Schritt 10'];
  for (let y = 40; y <= cy; y += 10) {
    let zeile = 'y' + String(y).padStart(3) + ':';
    for (let x = 60; x <= 300; x += 10) {
      const p = svg.createSVGPoint(); p.x = x; p.y = y;
      const imRing = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
      zeile += !umriss.isPointInFill(p) ? '  --- ' : imRing ? '  ... '
        : ' ' + String(abstand(ring, x, y)).padStart(2) + '/' + String(abstand(rand, x, y)).padStart(2);
    }
    zeilen.push(zeile);
  }
  return zeilen.join('\n');
}
"""


def dateien(filter_: list[str]) -> list[Path]:
    alle = sorted(ORDNER.glob("*.svg"), key=lambda f: (f.stem.rsplit("-", 1)[0], int(f.stem.rsplit("-", 1)[1])))
    return [f for f in alle if not filter_ or any(teil in f.stem for teil in filter_)]


def main() -> int:
    argumente = sys.argv[1:]
    freiraum = "--freiraum" in argumente
    filter_ = [a for a in argumente if not a.startswith("--")]
    if not ORDNER.is_dir() or not any(ORDNER.glob("*.svg")):
        print(f"Keine Zeichnungen in {ORDNER} — erst: pnpm vitest run src/render-probe.test.ts")
        return 2
    auffaellig = 0
    geprueft = 0
    hoechstes_band = 0.0
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        seite = browser.new_page(viewport={"width": 640, "height": 460})
        if freiraum:
            for datei in [f for f in dateien(filter_) if f.stem.endswith("-12")]:
                seite.goto(datei.as_uri())
                print(datei.stem.rsplit("-", 1)[0])
                print(seite.evaluate(FREIRAUM))
            browser.close()
            return 0
        for datei in dateien(filter_):
            seite.goto(datei.as_uri())
            geprueft += 1
            for zahn in seite.evaluate(VERDECKUNG):
                flaeche = max(1, zahn["flaeche"])
                hoechstes_band = max(hoechstes_band, zahn["band"] / flaeche)
                verdeckt = sum(zahn["fremd"].values())
                if verdeckt / flaeche > SCHWELLE:
                    auffaellig += 1
                    wodurch = ", ".join(sorted(zahn["fremd"], key=zahn["fremd"].get, reverse=True))
                    print(f"{datei.stem}: Zahn {zahn['zahn']} zu {100 * verdeckt // flaeche} % verdeckt durch {wodurch}")
        browser.close()
    print(f"{geprueft} Zeichnungen geprüft (Lebewesen × Zahnzahl), {auffaellig} Auffälligkeiten")
    print(f"Zur Einordnung: das untere Zahnfleischband deckt höchstens {100 * hoechstes_band:.0f} % eines Zahns (gewollt).")
    return 1 if auffaellig else 0


if __name__ == "__main__":
    sys.exit(main())
