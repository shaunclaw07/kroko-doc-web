"""
Hilfe für die Browser-Sonden: ein Rundenprotokoll, das **alle Tiere öffnet**.

Seit dem 13.10.2026 sind am Anfang nur Krokodil, Maus und Wolf offen; die übrigen Tiere öffnen sich
über Sterne (`src/core/domain/unlocks.ts`). Eine Sonde, die den Hai oder den Vampir prüfen will,
bekäme auf einer frischen Seite stattdessen das Krokodil. Sie legt deshalb vor dem Laden dieses
Protokoll in die Ablage:

    from freischaltung import ABLAGE, ALLE_OFFEN
    seite.evaluate("([k, v]) => localStorage.setItem(k, v)", [ABLAGE, ALLE_OFFEN])

Acht Tiere mit je zwei Sternen sind 16 Sterne — die letzte Schwelle liegt bei 15.
"""
import json

ABLAGE = "zahn_agent:rounds:v1"

# (Kennung, Zahnzahl des Katalogs) — zwei Sterne gibt eine Runde mit ganzem Gebiss, in der mehr als
# die Hälfte der Zähne harmlos war.
_TIERE = [("crocodile", 10), ("mouse", 6), ("wolf", 12), ("shark", 12),
          ("panda", 12), ("human", 12), ("lion", 12), ("vampire", 12)]


def runde(nummer: int, tier: str, zaehne: int, druck: int) -> dict:
    """Ein Protokolleintrag, bei dem der `druck`-te Zahn zuschnappte."""
    return {
        "round": nummer, "playedAt": f"2026-10-13T08:{nummer:02d}:00.000Z", "creature": tier,
        "teeth": zaehne, "mode": "original", "players": 1, "loserTooth": druck, "pressIndex": druck,
        "liveCount": 1, "pressOrder": list(range(1, druck + 1)),
    }


ALLE_OFFEN = json.dumps([runde(i + 1, tier, zaehne, zaehne // 2 + 1) for i, (tier, zaehne) in enumerate(_TIERE)])
