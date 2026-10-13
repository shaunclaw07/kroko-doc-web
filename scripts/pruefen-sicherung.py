"""
Sicherungs-Sonde: prüft im **echten Browser**, dass die Runden ein geleertes Profil überstehen.

Die Sicherung (`worker/backup.js`) wird hier **nachgestellt** — eine Liste im Arbeitsspeicher der
Sonde beantwortet die Anfragen an `api/log/<code>`. Geprüft wird die Seite, nicht der Worker; der
echte Worker und der echte Code bleiben unberührt. Vorher bauen und die Vorschau starten:

    pnpm build
    pnpm preview --port 4322

Geprüft wird:

    1. ohne Code     → die Seite ruft die Sicherung nie
    2. mit Code      → Runden des Geräts liegen danach in der Sicherung
    3. Profil leer   → nach dem Leeren der Ablage sind Runden und Sterne wieder da
    3b. Pfad         → dasselbe über die Startadresse ohne Abfrage-Teil (`s/<code>`)
    4. Statistik     → der Code gilt ohne `?s=` weiter, die Seite nennt die gesicherten Runden
    5. eine Runde    → nach dem Biss liegt sie in der Sicherung
    6. Löschen       → leert auch die Sicherung
    7. ohne Server   → die Seite sagt es und das Spiel zeichnet trotzdem seine Zähne

Aufruf:
    uv run --with playwright python scripts/pruefen-sicherung.py [URL]

Rückgabe 0 = in Ordnung, 1 = Fund.
"""
import json
import sys

from playwright.sync_api import sync_playwright

URL = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4322").rstrip("/") + "/"
CODE = "sonde-abcd-efgh-2345"
ABLAGE = "zahn_agent:rounds:v1"


def runde(nummer: int, minute: int) -> dict:
    """Krokodil mit ganzem Gebiss, sechster Druck schnappt: zwei Sterne (gespielt, halb geschafft)."""
    return {
        "round": nummer, "playedAt": f"2026-10-13T09:{minute:02d}:00.000Z", "creature": "crocodile",
        "teeth": 10, "mode": "original", "players": 1, "loserTooth": 6, "pressIndex": 6,
        "liveCount": 2, "pressOrder": [1, 2, 3, 4, 5, 6],
    }


