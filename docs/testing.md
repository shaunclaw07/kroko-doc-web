# Tests und Nachweise

## Das Gate

```bash
pnpm gate          # pnpm typecheck && pnpm test:run
```

Beides muss grün sein — ein Testlauf allein ist kein Nachweis.

## Stand (letzter Lauf)

| Größe | Wert |
|---|---|
| Testdateien | 15 |
| Tests | 159 (16 Dateien) |
| Typenprüfung | `tsc --noEmit`, keine Fehler |
| Produktionsbau | `pnpm build` → 2 Seiten, 2,49 s |

## Was wo geprüft wird

| Datei | Prüft |
|---|---|
| `src/architecture.test.ts` | Schichten, Importrichtung, `node:*`-Grenze, Kern ohne Browser/Uhr |
| `src/core/domain/liveTeeth.test.ts` | Zufallsmodell: 1–3 scharfe Zähne, Gleichverteilung über 9000 Züge, keine Doppelten, Reproduzierbarkeit |
| `src/core/domain/round.test.ts` | Zugregeln, Verlierer, Spielerreihenfolge, Unveränderlichkeit, Fehlercodes |
| `src/core/domain/probabilities.test.ts` | Verteilung, Erwartungswert, Überlebenskurve, Spielerchancen gegen die Python-Referenz (`../kroko-doc`) |
| `src/core/domain/tension.test.ts` | Spannungskurve, Zucken, Totenstille, Herzschlag, Reproduzierbarkeit |
| `src/core/domain/sessionLog.test.ts` | CSV-Format, Kurzformat-Import, fehlerhafte Zeilen |
| `src/core/domain/statistics.test.ts` | Chi²-Verteilung gegen Tabellenwerte (χ²=3,841/df=1 → 0,050; 19,023/df=9 → 0,025), Wilson-Intervall, Autokorrelation |
| `src/core/use-cases/playPress.test.ts` | Dramaturgie ohne Verrat des Geheimnisses |
| `src/infrastructure/audio/webAudioEngine.test.ts` | Klänge synthetisch, stumm schaltet Knoten ab, Spannung ändert das Tempo, ohne Audio-Kontext keine Ausnahme, `webkitAudioContext`-Rückfall |
| `src/infrastructure/storage/localStorageLog.test.ts` | Ablage, kaputtes JSON, privater Modus |
| `src/presentation/game/creatures/creatureViews.test.ts` | Zeichnungsvertrag **und Tippziel-Nachweis**: jedes Katalog-Lebewesen hat eine Zeichnung, Zahnzahl stimmt, Ebenenreihenfolge, gültiges Markup, Anker in der Bühne, und für jede erlaubte Zahnzahl (4–12) bleibt die Trefferfläche bei 358 px Bühnenbreite ≥ 44 px | | Zeichnungsvertrag: jedes Katalog-Lebewesen hat eine Zeichnung, Zahnzahl stimmt, Ebenenreihenfolge, gültiges Markup, Anker in der Bühne, abweichende Zahnzahlen 4–20 |
| `src/presentation/game/gameController.test.ts` | **Prüfsonde** im DOM (jsdom): Drücke bis zum Biss, Klassen, Anzeigen, Tonfolge, Protokolleintrag, Ergebnisfenster |
| `src/presentation/stats/statsView.test.ts` | Bericht, Mindeststichprobe, Erkennung eines bevorzugten Zahns |

## Prüfsonden (Nachweis am laufenden Gegenstand)

1. **Bedienungssonde** — `gameController.test.ts` lädt die Steuerung in jsdom, drückt echte
   Elemente an und belegt Zuschnappen, Tonfolge und Protokoll. Aufruf:
   `./node_modules/.bin/vitest run src/presentation/game/gameController.test.ts`
2. **Bau- und Auslieferungssonde** — `pnpm build` und Prüfung der erzeugten Seiten:
   `grep -c 'Zahn Agent' dist/index.html`, `grep -o 'croc-mount' dist/index.html`,
   `ls dist` (erwartet: `index.html`, `statistik/index.html`, `favicon.svg`, `manifest.webmanifest`, `_astro/`).
3. **Zeichnungssonde** — das SVG wird ohne Browser gerendert und angesehen:
   `node --input-type=module -e "…buildCrocodile(10)…" > croc.svg`, dann
   `uv run --with cairosvg python render_croc.py croc.svg zustand.png geschnappt`.
   Die Zustände „offen", „geschnappt" und „gedrueckt" werden dabei als SVG-Transformation
   nachgebildet (cairosvg kennt `transform-origin` nicht).

## Zahlen nur aus Kommandos

Jede Zahl in der Dokumentation stammt aus einem ausgeführten Kommando. Schätzungen sind
verboten; Simulationen werden als Simulation gekennzeichnet (z. B. die Demo-Daten des
Python-Werkzeugs).
