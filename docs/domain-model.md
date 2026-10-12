# Fachmodell und Dramaturgie

## Vokabular

| Begriff | Bedeutung |
|---|---|
| **Zahn** | 1..n, Standard n = 10; Zahn 1 steht vorn an der Schnauze. |
| **Druck** | Ein Tippen auf einen noch nicht gedrückten Zahn. |
| **scharfer Zahn** | Zahn, der das Maul zuschnappen lässt. Im Originalmodell sind **1 bis 3** gleichzeitig scharf. |
| **Runde** | Von der offenen Maulstellung bis zum Zuschnappen. Endet spätestens beim n-ten Druck. |
| **Position** | Nummer des Drucks, bei dem es schnappte (1-basiert) — die eigentlich aussagekräftige Größe. |
| **Verlierer** | Der Spieler, der den scharfen Zahn gedrückt hat (`(position - 1) mod spieler + 1`). |
| **Spannung** | 0..1; die **Biss-Wahrscheinlichkeit des nächsten Drucks**. Beim letzten Zahn genau 1. |
| **Tier-Satz** | Katalogfeld `fact`: ein belegter Satz über das **echte** Tier, höchstens 110 Zeichen. Steht nach dem Biss als „Wusstest du? …" unter dem Ergebnis und sagt nie etwas über scharfe Zähne. |
| **Tierstimme** | Der Laut eines Tiers (Datei, höchstens 1,5 s). Erklingt beim Wählen und kurz nach dem Biss — nie vor dem Urteil, sie ist kein Signal. |

## Zufallsmodelle

| Modus | Verhalten | Herkunft |
|---|---|---|
| `original` | 1–3 Zähne gleichzeitig scharf; pro Druck also 10 %, 20 % oder 30 % Trefferchance, unbekannt zu Rundenbeginn | Teardown des Original-Spielzeugs (make Magazin 1/2023) |
| `classic` | genau 1 Zahn von n | klassisches Kinder-Roulette |

Rechenwerte für n = 10, `original`, zufällige Druckreihenfolge (nachgerechnet in
`core/domain/probabilities.ts`, geprüft gegen das Python-Werkzeug `../kroko-doc`):

- P(Biss beim 1. Druck) = 20,0 %
- P(erste 3 Drücke überlebt) = 48,6 %
- erwartete Drücke bis zum Biss = 3,972222
- P(Biss beim letzten Druck) = 3,333 %; 4 Spieler reihum: 33,9 % / 28,3 % / 20,7 % / 17,0 %

## Ehrlichkeitsregeln (nicht verhandelbar)

1. **Ein Zucken nur bei harmlosen Drücken.** Das Maul darf sichtbar zucken, ohne zuzuschnappen —
   aber niemals bei einem scharfen Zahn, sonst lügt die Anzeige.
2. **Die scharfen Zähne bleiben geheim**, solange die Runde läuft. Nach dem Biss werden sie
   genannt (Zahl und Nummern) — erst dann ist Offenheit ein Gewinn, nicht ein Verrat.
3. **Letzter Zahn:** Ist nur noch ein Zahn ungedrückt, ist er zwangsläufig scharf. Die Bühne
   sagt das ausdrücklich an.
4. **Statistik ohne Signifikanz unter der Mindeststichprobe** (100 Runden): Es gibt dann
   Tabellen, aber keine Testaussage.
5. **Die Statistik vergleicht nur Gleiches.** Ein Protokoll wird nach Lebewesen, Zahnzahl und Modus
   in Gruppen geteilt (`groupRounds`); Gleichverteilung und Zugmodell gelten nur innerhalb einer
   Gruppe, und die Mindeststichprobe von 100 Runden gilt je Gruppe. Ein Test, der nicht laufen
   konnte, bekommt kein Urteil — „passt zu den Daten" steht nur da, wenn geprüft wurde.

## Spannungsdramaturgie (`core/domain/tension.ts`)

| Größe | Verhalten |
|---|---|
| Spannung | `P(J = i) / P(J ≥ i)` aus der Verteilung in `probabilities.ts` — die Biss-Wahrscheinlichkeit des nächsten Drucks. **Kein aufaddierter Pegel:** sie sättigt nicht, sondern steigt monoton bis zum letzten Zahn auf 1. |
| Zucken | Grundchance 12 %, wächst mit der Spannung, **0** beim letzten Zahn |
| Pause (`beatMs`) | bei **jedem** Druck, 120–700 ms; die Länge wird **unabhängig vom Ausgang** gezogen (früh meist kurz, spät bis ans Ende des Fensters) |
| Riss | feste 60 ms zwischen Pause und Auflösung — für beide Ausgänge gleich |
| Erleichterung | 0..1, abgeleitet aus der erlebten Pause; nur beim harmlosen Druck |
| Herzschlag | 900 ms bei Spannung 0 bis 380 ms bei Spannung 1 |
| Beschleunigung | Bildschirmbeben, Vibration, Maul-„Lunge" nach vorn |