def main() -> int:
    funde: list[str] = []

    def pruefe(gut: bool, text: str) -> None:
        print(("  ok    " if gut else "  FUND  ") + text)
        if not gut:
            funde.append(text)

    sicherung = {"liste": [], "erreichbar": True, "anfragen": 0}

    def beantworte(route) -> None:
        sicherung["anfragen"] += 1
        anfrage = route.request
        if not sicherung["erreichbar"]:
            route.abort()
        elif anfrage.method == "PUT":
            sicherung["liste"] = json.loads(anfrage.post_data or "[]")
            route.fulfill(status=204)
        else:
            route.fulfill(status=200, content_type="application/json", body=json.dumps(sicherung["liste"]))

    with sync_playwright() as p:
        browser = p.chromium.launch()
        kontext = browser.new_context(viewport={"width": 390, "height": 844})
        kontext.route("**/api/log/**", beantworte)
        # Unter `s/<code>` liefert der Worker die Spielseite aus — hier tut es die Sonde.
        kontext.route("**/s/*", lambda route: route.fulfill(response=route.fetch(url=URL)))
        seite = kontext.new_page()

        def ablage() -> list:
            return json.loads(seite.evaluate(f"localStorage.getItem('{ABLAGE}')") or "[]")

        def warte_auf(bedingung, timeout_ms: int = 5000) -> bool:
            schritte = timeout_ms // 100
            for _ in range(schritte):
                if bedingung():
                    return True
                seite.wait_for_timeout(100)
            return bedingung()

        print("1 — ohne Code")
        seite.goto(URL, wait_until="load")
        seite.wait_for_timeout(800)
        pruefe(sicherung["anfragen"] == 0, f"keine Anfrage an die Sicherung (gezählt: {sicherung['anfragen']})")

        print("2 — mit Code: das Gerät sichert")
        seite.evaluate(f"localStorage.setItem('{ABLAGE}', JSON.stringify({json.dumps([runde(1, 1), runde(2, 2)])}))")
        seite.goto(f"{URL}?s={CODE}", wait_until="load")
        pruefe(warte_auf(lambda: len(sicherung["liste"]) == 2), f"Sicherung hält 2 Runden (hält: {len(sicherung['liste'])})")

        print("3 — das Profil verwirft seine Daten")
        seite.evaluate("localStorage.clear(); sessionStorage.clear()")
        pruefe(len(ablage()) == 0, "Ablage ist leer")
        seite.goto(f"{URL}?s={CODE}", wait_until="load")
        pruefe(warte_auf(lambda: len(ablage()) == 2), f"Ablage hat die Runden wieder (hat: {len(ablage())})")
        sterne = seite.locator("[data-creature='crocodile'] .album-star.is-earned").count()
        pruefe(sterne >= 2, f"das Krokodil trägt seine Sterne wieder (gefüllt: {sterne})")

        print("3b — Startadresse ohne Abfrage-Teil")
        seite.evaluate("localStorage.clear(); sessionStorage.clear()")
        seite.goto(f"{URL}s/{CODE}", wait_until="load")
        pruefe(warte_auf(lambda: len(ablage()) == 2), f"Ablage hat die Runden wieder (hat: {len(ablage())})")

        print("4 — Statistik ohne Code in der Adresse")
        seite.goto(f"{URL}statistik", wait_until="load")
        zeile = seite.locator("#backup-status")
        pruefe(warte_auf(lambda: zeile.is_visible()), "die Zeile zur Sicherung ist sichtbar")
        text = zeile.text_content() or ""
        pruefe("2 Runden" in text, f"sie nennt die gesicherten Runden („{text}“)")

        print("5 — eine gespielte Runde")
        seite.goto(URL, wait_until="load")
        seite.wait_for_selector("[data-tooth]")
        zaehne = seite.locator(".creature [data-tooth]").count()
        for nummer in range(1, zaehne + 1):
            if len(ablage()) == 3:
                break
            seite.locator(f".creature [data-tooth='{nummer}'] .tooth-hit, .creature [data-tooth='{nummer}']").first.click(force=True)
            seite.wait_for_timeout(1300)
        pruefe(len(ablage()) == 3, f"die Runde steht in der Ablage (Runden: {len(ablage())})")
        pruefe(warte_auf(lambda: len(sicherung["liste"]) == 3), f"und in der Sicherung (hält: {len(sicherung['liste'])})")

        print("6 — Löschen auf der Statistikseite")
        seite.goto(f"{URL}statistik", wait_until="load")
        seite.once("dialog", lambda dialog: dialog.accept())
        seite.click("#clear-log")
        pruefe(warte_auf(lambda: len(sicherung["liste"]) == 0), f"die Sicherung ist leer (hält: {len(sicherung['liste'])})")
        seite.goto(URL, wait_until="load")
        seite.wait_for_timeout(800)
        pruefe(len(ablage()) == 0, f"und die Runden kommen nicht zurück (Ablage: {len(ablage())})")

        print("7 — Sicherung nicht erreichbar")
        sicherung["erreichbar"] = False
        seite.goto(f"{URL}statistik", wait_until="load")
        zeile = seite.locator("#backup-status")
        pruefe(warte_auf(lambda: "nicht erreichbar" in (zeile.text_content() or "")),
               f"die Statistik sagt es („{zeile.text_content()}“)")
        seite.goto(URL, wait_until="load")
        seite.wait_for_selector("[data-tooth]")
        pruefe(seite.locator(".creature [data-tooth]").count() > 0, "das Spiel zeichnet seine Zähne")

        browser.close()

    print(f"\nAuffälligkeiten: {len(funde)}")
    return 1 if funde else 0


if __name__ == "__main__":
    sys.exit(main())
