"""
Freischaltungs-Sonde: prüft im **echten Browser**, wie sich die Tiere über Sterne öffnen.

Die Regel selbst (welches Tier bei wie vielen Sternen) prüfen die Unit-Tests
(`src/core/domain/unlocks.test.ts`). Hier geht es um das, was jsdom nicht rechnet: was man sieht,
was ein Tipp trifft und ob die Spielseite dabei ihre Maße behält. Der Server muss laufen
(`pnpm dev` oder `pnpm preview --port 4322`).

Geprüft wird:

    1. Start          → drei Tiere offen, sieben gesperrt, die Auswahl in der Reihenfolge der Folge
    2. Schattenriss   → das gesperrte Kopfbild ist geschwärzt, das Schloss sichtbar, die Marke am
                        nächsten Tier lesbar; die Kacheln sind so groß wie die offenen
    3. Tipp gesperrt  → wählt nichts, die Auswahl bleibt offen, die Kachel sagt, was fehlt
    4. Fortschritt    → nach einem Biss mit neuem Stern: Sternzeichen, Schattenriss, Satz
    5. Freischaltung  → nach dem dritten Stern: Karte mit Kopfbild und Knopf, Konfetti, der Knopf
                        ist erreichbar und wird vom Konfetti nicht verdeckt, die Seite scrollt nicht
    6. Knopf          → wechselt auf das neue Tier
    7. Rückfall       → ein gespeichertes, gesperrtes Tier wird beim Start zum Krokodil
    8. ruhig          → mit „Bewegung reduzieren" gibt es kein Konfetti, die Karte kommt trotzdem

Aufruf:
    uv run --with playwright python scripts/pruefen-freischaltung.py [URL] [--bilder <mappe>]

Rückgabe 0 = in Ordnung, 1 = Fund.
"""
import json
import sys

from playwright.sync_api import sync_playwright

from freischaltung import ABLAGE, runde

ARGUMENTE = [a for a in sys.argv[1:] if not a.startswith("--")]
BILDER = sys.argv[sys.argv.index("--bilder") + 1] if "--bilder" in sys.argv else None
if BILDER and BILDER in ARGUMENTE:
    ARGUMENTE.remove(BILDER)
URL = (ARGUMENTE[0] if ARGUMENTE else "http://localhost:4322").rstrip("/") + "/"
EINSTELLUNGEN = "zahn_agent:settings:v1"
from katalog import FOLGE
GROESSEN = [(320, 568), (390, 844), (800, 1280), (1180, 820)]


def einstellungen(tier: str, zaehne) -> str:
    return json.dumps({"mode": "original", "players": 1, "sound": False, "vibration": False,
                       "creature": tier, "teethOverride": zaehne})


KACHELN = """(liste) => Array.from(document.querySelectorAll(liste + ' button[data-creature]')).map((b) => {
  const bild = b.querySelector('.creature-portrait');
  const marke = b.querySelector('.lock-badge__text');
  const schloss = b.querySelector('.lock-badge svg');
  const r = b.getBoundingClientRect();
  return {
    id: b.dataset.creature,
    gesperrt: b.classList.contains('is-locked'),
    naechstes: b.classList.contains('is-next-unlock'),
    filter: bild ? getComputedStyle(bild).filter : '',
    marke: marke ? marke.textContent : '',
    markeSichtbar: marke ? Number(getComputedStyle(marke).opacity) : 0,
    schlossBreite: schloss ? schloss.getBoundingClientRect().width : 0,
    breite: Math.round(r.width), hoehe: Math.round(r.height),
  };
})"""


