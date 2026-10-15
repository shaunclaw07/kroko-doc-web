# Paket 6 — `app.css` nach Bauteilen aufteilen

> **Vorher lesen:** `docs/plaene/00-regeln.md` — die Regeln dort gelten für jeden Schritt.
> **Braucht vorher:** — · **Risiko:** klein · Stand der Zeilenangaben: 13.10.2026

**Ziel:** 1 732 Zeilen in einer Datei werden zu Dateien je Bauteil — ohne dass sich eine einzige
berechnete Regel ändert.

**Ausgangslage:** `src/presentation/styles/app.css`, eingebunden in `src/layouts/Base.astro`
Zeile 2. Die Abschnitte sind schon markiert (`/* --- … --- */` bei den Zeilen 124, 232, 278, 450,
470, 526, 600, 928, 1110, 1245, 1345, 1429). **Zwei Leser außer dem Browser:**
`scripts/artwork-png.py` (Zeile 25: zieht Regeln mit `.creature`, `.jaw`, `.tooth`, `.mouth` aus
genau dieser Datei) und die Kommentare in `src/icon.test.ts` und `AGENTS.md`, die sie nennen.

**Schritte**

1. **Vorher festhalten:** `pnpm build`; die erzeugte Datei `dist/_astro/*.css` nach
   `$TMPDIR/css-vorher.css` kopieren. Dazu sechs Bilder: `python scripts/artwork-png.py` für
   Krokodil, Vampir und T-Rex, je `offen` und `geschnappt`.
2. **Schneiden an den Markierungen**, Reihenfolge unverändert. Vorschlag für die Dateien unter
   `src/presentation/styles/`: `base.css` (bis 123), `controls.css`, `stage.css` (beide
   Bühnen-Abschnitte), `settings-sheet.css`, `creature-grid.css`, `album.css`, `unlocks.css`,
   `hud.css`, `sheets.css`, `stats.css`, `press-beat.css`, `game-layout.css`. `app.css` enthält
   danach nur noch `@import` in **genau** dieser Reihenfolge — die Kaskade hängt daran
   (`AGENTS.md`: eine Klassenregel verlor schon einmal gegen einen Element-Klassen-Selektor
   „aus demselben Block“).
3. **Medienabfragen** bleiben dort, wo sie heute stehen — auch wenn eine Abfrage Regeln mehrerer
   Bauteile enthält. Sie zu verteilen ändert die Reihenfolge und ist nicht Teil dieses Pakets.
4. **`artwork-png.py` nachziehen:** es liest die `@import`-Liste aus `app.css` und fügt die
   Dateien in dieser Reihenfolge zusammen (eine Funktion, die auch `scripts/galerie.py` nutzt —
   die bindet `artwork-png.py` schon ein).
5. **Vergleichen:** `pnpm build`; die neue `dist/_astro/*.css` gegen `css-vorher.css` — sie muss
   **gleich** sein (der Bau fügt die Importe zusammen; weicht nur der Dateiname ab, zählt der
   Inhalt). Die sechs Bilder neu rastern und mit „vorher“ vergleichen (gleiche Bytes oder kein
   Bildpunkt Unterschied).
6. **Verweise:** `AGENTS.md` und `src/icon.test.ts` nennen `app.css` als Ort der Zustandsregeln —
   auf die neue Datei zeigen lassen.

**Abnahme**

- Der erzeugte Stil ist inhaltsgleich mit „vorher“.
- `pnpm gate` grün; `pruefen-anzeige`, `-blattbreite`, `-bedienung`, `-zoom` ohne Fund (sie messen
  berechnete Stile).
- Keine Datei unter `src/presentation/styles/` über rund 400 Zeilen.

**Nicht-Ziele:** Regeln umbenennen, zusammenfassen oder löschen; die dreifache Führung der
Zustandsregeln (Stylesheet, `src/icon.test.ts`, `scripts/artwork-png.py`) auflösen.
