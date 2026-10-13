"""Beweis am lebenden Gegenstand: Bleiben die Blaetter offen, solange man darin arbeitet?

Vier Fehler vom 12.10.2026, jeder im echten Browser nachgestellt:

  1. Tastatur: Enter/Leertaste auf einem Knopf im Einstellungsblatt schloss das Blatt (der Klick
     der Tastatur traegt die Koordinaten 0/0 und galt als "daneben").
  2. Tablet: ein Tipp auf eine obere Kachel der Tier-Auswahl schloss auch das Einstellungsblatt
     (das Auswahlblatt ist hoeher; die Kachel lag geometrisch neben dem unteren Blatt).
  3. Nach dem Biss: ein weiterer Tipp auf die Buehne schloss das Ergebnis; danach war nur noch das
     Zahnrad sichtbar. Seit dem 12.10.2026 gibt es dafuer kein Blatt mehr: das Ergebnis steht auf
     der Seite, bis "Neue Runde" (immer in der Leiste, nach dem Biss betont) es wegraeumt.
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

from freischaltung import ABLAGE, ALLE_OFFEN

BASIS = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4321"
HANDY = {"width": 390, "height": 844}
BLICKE = [HANDY, {"width": 768, "height": 1024}, {"width": 1180, "height": 820}, {"width": 1366, "height": 1024}]
SCHLUESSEL = "zahn_agent:settings:v1"


def offen(page, kennung: str) -> bool:
    return page.evaluate("(k) => document.getElementById(k).open === true", kennung)


def frisch(browser, blick, einstellungen=None):
    """Neue Seite; die Einstellungen werden nur gesetzt, solange noch keine gespeichert sind."""
    context = browser.new_context(viewport=blick)
    # Seit dem 13.10.2026 öffnen sich die Tiere über Sterne — die Sonde bringt ein Protokoll mit, das alle öffnet.
    context.add_init_script("if (!localStorage.getItem('%s')) localStorage.setItem('%s', %s);" % (ABLAGE, ABLAGE, json.dumps(ALLE_OFFEN)))
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
                ("Enter auf Modus", '#opt-mode [data-mode="classic"]', "Enter"),
                ("Leertaste auf Modus", '#opt-mode [data-mode="classic"]', " "),
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

        # 2. Tier-Auswahl: unter 640 px ein Blatt, das ein Tipp schliesst; ab 640 px die offene Reihe.
        for blick in BLICKE:
            context, page = frisch(browser, blick)
            schmal = blick["width"] < 640
            for tier in ("wolf", "crocodile", "sabertooth"):
                if schmal:
                    page.click("#creature-open")
                    page.click(f'#creature-list [data-creature="{tier}"]')
                else:
                    page.click(f'#creature-rail [data-creature="{tier}"]')
                noch_offen = offen(page, "creature-sheet")
                steht = page.evaluate("() => document.querySelector('svg.creature').dataset.creature")
                print(f"Auswahl {blick['width']} px, {tier}: Auswahl offen = {noch_offen}, Buehne = {steht}")
                if noch_offen:
                    funde.append(f"{blick['width']} px: Auswahlblatt nach Tipp auf {tier} noch offen")
                if steht != tier:
                    funde.append(f"{blick['width']} px: nach Tipp auf {tier} steht {steht} auf der Buehne")
            # Gegenprobe: ein Zeigertipp neben das Zahnrad-Blatt schliesst es weiterhin.
            page.click("#settings-open")
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
        betont_vorher = page.evaluate("() => document.getElementById('new-round').classList.contains('is-next')")
        page.click('.tooth[data-tooth="1"]')
        page.wait_for_selector("#result-panel:not(.hidden)")
        blatt_offen = page.locator("dialog[open]").count()
        page.mouse.click(195, 250)  # weiter auf die Buehne getippt
        ergebnis_steht = page.locator("#result-panel").is_visible()
        knopf = page.evaluate(
            """() => {
              const k = document.getElementById('new-round');
              const r = k.getBoundingClientRect();
              return { betont: k.classList.contains('is-next'), breite: r.width, hoehe: r.height,
                       imBild: r.top >= 0 && r.bottom <= innerHeight };
            }"""
        )
        page.click("#new-round")
        nachher = page.evaluate(
            """() => ({ status: document.getElementById('stage').dataset.status,
                        betont: document.getElementById('new-round').classList.contains('is-next') })"""
        )
        ergebnis_weg = not page.locator("#result-panel").is_visible()
        print("Nach dem Biss: offene Blaetter =", blatt_offen,
              "| Ergebnis bleibt nach Tipp auf die Buehne =", ergebnis_steht,
              "| betont vorher:", betont_vorher, "| Knopf:", knopf, "| nach Neue Runde:", nachher,
              "| Ergebnis weg =", ergebnis_weg)
        if betont_vorher:
            funde.append("'Neue Runde' ist schon bei offener Runde betont")
        if blatt_offen:
            funde.append("nach dem Biss oeffnet sich ein Blatt")
        if not ergebnis_steht:
            funde.append("Tipp auf die Buehne raeumt das Ergebnis weg")
        if not knopf["betont"] or knopf["hoehe"] < 48 or not knopf["imBild"]:
            funde.append(f"'Neue Runde' nach dem Biss nicht erreichbar oder nicht betont: {knopf}")
        if nachher["status"] != "open" or nachher["betont"]:
            funde.append(f"'Neue Runde' startet keine Runde: {nachher}")
        if not ergebnis_weg:
            funde.append("das Ergebnis steht nach 'Neue Runde' noch da")
        context.close()

        # 4. Dasselbe Tier erneut tippen laesst die eigene Zahnzahl stehen
        fuenf = {"creature": "crocodile", "teethOverride": 5, "sound": False, "vibration": False,
                 "mode": "original", "players": 1}
        context, page = frisch(browser, HANDY, fuenf)
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