def main() -> int:
    funde: list[str] = []

    def pruefe(gut: bool, text: str) -> None:
        print(("  ok    " if gut else "  FUND  ") + text)
        if not gut:
            funde.append(text)

    with sync_playwright() as p:
        browser = p.chromium.launch()

        def frisch(breite: int, hoehe: int, tier: str = "crocodile", zaehne=None, protokoll=None, ruhig=False):
            kontext = browser.new_context(viewport={"width": breite, "height": hoehe},
                                          reduced_motion="reduce" if ruhig else "no-preference")
            seite = kontext.new_page()
            seite.goto(URL, wait_until="load")
            seite.evaluate("([k, v]) => localStorage.setItem(k, v)", [EINSTELLUNGEN, einstellungen(tier, zaehne)])
            if protokoll is not None:
                seite.evaluate("([k, v]) => localStorage.setItem(k, v)", [ABLAGE, json.dumps(protokoll)])
            seite.reload(wait_until="load")
            seite.wait_for_selector(".creature [data-tooth]")
            return seite

        def tier_auf_buehne(seite) -> str:
            return seite.evaluate("document.querySelector('svg.creature').dataset.creature")

        def scrollt(seite) -> bool:
            return seite.evaluate("document.documentElement.scrollHeight > window.innerHeight + 1")

        def bild(seite, name: str) -> None:
            if BILDER:
                seite.screenshot(path=f"{BILDER}/{name}.png")

        def beisse(seite) -> None:
            """Ein Zahn eingestellt: der erste Druck schnappt garantiert zu."""
            seite.locator(".creature [data-tooth='1']").first.click(force=True)
            seite.wait_for_selector("#stage[data-status='snapped']", timeout=8000)
            # Das Maul ist zu, bevor die Runde im Protokoll steht: erst die Ansage des neuen Sterns
            # zeigt, dass ausgewertet wurde. Danach läuft noch das Aufploppen der Karte (0,45 s) —
            # mittendrin gemessen ist der Knopf kleiner, als er wird.
            seite.wait_for_selector("#star-toast:not(.hidden)", state="attached", timeout=8000)
            seite.wait_for_timeout(900)

        for breite, hoehe in GROESSEN:
            print(f"== {breite} × {hoehe}")
            liste = "#creature-rail" if breite >= 640 else "#creature-list"

            print("1/2 — Start und Schattenriss")
            seite = frisch(breite, hoehe)
            if breite < 640:
                seite.click("#creature-open")
                seite.wait_for_selector("#creature-sheet[open]")
            kacheln = seite.evaluate(KACHELN, liste)
            pruefe([k["id"] for k in kacheln] == FOLGE, "die Auswahl steht in der Reihenfolge der Folge")
            pruefe([k["id"] for k in kacheln if not k["gesperrt"]] == FOLGE[:3],
                   f"offen sind Krokodil, Maus, Wolf (offen: {[k['id'] for k in kacheln if not k['gesperrt']]})")
            gesperrt = [k for k in kacheln if k["gesperrt"]]
            pruefe(len(gesperrt) == len(FOLGE) - 3 and all("brightness(0)" in k["filter"] for k in gesperrt),
                   f"{len(FOLGE) - 3} Kacheln sind gesperrt und ihr Kopfbild geschwärzt")
            pruefe(all(k["schlossBreite"] >= 14 for k in gesperrt),
                   f"jedes Schloss ist sichtbar (schmalstes: {min(k['schlossBreite'] for k in gesperrt):.0f} px)")
            naechstes = [k for k in kacheln if k["naechstes"]]
            pruefe(len(naechstes) == 1 and naechstes[0]["id"] == "shark" and naechstes[0]["marke"] == "Noch 3 Sterne"
                   and naechstes[0]["markeSichtbar"] == 1,
                   f"der Hai zeigt als nächstes Tier seine Marke ({naechstes[0]['marke'] if naechstes else 'keine'})")
            masse = {(k["breite"], k["hoehe"]) for k in kacheln}
            pruefe(len(masse) == 1, f"gesperrte und offene Kacheln sind gleich groß ({sorted(masse)})")
            bild(seite, f"start-{breite}")

            print("3 — Tipp auf ein gesperrtes Tier")
            # `force`: die Kachel trägt `aria-disabled`, und Playwright tippt so etwas von sich aus
            # nicht an. Ein Finger tut es — genau das wird hier nachgestellt.
            seite.click(f"{liste} button[data-creature='lion']", force=True)
            seite.wait_for_timeout(250)
            pruefe(tier_auf_buehne(seite) == "crocodile", "gewählt wird nichts — auf der Bühne bleibt das Krokodil")
            if breite < 640:
                pruefe(seite.evaluate("document.getElementById('creature-sheet').open"), "die Auswahl bleibt offen")
            loewe = [k for k in seite.evaluate(KACHELN, liste) if k["id"] == "lion"][0]
            pruefe(loewe["marke"] == "Noch 9 Sterne" and loewe["markeSichtbar"] > 0.9,
                   f"die Kachel sagt, was fehlt ({loewe['marke']}, Deckkraft {loewe['markeSichtbar']:.2f})")
            pruefe(seite.inner_text("#lock-hint") == "Löwe ist noch gesperrt. Noch 9 Sterne.",
                   f"der Vorleser hört den Satz („{seite.inner_text('#lock-hint')}“)")
            bild(seite, f"tipp-{breite}")
            seite.context.close()

            print("4 — Fortschritt nach einem neuen Stern")
            seite = frisch(breite, hoehe, "mouse", 1)
            beisse(seite)
            zeile = seite.locator("#unlock-progress")
            pruefe(zeile.is_visible(), "der Satz zum Fortschritt ist sichtbar")
            pruefe(seite.inner_text("#unlock-progress .unlock-progress__text") == "Noch 2 Sterne bis zum Hai.",
                   f"er nennt Zahl und Tier („{seite.inner_text('#unlock-progress .unlock-progress__text')}“)")
            pruefe(seite.inner_text("#unlock-progress .unlock-progress__stars") == "☆☆", "zwei leere Sterne stehen davor")
            riss = seite.evaluate("getComputedStyle(document.querySelector('#unlock-progress .creature-portrait')).filter")
            pruefe("brightness(0)" in riss, "der Hai steht als Schattenriss dabei")
            pruefe(not scrollt(seite) or (breite > hoehe and hoehe < 500), "die Spielseite scrollt nicht")
            bild(seite, f"fortschritt-{breite}")
            seite.context.close()

            print("5 — Freischaltung nach dem dritten Stern")
            seite = frisch(breite, hoehe, "wolf", 1, [runde(1, "crocodile", 10, 1), runde(2, "mouse", 6, 1)])
            beisse(seite)
            pruefe(seite.locator("#unlock-card").is_visible(), "die Karte der Freischaltung ist sichtbar")
            pruefe(seite.inner_text("#unlock-title") == "Neu dabei: Hai!", f"sie nennt den Neuen („{seite.inner_text('#unlock-title')}“)")
            pruefe(seite.locator("#unlock-icon .creature-portrait").count() == 1, "sie zeigt sein Kopfbild")
            stuecke = seite.locator("#confetti i").count()
            pruefe(stuecke > 50, f"Konfetti fällt ({stuecke} Stücke)")
            knopf = seite.evaluate("""() => {
              const b = document.getElementById('unlock-play');
              const r = b.getBoundingClientRect();
              const oben = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
              return { text: b.textContent, hoehe: r.height, unten: r.bottom, sicht: window.innerHeight,
                       trifft: oben === b };
            }""")
            pruefe(knopf["text"] == "Mit dem Hai spielen", f"der Knopf heißt „{knopf['text']}“")
            pruefe(knopf["hoehe"] >= 48 and knopf["unten"] <= knopf["sicht"],
                   f"er ist groß genug und im Sichtfenster ({knopf['hoehe']:.0f} px hoch, Unterkante {knopf['unten']:.0f} von {knopf['sicht']})")
            pruefe(knopf["trifft"], "das Konfetti verdeckt ihn nicht — ein Tipp in seine Mitte trifft ihn")
            pruefe(not scrollt(seite), "die Spielseite scrollt nicht")
            neu = seite.evaluate("document.getElementById('new-round').getBoundingClientRect().bottom <= window.innerHeight")
            pruefe(neu, "„Neue Runde“ bleibt erreichbar")
            bild(seite, f"freischaltung-{breite}")

            print("6 — der Knopf wechselt das Tier")
            seite.click("#unlock-play")
            seite.wait_for_timeout(400)
            pruefe(tier_auf_buehne(seite) == "shark", f"auf der Bühne steht der Hai (steht: {tier_auf_buehne(seite)})")
            pruefe(seite.evaluate("document.getElementById('stage').dataset.status") == "open", "eine neue Runde läuft")
            seite.context.close()

        print("== 390 × 844")
        print("7 — Rückfall beim Start")
        seite = frisch(390, 844, "sabertooth", None)
        pruefe(tier_auf_buehne(seite) == "crocodile", f"ein gesperrtes gespeichertes Tier wird zum Krokodil (ist: {tier_auf_buehne(seite)})")
        gespeichert = json.loads(seite.evaluate(f"localStorage.getItem('{EINSTELLUNGEN}')"))["creature"]
        pruefe(gespeichert == "crocodile", f"und so steht es danach in der Ablage ({gespeichert})")
        seite.context.close()

        print("8 — Bewegung reduzieren")
        seite = frisch(390, 844, "wolf", 1, [runde(1, "crocodile", 10, 1), runde(2, "mouse", 6, 1)], ruhig=True)
        beisse(seite)
        pruefe(seite.locator("#confetti").count() == 0, "kein Konfetti")
        pruefe(seite.locator("#unlock-card").is_visible(), "die Karte kommt trotzdem")
        seite.context.close()

        browser.close()

    print(f"\nAuffälligkeiten: {len(funde)}")
    return 1 if funde else 0


if __name__ == "__main__":
    sys.exit(main())
