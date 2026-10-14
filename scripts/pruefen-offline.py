"""
Offline-Sonde: prüft im **echten Browser**, dass die gebaute Seite ohne Netz startet.

Der Service Worker (`public/sw.js`) wird nur im Bau angemeldet — der Entwicklungsserver genügt
hier also **nicht**. Vorher bauen und die Vorschau starten:

    pnpm build
    pnpm preview --port 4322

Geprüft wird:

    1. Anmeldung   → nach dem ersten Laden steuert ein Service Worker die Seite
    2. Vorrat      → beide Seiten, ihre Bausteine (_astro/…) und das Manifest liegen darin
    3. ohne Netz   → die Spielseite lädt neu, zeichnet ihre Zähne und zählt einen Druck
    4. ohne Netz   → die Statistikseite lädt
    5. ohne Netz   → keine Anfrage der beiden Seiten ist gescheitert

Aufruf:
    uv run --with playwright python scripts/pruefen-offline.py [URL]

Rückgabe 0 = in Ordnung, 1 = Fund.
"""
import sys

from playwright.sync_api import sync_playwright

from sonde import Sonde, basis_adresse

URL = basis_adresse().rstrip("/") + "/"

VORRAT = """async () => {
  const namen = await caches.keys();
  const adressen = [];
  for (const name of namen) {
    for (const eintrag of await (await caches.open(name)).keys()) adressen.push(eintrag.url);
  }
  return adressen;
}"""


def main() -> int:
    sonde = Sonde("Offline")
    pruefe = sonde.pruefe

    with sync_playwright() as p:
        browser = p.chromium.launch()
        kontext = browser.new_context(viewport={"width": 390, "height": 844})
        seite = kontext.new_page()
        gescheitert: list[str] = []
        seite.on("requestfailed", lambda anfrage: gescheitert.append(anfrage.url))

        print("1 — Anmeldung")
        seite.goto(URL, wait_until="load")
        try:
            seite.wait_for_function("navigator.serviceWorker && navigator.serviceWorker.controller !== null",
                                    timeout=15000)
            gesteuert = True
        except Exception:
            gesteuert = False
        pruefe(gesteuert, "ein Service Worker steuert die Seite")

        print("2 — Vorrat")
        adressen = seite.evaluate(VORRAT)
        bausteine = [a for a in adressen if "/_astro/" in a]
        pruefe(URL in adressen, "die Spielseite liegt im Vorrat")
        pruefe(URL + "statistik" in adressen or URL + "statistik/" in adressen, "die Statistikseite liegt im Vorrat")
        pruefe(len(bausteine) > 0, f"Bausteine liegen im Vorrat ({len(bausteine)} unter _astro/)")
        pruefe(URL + "manifest.webmanifest" in adressen, "das Manifest liegt im Vorrat")

        print("3 — Spielseite ohne Netz")
        kontext.set_offline(True)
        gescheitert.clear()
        seite.reload(wait_until="load")
        seite.wait_for_timeout(600)
        zaehne = seite.locator(".tooth").count()
        pruefe(zaehne > 0, f"die Bühne zeichnet ihre Zähne ({zaehne})")
        hoehe = seite.evaluate("getComputedStyle(document.querySelector('.stage')).borderRadius")
        pruefe(hoehe == "18px", f"das Stylesheet ist geladen (Bühnenradius {hoehe})")
        vorher = seite.locator("#hud-progress").inner_text().strip()
        seite.focus(".tooth")
        seite.keyboard.press("Enter")
        seite.wait_for_timeout(1500)
        nachher = seite.locator("#hud-progress").inner_text().strip()
        pruefe(vorher.startswith("0 von") and nachher.startswith("1 von"),
               f"ein Druck zählt ({vorher} → {nachher})")

        print("4 — Statistikseite ohne Netz")
        try:
            seite.goto(URL + "statistik", wait_until="load")
            titel = seite.title()
        except Exception as fehler:  # ohne Vorrat endet der Aufruf mit einem Netzfehler
            titel = f"Fehler: {fehler}"
        pruefe("Statistik" in titel, f"die Statistikseite lädt (Titel: {titel})")

        print("5 — gescheiterte Anfragen ohne Netz")
        pruefe(not gescheitert, f"keine ({len(gescheitert)}): {', '.join(gescheitert[:5])}")

        browser.close()

    return sonde.abschluss()


if __name__ == "__main__":
    sys.exit(main())
