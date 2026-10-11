# Tests und Nachweise

## Das Gate

```bash
pnpm gate          # pnpm typecheck && pnpm test:run
```

Beides muss grün sein — ein Testlauf allein ist kein Nachweis.

## Stand (letzter Lauf 11.10.2026)

| Größe | Wert |
|---|---|
| Testdateien | 18 |
| Tests | 203 (18 Dateien) |
| Typenprüfung | `tsc --noEmit`, keine Fehler |
| Produktionsbau | `pnpm build` → 2 Seiten, 2,08–2,40 s (Maschinenstreuung) |

## Was wo geprüft wird

| Datei | Prüft |
|---|---|
| `src/architecture.test.ts` | Schichten, Importrichtung, `node:*`-Grenze, Kern ohne Browser/Uhr |
| `src/core/domain/creature.test.ts` | Katalog der Lebewesen: Pflichtfelder, tiergerechte Zahnzahl, eindeutige IDs |
| `src/core/domain/liveTeeth.test.ts` | Zufallsmodell: 1–3 scharfe Zähne, Gleichverteilung über 9000 Züge, keine Doppelten, Reproduzierbarkeit |
| `src/core/domain/round.test.ts` | Zugregeln, Verlierer, Spielerreihenfolge, Unveränderlichkeit, Fehlercodes |
| `src/core/domain/probabilities.test.ts` | Verteilung, Erwartungswert, Überlebenskurve, Spielerchancen gegen die Python-Referenz (`../kroko-doc`) |
| `src/core/domain/tension.test.ts` | Spannung als Biss-Wahrscheinlichkeit (Kurven für Krokodil/Maus/classic), Pause (Fenster, Mittelwert, **Unabhängigkeit vom Ausgang**), Erleichterung, Zucken, Herzschlag, Fortschritt der Runde, Schwellen für „angespannt" (30 %) und „rot" (60 %), Reproduzierbarkeit |
| `src/infrastructure/storage/sessionStorageMarks.test.ts` | Sitzungs-Marken: merken, trennen, Rückfall in den Arbeitsspeicher, gesperrter Speicher wirft nicht |
| `src/core/domain/sessionLog.test.ts` | CSV-Format, Kurzformat-Import, fehlerhafte Zeilen |
| `src/core/domain/statistics.test.ts` | Chi²-Verteilung gegen Tabellenwerte (χ²=3,841/df=1 → 0,050; 19,023/df=9 → 0,025), Wilson-Intervall, Autokorrelation |
| `src/core/use-cases/playPress.test.ts` | Dramaturgie ohne Verrat des Geheimnisses |
| `src/infrastructure/audio/webAudioEngine.test.ts` | Klänge synthetisch, stumm schaltet Knoten ab, Spannung ändert das Tempo, ohne Audio-Kontext keine Ausnahme, `webkitAudioContext`-Rückfall |
| `src/infrastructure/storage/localStorageLog.test.ts` | Ablage, kaputtes JSON, privater Modus, Übernahme früherer Speicher-Schlüssel |
| `src/infrastructure/storage/localStorageSettings.test.ts` | Einstellungen: Ablage, kaputtes JSON, Übernahme früherer Speicher-Schlüssel |
| `src/infrastructure/haptics/browserHaptics.test.ts` | Vibrations-Adapter: fehlende Schnittstelle ist kein Fehler, Muster werden durchgereicht |
| `src/render-probe.test.ts` | Zeichnungs-Sonde: schreibt je Lebewesen ein SVG zum Ansehen; Katalog und Zeichnungen decken sich |
| `src/presentation/game/creatures/creatureViews.test.ts` | Zeichnungsvertrag **und Tippziel-Nachweis**: jedes Katalog-Lebewesen hat eine Zeichnung, Zahnzahl stimmt, Ebenenreihenfolge, gültiges Markup, Anker in der Bühne, und für jede erlaubte Zahnzahl (4–12) bleibt die Trefferfläche bei 358 px Bühnenbreite ≥ 44 px |
| `src/presentation/game/gameController.test.ts` | **Prüfsonde** im DOM (jsdom): Drücke bis zum Biss, Klassen, Anzeigen, Tonfolge, Protokolleintrag, Ergebnisfenster |
| `src/presentation/stats/statsView.test.ts` | Bericht, Mindeststichprobe, Erkennung eines bevorzugten Zahns |

## Prüfsonden (Nachweis am laufenden Gegenstand)

1. **Bedienungssonde** — `gameController.test.ts` lädt die Steuerung in jsdom, drückt echte
   Elemente an und belegt Zuschnappen, Tonfolge und Protokoll. Aufruf:
   `./node_modules/.bin/vitest run src/presentation/game/gameController.test.ts`
2. **Bau- und Auslieferungssonde** — `pnpm build` und Prüfung der erzeugten Seiten:
   `grep -c 'Zahn Agent' dist/index.html`, `grep -o 'croc-mount' dist/index.html`,
   `ls dist` (erwartet: `index.html`, `statistik/index.html`, `favicon.svg`, `manifest.webmanifest`, `_astro/`).
3. **Zeichnungssonde** — die Zeichnung wird ohne Browser sichtbar gemacht und angesehen:
   ```bash
   pnpm vitest run src/render-probe.test.ts          # schreibt je Lebewesen ein SVG
   uv run --with cairosvg python scripts/artwork-png.py \
     "$TMPDIR/zahn_agent-artwork/crocodile.svg" crocodile.png geschnappt
   ```
   Die Zustände „offen", „gedrueckt" und „geschnappt" setzt der Rasterer so, wie es das
   Stylesheet tut: `is-pressed`/`is-snapped` als Klasse und den Schließweg als Attribut mit
   dem Wert aus dem SVG (cairosvg kennt weder `var()` noch `transform-origin`).

## Zahlen nur aus Kommandos

Jede Zahl in der Dokumentation stammt aus einem ausgeführten Kommando. Schätzungen sind
verboten; Simulationen werden als Simulation gekennzeichnet (z. B. die Demo-Daten des
Python-Werkzeugs).
