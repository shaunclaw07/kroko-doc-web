# Anleitung: ein Tiermodell zeichnen

Für jedes **neue** Lebewesen und jede Änderung an einem bestehenden. Die Schritte im Katalog, in
der Registry und bei der Stimme stehen in `AGENTS.md` („Ein neues Lebewesen ergänzen"); hier steht,
**wie die Zeichnung selbst entsteht**, damit sie zu den anderen passt und kein Zahn verdeckt wird.

Anlass (12.10.2026): bei allen zehn Tieren lagen die Augen auf dem Zahnring. Je nach Zahnzahl
rutschte ein Zahn darunter — beim Panda bis 100 %, beim Hai 82 %, beim Krokodil 49 %. Die Tests
sahen nichts, weil sie Markup prüfen und keine Deckung.

## 1. Die Ebenen — wer liegt über wem

Die Fabrik (`src/presentation/game/creatures/factory.ts`) malt in fester Reihenfolge, das spätere
deckt das frühere:

| Ebene | Feld | Was hinein gehört |
|---|---|---|
| Körper | `body` | Kopf, Fell, alles was **über den Kopfumriss hinausragt** (Hut, Kragen, Ohrspitzen) |
| Maulöffnung, Rachen | `holeFill`, `inner` | — |
| Schnauze | `upperShell`, `upperExtra` | Nase, Schnauzenfalten, ein Schnurrbart — fährt beim Biss mit. Bei geschlossenem Maul verschwindet die Schnauzen**fläche**; was in `upperExtra` steht, bleibt und ist dann nach unten gerutscht |
| Oberkiefer | `upper` + obere Zähne | — fährt beim Biss zu und verschwindet danach |
| untere Zähne, Unterkiefer | `lower`, `lowerExtra` | Kinnkante |
| **Gesicht** | `face` | Augen, Brauen, Wangen, Schnurrhaare, Ohren im Umriss — **über allem** |

Alles ab der Maulöffnung wird auf `silhouette` beschnitten. Daraus folgen die zwei Regeln, an denen
fast jeder Fehler hing:

- **Was im Gesicht steht, liegt über den Zähnen.** Es darf den Zahnring nicht berühren (Abschnitt 2).
- **Was im Körper steht, verschwindet unter der Schnauzenfläche** (`upperShell`), soweit diese
  reicht. Was dort sichtbar sein soll, gehört ins Gesicht — solange es im Umriss bleibt.
- **… aber nur, solange das Maul offen ist.** Beim Zuschnappen fährt die Schnauzenfläche weg und
  verschwindet; was sie verdeckt hat, liegt dann offen. Die Ohren des Vampirs liefen als Dreiecke
  bis unter die Augen — offen unsichtbar, geschlossen zwei Striche quer durchs Gesicht (13.10.2026).
  Was unter der Schnauze endet, endet dort **ohne Strich** oder gar nicht erst so weit innen.
- **Was sich mit der Nase bewegen soll, gehört in `upperExtra`, nicht ins Gesicht.** Das Gesicht
  bleibt beim Biss liegen: der Schnurrbart des Menschen blieb dort am Hut hängen.

## 2. Der Zahnring ist Sperrgebiet für das Gesicht

Die Zähne stehen mit der Wurzel **auf** der Ringellipse (`ring.cx/cy/rx/ry`) und zeigen nach innen.
Wo ein Zahn steht, hängt an der eingestellten Zahnzahl (1 bis 12) — über alle Zahlen gesehen ist
der ganze Ring belegt. Deshalb:

> **Keine Form des Gesichts ragt in die Ringellipse.** Augen, Iris, Wangen, Ohren und Zubehör liegen
> im Fellstreifen zwischen Ring und Kopfumriss.

Der Test „hält Augen, Wangen und Ohren aus dem Zahnring heraus" (`creatureViews.test.ts`) prüft das
für jede `<ellipse>` und jeden `<circle>` in `face`, samt halber Strichstärke und 2 Einheiten
Abstand. Er verlangt außerdem, dass diese Formen **kein `transform`** tragen — eine gedrehte Form
läge woanders, als ihre Attribute sagen. Pfade (Brauen, Schnurrhaare, Kiemen) kann der Test nicht
rechnen; die misst die Sonde aus Abschnitt 4.

**Nicht** die Lösung (beide verworfen): die Zähne über das Gesicht malen (dann liegt ein Zahn auf
dem Augapfel) und die Zähne um die Augen herum verteilen (das verkleinert die Trefferflächen, die
bei 11 und 12 Zähnen ohnehin unter 44 px liegen).

## 3. Augen setzen — erst messen, dann zeichnen

```bash
pnpm vitest run src/render-probe.test.ts                                   # schreibt die SVGs
uv run --with playwright python scripts/pruefen-zahnsicht.py --freiraum panda
```

Die Karte zeigt für die linke Kopfhälfte je Rasterpunkt `Abstand zum Ring / Abstand zum Umriss`.
Ein Auge mit Radius r passt dorthin, wo **beide** Zahlen größer als r plus halbe Strichstärke sind;
`...` liegt im Ring, `---` außerhalb des Kopfes. Der Umriss-Abstand zählt auch Teilpfade im
Kopfinneren (Ohrkreise von Maus, Löwe, Panda) — dort ist eine kleine Zahl kein Beschnitt, sondern
die Ohrkante.

Dann:

1. **Den Punkt mit dem meisten Platz suchen**, nicht den schönsten. Bei breiten Köpfen (Krokodil,
   Mensch, Wolf, Maus, Vampir) liegt er oben außen, bei den Katzen, beim Panda und beim Hai näher
   an der Stirnmitte neben der Nase — dort ist der Streifen am breitesten.
2. **Die Größe folgt dem Platz.** Heutige Linsen (rx × ry): Krokodil 33 × 29, Mensch und Wolf
   33 × 28, Vampir 30 × 26, Maus 28 × 25, Hai 28 × 25, Panther 27 × 24, Löwe 25 × 22,
   Säbelzahntiger 24 × 21, Panda 18 × 17 im Fleck 29 × 26, T-Rex 27 × 24, Venusfliegenfalle
   26 × 23. Kleiner als etwa 24 × 21 wird ein Auge
   auf dem Handy zum Punkt — dann lieber den Kopfumriss oben anheben, als das Auge weiter schrumpfen.
3. **Das Auge bleibt eine Kullerlinse:** weiße Ellipse mit Umriss in der dunkleren Fellfarbe,
   Pupille (`class="pupil"`, dunkelbraun oder Farbe, nie schwarz, nie ein Schlitz), ein Glanzpunkt
   oben links. Pupille etwa 45 % der Linsenbreite, Glanzpunkt etwa 18 %. Wer ein Auge verkleinert,
   skaliert **alle** Teile und ihre Versätze mit.
4. **Brauen nur, wo Platz ist.** Ist zwischen Auge und Kopfrand weniger als rund 10 Einheiten frei,
   liegt die Braue als **Lid** direkt auf der oberen Augenkante (ein Bogen mit denselben Radien wie
   das Auge, z. B. `M 113 98 A 34 30 0 0 1 175 98`) oder entfällt (Löwe). Ein freier Strich würde
   vom Beschnitt angeschnitten.
5. **Rechts ist gespiegelt:** `x_rechts = 640 − x_links` — für Umriss, Linse und alles, was eine
   Kontur hat. **Nicht** gespiegelt werden **Glanzpunkt** und **Pupillen-Versatz**: der Glanzpunkt
   sitzt auf beiden Augen oben links, und die ruhende Pupille verschiebt sich auf beiden Seiten
   gleichsinnig (damit beide Augen in dieselbe Richtung schauen). Gemessen am 14.10.2026: Linsen
   spiegelgleich (Abweichung 0), Pupille um 3 bis 4 Einheiten gleichsinnig versetzt — auf dem Handy
   unter 2 px.
6. **Wangen** sind rosa Ellipsen (`#f2a8b6` bis `#f4a8b6`, Deckkraft 0,45 bis 0,5) im Fellstreifen
   seitlich **außerhalb** des Rings. Auf kräftigem Grün oder Blau wird halbdurchsichtiges Rosa
   schmutzig — beim Krokodil deshalb Deckkraft 0,85.

**Die Pupille wandert.** Beide Pupillen tragen `class="pupil"` und folgen dem Zeiger um höchstens
4 Einheiten (`GAZE_MAX` in `creatures/gaze.ts`). Die weiße Linse (`fill="#ffffff"`) muss deshalb
rings um die Pupille mindestens 4 Einheiten Luft lassen — `gaze.test.ts` rechnet das für jedes Tier
in acht Richtungen nach, `scripts/pruefen-blick.py` misst es im Browser.

## 4. Prüfen — in dieser Reihenfolge

```bash
pnpm vitest run src/render-probe.test.ts                                   # SVGs für jede Zahnzahl
uv run --with playwright python scripts/pruefen-zahnsicht.py               # erwartet: 0 Auffälligkeiten
uv run --with cairosvg python scripts/artwork-png.py \
  "$TMPDIR/zahn_agent-artwork/panda.svg" panda.png offen                   # ansehen, auch: geschnappt
pnpm gate
```

- **Die Sonde misst die Deckung im Browser** (jeder Zahn, jede Zahnzahl, 144 Zeichnungen bei zwölf
  Wesen) und nennt Tier, Zahnzahl, Zahn, Anteil und das deckende Element. Exit-Code 1 bei einem
  Fund. Das untere Zahnfleischband deckt die Wurzeln der unteren Zähne zu 50 bis 72 % — das ist
  gewollt und wird nur als Zahl genannt.
- **Das Bild ansehen, offen und geschnappt.** Geschnappt bleibt das Gesicht stehen, die Nase rutscht
  nach unten, Oberkiefer und Schnauzenfläche sind weg (seit dem 13.10.2026): die Augen müssen dann
  wie ein Gesicht über der Nase sitzen, und nichts aus `body` darf als Strich im Gesicht stehen.
- **Die Gegenprobe ist billig:** eine absichtlich falsche Lage (Auge 30 Einheiten zur Maulmitte)
  muss Test **und** Sonde rot machen. Bleibt eines grün, prüft es nicht, was es soll.
- Wo `uv` fehlt, tut es `python scripts/…`, wenn `playwright` bzw. `cairosvg` installiert sind.
  **Unter Windows findet `cairosvg` oft keine `libcairo-2.dll`** — dann fehlt Cairo selbst (GTK-
  Laufzeit), nicht das Python-Paket.

## 5. Danach

- **Krokodil geändert?** Das App-Symbol hängt an seiner Zeichnung: `ICON_NEU=1 pnpm test:run`, dann
  `uv run --with cairosvg python scripts/icon-png.py`.
- **Irgendein Tier geändert?** Das README-Bild neu bauen (`scripts/galerie.py`, Rezept in
  `docs/workflow.md`).
- **Kommentare im Modul nachziehen.** Die Module erklären ihre Maße („der Maulrand liegt bei
  x 133") — eine verschobene Form mit altem Kommentar ist eine zweite Wahrheit.

## 6. Stil in Kürze (die Einzelheiten und Begründungen stehen in Abschnitt 7, „Freundliche Zeichnung")

- Erst die **Silhouette** unverwechselbar, dann das Fell. Teilpfade der Silhouette gleichsinnig —
  oder gar keine Teilpfade: die Höcker des T-Rex stehen im **selben** Pfad wie der Kopf.
- Was aus dem Kopf herausragt und **nicht** zum Maul gehört (die Ärmchen des T-Rex, Stiel und
  Topf der Venusfliegenfalle), steht in `body` **vor** dem Kopf — der Kopf deckt den Ansatz zu.
- Rachen warmes Rosenrot, Zahnfleisch die hellste Stufe, Zähne cremefarben und rund.
- Umrisse in einer dunkleren Variante der Füllfarbe, nie schwarz.
- Bühne 640 × 460, Ringmitte um x 320; alles spiegelsymmetrisch außer bewusstem Zubehör (Monokel).
  Für die Zähne gilt die **Zwillingsregel**: der Spiegelpartner von Zahn i ist `count − i` (Zahn 0 in
  der Ringmitte unten, Zahn `count/2` oben) — bewacht von `creatureViews.test.ts` bei der
  Standardzahnzahl und bei jeder geraden Zahnzahl. Bei **ungeraden** Zahnzahlen trägt die Ringmitte
  oben keinen Zahn; dort flankieren die Eckzähne von Vampir, Panther und Säbelzahntiger bewusst die
  Mitte und sind dann nicht spiegelgleich.
- Geometrie wird gerechnet, nicht gesetzt: Ring, Schließweg und Trefferflächen kommen aus
  `ring`, `upper.thickness` und `lower.thickness`.

## 7. Freundliche Zeichnung (für Kinder)

Das Spiel ist für ein Kind gedacht: keine schwarzen Rachen, keine Spaltpupillen, keine
riesigen Fangzähne. Regeln für neue Kunstwerke:

- Rachen in warmem Rosenrot, nicht dunkel — es muss wie ein offener Mund aussehen, nicht wie ein Loch.
- Zähne cremefarben, **rund** (Kegel mit runder Spitze), Umriss weich (`#dcd2b8`), niemals schneeweiß auf schwarz.
- Zahnfleisch ist die **hellste** Stufe im Maul, damit die Zähne davor lesbar bleiben.
- **Eine Katze erkennt man an den Ohren, nicht am Fell.** Der Panther trug zuerst die runden Ohren
  des Pandas und las damit wie eine **schwarze Maus** (gemeldet vom Auftraggeber, 11.10.2026).
  Katzenohren sind Dreiecke mit runder Spitze, nach außen gekippt; der Fuß liegt im Kopfumriss und
  ist dort unsichtbar, nur die Spitze steht heraus. Dazu **Schnurrhaare** in dem schmalen
  Fellstreifen neben dem Maul (auf fast schwarzem Fell brauchen sie einen mittleren Grauton).
  Wer ein neues Tier zeichnet: erst die **Silhouette** unverwechselbar machen, dann das Fell.
- **Zubehör gehört in die Körperebene.** Ein Hut (oder eine Brille) ragt über den Kopfumriss hinaus —
  der Gesichtsbereich wird aber auf die Silhouette beschnitten (`factory.ts`, `mouthLayers`), dort
  wäre die Krone abgeschnitten. Der **Mensch** trägt seinen rostroten Filzhut deshalb in `body`. In
  die Silhouette gehört er nur, wenn ein Maulteil ihn erreicht; dann gilt die Gleichsinnigkeit
  (Falle in `docs/fallen.md`: „Ein gespiegelter Teilpfad in der Silhouette schneidet Löcher ins
  Gesicht").
- **Wer ist gemeint?** „Genau wie der Mensch … könnte man dem einen Hut anziehen" heißt *der Mensch*.
  Ich hatte den Hut auf den Panther gesetzt (der Satz nannte beide), und der Nutzer musste
  widersprechen. Bei „dem einen"/„dem anderen" in einer Nachricht mit **zwei** genannten Wesen:
  nachfragen, statt zu raten.
- **Was über der Schnauzenfläche liegen soll, gehört in den Gesichtsbereich.** Die Schnauzenfläche
  (`upperShell`) wird in der **Mundebene** über die Körperebene gemalt — beim Menschen in derselben
  Hautfarbe. Zubehör in `body` verschwindet darunter: die erste Haarfassung war im gerasterten Bild
  unsichtbar (mit einer Farbkarte gemessen lag unter der Krempe bis y 110 nur Haut), obwohl der Pfad
  korrekt im SVG stand. Der Hut bleibt trotzdem in `body`, weil seine Krone über den Umriss
  hinausragt und der Gesichtsbereich beschnitten wird. Also: **Hut in `body`, Haare in `face`** —
  je nachdem, was die Form braucht, und immer im gerasterten Bild nachsehen.
  **Nachtrag 13.10.2026:** die Haare von damals liest der Auftraggeber als **Bart**, und im
  Gesichtsbereich blieben sie beim Zuschnappen am Hut hängen, während die Nase nach unten fuhr.
  Sie liegen jetzt in `upperExtra`, der Ebene der Nase. Die Regel dahinter steht unter „Das
  geschlossene Maul": was sich mit dem Kiefer bewegen soll, gehört in dessen Ebene.
- **Was über den Umriss hinausragen soll, gehört in die Körperebene — sonst schneidet der Beschnitt
  es ab.** Die Ohren des Vampirs standen im Gesichtsbereich, und im gerasterten Bild fehlten ihre
  Spitzen: die Spitze lag bei x 52, der Umriss bei y 116 aber erst bei x 110 — **58 px Ohren** schnitt
  die Kontur weg. Gemessen, nicht am Code gesehen. Die **Gegenprobe ist billig**: das
  Unterschieds-Rechteck zweier Rasterungen darf nur die geänderten Bereiche umfassen (der
  Zuschnapp-Zustand des Vampirs änderte sich nur in x 24…616, y 111…396 — Kragen, Ohren, Monokel —,
  die Maulmitte unten `(320,430)` blieb Pixel für Pixel gleich `(106,27,41)`).
- **Der Stehkragen liegt in `body`, das Monokel in `face` — je nachdem, wer obenauf gehört.** Ein
  Kragen, den man *hinter* dem Kopf trägt, muss in der Körperebene stehen (im Beschnitt wäre er
  abgeschnitten, und der Kopf soll seine Innenkante verdecken); ein Monokel sitzt *auf* dem Auge und
  bleibt innerhalb des Umrisses, gehört also über die Mundebene. Dieselbe Überlegung wie bei Hut
  (`body`) und Haaren (`face`) des Menschen.
- **Gleiche Rezeptur, gleiches Tier.** Ein Kreis mit rosa Innenkreis *ist* die Maus: der
  Säbelzahntiger trug dieselbe Form (Kreis r 44, rosa Kreis r 20), nur etwas kleiner — im
  Vierervergleich der Köpfe (Maus, Panther, Säbelzahntiger, Löwe) war er nicht zu unterscheiden, und
  der Auftraggeber hat genau das gelesen. Köpfe unterscheiden sich über **Größe, Form und
  Innenfarbe zusammen**: kleinere ovale Ohren (30 × 28) mit **dunkler** Innenfläche (`#b78243`) sind
  Katzentier, große runde Kreise mit Rosa sind Maus. Maus und Löwe dürfen `#e8a0ae` behalten,
  solange Form und Größe deutlich abweichen.
- **Ein Fleck gehört dorthin, wo Fell ist — und er muss dort auch wirklich gezeichnet werden.**
  Die Smilodon-Flecken sitzen als vierzehn Rosetten (Ring mit hellem Kern) nur im freien
  Fellstreifen; im gerasterten Bild geprüft: Kern an der Position da, Ring über 72 Winkelgrade
  abgetastet (alle vierzehn nachgewiesen, die vier am Fellrand zu 58–66 von 72 Grad, weil der
  Kopfumriss sie anschneidet). Zwei Anläufe waren vorher falsch: **auf dem Ohr** (die Ohrenfläche
  wird in der Körperebene *nach* den Flecken gezeichnet und deckte ihn zu — im Bild nicht zu finden)
  und **auf der Stirn mit r 12/r 8** (der freie Fellstreifen ist dort nur rund 26 px breit, der Ring
  lief über die Schnauzenkante; jetzt r 6).
- **Die Doku-Prüfung nie mit `>/dev/null` laufen lassen.** `scripts/doku-pruefen.sh` meldet Treffer
  alter Werte und **zählt sie nicht als Fund**, solange `ALTE_WERTE_STRIKT=1` fehlt — der Exit-Code
  bleibt 0. So blieb „232 Tests grün" in der Startanleitung stehen, während dieselbe Datei zweimal
  korrekt 234 nannte; gefunden hat es erst ein unabhängiger Prüfer. Scharf prüfen (`ALTE_WERTE_STRIKT=1`)
  heißt: nur über die **Zahlendoku** (`README.md`, `docs/testing.md`). Über `AGENTS.md`,
  `docs/workflow.md` und die Aufzeichnungen wird **meldend** geprüft — dort stehen alte Zahlen
  absichtlich (als Lehre, im Aufruf-Beispiel) und würden falschen Alarm auslösen.
- **`getBoundingClientRect` an einem gedrehten SVG-Element ist kein Maß für eine Fläche.** Die
  Trefferbox sitzt auf dem Zahnring und ist gedreht; der Browser liefert das **Achsen-Rechteck**
  (Kante an Kante, 52,48 px), nicht die Trefferfläche. Die 44,15 px im README sind gerechnet
  (2 · Trefferradius 49,4 px · Skala 286/640) — die Zahl stimmte, die angegebene Herkunft nicht.
  Wer eine Fläche behauptet, nennt die Rechnung; wer eine Messung behauptet, nennt das Werkzeug,
  das sie wirklich liefert.
- **Augen und Wangen liegen im Fellstreifen, nie auf dem Zahnring** — sonst verdecken sie je nach
  Zahnzahl einen Zahn. Wo der Streifen schmal ist (Katzen, Panda, Hai), werden die Augen kleiner
  und rücken neben die Nase; die Braue liegt dann als Lid auf der Augenkante.
- Augen: weiße Linsen mit Glanzpunkt und rosa Wangen. Der Augapfel darf einen **hellblauen
  Irisring** um die Pupille tragen (so sieht das Original-Spielzeug aus); die Pupille bleibt
  dunkelbraun als Oval — kontrastarm, nie schwarz.
- **Die Schnauze ist kein hellerer Fleck.** Beim Original ist der Kopf einfarbig, nur die Kontur
  trennt Schnauze und Kopf. Falten werden als **Rille mit Grat** gezeichnet (dunkle Linie, helle
  Linie darüber) — ein Paar gleich dicker Striche sieht wie ein Bewegungsschwung aus.
- **Jedes Element gehört auf die Fläche, für die es gezeichnet ist.** „Sichtbar über dem Kieferband"
  ist **keine** Platzierung: der Hai trug seine sechs Kiemenschlitze mitten im offenen Maul, weil sie nur
  *über* einer Ebene lagen statt *außen* am Kopf. Gegen die Ringellipse rechnen (`ring.rx`/`ring.ry` um
  `ring.cx`/`ring.cy`): was zum Kopf gehört, muss **außerhalb** liegen — und trotzdem Abstand zur
  Silhouette, zu Augen, Ohren und Flossen halten (der Hai hat dafür nur eine Zone von rund 40 px).
- Umrisse in einer dunkleren Variante der Füllfarbe (beim Krokodil `#5f8f1e` auf `#8fce33`), keine
  schwarzen Linien.
- Maul, Zähne und Gesicht werden in der Fabrik auf `silhouette` beschnitten — nichts darf
  über den Kopf hinausragen, sonst hängen beim Zuschnappen rosa Bänder daneben.

## 8. Das geschlossene Maul

- **Ist das Maul zu, ist der Oberkiefer weg.** Er fährt zu (90 ms — das ist der Biss), dann
  verschwinden sein Zahnfleischband und die Schnauzenfläche (`.creature.is-snapped .jaw__upper`,
  `path.jaw__shell` in `presentation/styles/stage.css`). Übrig bleiben das Lächeln des Unterkiefers,
  die unteren Zähne und die Nase, die mit der Schnauzen-Gruppe nach unten rutscht. Bis zum
  13.10.2026 blieb der herabgefahrene Oberkiefer als zweiter Bogen unter dem Lächeln stehen — beim
  Vampir lag er auf dem roten Kragen und sah wie ein zweiter Mund aus (gemeldet mit Bild).
- **Was bei offenem Maul verdeckt ist, kommt beim Zuschnappen ans Licht.** Die Ohren des Vampirs
  liefen als Dreiecke bis unter die Augen; die Schnauzenfläche deckte den Fuß zu — bis sie nach
  unten fuhr und zwei Striche quer durchs Gesicht standen. Wer in `body` zeichnet, sieht sich die
  Zeichnung **auch geschlossen** an, nicht nur offen.
- **Was sich mit dem Kiefer bewegen soll, gehört in dessen Ebene.** Der Schnurrbart des Menschen
  lag im Gesichtsbereich (`face`, bleibt liegen) und blieb beim Zuschnappen am Hut hängen, während
  die Nase nach unten fuhr. Er liegt jetzt in `upperExtra` — der Ebene der Nase.
- **Ein Zahn genau im Maulwinkel gehört zum Oberkiefer.** Bei 12 Zähnen sitzt je einer bei 0° und
  180°; der Sinus liefert dort keine glatte Null, also fiel der linke zum Unterkiefer und blieb
  bei geschlossenem Maul allein neben dem Lächeln stehen (`splitByJaw` in `creatures/factory.ts`).
- Dieselben Regeln stehen an drei Stellen und müssen zusammen geändert werden: im Stylesheet
  (`presentation/styles/stage.css`; `app.css` ist nur die Reihenfolge der Bauteile), in
  `src/icon.test.ts` (das App-Symbol) und in `scripts/artwork-png.py` (der Rasterer).
