"""Einzige Quelle für Tierdaten in den Python-Sonden: lädt scripts/katalog.json.

Die JSON-Datei entsteht in src/katalog-json.test.ts direkt aus dem TypeScript-Katalog
und der Freischaltungsfolge:
    KATALOG_NEU=1 pnpm test:run
"""
import json
from pathlib import Path

_KATALOG_PFAD = Path(__file__).parent / "katalog.json"
with open(_KATALOG_PFAD, encoding="utf-8") as _f:
    _DATA = json.load(_f)

TIERE: list[str] = [c["id"] for c in _DATA["creatures"]]
FOLGE: list[str] = list(_DATA["unlockOrder"])
ZAEHNE: dict[str, int] = {c["id"]: c["teeth"] for c in _DATA["creatures"]}
LETZTE_SCHWELLE: int = _DATA["unlockSteps"][-1]["stars"]
