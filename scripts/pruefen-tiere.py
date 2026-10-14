"""Beweis am lebenden Gegenstand: Zeigt die Tier-Auswahl alle Lebewesen — mit Bild — und wählt
**ein** Tipp?

Zaehlt im echten Browser die Kopfbilder in der Tier-Zeile des Einstellungsblatts, liest die
Namen daneben und legt ein Bild des Blatts ab. Zusaetzlich wird der Katalog im ausgelieferten
Buendel gezaehlt: die Kennungen, die der Zufallsgeber kennt, muessen die Bilder decken.

Neu am 12.10.2026 (Wunsch des Auftraggebers: „Man muss sonst immer erst nochmal bestaetigen …
das nervt"): Nach dem Tipp auf eine Kachel ist das Auswahlblatt **zu**, das Einstellungsblatt
bleibt offen und traegt den neuen Namen. Wer das Blatt erneut oeffnet, sieht die Marke auf dem
gewaehlten Tier und dessen Kurzinfo — die Auskunft bleibt also erreichbar.

Seit dem Umbau der Spielseite (12.10.2026, Bedienleiste) oeffnet sich das Auswahlblatt direkt von
der Spielseite; die Kurzinfo steht im Regeln-Blatt.

Aufruf (die **gebaute** Seite bzw. die veröffentlichte; der Katalog wird im ausgelieferten Bündel
gezählt — im Entwicklungsmodus liefert Astro einzelne Module statt eines Bündels, dann meldet die
Zählung leer und die Sonde schlägt fehl, obwohl der Baum in Ordnung ist):

    uv run --with playwright python scripts/pruefen-tiere.py http://localhost:4322
    uv run --with playwright python scripts/pruefen-tiere.py https://zahn-agent.schaflabs.com

Das Bild landet unter $TMPDIR/zahn_agent-artwork/tiere-live.png.
"""
import os
import re
import sys
from pathlib import Path

import json

from playwright.sync_api import sync_playwright

from freischaltung import ABLAGE, ALLE_OFFEN

BASIS = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4321"
ZIEL = Path(os.environ.get("TMPDIR", "/tmp")) / "zahn_agent-artwork" / "tiere-live.png"

# Erwartet wird je Lebewesen des Katalogs ein Kopfbild in der Zeile. Seit dem 13.10.2026 folgt die
# Auswahl der Freischaltung (`UNLOCK_ORDER` in `core/domain/unlocks.ts`): erst die drei
# Starttiere, dann das jeweils naechste Tier. Die Liste ist die Gegenprobe, nicht die Quelle.
ERWARTET = ["crocodile", "mouse", "wolf", "shark", "panda", "human", "lion", "vampire",
            "panther", "sabertooth", "flytrap", "trex"]

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

# Zustand nach **einem** Tipp auf eine Kachel: Blatt zu, Wahl uebernommen, Kurzinfo gefuellt.
EIN_TIPP = """
() => {
  const blatt = document.getElementById('creature-sheet');
  const text = (id) => ((document.getElementById(id) || {}).textContent || '').trim();
  return {
    blattOffen: blatt.open === true && getComputedStyle(blatt).display !== 'none',
    name: text('creature-name'),
    buehne: document.querySelector('svg.creature').dataset.creature,
    linie: text('creature-detail-line'),
    notiz: text('creature-detail-note'),
    markiert: Array.from(blatt.querySelectorAll('#creature-list button[data-creature]'))
      .filter((b) => b.getAttribute('aria-pressed') === 'true')
      .map((b) => b.getAttribute('data-creature')),
    angezeigt: Array.from(blatt.querySelectorAll('#creature-list button[data-creature]'))
      .filter((b) => b.getAttribute('aria-pressed') === 'true').length,
    // Name der markierten Kachel -- die Gegenprobe zum Namen im Einstellungsblatt. Umlaute
    // duerfen hier nicht von Hand getippt werden: verglichen wird, was wirklich dasteht.
    nameDerMarke: (() => {
      const b = blatt.querySelector('#creature-list button[aria-pressed="true"] .creature-grid__name');
      return b ? b.textContent.trim() : '';
    })(),
  };
}
"""


