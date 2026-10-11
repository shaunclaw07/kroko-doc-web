"""Beweis am lebenden Gegenstand: Zeigt die Tier-Auswahl alle Lebewesen — mit Bild?

Zaehlt im echten Browser die Kopfbilder in der Tier-Zeile des Einstellungsblatts, liest die
Namen daneben und legt ein Bild des Blatts ab. Zusaetzlich wird der Katalog im ausgelieferten
Buendel gezaehlt: die Kennungen, die der Zufallsgeber kennt, muessen die Bilder decken.

Aufruf (Server muss laufen; Standard ist der Entwicklungsserver):

    uv run --with playwright python scripts/pruefen-tiere.py
    uv run --with playwright python scripts/pruefen-tiere.py https://zahn-agent.schaflabs.com

Das Bild landet unter $TMPDIR/zahn_agent-artwork/tiere-live.png.
"""
import os
import re
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

BASIS = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4321"
ZIEL = Path(os.environ.get("TMPDIR", "/tmp")) / "zahn_agent-artwork" / "tiere-live.png"

# Erwartet wird je Lebewesen des Katalogs ein Kopfbild in der Zeile.
ERWARTET = ["crocodile", "wolf", "human", "shark", "mouse", "vampire", "panda", "lion"]

ZAEHLEN = """
() => {
  const blatt = document.getElementById('creature-sheet');
  const kacheln = Array.from(blatt.querySelectorAll('#creature-list button[data-creature]'));
  const koepfe = kacheln.map((b) => b.querySelector('.creature-portrait'));
  return {
    offen: blatt.open === true,
    geschlossen: getComputedStyle(blatt).display === 'none',
    ids: kacheln.map((b) => b.getAttribute('data-creature')),
    namen: kacheln.map((b) => {
      const n = b.querySelector('.creature-grid__name');
      return n ? n.textContent.trim() : '';
    }),
    koepfe: koepfe.filter(Boolean).length,
    sichtbar: koepfe.filter((k) => k && k.getBoundingClientRect().width > 20).length,
    // Jede Kachel braucht ihren eigenen Beschnitt, sonst traegt eine den Umriss der anderen.
    eindeutigeKennungen: new Set(
      kacheln.flatMap((b) => Array.from(b.querySelectorAll('clipPath')).map((c) => c.id))
    ).size,
    groesse: koepfe[0] ? Math.round(koepfe[0].getBoundingClientRect().width) : 0,
  };
}
"""


def main() -> int:
    ZIEL.parent.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 390, "height": 844})
        page.goto(BASIS, wait_until="load")
        page.click("#settings-open")
        page.wait_for_timeout(500)
        # „Welches Tier?" ist eine Kachel, die ein zweites Blatt oeffnet: erst antippen.
        page.click("#creature-open")
        page.wait_for_timeout(700)
        masse = page.evaluate(ZAEHLEN)
        # Die Notiz der Tiere steht in einem nachgeladenen Buendel: erst der Tipp auf eine Kachel
        # holt sie hervor. Geprueft wird der Text, den der Nutzer wirklich liest.
        page.click('#creature-list button[data-creature="lion"]')
        page.wait_for_timeout(300)
        notiz = page.evaluate(
            "() => (document.getElementById('creature-detail-note') || {}).textContent || ''"
        )
        print("Notiz des Loewen:", notiz.strip())
        # Der Katalog im ausgelieferten Buendel: die Kennungen muessen zu den Bildern passen.
        quelle = page.content()
        seite = re.sub(r"<[^>]+>", " ", quelle)
        bundles = page.evaluate(
            """async () => {
              const pfade = Array.from(document.querySelectorAll('script[src]')).map((s) => s.src);
              let text = '';
              for (const pfad of pfade) { text += await (await fetch(pfad)).text(); }
              return text;
            }"""
        )
        im_buendel = [k for k in ERWARTET if k in bundles]
        print("Tier-Blatt offen:", masse["offen"], "| sichtbar:", not masse["geschlossen"])
        print("Kacheln:", len(masse["ids"]), masse["ids"])
        print("Namen:", masse["namen"])
        print("Kopfbilder:", masse["koepfe"], "davon sichtbar:", masse["sichtbar"],
              "| eigene Beschnitte:", masse["eindeutigeKennungen"])
        print("Groesse des ersten Kopfbilds:", masse["groesse"], "px")
        print("Kennungen im Buendel:", im_buendel)
        fehlt = [k for k in ERWARTET if k not in im_buendel]
        page.locator("#creature-sheet").screenshot(path=str(ZIEL))
        browser.close()
    print("Bild:", ZIEL)
    print("Namen im Seitentext fehlen:", [k for k in ["Panda", "Löwe"] if k not in seite])
    gut = (masse["ids"] == ERWARTET and masse["koepfe"] == len(ERWARTET)
           and masse["sichtbar"] == len(ERWARTET)
           and masse["eindeutigeKennungen"] == len(ERWARTET) and not fehlt
           and "Backenz" in notiz and "vier große Fangz" not in notiz)
    print("ERGEBNIS:", "in Ordnung" if gut else "FEHLER")
    return 0 if gut else 1


if __name__ == "__main__":
    sys.exit(main())
