"""Beweis am lebenden Gegenstand: Sind Tier, Zahnzahl und „Neue Runde" ohne Blatt und ohne
Scrollen erreichbar — auf Handy und Tablet?

Gemessen wird im echten Browser auf acht Größen (320 × 568 bis 1180 × 820):
  - die Spielseite scrollt nicht und die feste Leiste verdeckt keinen Inhalt — beim Laden, nach
    einem Druck (einmaliger Hinweis sichtbar), im Ein-Zahn-Spiel (Warnung sichtbar) und nach
    dem Biss (Ergebnis auf der Seite, mit Mut-Satz — kein Blatt öffnet sich);
  - kein Griff ist kleiner als 48 px hoch oder 44 px breit, keiner liegt außerhalb des Bildes;
  - Tippzahlen: Zähne 1, Neue Runde 1, Tier 2 (unter 640 px, über das Blatt) bzw. 1 (ab 640 px);
  - weder das Auswahlblatt noch das Zahnrad-Blatt scrollt; das Zahnrad bietet zwei Spielerzahlen;
  - ohne Vibration (Safari iOS, nachgestellt) scrollt das Zahnrad-Blatt bei 320 × 568 trotzdem nicht;
  - Handy quer (844 × 390) darf scrollen, aber am Ende liegt der Inhalt über der Leiste.

Vorher (Stand aeffba8, gemessen am 12.10.2026): Tier 4 Tipps, Zähne 3, Neue Runde 3; das
Einstellungsblatt hatte 821 px Inhalt in 466–750 px, die Tier-Auswahl scrollte auf sieben von acht
Größen.

Aufruf (der Server muss laufen):

    uv run --with playwright python scripts/pruefen-bedienung.py
    uv run --with playwright python scripts/pruefen-bedienung.py https://zahn-agent.schaflabs.com
"""
import json
import sys

from playwright.sync_api import sync_playwright

BASIS = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4321"
BLICKE = [(320, 568), (360, 640), (390, 844), (412, 915), (768, 1024), (1024, 768), (820, 1180), (1180, 820)]
SCHMAL = 640  # darunter öffnen sich die Köpfe als Blatt
SCHLUESSEL = "zahn_agent:settings:v1"
# Der ungünstigste Fall für die Breite: der längste Tiername und der längste Zug-Satz.
ZWEI = {"creature": "sabertooth", "teethOverride": None, "sound": False, "vibration": False,
        "mode": "original", "players": 2}
EIN_ZAHN = {**ZWEI, "teethOverride": 1}
# Die längste Fassung des Ergebnistexts (Wortlaut aus gameController.showResult).
LAENGSTES = ("Zahn 12 hat zugeschnappt — der 12. Druck dieser Runde. Insgesamt 3 Zähne waren scharf "
             "(10, 11, 12). Mutigster Druck: Spieler 2 bei 100 % Bissgefahr — und der Zahn war harmlos.")
# Der längste erlaubte Satz zum echten Tier (MAX_FACT_LENGTH = 110 in core/domain/creature.ts).
# Kein echter Satz ist so lang — gemessen wird die Grenze, nicht der heutige Katalog.
LAENGSTER_SATZ = "Wusstest du? " + ("Seine Säbel ragten bis zu 20 cm aus dem Kiefer. " * 3)[:110]
MIN_HOEHE = 48
MIN_BREITE = 44

SEITE = """
() => {
  const sichtbar = (e) => { const s = getComputedStyle(e); const r = e.getBoundingClientRect();
    return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0; };
  const griffe = Array.from(document.querySelectorAll('main button, main a')).filter(sichtbar).map((e) => {
    const r = e.getBoundingClientRect();
    return { n: e.id || e.getAttribute('data-creature') || e.textContent.trim().slice(0, 16),
             w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10,
             imBild: r.top >= 0 && r.bottom <= innerHeight + 0.5 && r.left >= 0 && r.right <= innerWidth + 0.5 };
  });
  const leiste = document.getElementById('controls');
  const inhalt = Array.from(document.querySelectorAll('.play > *, #creature-rail')).filter(sichtbar)
    .map((e) => e.getBoundingClientRect().bottom);
  return {
    seite: document.documentElement.scrollHeight, sicht: innerHeight,
    seiteBreit: document.documentElement.scrollWidth, breite: innerWidth,
    griffe, fest: getComputedStyle(leiste).position === 'fixed',
    leisteOben: leiste.getBoundingClientRect().top, inhaltUnten: Math.max(...inhalt),
    buehne: Math.round(document.getElementById('stage').getBoundingClientRect().width),
    status: document.getElementById('stage').dataset.status,
  };
}
"""

