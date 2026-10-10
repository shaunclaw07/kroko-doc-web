# Nachweisakte

Alle Nachweise stammen aus ausgeführten Kommandos (Oktober 2026).

## 1. Gate

| Kommando | Ergebnis |
|---|---|
| `pnpm typecheck` (`tsc --noEmit`) | keine Fehler (Ausgabe `TSC_OK`) |
| `pnpm test:run` (`vitest run`) | **155 Tests in 16 Dateien bestanden** |
| `pnpm build` | 2 Seiten gebaut in 2,49 s; `dist/index.html`, `dist/statistik/index.html` |
| Produktionsbau über `pnpm preview` (Port 4399) | siehe Abschnitt 4b — alle vier Routen `200`, kein externer Verweis |

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

## 5. Zeichnungssonde (ohne Browser gerendert)

`uv run --with cairosvg python render_croc.py croc.svg <zustand>.png <zustand>` — erzeugt
PNG für „offen", „geschnappt" und „gedrueckt". Geprüft wurde am Bild: offenes Maul mit zehn
weißen Zähnen auf der Zahnfleischlinie, geschlossener Oberkiefer auf dem Unterkiefer,
gedrückte Zähne sitzen im Kiefer.

Rechnerische Kontrolle: bei −6,49 Grad trifft die Unterkante des Oberkiefers die
Zahnfleischlinie exakt; das Stylesheet nutzt −7 Grad.

## 6. Von Prüfern gefundene Umgebungsfallen (nachgeprüft)

| Behauptung des Prüfers | Eigene Nachprüfung | Ergebnis |
|---|---|---|
| `Math.lgamma` fehlt in Node 26 | `node -e "console.log(typeof Math.lgamma)"` → `undefined` | bestätigt; die Statistik nutzt deshalb eine eigene Lanczos-Näherung |
| „Vibrationen am Handy klappen nicht" (Nutzer, 10.10.2026) | Codeweg gelesen: der Controller rief `navigator.vibrate` selbst auf, ohne Prüfung, mit 12 ms | bestätigt; konnte der Browser es nicht (Safari auf iOS), passierte **still** nichts. Jetzt eigener Port mit `isSupported()`, 24 ms + `[120, 50, 220]`, abgeblendeter Schalter mit Begründung (Commit `44bc169`) |
| Alte Seitenadresse nach der Umbenennung (10.10.2026) | Gegenprobe per HTTP gegen beide Adressen | Repo-Adresse `301 → /zahn-agent`, **Seiten-Adresse `404`** — GitHub leitet Projektseiten nicht um; Lesezeichen müssen neu gesetzt werden |
| Die Klangmaschine liest nur `window.AudioContext` | `sed -n '66,92p' src/infrastructure/audio/webAudioEngine.ts` | bestätigt; daraufhin Rückfall auf `webkitAudioContext` ergänzt (altes iOS) und mit drei Tests belegt |

## 7. Offene Punkte (ehrlich benannt)

- **Kein echter Browser im Baum verfügbar** (kein Chrome, kein Playwright). Verhalten ist
  damit in jsdom und über gerenderte Standbilder belegt, nicht in einem Browser.
- ~~Kein Deployment, keine Domain, kein Service Worker.~~ → erledigt am 10.10.2026: veröffentlicht über GitHub Pages, Basis-Pfad `/zahn-agent` (siehe README).
- **Vibration ist nicht in einem echten Browser geprüft** — im Baum gibt es kein Gerät. Belegt ist der Codeweg (Controller- und Adapter-Tests), nicht das Gefühl am Handy.
- Die Zeichnung ist bewusst schlicht gehalten und darf jederzeit schöner werden.
- ~~Unabhängige Prüfung~~ → durchgeführt, siehe `docs/pruefung-unabhaengig.md`.
