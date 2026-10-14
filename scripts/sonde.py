"""Gemeinsames Gerüst für die Browser-Sonden.

Teilt sich die Schlüssel der Ablage, das Herstellen einer Seite im echten Browser
und das Sammeln von Prüfergebnissen.
"""
from __future__ import annotations

import json
import sys
from typing import Any

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
if hasattr(sys.stderr, "reconfigure"):
    try:
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from freischaltung import ABLAGE, ALLE_OFFEN

EINSTELLUNGEN = "zahn_agent:settings:v1"

STANDARD_ADRESSE = "http://localhost:4322"


def basis_adresse() -> str:
    """Ermittelt die Ziel-URL aus den Aufruf-Argumenten oder nimmt den Standard."""
    return sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("-") else STANDARD_ADRESSE


def einstellungen(tier: str = "crocodile", zaehne: int | None = None, **mehr: Any) -> dict[str, Any]:
    """Erzeugt das Einstellungs-Objekt für eine Test-Runde."""
    cfg: dict[str, Any] = {
        "mode": "original",
        "players": 1,
        "sound": False,
        "vibration": False,
        "creature": tier,
        "teethOverride": zaehne,
    }
    cfg.update(mehr)
    return cfg


class Sonde:
    """Sammelt und berichtet Prüffunde im Standardformat aller Sonden."""

    def __init__(self, name: str = "") -> None:
        self.name = name
        self.funde: list[str] = []

    def pruefe(self, gut: bool, text: str, laut: bool = True) -> None:
        """Prüft eine Bedingung und gibt das standardisierte Protokoll aus."""
        if gut:
            if laut:
                print("  ok    " + text)
        else:
            self.funde.append(text)
            print("  FUND  " + text)

    def abschluss(self) -> int:
        """Gibt die Zahl der Auffälligkeiten aus und liefert den passenden Exit-Code."""
        print(f"\nAuffälligkeiten: {len(self.funde)}")
        return 1 if self.funde else 0


def seite(
    browser: Any,
    breite: int = 390,
    hoehe: int = 844,
    tier: str = "crocodile",
    zaehne: int | None = None,
    protokoll: Any = ALLE_OFFEN,
    beruehrung: bool = False,
    ruhe: bool = False,
    url: str | None = None,
    **mehr_einstellungen: Any,
) -> Any:
    """Legt Protokoll und Einstellungen ab, öffnet die Seite und wartet auf den ersten Zahn."""
    target_url = url or basis_adresse()
    kontext = browser.new_context(
        viewport={"width": breite, "height": hoehe},
        has_touch=beruehrung,
        reduced_motion="reduce" if ruhe else "no-preference",
    )
    page = kontext.new_page()
    page.goto(target_url, wait_until="load")
    cfg = einstellungen(tier, zaehne, **mehr_einstellungen)
    page.evaluate("([k, v]) => localStorage.setItem(k, v)", [EINSTELLUNGEN, json.dumps(cfg)])
    if protokoll is not None:
        p_str = protokoll if isinstance(protokoll, str) else json.dumps(protokoll)
        page.evaluate("([k, v]) => localStorage.setItem(k, v)", [ABLAGE, p_str])
    page.reload(wait_until="load")
    page.wait_for_selector(".tooth", timeout=10000)
    return page
