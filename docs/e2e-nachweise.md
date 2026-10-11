# Nachweisakte

Alle Nachweise stammen aus ausgeführten Kommandos (Oktober 2026).

## 1. Gate

| Kommando | Ergebnis |
|---|---|
| `pnpm typecheck` (`tsc --noEmit`) | keine Fehler (Ausgabe `TSC_OK`) |
| `pnpm test:run` (`vitest run`) | **159 Tests in 16 Dateien bestanden** |
| `pnpm build` | 2 Seiten gebaut in 2,49 s; `dist/index.html`, `dist/statistik/index.html` |
| Produktionsbau über `pnpm preview` (Port 4399) | siehe Abschnitt 4b — alle vier Routen `200`, kein externer Verweis |

**Nachtrag 11.10.2026** (nach der Umbenennung und der neuen Zeichnungs-Sonde): `pnpm gate`
grün mit **163 Tests in 17 Dateien**, `pnpm build` 2 Seiten in **2,21 s** in einem frischen Klon
(im Arbeitsbaum 2,58 s). Die Zeilen oben sind der
Stand vom 10.10. und bleiben stehen.

**Nachtrag 11.10.2026, später** (Hai, Maus und Vampir ergänzt): `pnpm gate` grün mit
**166 Tests in 17 Dateien**, `pnpm build` 2 Seiten in 2,09 s im frischen Klon (Arbeitsbaum 2,26 s). Die Zeichnungs-Sonde
schreibt jetzt sechs SVGs — je drei Tests für die neuen Lebewesen kommen aus derselben Sonde.

**Nachtrag 11.10.2026, fünfte Fassung** (die Anzeige bekam Worte: Fortschritt, Gefahr, Erklärung,
siehe Abschnitt 5d): frischer Klon von `main` — 38 Commits, 85 Dateien, `pnpm gate` grün mit
**196 Tests in 18 Dateien**, `pnpm build` 2 Seiten in **2,29 s**.

**Nachtrag 11.10.2026, vierte Fassung** (der Druck wurde spannend: Pause, Feder und Riss, siehe
Abschnitt 5c): frischer Klon von `main` — 36 Commits, 82 Dateien, `pnpm gate` grün mit
**174 Tests in 17 Dateien**, `pnpm build` 2 Seiten in **2,18 s**.

**Nachtrag 11.10.2026, dritte Fassung** (Spannung ist jetzt die Biss-Wahrscheinlichkeit, siehe
Abschnitt 5b): frischer Klon von `main` — 32 Commits, 82 Dateien, `pnpm gate` grün mit
**171 Tests in 17 Dateien**, `pnpm build` 2 Seiten in **2,19 s** (Arbeitsbaum 2,42 s).
Zweiter Lauf desselben Baus in einem zweiten Klon: 2,36 s — die Bauzeit streut um einige Prozent,
belastbar sind die Tests (171), nicht die Sekunden. Ausgeliefert:
das Bündel der Live-Seite trägt denselben Namen wie der Klonbau und enthält die neue Schwelle
(`is-tense` bei 30 %), die alte Konstante `0,18` ist verschwunden.

## 2. Bedienungssonde (jsdom)

`./node_modules/.bin/vitest run src/presentation/game/gameController.test.ts` — 8 Tests, u. a.:

- „baut das Krokodil mit zehn Zähnen und zehn Trefferflächen auf"
- „schnappt beim scharfen Zahn zu, markiert den Zahn und protokolliert die Runde"
- „warnt, wenn nur noch ein Zahn übrig ist — der ist garantiert scharf"
- „zählt die Runden im Protokoll fortlaufend weiter"

## 3. Statistiksonde (jsdom)

`./node_modules/.bin/vitest run src/presentation/stats/statsView.test.ts` — 5 Tests, u. a.
„erkennt einen bevorzugten Zahn als auffällig" und „bleibt unter der Mindestzahl ehrlich".

## 4. Auslieferungssonde

| Kommando | Ergebnis |
|---|---|
| `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:4321/` | `200` |
| `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:4321/statistik` | `200` |
| `grep -c 'Zahn Agent' dist/index.html` | `2` |
| `grep -o 'croc-mount' dist/index.html` | Treffer vorhanden |
| `ls dist` | `_astro`, `favicon.svg`, `index.html`, `manifest.webmanifest`, `statistik` |

**Nachtrag 11.10.2026:** erneut gemessen — `pnpm dev` **und** `pnpm preview` hören beide nur auf
`localhost` (IPv6): `localhost` → `200`, `127.0.0.1` → **keine Antwort** (Code `000`). Die beiden
`127.0.0.1`-Zeilen oben sind so zu lesen, wie sie damals liefen.

## 4b. Vorschau des Produktionsbaus über HTTP

Der Prüfer startete `pnpm preview` (Port 4399); **dieser Server hört nur auf IPv6**
(`http://localhost:4399` → 200, `http://127.0.0.1:4399` → Verbindung verweigert).
Alle Prüfungen liefen deshalb über `localhost`.

| Prüfung | Ergebnis |
|---|---|
| `GET /` | `200` |
| `GET /statistik` | `200` |
| `GET /manifest.webmanifest` | `200` |
| `GET /favicon.svg` | `200` |
| Pflicht-Markup Startseite (`#croc-mount`, `#stage`, `#hud-remaining`, `#hud-warning`, `#result-sheet`, `#rules-sheet`, Manifest-Verweis) | je 1 Treffer |
| Pflicht-Markup Statistikseite (`#report-mount`, `#export-csv`, `#import-text`) | je 1 Treffer |
| Externe Ressourcen in beiden Seiten (`https?://`) | **0 Treffer** |
| Bundles (`index.css`, Start-JS, Statistik-JS) | je `200` |
| Start-JS enthält die Steuerung (`croc__biter`) | 1 Treffer |
| Netzverweise im Start-JS | **0 Treffer** |

## 5. Zeichnungssonde (ohne Browser gerendert) — neu gefasst am 11.10.2026

```bash
pnpm vitest run src/render-probe.test.ts                     # schreibt je Lebewesen ein SVG
uv run --with cairosvg python scripts/artwork-png.py \
  "$TMPDIR/zahn_agent-artwork/crocodile.svg" croc.png geschnappt
```

Beide Schritte liegen im Baum (Sonde + `scripts/artwork-png.py`); kein Scratch-Verzeichnis, kein
fester Pfad. Am Bild geprüft (Krokodil, Wolf, Mensch, Hai, Maus und Vampir — je „offen" und „geschnappt"): offenes Maul
mit runden weißen Zähnen auf rosenrotem Rachen, geschlossener Oberkiefer auf dem Unterkiefer ohne
Rachen, gedrückte Zähne sitzen im Kiefer.

Rechnerische Kontrolle: Der Oberkiefer fährt um `2·ry − Banddicke oben − Banddicke unten` **nach
unten** (`--close-shift`: Krokodil 232,0 · Mensch 226,0 · Wolf 222,0 SVG-Einheiten; die Schnauze
einen Anteil davon, `--shell-shift` Krokodil 143,8). Die alte Angabe „−6,49 Grad, im Stylesheet
7 Grad" gehörte zur zurückgebauten Dreh-Mechanik und ist ersetzt.

Auch eine Falle, die belegt ist: Der erste Lauf dieses Rasters lieferte **weiße Bilder** — alle
sieben Dateien exakt 4675 Bytes. Ursache: das eingebettete Stylesheet brachte Browser-Layout mit
(`.creature { width: 100%; height: auto }`), woraus cairosvg eine leere Bühne rechnete. Der
Rasterer filtert Layout-Eigenschaften seitdem heraus. Gemerkt: gleiche Dateigröße bei
verschiedenen Zuständen heißt „es wird nichts gezeichnet".

## 5b. Spannungsanzeige — neue Fassung am 11.10.2026

Die Anzeige über dem Maul war ein aufaddierter Pegel (`+0,18 + 0,35 × Knappheit + 0,02 × Position`)
und stand bei 10 Zähnen **ab dem 4. Druck auf 100 %** — für zwei Drittel der Runde ohne Aussage.
Jetzt ist sie die **Biss-Wahrscheinlichkeit des nächsten Drucks**, gerechnet aus derselben Verteilung
wie die Statistik (`probabilities.ts`).

