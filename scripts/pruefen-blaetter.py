"""Beweis am lebenden Gegenstand: Bleiben die Blaetter offen, solange man darin arbeitet?

Vier Fehler vom 12.10.2026, jeder im echten Browser nachgestellt:

  1. Tastatur: Enter/Leertaste auf einem Knopf im Einstellungsblatt schloss das Blatt (der Klick
     der Tastatur traegt die Koordinaten 0/0 und galt als "daneben").
  2. Tablet: ein Tipp auf eine obere Kachel der Tier-Auswahl schloss auch das Einstellungsblatt
     (das Auswahlblatt ist hoeher; die Kachel lag geometrisch neben dem unteren Blatt).
  3. Nach dem Biss: ein weiterer Tipp auf die Buehne schloss das Ergebnis; danach war nur noch das
     Zahnrad sichtbar. Jetzt bleibt das Ergebnis stehen und auf der Buehne steht "Neue Runde".
  4. Dasselbe Tier erneut getippt verwarf die eigene Zahnzahl und startete die Runde neu.

Dazu die Gegenprobe: ein Zeigertipp neben das Einstellungsblatt schliesst es weiterhin.

Aufruf (der Server muss laufen):

    uv run --with playwright python scripts/pruefen-blaetter.py
    uv run --with playwright python scripts/pruefen-blaetter.py https://zahn-agent.schaflabs.com

Erwartet: "ERGEBNIS: in Ordnung" und Exit 0.
"""
import json
import sys

from playwright.sync_api import sync_playwright

BASIS = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4321"
HANDY = {"width": 390, "height": 844}
BLICKE = [HANDY, {"width": 768, "height": 1024}, {"width": 1180, "height": 820}, {"width": 1366, "height": 1024}]
SCHLUESSEL = "zahn_agent:settings:v1"


def offen(page, kennung: str) -> bool:
    return page.evaluate("(k) => document.getElementById(k).open === true", kennung)


def frisch(browser, blick, einstellungen=None):
    """Neue Seite; die Einstellungen werden nur gesetzt, solange noch keine gespeichert sind."""
    context = browser.new_context(viewport=blick)
    if einstellungen is not None:
        context.add_init_script(
            "if (!localStorage.getItem('%s')) localStorage.setItem('%s', %s);"
            % (SCHLUESSEL, SCHLUESSEL, json.dumps(json.dumps(einstellungen)))
        )
    page = context.new_page()
    page.goto(BASIS, wait_until="load")
    page.wait_for_selector(".tooth")
    return context, page


