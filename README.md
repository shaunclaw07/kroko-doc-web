# Zahn Agent

Das Zahn-Zufallsspiel um das Krokodil — Spielprinzip des Spielzeugs *Crocodile Dentist*
(bekannt als *Kroko Doc*) als Webapp: Zahn für Zahn antippen — einer ist der falsche, dann schnappt das Maul zu.
Man schaut **von vorne oben in das offene Maul** und kann zwischen Gebissen wählen:
Krokodil, Wolf, Mensch, Hai, Maus, Vampir, Panda, Löwe, Panther und Säbelzahntiger — und wer genug
Sterne sammelt, bekommt zwei Bonusfiguren dazu: die Venusfliegenfalle und den T-Rex. Mit Ton, einer Pause vor jeder Auflösung, Screen-Shake und
einer Statistikseite, die eure eigenen Runden auswertet.

![Zwölf Gebisse, je mit offenem Maul: Krokodil, Wolf, Mensch, Hai, Maus, Vampir, Panda, Löwe, Panther, Säbelzahntiger, Venusfliegenfalle und T-Rex](docs/bilder/gebisse.png)

**Warum es dieses Spiel gibt.** Ein Familienmitglied hat gefragt, ob man vorher berechnen
kann, welcher Zahn das Maul schließt. Antwort: nein — das Spielzeug ist ein mechanischer
Zufallsgenerator, und ein Teardown zeigt, dass sogar **1 bis 3 Zähne gleichzeitig** scharf
sind (make Magazin 1/2023). Also haben wir erst gerechnet (`../kroko-doc`, Python-Werkzeug
mit Chi²-Tests) und dann das Spiel mit dieser Rechnung im Bauch gebaut — inklusive der
Frage, ob das eigene Krokodil ehrlich zufällig ist.

---

## In fünf Minuten lokal starten

### Was du brauchst

| Voraussetzung | Prüfen mit | Nötig |
|---|---|---|
| Node.js **22.22 oder neuer** (oder 24.15+, oder 26+) | `node -v` | ja — die benutzten Fassungen verlangen es: Astro 7 `>=22.12.0`, vitest 5 `^22.12 \|\| ^24 \|\| >=26`, jsdom 30 `^22.22 \|\| ^24.15 \|\| >=26` |
| pnpm **9 oder neuer** | `pnpm -v` | ja — oder ein Befehl: `corepack enable` |
| Internet | — | **nur einmal** für `git clone` und `pnpm install` |
| Datenbank, Server, Konto | — | nein. Alles läuft lokal im Browser, Daten bleiben im `localStorage` |

Getestet habe ich die Anleitung mit **Node 26.5.1 und pnpm 12.6.0** (Baum ohne `node_modules` und
`dist/`, 14.10.2026, mit **astro 7.3.8 · vitest 5.0.4 · TypeScript 7.0.2 · jsdom 30.1.2**):
`pnpm install` läuft durch, 581 Tests grün, Bau fertig in 1,7–2,9 s (Maschinenstreuung; neun gemessene
Werte: 1,69 · 1,74 · 1,74 · 1,78 · 1,83 · 1,90 · 2,17 · 2,23 s sowie 2,84 s für den ersten Lauf eines
kalten Baums).

### Die drei Befehle

```bash
git clone git@github.com:shaunclaw07/zahn_agent.git   # ohne SSH-Schlüssel: https://github.com/shaunclaw07/zahn_agent.git
cd zahn_agent
pnpm install
pnpm dev
```

Dann im Browser öffnen: **<http://localhost:4321>**

> **Wichtig:** `localhost` verwenden, **nicht** `127.0.0.1`. Astro hört standardmäßig nur auf
> `localhost` (IPv6); über `127.0.0.1` bekommst du „Verbindung fehlgeschlagen". Wenn du
> lieber die IPv4-Adresse willst: `pnpm dev --host 127.0.0.1` (beides geprüft).

**Beenden:** `Strg + C` im Terminal. Der Entwicklungsserver lädt Änderungen an den Dateien
sofort neu — du kannst also direkt im Browser daneben probieren.

### Ohne Entwicklungsserver (so wie es ausgeliefert wird)

```bash
pnpm build      # statische Seite nach dist/  (fertig in ca. 1,8 s)
pnpm preview    # serviert dist/ auf http://localhost:4321
```

`dist/` ist eine reine statische Seite: du kannst sie zur Not auch mit
`python3 -m http.server` in `dist/` ausliefern. Es gibt keinen Server-Anteil.

### So probierst du es aus

Die Startseite zeigt das Spiel **und die drei Griffe, die man ständig braucht**: Tier, Zahnzahl und
„Neue Runde" stehen als große Knöpfe auf der Seite (auf dem Handy als Leiste am unteren Rand).
Hinter dem **Zahnrad** oben rechts liegt nur, was man einmal je Sitzung stellt.