- **Rot zuerst:** die neue Erwartung in `src/core/domain/tension.test.ts` geschrieben, bevor es die
  Funktion gab → `vitest run src/core/domain/tension.test.ts` ergab **10 failed | 11 passed (21)**.
- **Grün danach:** `pnpm gate` → **171 Tests in 17 Dateien** (vorher 166; die Datei hat jetzt 21 statt
  16 Tests), `tsc` fehlerfrei, `pnpm build` 2 Seiten.
- **Kurven geprüft (nicht geschätzt):** die Testkurve fürs Krokodil `20,0 · 21,3 · 22,8 · 24,6 · 26,8 ·
  29,7 · 33,8 · 40,7 · 55,0 · 100,0 %` und für die Maus `25,0 · 28,9 · 34,4 · 42,9 · 58,3 · 100 %`
  wurde von der Kernfunktion genau so geliefert; im Modus `classic` ist es `1 ÷ übrige Zähne`.
- **Kein Durchreichen mehr:** `playPress` bekommt keinen Pegel mehr, die Spannung kommt aus dem
  Modell der Runde (`round.liveTeethMin/Max`, öffentliche Größen — nie die verdeckten scharfen Zähne).
- **Folgen für die Oberfläche (nachgezogen):** der Balken startet nicht mehr bei null (Krokodil 20 %,
  Wolf 12 %), und die Marke „es wird ernst" (`is-tense`) liegt statt bei 15 % bei 30 %, damit sie
  nicht bei jedem Lebewesen sofort brennt.
