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

from freischaltung import ABLAGE, ALLE_OFFEN

URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4321"
SETTINGS_KEY = "zahn_agent:settings:v1"
TIERE = ["crocodile", "wolf", "human", "shark", "mouse", "vampire", "panda", "lion", "panther", "sabertooth"]
BREITEN = [320, 390, 820]


def einstellungen(tier: str, zaehne) -> dict:
    return {"mode": "original", "players": 1, "sound": False, "vibration": False,
            "creature": tier, "teethOverride": zaehne}


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
    funde: list[str] = []

    def pruefe(gut: bool, text: str, laut: bool = True) -> None:
        if laut or not gut:
            print(("  ok    " if gut else "  FUND  ") + text)
        if not gut:
            funde.append(text)

    with sync_playwright() as p:
        browser = p.chromium.launch()

        def neue_seite(werte: dict, breite: int = 390, ruhe: bool = False):
            kontext = browser.new_context(viewport={"width": breite, "height": 844},
                                          reduced_motion="reduce" if ruhe else "no-preference")
            seite = kontext.new_page()
            seite.goto(URL, wait_until="load")
            seite.evaluate("([k, v]) => localStorage.setItem(k, v)", [SETTINGS_KEY, json.dumps(werte)])
            # Seit dem 13.10.2026 öffnen sich die Tiere über Sterne — die Sonde bringt ein Protokoll mit, das alle öffnet.
            seite.evaluate("([k, v]) => localStorage.setItem(k, v)", [ABLAGE, ALLE_OFFEN])
            seite.reload(wait_until="load")
            seite.wait_for_timeout(500)
            return seite

        print("A — Geometrie bei vollem Zoom")
        for breite in BREITEN:
            for tier in TIERE:
                for zaehne in (None, 12):
                    seite = neue_seite(einstellungen(tier, zaehne), breite)
                    seite.add_style_tag(content="#croc-mount { transition: none !important; }")
                    seite.evaluate("() => document.getElementById('stage').style.setProperty('--zoom', '0')")
                    vorher = seite.evaluate(MESSEN)
                    seite.evaluate("() => document.getElementById('stage').style.setProperty('--zoom', '1')")
                    nachher = seite.evaluate(MESSEN)
                    skala = seite.evaluate(SKALA)
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
                    seite.context.close()

        print("B — der echte Ablauf")
        seite = neue_seite(einstellungen("crocodile", 10))
        seite.wait_for_timeout(800)
        pruefe(seite.evaluate(SKALA) == 1, f"zehn Zähne am Start: keine Skalierung ({seite.evaluate(SKALA)})")
        seite.context.close()

        seite = neue_seite(einstellungen("vampire", 1))
        seite.wait_for_timeout(900)
        pruefe(seite.evaluate(SKALA) == 1.08, f"ein Zahn: Skalierung 1,08 ({seite.evaluate(SKALA)})")
        seite.click("#stage [data-tooth]")
        seite.wait_for_timeout(2000)
        status = seite.evaluate("() => document.getElementById('stage').dataset.status")
        pruefe(status == "snapped", f"der eine Zahn ließ sich bei vollem Zoom drücken (Status {status})")
        pruefe(seite.evaluate(SKALA) == 1, f"nach dem Biss: keine Skalierung ({seite.evaluate(SKALA)})")
        seite.context.close()

        seite = neue_seite(einstellungen("vampire", 1), ruhe=True)
        seite.wait_for_timeout(300)
        pruefe(seite.evaluate(SKALA) == 1, f"reduzierte Bewegung: keine Skalierung ({seite.evaluate(SKALA)})")
        seite.context.close()

        browser.close()

    print(f"\nAuffälligkeiten: {len(funde)}")
    return 1 if funde else 0


if __name__ == "__main__":
    sys.exit(main())
