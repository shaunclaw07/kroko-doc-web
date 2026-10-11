"""Beweis am lebenden Gegenstand: Wie groß ist die Trefferfläche eines Zahns wirklich?

Gemessen wird die gerenderte Kreisfläche (`getBoundingClientRect` eines `.tooth__hit`) auf der
lokalen Seite bei mehreren Gerätebreiten — vorher (Deckel 48) waren es bei 320 px Blick 43,2 px,
nachher (Deckel aus der Vorgabe gerechnet) 44,0 px.

Zweiter Teil: `elementFromPoint` in der Mitte jedes Trefferrings muss genau dessen eigenen Zahn
liefern. Das belegt, dass die größeren Flächen einander nicht überdecken und keinem Nachbarn den
Druck stehlen.
"""
import json

from playwright.sync_api import sync_playwright

BASIS = "http://localhost:4321"
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

        seite.click("#settings-open")
        for _ in range(9):
            seite.click("#teeth-minus")
        seite.click("#settings-sheet .sheet__close")
        bericht(f"{breite} px, 1 Zahn", seite.evaluate(MESSEN))

        seite.click("#settings-open")
        seite.click("#teeth-reset")
        for _ in range(2):
            seite.click("#teeth-minus")
        seite.click("#settings-sheet .sheet__close")
        bericht(f"{breite} px, 10 Zähne (nach Zurücksetzen)", seite.evaluate(MESSEN))

        # 12 Zähne: der Fall, in dem die Vorgabe auf 320 px nicht mehr geht
        seite.click("#settings-open")
        for _ in range(2):
            seite.click("#teeth-plus")
        print("   Regler:", seite.inner_text("#teeth-value"), "| Hinweis:", seite.inner_text("#teeth-hint"))
        seite.click("#settings-sheet .sheet__close")
        bericht(f"{breite} px, 12 Zähne", seite.evaluate(MESSEN))
        seite.close()

    # Tippprobe: in der Mitte eines Treffers drücken und nachsehen, welcher Zahn es wurde
    seite = browser.new_page(viewport={"width": 320, "height": 844})
    seite.goto(f"{BASIS}/", wait_until="load")
    seite.wait_for_timeout(300)
    stelle = seite.evaluate("""() => {
      const hit = document.querySelector('.tooth__hit');
      const r = hit.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, zahn: hit.closest('.tooth').dataset.tooth };
    }""")
    seite.mouse.click(stelle["x"], stelle["y"])
    seite.wait_for_timeout(120)
    gedrueckt = seite.evaluate("""() => {
      const p = document.querySelector('.tooth.is-pressed') || document.querySelector('.tooth[aria-pressed="true"]');
      return p ? p.dataset.tooth : null;
    }""")
    print(f"Tippprobe bei 320 px: Ziel Zahn {stelle['zahn']} → gedrückt: {gedrueckt} "
          f"({'richtig' if gedrueckt == stelle['zahn'] else 'FALSCH'})")
    browser.close()
