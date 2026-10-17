---
type: quickstart
title: Quickstart — Zahn Agent
description: Einstiegspunkt in den Zahn Agent — was die statisch gebaute Astro-Seite mit Spielseite und Statistikseite, DOM-freiem Kern, Service Worker und Sicherungs-Worker ausmacht, welche Befehle in package.json stehen, welche drei Grundregeln gelten und welcher Aufgaben-Lotse jede wiederkehrende Änderung an genau eine zuständige Wikiseite schickt.
tags: [quickstart, orientation, task-routing, commands, gate, base-path, astro, conventions]
verified:
  - by: openwiki/0.7.2
    at: 2026-10-17T09:06:25.393Z
sources:
  - id: openwiki-source-baf30c604828cfde90a8ab63
    resource: repo://.githooks/pre-push
  - id: openwiki-source-5f219f204b3e870beec929d9
    resource: repo://.github/workflows/pages.yml
  - id: openwiki-source-8037e2358a2c4f9b2c722a11
    resource: repo://AGENTS.md
  - id: openwiki-source-c50574f22a4c0741148fc769
    resource: repo://astro.config.mjs
  - id: openwiki-source-115b2dad781e2a2c5b5a980d
    resource: repo://docs/architecture.md
  - id: openwiki-source-9dc40ed6fe702070bd18d6cd
    resource: repo://docs/language-guidelines.md
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-23775c3de52f3ab95a13cb8b
    resource: repo://README.md
  - id: openwiki-source-c88a81768831ed610ff912dc
    resource: repo://scripts/pruefen-alle.py
  - id: openwiki-source-1b681c4ce8d10cbab258bb09
    resource: repo://src/pages/index.astro
  - id: openwiki-source-0cdf8374d35c07aba8b29729
    resource: repo://src/pages/statistik.astro
generated: { by: "openwiki/0.7.2", at: "2026-10-17T09:06:25.393Z" }
---

# Quickstart — Zahn Agent

**Zahn Agent** ist ein Zahn-Zufallsspiel als **statisch gebaute Web-App**: Blick von vorne oben in ein
offenes Maul, Zahn für Zahn antippen, bis einer das Maul zuschnappen lässt; eine zweite Seite wertet
die eigenen Runden aus. Gebaut wird mit Astro (`output: 'static'`), ausgeliefert über GitHub Pages —
**es gibt keinen Serveranteil, der eine Runde entgegennimmt**. Alles Spielerische läuft im Browser
(`localStorage`); aus dem Gerät heraus geht nur die optionale Sicherung, und nur mit einem
Sicherungscode in der Adresse.

| Baustein | Wo | Rolle |
|---|---|---|
| Spielseite | `src/pages/index.astro` | Bühne, Griffe, Blätter; baut die Adapter und ruft **eine** Verdrahtungsfunktion |
| Statistikseite | `src/pages/statistik.astro` | Bericht, Verlauf, CSV-Import/-Export, Protokoll löschen |
| Kern | `src/core/` (`domain`, `ports`, `use-cases`) | Fachregeln ohne DOM und ohne Uhr; Zufall, Ablage, Ton und Vibration kommen als Port herein |
| Bedienung und Adapter | `src/presentation/`, `src/infrastructure/`, `src/contract/` | Verdrahtung, Spielsteuerung, Zeichnungen; crypto, Web Audio, Vibration, `localStorage`, HTTP |
| Außenposten | `public/sw.js`, `worker/backup.js` | Service Worker hält die Seite offline startbar; Cloudflare Worker sichert Runden |

Wie das zusammenhängt, steht auf [Architektur-Überblick](architecture/ueberblick.md).

## In fünf Minuten lokal

Nötig sind die Fassungen aus `engines` in [`package.json`](../package.json): Node
`^22.22.2 || ^24.15.0 || >=26.0.0` und pnpm `>=9.0.0`.

```bash
pnpm install     # hängt auch .githooks/pre-push ein (Skript `prepare`)
pnpm dev         # Entwicklungsserver auf http://localhost:4321
```

