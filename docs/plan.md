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
  Herzschlags (`--beat-ms`), glüht ab 30 % und wird ab 60 % rot. *(Am selben Tag später auf 50 %
  gesenkt — siehe den Nachtrag „die Entscheidungen des Auftraggebers" unten.)*
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
   *→ Am selben Tag umentschieden: der Auftraggeber hat die Schwelle auf **50 %** gesetzt (Nachtrag
   „die Entscheidungen des Auftraggebers" unten). Der Wortlaut oben bleibt als damaliger Stand.*
8. **Der „geschlossene Blick" aller sechs?** Tatsache: über alle sechs gleich und nie beanstandet.
   **Entscheidung: nicht anfassen.**

## Nachtrag 11.10.2026 (abends): die Oberfläche wird kinderfreundlich

Auftrag: „Kannst du das User-Interface von Zahn Agent bisschen kinderfreundlicher machen? Es gibt viele
Elemente die ablenken. Die Auswahl der Modelle ist auch schwer ohne vielleicht ein Icon von dem
passenden Bild."

**Befund am laufenden Gegenstand** (Screenshot der Seite bei 390 × 844, Krokodil, frische Sitzung):
Das Spielfeld begann erst nach rund einer Bildschirmhöhe Einstellungen — das Tier war beim Öffnen
nicht zu sehen. Der Weg zur Statistik stand **zweimal** (Knopf in der Kopfzeile *und* schwebender
Knopf), und der schwebende Knopf lag über dem Maul. Techniksprache im Kinderblick: „1–3 scharf",
„Bumerang im Inneren", „Zufallsmodell", „Drücke", „Vibration (mobil)". Die Gebiss-Auswahl war eine
Textliste ohne Bild, mit drei Textebenen je Eintrag.

**Zwei Fehler, die dabei auffielen (gemessen, nicht vermutet):**

1. `--line` und `--surface-2` werden in `app.css` benutzt (`.picker`, `.stepper button`,
   `.creature-list button`), sind aber **nirgends definiert** — die Deklarationen sind damit ungültig,
   Rahmen und Flächen fielen still auf `currentColor` bzw. „durchsichtig" zurück.
2. Die Zugzeile wird von der Steuerung überschrieben und lautet dann **„Du ist dran"**
   (`playerName()` liefert „Du", der Satz klebt „ ist dran" daran). In der Vorlage stand das richtige
   „Du bist dran" — der erste `render()`-Lauf hat es ersetzt.

**Sparring (`grill-me`, gemeinsam mit dem Auftraggeber), vier Fragen, je mit Empfehlung:**

1. **Start = Spiel?** *Empfehlung: ja, alles andere hinter ein Zahnrad.* → **Angenommen.** Start zeigt
   Tier und Spielstand; Einstellungen, Ton, Zahnzahl, Regeln und der Weg zur Statistik liegen in einem
   Blatt hinter dem Zahnrad.
2. **Gebiss-Auswahl mit Bildern?** *Empfehlung: 2er-Raster mit Kopf-Bild + Name, Details erst nach
   Antippen.* → **Angenommen.** Die Bilder sind die **echte Zeichnung** des jeweiligen Tieres
   (`portrait()`), kein Extra-Asset — es bleibt bei „keine externen Bilder".
3. **Techniksprache?** *Empfehlung: Kind-Worte im Spiel, Erklärung ins Regeln-Blatt unter „Für Große".*
   → **Angenommen.** Aus „1–3 scharf" / „genau 1" werden „wie das Spielzeug" / „nur ein Zahn", die
   Bumerang- und Rechenwerte wandern in das eingeklappte Blatt „Für Große".
4. **Anzeigen unter dem Tier?** *Empfehlung: nur „Zähne übrig" groß, Balken und die zwei benannten
   Sätze klein darunter.* → **Angenommen.** „Runde" und „Drücke" werden zu einer ruhigen Nebenzeile
   (bleiben im DOM — die Bedienungssonde prüft sie weiter).

**Abgesagt / bewusst nicht getan:**

- **Keine Änderung an der Spielmechanik** (Kern, Dramaturgie, Ehrlichkeitsregeln, Protokoll) — das ist
  eine Oberflächenrunde. Die zwei benannten Anzeigewerte bleiben wörtlich, weil sie die Ehrlichkeitsregel
  tragen („x von n gedrückt" · „Bissgefahr n %").
- **Statistikseite unverändert.** Sie ist die Seite für Große; sie wird nur noch aus dem Zahnrad-Blatt
  verlinkt (statt aus der Kopfzeile) — der schwebende Knopf über dem Maul entfällt.
- **Kein neues Spiel-Element** (kein Ton-Schalter im Spielbild, keine Fortschrittsbelohnung): was nicht
  geprüft werden kann, wird nicht heimlich gebaut.

**Nachweis:** Bild-Kacheln ohne Störklassen (`.creature`/`.tooth`/`.creature__biter` sind verboten, sonst
greift die Steuerung die Kachel statt der Bühne ab); der Beschnitt braucht je Kachel eine **eigene**
`clipPath`-Kennung, weil doppelte Kennungen sonst das Spielfeld mit dem Kopfumriss der ersten Kachel
beschneiden. Beides wird in `creatureViews.test.ts` festgehalten.

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

## Nachtrag 11.10.2026 (spät): ein einziger Zahn

Wunsch des Auftraggebers: „Ich würde auch gerne erlaube nur einen Zahn zu konfigurieren. Mein Sohn
freut sich wenn nur ein Zahn da ist und beim Tap das maul schließt."

- **Das kleinste Gebiss ist ein Zahn** (`MIN_TEETH = 1`, vorher 4). Die untere Schranke hatte **keine**
  Begründung in Code und Doku — sie stand einfach da; die gemessene 44-px-Regel trägt nur die
  Obergrenze (12). Bei einem Zahn kappt die Auswahl der scharfen Zähne ihre Gebissgrenzen auf die
  Zahnzahl (1–3 des Krokodils werden zu 1), dieser eine Zahn ist also scharf und der erste Tipp schließt
  das Maul — in beiden Zufallsmodellen, ohne Sonderregel. Der Regler geht bis 1 herunter (Empfehlung
  angenommen: kein zusätzliches Bedienelement); bei 1 Zahn steht „nur ein Zahn — der erste Tipp schließt
  das Maul", und die Anzeige wird zur Einzahl („1 Zahn übrig").
- **Der Ausgang aus dem Einstellungsblatt war ein Fehler der Oberflächenrunde.** Das Blatt ließ sich
  **nur** mit Escape schließen — auf einem Tablet gibt es die Taste nicht; „Fertig" lag gemessen unter
  dem Blattrand (793 px Inhalt, 692 px sichtbar). Jetzt: ✕ im Blattkopf (sticky, 44 × 44 px, bleibt auch
  nach dem Scrollen stehen), „Fertig" am Fuß und ein Tipp **neben** das Blatt.
- **Doppelte Erklärung entfernt:** der Absatz unter „Wie gefährlich?" sagte dasselbe wie das Regeln-Blatt
  unter „Für Große". Das Regeln-Blatt bleibt die eine Erklärung.

## Nachtrag 11.10.2026 (spät, zweiter Teil): das App-Symbol

„Kannst du das Bild vom Krokodil als icon für die all nehmen?" — danach: „Kannst du eines mit
geschlossenen Mund als Icon nützen?"

- **Das alte Symbol war von Hand gezeichnet** (460 Bytes, Zahn-Umriss) und hatte mit der Zeichnung
  der App nichts zu tun. Jetzt ist es das **Kopfbild des Krokodils** aus der App — erzeugt aus
  `creaturePortrait()` und den vier Regeln des Zustands „geschnappt" (Maul zu), auf der dunklen
  Kachel.
- **Zwei Fassungen** (rund für Tab und Lesezeichen, randlos-maskierbar für Android) und **vier
  PNG-Größen** (180 fürs iPhone, 192 und 512 für Android, 512 maskierbar) zum Installieren.
- **Kein gemaltes Asset:** die SVGs entstehen in `src/icon.test.ts` aus der Zeichnung, und derselbe
  Test hält die ausgelieferten Dateien daran fest. Ändert sich das Krokodil, muss das Symbol neu
  erzeugt werden — das ist gewollt und steht in AGENTS.md.
- **Die Bühne bleibt unangetastet:** im Spiel ist das Maul offen und jeder Zahn bedienbar; das Symbol
  ist ein Standbild derselben Zeichnung, kein neuer Spielzustand.

## Nachtrag 11.10.2026 (spät, dritter Teil): was der fremde Prüfer gefunden hat

Die unabhängige Prüfung des Ein-Zahn-Umbaus hat **acht von acht** Behauptungen bestätigt — und
zwei Defekte gefunden, die meine eigenen Tests nicht sahen:

- **Die Statistik log bei einem Zahn** („Erwartet (Modell) 0,33" statt 1): das Modell ließ jedes
  `k` über der Zahnzahl wegfallen, statt es — wie die Zahn-Auswahl — auf die Zahnzahl zu kappen.
  Behoben mit Tests genau an der neuen Grenze (`probabilities.test.ts`, `statistics.test.ts`).
- **Das Gate war flakig** (1 von 7 Läufen rot, ohne fachlichen Fehler): der Herzschlag hing am
  globalen `window`; ein spät feuernder Zeitgeber nach dem Abbau der Testumgebung starb als
  unbehandelter `ReferenceError`. Behoben (`dispose()`, Fenster des Dokuments, `afterEach` in der
  Sonde), Mechanismus deterministisch nachgestellt.

Beide Funde bestätigen eine Regel: eine Änderung an einer **Grenze** — hier die kleinste
Zahnzahl — muss an dieser Grenze geprüft werden, nicht nur in der Mitte des Bereichs. Die Belege
stehen in `docs/e2e-nachweise.md` §5k.