1. **Spielen:** auf einen Zahn im Maul tippen. Du kannst ihn auch gedrückt halten — entschieden
   wird erst beim Loslassen, und wer den Finger wegschiebt, nimmt den Druck zurück. Beim Tippen
   hörst du einen Klang,
   gelegentlich zuckt das Maul (Fakeout), dann kommt entweder der
   nächste Zahn — erst nach einer Pause, die nichts über den Ausgang verrät — oder der **Biss** samt Screen-Shake und Vibration.
2. **Tier wählen:** zwölf **Bild-Kacheln** (Krokodil, Wolf, Mensch, Hai, Maus, Vampir, Panda, Löwe,
   Panther, Säbelzahntiger, Venusfliegenfalle, T-Rex) mit dem Kopf aus der eigenen Zeichnung. Zwei
   Kacheln tragen den **kurzen** Namen — „Säbelkatze" und „Fliegenfalle" —, weil der volle Name auf
   der schmalen Kachel eine dritte Zeile bräuchte und seine Reihe höher machen würde als die anderen
   (höchstens zwölf Zeichen, `MAX_TILE_LABEL_LENGTH` in `core/domain/creature.ts`; Sätze und
   Vorleser nennen immer den vollen Namen). Auf dem **Handy** öffnet der
   Griff „Tier" die Auswahl, ein Tipp auf eine Kachel wählt und schließt sie (zwei Tipps, alle zwölf
   Köpfe ohne Scrollen). Auf dem **Tablet** stehen die Köpfe dauerhaft offen (ein Tipp); quer liegt
   die Bühne links und die Köpfe rechts. Die Kurzinfo zum gewählten Tier steht im Regeln-Blatt.
3. **Zähne und neue Runde:** `−` / `+` stellen die Zahnzahl (erlaubt sind **1 bis 12**; ein anderes
   Tier bringt sein eigenes Gebiss mit: Krokodil 10, Wolf 12, Mensch 12). Bei **einem** Zahn ist
   dieser Zahn der scharfe — der erste Tipp schließt das Maul. „Neue Runde" steht immer da. Tier
   und Zahnzahl starten die Runde sofort neu, ohne Nachfrage.