> **`localhost`, nicht `127.0.0.1`.** Astro hört standardmäßig nur auf `localhost` (IPv6); über
> `127.0.0.1` bekommst du „Verbindung fehlgeschlagen". Wer die IPv4-Adresse will:
> `pnpm dev --host 127.0.0.1`. Ist Port 4321 belegt: `pnpm dev --port 4322`.

Der Entwicklungsserver ist **nicht** die Umgebung für den Service Worker und für die Browser-Sonden:
der Service Worker wird nur im Bau angemeldet. Dafür `pnpm build && pnpm preview --port 4322` fahren
und die Sonden gegen `http://localhost:4322` laufen lassen.

## Befehle

Die Skripte wörtlich aus [`package.json`](../package.json):

| Befehl | Skript | Wirkung |
|---|---|---|
| `pnpm dev` | `astro dev` | Entwicklungsserver auf <http://localhost:4321> |
| `pnpm build` | `astro build` | statische Ausgabe nach `dist/` (zwei Seiten) |
| `pnpm preview` | `astro preview` | liefert `dist/` aus — die einzige Umgebung mit Service Worker |
| `pnpm typecheck` | `tsc --noEmit` | Teil des Gates |
| `pnpm lint` | `biome lint --error-on-warnings .` | Teil des Gates; auch Warnungen lassen es fallen |
| `pnpm test:run` | `vitest run` | Teil des Gates (`pnpm test` ist derselbe Lauf im Wachmodus) |
| `pnpm gate` | `pnpm typecheck && pnpm lint && pnpm test:run` | die Prüfung vor jedem Commit und Push |
| `pnpm probes` | `python scripts/pruefen-alle.py http://localhost:4322` | alle 13 Browser-Sonden gegen die laufende Vorschau |

Das Gate ist **dreierlei**: `typecheck` **und** `lint` **und** `test:run`. Die Sonden brauchen eine
laufende Vorschau auf Port **4322** — ohne Server bricht `pnpm probes` ab, und die Offline-Sonde ist
ohne Bau sinnlos. Was die Tests tragen und wann die Sonden müssen:
[Prüfen: Gate, Tests und Browser-Sonden](testing/pruefen-und-gate.md).

## Die drei Grundregeln

**1. Sprache: Englisch im Code, Deutsch für Menschen.** Bezeichner, Typen, Funktionsnamen und
Meldungen im Code sind englisch (auch die `DomainError`-Codes); Kommentare, Doku (`docs/`,
`README.md`, `AGENTS.md`), UI-Texte und Commit-Beschreibungen sind deutsch. Die Tabelle steht in
[`docs/language-guidelines.md`](../docs/language-guidelines.md), die Arbeitsregeln dazu auf
[Sprache, Doku-Regeln und Kommentarstil](concepts/sprache-und-konventionen.md).

**2. Das Gate ist dreierlei.** `pnpm gate` heißt `typecheck` **und** `lint` **und** `test:run` — ein
grüner Testlauf allein ist kein grünes Gate. Fällt es, wird der Fund **im Code** behoben, das Gate neu
gefahren und erst dann committet bzw. gepusht. Nur mit dem Ja des Auftraggebers: eine Regel in
`biome.jsonc` abschalten, eine `// biome-ignore`-Zeile, `git push --no-verify`, einen Test lockern.
Dasselbe Gate hängt vor dem Push ([`.githooks/pre-push`](../.githooks/pre-push)) und im Workflow.

**3. Interne Verweise immer über den Basis-Pfad.** Jeder interne Verweis — Link, Icon, Manifest,
Laufzeit-Abruf — entsteht aus `import.meta.env.BASE_URL`, **nie** absolut mit `"/"`. `ASTRO_BASE` ist
der Notausgang für einen Unterpfad: [`astro.config.mjs`](../astro.config.mjs) normalisiert den Wert auf
einen Schluss-Schrägstrich (sonst entsteht `/zahn_agentstatistik`) und bricht ab, wenn er nicht mit `/`
beginnt. Ohne die Variable ist der Basis-Pfad `/`, und genau so baut der Workflow.

## Aufgaben-Lotse

Je Aufgabe genau eine zuständige Seite — die Einzelheiten stehen dort, nicht hier:

