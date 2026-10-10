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
| **Spannungspegel** | 0..1; wächst je Druck und je knapper die Zähne werden. |

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

## Spannungsdramaturgie (`core/domain/tension.ts`)

| Größe | Verhalten |
|---|---|
| Spannungspegel | `+0,18 + 0,35 × Knappheit + 0,02 × Position`, gedeckelt bei 1 |
| Zucken | Grundchance 12 %, wächst mit der Spannung, **0** beim letzten Zahn |
| Totenstille | nur vor dem Biss, 400–900 ms (länger, je knapper die Zähne) |
| Herzschlag | 900 ms bei Spannung 0 bis 380 ms bei Spannung 1 |
| Beschleunigung | Bildschirmbeben, Vibration, Maul-„Lunge" nach vorn |
