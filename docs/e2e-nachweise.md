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
| doppelte `id` im Dokument | **0** | 7 Kopfbilder, 7 eindeutige Beschnitt-Kennungen |
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
