# Plan: Zahn-Zufallsspiel als Webapp

> **Hinweis (10.10.2026).** Dies ist der ursprüngliche Plan der Erstfassung; er bleibt im
> Wortlaut stehen. Das Projekt heißt seit dem 10.10.2026 **Zahn Agent** (vorher
> `kroko-doc-web`) und liegt unter diesem Namen auf GitHub.

Ziel: Ein Browser-Spiel, das den Nervenkitzel des echten Kroko Doc hat — im Allein-
und Hot-Seat-Modus, mobil zuerst, offline-fähig, ohne externe Assets. Zusätzlich
die Statistik-Auswertung aus `~/projects/kroko-doc` (Chi² gegen Modell) als
eingebaute Seite: nach 100 Runden sieht man, ob das eigene Krokodil zufällig ist.

## 1. Fachliches Modell (Kern, rein)

- `Teeth`: 1..n (Standard n = 10).
- Runde (`Round`): Maul offen → Spieler drücken nacheinander je einen noch nicht
  gedrückten Zahn → der erste **scharfe** Zahn lässt das Maul zuschnappen, dieser
  Spieler ist der Verlierer.
- Zwei Zufallsmodelle (aus der Teardown-Recherche, make 1/2023):
  - `original`  – beim Öffnen werden **1 bis 3** Zähne gleichzeitig scharf gestellt.
  - `classic`   – genau **1** Zahn von n ist scharf (klassisches Kinder-Roulette).
- Rechenbare Größen (im Kern, getestet gegen die Python-Werte):
  P(Zuschnappen beim j-ten Druck), E[Drücke], P(Spieler i verliert), Überlebenskurve.
  Referenzwerte n=10, original, zufällige Reihenfolge: P(1. Druck)=20,0 %, E=3,97,
  4 Spieler: 33,9 / 28,3 / 20,7 / 17,0 %.

## 2. Spannungslayer (das eigentlich Schwierige)

Nervenkitzel entsteht nicht durch Zufall, sondern durch **Zeit und Ton**:
1. Spannungspegel 0..1 steigt mit jedem Druck und mit der Runde.
2. Herzschlag (zwei tiefe Sinus-Stöße) wird schneller und lauter.
3. Knarren/Quietschen der Feder, Tonhöhe steigt mit dem Pegel.
4. **Fakeouts**: mit ~12 % Chance zuckt das Maul beim Druck (sichtbar, hörbar) und
   schnappt *nicht* zu — Pegel springt stark hoch.
5. **Totenstille vor dem Biss**: 400–900 ms alle Töne aus (einzelner Atemzug),
   dann CHOMP (Rauschburst + Pitch-Drop) + Screenshake + Vibration.
6. Wenn nur noch ein Zahn übrig ist: garantiert scharf → höchste Spannung, Text
   „Der letzte Zahn ist immer scharf".
7. Alle Effekte abschaltbar (Ton, Vibration) und `prefers-reduced-motion` respektiert.

## 3. Statistik-Seite (Anknüpfung an die Analyse)

- Jede Runde wird lokal protokolliert (`localStorage`): Modus, n, Zahn, Position in
  der Druckreihenfolge, Spielerzahl.
- Anzeige: Häufigkeiten je Zahn und je Druckposition, Chi²-Test gegen Gleich-
  verteilung und gegen das Modell, Wilson-Konfidenzintervalle, Autokorrelation
  (Lags 1–6, Mustersuche), Vergleich „mein Krokodil" ↔ Modell.
- Export/Import als CSV im Format des Analyse-Werkzeugs
  (`runde;reihenfolge;verlierer_zahn`), damit Daten austauschbar sind.
- Ehrlichkeitsregel: Unter 100 Runden steht dort „zu wenig Daten" statt eines
  Signifikanz-Satzes.

## 4. Architektur (hexagonal, wie in den anderen Projekten)

```
src/core/domain/        Zähne, Runde, Zufallsmodell, Statistik — kein DOM, keine Uhr
src/core/ports/         RandomSource, LogStore, SoundPort
src/core/use-cases/     StartRound, PressTooth, EvaluateSession
src/contract/           Typen und Fehlerarten für die Bedienung
src/infrastructure/     WebAudio-Sound, localStorage-Log, crypto-Zufall, Test-Fakes
src/presentation/       DOM-Bedienung: Spielansicht, Einstellungen, Statistik
src/architecture.test.ts  Schichten-Wächter (darf nie rot sein)
```

Importregel: `domain` kennt nichts außer sich selbst; `use-cases` kennen `domain`
und `ports`; `infrastructure` und `presentation` kennen `contract`.

## 5. Abnahme (Gate + Nachweise)

- `pnpm typecheck` und `pnpm test:run` grün.
- `pnpm gate` = beides.
- Kern-Tests: Zufallsmodell (1–3 scharfe Zähne), Zugregeln, Verliererbestimmung,
  Wahrscheinlichkeiten gegen Python-Referenzwerte, Chi² gegen Tabellenwerte.
- Nachweis am laufenden Server: Prüfsonde (Node-Skript) drückt per DOM Zähne und
  belegt Schnappverhalten, Statistik-Schreiben und Sound-Aufrufe.
- Unabhängige Prüfung durch einen zweiten Prüfer mit fremder Methode.

## 6. Bewusst nicht in v1

Kein Server, kein Login, keine Cloud-Speicherung, kein Service Worker (Cache-
Fallen), keine externen Fonts/CDNs, keine Emojis (SVG-Icons).

## 7. Annahmen (still getroffen)

- Hot-Seat 1–4 Spieler, kein Netzwerk-Multiplayer.
- Beide Zufallsmodelle umschaltbar, Standard `original`.
- Optik: eigene SVG-Krokodil-Zeichnung, dunkler „Jahrmarkt bei Nacht"-Look.
