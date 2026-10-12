"""Sucht auf Wikimedia Commons nach Tonaufnahmen, die das Spiel ausliefern darf.

Gezeigt wird nur, was gemeinfrei ist (Lizenz „CC0" oder „Public domain") — dafür braucht das Spiel
keine Namensnennung. Mit `--alle` kommen auch CC-BY-Aufnahmen dazu; die verlangen eine Nennung im
Regeln-Blatt und sind eine Entscheidung des Auftraggebers.

Aufruf (jedes Argument ist eine eigene Suche; die Treffer werden zusammengelegt):

    python scripts/stimme-suchen.py "wolf howl" "canis lupus"
    python scripts/stimme-suchen.py --alle "leopard growl"

Ausgabe je Treffer: Dauer, Lizenz, Titel, Urheber, Beschreibung und die Adresse der Dateiseite.
Die Aufnahme selbst lädt man von dort; geschnitten wird mit `scripts/stimme-schneiden.sh`.

Drei Dinge leistet das Skript **nicht**:
  * Es hört nicht. Ob eine Aufnahme freundlich klingt, entscheidet ein Mensch.
  * Es liest keine Dateiseite. Ein Titel ist keine Inhaltsangabe: „Mouse in Antefasy" war das
    gesprochene Wort „Maus" in einem madagassischen Dialekt (Kategorie „Malagasy language").
    Vor dem Schneiden die Seite öffnen und Beschreibung, Kategorien und Lizenzbaustein lesen.
  * Es findet nicht alles. Die Suche trifft Titel und Beschreibung; andere Wörter probieren
    („roar", „roaring", lateinischer Name). Weitere gemeinfreie Quellen stehen in
    `docs/workflow.md` (Abschnitt „Eine Tierstimme ergänzen oder tauschen").
"""
import json
import re
import sys
import urllib.parse
import urllib.request

API = "https://commons.wikimedia.org/w/api.php"
# Wikimedia verlangt einen Absender, der das Werkzeug benennt.
ABSENDER = {"User-Agent": "zahn_agent stimme-suchen (https://github.com/shaunclaw07/zahn_agent)"}
GEMEINFREI = re.compile(r"CC0|Public domain|PDM", re.IGNORECASE)
MIT_NENNUNG = re.compile(r"CC BY(?!-SA|-NC|-ND)", re.IGNORECASE)


def klartext(wert):
    """Entfernt das HTML, das Commons in seinen Metadaten liefert."""
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", wert or "")).strip()


def suche(begriff):
    frage = urllib.parse.urlencode({
        "action": "query", "format": "json", "generator": "search", "gsrnamespace": 6, "gsrlimit": 30,
        "gsrsearch": "filetype:audio " + begriff, "prop": "videoinfo", "viprop": "url|extmetadata|size",
    })
    anfrage = urllib.request.Request(f"{API}?{frage}", headers=ABSENDER)
    with urllib.request.urlopen(anfrage, timeout=30) as antwort:
        # Ohne Treffer fehlt der Schlüssel „query" ganz.
        return json.load(antwort).get("query", {}).get("pages", {})


def main():
    argumente = sys.argv[1:]
    alle = "--alle" in argumente
    begriffe = [a for a in argumente if a != "--alle"]
    if not begriffe:
        print(__doc__)
        return 2
    treffer = {}
    for begriff in begriffe:
        for seite in suche(begriff).values():
            info = (seite.get("videoinfo") or [{}])[0]
            meta = info.get("extmetadata", {})
            lizenz = klartext(meta.get("LicenseShortName", {}).get("value"))
            if not (GEMEINFREI.search(lizenz) or (alle and MIT_NENNUNG.search(lizenz))):
                continue
            treffer[seite["title"]] = {
                "dauer": info.get("duration") or 0,
                "lizenz": lizenz,
                "titel": seite["title"],
                "urheber": klartext(meta.get("Artist", {}).get("value")) or "(nicht genannt — Dateiseite lesen)",
                "was": klartext(meta.get("ImageDescription", {}).get("value")),
                "seite": info.get("descriptionurl", ""),
            }
    if not treffer:
        print("Kein Treffer mit passender Lizenz. Andere Wörter probieren — oder --alle für CC BY.")
        return 1
    # Kurze Aufnahmen zuerst: sie sind am schnellsten angehört.
    for eintrag in sorted(treffer.values(), key=lambda e: e["dauer"]):
        print(f"{eintrag['dauer']:7.1f} s | {eintrag['lizenz']:<14} | {eintrag['titel']}")
        print(f"            Urheber: {eintrag['urheber'][:90]}")
        if eintrag["was"]:
            print(f"            Was:     {eintrag['was'][:140]}")
        print(f"            Seite:   {eintrag['seite']}")
    print(f"\n{len(treffer)} Treffer. Vor dem Schneiden die Dateiseite lesen — und anhören.")
    return 0


if __name__ == "__main__":
    # Windows-Konsolen sprechen nicht von sich aus UTF-8; Urhebernamen kommen in allen Schriften.
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.exit(main())
