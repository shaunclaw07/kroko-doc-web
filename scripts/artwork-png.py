"""Rastert ein Zeichnungs-SVG der App in ein PNG — für Prüfer ohne Browser.

Aufruf:
    uv run --with cairosvg python scripts/artwork-png.py <eingabe.svg> <ausgabe.png> [offen|gedrueckt|geschnappt]

Die Stilregeln kommen aus src/presentation/styles/ (Pfade relativ zu diesem Skript, nicht
fest verdrahtet): `app.css` ist nur die Reihenfolge der Bauteile — `stylesheet_text()` liest sie
und fügt die Bauteile in genau dieser Reihenfolge zusammen, damit das Bild denselben Zustand
zeigt wie im Browser. Die Eingabe-SVGs
erzeugt die Zeichnungs-Sonde: `pnpm vitest run src/render-probe.test.ts`.

Zwei Eigenheiten von cairosvg bestimmen die Umsetzung:
  * `var()` und `transform-origin` werden nicht beherrscht — Regeln mit Variablen bleiben deshalb
    draußen, und den Schließweg setzt das Skript als Attribut mit dem Wert, den die App selbst
    ins SVG schreibt.
  * Zustände, die das Stylesheet über Klassen steuert (`is-snapped`, `is-pressed`), setzt das
    Skript als Klasse — die Farben kommen dann aus dem Stylesheet.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[1]
STYLES = PROJECT / "src/presentation/styles"
CSS = STYLES / "app.css"
# `@import './base.css';` — die Reihenfolge der Bauteile. Genau so liest sie auch der Bau.
IMPORT_RE = re.compile(r"@import\s+['\"]([^'\"]+)['\"]")
TOKENS = (".creature", ".jaw", ".tooth", ".mouth")
STATES = ("offen", "gedrueckt", "geschnappt", "pause")
# Endpose der Pause: sie steht als Keyframe-Ende in press-beat.css (jaw-crack, hold-breath,
# -.pupil).
# Ein Standbild zeigt nur diese Endpose, nie die Bewegung — bei CSS-Änderung hier mitziehen.
PAUSE_JAW_SHIFT = -3.0
PAUSE_FACE_SHIFT = 7.0
PAUSE_FACE_TURN = -1.4
PAUSE_PUPIL_SCALE = 0.74
STAGE_CENTER = (320.0, 232.0)
STAGE_FILL = "#101c22"
STAGE_FALLBACK = (640, 420)

# Eigenschaften, die nur im Browser-Layout wirken und den Rasterer verwirren: mit
# `width: 100%; height: auto` auf dem Wurzel-SVG rechnet cairosvg eine leere Bühne und
# liefert ein weißes Bild. Farb- und Formregeln bleiben vollständig erhalten.
LAYOUT_PROPS = (
    "width", "height", "display", "position", "top", "right", "bottom", "left",
    "margin", "padding", "inset", "touch-action", "transition", "animation",
    "cursor", "outline", "outline-offset", "pointer-events", "user-select",
    "will-change", "z-index", "overflow", "flex", "gap", "grid",
)


def is_layout(declaration: str) -> bool:
    prop = declaration.split(":")[0].strip().lower()
    return prop.startswith(tuple(LAYOUT_PROPS))


def stylesheet_text() -> str:
    """Das ganze Stylesheet als ein Text: `app.css` nennt nur die Reihenfolge der Bauteile.

    Eigene Funktion, weil `scripts/galerie.py` denselben Stil braucht — zwei Fassungen des
    Zusammenfügens würden auseinanderlaufen. Steht in `app.css` kein `@import` (so war es bis
    zum 14.10.2026), ist die Datei selbst der Stil.
    """
    text = CSS.read_text(encoding="utf-8")
    imports = IMPORT_RE.findall(text)
    if not imports:
        return text
    parts: list[str] = []
    for name in imports:
        path = STYLES / name
        if not path.exists():
            raise SystemExit(f"{CSS.name} nennt {name}, die Datei fehlt: {path}")
        parts.append(path.read_text(encoding="utf-8"))
    return "\n".join(parts)


def relevant_css() -> str:
    """Zieht die Farb- und Formregeln der Zeichnung aus dem Stylesheet."""
    text = stylesheet_text()
    keep: list[str] = []
    for block in re.finditer(r"([^{}]+)\{([^{}]*)\}", text):
        selectors, body = block.group(1).strip(), block.group(2).strip()
        if not any(token in selectors for token in TOKENS):
            continue
        # var() kennt cairosvg nicht (den Schließweg setzt das Skript als Attribut),
        # Layout-Eigenschaften haben im Rasterbild nichts zu suchen.
        parts = [
            part
            for part in body.split(";")
            if part.strip() and "var(" not in part and not is_layout(part)
        ]
        keep.append(f"{selectors} {{ {';'.join(parts).strip()} }}")
    return "\n".join(keep)


def stage_size(svg: str) -> tuple[int, int]:
    """Bühnengröße aus dem viewBox — die Bühne ist für jedes Lebewesen gleich groß."""
    box = re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', svg)
    if not box:
        return STAGE_FALLBACK
    return int(float(box.group(1))), int(float(box.group(2)))


def shift(svg: str, name: str) -> float:
    """Schließweg aus dem Markup lesen statt ihn hier zu erfinden."""
    found = re.search(rf"--{name}:\s*([\d.]+)px", svg)
    return float(found.group(1)) if found else 0.0


def apply_state(svg: str, state: str) -> str:
    """Setzt den Zustand so, wie es das Stylesheet im Browser tut."""
    if state == "geschnappt":
        svg = svg.replace('class="creature"', 'class="creature is-snapped"', 1)
        svg = svg.replace(
            '<g class="jaw__upper">',
            f'<g class="jaw__upper" transform="translate(0 {shift(svg, "close-shift")})" opacity="0">',
            1,
        )
        # Seit dem 13.10.2026 sind Oberkiefer und Schnauzenfläche bei geschlossenem Maul weg.
        svg = svg.replace('<path class="jaw__shell"', '<path class="jaw__shell" opacity="0"', 1)
        svg = svg.replace(
            '<g class="jaw__shell">',
            f'<g class="jaw__shell" transform="translate(0 {shift(svg, "shell-shift")})">',
            1,
        )
    elif state == "pause":
        # Alles zusammen: gedrückter Zahn, knarrender Kiefer, angehaltener Atem.
        svg = apply_state(svg, "gedrueckt")
        # Bewusst OHNE die Klasse `is-pressing`: cairosvg kennt `transform-origin` nicht und
        # würde die Pupillen-Regel um den Bildursprung skalieren. Die Pose kommt deshalb
        # vollständig aus Attributen — dieselben Werte wie im Keyframe-Ende von press-beat.css.
        svg = svg.replace(
            '<g class="jaw__upper">',
            f'<g class="jaw__upper" transform="translate(0 {PAUSE_JAW_SHIFT})">',
            1,
        )
        cx, cy = STAGE_CENTER
        svg = svg.replace(
            '<g class="creature__face">',
            f'<g class="creature__face" transform="translate(0 {PAUSE_FACE_SHIFT}) '
            f'rotate({PAUSE_FACE_TURN} {cx} {cy})">',
            1,
        )

        def shrink(match: re.Match[str]) -> str:
            x, y = float(match.group(1)), float(match.group(2))
            dx, dy = x * (1 - PAUSE_PUPIL_SCALE), y * (1 - PAUSE_PUPIL_SCALE)
            return (
                f'{match.group(0)[:-2]} transform="translate({dx:.1f} {dy:.1f}) '
                f'scale({PAUSE_PUPIL_SCALE})"/>'
            )

        svg = re.sub(r'<circle cx="([\d.]+)" cy="([\d.]+)"[^>]*class="pupil"/>', shrink, svg)
    elif state == "gedrueckt":
        for tooth_id in ("1", "2"):
            svg = svg.replace(
                f'<g class="tooth" data-tooth="{tooth_id}"',
                f'<g class="tooth is-pressed" data-tooth="{tooth_id}"',
                1,
            )
    return svg


def prepare(svg: str, state: str) -> str:
    """Zeichnungs-SVG rasterfertig machen: Zustand setzen, Stilregeln und dunkle Buehne einsetzen.

    Eigene Funktion, weil `scripts/galerie.py` dieselbe Vorbereitung fuer die README-Galerie
    braucht -- zwei Fassungen derselben Umrechnung wuerden auseinanderlaufen.
    """
    svg = apply_state(svg, state)
    width, height = stage_size(svg)
    # Stilregeln und dunkle Bühne direkt hinter das öffnende <svg>-Tag setzen.
    head = f"<style>{relevant_css()}</style>" + f'<rect x="0" y="0" width="{width}" height="{height}" fill="{STAGE_FILL}"/>'
    return svg.replace(">", ">" + head, 1)


def main() -> int:
    if len(sys.argv) < 3:
        print((__doc__ or "").strip())
        return 2
    source, target = Path(sys.argv[1]), Path(sys.argv[2])
    state = sys.argv[3] if len(sys.argv) > 3 else "offen"
    if state not in STATES:
        print(f"Zustand '{state}' ist unbekannt — erlaubt: {', '.join(STATES)}")
        return 2
    if not source.exists():
        print(f"Eingabe fehlt: {source} — erst die Sonde laufen lassen:")
        print("    pnpm vitest run src/render-probe.test.ts")
        return 2

    svg = prepare(source.read_text(encoding="utf-8"), state)

    import cairosvg  # type: ignore[import-not-found]

    cairosvg.svg2png(bytestring=svg.encode("utf-8"), write_to=str(target), output_width=1280)
    print(f"{target} geschrieben ({target.stat().st_size} Bytes, Zustand {state})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