- **Ehrlicher Vorbehalt:** Herzschlag, Klang und Beben folgen jetzt der echten Gefahr und steigen
  dadurch **später und steiler** als vorher (vorher war der Puls ab Druck 3 „auf Anschlag").

## 5c. Der Druck wird spannend — Pause, Feder und Riss (11.10.2026)

Der harmlose Druck löste sofort auf (Tipp-Klang, 25 ms Vibration, nichts weiter), und die
Totenstille von 400–900 ms gab es **nur vor einem Biss** — sie war damit ein verlässliches Signal
für den Ausgang. Umbau: die Pause kommt bei **jedem** Druck, ihre Länge wird unabhängig vom Ausgang
gezogen, und zwischen Pause und Urteil liegt ein fester Riss.

- **Rot zuerst:** die neuen Erwartungen in `src/core/domain/tension.test.ts` geschrieben, bevor es
  die Funktionen gab → `vitest run src/core/domain/tension.test.ts` ergab **10 failed | 11 passed
  (21)**; der Lauf über alles zeigte danach **4 failed | 170 passed (174)** an genau den Stellen,
  die noch den alten Pegel reichten.
- **Grün danach:** `pnpm gate` → **174 Tests in 17 Dateien**, `tsc` fehlerfrei, `pnpm build`
  2 Seiten in 2,20 s (Arbeitsbaum).
- **Unabhängigkeit geprüft (der Kern der Ehrlichkeit):** `planPressDrama` liefert bei gleichem
  Startwert dieselbe Pause, ob der Zahn scharf ist oder nicht — für 200 Startwerte geprüft. Dass der
  Ausgang in der Rechnung gar nicht vorkommt, prüft ein zweiter Test am Quelltext von `pressBeatMs`.
- **Standbild der neuen Pose:** `scripts/artwork-png.py <svg> <png> pause` (Endpose aus den
  Keyframes in `app.css`). Beurteilt am Bild: Pupillen zusammengezogen in den Augen, zwei Zähne
  eingesenkt, Zeichnung intakt. **Nicht belegbar ohne Gerät:** wie sich der Weg dorthin anfühlt —
  Standbilder zeigen die Endpose, nie die Bewegung.
- **Rundendauer gerechnet, nicht geschätzt:** Pausenzeit je Runde Krokodil 1,38 s (3,97 erwartete
  Drücke), Wolf 1,84 s (5,42), Maus 1,04 s (2,92) — rund 350 ms je Druck zusätzlich, dazu die
  Erleichterung.
- **Grenze der Vibrationsschnittstelle:** feines, stufenloses Zittern gibt `navigator.vibrate`
  nicht her — deshalb bleibt die Pause haptisch still (der Biss knallt gegen die Stille), und die
  Erleichterung ist ein einzelner Impuls zwischen 12 und 25 ms.

## 5d. Die Anzeige bekommt Worte — Fortschritt, Gefahr, Erklärung (11.10.2026)

Befund am echten Markup: die drei Werte über dem Balken trugen deutsche Beschriftungen („Runde",
„Zähne übrig", „Drücke"), der **Balken selbst hatte keine** — nur ein `aria-label`, das ein
Sehender nie liest — und der Prozentwert stand nackt als „0 %" neben „Du bist dran". Dazu der
Widerspruch im Bild: der Balken sah aus wie eine Fortschrittsanzeige, war aber ein Gefahrenmesser.

- **Rot zuerst:** die neuen Kernregeln (`pressProgress`, `isHighDanger`) als Tests geschrieben →
  `vitest run src/core/domain/tension.test.ts` ergab **4 failed** (fehlende Exporte). Danach fielen
  die neuen Erwartungen der Bedienung (2) und der Statistikseite (1) — jede aus einem echten Grund:
  eine falsche eigene Erwartung (der 9. Druck liegt bei 55,0 %, nicht über 60 %), die Test-Attrappe,
  die den 4-Sekunden-Hinweis im selben Moment wieder wegräumte, und falsch gezählte heiße Balken.
- **Bau rot — der wichtigste Fund:** `pnpm build` brach ab, weil `statistik.astro` `browserStorage`
  aus `localStorageSettings` importierte; die Funktion liegt in `localStorageLog`. `tsc` und die
  Tests sahen das **nicht** (der Import ist zur Laufzeit falsch verdrahtet, nicht typisiert).
  **Ein grünes Gate ist kein grüner Bau.**
- **Grün danach:** `pnpm gate` → **196 Tests in 18 Dateien**, `tsc` fehlerfrei, `pnpm build`
  2 Seiten.
- **Im gebauten Ergebnis nachgesehen:** `dist/index.html` trägt `meter-legend`, `hud-progress`,
  `hud-tension` und `hud-meter-hint`; das Bündel trägt „Bissgefahr" und den Fortschrittstext; das
  CSS enthält `meter-breath`, `is-danger` und `meter-legend`; die Statistikseite trägt
  `danger-mount` und die Überschrift der Kurve.
- **Gemessene Folge der neuen 50-%-Schwelle (11.10.2026):** der vorletzte Krokodil-Druck (55,0 %)
  ist rot, der achte (40,7 %) noch nicht. Rot kommt einen Druck frueher als bei 60 % — und kann
  ueberstanden werden; bei 60 % war jeder rote Druck ein Biss. Beide Stolperdraehte
  (`statsView.test.ts`, `gameController.test.ts`) fielen beim Senken und wurden neu gefasst.
- **Produktfehler gefunden und behoben:** vor dem ersten Druck stand „Bissgefahr 0 %", obwohl der
  erste Druck beim Krokodil 20 % gefährlich ist. Die Anzeige leitet die Gefahr jetzt bei jedem
  Render aus der Runde ab (`tensionOfNextPress`), nicht nur nach einem Druck.
- **Was kein Test zeigen kann:** wie der Balken auf dem Handy wirkt. jsdom kennt kein Layout und im
  Arbeitsbaum gibt es keinen Browser — die Bildregeln sind über das gebaute CSS und das Verhalten
  über die DOM-Tests belegt; das Aussehen beurteilt der Spieler.

## 5e. Ein Zweck für den Balken — der Mut (11.10.2026)

Der Balken erklärte sich (5d), aber er konnte noch nichts **bewirken**. Neu: das Ergebnis der Runde
nennt den **Mut** — die höchste Bissgefahr, bei der ein Druck noch harmlos blieb (`survivedDanger`).
Beispiel aus einem Bedienungs-Test: schnappt es beim dritten Druck, war Druck 2 der mutigste —
21,3 % → im Text „21 %".

| Nachweis | Ergebnis |
|---|---|
| vier Kern-Tests (`tension.test.ts`) | `survivedDanger`: 0 vor dem ersten Druck, 55,0 % beim Krokodil-Schnapp im zehnten Druck, `1÷9` im Modus classic, ≤ 1 |
| zwei Bedienungs-Tests (`gameController.test.ts`) | der Ergebnistext enthält „mutigster Druck … 21 %"; mit zwei Spielern wird der Spieler benannt (Druck 2 → „Spieler 2“, reihum) |
| echter Ergebnistext (einmalige Sonde, danach entfernt) | „Zahn 7 hat zugeschnappt — der 5. Druck dieser Runde. Insgesamt 1 Zahn war scharf (7). **Mutigster Druck: Spieler 1 bei 25 % Bissgefahr — und der Zahn war harmlos.** Damit ist 1 Runde protokolliert.“ (drei Spieler, Drücke 1,2,5,6,7 — Druck 4 kam reihum von Spieler 1, die Gefahr stand dort bei 24,6 %) |
| Rot-Beweis | vorher genau sechs rote Tests — die neuen, keine alten |
| siebter Test (`gameController.test.ts`) | beim ersten Protokolleintrag die Einzahl: „Damit ist 1 Runde protokolliert.“ — vorher stand dort „1 Runden“, aufgefallen beim Ausgeben des **echten** Satzes aus einer einmaligen Sonde |
| Gate + Bau | 203 Tests in 18 Dateien, `tsc` fehlerfrei, `pnpm build` → 2 Seiten in 2,40 s |

Warum **nicht** mehr: das „Weitergeben" (Zug abgeben statt drücken) hätte den Balken zur echten
Entscheidung gemacht — es verschiebt aber die Zugreihenfolge, die der Kern aus `pressOrder` ableitet
(`round.ts`), und seine Wirkung ist nur an einem echten Tisch mit zwei oder mehr Spielern
beurteilbar. Abgesagt, begründet in `docs/plan.md` und als zehnte Falle in AGENTS.md.

## 5f. Entscheidungen des Auftraggebers umgesetzt (11.10.2026)

Der Nutzer: „Das neue Grün gefällt mir. Den Rest kannst du einfach deine empfohlenen
Entscheidungen nehmen." — umgesetzt:

| Entscheidung | Umsetzung | Nachweis |
|---|---|---|
| **Sattes Spielzeug-Grün** (die gegengerenderte Variante) | Krokodil-Farben `#8fce33` / `#a8dd4f` / `#5f8f1e`; Schnauzenband bleibt gleich der Körperfarbe | gerendert und angesehen (Dreier-Vergleich Original / weich / satt im Bericht); 18 Treffer der neuen Werte, 0 der alten |
| **Rotglut bei 50 %** statt 60 % | `HIGH_DANGER = 0.5` — der vorletzte Krokodil-Druck (55,0 %) ist rot und **kann überstanden** werden, der Mut reicht bis ins Rote | zwei Stolperdrähte fielen bewusst und wurden neu gefasst (`tension.test.ts`, `statsView.test.ts`, `gameController.test.ts`) |
| **Mut auf die Statistikseite** | `bravestRound` (Kern) + Kachel „Mutigste Runde" und ein Satz in `statsView.ts` | drei neue Kern-Tests: leer → null, höchste überstandene Gefahr gewinnt, Runden mit Schnapp beim ersten Druck zählen nicht |
| **„Weitergeben" bleibt abgesagt** | keine Änderung — Bedingung (echter Tisch, 2+ Spieler) besteht weiter | siehe zehnte Falle in AGENTS.md |
| **Geschlossener Blick, vierte Falte, höhere Augen, Kiemengröße** | keine Änderung | in `docs/plan.md` begründet |

## 5g. Kinderfreundliche Oberfläche (11.10.2026)

Auftrag: „Kannst du das User-Interface von Zahn Agent bisschen kinderfreundlicher machen? Es gibt
viele Elemente die ablenken. Die Auswahl der Modelle ist auch schwer ohne vielleicht ein Icon von
dem passenden Bild." Sparring (`grill-me`) mit dem Auftraggeber, vier Fragen, alle Empfehlungen
angenommen — Entscheidungen in `docs/plan.md`.

**Befund am laufenden Gegenstand** (erster Browser-Screenshot der Seite, 390 × 844): das Spielfeld
begann nach rund einer Bildschirmhöhe Einstellungen, das Tier war beim Öffnen nicht zu sehen; „Statistik"
stand zweimal (Kopfzeile + schwebender Knopf über dem Maul); die Gebiss-Auswahl war eine Textliste
ohne Bild mit drei Textebenen je Eintrag.

| Prüfung | Ergebnis |
|---|---|
| `pnpm typecheck` | keine Fehler |
| `pnpm test:run` | **212 Tests in 18 Dateien**, alle grün (vorher 206) |
| `pnpm build` | 2 Seiten in **2,25 s**, `dist/index.html`, `dist/statistik/index.html` |
| `dist/index.html` | 7 Kopfbilder, 6 Kachel-Knöpfe (`data-creature`), 7 `clipPath`-Kennungen, **0** `class="fab"`, 1 × `id="settings-open"` |
| gebautes CSS | enthält `--line: rgba(255, 255, 255, .14)` und `stat--big` |

**Zwei echte Fehler, im Browser bzw. am Markup belegt und behoben:**

1. **`--line` und `--surface-2` waren nie definiert.** `.picker`, `.stepper button` und die alte
   Listenkachel lasen sie; die Deklarationen waren damit ungültig und Rahmen/Flächen fielen still auf
   `currentColor` bzw. durchsichtig zurück. **Vorher/nachher gemessen** (`getComputedStyle`):
   `.picker` `borderColor` von `rgb(244, 236, 216)` (currentColor) auf `rgba(255, 255, 255, 0.14)`,
   `backgroundColor` von `rgba(0, 0, 0, 0)` auf `rgba(255, 255, 255, 0.06)`.
2. **Die Zugzeile hieß „Du ist dran".** `playerName()` liefert für einen Spieler „Du", der Satz klebte
   „ ist dran" daran; im Markup stand vorher das richtige „Du bist dran", der erste `render()`-Lauf hat
   es ersetzt. Jetzt `turnSentence()` — zwei neue Bedienungs-Tests („Du bist dran", bei zwei Spielern
   „Spieler 2 ist dran", nach dem Biss „Maul zu"). Im Browser nachgemessen: `#hud-turn` = „Du bist dran".

**Erste Prüfung in einem echten Browser** (bisher gab es keinen, siehe Abschnitt 7). Chromium
153.0.8010.12 (`uv run --with playwright`), Seite vom laufenden `pnpm dev` geladen:

| Messung | Ergebnis | Warum wichtig |
|---|---|---|
| `document.querySelectorAll('.creature')` | **1** | die 6 Kacheln dürfen der Steuerung nicht in die Quere kommen |
| `document.querySelectorAll('.tooth')` | **10** | Kacheln enthalten keine bedienbaren Zähne |
| `.creature-portrait` | **7** | 6 Kacheln + 1 Vorschau im Einstellungsblatt |
| doppelte `id` im Dokument | **0** | 7 Kopfbilder, 8 Beschnitt-Kennungen im geladenen DOM (die Bühne fügt ihre eigene `creature-clip` beim Mounten hinzu), alle eindeutig |
| `getComputedStyle` des Bühnen-`g[clip-path]` | `url("#creature-clip")` | die Bühne wird weiter beschnitten (nicht von einer Kachel) |
| Dokumenthöhe / Sichtfeld | **615 px** / **844 px** | das ganze Spiel steht ohne Scrollen auf dem Schirm |
| Kachelgröße | **172 × 162 px**, Name 16 px | Trefferflächen weit über 44 px |
| Elemente im ersten Blick | 10 Textzeilen (Kopfzeile, Tier, Spielstand, Balken, ein Hinweis) | vorher rund das Doppelte |

Angesehen (Screenshots, `390 × 844` und `620 × 900`): Startbildschirm, Einstellungsblatt (mit
Kopf-Vorschau des Tieres), Tier-Auswahl (6 Kacheln, gewählte grün umrandet), Tierinfo nach Antippen
(Hai: „12 Zähne — bei jedem Tipp sind 1–2 davon gefährlich"), Regeln mit aufgeklapptem „Für Große".

**Nicht in einem Browser prüfbar geblieben:** Klänge und Vibration (dafür fehlt ein Gerät) und wie
sich die Bild-Kacheln auf einem echten Tablet anfühlen — die Größen sind gerechnet und gemessen, das
Gefühl beurteilt der Spieler.

## 5h. Gemeldeter Fehler: die Zahnzahl ließ sich nicht einstellen (11.10.2026)

**Meldung des Nutzers:** „Man kann die Anzahl der Zähne nicht mehr einstellen. Immer wenn ich auf das
Minus klicke dann schließt sich das Modal."

- **Ursache (eigener Regressionsfehler aus §5g):** `resetRound()` schloss **alle** offenen Blätter
  (`dialog.sheet[open]`). Solange die Einstellungen in der Seite selbst standen, fiel das nie auf —
  seit sie in einem Blatt liegen, schloss jeder Tipp auf `−`/`+` (und jede Umstellung von Spielerzahl
  und Modus) genau das Blatt, in dem man gerade stellt.
- **Reparatur:** `resetRound()` schließt nur noch das **Ergebnis**-Blatt (dort ist es gewollt: „Noch
  eine Runde" räumt es weg). Neu ist `closeSheet(sheet)` mit Rückfall für Umgebungen **ohne**
  `dialog.close` — jsdom kennt die Schnittstelle nicht (`typeof el.close === 'undefined'`, gemessen),
  ältere Browser ebenso wenig; ohne den Rückfall wirft der Aufruf dort.
- **Rot-Beweis:** die zwei neuen Bedienungs-Tests gegen den **alten** Steuerungsstand gefahren
  (`git stash push -- src/presentation/game/gameController.ts`) → `Tests 2 failed | 25 passed (27)`,
  danach mit der Reparatur `27 passed`. Die Tests nagen also am Fehler, nicht am Zufall.
- **Beleg im echten Chromium** (Klickweg der Meldung, 390 × 844):

| Klick | `blattOffen` | `#teeth-value` | Zähne auf der Bühne | Kurztext am Tier |
|---|---|---|---|---|
| — | true | 10 | 10 | 10 Zähne |
| `−` ×1 | **true** | 9 | 9 | 9 Zähne |
| `−` ×2 | **true** | 8 | 8 | 8 Zähne |
| `−` ×3 | **true** | 7 | 7 | 7 Zähne |
| `+` ×2 | **true** | 9 | 9 | 9 Zähne |
| Modus „nur ein Zahn" | **true** | 9 | 9 | 9 Zähne |
| „Standard" | **true** | 10 | 10 | 10 Zähne |

  Keine Seitenfehler. Das Blatt bleibt in jedem Fall offen, und die Bühne zieht hinter dem Blatt mit.
- **Gate:** `pnpm typecheck` ohne Fehler, **214 Tests in 18 Dateien** grün (vorher 212).
- **Nachtrag zum Prüfbericht des unabhängigen Prüfers (§5g):** er bestätigte sechs von sieben
  Behauptungen und widerlegte eine — zu Recht: „nur ein sichtbarer Verweis auf die Statistikseite"
  war falsch formuliert. Es sind weiter **zwei** (`<a href="/statistik">` im Zahnrad-Blatt und im
  Ergebnis-Blatt, keiner im `<header>`). Beseitigt ist der **doppelte Dauerweg** (Kopfzeile plus
  schwebender Knopf); der Weg im Ergebnis-Blatt kommt erst nach einer Runde und war nie gemeint.
  Der Prüfer maß außerdem nach, dass im geladenen DOM **8** `clipPath`-Kennungen stehen (die Bühne
  fügt ihre eigene `creature-clip` beim Mounten hinzu) statt der 7 im gebauten HTML — die Zeile in
  §5g ist entsprechend berichtigt.

## 5i. Wunsch: „nur ein Zahn" — und der fehlende Ausgang (11.10.2026, spät)

Auftrag: „Ich würde auch gerne erlaube nur einen Zahn zu konfigurieren. Mein Sohn freut sich wenn nur
ein Zahn da ist und beim Tap das maul schließt."

**Vorbedingung war eine Schranke ohne Begründung:** `MIN_TEETH = 4`. Für die Obergrenze steht eine
Messung im Code (44-px-Trefferfläche, deshalb Schluss bei 12), für die Untergrenze **nichts** — weder in
`teeth.ts` noch in `docs/`. Bei einem Zahn war die Domäne längst fertig: `UniformLiveTeethSelector`
kappt die Gebissgrenzen auf die Zahnzahl (`Math.min(min, teeth, MAX_LIVE_TEETH)`), das Krokodil meldet
1–3, bei einem Zahn also 1. Es fehlte nur die Erlaubnis — und die Sprache.

| Was gemessen wurde (Chromium, 390 × 844, echter Klick) | Wert |
|---|---|
| Regler neunmal `−` → Zahnzahl | **1** |
| Hinweis im Blatt | „nur ein Zahn — der erste Tipp schließt das Maul" |
| Kurztext am Tier | „1 Zahn" (Einzahl) |
| Zähne auf der Bühne | **1** |
| Trefferfläche dieses Zahns | **53 × 53 px** (Richtwert 44) |
| Anzeige unter dem Tier | „1 / **Zahn** übrig" (Einzahl) |
| Tipp auf den Zahn | Status `snapped`, Ergebnis-Blatt „Zugeschnappt!", übrig 0 |
| Zweite Ein-Zahn-Runde, erster Tipp | wieder `snapped` |
| Seitenfehler | keine |

**Der Weg zurück fehlte ganz.** Beim Nachklicken fiel auf: das Einstellungsblatt hatte **keinen**
Schließen-Knopf — die anderen drei Blätter haben einen (`data-close-sheet`), und ein `dialog` schließt
von sich aus nur mit **Escape**. Auf einem Tablet ist das kein Weg.

| Messung am Blatt | 390 × 844 | 360 × 640 |
|---|---|---|
| Blatthöhe / Inhalt | 692 px / 793 px → muss scrollen | 525 px / 817 px → muss scrollen |
| „Fertig" am Fuß | liegt bei 871–919 px, **außerhalb** | außerhalb |
| ✕ im Kopf (`sticky`) | 44 × 44 px, sichtbar **oben und nach dem Scrollen** | ebenso |
| Klick auf ✕ | Blatt zu | Blatt zu |

Dazu schließt jetzt auch ein Tipp **neben** das Blatt (Geometrie-Prüfung, nicht `event.target` — bei
einem Dialog ist `event.target` auch der Innenabstand). Und die doppelte Erklärung unter „Wie
gefährlich?" ist entfernt: sie stand ausführlicher im Regeln-Blatt unter „Für Große".

**Gate:** `tsc` fehlerfrei, **217 Tests in 18 Dateien** grün (vorher 214), Bau 2,37 s. Ein alter Test
hielt die Regel „3 Zähne ist unmöglich" fest und musste weichen — er prüft jetzt symbolisch
`MIN_TEETH - 1` und `MAX_TEETH + 1`, damit er die Grenzen mitgeht, statt sie zu wiederholen.

**Nicht in einem Browser prüfbar geblieben:** Klang beim Zuschnappen und die Vibration — dafür fehlt ein
Gerät. Das Gefühl der Kacheln auf einem echten Tablet beurteilt der Spieler.

## 5j. Auftrag: das Krokodil als App-Symbol (11.10.2026, spät)

Auftrag: „Kannst du das Bild vom Krokodil als icon für die all nehmen?" — kurz danach: „Kannst du
eines mit geschlossenen Mund als Icon nützen?"

**Vorher** war `public/favicon.svg` ein von Hand gezeichnetes Zahn-Symbol (460 Bytes, drei Pfade und
zwei Kreise) — es hatte mit der Zeichnung der App nichts zu tun. **Jetzt** zeigt es das Kopfbild des
Krokodils aus der App (dieselbe Zeichnung wie die Tier-Auswahl, ohne bedienbare Zähne) auf der
dunklen Kachel `#0d1a20`.

**Wie „geschlossen" entsteht — nachgemessen, nicht erfunden.** Die App schließt das Maul mit vier
CSS-Regeln (`.creature.is-snapped …`): Oberkiefer um `--close-shift` nach unten, Schnauze um
`--shell-shift` (Anteil), Rachen (`mouth__hole`, `mouth__inner`) und die ruhende obere Zahnreihe
unsichtbar. Die beiden Schließwege kommen aus dem Bühnen-SVG der Zeichnungs-Sonde:

| Wert | Krokodil | Herkunft |
|---|---|---|
| `--close-shift` | **232,0 px** | `dist`-Bühnen-SVG, mit `factory.ts` nachgerechnet |
| `--shell-shift` | **143,8 px** | dito (Anteil 0,62 des Oberkiefers) |

**Zwei Fassungen aus derselben Zeichnung:** rund (88 % der Breite, Ecken 112 von 512 — wie das
vorige Symbol 14 von 64) und maskierbar für Android (randlos, 70 % der Breite, damit der Zuschnitt
nichts vom Kopf nimmt). Dazu vier PNG-Größen:

| Datei | Kante | Bytes | wofür |
|---|---|---|---|
| `favicon.svg` | beliebig | 7.257 | Tab und Lesezeichen |
| `icon-maskable.svg` | beliebig | 7.256 | Grundlage der Apple- und Android-Fassung |
| `apple-touch-icon.png` | 180 | 8.378 | Startbildschirm am iPhone (randlos, undurchsichtig) |
| `icon-192.png` | 192 | 14.470 | Android/Chrome |
| `icon-512.png` | 512 | 49.337 | Android/Chrome, Splashscreen |
| `icon-maskable-512.png` | 512 | 32.233 | Android mit Schutzzone |

**Angesehen, nicht nur gerechnet:** 512 px, 64 px (Tab-Größe), maskierbare Fassung und Apple-Fassung
gerastert und begutachtet — Kopf vollständig, Maul zu (kein Rachen mehr zu sehen), Kopf innerhalb der
Kachel und der Schutzzone.

**Ausgeliefert:** im gebauten HTML stehen vier Kopfverweise (`icon` als SVG, `icon` 192 PNG,
`apple-touch-icon` 180, `manifest`), das Manifest nennt **5** Symbole. `pnpm build` 2,06 s.
Die Bühne im Spiel ist **unangetastet** — dort bleibt das Maul offen und jeder Zahn bedienbar; das
Symbol ist ein Standbild derselben Zeichnung.

**Gate:** `tsc` fehlerfrei, **225 Tests in 19 Dateien** grün (vorher 217 in 18). Die neue
Symbol-Sonde erzeugt das SVG und hält die ausgelieferte Datei Zeichen für Zeichen daran fest.

**Grenze ehrlich benannt:** wie das Symbol nach dem Zuschnitt auf einem echten Startbildschirm wirkt
(Android maskiert rund, iOS legt ein Squircle darüber), entscheidet das Gerät — hier sind Schutzzone
und Kantenlängen gerechnet und die Bilder begutachtet, das Gerät fehlt weiterhin.

## 5k. Fremde Prüfung „nur ein Zahn": acht von acht bestätigt, zwei Defekte gefunden (11.10.2026)

Ein zweiter Prüfer hat den Ein-Zahn-Umbau **ohne Tastatur am lebenden Gegenstand** nachgeprüft
(Chromium gegen <https://zahn-agent.schaflabs.com/>) und jede Behauptung einzeln beurteilt. Methode:
echtes Maus-Klick über `page.mouse.click`, `getBoundingClientRect`, `elementFromPoint`,
`localStorage`, `git show e488f81:src/core/domain/teeth.ts` — keine Wiederholung der Tests.

**Bestätigt:** (1) 9× „−" → 1 Zahn, erster Tipp schnappt zu, in beiden Modellen; (2) auch nach
„Neue Runde"; (3) 4 und 12 Zähne unversehrt (die Bühne zeichnet genau 4 bzw. 12 Zähne, die Runde
bleibt offen); (4) das ✕ im Blattkopf schließt auch nach dem Scrollen bis zum Anschlag
(44 × 44 px, echtes Maus-Klick); (5) ein Tipp weit neben das Blatt schließt es, ein Tipp **im** Blatt
nicht (an der Geometrie geprüft); (6) Einzahl „Zahn übrig" bei 1, sonst Mehrzahl; (7) Trefferfläche
53,4 × 53,4 px bei 1 Zahn — mit der Einschränkung, dass sie bei 320 px Gerätebreite auf 42,9 px
fällt (knapp unter 44); (8) `git show e488f81:src/core/domain/teeth.ts` → `MIN_TEETH = 4` ✓.

**Zwei Defekte, die meine Tests nicht sahen — beide sofort behoben:**

- **Die Statistik log bei kleinen Gebissen.** Mit einem einzigen Zahn zeigte der Bericht
  „Erwartet (Modell) 0,33" und einen Modellbalken von 33 %, während die beobachteten Drücke (1,00)
  und die Gefahr-Kurve (100 %) recht hatten. Ursache: `pressPositionDistribution` ließ jedes `k`
  über der Zahnzahl ganz wegfallen, statt es — wie die Auswahl der scharfen Zähne
  (`Math.min(min, teeth, MAX_LIVE_TEETH)`) — auf die Zahnzahl zu kappen. Behoben in
  `src/core/domain/probabilities.ts`; festgehalten in `probabilities.test.ts` und
  `statistics.test.ts`. Für Gebisse ab 3 Zähnen ändert sich nichts.
- **Das Gate war flakig.** In 1 von 7 Läufen endete `pnpm test:run` mit Code 1 wegen eines
  unbehandelten `ReferenceError: window is not defined` (jsdom, `gameController.ts:296`). Ursache:
  der Herzschlag hing am **globalen** `window`; nach dem Abbau der Testumgebung läuft der Zeitgeber
  weiter und findet kein Fenster mehr. Behoben: `this.doc.defaultView` statt `window` (auch als
  Vorgabe der Wartefunktion), `dispose()` in der Steuerung, `afterEach` in der Sonde. Der Mechanismus
  ist deterministisch nachgestellt (`node scripts/pruefen-zeitgeber.cjs`: alte Fassung →
  `ReferenceError`, neue → fehlerfrei). Eigene Läufe: 8 × grün. **Die Flake-Häufigkeit selbst konnte
  ich in 12 Läufen der alten Fassung nicht reproduzieren** (lastabhängig) — belegt ist der
  Mechanismus, nicht die Quote.

**Live-Gegenprobe des Statistik-Fixes (nach dem Veröffentlichen, über die Bedienung):** Zahnrad →
9× „−" → Regler „1", ✕ schließt das Blatt ohne Tastatur, Bühne zeichnet 1 Zahn, Anzeige „1 · Zahn
übrig", erster Tipp → `data-status="snapped"`. Im Bericht danach: Beobachtung „1 · 100.0 %" und
**„Modell 100.0 %"** (vorher 33,3 %), kein `NaN`/`Infinity`/`undefined`, die Einstellung überlebt
das Neuladen, „Zurücksetzen" stellt 10 Zähne her, keine Seitenfehler.

**Dabei selbst gefunden und behoben:** der Bericht schrieb „Krokodil, **1 Zähne**" — auf der
Statistikseite fehlte die Einzahl (das Spiel selbst sagte schon „Zahn übrig"). Behoben in
`src/presentation/stats/statsView.ts`, festgehalten in `statsView.test.ts`.

**Heil geblieben (ebenfalls geprüft):** Statistikseite mit Ein-Zahn-Protokoll (kein `NaN`, CSV-Export,
ein Balken „100 % (garantiert scharf)"), Vorschaulinie der Tier-Auswahl, die Zahnzahl überlebt das
Neuladen (`localStorage`), und im Bau wie live keine Reste der alten Regel („Beim echten Spielzeug
sind" 0×, `dialog.sheet[open]` 0×).

## 5l. Trefferfläche auf der schmalsten Bühne (11.10.2026, abends)

Auftrag: die Einschränkung aus §5k („bei 320 px Gerätebreite nur 42,9 px") nachziehen — die
Trefferfläche soll auch dort mindestens 44 px bleiben. Der Nutzer hat den Vorschlag angenommen
(„Ja ich nehme deine Empfehlung an"): Deckel **statisch** aus der schmalsten Bühne rechnen, und bei
11/12 Zähnen die Grenze ehrlich nennen statt sie zu verstecken.

**Gerechnet statt gesetzt.** In `creatures/geometry.ts` stand der Deckel als feste Zahl `48`
(„ein 4-Zähne-Maul braucht keine meterlangen Flächen"). Gemessen im Browser: 320 px Blick → 286 px
Bühne, der gezeichnete Maßstab entspricht aber nur **285,8 px** Breite (die Zeichnung ist im Kasten
höhenbegrenzt) → `48` Einheiten ergaben **43,70 px**. Jetzt: `MIN_STAGE_WIDTH_PX = 285` (zwei Pixel
Reserve gegen die Rundung), Deckel = 44/2 × 640/285 = **49,4 SVG-Einheiten**, und `tapTargetPx` sowie
`maxTapFriendlyTeeth` rechnen gegen die schmalste Bühne statt gegen 358 px.

**Vorher/nachher, im Browser gemessen** (`uv run --with playwright python scripts/pruefen-trefferflaeche.py`,
Chromium, lokale Seite, `getBoundingClientRect` eines `.tooth__hit`):

| Blick | Bühne | Trefferfläche vorher | nachher | eigener Zahn in der Mitte |
|---|---|---|---|---|
| 320 px | 286 px | 43,70 px | **44,15 px** | 10/10 |
| 360 px | 326 px | 49,82 px | 50,12 px | 10/10 |
| 390 px | 356 px | 54,40 px | 54,74 px | 10/10 |

Die Trefferfläche wächst also nur dort, wo sie unter der Vorgabe lag; die Zunahme ist überall ≤ 0,4 px.

**Ehrliche Grenze (gerechnet und im Test festgehalten).** Bei 11 und 12 Zähnen ist der halbe
Zahnabstand kleiner als die Vorgabe — dann bleibt er die Grenze, weil mehr überdeckende
Trefferflächen hieße und ein Tippziel, das dem Nachbarn den Druck stiehlt, der schlechtere Tausch
wäre. Betroffen sind bei 12 Zähnen fünf der sechs Lebewesen und bei 11 Zähnen die zwei engsten Ringe
(Maus, Vampir); die schmalste Stelle ist die Maus mit 12 Zähnen: **37,1 px**. Das Krokodil hat den
größten Ring und schafft die Vorgabe in jeder Zahnzahl. Auf einem gewöhnlichen Handy (358 px Bühne)
gilt die Vorgabe auch bei 12 Zähnen.

**Zweiter Fund derselben Messung — vorbestehend, nicht durch diesen Umbau entstanden.** Bei **Zahn 2
und Zahn 10** lieferte `document.elementFromPoint` in der Mitte des Trefferkreises das untere
Zahnfleischband (`path.jaw__band.jaw__band--lower`): das Band wird **nach** den unteren Zähnen
gezeichnet und liegt damit über deren Trefferfläche. Ein Tipp dort tat **nichts** (`#hud-presses`
0 → 0, Zustand `open`; Gegenprobe Zahn 1: 0 → 1). Dieselbe Messung gegen die alte Geometrie
(`git stash` auf `geometry.ts`) zeigte dasselbe Bild — der Fehler war also älter als dieser Umbau.
Behoben über `pointer-events: none` für alle dekorativen Ebenen der Zeichnung (Körper, Rachen,
Zahnfleisch, Schnauze, Gesicht, Beißer-Kreis, ruhende Zähne), `pointer-events: all` bleibt allein am
Trefferkreis. Nachgemessen: Tipp in der Mitte von Zahn 2 und 10 registriert (0 → 1), und
`elementFromPoint` liefert bei **allen** Zähnen den eigenen Zahn (10/10 statt 8/10).

**Belege (Kommandos).** Geometrie: Messung über die Kunstwerk-Module direkt in Node
(`scratch/trefferflaeche/messen2.mjs`, die Module importieren nur Typen). Browser: `pruefen.py`
(Pixel und Eigentum am Zentrum), `ueberdeckung.py` (wer liegt oben), `wirkung.py` (registriert der
Tipp). Gate: **230 Tests in 19 Dateien**, `tsc` fehlerfrei.

## 5m. Einstellungsblatt auf Tablets — es klebte links und nutzte die Breite nicht (11.10.2026, abends)

Auftrag: „Kannst du das settings Modal auch für Tablets auf die maximale breite optimieren". Auf dem
Handy ist `width: 100%` die volle Breite; ab 640 px deckelte `max-width: 620px` das Blatt, und weil
der Dialog mit `inset: auto 0 0 0` und `margin: 0` ausgerichtet ist, blieb der Platz **links**
ungenutzt (rechts wird dabei überstimmt — das Blatt sitzt nicht mittig).

**Eine Sonde, zwei Adressen** (`uv run --with playwright python scripts/pruefen-blattbreite.py
<adresse>`; veröffentlichte Seite gegen lokalen Bau):

```
--- vorher (veroeffentlichte Seite) ---
 768 x 1024 | Blatt  620.0 px, x =   0.0, Luft rechts 148.0 | 1 Spalte(n) | Inhalt 821 px in Sicht 821 px | ✕ sichtbar: True
        Auffällig: Tablet: Blatt klebt am Rand (links 0, rechts 148)
        Auffällig: Tablet: 1 Spalte statt mindestens 2
        Auffällig: Tablet: 620 px — die Breite wird nicht genutzt
1024 x 768  | Blatt  620.0 px, x =   0.0, Luft rechts 404.0 | 1 Spalte(n) | Inhalt 821 px in Sicht 630 px | ✕ sichtbar: True
1180 x 820  | Blatt  620.0 px, x =   0.0, Luft rechts 560.0 | 1 Spalte(n) | Inhalt 821 px in Sicht 672 px | ✕ sichtbar: True
        Auffällig: Inhalt 821 px in 672 px — das Blatt scrollt
1366 x 1024 | Blatt  620.0 px, x =   0.0, Luft rechts 746.0 | 1 Spalte(n) | Inhalt 821 px in Sicht 821 px | ✕ sichtbar: True

Auffälligkeiten: 17
Exit=1

--- nachher (lokaler Bau) ---
 320 x 720  | Blatt  320.0 px, x =   0.0, Luft rechts   0.0 | 1 Spalte(n) | Inhalt 845 px in Sicht 590 px | ✕ sichtbar: True
 390 x 844  | Blatt  390.0 px, x =   0.0, Luft rechts   0.0 | 1 Spalte(n) | Inhalt 821 px in Sicht 692 px | ✕ sichtbar: True
 768 x 1024 | Blatt  720.0 px, x =  24.0, Luft rechts  24.0 | 2 Spalte(n) | Inhalt 587 px in Sicht 587 px | ✕ sichtbar: True
 820 x 1180 | Blatt  772.0 px, x =  24.0, Luft rechts  24.0 | 2 Spalte(n) | Inhalt 587 px in Sicht 587 px | ✕ sichtbar: True
1024 x 768  | Blatt  976.0 px, x =  24.0, Luft rechts  24.0 | 3 Spalte(n) | Inhalt 549 px in Sicht 549 px | ✕ sichtbar: True
1180 x 820  | Blatt 1132.0 px, x =  24.0, Luft rechts  24.0 | 3 Spalte(n) | Inhalt 525 px in Sicht 525 px | ✕ sichtbar: True
1366 x 1024 | Blatt 1318.0 px, x =  24.0, Luft rechts  24.0 | 4 Spalte(n) | Inhalt 472 px in Sicht 472 px | ✕ sichtbar: True

Auffälligkeiten: 0
Exit=0
```

Das Handy bleibt unverändert (320/390/620 px: randlos, eine Spalte, ✕ im Kopf erreichbar). Auf dem
Tablet steht das Blatt 24 px von jeder Kante, **scrollt nicht mehr** (der Inhalt schrumpft durch die
Spalten von 821 auf 472–587 px statt vorher teilweise abgeschnitten zu sein), und das ✕ bleibt ohne
Scrollen sichtbar (§5i). Die anderen drei Blätter (Tierwahl, Regeln, Ergebnis) bleiben schmal
(620 px) — eine Regelzeile über 1100 px wäre schlechter zu lesen —, stehen aber jetzt **mittig**
statt am linken Rand. Angesehen (Bilder, 768 × 1024, 1180 × 820, 1366 × 1024, 390 × 844): Raster
sauber, kein Text abgeschnitten, kein Kind ragt aus dem Blatt (`kinderRaus` = 0 in allen acht Fällen).

**Umsetzung** (`presentation/styles/app.css`, Block `@media (min-width: 640px)`):
`inset: auto auto 1.5rem 50%` + `transform: translateX(-50%)` + `width: min(100% - 3rem, 620px)` für
alle Blätter; das Einstellungsblatt trägt zusätzlich die Klasse `sheet--columns`
(`pages/index.astro`) und wird `display: grid` mit `repeat(auto-fit, minmax(17rem, 1fr))` — zwei bis
vier Spalten nach **Breite**, nicht nach Geräteklasse. Blattkopf, Fußknöpfe, Fußwege und Hinweiszeilen
laufen über `grid-column: 1 / -1`; die Segment-Schalter bekommen `align-self: start`, sonst ziehen sie
als leere dunkle Spur über die ganze Spalte, während die Knöpfe links kleben.

**Zwei Fallen beim Bauen.** (1) Die erste Fassung schrieb `.sheet--columns { width: … }` — das verlor
gegen `dialog.sheet` aus demselben Block (Spezifität 0-1-1 gegen 0-1-0) und das Blatt blieb still bei
620 px, obwohl es schon zweispaltig stellte. Erst `dialog.sheet.sheet--columns` greift. (2) Die erste
Bildprobe überschrieb ihre eigenen „vorher"-Bilder (Dateiname im Skript fest verdrahtet) — zwei
identische Bilder, obwohl sich die Lage geändert hatte. Belastbar war die Zahlentabelle, nicht der
Bildvergleich.

## 6. Von Prüfern gefundene Umgebungsfallen (nachgeprüft)

| Behauptung des Prüfers | Eigene Nachprüfung | Ergebnis |
|---|---|---|
| `Math.lgamma` fehlt in Node 26 | `node -e "console.log(typeof Math.lgamma)"` → `undefined` | bestätigt; die Statistik nutzt deshalb eine eigene Lanczos-Näherung |
| „Vibrationen am Handy klappen nicht" (Nutzer, 10.10.2026) | Codeweg gelesen: der Controller rief `navigator.vibrate` selbst auf, ohne Prüfung, mit 12 ms | bestätigt; konnte der Browser es nicht (Safari auf iOS), passierte **still** nichts. Jetzt eigener Port mit `isSupported()`, 25 ms bei **jedem Zahndruck** und `[120, 50, 220]` beim Biss, abgeblendeter Schalter mit Begründung (Commits `44bc169`, `6884748`); die Vibration war am Gerät des Nutzers danach spürbar |
| Alte Seitenadresse nach der Umbenennung (10.10.2026) | Gegenprobe per HTTP gegen beide Adressen | Repo-Adresse `301 → /zahn-agent`, **Seiten-Adresse `404`** — GitHub leitet Projektseiten nicht um; Lesezeichen müssen neu gesetzt werden |
| Umbenennung auf `zahn_agent` (11.10.2026) | Gegenprobe per HTTP gegen beide Adressen | neue Adresse `/zahn_agent/` = **200** (Titel „Zahn Agent", Verweise alle unter dem neuen Pfad, 0 externe Ressourcen), alte Adresse `/zahn-agent/` = **404**, Repo-Adresse `301 → /zahn_agent`; Daten früherer Namen werden beim Laden übernommen (Kette `zahn-agent:…` → `kroko-doc-web:…`, zwei Tests) |
| „Update die Dokus" (Nutzer, 11.10.2026) | Rezepte wirklich gefahren und Zahlen gegen den Baum geprüft (`grep`, Vitest, `pnpm build`) | **vier echte Fehler:** (1) das Zeichen-Rezept zeigte auf `presentation/game/crocodile.ts` (seit der Zeichnungs-Schicht verschwunden) und das Rasterskript auf `projects/kroko-doc-web` mit Klassen der alten Dreh-Mechanik — es lief mit Exit 0 durch und tat **nichts**; (2) `# http://127.0.0.1:4321` in AGENTS.md und `docs/workflow.md` widersprach der Messung (`localhost` → 200, `127.0.0.1` → keine Antwort, für dev **und** preview); (3) `docs/testing.md` nannte 15 statt 16 Testdateien, eine Tabellenzeile war zerrissen und nannte ein altes Maximum von 20; (4) `docs/architecture.md` nannte als Zahn-Grenze `4..16` statt `4..12`. Alles korrigiert, das Rezept durch Sonde + Rasterer ersetzt und am Bild geprüft |
| „Kannst du weitere Skins machen? Hai, Maus und Vampir" (Nutzer, 11.10.2026) | Zeichnungen gerendert und **angesehen** (Sonde + `scripts/artwork-png.py`) | **Der erste Entwurf war unbrauchbar:** bei allen dreien war der Zahnring so groß, dass kein Platz fürs Gesicht blieb — beim Vampir lag die Haarkappe über dem halben Maul und die Augen auf den Zähnen, bei der Maus verschwanden die Ohren im Kopf und die Schnurrhaare liefen über die Augen, beim Hai hingen die Flossen wie Ohren und die Kiemenschlitze lagen unsichtbar unter dem Kieferband. Zweiter Entwurf: kleinere Ringe (Hai `rx 200`, Maus `rx 175`, Vampir `rx 186`), Ohren als eigene Kreise im Umriss; danach nachgezogen (Flossen-Highlight als Linie, Schnurrhaare in den Fellstreifen neben dem Maul, Umhangkragen mit Mittelkerbe). Der Trefferflächen-Test (≥ 44 px für 4–12 Zähne) bleibt für alle sechs Lebewesen grün |
| „Die 6 Streifen beim Hai sind schon zu sehen wenn das Maul noch gar nicht zu ist … sie sollten auf der Oberseite des Mauls sein" (Nutzer, 11.10.2026) | Im Code die Kiemen gesucht (`grep -i kiemen shark.ts`), den Maulring aus `geometry.ts` gerechnet (Ellipse 200×150 um 320/262), beide Zustände gerendert und angesehen | **Bestätigt, mit Rechnung:** die sechs Schlitze standen im `face`-Layer mitten im offenen Maul (y 214–306, wo der Maulrand bei x 121–133 liegt). Die frühere Reparatur „Kiemen über dem Kieferband" hatte sie nur **sichtbar** gemacht, nicht richtig platziert. Jetzt liegen sie außen auf dem Kopf, in der Zone zwischen Auge (x 161–231) und Silhouette, mit mindestens 5 px Abstand zum Maulrand und 3 px zur Kopfform — im geschnappten Zustand bleiben sie stehen. Nebenbei: der Kommentar behauptete „Fünf Kiemenschlitze je Seite", gezeichnet waren drei je Seite (sechs gesamt) — korrigiert |
| „Kannst du das Bild für das Krokodil mehr wie den Original krocodoc aussehen lassen ohne den aktuellen Stil zu verändern?" (Nutzer, 11.10.2026, mit Foto) | Foto und Zeichnung nebeneinander gelegt (`uv run --with pillow`), jede Fassung gerendert und angesehen; Maße gegen den Ring (240×160 um 320/265) gerechnet | **In vier Fassungen mit Sichtprüfung umgesetzt.** 1. **Irisring** hellblau hinter der Pupille, Pupille als Oval — die auffälligste Erkennung des Originals. 2. **Nasenlöcher kleiner** (die großen Punkte sahen wie zweite Augen aus). 3. **Schnauzenfalten:** erst als Doppelstriche (sah wie Bewegungsschwünge aus), dann als **Rille mit Grat** — drei Falten in der freien Zone über dem Maul, gegen die Ringellipse gerechnet. 4. **Einfarbig grün:** das Schnauzenband war ein heller Fleck, beim Original ist der Kopf eine Farbe — Band = Körperfarbe, die Kontur trennt. Dazu das Grün einen Hauch gelber und der Rachen sattes Rot (Zahnfleisch bleibt die hellste Stufe). **Bewusst nicht geändert:** der Maulring mit zwölf Zähnen (Spielmechanik) und die breite Kopfform (Träger des Rings) |
| Die Klangmaschine liest nur `window.AudioContext` | `sed -n '66,92p' src/infrastructure/audio/webAudioEngine.ts` | bestätigt; daraufhin Rückfall auf `webkitAudioContext` ergänzt (altes iOS) und mit drei Tests belegt |
| „Der Druck soll spannender werden" (Nutzer, 11.10.2026) | Standbild der neuen Pose gerastert und angesehen | **Eigener Werkzeugfehler gefunden:** der Rasterer setzte die Pose zusätzlich über die Klasse `is-pressing`, und weil cairosvg `transform-origin` nicht kennt, skalierte es die Pupillen-Regel um den Bildursprung — die Pupillen wanderten aus den Augen. Die Pose kommt jetzt vollständig aus Attributen (Verschiebung um den Kreismittelpunkt), das Bild stimmt. **Kein App-Fehler**, nur des Werkzeugs |
| „Kümmere dich um die offenen Punkte, nutze den `grill-me`-Skill und entscheide selbst" (Nutzer, 11.10.2026) | Acht Fragen des Selbst-Sparrings, jede mit nachgeschlagener Tatsache (`records.ts`, `round.ts`, `tension.ts` gelesen), die Varianten gerendert und angesehen | **Zwei Dinge gebaut, sechs bewusst gelassen, eines abgesagt.** Gebaut: die **Mut**-Zeile im Ergebnis (5e). **Abgesagt:** das „Weitergeben" — verschiebt die Zugreihenfolge des Kerns und ist nur am Tisch mit 2+ Spielern beurteilbar. **Gelassen:** sattgelbes Grün (gegengerendert: fällt als Fremdkörper aus der Familie der sechs), vierte Falte (freie Zone über dem Maul ist 60 px hoch und mit Nasenlöchern belegt), höhere Augen (2 % der Bildhöhe), Kiemengröße (abgenommen), 60-%-Schwelle (abgesprochen — rot ist damit immer ein Biss, ein *überstandener* roter Druck unmöglich), „geschlossener Blick" (über alle sechs gleich) |

| Eigene Domain `zahn-agent.schaflabs.com` (11.10.2026, Nutzerauftrag) | Record per Cloudflare-MCP angelegt und **nachgelesen**, Auflösung gegen zwei fremde Resolver (Cloudflare-DoH, Google-DoH), Seite durch den Proxy mit `curl --resolve` abgerufen, Pages-Konfiguration über die GitHub-API gelesen | **In drei Schritten belegt.** (1) *Vorher:* kein Record für den Namen, die Auflösung fiel auf die Homelab-Wildcard `*.schaflabs.com` (`192.168.0.240`). (2) *Nach dem Anlegen:* `zahn-agent.schaflabs.com` CNAME `shaunclaw07.github.io`, proxied; DoH Cloudflare `104.21.7.11` / `172.67.155.91`, DoH Google `188.114.96.0` / `188.114.97.0`; Abruf durch den Proxy **404** („Site not found · GitHub Pages"), in der API `cname: null` … (3) *Nach `public/CNAME`, Domain per Pages-API und Workflow ohne `ASTRO_BASE`* (Lauf `40be479` grün): Wurzel **200** (Titel „Zahn Agent — Zahn für Zahn zum Nervenkitzel"), `/statistik/` **200**, `/_astro/…css` **200**, `manifest.webmanifest` **200**, `favicon.svg` **200**, Verweise alle auf der Wurzel (`/statistik`, `/_astro/…`, `/favicon.svg`); alte Projektadresse **301 → zahn-agent.schaflabs.com**. Gate lokal **18 Dateien / 206 Tests grün**; beide Bauvarianten nachgemessen: ohne `ASTRO_BASE` → `/statistik`, mit `ASTRO_BASE=/zahn_agent` → `/zahn_agent/statistik`. Unterpfade kamen zunächst über `http` zurück — am selben Tag in Cloudflare behoben und gegengeprüft (siehe §7) |

## 7. Offene Punkte (ehrlich benannt)

- ~~**Kein echter Browser im Baum verfügbar** (kein Chrome, kein Playwright). Verhalten ist damit in
  jsdom und über gerenderte Standbilder belegt, nicht in einem Browser.~~ → **seit 11.10.2026 anders:**
  für die Oberflächenrunde (§5g) wurde Chromium 153.0.8010.12 nachinstalliert
  (`uv run --with playwright playwright install chromium`, Ablage `/opt/hermes/.playwright/`). Die
  Sonde lädt die Seite vom laufenden `pnpm dev` und misst im echten Layout (Klassen, Kennungen,
  `getComputedStyle`, Kachelgrößen, Dokumenthöhe) — **das Werkzeug `browser_exec` findet diesen
  Chromium nicht**, ein eigenes Skript über `uv` schon. Klänge und Vibration bleiben ohne Gerät
  unbelegt; Klänge laufen auch in diesem Chromium nicht ohne Nutzergeste.
- ~~Kein Deployment, keine Domain, kein Service Worker.~~ → erledigt am 10.10.2026: veröffentlicht über GitHub Pages, Basis-Pfad `/zahn_agent` (siehe README).
- ~~Vibration ist nicht in einem echten Browser geprüft~~ → am **11.10.2026 am Gerät bestätigt**: der Nutzer hat die Seite am Handy gespielt und die Vibration gespürt (25 ms bei jedem Zahndruck, drei Stöße beim Biss). Der Codeweg bleibt durch Controller- und Adapter-Tests belegt; seit 11.10.2026 gibt es zusätzlich einen Chromium im Baum (erster Punkt), aber **kein Gerät** — die Vibration selbst bleibt am Gerät zu prüfen.
- Die Zeichnung ist bewusst schlicht gehalten und darf jederzeit schöner werden.
- ~~Unabhängige Prüfung~~ → durchgeführt, siehe `docs/pruefung-unabhaengig.md`.
- **Entschieden am 11.10.2026:** das satte Grün (umgesetzt), die Rotglut bei 50 % (umgesetzt), der
  Mut auf der Statistikseite (umgesetzt); „Weitergeben" bleibt abgesagt. Offen bleibt allein der
  Blick des Spielers auf die neue Grün-Fassung und die Frage, ob die fünf anderen Lebewesen in einer
  eigenen Runde ebenfalls satter werden sollen — jetzt fällt das Krokodil bewusst aus der Reihe.
- ~~Die eigene Domain liefert Unterpfade über `http` zurück.~~ → **behoben am 11.10.2026.**
  Gemessen war `https://zahn-agent.schaflabs.com/statistik` → `301` mit
  `Location: http://zahn-agent.schaflabs.com/statistik/`: GitHub erzeugt seine Verzeichnis-Umleitung
  mit dem Schema, das es empfängt, und die Zone stand auf `ssl: flexible` bei
  `always_use_https: off`. Dadurch wäre die Statistikseite auf einem **anderen Origin** gelandet
  (`http` statt `https`) — mit leerem Rundenprotokoll, weil das `localStorage` am Origin hängt.
  In Cloudflare „Always Use HTTPS" eingeschaltet; **Gegenprobe danach:** `https://…/statistik` →
  `200` nach zwei Umleitungen, Endadresse `https://zahn-agent.schaflabs.com/statistik/` (Titel
  „Statistik — Zahn Agent"), `http://…` → `301` auf `https`, aus einer `http`-Adresse wird das Ziel
  in **einer** Umleitung erreicht — keine Schleife. Nebenwirkung geprüft: die anderen proxied
  Subdomains antworten weiter `200` über `https` und leiten `http` nun ebenfalls um; die
  DNS-only-Wildcard `*.schaflabs.com` löst unverändert direkt auf `192.168.0.240` auf.
  Auch der alte Lesezeichen-Link endet damit auf `https`: `https://shaunclaw07.github.io/zahn_agent/`
  → zwei Umleitungen → `https://zahn-agent.schaflabs.com/` **200** (Titel „Zahn Agent — Zahn für Zahn
  zum Nervenkitzel"), gemessen 12:12 Uhr.
