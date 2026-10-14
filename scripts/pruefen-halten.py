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
import sys

from playwright.sync_api import sync_playwright

from sonde import Sonde, basis_adresse, einstellungen, seite

URL = basis_adresse()

ZEHN_ZAEHNE = einstellungen("crocodile", 10)
EIN_ZAHN = einstellungen("vampire", 1)

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
    sonde = Sonde("Halten")
    pruefe = sonde.pruefe

    with sync_playwright() as p:
        browser = p.chromium.launch()

        def neue_seite(cfg: dict, beruehrung: bool = False):
            s = seite(
                browser,
                breite=390,
                hoehe=844,
                tier=cfg["creature"],
                zaehne=cfg["teethOverride"],
                beruehrung=beruehrung,
                url=URL,
            )
            s.wait_for_timeout(600)
            return s

        print("1 — Halten")
        page = neue_seite(ZEHN_ZAEHNE)
        stelle = page.evaluate(MITTE, "3")
        page.mouse.move(stelle["x"], stelle["y"])
        page.mouse.down()
        page.wait_for_timeout(1500)
        lage = page.evaluate(LAGE, "3")
        pruefe(lage["fortschritt"] == "0 von 10 gedrückt", f"beim Halten kein Zug (steht: {lage['fortschritt']})")
        pruefe(lage["gehalten"] and not lage["gedrueckt"], "der gehaltene Zahn trägt is-held und ist nicht gedrückt")
        page.mouse.up()
        page.wait_for_timeout(300)
        lage = page.evaluate(LAGE, "3")
        pruefe(lage["fortschritt"] == "1 von 10 gedrückt", f"Loslassen zählt genau einen Zug (steht: {lage['fortschritt']})")
        pruefe(lage["gedrueckt"] and not lage["gehalten"], "nach dem Loslassen ist der Zahn gedrückt")
        page.context.close()

        print("2 — Wegschieben")
        page = neue_seite(ZEHN_ZAEHNE)
        stelle = page.evaluate(MITTE, "3")
        page.mouse.move(stelle["x"], stelle["y"])
        page.mouse.down()
        page.wait_for_timeout(300)
        page.mouse.move(4, 4, steps=6)
        page.mouse.up()
        page.wait_for_timeout(300)
        lage = page.evaluate(LAGE, "3")
        pruefe(lage["fortschritt"] == "0 von 10 gedrückt", f"weggeschoben zählt nicht (steht: {lage['fortschritt']})")
        pruefe(not lage["gehalten"] and not lage["gedrueckt"], "der Zahn steht wieder")
        page.context.close()

        print("3 — kurzer Mausklick")
        page = neue_seite(ZEHN_ZAEHNE)
        stelle = page.evaluate(MITTE, "3")
        page.mouse.click(stelle["x"], stelle["y"])
        page.wait_for_timeout(1200)
        lage = page.evaluate(LAGE, "3")
        pruefe(lage["fortschritt"] == "1 von 10 gedrückt", f"ein Klick ist ein Zug (steht: {lage['fortschritt']})")
        page.context.close()

        print("4 — Obergrenze")
        page = neue_seite(ZEHN_ZAEHNE)
        stelle = page.evaluate(MITTE, "3")
        page.mouse.move(stelle["x"], stelle["y"])
        page.mouse.down()
        page.wait_for_timeout(4500)
        lage = page.evaluate(LAGE, "3")
        pruefe(not lage["gehalten"], "nach 4 s federt der Zahn zurück")
        page.mouse.up()
        page.wait_for_timeout(300)
        lage = page.evaluate(LAGE, "3")
        pruefe(lage["fortschritt"] == "0 von 10 gedrückt", f"das späte Loslassen zählt nicht (steht: {lage['fortschritt']})")
        page.context.close()

        print("5 — Tastatur")
        page = neue_seite(ZEHN_ZAEHNE)
        page.focus('.tooth[data-tooth="3"]')
        page.keyboard.press("Enter")
        page.wait_for_timeout(1200)
        lage = page.evaluate(LAGE, "3")
        pruefe(lage["fortschritt"] == "1 von 10 gedrückt", f"Eingabetaste zählt einen Zug (steht: {lage['fortschritt']})")
        page.context.close()

        print("6 — Finger-Tipp")
        page = neue_seite(ZEHN_ZAEHNE, beruehrung=True)
        stelle = page.evaluate(MITTE, "3")
        page.touchscreen.tap(stelle["x"], stelle["y"])
        page.wait_for_timeout(1200)
        lage = page.evaluate(LAGE, "3")
        pruefe(lage["fortschritt"] == "1 von 10 gedrückt", f"ein Finger-Tipp ist ein Zug (steht: {lage['fortschritt']})")
        page.context.close()

        print("7 — ein Zahn: das Urteil kommt erst nach dem Loslassen")
        page = neue_seite(EIN_ZAHN)
        stelle = page.evaluate(MITTE, "1")
        page.mouse.move(stelle["x"], stelle["y"])
        page.mouse.down()
        page.wait_for_timeout(1500)
        lage = page.evaluate(LAGE, "1")
        pruefe(lage["status"] == "open", f"beim Halten bleibt die Runde offen (ist: {lage['status']})")
        page.mouse.up()
        page.wait_for_timeout(400)
        lage = page.evaluate(LAGE, "1")
        pruefe(lage["status"] == "snapped", f"nach dem Loslassen schnappt es zu (ist: {lage['status']})")
        page.context.close()

        def finger(page_obj, zahn: str, weg: float) -> dict:
            """Legt einen Finger auf, lässt ihn `weg` px wandern und hebt ihn ab (echte Berührung)."""
            stelle = page_obj.evaluate(MITTE, zahn)
            cdp = page_obj.context.new_cdp_session(page_obj)

            def punkt(x: float, y: float) -> list[dict]:
                return [{"x": x, "y": y, "id": 1}]

            cdp.send("Input.dispatchTouchEvent",
                     {"type": "touchStart", "touchPoints": punkt(stelle["x"], stelle["y"])})
            page_obj.wait_for_timeout(400)
            for schritt in range(1, 5):
                cdp.send("Input.dispatchTouchEvent",
                         {"type": "touchMove",
                          "touchPoints": punkt(stelle["x"] + weg * schritt / 4, stelle["y"])})
                page_obj.wait_for_timeout(60)
            page_obj.wait_for_timeout(400)
            cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
            page_obj.wait_for_timeout(300)
            return page_obj.evaluate(LAGE, zahn)

        print("8 — wackelnder Finger")
        page = neue_seite(ZEHN_ZAEHNE, beruehrung=True)
        lage = finger(page, "3", 14)
        pruefe(lage["fortschritt"] == "1 von 10 gedrückt",
               f"14 px Wackeln auf dem Zahn bricht das Halten nicht ab (steht: {lage['fortschritt']})")
        page.context.close()

        print("9 — Finger vom Zahn geschoben")
        page = neue_seite(ZEHN_ZAEHNE, beruehrung=True)
        lage = finger(page, "3", 120)
        pruefe(lage["fortschritt"] == "0 von 10 gedrückt",
               f"120 px weggeschoben zählt nicht (steht: {lage['fortschritt']})")
        pruefe(not lage["gehalten"] and not lage["gedrueckt"], "der Zahn steht wieder")
        page.context.close()

        browser.close()

    return sonde.abschluss()


if __name__ == "__main__":
    sys.exit(main())
