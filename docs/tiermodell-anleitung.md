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
| Schnauze | `upperShell`, `upperExtra` | Nase, Schnauzenfalten — fährt beim Biss mit |
| Oberkiefer | `upper` + obere Zähne | — |
| untere Zähne, Unterkiefer | `lower`, `lowerExtra` | Kinnkante |
| **Gesicht** | `face` | Augen, Brauen, Wangen, Schnurrhaare, Ohren im Umriss — **über allem** |

Alles ab der Maulöffnung wird auf `silhouette` beschnitten. Daraus folgen die zwei Regeln, an denen
fast jeder Fehler hing:

- **Was im Gesicht steht, liegt über den Zähnen.** Es darf den Zahnring nicht berühren (Abschnitt 2).
- **Was im Körper steht, verschwindet unter der Schnauzenfläche** (`upperShell`), soweit diese
  reicht. Was dort sichtbar sein soll, gehört ins Gesicht — solange es im Umriss bleibt.

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
   Säbelzahntiger 24 × 21, Panda 18 × 17 im Fleck 29 × 26. Kleiner als etwa 24 × 21 wird ein Auge
   auf dem Handy zum Punkt — dann lieber den Kopfumriss oben anheben, als das Auge weiter schrumpfen.
3. **Das Auge bleibt eine Kullerlinse:** weiße Ellipse mit Umriss in der dunkleren Fellfarbe,
   Pupille (`class="pupil"`, dunkelbraun oder Farbe, nie schwarz, nie ein Schlitz), ein Glanzpunkt
   oben links. Pupille etwa 45 % der Linsenbreite, Glanzpunkt etwa 18 %. Wer ein Auge verkleinert,
   skaliert **alle** Teile und ihre Versätze mit.
4. **Brauen nur, wo Platz ist.** Ist zwischen Auge und Kopfrand weniger als rund 10 Einheiten frei,
   liegt die Braue als **Lid** direkt auf der oberen Augenkante (ein Bogen mit denselben Radien wie
   das Auge, z. B. `M 113 98 A 34 30 0 0 1 175 98`) oder entfällt (Löwe). Ein freier Strich würde
   vom Beschnitt angeschnitten.
5. **Rechts ist gespiegelt:** `x_rechts = 640 − x_links`. Der Glanzpunkt bleibt auf beiden Augen
   oben links (er wird nicht gespiegelt).
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

- **Die Sonde misst die Deckung im Browser** (jeder Zahn, jede Zahnzahl, 120 Zeichnungen bei zehn
  Tieren) und nennt Tier, Zahnzahl, Zahn, Anteil und das deckende Element. Exit-Code 1 bei einem
  Fund. Das untere Zahnfleischband deckt die Wurzeln der unteren Zähne zu 50 bis 72 % — das ist
  gewollt und wird nur als Zahl genannt.
- **Das Bild ansehen, offen und geschnappt.** Geschnappt bleibt das Gesicht stehen, während Schnauze
  und Oberkiefer nach unten fahren: die Augen müssen dann wie ein Gesicht über der Nase sitzen.
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

## 6. Stil in Kürze (Einzelheiten und Begründungen in `AGENTS.md`, „Freundliche Zeichnung")

- Erst die **Silhouette** unverwechselbar, dann das Fell. Teilpfade der Silhouette gleichsinnig.
- Rachen warmes Rosenrot, Zahnfleisch die hellste Stufe, Zähne cremefarben und rund.
- Umrisse in einer dunkleren Variante der Füllfarbe, nie schwarz.
- Bühne 640 × 460, Ringmitte um x 320; alles spiegelsymmetrisch außer bewusstem Zubehör (Monokel).
- Geometrie wird gerechnet, nicht gesetzt: Ring, Schließweg und Trefferflächen kommen aus
  `ring`, `upper.thickness` und `lower.thickness`.