def main() -> int:
    funde = []
    with sync_playwright() as p:
        browser = p.chromium.launch()

        # 1. Tastatur im Einstellungsblatt
        for blick in (HANDY, {"width": 1180, "height": 820}):
            for name, ziel, taste in (
                ("Enter auf Minus", "#teeth-minus", "Enter"),
                ("Leertaste auf Minus", "#teeth-minus", " "),
                ("Leertaste auf Ton", "#opt-sound", " "),
                ("Enter auf Spielerzahl 2", '#opt-players [data-players="2"]', "Enter"),
            ):
                context, page = frisch(browser, blick)
                page.click("#settings-open")
                page.focus(ziel)
                page.keyboard.press(taste)
                bleibt = offen(page, "settings-sheet")
                print(f"Tastatur {blick['width']} px, {name}: Blatt offen = {bleibt}")
                if not bleibt:
                    funde.append(f"{blick['width']} px: {name} schliesst das Einstellungsblatt")
                context.close()

        # 2. Tier-Auswahl: nur das Auswahlblatt schliesst sich — in jeder Breite, jede Kachelreihe
        for blick in BLICKE:
            context, page = frisch(browser, blick)
            page.click("#settings-open")
            for tier in ("wolf", "crocodile", "sabertooth"):
                page.click("#creature-open")
                page.click(f'#creature-list [data-creature="{tier}"]')
                stand = (offen(page, "creature-sheet"), offen(page, "settings-sheet"))
                print(f"Auswahl {blick['width']} px, {tier}: Auswahl offen = {stand[0]}, "
                      f"Einstellungen offen = {stand[1]}")
                if stand[0]:
                    funde.append(f"{blick['width']} px: Auswahlblatt nach Tipp auf {tier} noch offen")
                if not stand[1]:
                    funde.append(f"{blick['width']} px: Tipp auf {tier} schliesst das Einstellungsblatt mit")
                    page.click("#settings-open")
            # Gegenprobe: ein Zeigertipp neben das Blatt schliesst es weiterhin.
            page.mouse.click(blick["width"] / 2, 40)
            if offen(page, "settings-sheet"):
                funde.append(f"{blick['width']} px: Tipp neben das Einstellungsblatt schliesst es nicht mehr")
            print(f"Gegenprobe {blick['width']} px: Tipp daneben schliesst = "
                  f"{not offen(page, 'settings-sheet')}")
            context.close()

        # 3. Nach dem Biss (ein Zahn: der erste Tipp schnappt sicher zu)
        ein_zahn = {"creature": "crocodile", "teethOverride": 1, "sound": False, "vibration": False,
                    "mode": "original", "players": 1}
        context, page = frisch(browser, HANDY, ein_zahn)
        vorher = page.evaluate("() => getComputedStyle(document.getElementById('restart-round')).display")
        page.click('.tooth[data-tooth="1"]')
        page.wait_for_selector("#result-sheet[open]")
        page.mouse.click(195, 250)  # weiter auf die Buehne getippt
        ergebnis_steht = offen(page, "result-sheet")
        page.click("#result-sheet [data-close-sheet]")
        knopf = page.evaluate(
            """() => {
              const k = document.getElementById('restart-round');
              const r = k.getBoundingClientRect();
              return { display: getComputedStyle(k).display, breite: r.width, hoehe: r.height,
                       imBild: r.top >= 0 && r.bottom <= innerHeight };
            }"""
        )
        page.click("#restart-round")
        nachher = page.evaluate(
            """() => ({ status: document.getElementById('stage').dataset.status,
                        display: getComputedStyle(document.getElementById('restart-round')).display })"""
        )
        print("Nach dem Biss: Ergebnis bleibt nach Tipp auf die Buehne =", ergebnis_steht,
              "| Knopf vorher:", vorher, "| nach Schliessen:", knopf, "| nach Neue Runde:", nachher)
        if vorher != "none":
            funde.append("'Neue Runde' steht schon bei offener Runde auf der Buehne")
        if not ergebnis_steht:
            funde.append("Tipp auf die Buehne schliesst das Ergebnis-Blatt")
        if knopf["display"] == "none" or knopf["hoehe"] < 44 or not knopf["imBild"]:
            funde.append(f"'Neue Runde' nach dem Schliessen nicht erreichbar: {knopf}")
        if nachher["status"] != "open" or nachher["display"] != "none":
            funde.append(f"'Neue Runde' startet keine Runde: {nachher}")
        context.close()

        # 4. Dasselbe Tier erneut tippen laesst die eigene Zahnzahl stehen
        fuenf = {"creature": "crocodile", "teethOverride": 5, "sound": False, "vibration": False,
                 "mode": "original", "players": 1}
        context, page = frisch(browser, HANDY, fuenf)
        page.click("#settings-open")
        page.click("#creature-open")
        page.click('#creature-list [data-creature="crocodile"]')
        zaehne = page.locator(".tooth").count()
        print("Dasselbe Tier erneut getippt: Zaehne auf der Buehne =", zaehne)
        if zaehne != 5:
            funde.append(f"Dasselbe Tier erneut getippt: {zaehne} statt 5 Zaehne")
        context.close()

        browser.close()
    for fund in funde:
        print("FUND:", fund)
    print("ERGEBNIS:", "in Ordnung" if not funde else "FEHLER")
    return 0 if not funde else 1


if __name__ == "__main__":
    sys.exit(main())
