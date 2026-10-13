"""
Halte-Sonde: prüft im **echten Browser**, dass ein Zahn erst beim Loslassen entschieden wird.

jsdom kennt keine Geometrie und kein `elementFromPoint` — genau daran hängen das Zurücknehmen
(Finger vom Zahn geschoben) und die Frage, ob ein Zeiger-Tipp nur einmal zählt.

Geprüft wird:

    1. Halten            → 1,5 s lang kein Zug, der Zahn trägt `is-held`; Loslassen zählt genau einen
    2. Wegschieben       → kein Zug, der Zahn steht wieder
    3. kurzer Mausklick  → genau ein Zug (pointerup und click dürfen nicht beide zählen)
    4. Obergrenze        → nach 4 s federt der Zahn zurück, das späte Loslassen zählt nicht
    5. Tastatur          → Eingabetaste auf dem Zahn zählt einen Zug
    6. Finger-Tipp       → ein Tipp auf dem Berührungsbildschirm zählt genau einen Zug
    7. ein Zahn          → Runde bleibt beim Halten offen und schnappt erst nach dem Loslassen zu
    8. wackelnder Finger → 14 px Weg auf dem Zahn brechen das Halten nicht ab (echte Berührung)
    9. Finger weggeschoben → 120 px Weg nehmen den Druck zurück

Aufruf (der Entwicklungsserver muss laufen):
    uv run --with playwright python scripts/pruefen-halten.py [URL]

Rückgabe 0 = in Ordnung, 1 = Fund.
"""
import json
import sys

from playwright.sync_api import sync_playwright

from freischaltung import ABLAGE, ALLE_OFFEN

URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4321"
SETTINGS_KEY = "zahn_agent:settings:v1"

ZEHN_ZAEHNE = {"mode": "original", "players": 1, "sound": False, "vibration": False,
               "creature": "crocodile", "teethOverride": 10}
EIN_ZAHN = {"mode": "original", "players": 1, "sound": False, "vibration": False,
            "creature": "vampire", "teethOverride": 1}

MITTE = """(zahn) => {
  const tooth = document.querySelector(`.tooth[data-tooth="${zahn}"]`);
  const r = tooth.querySelector('.tooth__hit').getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}"""

LAGE = """(zahn) => {
  const tooth = document.querySelector(`.tooth[data-tooth="${zahn}"]`);
  return {
    fortschritt: document.getElementById('hud-progress').textContent.trim(),
    status: document.getElementById('stage').dataset.status,
    gehalten: tooth.classList.contains('is-held'),
    gedrueckt: tooth.getAttribute('aria-pressed') === 'true',
  };
}"""


