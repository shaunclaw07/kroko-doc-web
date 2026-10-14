"""Fährt alle Browser-Sonden nacheinander gegen die gebaute Seite.

Führt vorher die Zeichnungs-Sonde (render-probe) aus, damit die SVGs für die
Zahnsicht-Prüfung bereitstehen.
"""
from __future__ import annotations

import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

STANDARD_ADRESSE = "http://localhost:4322"

SONDEN = [
    ("pruefen-zahnsicht.py", False),
    ("pruefen-halten.py", True),
    ("pruefen-blick.py", True),
    ("pruefen-zoom.py", True),
    ("pruefen-offline.py", True),
    ("pruefen-sicherung.py", True),
    ("pruefen-freischaltung.py", True),
    ("pruefen-tiere.py", True),
    ("pruefen-bedienung.py", True),
    ("pruefen-blaetter.py", True),
    ("pruefen-blattbreite.py", True),
    ("pruefen-trefferflaeche.py", True),
    ("pruefen-anzeige.py", True),
]


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
            sys.stderr.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

    adresse = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("-") else STANDARD_ADRESSE
    wurzel = Path(__file__).resolve().parent.parent

    # Vorbereitung: SVGs der Lebewesen schreiben (wird von pruefen-zahnsicht.py gebraucht)
    pnpm = shutil.which("pnpm") or "pnpm"
    pnpm_res = subprocess.run(
        [pnpm, "vitest", "run", "src/render-probe.test.ts"],
        cwd=str(wurzel),
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if pnpm_res.returncode != 0:
        print("FEHLER: render-probe.test.ts fehlgeschlagen:")
        print(pnpm_res.stdout)
        print(pnpm_res.stderr)
        return 1

    env = dict(os.environ)
    env["PYTHONIOENCODING"] = "utf-8"
    gtk_path = r"C:\Program Files\GTK3-Runtime Win64\bin"
    if os.path.isdir(gtk_path) and gtk_path not in env.get("PATH", ""):
        env["PATH"] = f"{gtk_path};{env.get('PATH', '')}"

    gescheitert: list[str] = []
    print(f"Sondenlauf gegen {adresse}\n")

    for skript, braucht_adresse in SONDEN:
        skript_pfad = wurzel / "scripts" / skript
        cmd = [sys.executable, str(skript_pfad)]
        if braucht_adresse:
            cmd.append(adresse)

        start = time.time()
        res = subprocess.run(
            cmd,
            cwd=str(wurzel),
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            env=env,
        )
        dauer = time.time() - start
        lines = [line.strip() for line in res.stdout.splitlines() if line.strip()]
        schluss = lines[-1] if lines else ""

        name = Path(skript).stem
        print(f"  {name:<25} exit {res.returncode:<3} {dauer:5.1f}s | {schluss}", flush=True)

        if res.returncode != 0:
            gescheitert.append(name)
            if res.stderr:
                print(f"      STDERR ({name}):", flush=True)
                for err_line in res.stderr.splitlines():
                    print(f"        {err_line}", flush=True)

    if gescheitert:
        print(f"\nFEHLER: {len(gescheitert)} Sonde(n) gescheitert: {', '.join(gescheitert)}", flush=True)
        return 1

    print(f"\nAlle {len(SONDEN)} Sonden erfolgreich.", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
