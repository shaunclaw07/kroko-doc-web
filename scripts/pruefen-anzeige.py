"""
Anzeige-Sonde: prüft den Spannungs-Balken und seine zwei Aussagen im **echten Browser** an den
berechneten Stilen. jsdom rechnet kein CSS — genau daran ist der Fehler bisher vorbeigegangen.

Der Balken trägt zwei Aussagen, jede mit Wort daneben (`docs/domain-model.md`, „Was der Balken
zeigt"):

    Füllung = Fortschritt (gedrückte ÷ Zähne) · Farbe = Bissgefahr des **nächsten** Drucks

Beide müssen zum Text passen. Und wenn das Maul zu ist, gibt es keinen nächsten Druck — dann darf
dort **keine** Bissgefahr mehr stehen (gemeldet vom Auftraggeber: „Bissgefahr 100 % obwohl der Mund
zu ist"). Die Zustandsklassen müssen den Balken **erreichen**: er liegt außerhalb der Bühne, an
`#stage` gehängte Klassen haben ihn nie erreicht.

Geprüft wird in drei Lagen:

    1. ein Zahn               → Gefahr 100 %, Maul offen  (rot: Gefahrfarbe in Füllung und Text)
    2. zehn Zähne, ein Druck  → Gefahr 21 %               (Gegenprobe: **nicht** rot, grün→gold)
    3. ein Zahn, gedrückt     → Maul zu                   (keine Bissgefahr mehr, Füllung farblos)

Aufruf:
    uv run --with playwright python scripts/pruefen-anzeige.py [URL]

Ohne URL wird die veröffentlichte Seite geprüft. Rückgabe 0 = in Ordnung, 1 = Fund.
"""
import json
import sys

from playwright.sync_api import sync_playwright

from freischaltung import ABLAGE, ALLE_OFFEN

URL = sys.argv[1] if len(sys.argv) > 1 else "https://zahn-agent.schaflabs.com"
SETTINGS_KEY = "zahn_agent:settings:v1"

# Ein Zahn am Vampir: der erste Druck schnappt garantiert zu (Gefahr genau 1).
EIN_ZAHN = {"mode": "original", "players": 1, "sound": False, "vibration": False,
            "creature": "vampire", "teethOverride": 1}
# Zehn Zähne am Krokodil: nach einem Druck 21,3 % — deutlich unter der 50-%-Schwelle.
ZEHN_ZAEHNE = {"mode": "original", "players": 1, "sound": False, "vibration": False,
               "creature": "crocodile", "teethOverride": 10}

MESSUNG = """() => {
  const stage = document.getElementById('stage');
  const meter = document.getElementById('hud-meter');
  const panel = meter.closest('.tension-panel');
  const tension = document.getElementById('hud-tension');
  const progress = document.getElementById('hud-progress');
  const fuellung = getComputedStyle(meter);
  const wurzel = getComputedStyle(document.documentElement);
  const alsRgb = (name) => {
    const probe = document.createElement('span');
    probe.style.color = wurzel.getPropertyValue(name).trim();
    document.body.append(probe);
    const wert = getComputedStyle(probe).color;
    probe.remove();
    return wert;
  };
  return {
    status: stage.dataset.status,
    tensionWert: stage.dataset.tension,
    fortschrittText: progress.textContent.trim(),
    gefahrText: tension.textContent.trim(),
    gefahrTextBreite: tension.getBoundingClientRect().width,
    fuellBreite: fuellung.width,
    fuellFarbe: fuellung.backgroundImage,
    fuellAtmung: fuellung.animationDuration,
    gefahrTextFarbe: getComputedStyle(tension).color,
    klassen: panel ? panel.className : '(kein Balkenkasten gefunden)',
    balkenImStage: stage.contains(meter),
    farben: { ok: alsRgb('--ok'), gold: alsRgb('--gold'), danger: alsRgb('--danger') },
  };
}"""


def ruege(bedingungen: list[tuple[bool, str]]) -> list[str]:
    return [text for gut, text in bedingungen if not gut]


def zeige(titel: str, werte: dict) -> None:
    print(titel)
    for schluessel, wert in werte.items():
        print(f"  {schluessel:16s} {wert}")