4. **Zahnrad** (Knopf oben rechts): allein oder zu zweit, wie gefährlich („wie das Spielzeug" =
   1–3 Zähne gleichzeitig gefährlich, „nur ein Zahn" = genau einer), Ton und Wackeln an/aus, die
   Regeln und der Weg zur Statistikseite. Der Weg zurück ins Spiel ist „Fertig", das ✕ oder ein
   Tipp neben das Blatt. Das Blatt scrollt auf keinem der gemessenen Geräte.
5. **Nach dem Biss:** das Ergebnis (Verlierer, Zahn, mutigster Druck) steht auf der Seite, an der
   Stelle des Spielstands — **kein Blatt**, das man wegtippen muss. „Neue Runde" in der Leiste ist
   dann betont; ein Tipp startet die nächste Runde und räumt das Ergebnis weg.
6. **Statistik** (im Zahnrad, für Große): Häufigkeiten je Zahn, Chi²-Test gegen Gleichverteilung und
   gegen das Zugmodell, Wilson-Intervalle, Mustersuche (Autokorrelation), Rohdaten,
   CSV-Export/-Import und **„Protokoll löschen"** zum Zurücksetzen.
7. **Regeln** (im Zahnrad): zuerst die Kind-Regeln, darunter eingeklappt „Für Große: warum es keinen
   sicheren Zahn gibt" (und warum mehrere Lebewesen).

Zwei Eigenheiten, die normal sind: **Ton kommt erst nach dem ersten Tipp** (Browser erlauben
Audio erst nach einer Nutzeraktion — bis dahin plant die Ton-Engine gar nichts, nicht einmal einen
Audio-Kontext) und **die Daten liegen in
diesem einen Browser** — ein anderer Browser oder ein privates Fenster hat seine eigene Statistik.

---

## Alle Befehle

| Befehl | Was er tut | Erwartetes Ergebnis |
|---|---|---|
| `pnpm install` | Abhängigkeiten holen (nur Entwicklungs-Werkzeuge, keine Laufzeit-Pakete) | `Done in …` ohne Fehler |
| `pnpm dev` | Entwicklungsserver mit Sofort-Aktualisierung | <http://localhost:4321> → HTTP 200 |
| `pnpm build` | statische Seite nach `dist/` bauen | „Complete!", `dist/` mit `index.html`, `statistik/` |
| `pnpm preview` | `dist/` lokal ausliefern | <http://localhost:4321> → HTTP 200 |
| `pnpm test` | Tests im Wachmodus | läuft weiter, bis du abbrichst |
| `pnpm test:run` | Tests einmalig | **581 Tests in 48 Dateien**, alle grün |
| `pnpm vitest run src/render-probe.test.ts` | schreibt je Lebewesen ein SVG zum Ansehen (danach `scripts/artwork-png.py`) |
| `uv run --with cairosvg python scripts/galerie.py docs/bilder/gebisse.png` | baut das README-Bild aus den SVGs der Sonde (Reihenfolge = Katalogreihenfolge) | |
| `python scripts/stimme-suchen.py "wolf howl"` | gemeinfreie Tonaufnahmen auf Wikimedia Commons finden | Liste mit Dauer, Lizenz, Urheber und Adresse der Dateiseite |
| `bash scripts/stimme-schneiden.sh <quelle> <tier> <start> <dauer>` | eine Tierstimme schneiden (braucht `ffmpeg`) | `public/sounds/voices/<tier>.mp3: … Byte, Spitze vorher …` |
| `uv run --with playwright python scripts/pruefen-bedienung.py` | Sonde im echten Browser: scrollt etwas, verdeckt die Leiste etwas (der Server muss laufen) | „Auffälligkeiten: 0" |
| `pnpm typecheck` | TypeScript prüfen | keine Ausgabe = keine Fehler |
| `pnpm lint` | Biome prüfen (Funde, kein Formatieren) | „Checked … files", keine Funde |
| `pnpm gate` | Typen, Linter **und** Tests — die Prüfung vor jedem Commit | alle drei grün |
| `bash scripts/doku-pruefen.sh …` | Doku prüfen: Code-Zäune, Fließtext im Block, alte Werte (`ALTE_WERTE="…"`) | „Zaeune: … (paarig)"; Exit 1 = es steht noch etwas drin |
| `python3 scripts/doku-pfade-pruefen.py . …` | halten, ob jede in Backticks genannte Pfadangabe existiert | „Alle genannten Pfade existieren." |

Ports: Entwicklungs- und Vorschauserver benutzen **4321**. Belegt? `pnpm dev --port 4322`.

Alle Skripte mit Zweck und Aufruf: [`docs/workflow.md`](docs/workflow.md), Abschnitt „Skripte im
Baum". Dort steht auch Schritt für Schritt, wie man **eine Tierstimme ergänzt oder tauscht**.

---

## Was es kann

- **Spielen:** allein oder zu zweit im Hot-Seat, Maul schnappt zu, Verlierer wird benannt.
- **Für Kinder gebaut:** die Startseite zeigt Tier, Spielstand und drei große Griffe (Tier, Zähne, Neue
  Runde); nur Seltenes liegt hinter dem Zahnrad. Die Tier-Auswahl sind Bild-Kacheln aus der echten Zeichnung, und die
  Anzeigen sprechen in Worten („10 Zähne übrig", „6 von 10 gedrückt"). Die Technik-Erklärung
  (Bumerang, Rechenwerte) steht eingeklappt unter „Für Große".
- **Zwölf Gebisse:** Krokodil (10 Zähne, 1–3 gleichzeitig scharf), Wolf (12, 1–2 — zwei lange
  Fangzähne, drei breite Schneidezähne), Mensch (12, 1–3 — mit rostrotem Filzhut und Schnurrbart), Hai (12, 1–2 — runde Raubtierzähne, Kiemenschlitze am Kopf),
  Maus (nur 6 Nagezähne — die kürzeste Runde), Vampir (12, 1–2 — zwei lange Eckzähne, mit
  Stehkragen und Monokel),
  Panda (12, 1–2 — breite Mahlzähne statt Reißzähne, schwarze Ohren und Augenflecken), Löwe
  (12, 1–2 — Mähne aus Fellbüscheln, zwei lange Fangzähne und drei breite Schneidezähne),
  Panther (12, 1–2 — der melanistische Leopard: schwarzes Fell, gelbe Augen, **vier** Fangzähne,
  je einer oben und unten links und rechts), Säbelzahntiger (12, 1–2 — Smilodon mit zwei Säbeln
  oben, beim echten Tier bis 20 cm lang, geflecktem Fell und kleinen dunklen Ohren). Dazu zwei
  **Bonusfiguren**, die sich erst spät öffnen: die Venusfliegenfalle (8, 1–2 — eine Pflanze im
  Tontopf; was wie Zähne aussieht, sind Borsten am Rand der Klappe; ab 20 Sternen) und der T-Rex
  (12, 1–3 — orangebraun mit Stirnstreifen, Höckern über den Augen und winzigen Ärmchen; ab 28
  Sternen das letzte Ziel, im Median nach 181 Runden). Jedes
  Gebiss zeichnet sich selbst: Blick von vorne oben in den Rachen, eigenes Zahnprofil, eigene
  Kopfform, eigenes Zahnfleisch.
- **Startet ohne Netz und lässt sich installieren:** ein Service Worker (`public/sw.js`, von Hand
  geschrieben, ohne Paket) hält beide Seiten, ihre Bausteine, die Symbole und die zwölf Tierstimmen
  vor. Mit Netz kommt die Seite immer frisch vom Server, ohne Netz aus dem Vorrat. Er wird nur im
  Bau angemeldet, nicht im Entwicklungsserver. **Gegen Datenverlust hilft er nicht:** der Vorrat
  liegt im selben Browserprofil wie das Rundenprotokoll — verwirft ein Browser beim Schließen seine
  Daten (gemeldet für das Kinderprofil eines Fire-Tablets), ist beides weg.
- **Eigenes App-Symbol:** Tab, Lesezeichen und Startbildschirm zeigen den **Krokodilkopf aus der
  eigenen Zeichnung** — mit geschlossenem Maul (dieselben Regeln, mit denen die App beim
  Zuschnappen schließt). **Auch das Zeichen im Kopfbereich der Seite ist dieselbe Datei**
  (`public/logo.svg`; dort stand bis zum 11.10.2026 ein von Hand gezeichnetes Krokodil ohne Bezug
  zur Zeichnung). Das Symbol wird **erzeugt**, nicht gemalt: `ICON_NEU=1 pnpm test:run`
  schreibt die SVGs aus der Zeichnung, `uv run --with cairosvg python scripts/icon-png.py` rastern
  die PNG-Größen für Android und iPhone. Ein Test in `src/icon.test.ts` hält die ausgelieferten
  Dateien an der Zeichnung fest — ändert sich das Krokodil, fällt er auf. Derselbe Test hält fest,
  dass im Kopfbereich beider Seiten **kein** zweites Krokodil mehr steht.
- **Zahnzahl einstellbar:** 1 bis 12 drückbare Zähne, standardmäßig so viele, wie das Tier
  vorsieht. Das kleinste Gebiss ist **ein einziger Zahn** (Wunsch vom 11.10.2026): dann greift die
  Auswahl der scharfen Zähne auf genau diesen zu, der erste Tipp schließt also das Maul — in beiden
  Zufallsmodellen. Die Zähne sitzen auf einem Ring **um das ganze Maul** (obere und untere Reihe), damit
  jedem Zahn auf einem **320 px breiten Gerät** (der schmalsten Bühne, die die Seite tragen muss:
  286 px) eine Trefferfläche von mindestens 44 × 44 Pixeln bleibt — im Browser gemessen 44,15 px,
  vorher 42,9. Bei 16 Zähnen wären es nur noch 38 px, deshalb ist bei 12 Schluss. Ein Test rechnet
  das für jedes Lebewesen nach; wo der halbe Zahnabstand kleiner ist als die Vorgabe (11 und 12
  Zähne auf einem 320-px-Gerät), nennt er die Grenze beim Namen: Maus bei 12 Zähnen 37,1 px.
  Mehr Zähne heißt mehr Drücke: der Wolf beißt später zu (bei 12
  Zähnen 5,42 erwartete Drücke statt 4,69).
- **Kindgerecht gezeichnet:** warme Farben, runde Zähne, große runde Augen mit Glanzpunkt und
  hellblauem Irisring (wie beim Original-Spielzeug), rosa Wangen und weiche Umrisse; der Rachen ist
  rosenrot statt schwarz, das Zahnfleisch die hellste Stufe. Das Krokodil trägt das satte Grün des
  Originals (und fällt damit bewusst aus der Reihe der neun anderen Lebewesen), seine
  Schnauzenfalten sind Rillen mit Grat. Maul, Zähne und Gesicht werden auf den Kopfumriss
  beschnitten, damit beim Zuschnappen nichts daneben hängt. **Dieselbe Zeichnung trägt auch die
  Auswahl-Kacheln** (`portrait()`): der Kopf des Tieres als Bild, ohne Bedienteile — kein
  zusätzliches Asset.
- **Erweiterbar:** ein neues Lebewesen ist ein Katalogeintrag plus eine Zeichnungsdatei — ein
  Test erzwingt, dass Zahnzahl, Zahnformen und Ebenen zusammenpassen.
- **Zwei Zufallsmodelle:** `original` (1–3 Zähne gleichzeitig scharf, wie das echte Spielzeug —
  in der Oberfläche „wie das Spielzeug") und `classic` (genau ein scharfer Zahn — „nur ein Zahn").
- **Tierstimmen:** jedes Tier meldet sich, wenn es gewählt wird, und kurz nach dem Biss; wer ein
  anderes Tier wählt, bricht ab, was vom vorigen noch klingt. Das sind
  die einzigen Klänge aus **Dateien**: zwölf MP3 von höchstens 1,5 s (zusammen 118 KB) unter
  `public/sounds/voices/`, Herkunft und Lizenz daneben in `QUELLEN.md`. Elf sind gemeinfreie
  Aufnahmen (Wikimedia Commons, die Fliege von BigSoundBank) — der Mensch sagt „Servus“, der
  Vampir lacht gruselig, bei der Venusfliegenfalle summt ihre Beute, und der T-Rex brüllt mit der
  tiefer gelegten Stimme des Alligators; **die Maus ist vorerst ein generierter Platzhalter**.
  Geladen wird erst nach dem ersten Tipp und nur bei eingeschaltetem Ton.
- **Nervenkitzel:** Halten statt Tippen (das Urteil kommt beim Loslassen), Augen, die dem Finger
  folgen, ein Kiefer, der mit der Bissgefahr zittert, eine Bühne, die ab 50 % Bissgefahr näher an das
  Maul rückt,
  synthetisierte Spielklänge (Web Audio, keine Dateien), Knarren, das mit der
  Spannung lauter und höher wird (die Spannung ist die Biss-Wahrscheinlichkeit des nächsten Drucks), Fakeout-Zucken des Mauls, eine Feder, die den Zahn in die Wurzel zieht, und die Pause vor jedem Urteil (ihre Länge sagt nichts über den Ausgang),
  Screen-Shake, Vibration bei jedem Zahndruck und beim Biss (wo der Browser sie kann), „Nur noch ein Zahn — der ist garantiert scharf!".
- **Der Balken sagt zwei Dinge:** die **Füllung** ist der Fortschritt („6 von 10 gedrückt"), die
  **Farbe** ist die Bissgefahr des nächsten Drucks (die Zahl dazu steht seit dem 13.10.2026 nur
  noch für Vorleser da, zu sehen ist allein die Farbe) — er pulsiert mit steigender
  Gefahr schneller, glüht ab 30 % und wird ab 50 % rot — einen Druck vor dem letzten, sodass ein roter
  Druck auch gutgehen kann. **Ist das Maul zu, entfällt die Gefahr-Aussage:** keinen nächsten Druck,
  also auch keinen Prozentwert — dort steht dann „Runde beendet", die Füllung bleibt der Fortschritt
  und trägt keine Gefahrfarbe. Beim ersten Druck einer Sitzung
  erklärt er sich einmal selbst; nachlesen kann man ihn im Blatt „Regeln" (dort eingeklappt unter
  „Für Große") und auf der Statistikseite (dort steht die ganze Kurve).
- **Der Mut der Runde:** das Ergebnis nennt die höchste Bissgefahr, bei der ein Druck noch harmlos
  blieb („Dein mutigster Druck: 55 % Bissgefahr — und der Zahn war harmlos."). Das gibt dem Balken
  einen Zweck: die Gefahr, die man übersteht, ist das, was am Tisch erzählt wird.
- **Wusstest du?** Nach dem Biss steht unter dem Ergebnis ein Satz über das **echte** Tier („Die
  Nagezähne einer Maus wachsen ihr ganzes Leben lang. Darum nagt sie so viel.“). Je Tier ein Satz,
  jeder mit Quelle belegt (`docs/tier-quellen.md`), keiner sagt etwas über scharfe Zähne. Wo die Höhe nicht
  für Ergebnis **und** Satz reicht, entfällt der Satz: auf Handys unter 700 px Höhe und auf Tablets
  quer unter 900 px (gemessen, `scripts/pruefen-bedienung.py`).
- **Tier-Album:** jedes Tier kann drei Sterne sammeln — ★ **gespielt**, ★★ **halb geschafft** (die
  Hälfte der Zähne war harmlos) und ★★★ **bis zum letzten Zahn**. Stern zwei und drei gibt es ab
  dem ganzen Gebiss des Tiers — mehr Zähne zählen mit; wer weniger einstellt, liest vor dem ersten
  Druck „Nur der erste Stern: für alle drei braucht es mindestens 10 Zähne.“ Die Sterne stehen an den Kacheln der Tier-Auswahl, ein neuer Stern
  wird nach dem Biss beim Namen genannt („Neuer Stern: Maus — gespielt!"). Sie sind **abgeleitet**
  aus dem Rundenprotokoll, nicht gespeichert — und sie sind Glück, kein Können: der dritte Stern
  gelingt je Runde in 2,8 % (Mensch) bis 8,3 % (Maus) der Fälle.
- **Tiere freischalten:** am Anfang sind Krokodil, Maus und Wolf offen. Die übrigen sieben öffnen
  sich über die **Gesamtzahl der Sterne** — Hai bei 3, dann alle 2 Sterne ein Tier, der
  Säbelzahntiger bei 15. Der seltene dritte Stern wird dafür nie gebraucht. Gesperrte Tiere stehen
  als Schattenriss mit Schloss in der Auswahl, das nächste zeigt „Noch 2 Sterne“; nach dem Biss
  steht der Weg dorthin über der Bühne (Sternzeichen, Schattenriss, Satz), und eine Freischaltung
  bringt das Kopfbild, den Knopf „Mit dem Hai spielen“ und Konfetti. Auch das ist **abgeleitet**
  aus dem Rundenprotokoll: kein eigener Speicher, kein Schalter.
- **Statistik:** jede Runde wird lokal protokolliert; die Statistikseite wertet **je Gebiss** aus —
  Tier, Zahnzahl und Modus bestimmen eine Gruppe, die größte steht offen, die übrigen sind
  eingeklappt. Je Gruppe: Häufigkeiten, die **mutigste Runde** („Mutigste Runde", `bravestRound`),
  Chi²-Tests gegen Gleichverteilung **und** gegen das Zugmodell, Wilson-Intervalle,
  Autokorrelation (Mustersuche). CSV-Export/-Import im Format des Analyse-Werkzeugs.
- **Ehrlich:** unter 100 Runden **je Gruppe** gibt es keine Signifikanz-Aussage, sondern den Hinweis,
  dass die Daten zu dünn sind. Ein Test, der bei diesem Gebiss nicht läuft (etwa die
  Druck-Position gegen die Gleichverteilung — die gilt nur im Modus „genau ein Zahn"), wird gar
  nicht erst gezeigt, und „passt zu den Daten" steht nur da, wenn wirklich geprüft wurde.
- **Kein Netz nötig:** keine externen Schriften, Bilder, CDNs; alles lokal, mobil zuerst — auch die
  Tierstimmen kommen vom eigenen Ursprung.

---

## Zahlen, die belegt sind

| Größe | Wert | Herkunft |
|---|---|---|
| Tests | **581 in 48 Dateien**, alle grün | `pnpm test:run` |
| Vibration | Port mit `isSupported()`; 25 ms bei jedem Zahndruck, [120, 50, 220] beim Biss | `TAP_VIBRATION_MS`/`BITE_VIBRATION_PATTERN` in `core/ports/haptics.ts`, Adapter mit eigenem Test |
| Typenprüfung | keine Fehler | `pnpm typecheck` |
| Linter | keine Funde in 140 Dateien | `pnpm lint` (Biome, Regelsatz „recommended"; kein Formatierer) |
| Produktionsbau | 2 Seiten, 1,7–2,9 s (Maschinenstreuung; gemessen 1,69 · 1,74 · 1,74 · 1,78 · 1,90 s, kalt 2,84 s) | `pnpm build`, Arbeitsbaum und frischer Baum |
| Abhängigkeiten | astro **7.3.8**, vitest **5.0.4**, TypeScript **7.0.2**, jsdom **30.1.2**, @types/node 26.6.5, @biomejs/biome **2.5.15** (Linter) | `package.json`, `pnpm-lock.yaml` (angehoben am 14.10.2026) |
| Spannungsbalken | = Biss-Wahrscheinlichkeit des nächsten Drucks (Krokodil: 20,0 → 100 %) | `core/domain/tension.ts`, Kurve im Test festgenagelt |
| P(Biss beim 1. Druck) | 20,0 % | Rechnung `core/domain/probabilities.ts`, geprüft gegen Python |
| Erwartete Drücke bis zum Biss | 3,972222 (Krokodil, 10 Zähne) · 4,694444 (12 Zähne) | ebenda |
| 4 Spieler reihum | 33,9 % / 28,3 % / 20,7 % / 17,0 % | ebenda (Startspieler verliert am häufigsten) |
| Letzter Zahn | 3,333 % und dann garantiert scharf | ebenda |
| Schließweg des Oberkiefers | Krokodil 232,0 · Mensch 226,0 · Wolf 222,0 · Löwe 222,0 · Säbelzahntiger 222,0 · T-Rex 222,0 · Hai 220,0 · Panther 220,0 · Panda 220,0 · Maus 210,0 · Vampir 198,0 · Venusfliegenfalle 178,0 SVG-Einheiten (**alle zwölf**) | berechnet als `2·ry − Banddicke oben − Banddicke unten`, am 14.10.2026 für alle zwölf nachgerechnet |
| Trefferfläche je Zahn | 44,15 px bei 320 px Blick · 50,1 px bei 360 px · 54,7 px bei 390 px (je 10 Zähne) | **gerechnet**: 2 · Trefferradius 49,4 px · Skala (286/640) = 44,15 px. `getBoundingClientRect` eines `.tooth__hit` ist dafür **kein** Maß — die Trefferbox ist auf dem Ring gedreht, und der Browser liefert ihr Achsen-Rechteck (52,48 px, gemessen). Test in `creatureViews.test.ts` auf der schmalsten Bühne 285 px |
| Tier-Auswahl der veröffentlichten Seite | **12 Kacheln** in der Reihenfolge der Freischaltung (Krokodil, Maus, Wolf, Hai … Panther, Säbelzahntiger, Venusfliegenfalle, T-Rex), 12 sichtbare Kopfbilder mit 12 **eigenen** Beschnitten, 71 px Kachelbild bei 390 px Breite, zwei Kacheln mit kurzem Namen („Säbelkatze“, „Fliegenfalle“), dazu die Notizen von Löwe und Panther im Blatt | `scripts/pruefen-tiere.py https://zahn-agent.schaflabs.com` im echten Chromium, Messung 14.10.2026 |

---

## Aufbau

```
src/core/domain/       Fachregeln: Katalog, Zähne, Runde, Wahrscheinlichkeiten, Spannung, Statistik,
                       Album, Freischaltung, Einstellungen
src/core/ports/        Nähte: RandomSource, LiveTeethSelector, RoundLogPort, RemoteLogPort, SoundPort,
                       HapticsPort, SessionMarkPort
src/core/use-cases/    playPress — ein Druck samt Dramaturgie; syncRoundLog — Abgleich mit der Sicherung
src/contract/          Außenvertrag (Rundenprotokoll, CSV-Format)
src/infrastructure/    crypto-Zufall, Web-Audio-Klänge und Stimmen, Vibration, localStorage, Sicherung, Testattrappen
src/presentation/      Verdrahtung der Seiten, Spielsteuerung, Einstellungen, Statistikseite
  game/creatures/      je Lebewesen ein Zeichnungsmodul + Fabrik + Registry
  styles/              Stile je Bauteil; app.css ist nur die Reihenfolge der Importe
src/pages/             die zwei Astro-Seiten (Spiel, Statistik)
worker/                Cloudflare-Worker der Sicherung (gehört zu keiner Schicht)
public/sounds/voices/  je Lebewesen eine Stimme als MP3, Herkunft und Lizenz in QUELLEN.md
scripts/               pruefen-alle.py — alle 13 Sonden auf einmal (pnpm probes); sonde.py — ihr Gerüst
                       artwork-png.py — Zeichnung ohne Browser rastern (Prüfhilfe)
                       galerie.py — README-Bild der Gebisse aus den SVGs der Sonde bauen
                       pruefen-*.py — Sonden am lebenden Gegenstand (Tiere, Trefferfläche, Blatt)
                       pruefen-zahnsicht.py — liegt ein Zahn unter dem Gesicht (jede Zahnzahl)
                       doku-pruefen.sh, doku-pfade-pruefen.py — Doku prüfen (Zäune, alte Werte, Pfade)
                       stimme-suchen.py, stimme-schneiden.sh — Tierstimmen finden und schneiden
```

Der Kern kennt weder Browser noch Uhr: Zufall kommt über einen Port herein, die Zeit über
eine injizierte Quelle. Das ist der Grund, warum die Fachlogik in jsdom und im Terminal
prüfbar ist.

Regeln für Arbeit am Baum: [`AGENTS.md`](AGENTS.md) und [`docs/`](docs/).
Nachweise der Prüfläufe: [`docs/e2e-nachweise.md`](docs/e2e-nachweise.md).
Sprachregel (Bezeichner englisch, Kommentare und Doku deutsch):
[`docs/language-guidelines.md`](docs/language-guidelines.md).

## Daten und Datenschutz

- Alle Runden liegen im **`localStorage`** des Browsers (`zahn_agent:rounds:v1`, `zahn_agent:settings:v1`) — kein Server, keine
  Konten, keine Telemetrie. Runden und Einstellungen aus Fassungen mit früherem Namen (`zahn-agent:…`,
  `kroko-doc-web:…`) werden beim ersten Laden einmalig übernommen.
- **Zurücksetzen:** Statistikseite → „Protokoll löschen" (löscht das Rundenprotokoll — und damit die Sterne im Tier-Album, die daraus gerechnet werden; die Nachfrage sagt das).
- **Tierstimmen** sind Dateien vom eigenen Ursprung (`sounds/voices/`), geladen nach dem ersten Tipp
  und nur bei eingeschaltetem Ton — kein fremder Server, nichts wird übertragen.
- **Sichern/umbenennen:** CSV exportieren; die Datei kannst du wieder importieren oder dem
  Python-Werkzeug `../kroko-doc/kroko_analyse.py` geben.
- CSV-Kopf (bewusst deutsch, weil es die Schnittstelle zum Analyse-Werkzeug ist):
  `runde;reihenfolge;verlierer_zahn;modus;zaehne;lebewesen;…`

## Auf GitHub Pages

Die Seite ist veröffentlicht: **<https://zahn-agent.schaflabs.com/>**

- [`.github/workflows/pages.yml`](.github/workflows/pages.yml) baut bei jedem Push auf `main` und
  liefert `dist/` aus. Dort läuft `pnpm gate` mit — eine rote Suite verhindert die Veröffentlichung.
- Die Domain gehört dem Repo über `public/CNAME`; der DNS-Eintrag liegt bei Cloudflare
  (`zahn-agent.schaflabs.com` als CNAME auf `shaunclaw07.github.io`). Weil die Seite damit auf
  der Wurzel liegt, baut der Workflow **ohne** `ASTRO_BASE` — Basis-Pfad `/`.
- Interne Verweise im Code gehen trotzdem über `import.meta.env.BASE_URL` und nie absolut mit
  `"/"` — das hält die Seite heil, falls sie je wieder unter einem Unterpfad laufen soll.
- Die alte Projektadresse `https://shaunclaw07.github.io/zahn_agent/` leitet mit `301` auf die
  Domain um (mit und ohne Schluss-Schrägstrich geprüft, 11.10.2026).
- `dist/` ist nicht im Repo; veröffentlicht wird nur, was der Workflow baut.

## Wenn etwas klemmt

| Symptom | Ursache | Lösung |
|---|---|---|
| `pnpm: command not found` | pnpm fehlt | `corepack enable` (kommt mit Node) oder `npm i -g pnpm` |
| `ERR_PNPM_IGNORED_BUILDS` bzw. „Ignored build scripts" | pnpm führt Installationsskripte nicht mehr ungefragt aus | `pnpm approve-builds --all` — erlaubt `esbuild` und `sharp`, schreibt es in `pnpm-workspace.yaml` |
| „Verbindung fehlgeschlagen" im Browser | Server hört nur auf `localhost` (IPv6) | `localhost` statt `127.0.0.1` verwenden, oder `pnpm dev --host 127.0.0.1` |
| Port 4321 belegt | anderer Server läuft | `pnpm dev --port 4322`, dann `http://localhost:4322` |
| Kein Ton | Browser erlaubt Audio erst nach einer Nutzeraktion | einmal ins Maul tippen; Ton in den Einstellungen muss an sein |
| Ein Tier bleibt stumm, die Spielklänge laufen | die Stimmdatei fehlt, ist noch nicht geladen oder kam mehr als 0,5 s zu spät | Netzwerk-Reiter der Entwicklerwerkzeuge: `sounds/voices/<tier>.mp3` muss mit 200 kommen; das Tier noch einmal wählen. Ohne Netz beim ersten Versuch wird beim nächsten Anlass neu geladen |
| **Handy vibriert nicht** | Auf Android kann es das Gerät unterdrücken: die Vibration braucht **keine** Berechtigung, Chrome hat deshalb **keine** Website-Einstellung dafür. Laut MDN halten Stumm-/Nicht-stören-Modus und eine abgeschaltete Systemvibration sie zurück; auf iOS/Safari gibt es die Schnittstelle gar nicht | Der Schalter ist dann **abgeblendet** und die Einstellungen sagen es im Klartext. Auf Android bleibt sonst nur die Systemseite zu prüfen: Einstellungen → Töne und Vibration (Intensität nicht auf 0), Stumm-Modus auf Vibrieren, Nicht stören aus. Belegte Ursachen laut [MDN, `Navigator.vibrate`](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate): Stumm- bzw. Nicht-stören-Modus und eine abgeschaltete Systemvibration |
| Vibration sehr schwach | manche Geräte setzen kurze Stöße unter ~20 ms nicht um | die App nutzt 25 ms bei **jedem Zahndruck** und drei Stöße (120/50/220 ms) beim Biss |
| Node-Fehler beim Start („Unsupported engine") | Node zu alt | Node **22.22+** installieren (oder 24.15+, oder 26+; Astro 7 verlangt `>=22.12.0`) |
| `pnpm install` scheitert an einem Firmennetz/Proxy | Registry nicht erreichbar | `pnpm config set registry https://registry.npmjs.org/` |

## Herkunft und Grenzen

- Das Spielprinzip stammt vom Spielzeug *Crocodile Dentist* (Hasbro, 1990, hierzulande als
  *Kroko Doc* bekannt). Diese App ist eine eigenständige Umsetzung ohne Marken- oder
  Gestaltungsübernahme, und der Projektname **Zahn Agent** ist davon unabhängig gewählt (technisch `zahn_agent`); Zahlen und Mechanik beruhen
  auf öffentlich beschriebenen Analysen (make Magazin 1/2023, Wikipedia).
- **Am Gerät bestätigt, im Baum nur mittelbar:** Der Durchlauf am Handy des Nutzers hat die
  Vibration bestätigt (25 ms bei jedem Zahndruck, drei Stöße beim Biss) — im Baum steht kein
  Browser. Das übrige Verhalten ist in jsdom (Bedienungs- und Statistiksonde) und über gerenderte
  Standbilder der Zeichnung belegt (`pnpm vitest run src/render-probe.test.ts`, dann
  `scripts/artwork-png.py`); das Gefühl am Gerät in allen Feinheiten prüft nur ein Mensch.
- **Tierstimmen:** elf gemeinfreie Aufnahmen (acht Public Domain, drei CC0) und ein generierter
  Platzhalter (Maus), alle mit Urheber, Lizenz und Quelle in
  [`public/sounds/voices/QUELLEN.md`](public/sounds/voices/QUELLEN.md).
  Das Heulen des Wolfs stammt aus dem Tonarchiv des Yellowstone-Nationalparks (**National Park
  Service** & MSU Acoustic Atlas / Jennifer Jerrett), die übrigen Aufnahmen von Wikimedia Commons.
  Der Panther faucht als Hauskatze, der Säbelzahntiger knurrt als Tiger, der Hai blubbert — echte
  gemeinfreie Aufnahmen gab es dafür nicht. Die Ausschnitte hat ein Programm gewählt; angehört
  und abgenommen hat sie der Auftraggeber am 12.10.2026 am lokalen Entwicklungsserver; am Handy
  sind sie nicht geprüft.
- **Tier-Sätze („Wusstest du?"):** jeder ist belegt, die Quellen stehen in `docs/tier-quellen.md`. Die
  Zahl „Echtes Gebiss: 32 Zähne" beim Krokodil ist dagegen **nicht** belegt und vermutlich zu
  niedrig — sie steht dort als offener Punkt.
- Veröffentlicht wird über GitHub Pages (siehe oben, ausgeliefert wird nur der gebaute Stand);
  einen eigenen Server gibt es nicht, und die Spieldaten bleiben im `localStorage` des Browsers.

## Änderungen selbst hochladen

```bash
git add <datei>            # nie `git add -A` — das löscht versehentlich Dateien mit
git commit -m "…"
git push                   # Hauptzweig ist `main`, direkte Commits
```

Vor jedem Commit: `pnpm gate` (Typen + Linter + Tests); vor jedem Push läuft es über
`.githooks/pre-push` von selbst und bricht bei Rot ab. Architekturtests
(`src/architecture.test.ts`) dürfen nie rot sein — sie erzwingen die Schichtentrennung.
