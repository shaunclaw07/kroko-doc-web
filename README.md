# Kroko Doc Web

Das Zahn-Zufallsspiel um das Krokodil (bekannt als **Kroko Doc** / *Crocodile
Dentist*) als Webapp: Zahn für Zahn antippen — ein Zahn ist der falsche, dann
schnappt das Maul zu. Man schaut **von vorne oben in das offene Maul** und kann
zwischen Gebissen wählen: Krokodil, Wolf, Mensch. Mit Ton, Herzschlag,
Totenstille vor dem Biss und einer Statistikseite, die eure eigenen Runden
auswertet.

**Warum es dieses Spiel gibt.** Ein Familienmitglied hat gefragt, ob man
vorher berechnen kann, welcher Zahn das Maul schließt. Antwort: nein — das
Spielzeug ist ein mechanischer Zufallsgenerator, und ein Teardown zeigt, dass
sogar **1 bis 3 Zähne gleichzeitig** scharf sind (make Magazin 1/2023). Also
haben wir erst gerechnet (`../kroko-doc`, Python-Werkzeug mit Chi²-Tests) und
dann das Spiel mit dieser Rechnung im Bauch gebaut — inklusive der Frage, ob
das eigene Krokodil ehrlich zufällig ist.

## Was es kann

- **Spielen:** 1–4 Spieler im Hot-Seat, Maul schnappt zu, Verlierer wird benannt.
- **Drei Gebisse:** Krokodil (10 Zähne, 1–3 gleichzeitig scharf), Wolf (12 Zähne, 1–2 — vier
  große Fangzähne), Mensch (12 Zähne, 1–3). Jedes Gebiss zeichnet sich selbst: Blick von vorne
  oben in den Rachen, eigenes Zahnprofil, eigene Kopfform.
- **Zahnzahl einstellbar:** 4 bis 12 drückbare Zähne, standardmäßig so viele, wie das Tier
  vorsieht. Die Zähne sitzen auf einem Ring **um das ganze Maul** (obere und untere Reihe), damit
  jedem Zahn auf einem 358 px breiten Handy eine Trefferfläche von mindestens 44 × 44 Pixeln
  bleibt — bei 16 Zähnen wären es nur noch 38 px, deshalb ist bei 12 Schluss. Ein Test rechnet
  das für jedes Lebewesen nach. Mehr Zähne heißt mehr Drücke: der Wolf beißt später zu (bei 12
  Zähnen 5,42 erwartete Drücke statt 4,69).
- **Kindgerecht gezeichnet:** warme Farben, runde Zähne, große runde Augen mit Glanzpunkt,
  rosa Wangen und weiche Umrisse; der Rachen ist rosenrot statt schwarz. Maul, Zähne und
  Gesicht werden auf den Kopfumriss beschnitten, damit beim Zuschnappen nichts daneben hängt.
- **Erweiterbar:** ein neues Lebewesen ist ein Katalogeintrag plus eine Zeichnungsdatei — ein
  Test erzwingt, dass Zahnzahl, Zahnformen und Ebenen zusammenpassen.
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
| Tests | **146 in 15 Dateien**, alle grün | `pnpm test:run` |
| Typenprüfung | keine Fehler | `pnpm typecheck` |
| Produktionsbau | 2 Seiten, 2,49 s | `pnpm build` |
| P(Biss beim 1. Druck) | 20,0 % | Rechnung `core/domain/probabilities.ts`, geprüft gegen Python |
| Erwartete Drücke bis zum Biss | 3,972222 (Krokodil, 10 Zähne) · 4,694444 (12 Zähne) | ebenda |
| 4 Spieler reihum | 33,9 % / 28,3 % / 20,7 % / 17,0 % | ebenda (Startspieler verliert am häufigsten) |
| Letzter Zahn | 3,333 % und dann garantiert scharf | ebenda |
| Schließweg des Oberkiefers | Krokodil 232,0 · Mensch 226,0 · Wolf 222,0 SVG-Einheiten | berechnet als `2·ry − Banddicke oben − Banddicke unten`, abgelesen im erzeugten SVG |

## Aufbau

```
src/core/domain/       Fachregeln: Zähne, Runde, Wahrscheinlichkeiten, Spannung, Statistik
src/core/ports/        Nähte: RandomSource, LiveTeethSelector, RoundLogPort, SoundPort
src/core/use-cases/    playPress — ein Druck samt Dramaturgie
src/contract/          Außenvertrag (Rundenprotokoll, CSV-Format)
src/infrastructure/    crypto-Zufall, Web-Audio-Klänge, localStorage, Testattrappen
src/presentation/      Spielsteuerung, Statistikansicht, Astro-Seiten
  game/creatures/      je Lebewesen ein Zeichnungsmodul + Fabrik + Registry
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
