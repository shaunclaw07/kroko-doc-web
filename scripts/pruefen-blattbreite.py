"""Beweis am lebenden Gegenstand: Nutzt das Einstellungsblatt die Breite des Geräts?

Gemessen wird das geöffnete Einstellungsblatt im echten Browser (`getBoundingClientRect`) bei
Blickbreiten vom Handy bis zum Tablet: Lage, Breite, Spaltenzahl, ob der Inhalt ins Sichtfenster
passt, ob das ✕ ohne Scrollen erreichbar bleibt (die Regel aus `docs/e2e-nachweise.md` §5i) und ob
ein Kind aus dem Blatt herausragt.

Erwartet: unter 640 px ein Blatt am unteren Rand über die volle Breite in **einer** Spalte; ab
640 px **mittig**, höchstens 1,5 rem an die Ränder, **zwei bis vier** Spalten und kein Scrollen
mehr. Vorher (max-width: 620px) klebte das Blatt am linken Rand: bei 1180 × 820 mit 0 px Luft
links und 821 px Inhalt in einem 672 px hohen Sichtfenster.

Aufruf (der Server muss laufen):

    uv run --with playwright python scripts/pruefen-blattbreite.py
    uv run --with playwright python scripts/pruefen-blattbreite.py https://zahn-agent.schaflabs.com
"""
import json
import sys

from playwright.sync_api import sync_playwright

BASIS = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4321"
BLICKE = [(320, 720), (390, 844), (620, 900), (768, 1024), (820, 1180), (1024, 768), (1180, 820), (1366, 1024)]
SCHMAL = 640  # darunter bleibt das Blatt ein Blatt am unteren Rand
EINSTELLUNGEN = {
    "creature": "crocodile",
    "teethOverride": 10,
    "sound": True,
    "vibration": True,
    "mode": "original",
    "players": 1,
}

MESSEN = """
() => {
  const blatt = document.getElementById('settings-sheet');
  const r = blatt.getBoundingClientRect();
  const s = getComputedStyle(blatt);
  const x = blatt.querySelector('.sheet__close').getBoundingClientRect();
  const raus = Array.from(blatt.querySelectorAll('*')).filter((e) => {
    const k = e.getBoundingClientRect();
    return k.width > 0 && k.height > 0 && (k.right > r.right + 0.6 || k.left < r.left - 0.6);
  });
  return {
    links: r.left,
    rechts: innerWidth - r.right,
    breite: r.width,
    hoehe: r.height,
    spalten: s.gridTemplateColumns === 'none' ? 1 : s.gridTemplateColumns.split(' ').length,
    inhalt: blatt.scrollHeight,
    sicht: blatt.clientHeight,
    xSichtbar: x.top >= 0 && x.bottom <= innerHeight,
    kinderRaus: raus.length,
    namenRaus: raus.slice(0, 3).map((e) => e.className || e.tagName),
  };
}
"""


def pruefen(d, w, h, vorher):
    """Gibt die Auffälligkeiten eines Blickes zurück (leer = in Ordnung)."""
    fehler = []
    # Zuerst das Wichtigste: ein geschlossenes Blatt gehört unsichtbar. Ein `display` einer
    # Autoren-Regel hebt das `display: none` der Browser-Regel `dialog:not([open])` auf — dann steht
    # das Blatt beim Laden auf dem Schirm und lässt sich nicht schließen (`close()` ist bei einem
    # geschlossenen Dialog ein Nichts). Genau das war am 11.10.2026 der gemeldete Fehler.
    if vorher["display"] != "none" or vorher["breite"] > 0:
        fehler.append(
            f"Blatt ist schon beim Laden sichtbar: display={vorher['display']}, "
            f"{vorher['breite']:.0f} px breit, open={vorher['offen']}"
        )
    if w < SCHMAL:
        if abs(d["links"]) > 0.6 or abs(d["breite"] - w) > 0.6:
            fehler.append(f"schmal: Blatt soll randlos sein, ist aber {d['breite']:.0f} px ab x={d['links']:.0f}")
        if d["spalten"] != 1:
            fehler.append(f"schmal: {d['spalten']} Spalten statt 1")
    else:
        if d["links"] < 20 or d["rechts"] < 20:
            fehler.append(f"Tablet: Blatt klebt am Rand (links {d['links']:.0f}, rechts {d['rechts']:.0f})")
        if d["spalten"] < 2:
            fehler.append(f"Tablet: {d['spalten']} Spalte statt mindestens 2")
        if d["breite"] <= 620 and w > 700:
            fehler.append(f"Tablet: {d['breite']:.0f} px — die Breite wird nicht genutzt")
        # Auf dem Handy darf das Blatt scrollen (dafür steht das ✕ im Kopf, §5i); auf dem Tablet
        # hat der Platz zu reichen.
        if d["inhalt"] > d["sicht"] + 1:
            fehler.append(f"Inhalt {d['inhalt']} px in {d['sicht']} px — das Blatt scrollt")
    if not d["xSichtbar"]:
        fehler.append("das ✕ ist ohne Scrollen nicht erreichbar")
    if d["kinderRaus"]:
        fehler.append(f"{d['kinderRaus']} Element(e) ragen aus dem Blatt: {d['namenRaus']}")
    return fehler


def main():
    auffaellig = 0
    print(f"Blatt-Sonde gegen {BASIS}\n")
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for w, h in BLICKE:
            ctx = browser.new_context(viewport={"width": w, "height": h})
            ctx.add_init_script(
                "localStorage.setItem('zahn_agent:settings:v1', %s)" % json.dumps(EINSTELLUNGEN)
            )
            page = ctx.new_page()
            page.goto(BASIS, wait_until="load")
            page.wait_for_timeout(250)
            # Vor jedem Tipp: das geschlossene Blatt muss unsichtbar sein.
            vorher = page.evaluate(
                """() => {const d=document.getElementById('settings-sheet');
                   const s=getComputedStyle(d); const r=d.getBoundingClientRect();
                   return {offen:d.open, display:s.display, breite:r.width};}"""
            )
            page.click("#settings-open")
            page.wait_for_timeout(350)
            d = page.evaluate(MESSEN)
            ctx.close()
            fehler = pruefen(d, w, h, vorher)
            auffaellig += len(fehler)
            print(
                f"{w:4d} x {h:<4d} | beim Laden {vorher['display']:>6s} | "
                f"Blatt {d['breite']:6.1f} px, x = {d['links']:5.1f}, "
                f"Luft rechts {d['rechts']:5.1f} | {d['spalten']} Spalte(n) | "
                f"Inhalt {d['inhalt']} px in Sicht {d['sicht']} px | ✕ sichtbar: {d['xSichtbar']}"
            )
            for f in fehler:
                print(f"        Auffällig: {f}")
        browser.close()
    print(f"\nAuffälligkeiten: {auffaellig}")
    return 1 if auffaellig else 0


if __name__ == "__main__":
    sys.exit(main())