def main() -> int:
    ZIEL.parent.mkdir(parents=True, exist_ok=True)
    funde = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 390, "height": 844})
        # Seit dem 13.10.2026 öffnen sich die Tiere über Sterne — die Sonde bringt ein Protokoll mit, das alle öffnet.
        page.add_init_script("if (!localStorage.getItem('%s')) localStorage.setItem('%s', %s);" % (ABLAGE, ABLAGE, json.dumps(ALLE_OFFEN)))
        page.goto(BASIS, wait_until="load")
        # „Welches Tier?" ist eine Kachel, die ein zweites Blatt oeffnet: erst antippen.
        page.click("#creature-open")
        page.wait_for_timeout(700)
        masse = page.evaluate(ZAEHLEN)
        page.locator("#creature-sheet").screenshot(path=str(ZIEL))
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

        # Ein Tipp auf den Loewen: waehlt ihn, schliesst das Auswahlblatt, laesst das
        # Einstellungsblatt offen. Die Notiz kommt aus dem nachgeladenen Buendel.
        page.click('#creature-list button[data-creature="lion"]')
        page.wait_for_timeout(500)
        loewe = page.evaluate(EIN_TIPP)
        # Und das neue Lebewesen: die vier Fangzaehne sind sein Unterschied zum Loewen.
        page.click("#creature-open")
        page.wait_for_timeout(400)
        wieder_offen = page.evaluate(EIN_TIPP)
        page.click('#creature-list button[data-creature="panther"]')
        page.wait_for_timeout(500)
        panther = page.evaluate(EIN_TIPP)
        print("Tier-Blatt offen:", masse["offen"], "| sichtbar:", not masse["geschlossen"])
        print("Kacheln:", len(masse["ids"]), masse["ids"])
        print("Namen:", masse["namen"])
        print("Kopfbilder:", masse["koepfe"], "davon sichtbar:", masse["sichtbar"],
              "| eigene Beschnitte:", masse["eindeutigeKennungen"])
        print("Groesse des ersten Kopfbilds:", masse["groesse"], "px")
        print("Kennungen im Buendel:", im_buendel)
        print("Nach dem Tipp auf den Loewen:", loewe)
        print("Blatt erneut geoeffnet:", wieder_offen)
        print("Nach dem Tipp auf den Panther:", panther)
        fehlt = [k for k in ERWARTET if k not in im_buendel]
        browser.close()
    print("Bild:", ZIEL)
    # Nur eine Auskunft, kein Urteil: zwei Tiere tragen auf der Kachel absichtlich den kurzen Namen
    # (Säbelzahntiger → Säbelkatze, Venusfliegenfalle → Fliegenfalle), ihr voller Name steht in
    # Sätzen, Regeln und Vorleser. Über die Kacheltreue wacht `pruefen-freischaltung.py`, über die
    # Länge `creature.test.ts`.
    print("Volle Namen, die im Seitentext fehlen (auf der Kachel steht der kurze):",
          [k for k in ["Panda", "Löwe", "Panther", "Säbelzahntiger", "Venusfliegenfalle", "T-Rex"]
           if k not in seite])
    # Vergleich ohne Gross-/Kleinschreibung: die Notiz beginnt mit "Vier Fangzähne", gesucht ist
    # das Wort -- sonst faellt die Sonde ueber ihren eigenen Suchtext.
    gut = (masse["ids"] == ERWARTET and masse["koepfe"] == len(ERWARTET)
           and masse["sichtbar"] == len(ERWARTET)
           and masse["eindeutigeKennungen"] == len(ERWARTET) and not fehlt
           # Der Wortlaut muss zur Zeichnung passen: zwei lange Fangzaehne und **drei** breite
           # Schneidezaehne (die vier waren nicht gespiegelt, siehe docs/e2e-nachweise.md 5o),
           # und der Panther muss seine vier Fangzaehne nennen.
           and "zwei lange fangzähne" in loewe["notiz"].lower()
           and "drei breite schneidezähne" in loewe["notiz"].lower()
           and "vier" not in loewe["notiz"].lower()
           and "vier fangzähne" in panther["notiz"].lower())
    if not gut:
        funde.append("Grundpruefung des Blatts (Kacheln, Bilder, Notizen)")
    # Der Kern der Aenderung: ein Tipp waehlt und schliesst.
    erwartete_kennung = {"Loewe": "lion", "Panther": "panther"}
    for name, stand in (("Loewe", loewe), ("Panther", panther)):
        if stand["blattOffen"]:
            funde.append(f"{name}: Auswahlblatt ist nach dem Tipp noch offen")
        if stand["buehne"] != erwartete_kennung[name]:
            funde.append(f"{name}: auf der Buehne steht {stand['buehne']!r}")
        if stand["name"] != stand["nameDerMarke"] or not stand["name"]:
            funde.append(f"{name}: der Tier-Griff nennt {stand['name']!r}, "
                         f"markierte Kachel {stand['nameDerMarke']!r}")
        if stand["markiert"] != [erwartete_kennung[name]]:
            funde.append(f"{name}: Marke steht auf {stand['markiert']!r}")
        if not stand["linie"] or not stand["notiz"]:
            funde.append(f"{name}: Kurzinfo ist leer")
    # Die Auskunft bleibt erreichbar: beim erneuten Oeffnen steht sie auf dem gewaehlten Tier.
    if wieder_offen["markiert"] != ["lion"]:
        funde.append(f"Nach dem Wieder-Oeffnen steht die Marke auf {wieder_offen['markiert']!r}")
    if "zwei lange fangzähne" not in wieder_offen["notiz"].lower():
        funde.append("Nach dem Wieder-Oeffnen fehlt die Kurzinfo des Loewen")
    for f in funde:
        print("FUND:", f)
    print("ERGEBNIS:", "in Ordnung" if gut and not funde else "FEHLER")
    return 0 if (gut and not funde) else 1


if __name__ == "__main__":
    sys.exit(main())