BLATT = """
(id) => {
  const b = document.getElementById(id); const r = b.getBoundingClientRect();
  const griffe = Array.from(b.querySelectorAll('button, a, summary, label.switch')).map((e) => {
    const k = e.getBoundingClientRect();
    return { n: e.id || e.getAttribute('data-creature') || e.getAttribute('aria-label') || e.textContent.trim().slice(0, 16),
             w: Math.round(k.width * 10) / 10, h: Math.round(k.height * 10) / 10,
             raus: k.right > r.right + 0.6 || k.left < r.left - 0.6 };
  });
  // Ein Name, der aus seiner Kachel ragt, ist abgeschnitten oder liegt über dem Nachbarn.
  const namen = Array.from(b.querySelectorAll('.creature-grid__name')).filter((n) => {
    const k = n.getBoundingClientRect(); const eltern = n.closest('button').getBoundingClientRect();
    return k.right > eltern.right + 0.6 || k.left < eltern.left - 0.6 || n.scrollWidth > n.clientWidth + 1;
  }).map((n) => n.textContent.trim());
  return { offen: b.open === true, inhalt: b.scrollHeight, sicht: b.clientHeight, griffe, namen };
}
"""


def frisch(browser, w, h, einstellungen, ohne_vibration=False):
    ctx = browser.new_context(viewport={"width": w, "height": h}, has_touch=True)
    ctx.add_init_script(
        "if (!localStorage.getItem('%s')) localStorage.setItem('%s', %s);"
        % (SCHLUESSEL, SCHLUESSEL, json.dumps(json.dumps(einstellungen)))
    )
    if ohne_vibration:
        ctx.add_init_script("delete Navigator.prototype.vibrate;")
    page = ctx.new_page()
    page.goto(BASIS, wait_until="load")
    page.wait_for_selector(".tooth")
    return ctx, page


def seite_pruefen(d, lage, darf_scrollen=False):
    f = []
    if not darf_scrollen and d["seite"] > d["sicht"] + 1:
        f.append(f"{lage}: die Seite scrollt ({d['seite']} px in {d['sicht']} px)")
    if d["seiteBreit"] > d["breite"] + 1:
        f.append(f"{lage}: die Seite ist breiter als das Fenster ({d['seiteBreit']} px)")
    if d["fest"] and d["inhaltUnten"] > d["leisteOben"] + 0.5:
        f.append(f"{lage}: die Leiste verdeckt Inhalt (Inhalt bis {d['inhaltUnten']:.0f}, Leiste ab {d['leisteOben']:.0f})")
    for g in d["griffe"]:
        if g["h"] < MIN_HOEHE or g["w"] < MIN_BREITE:
            f.append(f"{lage}: Griff {g['n']!r} ist {g['w']} × {g['h']} px")
        if not darf_scrollen and not g["imBild"]:
            f.append(f"{lage}: Griff {g['n']!r} liegt außerhalb des Bildes")
    return f


def blatt_pruefen(d, lage):
    f = []
    if not d["offen"]:
        f.append(f"{lage}: das Blatt ist nicht offen")
    if d["inhalt"] > d["sicht"] + 1:
        f.append(f"{lage}: das Blatt scrollt ({d['inhalt']} px in {d['sicht']} px)")
    for g in d["griffe"]:
        if g["h"] < MIN_HOEHE or g["w"] < MIN_BREITE:
            f.append(f"{lage}: Griff {g['n']!r} ist {g['w']} × {g['h']} px")
        if g["raus"]:
            f.append(f"{lage}: Griff {g['n']!r} ragt aus dem Blatt")
    if d["namen"]:
        f.append(f"{lage}: Namen ragen aus ihrer Kachel: {d['namen']}")
    return f


