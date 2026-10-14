"""Baut die Galerie der Gebisse fuer das README — ein Bild mit allen Lebewesen.

Aufruf (Reihenfolge = Katalogreihenfolge aus `src/core/domain/creature.ts`, dieselbe
Reihenfolge nennt das README in der Bildunterschrift):

    pnpm vitest run src/render-probe.test.ts          # schreibt je Lebewesen ein SVG
    uv run --with cairosvg python scripts/galerie.py docs/bilder/gebisse.png

Zwei Fallen stecken darin, beide hier geloest:

  * **Doppelte Beschnitt-Kennungen.** Jedes Zeichnungs-SVG bringt `clipPath id="creature-clip"`
    mit. Zehnmal dieselbe Kennung im selben Dokument heisst: alle zehn Tiere werden mit dem
    Kopfumriss des **ersten** zugeschnitten. Die Kennung bekommt deshalb je Kachel den Namen des
    Lebewesens.
  * **Der Stil stand zehnmal im Dokument.** Die Farbregeln kommen aus dem Stylesheet
    (`artwork-png.py` zieht sie heraus). Sie werden einmal an den Anfang gesetzt und aus den
    Kacheln entfernt.

Die Zustandsregeln, das Stylesheet und die dunkle Buehne kommen aus `artwork-png.py` — die
Umrechnung existiert nur einmal im Baum.
"""

from __future__ import annotations

import importlib.util
import math
import sys
from pathlib import Path

from katalog import TIERE

PROJECT = Path(__file__).resolve().parents[1]
# Zielbreite des Bildes (bisher vier Kacheln zu 492 px). Die Spaltenzahl wird aus der Anzahl der
# Lebewesen **gerechnet**, damit keine leere Kachel im Bild steht: die kleinste Teilerzahl ab der
# Wurzel (10 -> 5 Spalten zu 2 Zeilen, 8 -> 4 zu 2, 12 -> 4 zu 3). Ist die Zahl prim (7), bleibt
# es bei der Wurzel und die letzte Zeile hat Luecken -- besser als ein Streifen leerer Kacheln.
TARGET_WIDTH = 1968
# Seitenverhaeltnis der Buehne (640 x 460) einhalten, damit nichts verzerrt wird.
ASPECT = 460 / 640


def layout(count: int) -> tuple[int, int, int]:
    """Spalten, Kachelbreite und Kachelhoehe fuer `count` Lebewesen."""
    columns = math.isqrt(count)
    if columns * columns < count:
        columns += 1
    teilbar = [wert for wert in range(columns, count) if count % wert == 0]
    if teilbar:
        columns = teilbar[0]
    tile_width = round(TARGET_WIDTH / columns)
    return columns, tile_width, round(tile_width * ASPECT)


def load_artwork_png():  # noqa: ANN201 - Rueckgabe ist das geladene Modul
    """`artwork-png.py` laden — der Bindestrich im Namen verbietet den normalen Import."""
    path = PROJECT / "scripts" / "artwork-png.py"
    spec = importlib.util.spec_from_file_location("artwork_png", path)
    if spec is None or spec.loader is None:
        raise SystemExit(f"artwork-png.py nicht ladbar: {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def svg_dir() -> Path:
    """Dorthin schreibt die Zeichnungs-Sonde (`src/render-probe.test.ts`)."""
    import os
    import tempfile

    return Path(os.environ.get("TMPDIR") or tempfile.gettempdir()) / "zahn_agent-artwork"


def tile(
    markup: str, creature: str, index: int, columns: int, tile_width: int, tile_height: int
) -> tuple[str, str]:
    """Eine Kachel: eigene Beschnitt-Kennung, eigene Lage, ohne den zweiten Stilblock."""
    markup = markup.replace("creature-clip", f"creature-clip-{creature}")
    style_start = markup.find("<style>")
    style_end = markup.find("</style>")
    style = markup[style_start : style_end + len("</style>")] if style_start >= 0 else ""
    markup = markup.replace(style, "") if style else markup

    column = index % columns
    row = index // columns
    x = column * tile_width
    y = row * tile_height
    sized = markup.replace(
        "<svg ",
        f'<svg x="{x}" y="{y}" width="{tile_width}" height="{tile_height}" ',
        1,
    )
    return sized, style


def main() -> int:
    if len(sys.argv) < 2:
        print((__doc__ or "").strip())
        return 2
    target = Path(sys.argv[1])
    creatures = sys.argv[2:] if len(sys.argv) > 2 else TIERE
    art = load_artwork_png()
    source_dir = svg_dir()

    missing = [name for name in creatures if not (source_dir / f"{name}.svg").exists()]
    if missing:
        print(f"Zeichnung fehlt: {', '.join(missing)} — erst die Sonde laufen lassen:")
        print("    pnpm vitest run src/render-probe.test.ts")
        print(f"(gesucht in {source_dir})")
        return 2

    columns, tile_width, tile_height = layout(len(creatures))
    rows = (len(creatures) + columns - 1) // columns
    width = tile_width * min(len(creatures), columns)
    height = tile_height * rows

    tiles: list[str] = []
    head_style = ""
    for index, name in enumerate(creatures):
        markup = art.prepare((source_dir / f"{name}.svg").read_text(encoding="utf-8"), "offen")
        sized, style = tile(markup, name, index, columns, tile_width, tile_height)
        tiles.append(sized)
        if index == 0:
            head_style = style
    # Die erste Kachel liefert den Stilblock fuer das ganze Dokument; aus den uebrigen ist er raus.
    first = tiles[0]
    tiles[0] = first.replace(head_style, "", 1) if head_style else first

    document = (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" '
        f'viewBox="0 0 {width} {height}">{head_style}{"".join(tiles)}</svg>'
    )

    import cairosvg  # type: ignore[import-not-found]

    out = PROJECT / target
    cairosvg.svg2png(bytestring=document.encode("utf-8"), write_to=str(out), output_width=width)
    print(f"{out} geschrieben ({out.stat().st_size} Bytes, {len(creatures)} Lebewesen, "
          f"{width} x {height})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
