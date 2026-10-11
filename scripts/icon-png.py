"""Rastert das App-Symbol (public/favicon.svg, public/icon-maskable.svg) in die PNG-Größen,
die Android und iOS zum Installieren brauchen.

Aufruf:
    uv run --with cairosvg python scripts/icon-png.py

Erzeugt in `public/`:
    favicon-180.png       180 x 180  — Startbildschirm am iPhone (apple-touch-icon)
    icon-192.png          192 x 192  — Android/Chrome
    icon-512.png          512 x 512  — Android/Chrome, Splashscreen
    icon-maskable-512.png 512 x 512  — Android, Fassung mit Schutzzone

Die SVGs sind die Quelle: sie entstehen aus der Zeichnung des Krokodils in `src/icon.test.ts`
(`ICON_NEU=1 pnpm vitest run src/icon.test.ts`). Dieses Skript rastern sie nur — wer die Zeichnung
ändert, erzeugt erst das SVG neu und rastern dann hier nach (siehe docs/testing.md).
"""

from __future__ import annotations

import sys
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[1]
PUBLIC = PROJECT / "public"
# (SVG, PNG, Kantenlänge). Apple bekommt die randlose Fassung: iOS legt sein eigenes
# Squircle darüber und mag keine durchsichtigen Ränder.
GROESSEN = (
    ("icon-maskable.svg", "apple-touch-icon.png", 180),
    ("favicon.svg", "icon-192.png", 192),
    ("favicon.svg", "icon-512.png", 512),
    ("icon-maskable.svg", "icon-maskable-512.png", 512),
)


def main() -> int:
    try:
        import cairosvg  # type: ignore[import-not-found]
    except ImportError:
        print("cairosvg fehlt — so aufrufen: uv run --with cairosvg python scripts/icon-png.py")
        return 2

    for quelle_name, ziel_name, kante in GROESSEN:
        quelle = PUBLIC / quelle_name
        if not quelle.exists():
            print(f"Quelle fehlt: {quelle} — erst ICON_NEU=1 pnpm vitest run src/icon.test.ts")
            return 2
        ziel = PUBLIC / ziel_name
        cairosvg.svg2png(
            url=str(quelle),
            write_to=str(ziel),
            output_width=kante,
            output_height=kante,
        )
        print(f"{ziel.name}: {kante} x {kante} ({ziel.stat().st_size} Bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
