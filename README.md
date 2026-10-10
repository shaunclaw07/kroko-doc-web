# Kroko Doc Web

Das Zahn-Zufallsspiel um das Krokodil (bekannt als **Kroko Doc** / *Crocodile
Dentist*) als Webapp: Zahn für Zahn antippen — ein Zahn ist der falsche, dann
schnappt das Maul zu. Mit Ton, Herzschlag, Totenstille vor dem Biss und einer
Statistikseite, die eure eigenen Runden auswertet.

**Warum es dieses Spiel gibt.** Ein Familienmitglied hat gefragt, ob man
vorher berechnen kann, welcher Zahn das Maul schließt. Antwort: nein — das
Spielzeug ist ein mechanischer Zufallsgenerator, und ein Teardown zeigt, dass
sogar **1 bis 3 Zähne gleichzeitig** scharf sind (make Magazin 1/2023). Also
haben wir erst gerechnet (`../kroko-doc`, Python-Werkzeug mit Chi²-Tests) und
dann das Spiel mit dieser Rechnung im Bauch gebaut — inklusive der Frage, ob
das eigene Krokodil ehrlich zufällig ist.

## Was es kann

- **Spielen:** 1–4 Spieler im Hot-Seat, zehn Zähne, Maul schnappt zu, Verlierer wird benannt.
- **Zwei Zufallsmodelle:** `original` (1–3 Zähne gleichzeitig scharf, wie das echte Spielzeug)
  und `classic` (genau ein scharfer Zahn).
- **Nervenkitzel:** synthetisierte Klänge (Web Audio, keine Dateien), Herzschlag, dessen Tempo
  mit der Spannung steigt, Knarren, Fakeout-Zucken des Mauls, Totenstille vor dem Biss,
  Screen-Shake, Vibration, „Nur noch ein Zahn — der ist garantiert scharf!".
- **Statistik:** jede Runde wird lokal protokolliert; die Statistikseite zeigt Häufigkeiten,
  Chi²-Tests gegen Gleichverteilung **und** gegen das Zugmodell, Wilson-Intervalle,
  Autokorrelation (Mustersuche) und exportiert/importiert CSV im Format des Analyse-Werkzeugs.
- **Ehrlich:** unter 100 Runden gibt es keine Signifikanz-Aussage, sondern den Hinweis, dass
  die Daten zu dünn sind.
- **Kein Netz nötig:** keine externen Schriften, Bilder, CDNs; alles lokal, mobil zuerst.

## Loslegen

```bash
pnpm install
pnpm dev            # http://127.0.0.1:4321
pnpm gate           # typecheck + tests
pnpm build          # statische Ausgabe nach dist/
```

## Zahlen, die belegt sind

| Größe | Wert | Herkunft |
|---|---|---|
| Tests | **101 in 12 Dateien**, alle grün | `pnpm test:run` |
| Typenprüfung | keine Fehler | `pnpm typecheck` |
| Produktionsbau | 2 Seiten, 2,49 s | `pnpm build` |
| P(Biss beim 1. Druck) | 20,0 % | Rechnung `core/domain/probabilities.ts`, geprüft gegen Python |
| Erwartete Drücke bis zum Biss | 3,972222 | ebenda |
| 4 Spieler reihum | 33,9 % / 28,3 % / 20,7 % / 17,0 % | ebenda (Startspieler verliert am häufigsten) |
| Letzter Zahn | 3,333 % und dann garantiert scharf | ebenda |
| Schließwinkel des Oberkiefers | 6,49° rechnerisch, 7° im Stylesheet | Geometrie der Zeichnung |

## Aufbau

```
src/core/domain/       Fachregeln: Zähne, Runde, Wahrscheinlichkeiten, Spannung, Statistik
src/core/ports/        Nähte: RandomSource, LiveTeethSelector, RoundLogPort, SoundPort
src/core/use-cases/    playPress — ein Druck samt Dramaturgie
src/contract/          Außenvertrag (Rundenprotokoll, CSV-Format)
src/infrastructure/    crypto-Zufall, Web-Audio-Klänge, localStorage, Testattrappen
src/presentation/      Spielsteuerung, SVG-Zeichnung, Statistikansicht, Astro-Seiten
```

Regeln für Arbeit am Baum: [`AGENTS.md`](AGENTS.md) und [`docs/`](docs/).
Nachweise der Prüfläufe: [`docs/e2e-nachweise.md`](docs/e2e-nachweise.md).

## Herkunft und Grenzen

- Das Spielprinzip stammt vom Spielzeug *Kroko Doc* (Hasbro, 1990). Diese App ist eine
  eigenständige Umsetzung ohne Marken- oder Gestaltungsübernahme; Zahlen und Mechanik beruhen
  auf öffentlich beschriebenen Analysen (make Magazin 1/2023, Wikipedia).
- **Nicht geprüft in einem echten Browser:** Im Baum steht kein Chrome zur Verfügung. Belegt ist
  das Verhalten in jsdom (Bedienungs- und Statistiksonde) sowie über gerenderte Standbilder der
  Zeichnung. Ein Browser-Durchlauf auf eurem Gerät ist der nächste sinnvolle Schritt.
- Kein Deployment, kein Server, keine Konten — die Daten bleiben im `localStorage` des Browsers.
