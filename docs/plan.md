# Plan: Zahn-Zufallsspiel als Webapp

> **Hinweis (10.10.2026).** Dies ist der ursprüngliche Plan der Erstfassung; er bleibt im
> Wortlaut stehen. Das Projekt heißt seit dem 10.10.2026 **Zahn Agent** (technisch seit dem
> 11.10.2026 `zahn_agent`; vorher `kroko-doc-web`, am 10.10. kurz `zahn-agent`) und liegt unter
> diesem Namen auf GitHub. Die Rezepte in dieser Datei sind Stand des Plans — gültig sind README,
> AGENTS.md und `docs/workflow.md`.

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
1. Spannungspegel 0..1 steigt mit jedem Druck und mit der Runde. **Umgesetzt am 11.10.2026
   anders als geplant:** nicht als aufaddierter Pegel, sondern als **Biss-Wahrscheinlichkeit des
   nächsten Drucks** aus `probabilities.ts` — der alte Pegel stand bei 10 Zähnen schon ab dem
   4. Druck auf 100 % und sagte damit nichts mehr (siehe `docs/domain-model.md`).
2. Herzschlag (zwei tiefe Sinus-Stöße) wird schneller und lauter.
3. Knarren/Quietschen der Feder, Tonhöhe steigt mit dem Pegel.
4. **Fakeouts**: mit ~12 % Chance zuckt das Maul beim Druck (sichtbar, hörbar) und
   schnappt *nicht* zu — Pegel springt stark hoch.
5. **Totenstille vor dem Biss**: 400–900 ms alle Töne aus (einzelner Atemzug). **Umgesetzt am
   11.10.2026 anders:** die Totenstille war ein Verräter (sie kam *nur* vor dem Biss). Jetzt gibt
   es die Pause bei jedem Druck, ihre Länge wird unabhängig vom Ausgang gezogen, und dazwischen
   liegt der feste 60-ms-Riss —
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

## Nachtrag 11.10.2026: die Anzeige (nach dem Sparring im `grill-me`-Stil)

Geplant war ein **Gefahrenbalken**: ein Wert, der mit der Spannung wächst. Umgesetzt ist etwas
anderes, weil der Balken sonst nicht zu deuten war:

- Die **Füllung** ist der **Fortschritt** (`gedrückte ÷ Zähne`), die **Farbe** die **Gefahr**
  (Bissgefahr des nächsten Drucks). Vorher trug die Füllung die Gefahr — der Balken sah damit aus
  wie eine Fortschrittsanzeige, war aber ein Gefahrenmesser; genau daran scheiterte ein neuer
  Spieler.
- Beide Werte sind **benannt** („6 von 10 gedrückt" · „Bissgefahr 34 %"), der Balken atmet im Takt des
  Herzschlags (`--beat-ms`), glüht ab 30 % und wird ab 60 % rot.