def main() -> int:
    funde: list[str] = []
    with sync_playwright() as p:
        browser = p.chromium.launch()

        def neue_seite(einstellungen: dict):
            seite = browser.new_page(viewport={"width": 390, "height": 844})
            seite.goto(URL, wait_until="load")
            seite.evaluate("([k, v]) => localStorage.setItem(k, v)",
                           [SETTINGS_KEY, json.dumps(einstellungen)])
            # Seit dem 13.10.2026 öffnen sich die Tiere über Sterne — die Sonde bringt ein Protokoll mit, das alle öffnet.
            seite.evaluate("([k, v]) => localStorage.setItem(k, v)", [ABLAGE, ALLE_OFFEN])
            seite.reload(wait_until="load")
            seite.wait_for_timeout(600)
            return seite

        # Lage 1 — ein Zahn: Gefahr 100 %, Maul noch offen.
        seite = neue_seite(EIN_ZAHN)
        offen = seite.evaluate(MESSUNG)
        zeige("Lage 1 — ein Zahn, Runde offen (der nächste Druck schnappt garantiert):", offen)
        farben = offen["farben"]
        funde += ruege([
            (offen["status"] == "open", f"Runde sollte offen sein, ist {offen['status']}"),
            (offen["gefahrText"] == "Bissgefahr 100 %",
             f"Gefahrtext bei einem Zahn erwartet „Bissgefahr 100 %\", war „{offen['gefahrText']}\""),
            (offen["fortschrittText"] == "0 von 1 gedrückt",
             f"Fortschrittstext erwartet „0 von 1 gedrückt\", war „{offen['fortschrittText']}\""),
            ("is-danger" in offen["klassen"],
             f"Bei 100 % Bissgefahr muss die Klasse den Balkenkasten erreichen — Klassen: „{offen['klassen']}\""),
            (not offen["balkenImStage"],
             "Der Balken liegt außerhalb der Bühne — deshalb müssen die Klassen am Kasten hängen"),
            (farben["danger"] in offen["fuellFarbe"] and farben["ok"] not in offen["fuellFarbe"],
             f"Bei 100 % Bissgefahr muss die Füllung die Gefahrfarbe tragen — sie zeigt „{offen['fuellFarbe']}\""),
            # Seit dem 13.10.2026 ist die Zahl nicht mehr zu sehen (vom Auftraggeber abgewählt);
            # für Vorleser steht sie weiter im Dokument.
            (offen["gefahrTextBreite"] <= 1,
             f"Die Zahl der Bissgefahr soll nicht mehr sichtbar sein — sie ist {offen['gefahrTextBreite']} px breit"),
            (offen["fuellAtmung"] == "0.38s",
             f"Der Balken soll im Puls-Takt atmen (380 ms am Ende des Bereichs), tut aber {offen['fuellAtmung']}"),
        ])

        # Lage 2 — Gegenprobe: zehn Zähne, ein Druck → Gefahr unter der Schwelle. Hier darf nichts
        # rot sein. Ein Druck **kann** zuschnappen (1–3 der zehn Zähne sind scharf), deshalb wird mit
        # frischer Seite neu gewürfelt, bis die Runde offen bleibt: Die Sonde soll den Zustand messen
        # und nicht auf Glück hoffen — am 12.10.2026 lief sie genau darüber rot.
        ruhig: dict = {}
        for versuch in range(1, 11):
            leise = neue_seite(ZEHN_ZAEHNE)
            leise.click("#stage [data-tooth]")
            leise.wait_for_timeout(1200)
            ruhig = leise.evaluate(MESSUNG)
            leise.context.close()
            if ruhig["status"] == "open":
                zeige(f"\nLage 2 — zehn Zähne, ein Druck (Versuch {versuch}; Gegenprobe unter der Schwelle):", ruhig)
                break
        else:
            funde.append("Lage 2: nach 10 Versuchen war die Runde nie offen — kein verwertbarer Zustand")
        funde += ruege([
            (ruhig["status"] == "open", f"Runde sollte weiterlaufen, ist {ruhig['status']}"),
            ("Bissgefahr" in ruhig["gefahrText"],
             f"Bei offener Runde muss dort die Gefahr stehen, war „{ruhig['gefahrText']}\""),
            ("is-danger" not in ruhig["klassen"],
             f"Unter 50 % Gefahr darf der Balken nicht rot sein — Klassen: „{ruhig['klassen']}\""),
            (farben["ok"] in ruhig["fuellFarbe"] and farben["danger"] not in ruhig["fuellFarbe"],
             f"Unter der Schwelle trägt die Füllung die sichere Farbe — sie zeigt „{ruhig['fuellFarbe']}\""),
        ])

        # Lage 3 — Maul zu: kein nächster Druck, also keine Bissgefahr mehr.
        seite.click("#stage [data-tooth]")
        seite.wait_for_timeout(1800)
        zu = seite.evaluate(MESSUNG)
        zeige("\nLage 3 — Maul zu:", zu)
        funde += ruege([
            (zu["status"] == "snapped", f"Maul sollte zu sein, Zustand ist {zu['status']}"),
            (zu["fortschrittText"] == "1 von 1 gedrückt",
             f"Fortschritt nach dem Druck erwartet „1 von 1 gedrückt\", war „{zu['fortschrittText']}\""),
            ("Bissgefahr" not in zu["gefahrText"],
             f"Bei geschlossenem Maul gibt es keinen nächsten Druck — dort steht aber „{zu['gefahrText']}\""),
            (zu["gefahrText"].strip() != "", "Bei geschlossenem Maul muss die Zeile den Ausgang nennen"),
            ("is-snapped" in zu["klassen"],
             f"Der abgeschlossene Zustand muss am Balkenkasten stehen — Klassen: „{zu['klassen']}\""),
            ("is-danger" not in zu["klassen"],
             f"Nach dem Zuschnappen darf keine Gefahr mehr angezeigt werden — Klassen: „{zu['klassen']}\""),
            (farben["danger"] not in zu["fuellFarbe"] and farben["ok"] not in zu["fuellFarbe"],
             f"Nach dem Zuschnappen trägt die Füllung keine Gefahrfarbe mehr — sie zeigt „{zu['fuellFarbe']}\""),
            (zu["fuellAtmung"] == "0s",
             f"Nach dem Zuschnappen hört die Atmung auf — sie läuft aber {zu['fuellAtmung']}"),
        ])
        browser.close()

    print()
    if funde:
        print(f"ERGEBNIS: {len(funde)} Fund(e)")
        for text in funde:
            print(f"  - {text}")
        return 1
    print("ERGEBNIS: in Ordnung")
    return 0


if __name__ == "__main__":
    sys.exit(main())
