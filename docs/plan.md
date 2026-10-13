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
2. Herzschlag (zwei tiefe Sinus-Stöße) wird schneller und lauter. **Entfernt am 12.10.2026** auf
   Wunsch des Auftraggebers (Nachtrag unten).
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

## Nachtrag 11.10.2026 (abends): Trefferfläche auf der schmalsten Bühne

Antwort des Nutzers auf die Einschränkung aus §5k („bei 320 px nur 42,9 px"): „Ja ich nehme deine
Empfehlung an." Entschieden wurde im Sparring — zwei Fragen, beide Empfehlungen angenommen:

- **Statisch rechnen statt zur Laufzeit messen.** Der Deckel für den Treffer-Radius stand als feste
  `48` im Code und war nur gegen 358 px Bühnenbreite geprüft. Jetzt wird er aus der Vorgabe und der
  **schmalsten** Bühne gerechnet (`MIN_STAGE_WIDTH_PX = 285`, gemessen: 320 px Blick → 286 px Bühne,
  gezeichneter Maßstab 285,8 px). Kein Mess-Code, keine neue Naht, Geometrie bleibt gerechnet.
  Nebenbefund aus der Messung: die erste Fassung mit 288 px ergab im Browser 43,70 px — die Bühne
  ist höhenbegrenzt, deshalb zwei Pixel Reserve.
- **Die Grenze nennen statt sie zu verstecken.** Bei 11 und 12 Zähnen ist der halbe Zahnabstand
  kleiner als 44 px; dort bleibt er die Grenze (Maus bei 12 Zähnen 37,1 px), weil Überdeckung das
  schlechtere Tauschgeschäft wäre. Der Test hält die Ausnahmen namentlich fest.

**Zweiter Fund, den dieselbe Messung aufdeckte (vorbestehend):** bei Zahn 2 und 10 lag das untere
Zahnfleischband über der Trefferfläche — ein Tipp in deren Mitte tat nichts. Behoben über
`pointer-events: none` für alle dekorativen Ebenen; nachgemessen registrieren die Tipps jetzt, und
`elementFromPoint` liefert bei allen Zähnen den eigenen Zahn. Belege: `docs/e2e-nachweise.md` §5l,
Messskripte `scripts/pruefen-trefferflaeche.py` und `scripts/pruefen-zeitgeber.cjs`.

## Nachtrag 11.10.2026 (nachts): zwei neue Lebewesen — Panda und Löwe

Auftrag: „Kannst du noch zu den models einen Panda und männlichen Löwen hinzufügen aber bleibe im
selben Stil." (Gemeint sind die **Modelle** der Tier-Auswahl — die Zeichnungen der Gebisse.)

**Sparring (`grill-me`, gemeinsam mit dem Auftraggeber):** eine Frage, die das Spielgefühl ändert.
*Zahnzahl und gleichzeitig scharfe Zähne?* — Empfehlung angenommen:
**Panda 12 Zähne / 1–2 scharf · Löwe 12 Zähne / 1–2 scharf** (wie Wolf und Hai). Die beiden
unterscheiden sich also **nicht** durch Zahlen, sondern durch Zeichnung und Zahnprofil — genau wie
Wolf und Hai sich auch nur so unterscheiden.

**Fakten (nachgeschlagen, nicht geschätzt):**

- **Großer Panda: 42 Zähne.** „Wie die meisten Bären haben sie 42 Zähne, die hinteren
  Vorbackenzähne und die Backenzähne sind größer und breiter als die der anderen Vertreter ihrer
  Familie" (de.wikipedia, *Großer Panda*). Das Profil zeigt deshalb **breite Mahlzähne**.
- **Löwe: 30 Zähne**, Zahnformel I 3/3 · C 1/1 · P 3/2 · M 1/1 (lionalert.org, *Lion Physiology*;
  University of the Free State, *Predator Species: Lion*). Weniger Zähne als der Wolf (42), dafür
  zwei lange Fangzähne.

**Entscheidungen (mit Grund):**

1. **Hinten anhängen** — Katalogreihenfolge ist Kachelreihenfolge; die sechs abgenommenen
   Zeichnungen samt ihrer Position bleiben unangetastet (Krokodil, Wolf, Mensch, Hai, Maus,
   Vampir, **Panda**, **Löwe**).
2. **Panda: Mahlzähne statt Fangzähne.** Zwei kräftige flache Zähne an der Maulmitte, breite
   quadratische Backenzähne außen, dazwischen zwei kurze Kegel — ein Bär behält seine Eckzähne,
   aber ein Bambusfresser zeigt keine Reißzähne. Erkennungsmerkmal ist die **Maske**: weiße
   Kopffläche, schwarze Ohren und Augenflecken, schwarze Nase.
3. **Löwe: die Mähne trägt die Silhouette.** Kopf und Mähne sind **ein** Pfad — die Mähne liegt
   außerhalb des Zahnrings (das ist die Fläche, die das Zahnfleischband beim Zuschnappen deckt) und
   **innerhalb** des Beschnitts, sonst hinge sie beim Zuschnappen neben dem Kopf. Bernsteinfarbenes
   Fell, braune Mähne, zwei lange Fangzähne und vier breite Backenzähne, runde Ohren statt Wolfsspitzen.
4. **Nichts an Kern, Dramaturgie und Protokoll.** Zwei Katalogeinträge und zwei Kunstwerk-Module —
   die Kacheln der Auswahl entstehen aus `creaturePortrait()` und sind damit automatisch dabei.
5. **Das README-Bild wird neu erzeugt** (bisher sechs Gebisse, jetzt acht) und bekommt ein Skript
   im Baum (`scripts/galerie.py`): es war beim letzten Mal von Hand in einem Arbeitsverzeichnis
   gebaut worden — ein Bild, das niemand reproduzieren kann, ist kein Nachweis.

**Ergebnis (11.10.2026, nachts): erledigt und am lebenden Gegenstand belegt.** Drei Fassungen
gerendert und angesehen; gefunden und behoben: die Löwen-Brauen lagen **auf** den Ohren (entfernt),
die Wangen lagen auf dem Zahnfleisch und in der zweiten Fassung **außerhalb** des Kopfumrisses (der
Löwe bekommt keine Wangen — dort ist keine Fellfläche frei, Grund als Kommentar im Modul; der Panda
bekommt sie ins Gesicht, wo das Maul sie deckt), und die Panda-Linse ließ den Augenfleck wie eine
**Brille** wirken (kleiner, ohne Linsenrand). Gemessen im erzeugten SVG: Panda Schließweg 220,0 ·
Schnauzenweg 121,0 · Trefferfläche 41,01 px auf 285 px Bühne; Löwe 222,0 · 122,1 · 41,01 px. Der
Panda-Ring weitet dafür von `rx 195` auf `200` — bei 11 Zähnen fiel die Trefferfläche sonst unter die
44-px-Vorgabe. Gate **232 Tests in 19 Dateien** (vorher 230). Veröffentlicht (Commits `71d1524`,
`51a9a95`, Läufe `38162562843` und `38162818232` grün) und auf der veröffentlichten Seite gemessen:
acht Kacheln in Katalogreihenfolge, acht sichtbare Kopfbilder mit acht eigenen Beschnitten
(`scripts/pruefen-tiere.py`).

## Nachtrag 11.10.2026 (spät): Panther und Säbelzahntiger

Auftrag: „Was könnte man noch für Models hinzufügen? Ich würde gern noch einen Panther noch haben
wollen. Hast du noch andere coole Ideen?"

**Sparring mit dem Auftraggeber** (drei Fragen in einem Aufruf, jede mit Empfehlung):

1. *Welcher Panther?* → **Schwarzer Panther** (melanistische Form des Leoparden: schwarzes Fell,
   gelbe Augen) — nicht der gefleckte Leopard.
2. *Wie viele Zähne und wie viele Fangzähne?* → **12 Zähne, 1–2 scharf, vier Fangzähne** (je einer
   oben und unten, links und rechts). Das ist der Unterschied zum Löwen, der zwei hat.
3. *Was zusätzlich?* → **Säbelzahntiger**. Nicht gewählt (notiert, nicht gebaut): Wildschwein,
   Biber, Faultier. Ideen mit noch **unbelegter** Zahl: Elefant und Piranha.

**Fakten (nachgeschlagen, nicht geschätzt):**

- **Panther/Leopard: 30 Zähne**, Zahnformel I 3/3 · C 1/1 · P 3/2 · M 1/1. Belegt über den
  Arabischen Leoparden (Feldführer *Mammals of AlUla*: „the dental formula of the Arabian Leopard is
  'I 3/3, C 1/1, P 3/2, M 1/1'") und *Mammalian Species* zum Löwen („Dental formula is
  i 3/3, c 1/1, p 3/2, m 1/1, total 30"). Der **schwarze Panther** ist die melanistische Form
  desselben Tieres (de.wikipedia, *Leopard*: „Der Leopard (Panthera pardus), auch Panther").
- **Raubkatzen haben vier dolchartige Eckzähne** — „Alle Raubtiere besitzen vier dolchartige
  Eckzähne, die als Fangzähne zum Ergreifen und Töten der Beute [dienen]". Deshalb zeichnet der
  Panther **vier** Fangzähne, nicht zwei.
- **Säbelzahntiger (Smilodon): 26–28 Zähne**, die Säbel ragten „bis zu 20 cm aus dem Kiefer"
  (de.wikipedia, *Smilodon*); die Art starb vor rund 12.000 Jahren aus.

**Entscheidungen (mit Grund):**

1. **Hinten anhängen** — die acht abgenommenen Zeichnungen samt ihrer Kachelposition bleiben
   unangetastet (… Vampir, Panda, Löwe, **Panther**, **Säbelzahntiger**).
2. **Der Panther unterscheidet sich durch die Zahl der Fangzähne**, nicht durch die Spielwerte
   (12 Zähne, 1–2 scharf wie der Löwe). Vier Kegel: zwei im Oberkiefer (links, rechts), zwei im
   Unterkiefer — anatomisch richtig und im Bild sofort zu sehen.
3. **Der Säbelzahntiger bekommt zwei sehr lange Zähne**, aber innerhalb der Kopfsilhouette — was
   darüber hinausragt, würde der Beschnitt beim Zuschnappen abschneiden.
4. **Kein Kern, keine Dramaturgie, kein Protokoll** — zwei Katalogeinträge und zwei Zeichenmodule.

**Ergebnis (11.10.2026, spät):**

- Zwei Katalogeinträge (`panther`, `sabertooth`), zwei Zeichnungsmodule, eine Zeile je Modul in
  `ARTWORKS`. Gate **234 Tests in 19 Dateien** (vorher 232).
- **Im erzeugten SVG gemessen** (nicht geschätzt): Panther 12 Zähne (4 Kegel · 2 quadratische ·
  6 flache) · Schließweg 220,0 · Schnauzenweg 121,0 · Trefferradius 46,0 (exakt 41,01 px auf 285 px
  Bühne, im Markup gerundet 40,97 px). Säbelzahntiger 12 Zähne (4 Kegel · 2 quadratische ·
  6 flache) · 222,0 · 122,1 · 46,0. Beide sitzen auf dem Ring des Löwen (`rx 200`, `ry 150`).
- **Ein Fehler in drei alten Zeichnungen gefunden und behoben:** Wolf, Löwe und Panda spiegelten
  über `count - 1 - i` statt über `count - i`. In diesem Ring sitzt Zahn 0 aber **genau in der Mitte
  unten** und Zahn `count/2` in der Mitte oben — beide sind ihre **eigenen** Zwillinge, keine
  Nachbarn. Folge: ein Fangzahn saß auf Index 2, sein Gegenüber auf 9 (also eine Stufe tiefer), und
  die breite Reihe am Unterkiefer war um einen Platz verschoben (4 Zähne an 0, 1, 10, 11).
  Jetzt: **3 breite Schneidezähne** in der Mitte (0, 1, `count - 1`), die beiden langen Fangzähne
  gespiegelt daneben (2, `count - 2`). Der Wortlaut in den Katalog-Notizen und im README ist an die
  Zeichnung angepasst („drei breite Schneidezähne" statt „vier breite Backenzähne") — im Markup
  gezählt: Wolf und Löwe 2 Kegel · 3 quadratische · 7 flache.
- **Galerie auf zehn Kacheln:** `docs/bilder/gebisse.png`, 1970 × 566, 5 Spalten mal 2 Zeilen. Die
  Spaltenzahl rechnet `scripts/galerie.py` jetzt aus der Anzahl der Lebewesen (kleinste Teilerzahl
  ab der Wurzel), damit keine leere Kachel im Bild steht.
- **Angesehen, nicht angenommen:** Panther in drei Fassungen (graue Fellringe wieder entfernt, die
  Schnauze als sichtbare Fläche, sonst schwebt die Nase), Säbelzahntiger (Säbel bleiben im Umriss,
  beim Zuschnappen hängt nichts daneben), Löwe und Wolf (Maul jetzt spiegelbildlich), Galerie
  (zehn Kacheln, jede vollständig) und beide neuen im Zustand „geschnappt".
- **Nachbesserung auf Zuruf (Nutzer, 11.10.2026): „Der Panther sieht eher wie eine schwarze
  Maus."** Bestätigt und behoben. Ursache 1: er trug die **runden** Ohren des Pandas — Katzenohren
  sind Dreiecke. Ursache 2, erst beim Nachmessen gefunden: die erste Dreiecksfassung spiegelte den
  rechten Ohrpfad einfach, und weil die Silhouette ein `clipPath` mit **Nonzero**-Regel ist, hob die
  umgekehrte Laufrichtung die Füllung im Überlappungsbereich von Kopf und Ohr auf — dem Panther
  fehlte das **rechte Auge** (im PNG gemessen: (470,166) = Fellfarbe statt Weiß; links korrekt).
  Jetzt laufen beide Ohren gleichsinnig (das rechte rückwärts notiert), die Ohren sind kleiner, und
  dazu kamen Schnurrhaare im Fellstreifen neben dem Maul. Beide Fassungen gerastert und angesehen,
  die Falle steht in `AGENTS.md`.
- **Der Hut — zuerst falsch verortet (Korrektur des Nutzers, 11.10.2026).** Ich hatte „Genau wie der
  Mensch … könnte man dem einen Hut anziehen" auf den **Panther** bezogen und ihm einen Filzhut
  aufgesetzt. Der Nutzer stellte klar: **„Der Hut sollte für den Menschen sein und nicht für den
  Panther."** Umgesetzt: der Hut sitzt jetzt auf dem **Menschen** (weicher, **rostroter** Filzhut mit
  Krempe, Krone, Band und Glanzkante, oberhalb der Brauen), der Panther ist wieder schmucklos —
  im gerasterten Bild nachgemessen, nicht behauptet. Rostrot, weil Gold die Mähne des Löwen trägt,
  Blau der Hai, Violett der Vampir, Grün das Krokodil; Braun wäre am Menschen nicht von seinen
  Brauen (`#c79b73`) zu unterscheiden. Er liegt in der **Körperebene** (`body`) und nicht im
  Gesichtsbereich: der wird auf die Silhouette beschnitten, und die Krone ragt darüber hinaus — dort
  wäre sie abgeschnitten. Beide Zustände beider Zeichnungen gerastert und angesehen (Pantherhut
  restlos entfernt, Menschenkrone vollständig), Galerie neu gebaut, Gate grün. **Lehre:** bei „dem
  einen" in einer Nachricht mit zwei genannten Wesen nachfragen, statt zu raten.
- **Die Schläferlocken (Wunsch des Nutzers, 11.10.2026).** „kann man ggf noch ein weiteres
  Accessoire was das Modell noch menschlicher wirken lässt" — der Kopf war kahl, nur die Brauen
  deuteten Haare an. Zwei Locken unter der Krempe, in der Farbe der Brauen (`#c79b73`). Die erste
  Fassung lag in der **Körperebene** und war im Bild **unsichtbar**: die Schnauzenfläche des Mundes
  (`upperShell`, dieselbe Hautfarbe) wird in der Mundebene darüber gemalt — mit einer Farbkarte
  gemessen. Jetzt im **Gesichtsbereich**, die Oberkante auf der Unterkante der Krempe, und die
  **Nase in der Mitte frei** gelassen (eine durchgehende Franse hatte sie zugedeckt — im Bild
  gesehen, mit Pixelproben belegt). Die Regeln stehen in `AGENTS.md`; im Nachweis zusätzlich die
  richtige Abbildung des Rasters (viewBox `0 0 640 460`, nicht 640 × 640).
- **Unabhängige Fremdprüfung (Stand `16a54ad`, Audit `sa-0-2a78f337`): acht Punkte bestätigt,
  drei Doku-Fehler gefunden.** Bestätigt unter anderem: 10 Kennungen ohne Waise, 234 Tests in
  19 Dateien, die Galerie **byte-identisch** zum Nachbau, und die **Wahrscheinlichkeiten mit eigener
  Kombinatorik nachgerechnet**. Gefunden: „232 Tests" stand noch in der Startanleitung (alter Wert);
  das Bauzeit-Fenster „2,1–2,5 s" war zu eng (gemessen 2,68 · 2,86 · 2,88 · 2,98 s → jetzt 2,1–3,0 s);
  die Herkunft der Trefferflächen-Zahl war falsch (`getBoundingClientRect` an der gedrehten Box
  liefert das Achsen-Rechteck 52,48 px, die 44,15 px sind gerechnet). Alle drei behoben; die Regeln
  stehen in `AGENTS.md` („Doku-Prüfung nie mit `>/dev/null`", „`getBoundingClientRect` … kein Maß
  für eine Fläche"), die Prüfung selbst in `docs/e2e-nachweise.md` §5p.
- **Der Vampir bekommt Accessoires (Wunsch des Nutzers, 11.10.2026 spät).** „Der Vampir braucht auch
  noch Accessoires, kannst du das Model auch nochmal ueberarbeiten?" — **Stehkragen** (zwei Flügel in
  der Körperebene, die den Kopf rahmen; in der Gesichtsebene würde der Beschnitt sie abschneiden)
  und **Monokel** am linken Auge (Gesichtsebene, über der Mundebene). Dazu die **Ohren**: sie standen
  im Gesichtsbereich, und gemessen im gerasterten Bild fehlten ihre Spitzen — der Umriss lag bei
  y 116 bei x 110, die Spitze bei x 52, also **58 px abgeschnitten**. Jetzt in der Körperebene, mit
  breiter Basis (die erste Nadelfassung sah wie ein Horn aus). Der Kragen brauchte drei Anläufe
  (Flosse → zu weit ab → Band mit rund 35 px Abstand zum Umriss, Breiten je Höhe gemessen).
  Gegenprobe: das Unterschieds-Rechteck der Rasterungen ist x 24…616, y 111…396 — nur Kragen, Ohren,
  Monokel; die Maulmitte unten blieb Pixel für Pixel gleich. Nebenbei die Maßstabsangabe korrigiert:
  der Rasterer skaliert **genau 2 ohne Versatz**, meine frühere Näherung war um die Kontur verschoben.
- **Der Säbelzahntiger wird überarbeitet (Wunsch des Nutzers, 11.10.2026 nachts).** „Kannst du den
  Geparden auch nochmal überarbeiteten? Die Ohren ähneln der Maus Ohren. Vielleicht kannst du auch
  noch andere Besonderheiten hinzufügen." **Einen Geparden gibt es im Spiel nicht** — nachgefragt
  statt geraten, gemeint war der **Säbelzahntiger** (sandfarben, und seine Ohren trugen tatsächlich
  die Mäuse-Rezeptur: Kreis r 44 mit rosa Innenkreis r 20). Neu: **kleinere ovale Ohren** (30 × 28)
  mit **dunkler** Innenfläche `#b78243`, **vierzehn Fellflecken** als Rosetten und eine **Katzennase**
  als abgerundetes Dreieck. Zwei verworfene Anläufe, beide an der Messung erkannt: ein Fleck **auf
  dem Ohr** wird von der Ohrenfläche zugedeckt, Flecken auf der **Stirn** liefen mit r 12/r 8 über die
  Schnauzenkante (Ring nur 40 bzw. 51 von 72 Grad sichtbar) — jetzt r 6 mit 72/72. Gate 234/19 grün,
  Galerie neu, beide Zustände angesehen. Nachweis §5r, Regel in `AGENTS.md`.
- **Das Zeichen im Kopfbereich wird das App-Symbol (11./12.10.2026).** „Das logo neben Zahn Agent
  ganz oben im auf der Seite ist noch so ein altes Krokodil, kannst du das austauschen mir dem Icon
  was du gemacht hast." Der Kopfbereich beider Seiten trug ein eigenes, von Hand gezeichnetes
  Krokodil (dunkelgrün `#2f6b4f`/`#1c4531`, `viewBox 0 0 64 64`) ohne Bezug zur Zeichnung. Statt es
  nachzumalen entsteht jetzt `public/logo.svg` in `src/icon.test.ts` aus **derselben** Quelle wie
  `favicon.svg` und wird von beiden Seiten als `<img>` gezeigt (34 × 34 px, Basis-Pfad).
  Gemessen im gebauten `dist/` mit echtem Chromium: 34 × 34 px bei 390 **und** 1180 px Breite,
  Bild geladen, ausgelieferte Datei byte-identisch zur Datei im Baum; angesehen. Dazu eine
  Prüfung mehr in der Sonde (Gate **235 Tests in 19 Dateien**). Nachweis §5s, Regel in `AGENTS.md`.
- **Der Balken verstummt, wenn das Maul zu ist (12.10.2026).** Meldung: „Die progressbar und der Text
  sind scheinbar nicht mehr synchronisiert" / „Bissgefahr 100% obwohl dee Mund zu ist". Zwei Ursachen:
  (1) `render()` rechnet die Gefahr nur bei offener Runde neu, beim Zuschnappen blieb der Wert 1
  stehen und die Zeile behauptete eine Gefahr für einen Druck, den es nicht mehr gibt; (2)
  `is-tense`/`is-danger` hingen an `#stage`, der Balken liegt aber **außerhalb** der Bühne — keine der
  vier Farbregeln traf ihn, und `--beat-ms` fiel auf den 0,9-s-Ersatzwert zurück (die Doku versprach
  seit dem 11.10.2026 „wird ab 50 % rot" und „atmet im Takt des Herzschlags", beides war unwahr).
  Jetzt: Kasten `#hud-panel` um Balken/Zeile/Hinweis, Klassen und `--beat-ms` dort; bei
  geschlossenem Maul „Runde beendet", Füllung bleibt Fortschritt und wird farblos (`is-snapped`).
  Neue Sonde `scripts/pruefen-anzeige.py` (drei Lagen, **berechnete** Stile im echten Chromium;
  gegen die veröffentlichte Seite zuerst **rot mit 5 Funden**), drei neue Unit-Tests, die die
  **Struktur** prüfen. Gemessen nach dem Fix: 100 % → rot + 0,38 s Takt, 21 % → nicht rot
  (Gegenprobe), Maul zu → farblos + „Runde beendet". Gate **238 Tests in 19 Dateien**.
  Nachweis §5t, Regeln in `AGENTS.md` und `docs/domain-model.md`.
- **Tier-Auswahl: ein Tipp wählt und schließt (12.10.2026).** Wunsch: „Man muss sonst immer erst
  nochmal bestätigen wenn man ein anderes Modell ausgewählt hat. Das nervt." Das Blatt „Welches
  Tier?" war als Vorschau gebaut (`pending` + „Damit spielen"), damit die Kurzinfo lesbar bleibt —
  vom Auftraggeber überstimmt. Ein Tipp übernimmt die Wahl jetzt sofort und schließt **nur** das
  Auswahlblatt; das Einstellungsblatt bleibt offen, die Kurzinfo beschreibt das gewählte Tier und
  steht beim nächsten Öffnen wieder da. „Damit spielen" und „Abbrechen" sind entfallen (im Bau steht
  nur `>Fertig<`); `src/auswahl.test.ts` hält das Markup fest, die erweiterte Tier-Sonde das
  Verhalten (Blatt nach dem Tipp zu, Name/Marke im Einstellungsblatt neu, Kurzinfo bleibt).
  Zwei Fallen: eine `.test.ts` **in** `src/pages/` bricht `pnpm build` (Astro baut sie als Seite,
  „Vitest failed to access its internal state"), und die Anzeige-Sonde baute in Lage 2 auf Glück
  (ein Druck bei zehn Zähnen kann zuschnappen) — sie würfelt jetzt mit frischer Seite, bis die Runde
  offen bleibt. Gate **243 Tests in 20 Dateien**. Nachweis §5u, Regeln in `AGENTS.md`, `docs/testing.md`.

## Nachtrag 12.10.2026 (gebaut): die häufigen Griffe kommen auf die Spielseite

**Anlass.** Auftrag: die Bedienung für Tablet und Handy und für Kinder von 6 bis 12 prüfen; Tier
und Zahnzahl sollen einfach zu wechseln sein und eine neue Runde schnell startbar, „ohne durch
modals zu scrollen".

**Ist-Stand, gemessen** (Chromium mit Touch, acht Größen von 320 × 568 bis 1180 × 820, Stand
`aeffba8`):

| Handgriff | Tipps | Scrollen |
|---|---|---|
| Tier wechseln | 4 (Zahnrad → „Welches Tier?" → Kachel → Blatt schließen) | auf jedem Handy für 4–6 der 10 Tiere |
| Zahnzahl ändern | 3 | nein |
| Neue Runde mitten im Spiel | 3 | bei 320 und 360 px Breite ja |
| Neue Runde nach dem Biss | 1 | nein |

- Die Spielseite selbst scrollt auf keiner der acht Größen.
- Einstellungsblatt: Inhalt 821 px, sichtbar auf den Handys 466–750 px; „Fertig" liegt auf allen
  vier Handygrößen außerhalb. Auf Tablets passt es (525–587 px).
- Tier-Auswahl: scrollt auf sieben von acht Größen (Inhalt 953–1118 px), nur 820 × 1180 zeigt alles.
- Leerer Platz: 390 × 844 unter dem Inhalt 285 px; 1180 × 820 links und rechts je 296 px (Bühne bei
  588 px gedeckelt durch `.app { max-width: 620px }`); 820 × 1180 unten 478 px.
- Griffe unter 44 px: Spielerzahl 34 × 40, Modus und „Standard" 40 hoch, „Mehr über dieses Tier" 30
  hoch. Schrift der Balkenzeile und von „Runde 1 / schon 0 getippt": 12,8 px.

**Entscheidungen des Auftraggebers (Sparring, eine Frage nach der anderen):**

1. Tier und Zahnzahl liegen offen auf der Spielseite und starten die Runde **sofort** neu, ohne
   Nachfrage — eine Runde dauert im Schnitt rund vier Drücke, und eine Nachfrage wäre wieder ein Modal.
2. Auf dem Handy öffnet der Tier-Griff eine **kompakte Auswahl** mit allen zehn Köpfen ohne Scrollen
   (2 Tipps). Abgesagt: ein Streifen zum Wischen (zeigt nur etwa fünf Köpfe, kostet rund 70 px Höhe)
   und Pfeile an der Bühne (bis zu fünf Tipps, jeder ein Neustart, keine Übersicht).
3. Die Spielerzahl bleibt hinter dem Zahnrad — sie wechselt je Sitzung, nicht je Runde.
4. Es gibt nur noch **1 oder 2** Spieler zur Wahl.
5. Der Entwurf unten samt zweier Annahmen (Kurzinfo, „Standard") ist freigegeben.

**Entwurf.**

- **Leiste** am unteren Bildschirmrand, drei Griffe, je mindestens 56 px hoch:
  Tier (Kopf und Name) · Zähne (− Zahl +, darunter „Zähne"; bei 1 und 12 ist der Knopf abgeblendet) ·
  Neue Runde (immer da, nach dem Biss hervorgehoben; `#restart-round` entfällt).
- **Handy (unter 640 px):** Bühne, Spielstand, unten die Leiste. Das Kästchen „Runde / schon
  getippt" entfällt (die Zahl steht als „x von n gedrückt" am Balken), „Du bist dran" rückt neben
  „Zähne übrig" — das spart 40 px; gerechnet endet der Inhalt bei 320 × 568 dann bei 541 px.
- **Tablet hochkant:** wie das Handy, Bühne breiter als 588 px, die zehn Köpfe stehen dauerhaft
  offen (5 × 2), Tierwechsel 1 Tipp.
- **Tablet quer:** zwei Spalten — links Bühne (bei 1180 × 820 rund 760 px) mit Spielstand, rechts
  Köpfe dauerhaft offen, darunter Zähne und Neue Runde.
- **Tier-Auswahl (nur Handy):** 4 Spalten, drei Reihen; ein Tipp wählt und schließt.
- **Zahnrad:** Spielerzahl (zwei große Knöpfe), „Wie gefährlich?", Ton, Wackeln, Regeln, Statistik,
  „Fertig". Tier, Zähne und Neue Runde verschwinden daraus; Ton/Wackeln und Regeln/Statistik stehen
  je nebeneinander, damit das Blatt auch bei 320 × 568 nicht scrollt.
- **Ergebnis-Blatt:** unverändert. **Regeln-Blatt:** darf als einziges scrollen (Lesetext).
- **Größen:** jeder Griff mindestens 48 px hoch; Balkenzeile etwa 15 px.
- **Kurzinfo zum Tier** (Zähne/gefährliche Zähne, „Mehr über dieses Tier") zieht ins Regeln-Blatt als
  Abschnitt zum gewählten Tier. **„Standard"** bei den Zähnen entfällt — ein Tierwechsel stellt das
  Gebiss des Tiers ohnehin ein.
- **Spielerzahl:** nur die Bedienung wird begrenzt; `MAX_PLAYERS = 4` im Kern bleibt, damit schon
  protokollierte und importierte Runden mit 3 oder 4 Spielern gültig bleiben. Eine gespeicherte
  Einstellung 3 oder 4 fällt beim Laden auf 2. Regeltext und README werden auf zwei Spieler
  umgeschrieben.

**Bau und Nachweis.**

- Die Verdrahtung der Leiste zieht aus dem Seitenskript in ein Modul unter `presentation/game/` mit
  Test (jsdom lädt Seitenskripte nicht). Kacheln tragen weiter weder `.creature` noch `.tooth`, jede
  Verwendung von `portrait(suffix)` ihre eigene Kennung.
- Neue Sonde über die acht Größen: die Spielseite scrollt nicht; kein Blatt außer den Regeln
  scrollt; kein Griff unter 48 px; Tippzahlen Tier 2 (Handy) bzw. 1 (Tablet), Zähne 1, Neue Runde 1.
- `scripts/pruefen-blattbreite.py` und `scripts/pruefen-blaetter.py` erwarten das alte
  Einstellungsblatt und werden angepasst; `src/auswahl.test.ts` ebenso.
- README, `docs/testing.md`, `docs/e2e-nachweise.md`, `AGENTS.md` ziehen nach. Gate: `pnpm typecheck`
  und `pnpm test:run`, dazu die Sonden mit angesehener Ausgabe.
- Maße im Entwurf sind **gerechnet**; gültig ist, was die Sonde im Browser misst.

**Gebaut (12.10.2026, Zweig `bedienleiste`).** Umsetzungsplan in
`docs/superpowers/plans/2026-10-12-bedienleiste.md`. Vier Abweichungen vom Entwurf, alle beim
Nachrechnen entstanden:

- „Runde N" bleibt, klein in der Kopfzeile — sonst hätte `syncLog()` keine sichtbare Wirkung mehr.
  „schon N getippt" ist entfallen.
- Die Anleitung steht nur **vor dem ersten Druck** und nicht neben der Letzter-Zahn-Warnung: bei
  320 × 568 reicht die Höhe über der Leiste nicht für Anleitung, Hinweis und Warnung zugleich.
- Tablet hochkant zeigt die Köpfe in **einer Zehnerreihe**, erst ab 1100 px Höhe als 5 × 2 — bei
  768 × 1024 passen zwei Reihen großer Kacheln nicht ohne Scrollen.
- Im Zahnrad heißen die Spielerknöpfe „Allein" und „Zu zweit"; Regeln, Statistik und Fertig stehen
  in einer Reihe. Der Satz zu den Verlustchancen bei vier Spielern ist aus dem Regeln-Blatt
  gestrichen und **nicht** durch eine ungerechnete Zahl für zwei Spieler ersetzt.

Gemessen (`scripts/pruefen-bedienung.py` gegen den Bau, 0 Auffälligkeiten): Tier 2 Tipps unter
640 px, 1 Tipp darüber; Zähne 1; Neue Runde 1. Zahnrad-Blatt 447 px (Handy), 343 px (Tablet
hochkant), 283 px (quer) — jeweils ohne Scrollen. Bühne 288 px bei 320 × 568, 728 px bei 768 × 1024
und 820 × 1180, 648 px bei 1024 × 768, 762 px bei 1180 × 820. Das CSS brauchte keine Nachstellung.
Gate **316 Tests in 25 Dateien**. Nachweis §5w, Regel in `AGENTS.md`.

Offen: kein echtes Gerät im Arbeitsumfeld; Handy quer scrollt wie zuvor.

## Nachtrag 12.10.2026 (gebaut): das Ergebnis steht auf der Seite

Wunsch des Auftraggebers nach dem Umbau der Spielseite: das Ergebnis-Blatt am Ende der Runde
entfernen — „Neue Runde" ist jetzt immer einen Tipp entfernt, das Blatt hielt nur noch auf. Die
Auskunft ist „nice to have" und wird nach der Runde eingeblendet, die neue Runde räumt sie weg.

- `#result-sheet` entfällt; `#result-panel` steht bei geschlossenem Maul an der Stelle des
  Spielstands. „Noch eine Runde", „Zur Statistik" und der Protokoll-Satz sind entfallen.
- Bei geschlossenem Maul verschwindet der einmalige Balken-Hinweis; unter 360 px Breite steht das
  Ergebnis in kleinerer Schrift. Beides hat die Sonde bei 320 × 568 gefunden (§5x).
- Die Regel „ein Tipp daneben schließt dieses Blatt nicht" (`data-keep-on-outside-tap`) bleibt in
  `sheets.ts` samt Test stehen, wird aber von keinem Blatt der Seite mehr benutzt.

Gate **318 Tests in 25 Dateien**, Sonden gegen den Bau grün. Nachweis §5x.

## Nachtrag 12.10.2026 (gebaut): „Wusstest du?“ — ein Satz über das echte Tier

Auftrag: „Was könnte man noch für Kinder an features hinzufügen?“ — aus den Vorschlägen gewählt
und als erster von drei Plänen gebaut („Implementiere den ersten plan“). Umsetzungsplan:
`docs/superpowers/plans/2026-10-12-tierfakten.md`.

**Entscheidungen (mit Grund):**

1. **Eigenes Katalogfeld `fact` statt `note`.** `note` spricht Spieltechnik („1–3 Zähne
   gleichzeitig scharf“) und steht im Regeln-Blatt; der neue Satz spricht über das echte Tier.
2. **Ein Satz je Tier, kein Wechsel.** Mehrere Sätze mit Zufallswahl wären eine zweite Zufallsebene
   und zehnmal so viel Belegarbeit.
3. **Kein Satz sagt etwas über scharfe Zähne** — die Auswahl zieht gleichverteilt. Ein Test
   verbietet `scharf`, `gefährlich`, `meist`, `häufiger`.
4. **Wo der Platz fehlt, entfällt der Satz.** Gemessen (§5y): unter 700 px Höhe und im Querformat
   unter 900 px Höhe reicht es nicht für Ergebnis und Satz. Das Ergebnis geht vor.

**Die zehn Sätze und ihre Belege** (de.wikipedia, abgerufen am 12.10.2026, soweit nicht anders
genannt):

| Tier | Satz | Beleg |
|---|---|---|
| Krokodil | Einem Krokodil wachsen neue Zähne nach — viele Male in seinem Leben. | *Krokodile*, Abschnitt Gebiss: „einen mehrfachen, regelmäßigen Zahnwechsel“; „Mit zunehmendem Alter findet der Zahnwechsel jedoch immer seltener statt und endet schließlich ganz“ — deshalb „viele Male“ und nicht „ein Leben lang“ |
| Wolf | Ein Wolf hat 42 Zähne. Das sind zehn mehr, als ein erwachsener Mensch hat. | *Wolf*: „Insgesamt haben Wölfe somit 42 Zähne.“; *Zahn*: 32 bleibende Zähne |
| Mensch | Du bekommst zweimal Zähne: erst 20 Milchzähne, später bis zu 32 bleibende. | *Milchzahn*: „besteht das Milchgebiss aus 20 Zähnen“; *Zahn*: „insgesamt 32 bleibende Zähne (inklusive der Weisheitszähne)“ |
| Hai | Ein Hai verliert ständig Zähne. Dahinter wartet schon die nächste Reihe. | *Revolvergebiss*: die Zähne wachsen „auf der Innenseite des Kiefers beständig nach“, „wobei der vorderste Zahn letztlich ausfällt“ |
| Maus | Die Nagezähne einer Maus wachsen ihr ganzes Leben lang. Darum nagt sie so viel. | *Nagezahn*: „dauerwachsende Schneidezähne“; „Ein Nagetrieb sorgt für eine dem Wachstum angeglichene Abnutzung.“ (für die Nagetiere, die Maus ist nicht eigens genannt) |
| Vampir | Vampire gibt es nur in Geschichten. Ihre spitzen Zähne heißen bei dir Eckzähne. | *Eckzahn*: „nur eine Höckerspitze (Eckzahnspitze)“ |
| Panda | Ein Panda frisst fast nur Bambus. Dafür hat er besonders breite Backenzähne. | *Großer Panda*: „ernähren sich zu 99 % von Bambus“; die Backenzähne „sind größer und breiter als die der anderen Vertreter ihrer Familie“ |
| Löwe | Ein Löwe hat 30 Zähne. Die vier langen heißen Fangzähne. | schon belegt im Nachtrag „Panther und Säbelzahntiger“ |
| Panther | Ein schwarzer Panther ist ein Leopard mit schwarzem Fell. | ebenda |
| Säbelzahntiger | Seine Säbel ragten bis zu 20 cm aus dem Kiefer. Das Tier ist seit rund 12.000 Jahren ausgestorben. | ebenda |

Zwei Sätze wurden beim Belegen **umformuliert**: beim Krokodil stand zuerst „immer wieder“, beim
Panda „breite Mahlzähne“ — die Quelle sagt „mehrfach, … endet schließlich ganz“ und „breiter“.

**Abgesagt:** mehrere Sätze je Tier; der Satz im Auswahlblatt (dort müssen alle Köpfe ohne Scrollen
passen); der Satz als Überlagerung auf der Bühne (deckte auf dem schmalsten Handy rund ein Drittel
der Zeichnung zu — gerechnet, nicht gebaut).

**Offen:** `realTeeth: 32` beim Krokodil ist **nicht belegt** und vermutlich zu niedrig. Gefunden
wurden nur schwache Quellen (ein Zoo: „about 60 teeth“; ein Safari-Blog: 64–68 beim Nilkrokodil),
de.wikipedia nennt keine Zahl. Der Wert bleibt stehen, bis eine belastbare Quelle da ist — er steht
im Regeln-Blatt als „Echtes Gebiss: 32 Zähne“.

Gate **323 Tests in 25 Dateien**, Sonde `scripts/pruefen-bedienung.py` 0 Auffälligkeiten. Nachweis §5y.

## Nachtrag 12.10.2026 (gebaut und abgenommen): Tierstimmen als Dateien

Auftrag: „Bei den Tierstimmen würde ich gerne die Sounds vorher generieren lassen und dann mit
ausliefern, geht das, wenn ja auch kostenlos?“ — danach: „Ich hätte gerne eine Mischung (echte
Tiere, dazu generiertes Kichern und ‚Oh-oh‘)“ und „Setze gerne nun den zweiten Plan um“.
Umsetzungsplan: `docs/superpowers/plans/2026-10-12-tierstimmen.md`.

**Entscheidungen (mit Grund):**

1. **Dateien statt Synthese** für die Tierstimmen (Auftraggeber). Die Regel „keine Dateien“ gilt
   weiter für alle Spielklänge.
2. **Nur gemeinfreie Aufnahmen** (CC0 / Public Domain): keine Namensnennung im Spiel nötig.
3. **Zwei Anlässe:** beim Wählen eines anderen Tiers und 120 ms nach dem Biss — nie vor einem
   Urteil, nie bei einem harmlosen Zahn.
4. **Gespielt wird im selben Audio-Kontext** wie alles andere (`decodeAudioData`), nicht über ein
   `<audio>`-Element: so gelten Ton-Schalter, Freigabe nach der ersten Geste und `stopAll()` ohne
   zweite Regel.
5. **Geladen wird erst nach der ersten Geste** und nur bei eingeschaltetem Ton (85 KB; nach dem Tausch von Mensch, Vampir und Wolf 95 KB). Eine
   Stimme, die mehr als 0,5 s nach ihrem Anlass fertig lädt, entfällt.
6. **Kurz und leise:** höchstens 1,5 s, Spitze −3 dB, abgespielt mit 0,6 (der Biss: 0,9).

**Die zehn Stimmen** (Quellen im Einzelnen: `public/sounds/voices/QUELLEN.md`):

| Tier | Stimme | Herkunft |
|---|---|---|
| Krokodil | Brüllen eines Alligators | Aufnahme, Public Domain |
| Wolf | Heulen | Aufnahme des U.S. Fish and Wildlife Service, Public Domain |
| Hai | Luftblasen im Wasser (Haie sind stumm) | Aufnahme, Public Domain |
| Panda | Zwitschern eines Großen Pandas | Aufnahme, Public Domain |
| Löwe | Brüllen | Aufnahme, Public Domain |
| Panther | **Fauchen einer Hauskatze** — keine gemeinfreie Leoparden-Aufnahme gefunden | Aufnahme, CC0 |
| Säbelzahntiger | Knurren eines Tigers | Aufnahme, CC0 |
| Maus | **Platzhalter**, zwei Pfeiftöne | mit `ffmpeg` generiert |
| Mensch | „Servus“, Männerstimme | Aufnahme, Public Domain |
| Vampir | gruseliges Lachen | Aufnahme, Public Domain |

**Abweichungen vom Plan:**

- Der Plan sah vor, dass der Auftraggeber die Kandidaten **vor** dem Einbau anhört und Mensch und
  Vampir selbst generiert. Gebaut ist es umgekehrt: alles läuft mit einer ersten Auswahl, damit er
  im Spiel hören kann statt auf einer Kandidatenseite. Die drei generierten Stimmen sind schlichte
  Tonfolgen, **keine** KI-Klänge — sie halten den Platz, bis bessere da sind.
- **Maus:** auf Wikimedia Commons fand sich keine gemeinfreie Aufnahme. Der erste Treffer („Mouse
  in Antefasy“, CC0) war das gesprochene Wort in einem madagassischen Dialekt; aufgefallen an der
  Kategorie der Dateiseite, nicht am Titel.
- Die Ausschnitte hat ein Programm gewählt (lauteste Stelle), nicht ein Ohr.

**Nachgezogen am selben Tag** (Wunsch: „beim Menschen ein männliches ‚Servus‘ und beim Vampir so
ein gruseliges Lachen“): beides sind jetzt gemeinfreie Aufnahmen von Wikimedia Commons statt der
Tonfolgen. „Männlich“ ist am Grundton gemessen (rund 123 Hz; eine zweite, CC0-lizenzierte
Aufnahme lag bei 182 Hz und wurde deshalb nicht genommen), nicht gehört. Die „Servus“-Aufnahme
hat ein hörbares Grundrauschen (rund ein Zehntel der Spitze). Ein „gruseliges“ Lachen ist eine
bewusste Ausnahme von „freundlich, nicht erschreckend“ — es bleibt bei 1,5 s und Lautstärke 0,6.

**Offen — nur der Auftraggeber kann es:** die Hörprobe (klingt jede Stimme erkennbar und
passend, sind sie gleich laut, matscht es nach dem Biss?), ein besserer Klang für die Maus,
und ob der Panther eine echte Großkatze bekommen soll. Tauschen heißt: neu schneiden
(`scripts/stimme-schneiden.sh`) und die Zeile in `QUELLEN.md` ändern — kein Code.

**Nachgezogen** (Wunsch: „den aktiven Sound stoppen, wenn man einen anderen Charakter auswählt“):
der Tierwechsel ruft `stopAll()`, **bevor** das neue Tier sich meldet — die Reihenfolge hält ein
Test fest. Der Wolf heult seitdem allein (Yellowstone-Tonarchiv statt Rudel-Ausschnitt).

**Abgenommen** vom Auftraggeber am 12.10.2026 („So passt mir das"), gehört am lokalen Entwicklungsserver. Offen
bleiben das Handy, ein besserer Klang für die Maus und eine echte Großkatze für den Panther.
Dazugekommen ist `scripts/stimme-suchen.py`; das Rezept für künftige Stimmen steht in
`docs/workflow.md` („Eine Tierstimme ergänzen oder tauschen").

Gate **346 Tests in 26 Dateien**. Nachweis §5z.

## Nachtrag 12.10.2026 (gebaut): das Tier-Album

Auftrag: „Setze den Plan docs/superpowers/plans/2026-10-12-tier-album.md um. Lies zuerst den
Abschnitt ‚Stand beim Start‘ und lass mich die Entscheidungen bestätigen.“
Umsetzungsplan: `docs/superpowers/plans/2026-10-12-tier-album.md`. Gearbeitet auf dem Zweig
`tier-album`, nicht auf `main`.

**Entscheidungen (mit Grund) — alle sieben vom Auftraggeber am 12.10.2026 einzeln bestätigt:**

1. **Die Absage vom 11.10.2026 ist aufgehoben** („Ja, aufheben“). Dort hieß es: „Kein neues
   Spiel-Element (… keine Fortschrittsbelohnung): was nicht geprüft werden kann, wird nicht heimlich
   gebaut.“ Das Album ist eine Fortschrittsbelohnung — aber es ist prüfbar (eine reine Funktion des
   Protokolls) und nicht heimlich gebaut. Die Regel selbst gilt weiter.
2. **Drei Sterne je Tier, jeder mit Namen:** **gespielt** (eine Runde mit dem Tier, egal mit wie
   vielen Zähnen), **halb geschafft** (mindestens die Hälfte der Zähne harmlos gedrückt; Krokodil:
   5 von 10) und **bis zum letzten Zahn** (erst der letzte Zahn schnappte).
3. **Stern zwei und drei gelten nur mit dem ganzen Gebiss** (Zahnzahl des Katalogs). Mit „2 Zähne“
   wären beide fast geschenkt — dort reicht ein harmloser Druck. Auch **mehr** Zähne als im Katalog
   geben nur „gespielt“.
4. **Die Chancen sind gerechnet** (`pressPositionDistribution`, am 12.10.2026 nachgerechnet) und der
   dritte Stern bleibt eine lange Jagd („Ja, so lassen“):

   | Tier (Zähne) | „halb geschafft“ je Runde | „bis zum letzten Zahn“ je Runde |
   |---|---|---|
   | Krokodil (10), Modus „wie das Spielzeug“ | 26,9 % | 3,3 % |
   | Mensch (12) | 27,3 % | 2,8 % |
   | Maus (6) | 35,0 % | 8,3 % |
   | Wolf, Hai, Vampir, Panda, Löwe, Panther, Säbelzahntiger (12) | 36,4 % | 4,2 % |
   | alle im Modus „nur ein Zahn“ | 50,0 % | 8,3 % (12 Zähne) · 10,0 % (Krokodil) · 16,7 % (Maus) |

   Im Schnitt also 12 bis 36 Runden je Tier für den dritten Stern. `album.test.ts` hält für jedes
   Tier und beide Modi die Spannen 20–50 % und 2–20 % fest.
5. **Sterne sind Glück, kein Können.** Die Regeln sagen das so. Keine Punkte, keine Serien, kein
   Tagesdruck.
6. **Kein eigener Speicher.** Die Sterne werden bei jedem Malen aus `log.load()` gerechnet.
   „Protokoll löschen“ löscht sie mit (die Nachfrage sagt das), ein CSV-Import bringt sie mit.
7. **Kein neues Blatt, kein zusätzlicher Tipp.** Sterne als Überlagerung an den Kacheln, Ansage als
   Überlagerung auf der Bühne (nur bei geschlossenem Maul), Erklärung im Regeln-Blatt.

**Gebaut:** `core/domain/album.ts` (reine Ableitung; `creatureOrDefault` ersetzt die private
`creatureOfRound` der Statistik — eine Regel, eine Stelle), `presentation/game/albumBadges.ts`
(malt die Kacheln, hört auf `kroko:round-finished`), Markup und Verdrahtung in
`src/pages/index.astro`, Nachfrage in `src/pages/statistik.astro`, Stil in
`presentation/styles/app.css`. Die Steuerung ist unverändert, es gibt keinen neuen Port.

**Abweichungen vom Plan — alle drei im echten Browser gefunden, nicht am Code:**

- **Die Ansage war halb so breit wie gedacht.** Das CSS des Plans setzte sie mit `left: 50%` und
  `translate: -50% 0` mittig. Ein absolut gesetzter Kasten bekommt dann nur die **halbe**
  Bühnenbreite zum Schrumpfen: bei 320 px gemessen 143 statt 272 px, „Neue Sterne: Panda — gespielt,
  halb geschafft!“ lief über drei Zeilen und lag über den Augen. Jetzt: `left`/`right` gesetzt,
  `width: fit-content`, `margin: 0 auto` — Abweichung von der Bühnenmitte 0 px.
- **Die Ansage überdeckte die Beschriftung eines oberen scharfen Zahns** („Zahn 6“ beim Krokodil),
  sobald sie zweizeilig war. Sie ist deshalb auf schmaler Bühne kleiner und dichter gesetzt
  (0,75 rem, Zeilenhöhe 1,2, 4 px unter der Kante; ab 640 px Fensterbreite 0,95 rem). Gemessen für
  alle zehn Tiere, **jeden** Zahn und die drei möglichen Sätze auf sechs Größen: keine Überdeckung
  von Ring oder Beschriftung, kleinste Luft 6,7 px (§5aa).
- **Die Sterne lagen im Kopfbild und verdeckten auf der 65-px-Kachel ein Auge** (`top: 3px`). Die
  Marke sitzt jetzt **auf der oberen Kante** der Kachel und endet 0,5 px vor dem Bild. Die
  Kachelmaße sind unverändert (65 × 87 px bei 320 px, 101 × 113 px bei 1180 px).

**Messung der drei Sonden** (gegen den Bau, `astro preview`): `pruefen-bedienung.py` 0
Auffälligkeiten auf allen acht Größen, `pruefen-tiere.py` „ERGEBNIS: in Ordnung“,
`pruefen-trefferflaeche.py` jede Trefferfläche mit eigenem Zahn in der Mitte und drei Tippproben
„registriert“. `pruefen-tiere.py` fällt gegen `pnpm dev` — unabhängig vom Album: sie sucht die
Tierkennungen im Text der `script[src]`-Dateien, und der Entwicklungsserver liefert dort nur ein
Einstiegsmodul.

**Bekannte Grenzen:**

- **Volle Ablage:** scheitert das Schreiben, liefert `log.load()` den Stand im Arbeitsspeicher —
  der Stern erscheint. Nach einem Neuladen kann er fehlen, weil die Runde nie in der Ablage stand.
- **Schriftgröße der Ansage am Handy:** 12 px in Gold auf Dunkel. Ob ein Kind das am echten Gerät
  gut liest, kann nur der Auftraggeber prüfen; größer geht auf 320 px nur um den Preis, dass die
  Ansage die Beschriftung eines oberen Zahns wieder erreicht.
- **Die Messung der Ansage ist ein Einmal-Skript**, keine Sonde im Baum. Wer Schriftgröße, Lage oder
  Wortlaut der Ansage ändert, misst neu (Verfahren in §5aa).

**Abgesagt:** ein eigenes Album-Blatt, Punkte, Serien, ein Stern für den „mutigsten Druck“.

Gate **371 Tests in 28 Dateien**. Nachweis §5aa. Nicht gepusht — ein Push auf `main` veröffentlicht
und wartet auf das Wort des Auftraggebers.

## Nachtrag 12.10.2026 (gebaut): kein Zahn mehr unter den Augen

Auftrag: „Kannst du einmal die Grafiken der Modelle analysieren und optimieren. Aktuell ist öfters
mal der eine oder andere Zahn verdeckt von den Augen. Es soll alles kinderfreundlich und im
einheitlichen Stil bleiben“ — und nach der Vorlage des Entwurfs: „ja bitte umsetzen und
anschließend eine Anleitung für zukünftige Models erstellen“.

**Befund (gemessen, jedes Tier × jede Zahnzahl 1–12):** die Gesichtsebene liegt über den Zähnen,
und die Augen saßen bei allen zehn Tieren auf dem Zahnring. Höchste Verdeckung eines Zahns: Panda
100 %, Hai 82 %, Panther 64 %, Säbelzahntiger 61 %, Krokodil 49 % (dazu Wangen 34 %), Löwe und
Mensch 41 %, Vampir 15 % (Monokel), Wolf 14 %, Maus 7 %.

**Entscheidungen (mit Grund), vom Auftraggeber als Entwurf mit Vorschaubild bestätigt:**

1. **Augen, Brauen und Wangen wandern in den Fellstreifen** zwischen Zahnring und Kopfumriss; Ring,
   Zähne und Trefferflächen bleiben unverändert. Grund: das Maul ist das Spielfeld.
2. **Wo der Streifen schmal ist, werden die Augen kleiner** und rücken neben die Nase: Löwe 34 × 29
   → 25 × 22, Säbelzahntiger 32 × 26 → 24 × 21, Panther 33 × 28 → 27 × 24, Hai 35 × 30 → 28 × 25,
   Krokodil 38 × 33 → 33 × 29. Das ist mehr als die im Entwurf genannten 15–20 % (Löwe und
   Säbelzahntiger rund 25 %): der gemessene Streifen gab nicht mehr her. Mensch, Wolf, Maus und
   Vampir behalten ihre Größe.
3. **Panda:** Augenfleck 54 × 44 (gedreht) → 29 × 26 neben der Nase, Linse 18 × 17. Der Fleck ist
   der größte Eingriff; die Linse füllt ihn bis auf einen dunklen Rand, damit das Auge groß wirkt.
4. **Brauen als Lid**, wo über dem Auge kein Platz bleibt (Krokodil, Mensch, Hai, Säbelzahntiger).
5. **Kiemenschlitze des Hais** an den Flossenansatz (der innerste lag auf einem Zahn);
   **Wangen** von Krokodil, Wolf und Maus aus dem Ring; **Schnurrhaare** des Panthers 4 Einheiten
   kürzer.

**Abgesagt:** Zähne über das Gesicht malen (ein Zahn läge auf dem Augapfel); Zähne um die Augen
herum verteilen (kleinere Trefferflächen); den Zahnring oben absenken (dem Auftraggeber für den
Panda angeboten, nicht gewählt — flacheres Maul, rund 4 % kleinere Trefferflächen).

**Abgesichert:** ein Test in `creatureViews.test.ts` (keine runde Gesichtsform im Zahnring), die
Sonde `scripts/pruefen-zahnsicht.py` (Deckung im Browser, 120 Zeichnungen, 0 Auffälligkeiten) und
die Anleitung `docs/tiermodell-anleitung.md`. App-Symbol und README-Bild neu erzeugt.

**Offen — nur der Auftraggeber kann es beurteilen:** ob die kleineren Augen von Löwe,
Säbelzahntiger und Panda am Handy noch freundlich genug wirken. Der nächste Schritt wäre, den
Kopfumriss dieser Tiere oben anzuheben, nicht das Auge weiter zu verkleinern.

Gate **372 Tests in 28 Dateien**. Nachweis §5ab. Nicht gepusht — ein Push auf `main` veröffentlicht
und wartet auf das Wort des Auftraggebers.

## Nachtrag 12.10.2026 (gebaut): der Herzschlag ist entfernt

**Anlass (Auftraggeber):** „Ich finde dieses features des heartbeats nicht so toll. Kannst du das
entfernen?"

**Die eine Frage des Sparrings:** der Herzschlag war zweierlei — das pochende Geräusch und das
Pulsieren des Balkens im selben Takt. Entschieden vom Auftraggeber: **nur das Geräusch** fällt weg.

**Gebaut:**

1. Der Klang `heartbeat` ist aus `SoundPort`, Ton-Engine und Steuerung entfernt; die Steuerung hat
   keinen eigenen Zeitgeber mehr, und kein Klang wiederholt sich mehr von selbst.
2. Der Balken pulsiert weiter (900 ms bei Gefahr 0 bis 380 ms bei Gefahr 1). Die Rechnung heißt
   jetzt `pulseInterval` (`PULSE_SLOW_MS`/`PULSE_FAST_MS`) statt `heartbeatInterval` — sie taktet
   nur noch die Anzeige. Regeln-Blatt: „Der Balken pulsiert, und je höher die Gefahr, desto
   schneller."
3. `dispose()` bleibt: die Vorgabe der Wartefunktion führt nach dem Abhängen keinen Rückruf mehr
   aus (vorher hängte `dispose()` nur den Herzschlag ab).

**Offen — nur der Auftraggeber kann es beurteilen:** wie die Runde ohne das Pochen klingt. Zwischen
den Drücken ist es jetzt still.

Gate **373 Tests in 28 Dateien**. Nicht gepusht.

## Nachtrag 12.10.2026 (gebaut): Zahn halten, das Urteil kommt beim Loslassen

**Anlass (Auftraggeber):** die Frage nach mehr Nervenkitzel und seine Zustimmung zu den drei
Empfehlungen „Drücken und halten", „Das Tier reagiert auf die Gefahr", „Heranzoomen bei Rot" — in
dieser Reihenfolge. Dies ist der erste der drei Pläne; die beiden anderen stehen noch aus.

**Die Entscheidungen** (Selbst-Sparring, jede Antwort mit einer Tatsache aus dem Baum):

1. **Beim Auflegen wird nichts entschieden.** `playPress` läuft erst beim Loslassen. Grund: ein
   Finger, der nur scrollen will, endet mit `pointercancel` (so begründet `src/pages/index.astro`
   schon die Ton-Freigabe bei `pointerup`) — er darf keinen Zug kosten.
2. **Vom Zahn schieben nimmt den Druck zurück.** Geprüft wird beim Loslassen mit
   `document.elementFromPoint` gegen den Zahn. Das verrät nichts: bis dahin ist nichts gezogen.
3. **Die Pause des Kerns bleibt Mindestpause.** Gewartet wird `max(0, beatMs − Haltedauer)`. Ein
   kurzer Tipp fühlt sich damit an wie heute (120–700 ms), und schnelles Tippen kürzt die Pause
   nicht ab. Die Länge hängt weiter nur an Zufall, Spannung und der Hand des Spielers — nie am
   Ausgang.
4. **Tastatur und Hilfstechnik: kurzer Druck wie bisher.** `keydown` (Enter, Leertaste) und ein
   `click` ohne Zeiger (`detail === 0`) lösen sofort aus. Ein `click` **mit** Zeiger (`detail ≥ 1`)
   wird übergangen — den Zug hat `pointerup` schon ausgelöst.
5. **Obergrenze 4 s, danach federt der Zahn zurück** (kein Zug). Grund: ein verlorenes `pointerup`
   (Tabwechsel, Systemdialog) darf nichts entscheiden und die Bühne nicht sperren.
6. **Nur ein Halten zugleich.** Ein zweiter Finger beginnt keinen zweiten Druck (`isPrimary`, und
   ein laufendes Halten sperrt).
7. **Die Erleichterung wächst mit der erlebten Pause** — also mit `max(beatMs, Haltedauer)`. Wer
   lange gehalten hat, atmet hörbarer aus.
8. **Tipp-Rückmeldung beim Auflegen:** Vibration (25 ms) und die Klänge `tap`, `creak`, `breath`
   kommen beim Auflegen des Fingers, nicht beim Loslassen. Beim Zurücknehmen bricht `stopAll()` sie
   ab.

**Abgesagt:** Auslösen bei Erreichen der Obergrenze (ein hängendes Halten würde einen Zug
ergwingen); Halten per Tastatur (`keydown`/`keyup` mit Tastenwiederholung — eigener Fehlerraum ohne
Gewinn); ein Fortschrittsring um den gehaltenen Zahn (sähe aus wie ein Zeitlimit).

**Offen — nur der Auftraggeber kann es beurteilen:** wie sich das Halten am Handy anfühlt, ob 4 s zu
kurz oder zu lang sind, und ob ein langer Druck auf dem Fire-Tablet oder in Safari ein Systemmenü
öffnet (die Sonde prüft nur Chromium).

Gate **386 Tests in 28 Dateien**. Nicht gepusht.

## Nachtrag 12.10.2026 (gebaut): das Tier reagiert auf die Gefahr

**Anlass (Auftraggeber):** die Frage nach mehr Nervenkitzel und seine Zustimmung zu den drei
Empfehlungen „Drücken und halten", „Das Tier reagiert auf die Gefahr", „Heranzoomen bei Rot" — in
dieser Reihenfolge. Dies ist der zweite der drei Pläne (nach „Drücken und halten").

**Die Entscheidungen** (Selbst-Sparring, jede Antwort mit einer Tatsache aus dem Baum):

1. **Nur die Pupille bewegt sich**, nicht Linse, Iris oder Glanzpunkt. Grund: alle zehn Tiere tragen
   `class="pupil"` an genau zwei Formen; die Linse ist bei allen eine weiße Ellipse
   (`fill="#ffffff"`). Eine Änderung an den zehn Zeichnungen ist nicht nötig.
2. **Höchstens 4 SVG-Einheiten.** Nachgerechnet am engsten Auge: beim Panther liegt die Pupille
   (r 10,5, Mitte um 1,4 versetzt) in einer Iris von r 17 — 5,1 Einheiten Luft; beim Panda sind es
   in der Linse 18 × 17 senkrecht 6. Vier bleibt bei jedem Tier in der Linse. Ein Test rechnet das
   für alle zehn nach.
3. **Beide Augen schauen parallel.** Ein Versatz für beide, gerechnet von der Mitte zwischen den
   Pupillen. Schielen sähe für ein Kind falsch aus.
4. **Ziel ist der Zeiger über der Bühne**, und beim Zug der Anker des gedrückten Zahns
   (`CreatureView.toothAnchor`). Auf dem Handy gibt es kein Schweben: dort bleibt der Blick dort,
   wo der Finger zuletzt war — also auf dem gedrückten Zahn. Die Tastatur bekommt denselben Blick
   über den Anker.
5. **Der Blick verrät nichts.** Er hängt nur am Zeiger und am gedrückten Zahn, nie an den scharfen
   Zähnen. Bei geschlossenem Maul folgt er dem Zeiger nicht mehr.
6. **Zittern in zwei Stufen aus den vorhandenen Schwellen:** `is-wary` über 30 % (`isTense`),
   `is-trembling` ab 50 % (`isHighDanger`). Keine neue Schwelle, keine neue Rechnung im Kern.
7. **Es zittert der Oberkiefer** (`.jaw__upper`), 2 bzw. 3 SVG-Einheiten. Die oberen Zähne fahren
   mit; bei 390 px Bühne sind 3 Einheiten rund 1,7 px — die Trefferfläche (≥ 44 px) trägt das.
8. **Die Regeln stehen vor den Druck-Regeln im Stylesheet.** `is-pressing`, `is-settling`,
   `is-twitching` und `is-clenching` animieren dasselbe Element mit gleicher Spezifität; die
   spätere Regel gewinnt. Das Zittern muss also **vor** „Fakeout-Zucken" stehen, sonst schluckt es
   das Knarren der Pause.
9. **`prefers-reduced-motion`:** die vorhandene Regel (`* { animation: none !important; transition:
   none !important; }`) schaltet das Zittern ab; die Pupillen springen dann ohne Übergang. Das
   genügt.

**Abgesagt:** Augen, die sich bei Gefahr weiten oder das Tier ängstlich machen (für ein Kind soll
das Tier verspielt bleiben, nicht leiden); ein Blick auf einen **scharfen** Zahn als „Tell"
(verriete den Ausgang); Zittern der ganzen Bühne (kollidiert mit `is-shaking` und verschöbe alle
Trefferflächen).

**Gebaut mit `GAZE_MAX = 4`.** Die engste Linse hat der **Panda** (Pupille r 9 in einer Linse
18 × 17, gemessene Luft 5,85 Einheiten), nicht der Panther wie im Plan angenommen — 4 Einheiten
lassen dort also rund 1,85 Einheiten übrig. Der Test rechnet die Grenze für alle zehn Tiere nach,
die Sonde misst sie im Browser (Wanderung links → rechts: 4,12 bis 4,38 px bei 390 px Blick).

**Offen — nur der Auftraggeber kann es beurteilen:** ob 4 Einheiten Blick am Handy sichtbar genug
sind und ob das Zittern spannend oder unruhig wirkt. Stellschrauben: `GAZE_MAX` in
`creatures/gaze.ts`, `--tremble` und die Dauern in `app.css`.

Gate **404 Tests in 29 Dateien**. Nicht gepusht.

## Nachtrag 12.10.2026 (gebaut): Heranzoomen bei Rot

**Anlass (Auftraggeber):** die Frage nach mehr Nervenkitzel und seine Zustimmung zu den drei
Empfehlungen „Drücken und halten", „Das Tier reagiert auf die Gefahr", „Heranzoomen bei Rot" — in
dieser Reihenfolge. Dies ist der dritte und letzte der drei Pläne.

**Die Entscheidungen** (Selbst-Sparring, jede Antwort mit einer Tatsache aus dem Baum):

1. **Der Zoom wird abgeleitet, nicht hochgezählt.** `dangerZoom(tension)` steht im Kern neben
   `isHighDanger` und benutzt dieselbe Schwelle `HIGH_DANGER = 0,5`. Grund: die Falle „Eine Kennzahl,
   die aufaddiert wird, sättigt".
2. **Sprung an der Schwelle, dann Rampe.** Unter 50 % ist der Zoom 0; bei 50 % springt er auf 0,4
   und wächst linear bis 1 bei 100 %. Grund: beim Krokodil ist der erste rote Druck 55,0 % — eine
   reine Rampe ergäbe dort 0,1, also 0,8 % Vergrößerung, unsichtbar. Mit dem Sprung sind es
   0,46 → 3,7 %.
3. **Höchstens 8 %.** Nachgerechnet am breitesten Kopf: der Vampir reicht mit Kragen und Ohren von
   x 24 bis 616 der 640 Einheiten; um die Mitte skaliert liegt der linke Rand bei
   320 − 296 × 1,08 = 0,3 — er bleibt gerade im Bild. Der Zahnring (Halbachse höchstens 240) bleibt
   weit innerhalb.
4. **Drehpunkt 50 % / 58 %** — die Maulmitte (`ring.cy` 265 von 460). Oben darf dabei etwas aus dem
   Bild laufen (Hut des Menschen, Ohrspitzen): das ist die Wirkung von „näher ran". **Kein Zahn und
   keine Trefferfläche** darf dadurch unerreichbar werden — die Sonde prüft das für jedes Tier, bei
   Standard-Zahnzahl und bei 12 Zähnen, auf 320, 390 und 820 px.
5. **Beim Biss zurück auf 0.** Bei geschlossenem Maul gibt es keine Gefahr des nächsten Drucks
   (Falle „Eine Anzeige muss verstummen, wenn ihre Frage wegfällt"); das Zurückfahren liest sich als
   Rückstoß.
6. **`prefers-reduced-motion`: gar kein Zoom.** Die vorhandene Regel schaltet nur Übergänge ab —
   die Bühne spränge sonst. Deshalb eine eigene Regel `transform: none`.
7. **Kein neuer Schalter.** Der Zoom ist ein Zustand der Bühne wie die Vignette.

**Schon vorhanden, deshalb nicht Teil dieses Plans:** das Abdunkeln des Randes — `.stage::after`
zieht eine Vignette mit `--tension` zu (`rgba(0, 0, 0, calc(0.2 + 0.6 * var(--tension)))`).

**Abgesagt:** Zoom von Rundenbeginn an (der Wolf beginnt bei 12 %, das Krokodil bei 20 % — die
Bühne stünde nie in Ruhe); Zoom auf den zuletzt gedrückten Zahn (verschöbe alle anderen
Trefferflächen unter dem Finger); stärker als 8 % (der Kopf des Vampirs liefe seitlich aus dem
Bild).

**Gebaut mit dem Faktor 0,08 (8 %).** Die Sonde hat ihn nicht beanstandet: auf 320, 390 und 820 px
blieb bei jedem der zehn Tiere und bei 1–12 Zähnen jeder Zahn in der Mitte seiner Trefferfläche
erreichbar, keine Trefferfläche wurde kleiner (sie wächst mit dem Zoom: 320 px / 12 Zähne Maus
37,18 → 40,15 px), und keine Zahnzeichnung lief aus der Bühne.

**Offen — nur der Auftraggeber kann es beurteilen:** ob 8 % am Handy spürbar oder zu zaghaft sind.
Stellschraube: der Faktor `0.08` in `app.css` — wer ihn anhebt, fährt `scripts/pruefen-zoom.py`.

Gate **413 Tests in 29 Dateien**. Nicht gepusht.

## Nachtrag 12.10.2026 (gebaut): Durchsicht der drei Pläne — ein Fund

**Anlass (Auftraggeber):** „alle drei Pläne wurden implementiert. Bitte mache ein review und fixe
alle findings direkt"

**Geprüft:** der Code der drei Pläne (Steuerung, Blick-Rechnung, Kern, Stylesheet), das Gate und
sieben Sonden gegen den laufenden Entwicklungsserver (Halten, Blick, Zoom, Trefferfläche, Zahnsicht,
Anzeige, Bedienung) — alle ohne Fund.

**Der Fund:** ein Finger, der beim Halten wackelt, brach das Halten ab. Nach rund 10 px Weg — noch
mitten auf der Trefferfläche — schickt der Browser `pointercancel`, weil er ein Wischen beginnt; der
Zahn federte zurück und der Druck zählte nicht. Die Sonde hielt nur mit der Maus. **Behoben:** die
Steuerung hält `touchstart` des gehaltenen Zahns an; ein Test und zwei Sondenfälle mit echter
Berührung halten es fest (Messwerte: `docs/e2e-nachweise.md` §5ac, Falle in `AGENTS.md`).

**Bewusst gelassen:**

1. Beim **allerersten** Halten einer Sitzung auf einem Berührungsbildschirm kommen Klang und Stoß
   erst beim Loslassen: der Browser gibt Ton und Vibration erst mit dem Ende der ersten Berührung
   frei. Ab dem zweiten Druck stimmt der Zeitpunkt. Daran lässt sich in der Seite nichts ändern.
2. Wer den Finger vom Zahn schiebt, bricht mit `stopAll()` auch eine Tierstimme ab, die gerade
   noch klingt (nur direkt nach einem Tierwechsel möglich).

**Offen — nur der Auftraggeber kann es beurteilen:** ob das Halten am echten Handy und am
Fire-Tablet jetzt zuverlässig ist.

Gate **414 Tests in 29 Dateien**. Nicht gepusht.

## Nachtrag 12.10.2026 (gebaut): Start ohne Netz — der fehlende Baustein der PWA

**Anlass (Auftraggeber):** das Kinderprofil eines Fire-Tablets leert beim Schließen der Seite den
lokalen Speicher; Frage, ob eine PWA reicht, und dann: „Kannst du das was fehlt bitte hinzufügen?"

**Bestand vorher:** Manifest, Symbole in allen nötigen Größen, HTTPS, `theme-color` — es fehlte
allein der Service Worker.

**Gebaut:**

1. `public/sw.js`, von Hand und ohne Paket. Seiten: erst Netz, bei Fehler Vorrat. Bausteine unter
   `_astro/` (Hash im Namen): erst Vorrat. Alles andere: Vorrat, im Hintergrund aufgefrischt. Bei
   der Installation kommen beide Seiten, ihre Bausteine, vier Symbole und die zehn Tierstimmen in
   den Vorrat; Bausteine, die keine Seite mehr nennt, werden weggeräumt. Keine Versionsnummer.
2. Anmeldung in `src/layouts/Base.astro` — nur im Bau (`import.meta.env.PROD`), über den Basis-Pfad.
3. Manifest: `id`, `lang`, und die Beschreibung nennt das Halten.
4. `src/offline.test.ts` (16 Fälle) und `scripts/pruefen-offline.py` (gebaute Seite, echter Browser).

**Entscheidungen:** keine feste Ausrichtung im Manifest (die Seite ist auch quer bedienbar); kein
Paket für den Worker (er ist rund 200 Zeilen und kennt keine Dateiliste, die der Bau erzeugen müsste).

**Was es nicht löst — das Ausgangsproblem:** der Vorrat liegt im selben Browserprofil wie das
Rundenprotokoll. Verwirft das Kinderprofil beim Schließen alles, ist auch er weg. Dagegen helfen
nur ein Spielstand auf einem Server oder eine verpackte Android-App; beides ist nicht gebaut.

**Offen — nur der Auftraggeber kann es beurteilen:** ob Fire-Tablet und Fairphone die Installation
anbieten und ob die installierte App ihre Daten behält.

Gate **430 Tests in 30 Dateien**. Nicht gepusht.

## Nachtrag 13.10.2026 (gebaut): Tiere freischalten

Auftrag: „ich würde gerne noch eine Mechanik implementieren, die quasi Modelle unlockt, wenn eine
gewisse Anzahl von 3-Sterne-Modellen erreicht wurde.“ Davor das Sparring im `grill-me`-Stil: neun
Fragen, jede einzeln vom Auftraggeber entschieden.

**Entscheidungen (mit Grund) — alle vom Auftraggeber am 13.10.2026 bestätigt:**

1. **Gesperrt wird ein Teil der zehn vorhandenen Tiere**; versteckte Bonus-Tiere kommen später
   dazu (Entscheidung 8).
2. **Die Währung ist die Gesamtzahl der Sterne, nicht die Zahl der Drei-Sterne-Tiere.** Der dritte
   Stern ist reines Glück und selten — aus dem Modell gerechnet (`pressPositionDistribution`, Modus
   „wie das Spielzeug“): Maus 8,3 % je Runde (im Mittel 12 Runden, 9 von 10 Spielern nach 27),
   Wolf/Hai/Vampir/Panda/Löwe/Panther/Säbelzahntiger 4,2 % (24 / 55), Krokodil 3,3 % (30 / 68),
   Mensch 2,8 % (36 / 82); alle zehn auf drei Sterne im Mittel 246 Runden. „Es soll ja nicht
   frustrierend sein für Kinder.“ Die Regel „alle auf drei Sterne“ bleibt den Bonus-Tieren.
3. **Am Anfang offen: Krokodil, Maus, Wolf.** Danach in fester Folge Hai, Panda, Mensch, Löwe,
   Vampir, Panther, Säbelzahntiger — die drei Katzen nicht am Stück, der Säbelzahntiger als
   Abschluss. Eine freie Wahl des nächsten Tiers bräuchte einen eigenen Speicher und ist abgesagt.
4. **Schwellen: 3, 5, 7, 9, 11, 13, 15 Sterne insgesamt** für das vierte bis zehnte Tier. Simuliert
   (20 000 Durchläufe, Modus „wie das Spielzeug“, zufälliger Wechsel zwischen den offenen Tieren):
   erstes neues Tier nach 3 Runden (Median), alle zehn offen nach 28 Runden (Median) bzw. 42
   (9 von 10 Spielern). Abgesagt: 3, 6, 9, … 21 — dort braucht das zehnte Tier 21 Sterne aus neun
   offenen Tieren, also zwingend dritte Sterne (Median 93 Runden, 9 von 10 nach 153).
5. **Die Sperre gilt für alle, ohne Schalter.** Sie wird aus dem Rundenprotokoll abgeleitet wie die
   Sterne — kein eigener Speicher. Ein Schalter „Alle Tiere offen“ höbe die Mechanik für genau das
   Kind auf, für das sie gebaut wird.
6. **Gesperrte Tiere stehen als Schattenriss mit Schloss und Namen an ihrem Platz.** Das nächste
   zeigt, was fehlt („Noch 2 Sterne“). Ein Tipp auf ein gesperrtes Tier wählt nichts, zeigt aber
   den Satz dazu — ein Tier, das auf den Tipp nicht reagiert, wäre ein Bedienfehler.
7. **Die Freischaltung wird gefeiert:** nach dem Biss das Kopfbild des neuen Tiers, der Knopf „Mit
   dem Hai spielen“ und Konfetti über den ganzen Bildschirm. Kein selbsttätiger Wechsel.
8. **Bonus-Tiere sind nicht Teil dieses Baus.** Eine Regel ohne Tier wäre toter Code; ein neues Tier
   braucht Zeichnung, Stimme mit Lizenz und einen belegten Satz, muss also ein echtes Tier sein.
   Offen für den späteren Bau: ganz versteckte Tiere jagt niemand, weil niemand von ihnen weiß.
9. **Der Fortschritt steht nach jedem Biss mit neuem Stern da** („Noch 1 Stern bis zum Hai“) — mit
   Sternsymbolen und dem Tier als Schattenriss, „da vielleicht noch nicht alle Kinder lesen können“.
   Der Schattenriss statt des Kopfbilds: das Bild ist die Belohnung der Freischaltung.

**Was daraus folgt (nicht gefragt, weil es aus den Regeln folgt):**

- Die Sternregeln bleiben unverändert; jeder Modus und jede Spielerzahl zählt.
- Ein gespeichertes Tier, das gesperrt ist, fällt beim Start auf das Krokodil zurück.
- „Protokoll löschen“ sperrt die Tiere wieder.
- **Gefeiert wird nur nach einem eigenen Biss.** Kommen Runden von außen (Sicherung nach geleertem
   Profil, anderer Tab, Import), öffnen sich die Tiere still — wie die Sterne schon heute.
- Konfetti fängt keinen Tipp ab, braucht kein Paket und entfällt bei „Bewegung reduzieren“.
- **Ansage, Fortschritt und Freischaltung liegen über der Bühne, nicht im Ergebnis-Kasten.** Die
   Spielseite scrollt auf keinem Gerät (gemessen, `scripts/pruefen-bedienung.py`); jede Zeile mehr
   im Kasten bräche das auf kleinen Handys. Die Ansage eines Sterns liegt dort schon.
- **„Noch 2 Sterne“ liegt als Marke über dem Kopfbild**, nicht als zusätzliche Zeile: die Kacheln
   behalten ihre Maße.

**Umsetzung (in dieser Reihenfolge, jeder Schritt mit Test zuerst):**

1. **Regel im Kern** — `core/domain/unlocks.ts`: `STARTING_CREATURES`, `UNLOCK_STEPS` (Tier und
   Schwelle), `unlockState(pages)` → Sterne, offene Tiere, nächstes Tier samt fehlender Sterne;
   `newlyUnlocked(before, after)`. Tests: jede Schwelle an ihrem Rand; **jedes Katalogtier steht
   genau einmal** in Start oder Folge (ein neues Tier fällt sonst auf); **keine Schwelle braucht
   einen dritten Stern** (Schwelle ≤ 2 × offene Tiere davor); alte Runden gesperrter Tiere zählen mit.
2. **Einstellungen** — `presentation/game/creatureChoice.ts`: ein gesperrtes Tier wird nicht
   gewählt; `settingsWithUnlockedCreature` für den Rückfall beim Start.
3. **Kacheln** — `presentation/game/albumBadges.ts` malt Sterne **und** Sperre in einem Durchgang
   (zwei Module, die dieselbe Beschriftung setzen, überschrieben einander): Klasse `is-locked`,
   `aria-disabled`, Schloss, Marke am nächsten Tier, Beschriftung für Bildschirmleser.
   `quickControls.ts` fragt vor dem Wählen, ob das Tier offen ist, und meldet sonst den Tipp.
4. **Ansage** — `presentation/game/unlockNotice.ts`: Satz zum Fortschritt, Karte der Freischaltung
   (Kopfbild, Knopf), Hinweis beim Tipp auf ein gesperrtes Tier, Konfetti. Verdrahtet in
   `albumBadges.ts` am Ereignis `kroko:round-finished`.
5. **Seite** — `src/pages/index.astro`: Elemente über der Bühne, Rückfall beim Start, Verdrahtung;
   ein Satz im Regeln-Blatt, dessen Zahlen ein Test gegen die Regel hält. Stile in
   `presentation/styles/app.css`.
6. **Sonden** — sieben Browser-Sonden wählen heute Tiere, die künftig gesperrt sind
   (`pruefen-blick`, `-zoom`, `-halten`, `-anzeige`, `-bedienung`, `-blaetter`, `-tiere`). Sie
   bekommen ein Protokoll, das alle Tiere öffnet (`scripts/freischaltung.py`), und werden danach
   gefahren. Neu: `scripts/pruefen-freischaltung.py` — drei Tiere am Start, Tipp auf ein gesperrtes
   Tier, Freischaltung nach dem Biss mit Knopf und Konfetti, kein Scrollen, kein verdeckter Griff.
7. **Doku** — `docs/domain-model.md`, `docs/testing.md`, `README.md`, `AGENTS.md` (ein neues Tier
   braucht einen Platz in der Folge), Nachweis in `docs/e2e-nachweise.md`.

**Abnahme:** `pnpm gate` grün, `pnpm build`, alle berührten Sonden mit `Auffälligkeiten: 0`, die
gesperrten Kacheln und die Freischaltung im gerasterten Bild angesehen.

**Gebaut am 13.10.2026 — was beim Bau anders kam als geplant:**

- **Der Hinweis beim Tipp auf ein gesperrtes Tier steht an der Kachel selbst** („Noch 9 Sterne“
  über dem Schattenriss, darunter der Name), nicht als eigener Satz an anderer Stelle: auf dem Handy
  liegt die Auswahl in einem Blatt über der Bühne, ein Satz dort wäre verdeckt. Der ganze Satz
  („Löwe ist noch gesperrt. Noch 9 Sterne.“) geht an den Vorleser.
- **Die Auswahl folgt der Freischaltung** (`UNLOCK_ORDER`), nicht mehr dem Katalog: so steht das
  nächste Tier gleich hinter den offenen.
- **Der Schattenriss ist hell, nicht schwarz.** Im gerasterten Bild bei 390 px war ein schwarzer
  Umriss auf der dunklen Kachel kaum zu sehen; jetzt wird geschwärzt und umgekehrt. Im Satz zum
  Fortschritt (heller Grund) bleibt er dunkel.
- **Ein Fund beim Bau:** das Seitenskript nutzte `settings` vor seiner Definition — Gate und Bau
  grün, im Browser kein Zahn. Die Sonde fand es (Falle in `AGENTS.md`).
- **Zwei Funde der Sonde waren Messfehler der Sonde:** sie maß, bevor die Runde ausgewertet war
  (das Maul ist zu, bevor die Runde im Protokoll steht) und mitten im Aufploppen der Karte. Sie
  wartet jetzt auf die Ansage des Sterns; danach drei Läufe ohne Fund.

Gate **516 Tests in 37 Dateien**, `pnpm build`, und alle zwölf Sonden, die die Seite laden, gegen
die gebaute Seite ohne Fund (`pruefen-freischaltung.py`: 106 Zeilen `ok`; `pruefen-zahnsicht.py`
misst nur die Zeichnungen und wurde nicht gefahren). Die Bilder von Start, Tipp,
Fortschritt und Freischaltung auf 320, 390, 800 und 1180 px angesehen.

**Offen — nur der Auftraggeber kann es beurteilen:** ob das Tempo am echten Kind stimmt (28 Runden
im Median sind gerechnet, nicht erlebt) und wie das Konfetti auf dem Fire-Tablet läuft.

**Nachtrag am selben Tag:** Die Karte hieß zuerst „Neues Tier: Hai!“ — bei „Neues Tier: Mensch!“
meldete der Auftraggeber: „Das passt weder zum Mensch noch zum Vampir.“ Entschieden: **kein
Oberbegriff** in der Freischaltung („Neu dabei: Mensch!“; im Regeln-Blatt „Freischalten: … kommen
Neue dazu“). Der Knopf „Tier“, das Blatt „Welches Tier?“ und das Tier-Album bleiben.

## Nachtrag 13.10.2026 (gebaut): das geschlossene Maul und zwei Zeichnungen

Drei Meldungen des Auftraggebers beim Ausprobieren der Freischaltung, alle am geschlossenen Maul:

1. **Mensch** — „der Bart des Menschen geht beim geschlossenen Mund gar nicht mit runter, sondern
   bleibt oben am Hut“. Die beiden Formen waren als Schläferlocken gezeichnet (11.10.2026) und lagen
   im Gesichtsbereich, der beim Biss liegen bleibt. Gelesen werden sie als Bart: sie heißen jetzt so
   und liegen in `upperExtra`, der Ebene der Nase, und fahren mit ihr.
2. **Vampir** — „sieht auch komisch aus, wenn sein Mund geschlossen ist“ (mit Bild). Die Ohren
   liefen bis unter die Augen; bei offenem Maul deckte die Schnauzenfläche den Fuß zu. Sie enden
   jetzt bei x 126 bzw. 514, die Schnittkante ohne Strich. Das offene Bild ist dasselbe geblieben
   (Unterschied zweier Rasterungen: 225 Bildpunkte an den Ohrkanten).
3. **Alle Tiere** — „der Mund, der nach unten klappt … das müsste gar nicht sichtbar sein, wenn der
   Mund zu ist“. Vor dem Umbau wurde die Variante an Vampir, Wolf, Krokodil und Hai als Bild
   nachgestellt und dem Auftraggeber vorgelegt; er hat sie samt neuem App-Symbol bestätigt.
   **Entschieden:** der herabgefahrene Oberkiefer (Zahnfleischband und Schnauzenfläche) verschwindet
   nach dem Zufahren. Dazu der einzelne Zahn im linken Maulwinkel, der bei 12 Zähnen stehen blieb
   (`splitByJaw`).

Das **App-Symbol** hängt an diesen Regeln und ist neu erzeugt (`favicon.svg`, `icon-maskable.svg`,
`logo.svg`, vier PNG-Größen). `cairosvg` ließ sich auf dem Rechner nicht laden (`libcairo-2.dll`
fehlt); `scripts/icon-png.py` rastert jetzt ersatzweise mit dem Browser der Sonden.

Gate **516 Tests in 37 Dateien**, `pnpm build`; gegen die gebaute Seite ohne Fund:
`pruefen-zahnsicht` (120 Zeichnungen), `-trefferflaeche`, `-zoom`, `-halten`, `-blick`,
`-bedienung`, `-freischaltung`, `-offline`, `-anzeige`. Sechs Tiere offen und geschlossen als Bild
angesehen (Vampir, Wolf, Mensch, Maus, Löwe, Panda), dazu das Symbol in 512 px.

**Nicht neu gebaut:** das README-Bild der Gebisse (`docs/bilder/gebisse.png`) — es zeigt das offene
Maul, und das ist unverändert; `scripts/galerie.py` braucht `cairosvg`.
**Nachgeholt am selben Tag:** der Auftraggeber hat `cairosvg` und die GTK-Laufzeit installiert
(`winget install tschoonj.GTKForWindows`); das Bild ist neu gebaut, sichtbar unverändert.

## Nachtrag 13.10.2026 (gebaut): die Zahl der Bissgefahr ist nicht mehr zu sehen

Auftrag: „Mein Sohn hatte sich an dem Text für die Bissgefahr gestört, bsp.: ‚Bissgefahr 8 %‘.
Können wir das entfernen, weil das den Kindern keinen Mehrwert bringt.“

**Entschieden vom Auftraggeber** — gegen die eigene Regel „Anzeigen werden benannt“ (11.10.2026):
die Zahl verschwindet aus dem Blick. **Wie:** `#hud-tension` bleibt im Dokument und wird `sr-only`.
So behält die Farbe des Balkens für Vorleser ihren Namen, und Unit-Tests und Anzeige-Sonde lesen
den Wert weiter. Die Farbregeln des Textes sind entfernt (toter Code). Auch „Runde beendet“ stand
in diesem Feld und ist damit nicht mehr zu sehen — das Ergebnis darunter sagt „Zugeschnappt!“.

**Bleibt:** der Fortschritt („6 von 10 gedrückt“), die Farbe und der Puls des Balkens, der
einmalige Hinweis darunter, die Erklärung im Regeln-Blatt (ohne „im Spiel steht sie als Zahl
dabei“) — und der **Mut der Runde** im Ergebnis („Dein mutigster Druck: 55 % Bissgefahr“). Den hat
der Auftraggeber nicht genannt; er ist nicht angefasst.

Gate **517 Tests in 37 Dateien**; `pruefen-anzeige.py` prüft statt der Textfarbe jetzt, dass die
Zahl nicht mehr sichtbar ist, `pruefen-bedienung.py` ohne Fund.


## Nachtrag 13.10.2026 (gebaut und abgenommen): zwei Bonusfiguren — Venusfliegenfalle und T-Rex

Auftrag: „ich möchte jetzt gerne noch zwei Tiere/Dinge hinzufügen als Bonus wenn man alle
vorherigen Modelle auf 3 Sterne bekommen hat. Hast du da eine Idee die cool, schwer oder auch
lustig ist?“ — danach Sparring (`grill-me`), dreizehn Fragen, jede vom Auftraggeber entschieden.

### Entschieden

| Frage | Entscheidung | Grund |
|---|---|---|
| Welche zwei? | **Venusfliegenfalle** (das „Ding“, lustig) und **T-Rex** (cool, das große Ziel) | die Falle ist das einzige Vorbild, das wirklich zuschnappt; der T-Rex ist die Endstufe nach dem Säbelzahntiger |
| Beide erst bei „alle auf drei Sternen“? | **gestaffelt:** Falle zuerst, T-Rex als Krönung | sonst liegen zwischen Runde 28 und dem Bonus rund 220 Runden ohne Neues |
| Zählen die Sterne der Falle mit? | **ja, eine Währung:** Sterne insgesamt, alles zählt | „noch X Sterne“ stimmt dann immer; eine Sonderzählung verstünde kein Kind |
| Schwelle der Falle | **20 Sterne** | braucht keinen dritten Stern (2 × 10 Tiere davor) |
| Schwelle des T-Rex | **28 Sterne** — erst 33 gewählt, nach der Simulation gesenkt | siehe „Simuliert“ |
| Stimme des T-Rex | das gemeinfreie Alligatorbrüllen, **tiefer gelegt** | keine Aufnahme möglich; Lizenz geklärt; klingt verwandt mit dem Krokodil, aber größer |
| Stimme der Falle | **Summen einer Fliege** | die Pflanze ist stumm; die Beute summt — beim Wählen und nach dem Biss, nie vor einem Urteil |
| Gesicht der Falle | **Comic-Pflanze mit Augen**, Wangen, Stiel, Blättern und Tontopf | Blick und Zittern gelten ohne Ausnahme; der Topf macht die Silhouette |
| Gebiss des T-Rex | 12 Zähne, **1–3 scharfe** | dritter Stern 2,8 % je Runde, der seltenste im Spiel; `MAX_LIVE_TEETH` bleibt 3. **Abgesagt:** 1–4 scharfe — Eingriff in eine Grenze, an der Modell und Auswahl schon zweimal auseinanderliefen |
| Gebiss der Falle | **8 Zähne**, 1–2 scharfe | neue Rundenlänge zwischen Maus (6) und Krokodil (10); dritter Stern 6,3 % |
| Vorher sichtbar? | **ja**, gesperrt wie alle anderen | die bestehende Regel; der T-Rex in der Auswahl ist der stärkste Grund weiterzuspielen. **Abgesagt:** Fragezeichen-Kacheln |
| Aussehen des T-Rex | **Orangebraun** mit Stirnstreifen, Höcker über den Augen, winzige Ärmchen | farblich weg vom Krokodil. **Abgesagt:** Federkamm (für T. rex nicht belegt) |
| Feier | **dieselbe** wie bei allen Tieren | kein gemerkter Zustand — Freischaltungen bleiben abgeleitet. Folge: wer schon 20 bzw. 28 Sterne hat, findet die Figur still offen vor |
| Abnahme | **beide zusammen**, ein Push — erst nach dem Ja des Auftraggebers zu Bild und Klang | Zeichnung und Stimme kann nur er beurteilen; jeder Push auf `main` veröffentlicht |

### Simuliert (5 000 Durchläufe, Modus „wie das Spielzeug“, volles Gebiss)

Gegenprobe: alle zehn Stammtiere offen nach 28 Runden (Median) — wie im Baum.

| Ziel | Runden (Median), zufälliger Wechsel | gezielt nur Tiere mit fehlendem Stern |
|---|---|---|
| Venusfliegenfalle, 20 Sterne | 49 | 44 |
| T-Rex, 28 Sterne | 181 | 129 |
| T-Rex, 30 Sterne | 290 | 176 |
| T-Rex, 33 Sterne (alle elf auf drei) | **761** (jedes zehnte Kind über 1 300) | 254 |

Die 246 Runden, die bisher für „alle zehn auf drei Sternen“ im Baum standen, gelten nur für
gezieltes Spielen. Wer seine Lieblingstiere spielt, braucht das Dreifache — deshalb 28 statt 33.

**Benannte Ausnahme:** die Regel „keine Schwelle braucht einen dritten Stern“ gilt für alle
Schritte **außer dem letzten**. Der T-Rex braucht mindestens sechs dritte Sterne (28 − 2 × 11).

### Belege

- **Venusfliegenfalle:** „Der Fangmechanismus ist mit einer Dauer von bis zu 100 Millisekunden …“;
  zuschnappen nach zwei Berührungen der Fühlborsten innerhalb von 20 Sekunden; Innenseite „bei
  Sonneneinstrahlung innenseitig stark rot gefärbt“ (de.wikipedia, *Venusfliegenfalle*, abgerufen
  13.10.2026). **Zähne hat sie keine** — es sind Randborsten; eine Zahl je Blatthälfte nennt weder
  der deutsche noch der englische Artikel, also steht keine im Spiel (`realTeeth: 0`).
- **T-Rex:** vier Zähne je Seite im Zwischenkieferbein, zwölf je Seite im Oberkiefer, dreizehn je
  Unterkieferast — zusammen 58 (en.wikipedia, *Tyrannosaurus*); „Der größte gefundene Zahn wird
  inklusive Zahnwurzel auf 30 cm Länge geschätzt“; Arme „nur einem Meter“; lebte „vor etwa 68 bis
  66 Millionen Jahren“ (de.wikipedia, *Tyrannosaurus*, abgerufen 13.10.2026).
- **Stimmen:** `public/sounds/voices/QUELLEN.md`.

### Plan

1. Katalog (`creature.ts`): `flytrap` und `trex`; `realTeeth: 0` erlauben und in der Kurzinfo als
   „keine Zähne, sondern Borsten“ sagen.
2. Freischaltung (`unlocks.ts`, Tests): Folge um 20 und 28 verlängern, Ausnahme benennen;
   „zur Venusfliegenfalle“ / „mit der Venusfliegenfalle“ (`unlockNotice.ts`).
3. Stimmen: schneiden, `CREATURE_VOICE_FILES`, `VOICES` in `public/sw.js`, `QUELLEN.md`.
4. Zeichnungen: `flytrap.ts`, `trex.ts`, Registry; Zahnsicht für jede Zahnzahl, offen und
   geschnappt als Bild ansehen.
5. Auswahl mit zwölf Kacheln auf dem kleinsten Handy nachmessen; Sonden auf zwölf Wesen ziehen.
6. Gate, Bau, Sonden gegen die gebaute Seite; README-Bild; Doku (`AGENTS.md`, `README.md`,
   `docs/testing.md`, `docs/workflow.md`, `docs/domain-model.md`).
7. Bilder und Stimmen dem Auftraggeber vorlegen — erst danach Commit und Push.

### Gebaut

Alle sieben Schritte, mit vier Dingen, die erst beim Bau auffielen:

1. **Die Auswahl war für zehn gebaut.** Die Tablet-Reihe stand auf `repeat(10, …)`: mit zwölf
   Wesen rutschten zwei Kacheln in eine zweite Zeile und die Seite scrollte auf 768 × 1024 und
   820 × 1180 (32 Funde in `pruefen-bedienung.py`). Jetzt zwölf Spalten, hochkant auf hohen
   Tablets 6 × 2, quer 3 × 4. Auf dem Handy sind es drei volle Viererreihen — gleich hoch wie
   vorher mit zehn.
2. **„Venusfliegenfalle“ bricht auf der 65-px-Kachel in drei Zeilen**, ihre Reihe war 100 statt
   87 px hoch (`pruefen-freischaltung.py`). Die Kachel trägt deshalb den Kurznamen „Fliegenfalle“
   (`shortName`); Sätze, Karte und Vorleser nennen den vollen Namen. **Selbst entschieden**, nicht
   im Sparring gefragt — wer den vollen Namen auf der Kachel will, braucht eine dritte Textzeile
   für alle Kacheln.
3. **Das Protokoll der Sonden öffnete die Bonusfiguren nicht** (16 Sterne). Es trägt jetzt zehn
   Tiere mit je drei Sternen (30).
4. **Das Regeln-Blatt sagte „Den dritten Stern brauchst du dafür nie“** — das stimmt für den
   T-Rex nicht mehr und ist umgeschrieben; „Krokodil, Mensch und T-Rex“ stellen 1–3 Zähne scharf.

**Zeichnung:** der erste T-Rex las sich mit rundem Kopf und abgespreizten Armen wie ein **Frosch**
(im gerasterten Bild gesehen). Danach: kantigerer Schädel mit eckigem Unterkiefer, kürzere, nach
unten geknickte Ärmchen, bernsteinfarbener Irisring. Bei der Venusfliegenfalle stand die
Mittelrippe in `upperExtra` und lag bei geschlossenem Maul als Strich mitten im Gesicht — entfernt.

**Fortschrittszeile:** bis zum T-Rex fehlen nach der Venusfliegenfalle bis zu acht Sterne; die
Zeile zeigt dann acht Sternzeichen. Gemessen mit sieben auf 320 px: sie bleibt im Kasten (274 px)
und die Seite scrollt nicht.

Gate **522 Tests in 37 Dateien**, `pnpm build`; gegen die gebaute Seite ohne Fund:
`pruefen-zahnsicht` (144 Zeichnungen), `-freischaltung`, `-bedienung`, `-tiere`, `-blick`, `-zoom`,
`-trefferflaeche`, `-halten`, `-offline`, `-anzeige`, `-blaetter`, `-blattbreite`. Beide Wesen
offen und geschnappt als Bild angesehen, dazu Auswahl, Freischaltung und Tablet-Ansichten im
Browser. Das README-Bild ist neu gebaut (zwölf Wesen, 4 × 3).

**Abgenommen vom Auftraggeber** (13.10.2026, „passt für mich“): die beiden Zeichnungen und die
zwei Stimmen. `cairosvg`
findet die GTK-Laufzeit nur, wenn `C:\Program Files\GTK3-Runtime Win64\bin` im `PATH` steht.