- Ein **Hinweis** erklärt ihn einmal je Sitzung (beim ersten Druck, über den `SessionMarkPort`).
- Erklärt wird er außerdem im Blatt „Regeln & Herkunft" und auf der Statistikseite als Kurve
  („Wie gefährlich ist der nächste Druck?").

**Offen und bewusst nicht gebaut:** der Balken ist lesbar, aber nicht **taktisch**. Im Modell ist
jeder Zahn gleich wahrscheinlich — es gibt keine Entscheidung, die er stützen könnte. Taktisch würde
er erst mit einer Mechanik (z. B. einmal pro Runde weitergeben); das wäre ein Eingriff in Kern,
Protokoll und Statistik und ist eine eigene Runde.

## Nachtrag 11.10.2026: Selbst-Sparring (`grill-me`) zu den offenen Punkten

Auftrag: „Kümmere dich um die offenen Punkte, nutze den `grill-me`-Skill und entscheide selbst." Die
Fragen des Sparrings, jede mit nachgeschlagener Tatsache und Entscheidung:

1. **Krokodil sattgelbgrün wie das Plastik?** Tatsache: die fünf anderen Gebisse sind pastell (Galerie
   `docs/bilder/gebisse.png`). Gegengerendert und angesehen: die satte Fassung fällt als Fremdkörper
   aus der Familie. **Entscheidung: nein** — sie widerspricht dem Auftrag „ohne den aktuellen Stil zu
   verändern". Die Variante liegt als Bild im Bericht, nicht im Repo.
2. **Vierte Schnauzenfalte?** Tatsache: die freie Zone über dem Maul ist rund 60 px hoch (Ring bei
   y 105–123), die Nasenlöcher sitzen bei y 54 — eine vierte Falte müsste eines von beiden berühren.
   Das Original hat vier Falten auf einer *höheren* Schnauze, die unsere Geometrie (Ring als
   Spielträger) nicht hat. **Entscheidung: bei drei Falten bleiben.**
3. **Höhere Augen?** Tatsache: +10 px sind 2 % der Bildhöhe — kaum sichtbar, aber eine Änderung an
   einer gerade abgenommenen Zeichnung. **Entscheidung: nicht anfassen.**
4. **Hai-Kiemen größer?** Tatsache: abgenommen („Das zweite Bild ist besser"). **Entscheidung: bleiben.**
5. **„Weitergeben" als Mechanik?** Tatsache: das Protokoll hat zehn Spalten und wird per Spaltenname
   gelesen (Erweiterung wäre technisch verträglich), aber der Kern leitet die Zugreihenfolge aus
   `pressOrder` ab (`round.ts`) — ein Zug ohne Druck verschiebt sie fälschlich. Und: die Wirkung
   („wird das Spiel besser?") ist nur mit zwei oder mehr Spielern am echten Tisch beurteilbar, meist
   wird allein gespielt. **Entscheidung: abgesagt und dokumentiert** (siehe zehnte Falle in AGENTS.md).
6. **Was macht den Balken stattdessen handelbar?** Kandidaten waren ein Nerven-Zähler und der Mut.
   **Entscheidung: der Mut** — die höchste überstandene Bissgefahr, exakt aus der Anzeigekurve
   abgeleitet (`survivedDanger`), funktioniert im Einzelspiel, braucht keinen Protokolleingriff und
   erscheint als Satz im Ergebnis.
7. **Rotglut bei 60 % lassen?** Tatsache: kein Gebiss erreicht 60 % vor dem letzten Zahn (Krokodil
   55,0 % beim neunten) — rot fällt also immer mit dem Biss zusammen, ein *überstandener* roter Druck
   ist unmöglich. Bei 50 % wäre der Mut bis ins Rote möglich. **Entscheidung: bleibt bei 60 %** —
   die Zahl ist abgesprochen; die Option ist hier mit neuer Begründung notiert.
8. **Der „geschlossene Blick" aller sechs?** Tatsache: über alle sechs gleich und nie beanstandet.
   **Entscheidung: nicht anfassen.**

## Nachtrag 11.10.2026 (später): die Entscheidungen des Auftraggebers

„Das neue Grün gefällt mir. Den Rest kannst du einfach deine empfohlenen Entscheidungen nehmen."

- **Sattes Spielzeug-Grün angenommen.** Das Krokodil bekommt `#8fce33` mit den Abtönungen `#a8dd4f`
  und `#5f8f1e`; das Schnauzenband bleibt gleich der Körperfarbe. Damit fällt es **bewusst** aus der
  Reihe der fünf weichen Lebewesen — die Gegenprobe hatte genau das gezeigt. Ob sie nachziehen, ist
  eine eigene Runde: ihre Farben wurden in ihren eigenen Runden abgenommen.
- **Rotglut auf 50 %.** Meine Empfehlung: bei 60 % erreichte *kein* Gebiss die Schwelle vor dem
  letzten Druck — rot war damit immer ein Biss, ein *überstandener* roter Druck unmöglich. Bei 50 %
  ist der vorletzte Krokodil-Druck (55,0 %) rot **und** überstehbar, der Mut kann also bis ins Rote
  reichen. Beide Stolperdrähte sind gefallen und bewusst neu gefasst („Der Stolperdraht hat getan,
  wofür er da ist").
- **Mut auf die Statistikseite** (`bravestRound`, Kachel „Mutigste Runde" plus Satz mit Rundennummer
  und Gebiss) — damit wird der Mut über Runden hinweg eine Jagd und nicht nur ein Satz am Ende.
- **„Weitergeben" bleibt abgesagt** (Bedingung unverändert: echter Tisch, zwei oder mehr Spieler).
- **Geschlossener Blick, vierte Falte, höhere Augen, Kiemengröße** bleiben wie in der Runde davor
  entschieden.
