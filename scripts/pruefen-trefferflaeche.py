"""Beweis am lebenden Gegenstand: Wie groß ist die Trefferfläche eines Zahns wirklich?

Gemessen wird die gerenderte Kreisfläche (`getBoundingClientRect` eines `.tooth__hit`) auf der
lokalen Seite bei mehreren Gerätebreiten — vorher (Deckel 48) waren es bei 320 px Blick 43,2 px,
nachher (Deckel aus der Vorgabe gerechnet) 44,0 px.

Zweiter Teil: `elementFromPoint` in der Mitte jedes Trefferrings muss genau dessen eigenen Zahn
liefern. Das belegt, dass die größeren Flächen einander nicht überdecken und keinem Nachbarn den
Druck stehlen.
"""
import json
import sys

from playwright.sync_api import sync_playwright

BASIS = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4321"
BREITEN = [320, 360, 390]

MESSEN = """
() => {
  const stage = document.querySelector('#stage .creature');
  const kasten = stage ? stage.getBoundingClientRect() : null;
  const treffer = Array.from(document.querySelectorAll('.tooth__hit')).map((hit) => {
    const r = hit.getBoundingClientRect();
    return { zahn: hit.closest('.tooth')?.dataset.tooth, w: +r.width.toFixed(2), h: +r.height.toFixed(2) };
  });
  const eigene = Array.from(document.querySelectorAll('.tooth')).filter((tooth) => {
    const hit = tooth.querySelector('.tooth__hit');
    if (!hit) return false;
    const r = hit.getBoundingClientRect();
    const oben = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return oben === hit || tooth.contains(oben);
  }).length;
  return { buehne: kasten ? +kasten.width.toFixed(1) : null, treffer, eigene };
}
"""


def bericht(name, messung):
    breiten = [t["w"] for t in messung["treffer"]]
    kleinste = min(breiten) if breiten else 0
    print(f"{name}: Bühne {messung['buehne']} px, {len(breiten)} Zähne, "
          f"Trefferfläche {kleinste:.2f}–{max(breiten):.2f} px, "
          f"eigener Zahn in der Mitte: {messung['eigene']}/{len(breiten)}")


with sync_playwright() as p:
    browser = p.chromium.launch()
    for breite in BREITEN:
        seite = browser.new_page(viewport={"width": breite, "height": 844})
        seite.goto(f"{BASIS}/", wait_until="load")
        seite.wait_for_timeout(400)
        bericht(f"{breite} px, 10 Zähne", seite.evaluate(MESSEN))

        for _ in range(9):
            seite.click("#teeth-minus")
        bericht(f"{breite} px, 1 Zahn", seite.evaluate(MESSEN))

        for _ in range(9):
            seite.click("#teeth-plus")
        bericht(f"{breite} px, 10 Zähne (wieder hochgezählt)", seite.evaluate(MESSEN))

        # 12 Zähne: der Fall, in dem die Vorgabe auf 320 px nicht mehr geht
        for _ in range(2):
            seite.click("#teeth-plus")
        print("   Regler:", seite.inner_text("#teeth-value"))
        bericht(f"{breite} px, 12 Zähne", seite.evaluate(MESSEN))
        seite.close()

    # Tippprobe: in der Mitte eines Treffers drücken und nachsehen, welcher Zahn es wurde.
    # Zahn 2 und 10 sind die kritischen: dort lag früher das untere Zahnfleischband über der
    # Trefferfläche, und ein Tipp in ihrer Mitte tat nichts.
    seite = browser.new_page(viewport={"width": 320, "height": 844})
    for ziel in ["2", "1", "10"]:
        seite.goto(f"{BASIS}/", wait_until="load")
        seite.wait_for_timeout(250)
        stelle = seite.evaluate(
            """(zahn) => {
              const tooth = document.querySelector(`.tooth[data-tooth="${zahn}"]`);
              if (!tooth) return null;
              const r = tooth.querySelector('.tooth__hit').getBoundingClientRect();
              return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
            }""",
            ziel,
        )
        if stelle is None:
            print(f"Tippprobe: Zahn {ziel} gibt es nicht")
            continue
        vorher = seite.inner_text("#hud-progress")
        seite.mouse.click(stelle["x"], stelle["y"])
        seite.wait_for_timeout(150)
        nachher = seite.inner_text("#hud-progress")
        print(f"Tippprobe bei 320 px: Zahn {ziel} in der Mitte gedrückt "
              f"{vorher} → {nachher} ({'registriert' if nachher != vorher else 'TOT'})")
    browser.close()
