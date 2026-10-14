"""
Blick-Sonde: prüft im **echten Browser**, dass die Augen dem Zeiger folgen, die Pupille dabei in
der Linse bleibt und der Kiefer mit der Bissgefahr zittert. jsdom rechnet kein CSS.

Geprüft wird:

    1. Blick      → je Tier: Zeiger links und rechts der Bühne verschiebt die Pupillen in
                    verschiedene Richtungen; an fünf Zeigerstellen bleibt jede Pupille in ihrer
                    weißen Linse
    2. Kopfbilder → die Pupillen der Auswahl-Kacheln bewegen sich nicht mit
    3. Zittern    → zehn Zähne am Start: keine Animation; ein Zahn (100 %): `jaw-tremble`
    4. Pause      → während `is-pressing` läuft `jaw-crack`, nicht das Zittern
    5. Ruhe       → mit `prefers-reduced-motion` läuft keine Animation

Aufruf (der Entwicklungsserver muss laufen):
    uv run --with playwright python scripts/pruefen-blick.py [URL]

Rückgabe 0 = in Ordnung, 1 = Fund.
"""
import json
import sys

from playwright.sync_api import sync_playwright

from freischaltung import ABLAGE, ALLE_OFFEN
from katalog import TIERE

URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4321"
SETTINGS_KEY = "zahn_agent:settings:v1"


def einstellungen(tier: str, zaehne) -> dict:
    return {"mode": "original", "players": 1, "sound": False, "vibration": False,
            "creature": tier, "teethOverride": zaehne}


AUGEN = """() => {
  const art = document.querySelector('svg.creature');
  const linsen = Array.from(art.querySelectorAll('.creature__face ellipse[fill="#ffffff"]'))
    .map((linse) => linse.getBoundingClientRect());
  return Array.from(art.querySelectorAll('.pupil')).map((pupille) => {
    const p = pupille.getBoundingClientRect();
    const mx = p.left + p.width / 2;
    const my = p.top + p.height / 2;
    // Die kleinste weiße Ellipse um die Pupillenmitte ist ihre Linse.
    const linse = linsen
      .filter((l) => mx >= l.left && mx <= l.right && my >= l.top && my <= l.bottom)
      .sort((a, b) => a.width * a.height - b.width * b.height)[0];
    return {
      mitteX: mx,
      mitteY: my,
      inLinse: !!linse && p.left >= linse.left - 0.5 && p.right <= linse.right + 0.5
        && p.top >= linse.top - 0.5 && p.bottom <= linse.bottom + 0.5,
    };
  });
}"""

KACHEL = """() => {
  const pupille = document.querySelector('.creature-portrait .pupil');
  return pupille ? getComputedStyle(pupille).transform : '(keine Kachel)';
}"""

KIEFER = """() => {
  const art = document.querySelector('svg.creature');
  const stil = getComputedStyle(art.querySelector('.jaw__upper'));
  return { animation: stil.animationName, dauer: stil.animationDuration, klassen: art.getAttribute('class') };
}"""


def main() -> int:
    funde: list[str] = []

    def pruefe(gut: bool, text: str) -> None:
        print(("  ok    " if gut else "  FUND  ") + text)
        if not gut:
            funde.append(text)

    with sync_playwright() as p:
        browser = p.chromium.launch()

        def neue_seite(werte: dict, ruhe: bool = False):
            kontext = browser.new_context(viewport={"width": 390, "height": 844},
                                          reduced_motion="reduce" if ruhe else "no-preference")
            seite = kontext.new_page()
            seite.goto(URL, wait_until="load")
            seite.evaluate("([k, v]) => localStorage.setItem(k, v)", [SETTINGS_KEY, json.dumps(werte)])
            # Seit dem 13.10.2026 öffnen sich die Tiere über Sterne — die Sonde bringt ein Protokoll mit, das alle öffnet.
            seite.evaluate("([k, v]) => localStorage.setItem(k, v)", [ABLAGE, ALLE_OFFEN])
            seite.reload(wait_until="load")
            seite.wait_for_timeout(600)
            return seite

        print("1 — Blick, je Tier")
        for tier in TIERE:
            seite = neue_seite(einstellungen(tier, None))
            kasten = seite.evaluate("""() => {
              const r = document.querySelector('svg.creature').getBoundingClientRect();
              return { l: r.left, t: r.top, w: r.width, h: r.height };
            }""")
            stellen = {
                "links": (kasten["l"] + 4, kasten["t"] + kasten["h"] / 2),
                "rechts": (kasten["l"] + kasten["w"] - 4, kasten["t"] + kasten["h"] / 2),
                "oben": (kasten["l"] + kasten["w"] / 2, kasten["t"] + 4),
                "unten": (kasten["l"] + kasten["w"] / 2, kasten["t"] + kasten["h"] - 4),
                "mitte": (kasten["l"] + kasten["w"] / 2, kasten["t"] + kasten["h"] / 2),
            }
            lagen = {}
            for name, (x, y) in stellen.items():
                seite.mouse.move(x, y)
                seite.wait_for_timeout(320)
                lagen[name] = seite.evaluate(AUGEN)
            alle_drin = all(auge["inLinse"] for lage in lagen.values() for auge in lage)
            weg = lagen["rechts"][0]["mitteX"] - lagen["links"][0]["mitteX"]
            pruefe(len(lagen["mitte"]) == 2, f"{tier}: zwei Pupillen gefunden ({len(lagen['mitte'])})")
            pruefe(alle_drin, f"{tier}: jede Pupille bleibt an allen fünf Stellen in ihrer Linse")
            pruefe(weg > 1.0, f"{tier}: der Blick wandert von links nach rechts ({weg:.2f} px)")
            if tier == TIERE[0]:
                print("2 — Kopfbilder")
                seite.mouse.move(*stellen["links"])
                seite.wait_for_timeout(320)
                kachel = seite.evaluate(KACHEL)
                pruefe(kachel in ("none", "matrix(1, 0, 0, 1, 0, 0)"),
                       f"die Pupille der Kachel steht still (transform: {kachel})")
                print("1 — Blick, je Tier (weiter)")
            seite.context.close()

        print("3 — Zittern")
        seite = neue_seite(einstellungen("crocodile", 10))
        ruhig = seite.evaluate(KIEFER)
        pruefe(ruhig["animation"] == "none", f"zehn Zähne am Start: keine Animation ({ruhig['animation']})")
        seite.context.close()

        seite = neue_seite(einstellungen("vampire", 1))
        laut = seite.evaluate(KIEFER)
        pruefe(laut["animation"] == "jaw-tremble" and "is-trembling" in laut["klassen"],
               f"ein Zahn: der Kiefer zittert ({laut['animation']}, {laut['dauer']}, Klassen: {laut['klassen']})")

        print("4 — Pause")
        seite.evaluate("() => document.querySelector('svg.creature').classList.add('is-pressing')")
        pause = seite.evaluate(KIEFER)
        pruefe(pause["animation"] == "jaw-crack",
               f"in der Pause gewinnt das Knarren, nicht das Zittern ({pause['animation']})")
        seite.context.close()

        print("5 — Ruhe")
        seite = neue_seite(einstellungen("vampire", 1), ruhe=True)
        still = seite.evaluate(KIEFER)
        pruefe(still["animation"] == "none", f"mit reduzierter Bewegung läuft nichts ({still['animation']})")
        seite.context.close()

        browser.close()

    print(f"\nAuffälligkeiten: {len(funde)}")
    return 1 if funde else 0


if __name__ == "__main__":
    sys.exit(main())
