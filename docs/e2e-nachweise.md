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
fester Pfad. Am Bild geprüft (Krokodil, Wolf, Mensch — je „offen" und „geschnappt"): offenes Maul
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

## 6. Von Prüfern gefundene Umgebungsfallen (nachgeprüft)

| Behauptung des Prüfers | Eigene Nachprüfung | Ergebnis |
|---|---|---|
| `Math.lgamma` fehlt in Node 26 | `node -e "console.log(typeof Math.lgamma)"` → `undefined` | bestätigt; die Statistik nutzt deshalb eine eigene Lanczos-Näherung |
| „Vibrationen am Handy klappen nicht" (Nutzer, 10.10.2026) | Codeweg gelesen: der Controller rief `navigator.vibrate` selbst auf, ohne Prüfung, mit 12 ms | bestätigt; konnte der Browser es nicht (Safari auf iOS), passierte **still** nichts. Jetzt eigener Port mit `isSupported()`, 25 ms bei **jedem Zahndruck** und `[120, 50, 220]` beim Biss, abgeblendeter Schalter mit Begründung (Commits `44bc169`, `6884748`); die Vibration war am Gerät des Nutzers danach spürbar |
| Alte Seitenadresse nach der Umbenennung (10.10.2026) | Gegenprobe per HTTP gegen beide Adressen | Repo-Adresse `301 → /zahn-agent`, **Seiten-Adresse `404`** — GitHub leitet Projektseiten nicht um; Lesezeichen müssen neu gesetzt werden |
| Umbenennung auf `zahn_agent` (11.10.2026) | Gegenprobe per HTTP gegen beide Adressen | neue Adresse `/zahn_agent/` = **200** (Titel „Zahn Agent", Verweise alle unter dem neuen Pfad, 0 externe Ressourcen), alte Adresse `/zahn-agent/` = **404**, Repo-Adresse `301 → /zahn_agent`; Daten früherer Namen werden beim Laden übernommen (Kette `zahn-agent:…` → `kroko-doc-web:…`, zwei Tests) |
| „Update die Dokus" (Nutzer, 11.10.2026) | Rezepte wirklich gefahren und Zahlen gegen den Baum geprüft (`grep`, Vitest, `pnpm build`) | **vier echte Fehler:** (1) das Zeichen-Rezept zeigte auf `presentation/game/crocodile.ts` (seit der Zeichnungs-Schicht verschwunden) und das Rasterskript auf `projects/kroko-doc-web` mit Klassen der alten Dreh-Mechanik — es lief mit Exit 0 durch und tat **nichts**; (2) `# http://127.0.0.1:4321` in AGENTS.md und `docs/workflow.md` widersprach der Messung (`localhost` → 200, `127.0.0.1` → keine Antwort, für dev **und** preview); (3) `docs/testing.md` nannte 15 statt 16 Testdateien, eine Tabellenzeile war zerrissen und nannte ein altes Maximum von 20; (4) `docs/architecture.md` nannte als Zahn-Grenze `4..16` statt `4..12`. Alles korrigiert, das Rezept durch Sonde + Rasterer ersetzt und am Bild geprüft |
| Die Klangmaschine liest nur `window.AudioContext` | `sed -n '66,92p' src/infrastructure/audio/webAudioEngine.ts` | bestätigt; daraufhin Rückfall auf `webkitAudioContext` ergänzt (altes iOS) und mit drei Tests belegt |

## 7. Offene Punkte (ehrlich benannt)

- **Kein echter Browser im Baum verfügbar** (kein Chrome, kein Playwright). Verhalten ist
  damit in jsdom und über gerenderte Standbilder belegt, nicht in einem Browser.
- ~~Kein Deployment, keine Domain, kein Service Worker.~~ → erledigt am 10.10.2026: veröffentlicht über GitHub Pages, Basis-Pfad `/zahn_agent` (siehe README).
- ~~Vibration ist nicht in einem echten Browser geprüft~~ → am **11.10.2026 am Gerät bestätigt**: der Nutzer hat die Seite am Handy gespielt und die Vibration gespürt (25 ms bei jedem Zahndruck, drei Stöße beim Biss). Der Codeweg bleibt durch Controller- und Adapter-Tests belegt — ein Browser im Baum fehlt weiterhin (erster Punkt).
- Die Zeichnung ist bewusst schlicht gehalten und darf jederzeit schöner werden.
- ~~Unabhängige Prüfung~~ → durchgeführt, siehe `docs/pruefung-unabhaengig.md`.