| Aufgabe | Zuständige Seite |
|---|---|
| Eine Regel der Runde, der Zähne, des Spielmodus oder der Einstellungen ändern | [Fachmodell: Runde, Zähne, Gebiss, Einstellungen](concepts/fachmodell-runde.md) |
| Zufall, scharfe Zähne, Bissgefahr oder Spannungsdramaturgie ändern | [Zufall, Wahrscheinlichkeiten und Spannungsdramaturgie](concepts/zufall-und-spannung.md) |
| Sterne, Album oder die Schwellen der Freischaltung ändern | [Sterne, Album und Freischaltung](concepts/sterne-und-freischaltung.md) |
| Die Zeichnung eines Lebewesens ändern | [Zeichnungssystem der Lebewesen (SVG)](architecture/zeichnungssystem.md) |
| Ein Tier ergänzen (Katalog, Zeichnung, Freischaltung, Stimme, Bild, Tests, Doku) | [Ein neues Lebewesen ergänzen](workflows/neues-lebewesen.md) |
| Ton, Tierstimme oder Vibration anfassen | [Ton, Tierstimmen und Vibration](integrations/ton-und-vibration.md) |
| Das Seitenskript der Spielseite oder ihre Verdrahtung (`wireGamePage`) anfassen | [Spielseite verdrahten (wireGamePage)](workflows/spielseite-verdrahtung.md) |
| Die Statistikseite ändern (Bericht, Verlauf, CSV, „Protokoll löschen") | [Statistikseite: Bericht, Verlauf, Import/Export und Löschen](workflows/statistikseite.md) |
| Die Rechnung der Statistik, Mindeststichprobe oder Ehrlichkeitsregeln ändern | [Statistik und Ehrlichkeitsregeln](concepts/statistik-und-ehrlichkeit.md) |
| Datenformat, CSV-Import/-Export oder `mergeRoundLogs` ändern | [Rundenprotokoll, CSV und Zusammenführen](concepts/rundenprotokoll-und-csv.md) |
| Die Sicherung oder den Worker anfassen | [Sicherung der Runden: Worker, Code aus der Adresse, Abgleich](integrations/sicherung-worker.md) |
| Service Worker, Cache oder Manifest anfassen | [Offline-Betrieb: Service Worker, Cache-Regeln und Manifest](integrations/offline-service-worker.md) |
| Bauen, Basis-Pfad oder Veröffentlichen ändern | [Bauen, Basis-Pfad und Veröffentlichen](operations/bauen-und-veroeffentlichen.md) |
| Prüfen: Gate, Tests, Sonden | [Prüfen: Gate, Tests und Browser-Sonden](testing/pruefen-und-gate.md) |
| Sprache, Kommentarstil oder Doku-Regeln ändern | [Sprache, Doku-Regeln und Kommentarstil](concepts/sprache-und-konventionen.md) |
| Ein Modul anlegen oder eine Schichtgrenze überschreiten | [Schichten, Ports und die Importregel (A1–A8)](architecture/schichten-und-importregel.md) |

## Weitere Seiten

Zum Lesen, nicht zum Ändern:

- [Architektur-Überblick](architecture/ueberblick.md) — das System in einem Bild, wenn du neu im Baum bist.
- [Ein Spielzug von der Berührung bis zum Protokolleintrag](workflows/spielzug.md) — der Laufzeitpfad eines einzelnen Drucks.

## Erste Handgriffe im Repository

- [`AGENTS.md`](../AGENTS.md) ist der **Einstiegspunkt, kein Regelwerk**: es nennt die Direktiven und
  die Index-Tabelle, die für jedes Thema die zuständige Datei unter `docs/` zeigt.
- **`docs/fallen.md` vor jeder Änderung am Code** — dort steht, was schon einmal Zeit gekostet hat.
- `openwiki/` ist **generiertes Projektgedächtnis, kein Regelwerk**: bei Widerspruch gilt `docs/`.
  Seiten werden **nicht von Hand** gepflegt, sondern durch einen OpenWiki-Lauf aufgefrischt
  (Aufruf im Abschnitt „Projektgedächtnis" in [`AGENTS.md`](../AGENTS.md)).
