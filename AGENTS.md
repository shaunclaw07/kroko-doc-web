# AGENTS.md

**kroko-doc-web** — das Zahn-Zufallsspiel rund um das Krokodil (Kroko Doc /
Crocodile Dentist) als Webapp: Blick von vorne oben in das offene Maul, tippen,
bis ein Zahn das Maul zuschnappen lässt. Wählbare Gebisse (Krokodil, Wolf,
Mensch), Zahnzahl einstellbar. Dazu eine Statistikseite, die die eigenen Runden
auswertet und ehrlich sagt, wenn die Daten für eine Aussage zu dünn sind.

Dieses Dokument ist ein **Einstiegspunkt, kein Regelwerk**. Die Regeln stehen in `/docs/`.

---

## Drei Direktiven

1. **Lies vor dem Implementieren die passende Datei unter `/docs/`** — die Index-Tabelle sagt, welche.
2. **Sprache:** Code, Namen und Meldungen **englisch**; Kommentare, Doku, UI-Texte und
   Commit-Beschreibungen **deutsch**. → `docs/language-guidelines.md`
3. **Das Gate ist beides:** `pnpm typecheck` **und** `pnpm test:run`. Ein grüner Testlauf
   allein ist kein grünes Gate.

## Index

| Thema | Datei |
|---|---|
| Sprache (Englisch im Code, Deutsch in Kommentar und UI) | [`docs/language-guidelines.md`](docs/language-guidelines.md) |
| Architektur (Schichten, Importregel, Schicht-Tabelle, Fehlerarten) | [`docs/architecture.md`](docs/architecture.md) |
| Fachmodell & Dramaturgie (Runde, scharfe Zähne, Spannung, Ehrlichkeitsregeln) | [`docs/domain-model.md`](docs/domain-model.md) |
| Tests & Nachweise (Gate, Testzahlen, Sonden, Mindeststichprobe) | [`docs/testing.md`](docs/testing.md) |
| Arbeiten im Baum (Befehle, Zeichnung prüfen, Git, Fallen) | [`docs/workflow.md`](docs/workflow.md) |
| Nachweisakte der Prüfläufe | [`docs/e2e-nachweise.md`](docs/e2e-nachweise.md) |
| Warum das Spiel so ist (Charter) | [`README.md`](README.md) |
| Plan, Annahmen, offene Punkte | [`.scratch/kroko-doc-web/plan.md`](.scratch/kroko-doc-web/plan.md) |
| Zahlen des echten Spielzeugs (Analyse-Werkzeug, Python) | `../kroko-doc/README.md` |

## Befehle

```bash
pnpm dev          # Astro-Entwicklungsserver auf http://127.0.0.1:4321
pnpm build        # statische Ausgabe nach dist/
pnpm typecheck    # tsc --noEmit  — Teil des Gates
pnpm test:run     # vitest run    — Teil des Gates
pnpm gate         # beides nacheinander
```

## Die Karte in vier Zeilen

```
src/core/domain/       Fachregeln in Reinform — kein DOM, keine Uhr, keine Pakete
src/core/ports/        die Nähte nach außen (RandomSource, LiveTeethSelector, RoundLogPort, SoundPort)
src/core/use-cases/    ein Use Case je Datei (playPress)
src/contract/          der Außenvertrag der Bedienung (nur Typen und Formate)
src/infrastructure/    die Adapter: crypto-Zufall, Web-Audio, localStorage, Testattrappen
src/presentation/      die Bedienung: Spielsteuerung, Statistikseite, Astro-Seiten
src/presentation/game/creatures/  ein Modul je Lebewesen (Zeichnung), Registry, Fabrik
```

## Vier Fallen, die Zeit kosten

- **Der Schichten-Wächter ist nie rot.** `src/architecture.test.ts` erzwingt die Importrichtung,
  das Verbot von `node:*` außerhalb der Infrastruktur und dass der Kern ohne `document`, `window`,
  `localStorage`, `navigator` und `new Date(` auskommt. Eine neue Mappe braucht einen Eintrag
  in `FOLDER_LAYER` — sonst schlägt der Lauf fehl.
- **Niemals `git add -A`** — explizite Pfade. Vor dem Commit `git status --short | grep '^ D'`.
- **Die Zeichnung hat zwei Wahrheiten:** Formen, Farben und Zahnprofile stehen in
  `presentation/game/creatures/<tier>.ts`, nur Zustände im CSS (`is-pressed`, `is-snapped`,
  `is-live`, `is-twitching`). Geometrie (Ring, Schließweg, Trefferflächen) wird berechnet,
  nicht gesetzt — wer einen Wert hart einträgt, umgeht die Prüfung.
- **Exit-Code nie über eine Pipe prüfen** — `cmd | tail; echo $?` prüft `tail`.
- **Nicht `astro dev` im Hintergrund starten und dann Befehle mit Timeout > 600 s** — der
  Werkzeugaufruf wandert dann in den Hintergrund und man sieht die Ausgabe nicht mehr.

## Ein neues Lebewesen ergänzen

1. Eintrag in `src/core/domain/creature.ts` (`id`, `name`, `teeth`, `liveTeethMin/Max`,
   `realTeeth`, `note`).
2. Kunstwerk-Modul unter `src/presentation/game/creatures/` anlegen: `body`, `holeFill`,
   `inner`, `upper`/`lower` (Zahnfleischbänder), optional `upperShell` (Schnauze/Lippe),
   `upperTeeth` (Verhältnis, nicht Anzahl), `face`, `ring`, `teethProfile(count)`.
3. Eine Zeile in `ARTWORKS` (`creatures/index.ts`).
Der Test `creatureViews.test.ts` prüft danach: Zahnzahl stimmt mit dem Katalog überein, alle
Ebenen in der richtigen Reihenfolge, kein `undefined`/`NaN` im Markup, Anker innerhalb der
Bühne, und dass auch abweichende Zahnzahlen (4–20) sauber gezeichnet werden. Zeichnung ohne
Browser ansehen: `docs/workflow.md` (SVG schreiben, mit `cairosvg` rendern).

## Aufgaben-Tracking

Im **Hermes-`todo`-Board** (Chat-Kanban), nicht in GitHub Issues.
