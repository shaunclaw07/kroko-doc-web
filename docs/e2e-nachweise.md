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
- **Gemessene Folge der 60-%-Schwelle:** kein Gebiss erreicht 60 % vor dem letzten Druck (Krokodil
  40,7 % beim achten, 55,0 % beim neunten) → rot wird es erst beim allerletzten Zahn. Der
  Stolperdraht in `statsView.test.ts` hält diese Folge fest.
- **Produktfehler gefunden und behoben:** vor dem ersten Druck stand „Bissgefahr 0 %", obwohl der
  erste Druck beim Krokodil 20 % gefährlich ist. Die Anzeige leitet die Gefahr jetzt bei jedem
  Render aus der Runde ab (`tensionOfNextPress`), nicht nur nach einem Druck.
- **Was kein Test zeigen kann:** wie der Balken auf dem Handy wirkt. jsdom kennt kein Layout und im
  Arbeitsbaum gibt es keinen Browser — die Bildregeln sind über das gebaute CSS und das Verhalten
  über die DOM-Tests belegt; das Aussehen beurteilt der Spieler.

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

## 7. Offene Punkte (ehrlich benannt)

- **Kein echter Browser im Baum verfügbar** (kein Chrome, kein Playwright). Verhalten ist
  damit in jsdom und über gerenderte Standbilder belegt, nicht in einem Browser.
- ~~Kein Deployment, keine Domain, kein Service Worker.~~ → erledigt am 10.10.2026: veröffentlicht über GitHub Pages, Basis-Pfad `/zahn_agent` (siehe README).
- ~~Vibration ist nicht in einem echten Browser geprüft~~ → am **11.10.2026 am Gerät bestätigt**: der Nutzer hat die Seite am Handy gespielt und die Vibration gespürt (25 ms bei jedem Zahndruck, drei Stöße beim Biss). Der Codeweg bleibt durch Controller- und Adapter-Tests belegt — ein Browser im Baum fehlt weiterhin (erster Punkt).
- Die Zeichnung ist bewusst schlicht gehalten und darf jederzeit schöner werden.
- ~~Unabhängige Prüfung~~ → durchgeführt, siehe `docs/pruefung-unabhaengig.md`.
