"""
Zoom-Sonde: prüft im **echten Browser**, dass die herangerückte Bühne keinen Zahn unerreichbar
macht. jsdom rechnet weder CSS noch Geometrie.

Teil A — Geometrie bei vollem Zoom, für jedes Tier, bei Standard-Zahnzahl und bei 12 Zähnen, auf
320, 390 und 820 px Breite. `--zoom` wird dafür von Hand auf 1 gesetzt (der Übergang ist
abgeschaltet). Erwartet je Lage:

    - in der Mitte jeder Trefferfläche liegt ihr eigener Zahn (`elementFromPoint`)
    - keine Trefferfläche ist kleiner geworden
    - jede Zahnzeichnung, die vorher ganz in der Bühne lag, liegt auch danach ganz darin

Teil B — der echte Ablauf:

    - zehn Zähne am Start: keine Skalierung
    - ein Zahn (100 % Bissgefahr): Skalierung 1,08; nach dem Biss wieder keine
    - mit `prefers-reduced-motion`: gar keine Skalierung

Aufruf (der Entwicklungsserver muss laufen):
    uv run --with playwright python scripts/pruefen-zoom.py [URL]

Rückgabe 0 = in Ordnung, 1 = Fund.
"""
import json
import sys

from playwright.sync_api import sync_playwright

from katalog import TIERE
from sonde import Sonde, basis_adresse, einstellungen, seite

URL = basis_adresse()
BREITEN = [320, 390, 820]


MESSEN = """() => {
  const buehne = document.getElementById('stage').getBoundingClientRect();
  const drin = (r) => r.left >= buehne.left - 0.5 && r.right <= buehne.right + 0.5
    && r.top >= buehne.top - 0.5 && r.bottom <= buehne.bottom + 0.5;
  return Array.from(document.querySelectorAll('#stage .tooth')).map((tooth) => {
    const hit = tooth.querySelector('.tooth__hit').getBoundingClientRect();
    const form = tooth.querySelector('.tooth__shape').getBoundingClientRect();
    const oben = document.elementFromPoint(hit.left + hit.width / 2, hit.top + hit.height / 2);
    return {
      zahn: tooth.dataset.tooth,
      trefferBreite: hit.width,
      eigener: !!oben && tooth.contains(oben),
      formDrin: drin(form),
    };
  });
}"""

SKALA = """() => {
  const m = getComputedStyle(document.getElementById('croc-mount')).transform;
  if (m === 'none') return 1;
  const werte = m.replace('matrix(', '').replace(')', '').split(',').map(Number);
  return +werte[0].toFixed(3);
}"""


def main() -> int:
    sonde = Sonde("Zoom")
    pruefe = sonde.pruefe

    with sync_playwright() as p:
        browser = p.chromium.launch()

        def neue_seite(werte: dict, breite: int = 390, ruhe: bool = False):
            s = seite(
                browser,
                breite=breite,
                hoehe=844,
                tier=werte["creature"],
                zaehne=werte["teethOverride"],
                ruhe=ruhe,
                url=URL,
            )
            s.wait_for_timeout(500)
            return s

        print("A — Geometrie bei vollem Zoom")
        for breite in BREITEN:
            for tier in TIERE:
                for zaehne in (None, 12):
                    page = neue_seite(einstellungen(tier, zaehne), breite)
                    page.add_style_tag(content="#croc-mount { transition: none !important; }")
                    page.evaluate("() => document.getElementById('stage').style.setProperty('--zoom', '0')")
                    vorher = page.evaluate(MESSEN)
                    page.evaluate("() => document.getElementById('stage').style.setProperty('--zoom', '1')")
                    nachher = page.evaluate(MESSEN)
                    skala = page.evaluate(SKALA)
                    lage = f"{breite} px, {tier}, {len(nachher)} Zähne"
                    fremde = [z["zahn"] for z in nachher if not z["eigener"]]
                    kleiner = [n["zahn"] for v, n in zip(vorher, nachher)
                               if n["trefferBreite"] < v["trefferBreite"] - 0.01]
                    raus = [n["zahn"] for v, n in zip(vorher, nachher) if v["formDrin"] and not n["formDrin"]]
                    schon_vorher = [z["zahn"] for z in vorher if not z["eigener"]]
                    pruefe(skala == 1.08, f"{lage}: Skalierung 1,08 (gemessen {skala})", laut=False)
                    pruefe(not [z for z in fremde if z not in schon_vorher],
                           f"{lage}: in der Mitte jeder Trefferfläche liegt der eigene Zahn (fremd: {fremde})", laut=False)
                    pruefe(not kleiner, f"{lage}: keine Trefferfläche ist kleiner geworden ({kleiner})", laut=False)
                    pruefe(not raus, f"{lage}: keine Zahnzeichnung läuft aus der Bühne ({raus})", laut=False)
                    kleinste = min(z["trefferBreite"] for z in nachher)
                    print(f"  gemessen  {lage}: kleinste Trefferfläche {kleinste:.2f} px, "
                          f"vorher {min(z['trefferBreite'] for z in vorher):.2f} px")
                    page.context.close()

        print("B — der echte Ablauf")
        page = neue_seite(einstellungen("crocodile", 10))
        page.wait_for_timeout(800)
        pruefe(page.evaluate(SKALA) == 1, f"zehn Zähne am Start: keine Skalierung ({page.evaluate(SKALA)})")
        page.context.close()

        page = neue_seite(einstellungen("vampire", 1))
        page.wait_for_timeout(900)
        pruefe(page.evaluate(SKALA) == 1.08, f"ein Zahn: Skalierung 1,08 ({page.evaluate(SKALA)})")
        page.click("#stage [data-tooth]")
        page.wait_for_timeout(2000)
        status = page.evaluate("() => document.getElementById('stage').dataset.status")
        pruefe(status == "snapped", f"der eine Zahn ließ sich bei vollem Zoom drücken (Status {status})")
        pruefe(page.evaluate(SKALA) == 1, f"nach dem Biss: keine Skalierung ({page.evaluate(SKALA)})")
        page.context.close()

        page = neue_seite(einstellungen("vampire", 1), ruhe=True)
        page.wait_for_timeout(300)
        pruefe(page.evaluate(SKALA) == 1, f"reduzierte Bewegung: keine Skalierung ({page.evaluate(SKALA)})")
        page.context.close()

        browser.close()

    return sonde.abschluss()


if __name__ == "__main__":
    sys.exit(main())