Wenn die Spannung eine Wahrscheinlichkeit ist, kann die Anzeige nicht lügen — und sie steht
nirgends vorzeitig auf 100 %. Gemessene Kurven (Krokodil 10 Zähne, 1–3 scharf):
`20,0 · 21,3 · 22,8 · 24,6 · 26,8 · 29,7 · 33,8 · 40,7 · 55,0 · 100,0 %` — Maus (6 Zähne, 1–2
scharf): `25,0 · 28,9 · 34,4 · 42,9 · 58,3 · 100 %`. Im Modus `classic` (genau ein scharfer Zahn)
ist sie schlicht `1 ÷ übrige Zähne`: `10, 11,1, 12,5 … 50, 100 %`.

Zwei Folgen für die Anzeige: Der Balken **startet nicht bei null** (der erste Druck hat schon eine
Gefahr, beim Krokodil 20 %), und die „es wird ernst"-Marke (`is-tense`) liegt bei 30 %, damit sie
nicht bei jedem Lebewesen sofort brennt (Wolf 12 %, Krokodil 20 % beim ersten Druck).

### Was der Balken zeigt (11.10.2026)

Er trägt **zwei** Aussagen, jede mit Wort daneben:

- **Füllung = Fortschritt:** `gedrückte ÷ Zähne` (`pressProgress`). Vorher trug die Füllung die
  Gefahr — der Balken sah damit aus wie eine Fortschrittsanzeige, war aber ein Gefahrenmesser. Das
  war die Ursache der Verwirrung: man konnte die Anzeige nicht deuten.
- **Ist das Maul zu, entfällt die Gefahr-Aussage.** Es gibt keinen nächsten Druck, also steht dort
  kein Prozentwert mehr, sondern **„Runde beendet"**; die Füllung bleibt der Fortschritt und trägt
  **keine** Gefahrfarbe (`.tension-panel.is-snapped`, Klassen am Kasten `#hud-panel`). Vorher blieb
  der Wert vom Zuschnappen stehen — genau dort ist die Gefahr 1 —, und die Anzeige behauptete
  „Bissgefahr 100 %", während daneben „Maul zu" stand (gemeldet vom Auftraggeber: „Bissgefahr 100 %
  obwohl der Mund zu ist"). **Rot hieße hier „der nächste Druck ist gefährlich"** — für einen Druck,
  den es nicht mehr gibt; dieselbe Farbe mit zwei Bedeutungen wäre der Fehler von vorher.
- **Die Zustandsklassen hängen am Kasten, der Balken und Zeile enthält** (`#hud-panel`). An der
  Bühne (`#stage`) haben sie den Balken nie erreicht: der liegt außerhalb, keine der Farbregeln
  griff. Gemessen im echten Browser — bei 100 % Bissgefahr blieb die Füllung grün→gold
  (`docs/e2e-nachweise.md` §5t).
- **Farbe = Gefahr:** die Bissgefahr des nächsten Drucks (`tensionForPress`). Ab 30 %
  (`isTense`, `TENSE_LEVEL`) glüht er, ab 50 % (`isHighDanger`, `HIGH_DANGER`) wird er rot.
  *Warum 50 und nicht 60:* bei 60 % erreichte **kein** Gebiss die Schwelle vor dem letzten Druck —
  rot fiel also immer mit dem Biss zusammen, ein *überstandener* roter Druck war unmöglich. Bei
  50 % kann der Mut bis ins Rote reichen.
- **Der Balken hat einen Zweck:** die höchste überstandene Gefahr ist der **Mut** der Runde
  (`survivedDanger` = die Gefahr des letzten Drucks, der harmlos blieb). Weil die Gefahr mit jedem
  Druck steigt, ist dieser Wert zugleich das Maximum. Er steht als Satz im Ergebnis.
- Beide Zahlen stehen als Text darunter („6 von 10 gedrückt" · „Bissgefahr 34 %"); der Balken atmet
  im Takt des Herzschlags (`--beat-ms`, dieselbe Zahl wie der Puls).
- **Gemessene Folge der 50-%-Schwelle:** der vorletzte Krokodil-Druck (55,0 %) ist rot, der achte
  (40,7 %) noch nicht. Rot kommt damit einen Druck früher als bei 60 % — und *kann* überstanden
  werden. Zwei Stolperdrähte halten diese Folge fest (`statsView.test.ts`, `gameController.test.ts`
  „wird rot, wenn noch zwei Zähne anstehen"); als die Schwelle fiel, fielen beide — und wurden
  bewusst neu gefasst.
- **Mut auf der Statistikseite:** `bravestRound` nennt die Runde mit der höchsten überstandenen
  Gefahr; die Seite zeigt sie als Kachel „Mutigste Runde" samt Satz mit Rundennummer und Gebiss.
- Der Hinweis, der den Balken erklärt, kommt **einmal je Sitzung** (beim ersten Druck) über den
  `SessionMarkPort`; ohne diesen Port kommt er gar nicht.
- Die Statistikseite zeigt dieselbe Rechnung als Kurve („Wie gefährlich ist der nächste Druck?").