def tier_auf_der_buehne(page):
    return page.evaluate("() => document.querySelector('svg.creature').dataset.creature")


def main() -> int:
    funde = []
    print(f"Bedien-Sonde gegen {BASIS}\n")
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for w, h in BLICKE:
            lage = f"{w} × {h}"
            ctx, page = frisch(browser, w, h, ZWEI)
            d = page.evaluate(SEITE)
            funde += seite_pruefen(d, f"{lage} beim Laden")

            # Zähne: ein Tipp.
            vorher = page.locator(".tooth").count()
            page.click("#teeth-minus")
            zaehne = page.locator(".tooth").count()
            if zaehne != vorher - 1:
                funde.append(f"{lage}: ein Tipp auf Minus ergibt {zaehne} statt {vorher - 1} Zähne")

            # Tier: zwei Tipps über das Blatt (schmal) oder einer in der offenen Reihe.
            if w < SCHMAL:
                page.click("#creature-open")
                page.wait_for_timeout(300)
                funde += blatt_pruefen(page.evaluate(BLATT, "creature-sheet"), f"{lage} Tier-Auswahl")
                page.click('#creature-list [data-creature="shark"]')
                page.wait_for_timeout(200)
                if page.evaluate("() => document.getElementById('creature-sheet').open"):
                    funde.append(f"{lage}: die Tier-Auswahl ist nach dem Tipp noch offen")
                tipps = 2
            else:
                if page.locator("#creature-open").is_visible():
                    funde.append(f"{lage}: der Tier-Griff steht neben der offenen Reihe")
                page.click('#creature-rail [data-creature="shark"]')
                tipps = 1
            if tier_auf_der_buehne(page) != "shark":
                funde.append(f"{lage}: nach {tipps} Tipp(s) steht {tier_auf_der_buehne(page)!r} auf der Bühne")

            # Ein Druck, der die Runde offen lässt (würfeln, bis es passt) — dann steht der Hinweis.
            for _ in range(12):
                page.click("#new-round")
                page.click("#stage .tooth")
                page.wait_for_timeout(1200)
                if page.evaluate("() => document.getElementById('stage').dataset.status") == "open":
                    break
            nach = page.evaluate(SEITE)
            if nach["status"] == "open":
                funde += seite_pruefen(nach, f"{lage} nach einem Druck")
            else:
                funde.append(f"{lage}: in zwölf Versuchen blieb keine Runde nach einem Druck offen")

            # Weiterdrücken bis zum Biss: das Ergebnis steht auf der Seite (mit Mut-Satz, also in
            # seiner längsten Fassung), kein Blatt öffnet sich, nichts scrollt.
            if nach["status"] == "open":
                for _ in range(12):
                    page.click("#stage .tooth:not(.is-pressed)")
                    page.wait_for_timeout(1200)
                    if page.evaluate("() => document.getElementById('stage').dataset.status") != "open":
                        break
                biss = page.evaluate(SEITE)
                funde += seite_pruefen(biss, f"{lage} nach dem Biss")
                if not page.locator("#result-panel").is_visible():
                    funde.append(f"{lage}: nach dem Biss fehlt das Ergebnis auf der Seite")
                if page.locator("dialog[open]").count() != 0:
                    funde.append(f"{lage}: nach dem Biss ist ein Blatt offen")
                ergebnis = page.inner_text("#result-text")
                if "harmlos" not in ergebnis:
                    funde.append(f"{lage}: dem Ergebnis fehlt der Mut-Satz: {ergebnis!r}")
                # Der Zufall liefert nicht den längsten Text. Die Obergrenze wird eingesetzt und
                # gemessen: zwölfter Zahn, drei scharfe Zähne, zweistellige Zahlen überall.
                page.evaluate(
                    "([t, f]) => { document.getElementById('result-text').textContent = t;"
                    " document.getElementById('result-fact').textContent = f; }",
                    [LAENGSTES, LAENGSTER_SATZ],
                )
                funde += seite_pruefen(page.evaluate(SEITE), f"{lage} nach dem Biss (längstes Ergebnis)")

            # Neue Runde: ein Tipp — und das Ergebnis ist wieder weg.
            page.click("#new-round")
            fortschritt = page.inner_text("#hud-progress")
            if not fortschritt.startswith("0 von"):
                funde.append(f"{lage}: nach 'Neue Runde' steht {fortschritt!r}")
            if page.locator("#result-panel").is_visible():
                funde.append(f"{lage}: das Ergebnis steht nach 'Neue Runde' noch da")

            # Zahnrad: scrollt nicht, zwei Spielerzahlen, keine häufigen Griffe.
            page.click("#settings-open")
            page.wait_for_timeout(300)
            blatt = page.evaluate(BLATT, "settings-sheet")
            funde += blatt_pruefen(blatt, f"{lage} Zahnrad")
            spieler = page.locator("#opt-players [data-players]").count()
            if spieler != 2:
                funde.append(f"{lage}: das Zahnrad bietet {spieler} Spielerzahlen")
            print(f"{lage:>11s} | Bühne {d['buehne']:4d} px | Seite {d['seite']:4d} in {d['sicht']:4d} | "
                  f"Inhalt bis {d['inhaltUnten']:6.1f}, Leiste ab {d['leisteOben']:6.1f} ({'fest' if d['fest'] else 'im Fluss'}) | "
                  f"Tier {tipps} Tipp(s) | Zahnrad {blatt['inhalt']} in {blatt['sicht']} px")
            ctx.close()

            # Ein-Zahn-Spiel: die Warnung steht schon beim Laden.
            ctx, page = frisch(browser, w, h, EIN_ZAHN)
            ein = page.evaluate(SEITE)
            if not page.locator("#hud-warning").is_visible():
                funde.append(f"{lage}: im Ein-Zahn-Spiel fehlt die Warnung")
            funde += seite_pruefen(ein, f"{lage} Ein-Zahn-Spiel")
            # Nach dem Biss: ein Tipp zur nächsten Runde, ohne dass ein Blatt dazwischen steht.
            page.click("#stage .tooth")
            page.wait_for_selector("#result-panel:not(.hidden)")
            funde += seite_pruefen(page.evaluate(SEITE), f"{lage} Ein-Zahn-Spiel nach dem Biss")
            page.click("#new-round")
            if page.evaluate("() => document.getElementById('stage').dataset.status") != "open":
                funde.append(f"{lage}: 'Neue Runde' startet nach dem Biss keine Runde")
            ctx.close()

        # Ohne Vibration (Safari iOS): der Hinweis steht da, das Blatt scrollt trotzdem nicht.
        ctx, page = frisch(browser, 320, 568, ZWEI, ohne_vibration=True)
        page.click("#settings-open")
        page.wait_for_timeout(300)
        if not page.locator("#vibration-hint").is_visible():
            funde.append("ohne Vibration: der Hinweis fehlt (oder die Sonde stellt Safari nicht nach)")
        ohne = page.evaluate(BLATT, "settings-sheet")
        funde += blatt_pruefen(ohne, "320 × 568 Zahnrad ohne Vibration")
        print(f"Ohne Vibration, 320 × 568: Zahnrad {ohne['inhalt']} in {ohne['sicht']} px")
        ctx.close()

        # Handy quer: Scrollen ist erlaubt, Verdecken nicht.
        ctx, page = frisch(browser, 844, 390, ZWEI)
        page.evaluate("() => window.scrollTo(0, document.documentElement.scrollHeight)")
        quer = page.evaluate(SEITE)
        funde += seite_pruefen(quer, "844 × 390 (quer, ans Ende gescrollt)", darf_scrollen=True)
        print(f"Handy quer, 844 × 390: Seite {quer['seite']} in {quer['sicht']} px, "
              f"Inhalt bis {quer['inhaltUnten']:.1f}, Leiste ab {quer['leisteOben']:.1f}")
        ctx.close()
        browser.close()

    print()
    for fund in funde:
        print("FUND:", fund)
    print(f"Auffälligkeiten: {len(funde)}")
    return 1 if funde else 0


if __name__ == "__main__":
    sys.exit(main())
