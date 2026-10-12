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

## Nachtrag 12.10.2026 (gebaut, Hörprobe offen): Tierstimmen als Dateien

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
5. **Geladen wird erst nach der ersten Geste** und nur bei eingeschaltetem Ton (85 KB). Eine
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
| Mensch | **Platzhalter**, „Oh-oh“ aus zwei Sinustönen | mit `ffmpeg` generiert |
| Vampir | **Platzhalter**, vier fallende Sinustöne | mit `ffmpeg` generiert |

**Abweichungen vom Plan:**

- Der Plan sah vor, dass der Auftraggeber die Kandidaten **vor** dem Einbau anhört und Mensch und
  Vampir selbst generiert. Gebaut ist es umgekehrt: alles läuft mit einer ersten Auswahl, damit er
  im Spiel hören kann statt auf einer Kandidatenseite. Die drei generierten Stimmen sind schlichte
  Tonfolgen, **keine** KI-Klänge — sie halten den Platz, bis bessere da sind.
- **Maus:** auf Wikimedia Commons fand sich keine gemeinfreie Aufnahme. Der erste Treffer („Mouse
  in Antefasy“, CC0) war das gesprochene Wort in einem madagassischen Dialekt; aufgefallen an der
  Kategorie der Dateiseite, nicht am Titel.
- Die Ausschnitte hat ein Programm gewählt (lauteste Stelle), nicht ein Ohr.

**Offen — nur der Auftraggeber kann es:** die Hörprobe (klingt jede Stimme erkennbar und
freundlich, sind sie gleich laut, matscht es nach dem Biss?), bessere Klänge für Maus, Mensch und
Vampir, und ob der Panther eine echte Großkatze bekommen soll. Tauschen heißt: neu schneiden
(`scripts/stimme-schneiden.sh`) und die Zeile in `QUELLEN.md` ändern — kein Code.

Gate **345 Tests in 26 Dateien**. Nachweis §5z.
