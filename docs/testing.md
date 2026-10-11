# Tests und Nachweise

## Das Gate

```bash
pnpm gate          # pnpm typecheck && pnpm test:run
```

Beides muss grün sein — ein Testlauf allein ist kein Nachweis.

## Stand (letzter Lauf 11.10.2026)

| Größe | Wert |
|---|---|
| Testdateien | 19 |
| Tests | 232 (19 Dateien) |
| Typenprüfung | `tsc --noEmit`, keine Fehler |
| Produktionsbau | `pnpm build` → 2 Seiten, 2,1–2,5 s (Maschinenstreuung) |

## Was wo geprüft wird

| Datei | Prüft |
|---|---|
| `src/architecture.test.ts` | Schichten, Importrichtung, `node:*`-Grenze, Kern ohne Browser/Uhr |
| `src/core/domain/creature.test.ts` | Katalog der Lebewesen: Pflichtfelder, tiergerechte Zahnzahl, eindeutige IDs |
| `src/core/domain/liveTeeth.test.ts` | Zufallsmodell: 1–3 scharfe Zähne, Gleichverteilung über 9000 Züge, keine Doppelten, Reproduzierbarkeit, und der Ein-Zahn-Fall: die Gebissgrenzen werden auf die Zahnzahl gekappt, dieser eine Zahn ist scharf (beide Modelle) |
| `src/core/domain/round.test.ts` | Zugregeln, Verlierer, Spielerreihenfolge, Unveränderlichkeit, Fehlercodes; dazu das kleinste Gebiss: eine Runde mit einem Zahn schnappt beim ersten Druck zu (beide Modelle) |
| `src/core/domain/probabilities.test.ts` | Verteilung, Erwartungswert, Überlebenskurve, Spielerchancen gegen die Python-Referenz (`../kroko-doc`) |
| `src/core/domain/tension.test.ts` | Spannung als Biss-Wahrscheinlichkeit (Kurven für Krokodil/Maus/classic), Pause (Fenster, Mittelwert, **Unabhängigkeit vom Ausgang**), Erleichterung, Zucken, Herzschlag, Fortschritt der Runde, Schwellen für „angespannt" (30 %) und „rot" (60 %), Reproduzierbarkeit |
| `src/infrastructure/storage/sessionStorageMarks.test.ts` | Sitzungs-Marken: merken, trennen, Rückfall in den Arbeitsspeicher, gesperrter Speicher wirft nicht |
| `src/core/domain/sessionLog.test.ts` | CSV-Format, Kurzformat-Import, fehlerhafte Zeilen |
| `src/core/domain/statistics.test.ts` | Chi²-Verteilung gegen Tabellenwerte (χ²=3,841/df=1 → 0,050; 19,023/df=9 → 0,025), Wilson-Intervall, Autokorrelation |
| `src/core/use-cases/playPress.test.ts` | Dramaturgie ohne Verrat des Geheimnisses |
| `src/infrastructure/audio/webAudioEngine.test.ts` | Klänge synthetisch, stumm schaltet Knoten ab, Spannung ändert das Tempo, ohne Audio-Kontext keine Ausnahme, `webkitAudioContext`-Rückfall |
| `src/infrastructure/storage/localStorageLog.test.ts` | Ablage, kaputtes JSON, privater Modus, Übernahme früherer Speicher-Schlüssel |
| `src/infrastructure/storage/localStorageSettings.test.ts` | Einstellungen: Ablage, kaputtes JSON, Übernahme früherer Speicher-Schlüssel; die Grenzen 1 und 12 werden angenommen, darunter/darüber verworfen |
| `src/infrastructure/haptics/browserHaptics.test.ts` | Vibrations-Adapter: fehlende Schnittstelle ist kein Fehler, Muster werden durchgereicht |
| `src/render-probe.test.ts` | Zeichnungs-Sonde: schreibt je Lebewesen ein SVG zum Ansehen; Katalog und Zeichnungen decken sich |
| `src/icon.test.ts` | Symbol-Sonde: **erzeugt das App-Symbol** aus der Krokodil-Zeichnung (geschlossenes Maul, Schließwege wie die Bühne), hält die ausgelieferten SVGs Zeichen für Zeichen daran fest, prüft den Manifest-Eintrag, die Existenz jeder genannten Datei und die Kantenlängen der PNGs (180/192/512) |
| `src/presentation/game/creatures/creatureViews.test.ts` | Zeichnungsvertrag **und Tippziel-Nachweis**: jedes Katalog-Lebewesen hat eine Zeichnung, Zahnzahl stimmt, Ebenenreihenfolge, gültiges Markup, Anker in der Bühne, und für jede erlaubte Zahnzahl (1–12) bleibt die Trefferfläche bei 285 px Bühnenbreite ≥ 44 px. Dazu die **Kopfbilder der Tier-Auswahl**: ohne Bedienteile (kein `.creature`, kein `.tooth`, kein `data-tooth`, keine Trefferfläche), jede Kachel mit **eigener** Beschnitt-Kennung und derselben Ebenenreihenfolge wie die Bühne |
| `src/presentation/game/gameController.test.ts` | **Prüfsonde** im DOM (jsdom): Drücke bis zum Biss, Klassen, Anzeigen, Tonfolge, Protokolleintrag, Ergebnisfenster, **Zugzeile in richtiger Sprache** („Du bist dran" statt „Du ist dran", bei mehreren Spielern der Name, nach dem Biss „Maul zu") und **Blatt-Verhalten**: das Einstellungsblatt bleibt beim Stellen offen, das Ergebnis-Blatt schließt die neue Runde |
| `src/presentation/stats/statsView.test.ts` | Bericht, Mindeststichprobe, Erkennung eines bevorzugten Zahns |

## Prüfsonden (Nachweis am laufenden Gegenstand)

1. **Bedienungssonde** — `gameController.test.ts` lädt die Steuerung in jsdom, drückt echte
   Elemente an und belegt Zuschnappen, Tonfolge und Protokoll. Aufruf:
   `./node_modules/.bin/vitest run src/presentation/game/gameController.test.ts`
2. **Bau- und Auslieferungssonde** — `pnpm build` und Prüfung der erzeugten Seiten:
   `grep -c 'Zahn Agent' dist/index.html`, `grep -o 'croc-mount' dist/index.html`,
   `ls dist` (erwartet: `index.html`, `statistik/index.html`, `favicon.svg`, `manifest.webmanifest`,
   `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `_astro/`).
3. **Zeichnungssonde** — die Zeichnung wird ohne Browser sichtbar gemacht und angesehen:
   ```bash
   pnpm vitest run src/render-probe.test.ts          # schreibt je Lebewesen ein SVG
   uv run --with cairosvg python scripts/artwork-png.py \
     "$TMPDIR/zahn_agent-artwork/crocodile.svg" crocodile.png geschnappt
   ```
   Die Zustände „offen", „gedrueckt" und „geschnappt" setzt der Rasterer so, wie es das
   Stylesheet tut: `is-pressed`/`is-snapped` als Klasse und den Schließweg als Attribut mit
   dem Wert aus dem SVG (cairosvg kennt weder `var()` noch `transform-origin`).

   Das README-Bild der Gebisse entsteht aus denselben SVGs — als Skript im Baum, nicht von Hand:
   ```bash
   uv run --with cairosvg python scripts/galerie.py docs/bilder/gebisse.png \
     crocodile wolf human shark mouse vampire panda lion    # Reihenfolge = Katalogreihenfolge
   ```
4. **Symbolsonde** — das App-Symbol entsteht aus der Zeichnung und wird angesehen:
   ```bash
   ICON_NEU=1 pnpm test:run                          # schreibt public/favicon.svg + icon-maskable.svg
   uv run --with cairosvg python scripts/icon-png.py # rastern: 180, 192, 512, maskierbar 512
   ```
   Danach die gerasterten Bilder ansehen (das Kopfmaul muss zu sein, der Kopf innerhalb der
   Kachel). Ohne `ICON_NEU=1` prüft `src/icon.test.ts` nur, dass die Dateien zur Zeichnung passen.

5. **Trefferflächen-Sonde** — die Trefferfläche eines Zahns wird im echten Browser gemessen (nicht
   gerechnet) und nachgesehen, ob in ihrer Mitte wirklich der eigene Zahn liegt:
   `pnpm dev --host`, dann
   `uv run --with playwright python scripts/pruefen-trefferflaeche.py` (misst bei 320/360/390 px Blick
   und prüft mit `document.elementFromPoint`, dass keine Dekoration den Tipp abfängt; mit einer
   Adresse als Argument läuft dieselbe Sonde gegen die veröffentlichte Seite:
   `… pruefen-trefferflaeche.py https://zahn-agent.schaflabs.com`). Erwartet:
   44,15 px bei 320 px, und bei **jedem** Zahn der eigene Zahn in der Mitte; die Tippprobe am Ende
   muss für Zahn 2, 1 und 10 „registriert" melden. Der rechnerische Teil
   (44 px auf der schmalsten Bühne, und wo der Zahnabstand die Grenze ist) steht in
   `creatureViews.test.ts`.

6. **Blatt-Sonde** — nutzt das Einstellungsblatt die Breite des Geräts? Gemessen wird das geöffnete
   Blatt bei acht Blickbreiten von 320 bis 1366 px: Lage (klebt es am Rand?), Breite, Spaltenzahl,
   ob der Inhalt ins Sichtfenster passt, ob das ✕ ohne Scrollen erreichbar ist und ob ein Kind aus
   dem Blatt ragt. **Zuerst** wird der Zustand **beim Laden** geprüft: vor jedem Tipp muss das
   geschlossene Blatt `display: none` haben — ein `display` einer Autoren-Regel hebt sonst das
   `display: none` der Browser-Regel `dialog:not([open])` auf, und das Blatt steht sichtbar auf dem
   Schirm, ohne schließbar zu sein (genau dieser Fehler war am 11.10.2026 auf Tablets, §5m).
   `uv run --with playwright python scripts/pruefen-blattbreite.py` (mit einer Adresse als Argument
   gegen die veröffentlichte Seite). Erwartet: „beim Laden none" in jeder Zeile, unter 640 px randlos
   in einer Spalte, ab 640 px mittig mit 2–4 Spalten und **ohne** Scrollen, und **0 Auffälligkeiten**
   (Exit 0).

## Zwei Regeln für Zeitgeber in Sonden

- **Jede Steuerung wird abgehängt:** `dispose()` nach jedem Fall (`afterEach`). Sonst feuert der
  Herzschlag in die schon abgebaute Umgebung (`ReferenceError: window is not defined`) und das Gate
  wird flakig — ohne dass ein Test fachlich rot ist. Der Mechanismus ist in
  `scripts/pruefen-zeitgeber.cjs` nachgestellt (Jsdom-Zeitgeber nach entferntem Global;
  `node scripts/pruefen-zeitgeber.cjs`).
- **Eigene Uhr statt echter Millisekunden:** `vi.useFakeTimers()` + `vi.advanceTimersByTime(...)`,
  wenn ein Test den Herzschlag selbst prüfen will.

## Zahlen nur aus Kommandos

Jede Zahl in der Dokumentation stammt aus einem ausgeführten Kommando. Schätzungen sind
verboten; Simulationen werden als Simulation gekennzeichnet (z. B. die Demo-Daten des
Python-Werkzeugs).