def main() -> int:
    funde: list[str] = []

    def pruefe(gut: bool, text: str) -> None:
        print(("  ok    " if gut else "  FUND  ") + text)
        if not gut:
            funde.append(text)

    with sync_playwright() as p:
        browser = p.chromium.launch()

        def neue_seite(einstellungen: dict, beruehrung: bool = False):
            kontext = browser.new_context(viewport={"width": 390, "height": 844}, has_touch=beruehrung)
            seite = kontext.new_page()
            seite.goto(URL, wait_until="load")
            seite.evaluate("([k, v]) => localStorage.setItem(k, v)",
                           [SETTINGS_KEY, json.dumps(einstellungen)])
            # Seit dem 13.10.2026 öffnen sich die Tiere über Sterne — die Sonde bringt ein Protokoll mit, das alle öffnet.
            seite.evaluate("([k, v]) => localStorage.setItem(k, v)", [ABLAGE, ALLE_OFFEN])
            seite.reload(wait_until="load")
            seite.wait_for_timeout(600)
            return seite

        print("1 — Halten")
        seite = neue_seite(ZEHN_ZAEHNE)
        stelle = seite.evaluate(MITTE, "3")
        seite.mouse.move(stelle["x"], stelle["y"])
        seite.mouse.down()
        seite.wait_for_timeout(1500)
        lage = seite.evaluate(LAGE, "3")
        pruefe(lage["fortschritt"] == "0 von 10 gedrückt", f"beim Halten kein Zug (steht: {lage['fortschritt']})")
        pruefe(lage["gehalten"] and not lage["gedrueckt"], "der gehaltene Zahn trägt is-held und ist nicht gedrückt")
        seite.mouse.up()
        seite.wait_for_timeout(300)
        lage = seite.evaluate(LAGE, "3")
        pruefe(lage["fortschritt"] == "1 von 10 gedrückt", f"Loslassen zählt genau einen Zug (steht: {lage['fortschritt']})")
        pruefe(lage["gedrueckt"] and not lage["gehalten"], "nach dem Loslassen ist der Zahn gedrückt")
        seite.context.close()

        print("2 — Wegschieben")
        seite = neue_seite(ZEHN_ZAEHNE)
        stelle = seite.evaluate(MITTE, "3")
        seite.mouse.move(stelle["x"], stelle["y"])
        seite.mouse.down()
        seite.wait_for_timeout(300)
        seite.mouse.move(4, 4, steps=6)
        seite.mouse.up()
        seite.wait_for_timeout(300)
        lage = seite.evaluate(LAGE, "3")
        pruefe(lage["fortschritt"] == "0 von 10 gedrückt", f"weggeschoben zählt nicht (steht: {lage['fortschritt']})")
        pruefe(not lage["gehalten"] and not lage["gedrueckt"], "der Zahn steht wieder")
        seite.context.close()

        print("3 — kurzer Mausklick")
        seite = neue_seite(ZEHN_ZAEHNE)
        stelle = seite.evaluate(MITTE, "3")
        seite.mouse.click(stelle["x"], stelle["y"])
        seite.wait_for_timeout(1200)
        lage = seite.evaluate(LAGE, "3")
        pruefe(lage["fortschritt"] == "1 von 10 gedrückt", f"ein Klick ist ein Zug (steht: {lage['fortschritt']})")
        seite.context.close()

        print("4 — Obergrenze")
        seite = neue_seite(ZEHN_ZAEHNE)
        stelle = seite.evaluate(MITTE, "3")
        seite.mouse.move(stelle["x"], stelle["y"])
        seite.mouse.down()
        seite.wait_for_timeout(4500)
        lage = seite.evaluate(LAGE, "3")
        pruefe(not lage["gehalten"], "nach 4 s federt der Zahn zurück")
        seite.mouse.up()
        seite.wait_for_timeout(300)
        lage = seite.evaluate(LAGE, "3")
        pruefe(lage["fortschritt"] == "0 von 10 gedrückt", f"das späte Loslassen zählt nicht (steht: {lage['fortschritt']})")
        seite.context.close()

        print("5 — Tastatur")
        seite = neue_seite(ZEHN_ZAEHNE)
        seite.focus('.tooth[data-tooth="3"]')
        seite.keyboard.press("Enter")
        seite.wait_for_timeout(1200)
        lage = seite.evaluate(LAGE, "3")
        pruefe(lage["fortschritt"] == "1 von 10 gedrückt", f"Eingabetaste zählt einen Zug (steht: {lage['fortschritt']})")
        seite.context.close()

        print("6 — Finger-Tipp")
        seite = neue_seite(ZEHN_ZAEHNE, beruehrung=True)
        stelle = seite.evaluate(MITTE, "3")
        seite.touchscreen.tap(stelle["x"], stelle["y"])
        seite.wait_for_timeout(1200)
        lage = seite.evaluate(LAGE, "3")
        pruefe(lage["fortschritt"] == "1 von 10 gedrückt", f"ein Finger-Tipp ist ein Zug (steht: {lage['fortschritt']})")
        seite.context.close()

        print("7 — ein Zahn: das Urteil kommt erst nach dem Loslassen")
        seite = neue_seite(EIN_ZAHN)
        stelle = seite.evaluate(MITTE, "1")
        seite.mouse.move(stelle["x"], stelle["y"])
        seite.mouse.down()
        seite.wait_for_timeout(1500)
        lage = seite.evaluate(LAGE, "1")
        pruefe(lage["status"] == "open", f"beim Halten bleibt die Runde offen (ist: {lage['status']})")
        seite.mouse.up()
        seite.wait_for_timeout(400)
        lage = seite.evaluate(LAGE, "1")
        pruefe(lage["status"] == "snapped", f"nach dem Loslassen schnappt es zu (ist: {lage['status']})")
        seite.context.close()

        def finger(seite, zahn: str, weg: float) -> dict:
            """Legt einen Finger auf, lässt ihn `weg` px wandern und hebt ihn ab (echte Berührung)."""
            stelle = seite.evaluate(MITTE, zahn)
            cdp = seite.context.new_cdp_session(seite)

            def punkt(x: float, y: float) -> list[dict]:
                return [{"x": x, "y": y, "id": 1}]

            cdp.send("Input.dispatchTouchEvent",
                     {"type": "touchStart", "touchPoints": punkt(stelle["x"], stelle["y"])})
            seite.wait_for_timeout(400)
            for schritt in range(1, 5):
                cdp.send("Input.dispatchTouchEvent",
                         {"type": "touchMove",
                          "touchPoints": punkt(stelle["x"] + weg * schritt / 4, stelle["y"])})
                seite.wait_for_timeout(60)
            seite.wait_for_timeout(400)
            cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
            seite.wait_for_timeout(300)
            return seite.evaluate(LAGE, zahn)

        print("8 — wackelnder Finger")
        seite = neue_seite(ZEHN_ZAEHNE, beruehrung=True)
        lage = finger(seite, "3", 14)
        pruefe(lage["fortschritt"] == "1 von 10 gedrückt",
               f"14 px Wackeln auf dem Zahn bricht das Halten nicht ab (steht: {lage['fortschritt']})")
        seite.context.close()

        print("9 — Finger vom Zahn geschoben")
        seite = neue_seite(ZEHN_ZAEHNE, beruehrung=True)
        lage = finger(seite, "3", 120)
        pruefe(lage["fortschritt"] == "0 von 10 gedrückt",
               f"120 px weggeschoben zählt nicht (steht: {lage['fortschritt']})")
        pruefe(not lage["gehalten"] and not lage["gedrueckt"], "der Zahn steht wieder")
        seite.context.close()

        browser.close()

    print(f"\nAuffälligkeiten: {len(funde)}")
    return 1 if funde else 0


if __name__ == "__main__":
    sys.exit(main())
