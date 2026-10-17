---
type: "Referenz"
title: "Fachmodell: Runde, Zähne, Gebiss, Einstellungen"
openwiki_generated: true
verified:
  - by: openwiki/0.7.2
    at: 2026-10-17T07:24:18.878Z
sources:
  - id: openwiki-source-92db54388f7ce80a394829dd
    resource: repo://docs/domain-model.md
  - id: openwiki-source-bbc2c903bd2b0bd0c43adeb6
    resource: repo://src/core/domain/creature.ts
  - id: openwiki-source-30c0ff4f8feedd45df97225e
    resource: repo://src/core/domain/errors.ts
  - id: openwiki-source-17ff2ff00bb37c621c777a14
    resource: repo://src/core/domain/liveTeeth.test.ts
  - id: openwiki-source-26c76b17537979e5bfc63bf5
    resource: repo://src/core/domain/liveTeeth.ts
  - id: openwiki-source-8c4c18c939113f3341a73d57
    resource: repo://src/core/domain/round.test.ts
  - id: openwiki-source-e1725572dc7b7c963cc904df
    resource: repo://src/core/domain/round.ts
  - id: openwiki-source-0d6e43352a25a3303ae96c18
    resource: repo://src/core/domain/sessionLog.ts
  - id: openwiki-source-2b8449efcdf79881db4aee1f
    resource: repo://src/core/domain/settings.ts
  - id: openwiki-source-3dbe5aab0125fd4fd40eaba2
    resource: repo://src/core/domain/teeth.ts
  - id: openwiki-source-71d3e85963ca5344bb5d15f4
    resource: repo://src/core/use-cases/playPress.test.ts
  - id: openwiki-source-db117969ce6fbe22ad96d204
    resource: repo://src/core/use-cases/playPress.ts
  - id: openwiki-source-4c5d762587bc9a24d9e49318
    resource: repo://src/infrastructure/storage/localStorageSettings.ts
  - id: openwiki-source-c876492457b52776bd2f41f0
    resource: repo://src/katalog-json.test.ts
  - id: openwiki-source-1b681c4ce8d10cbab258bb09
    resource: repo://src/pages/index.astro
  - id: openwiki-source-354ba84a757f3d4a3d4386d9
    resource: repo://src/presentation/game/creatureChoice.ts
  - id: openwiki-source-5839a45cd294b2fffaf415fc
    resource: repo://src/presentation/game/creatures/creatureViews.test.ts
  - id: openwiki-source-de271c56ca84fb2e253b32b2
    resource: repo://src/presentation/game/creatures/geometry.ts
  - id: openwiki-source-e2340a582b0e017c32dc7a37
    resource: repo://src/presentation/game/creatures/index.ts
  - id: openwiki-source-beaa5183e5d5339612c2260a
    resource: repo://src/presentation/game/gameController.test.ts
  - id: openwiki-source-4e4f28f1d6294d867a566f42
    resource: repo://src/presentation/game/gameController.ts
  - id: openwiki-source-e44335da79c63766a367e706
    resource: repo://src/presentation/game/hudModel.ts
  - id: openwiki-source-9584f01616c1de6d0d582591
    resource: repo://src/presentation/game/quickControls.ts
  - id: openwiki-source-fe5d3f44406f033f6834d6e0
    resource: repo://src/presentation/game/resultText.ts
  - id: openwiki-source-316cfb296a4d2923584c740f
    resource: repo://src/presentation/game/roundRecorder.ts
  - id: openwiki-source-adb84cb28d1d4709a55b9f58
    resource: repo://src/presentation/stats/statsPage.ts
generated: { by: "openwiki/0.7.2", at: "2026-10-17T07:24:18.878Z" }
---


# Fachmodell: Runde, Zähne, Gebiss, Einstellungen

Fünf Dateien in `core/domain` tragen dieses Modell: `round.ts` (die Runde und der Zug), `teeth.ts`
(Grenzen, Zufallsmodus, Zahn- und Spielerzahl), `creature.ts` (der Katalog der Lebewesen),
`settings.ts` (`GameSettings`) und `errors.ts` (`DomainError`). Alle liegen in der Schicht `domain`,
also ohne DOM, ohne Uhr und ohne Ablage — jede Umgebung kommt als Port herein
([Schichten, Ports und die Importregel](../architecture/schichten-und-importregel.md)).

## Vokabular

| Begriff | Bedeutung | Im Code |
|---|---|---|
| **Zahn** | 1-basiert, `1..teeth`; Zahn 1 steht vorn an der Schnauze. | `ToothId = number`, `state.teeth` |
| **Druck** | Ein Zug auf einen noch nicht gedrückten Zahn. | ein Aufruf von `pressTooth` |
| **scharfer Zahn** | Zahn, der das Maul zuschnappen lässt. Anzahl je Tier 1–2 oder 1–3. | `state.live`, `loser.liveCount` |
| **Runde** | Von der offenen Maulstellung bis zum Zuschnappen; endet spätestens beim n-ten Druck. | `RoundState`, `status: 'open' \| 'snapped'` |
| **Position** | Nummer des Drucks, bei dem es schnappte (1-basiert) — die eigentlich aussagekräftige Größe; sie steht im Protokoll und in der Statistik, nicht mehr im Ergebnis-Text. | `loser.pressIndex`, `RoundRecord.pressIndex` |
| **Verlierer** | Der Spieler, der den scharfen Zahn gedrückt hat. | `loser.player` |
| **Spannung** | Biss-Wahrscheinlichkeit des **nächsten** Drucks, 0..1. | eigenes Thema, siehe [Zufall und Spannung](zufall-und-spannung.md) |

Die beiden Zufallsmodelle heißen hier nur: `RandomMode = 'original' | 'classic'`. Was sie ziehen, wie
scharfe Zähne ausgewählt werden und wie daraus Spannung, Zucken und Balken werden, steht auf
[Zufall und Spannung](zufall-und-spannung.md); diese Seite beschreibt die Zugregeln, die
Gültigkeitsprüfungen und die Fehlercodes.

## Eine Runde ist ein Wert, kein Ablauf

```mermaid
stateDiagram-v2
  [*] --> Offen: openRound zieht die scharfen Zähne
  Offen --> Offen: pressTooth auf harmlosen Zahn
  Offen --> Zugeschnappt: pressTooth auf scharfen Zahn
  Zugeschnappt --> [*]: RoundRecord geschrieben, neue Runde öffnet
```
Der einzige Zustandswechsel einer Runde: offen bleibt offen, bis ein scharfer Zahn gedrückt wird.

`RoundState` ist ein unveränderlicher Wert mit genau diesen Feldern:

| Feld | Inhalt |
|---|---|
| `creatureId` | Gebiss der Runde (Kennung aus dem Katalog) |
| `teeth` | Zahl der drückbaren Zähne — die eingestellte, nicht die des Katalogs |
| `mode`, `players` | Zufallsmodell und Spielerzahl dieser Runde |
| `status` | `'open'` oder `'snapped'` — mehr Zustände gibt es nicht |
| `pressOrder` | gedrückte Zähne **in der Reihenfolge des Drückens** (`readonly ToothId[]`) |
| `liveTeethMin`, `liveTeethMax` | Grenzen gleichzeitig scharfer Zähne **aus dem Katalog** — damit rechnet die Spannung, ohne den Katalog zu kennen |
| `live` | die scharfen Zähne, aufsteigend sortiert; die Bedienung darf sie nie anzeigen, solange die Runde läuft |
| `loser` | `LoserInfo` (`tooth`, `pressIndex`, `player`, `liveCount`) oder `null` |

**Invariante: `pressTooth` verändert nichts, es gibt einen neuen Zustand zurück.** Der alte Zustand
wird nur gelesen; `pressOrder` wird per Spread kopiert, im Trefferfall kommen `status` und `loser`
hinzu. Der Test „verändert den vorherigen Zustand nicht" hält das fest: nach `pressTooth(before, 1)`
ist `before.pressOrder` weiterhin leer (`src/core/domain/round.test.ts`).

Zwei Folgen, die man beim Lesen der Bedienung sonst für Zufall hält:

- Die Spielsteuerung hält die Runde als Referenz und **ersetzt** sie
  (`this.round = outcome.state`). Ein verzögertes Urteil prüft deshalb `this.round !== played` und
  läuft ins Leere, wenn in der Pause eine neue Runde begann — ein Objektvergleich, kein Flag.
- Weil `openRound` die gezogenen Zähne sortiert ablegt (`[...live].sort((a, b) => a - b)`), verrät
  die Reihenfolge in `live` nicht, in welcher Folge gezogen wurde.

## Öffnen: das Gebiss kommt aus dem Katalog

`openRound(config, deps)` löst zuerst das Gebiss auf (`resolveGebiss`) und prüft dann die Grenzen:

| Wert | Quelle | Abweichung möglich? |
|---|---|---|
| `creatureId` | `config.creatureId ?? DEFAULT_CREATURE_ID` (`'crocodile'`) | — |
| `teeth` | `config.teeth ?? creature.teeth` | ja, für Tests und Sonderfälle; frei innerhalb 1–12, muss **nicht** zur Zahnzahl des Tiers passen (Test: Wolf mit 6 Zähnen) |
| `liveTeethMin` / `liveTeethMax` | `config.liveTeethMin ?? creature.liveTeethMin` (analog max) | ja, laut Typ-Kommentar nur für Tests |

Der Katalog ist damit die einzige Quelle für Zahnzahl und Grenzen; ein zweiter Satz Zahlen in der
Bedienung existiert nicht. Eine **unbekannte** Kennung wirft `DomainError('unknown-creature')` —
`openRound` spielt nicht still etwas anderes. Die stille Ersetzung gibt es nur beim Lesen von
Altdaten: `creatureOrDefault` macht aus einer fehlenden oder unbekannten Kennung das Krokodil, und
zwar im Protokoll, in der Statistik und beim Laden der Einstellungen.

Katalogfelder, die für die Runde zählen: `teeth`, `liveTeethMin`, `liveTeethMax`. Daneben trägt ein
Eintrag nur Anzeige- und Prüfdaten — `realTeeth` (reine Notiz; `0` heißt „hat gar keine Zähne", so
steht es bei der Venusfliegenfalle), `note`, `fact` (höchstens `MAX_FACT_LENGTH` = 110 Zeichen) und
optional `shortName`/`grammar`. `validateCreature` hält jeden Eintrag zusammen: gültige Zahnzahl,
`liveTeethMin >= 1`, `liveTeethMax >= liveTeethMin`, `liveTeethMax <= teeth`, `realTeeth` entweder 0
oder mindestens `teeth`, nicht leerer `note`/`fact`, `fact` ≤ 110 Zeichen, Kachelbeschriftung
(`shortName ?? name`) ≤ `MAX_TILE_LABEL_LENGTH` = 12 Zeichen. `creature.test.ts` prüft jeden Eintrag
gegen diese Funktion.

Ein neues Lebewesen ist deshalb **ein Katalogeintrag plus eine Zeichnung**: das Kunstwerk-Modul in
`presentation/game/creatures/` und eine Zeile in der Registry `ARTWORKS`;
`creatureViews.test.ts` verlangt, dass Katalog und Registry dieselbe Menge von Kennungen sind und
jede Zeichnung genau `creature.teeth` Zähne mit den Nummern 1..n enthält. Für die Python-Sonden wird
`scripts/katalog.json` aus dem Katalog erzeugt (`KATALOG_NEU=1 pnpm test:run`); `katalog-json.test.ts`
wird rot, sobald Katalog und Datei auseinanderlaufen.

## Grenzen: was ein Gebiss und eine Runde sein dürfen

Alle Zahlen stehen in `src/core/domain/teeth.ts`, nicht in der Doku:

| Konstante | Wert | Begründung im Code |
|---|---|---|
| `MIN_TEETH` | 1 | Kleinstes spielbares Gebiss (Wunsch vom 11.10.2026: „wenn nur ein Zahn da ist und beim Tap das Maul schließt"). Eine untere Schranke darüber hinaus gibt es nicht — je weniger Zähne, desto größer die Trefferfläche |
| `MAX_TEETH` | 12 | **gemessen**: die Trefferfläche eines Zahns muss auf einem Handy mindestens 44 × 44 CSS-Pixel groß sein; auf dem Zahnring sind das bei 12 Zähnen 51–63 px, bei 16 nur noch 38 px |
| `MAX_LIVE_TEETH` | 3 | harte Obergrenze gleichzeitig scharfer Zähne im Originalmodell („Bumerang mit zwei Enden") |
| `MAX_PLAYERS` | 4 | Grenze des Kerns für protokollierte und importierte Runden — es gab Runden mit 3 und 4 Spielern |
| `MAX_SELECTABLE_PLAYERS` | 2 | was die Bedienung anbietet (Entscheidung vom 12.10.2026): die Knöpfe heißen „Allein" und „Zu zweit" |
| `DEFAULT_TEETH` | 10 | Rückfallwert, wenn ein Protokolleintrag die Zahnzahl nicht kennt (Kurzformat-Import) |
| `DEFAULT_PLAYERS` | 1 | — |
| `DEFAULT_MODE` | `'original'` | — |

`isValidToothCount` und `isValidPlayerCount` prüfen Ganzzahligkeit und Bereich; `assertConfig` ruft
beide beim Öffnen einer Runde auf, also **bevor** scharfe Zähne gezogen werden. Ein `teeth`-Override
läuft durch dieselbe Prüfung: 0 und 2.5 lehnt der Test ab, alles über 12 die Bereichsprüfung.

## Kappung: die Grenzen werden auf das Gebiss geklemmt

`liveCountRange(teeth, min, max)` ist die **eine** Stelle für Auswahl (`liveTeeth.ts`) und Modell
(`probabilities.ts`):

```
lowest  = max(1,      min(floor(min), teeth, MAX_LIVE_TEETH))
highest = max(lowest, min(floor(max), teeth, MAX_LIVE_TEETH))
```

| Gebiss | Kataloggrenzen | tatsächliche Spanne | Folge |
|---|---|---|---|
| Krokodil, 10 Zähne | 1–3 | 1..3 | Standardmodell |
| Wolf, 12 Zähne | 1–2 | 1..2 | „der Biss kommt selten, dann sitzt er" |
| Krokodil mit 2 Zähnen (Override) | 1–3 | 1..2 | ein Druck kann zuschnappen, muss aber nicht |
| **ein Zahn** (jedes Tier) | 1–3 | **1..1** | in **beiden** Modi ist genau dieser Zahn scharf — der erste Tipp schnappt zu |
| unsinnige Grenzen (`min` 5, `max` 1) | — | 3 | die untere Grenze hat Vorrang, hart auf `MAX_LIVE_TEETH` begrenzt |

Die Kappung ist nicht Kosmetik: vorher kappte das Modell erst **nach** dem Ziehen, und bei zwei
Zähnen zeigte die Anzeige 83,3 % Bissgefahr, während mit 75,0 % gezogen wurde. Aus demselben Grund
muss `modeKWeights` die Zahnzahl mitbekommen, wenn es eine konkrete Runde rechnet. Der Ein-Zahn-Fall
ist durch zwei Tests abgesichert: `liveTeeth.test.ts` („kappt die Grenzen auf die Zahnzahl") und
`round.test.ts` („spielt eine Runde mit einem einzigen Zahn").

## Der Zug: `pressTooth`

```mermaid
flowchart TD
  A["pressTooth(state, tooth)"] --> B{"Zahn ganzzahlig und 1 bis state.teeth"}
  B -- nein --> E1["DomainError tooth-out-of-range"]
  B -- ja --> C{"status ist open"}
  C -- nein --> E2["DomainError round-finished"]
  C -- ja --> D{"Zahn steht schon in pressOrder"}
  D -- ja --> E3["DomainError tooth-already-pressed"]
  D -- nein --> F["pressOrder um den Zahn verlängern"]
  F --> G{"Zahn in state.live"}
  G -- ja --> H["neuer Zustand: status snapped und loser gesetzt"]
  G -- nein --> I["neuer Zustand: status bleibt open"]
```
Die Prüfreihenfolge in `assertPressable` — erst der Zahn, dann der Zustand, dann die Dopplung.

Nach dem Anhängen ist `pressIndex = pressOrder.length` (1-basiert). Fiel der Druck auf einen scharfen
Zahn, entsteht `loser: { tooth, pressIndex, player, liveCount }` mit
`liveCount = state.live.length` (wie viele Zähne gleichzeitig scharf waren); sonst bleibt `status`
`'open'`. `playerFor(pressIndex, players) = ((pressIndex - 1) % players) + 1` verteilt die
Verliererposition reihum — bei zwei Spielern also Druck 1 → Spieler 1, Druck 2 → Spieler 2, Druck 3 →
wieder Spieler 1. Dieselbe Drehung nutzt die Zugzeile (`turnSentence`: `(pressIndex % players) + 1`
auf die bereits gedrückten Zähne), sodass der Verlierer immer der Spieler ist, der gerade dran war.

**Die Runde endet zwangsläufig spätestens beim n-ten Druck.** Solange `status` `'open'` ist, wurde
kein scharfer Zahn gedrückt; da mindestens einer scharf ist, ist der letzte verbliebene Zahn
garantiert scharf. `isFinalToothTension(state)` (`status === 'open' && remainingTeeth(state) === 1`)
macht daraus eine Anzeige-Aussage: die Bühne sagt den letzten Zahn ausdrücklich an, statt weiter
Wahrscheinlichkeiten zu behaupten. `remainingTeeth` ist `teeth - pressOrder.length`.

Im laufenden Spiel drückt die Bedienung **nie** direkt auf `pressTooth`, sondern über
`playPress` (`core/use-cases/playPress.ts`): der Ablauf liest `state.live`, plant daraus die
Dramaturgie und ruft dann `pressTooth`. So bleibt das Wissen „dieser Zahn ist scharf" im Kern, und die
Bedienung bekommt nur Zeiten, Pegel und „zuckt ja/nein".

## Fehlercodes des Kerns

`DomainError` trägt einen von sechs stabilen, englischen Codes (`src/core/domain/errors.ts`); die
Meldung daneben ist Detailtext für Tests und Protokolle:

| Code | geworfen von | Bedingung |
|---|---|---|
| `invalid-tooth-count` | `assertConfig` in `openRound` | Zahnzahl nicht ganzzahlig oder außerhalb 1–12 (auch ein Override) |
| `invalid-player-count` | `assertConfig` in `openRound` | Spielerzahl nicht ganzzahlig oder außerhalb 1–4 |
| `unknown-creature` | `getCreature` | Kennung nicht im Katalog — auch beim Zeichnen (`creatureView` ruft `getCreature`) |
| `tooth-out-of-range` | `assertPressable` in `pressTooth` | Zahn nicht ganzzahlig oder außerhalb `1..state.teeth` |
| `round-finished` | `assertPressable` | Druck, nachdem das Maul zu ist |
| `tooth-already-pressed` | `assertPressable` | derselbe Zahn ein zweites Mal |

Die Codes sind englisch, obwohl die Oberfläche deutsch ist: sie sind Vertrag zwischen Kern und
Bedienung, kein Text für Kinder. Ein Regelverstoß wird **geworfen**, nicht als Ergebnis
zurückgegeben — er ist ein Programmierfehler, kein Spielausgang; `playPress` reicht ihn unverändert
weiter (Test „reicht Regelverstöße des Kerns weiter"). Im normalen Spiel tritt er nicht auf, weil die
Steuerung vorher prüft (`canPress`: nicht beschäftigt, `status === 'open'`, Zahn noch nicht gedrückt).

## Spielerzahl und Verlierer

- **1 Spieler:** `playerFor` liefert immer 1; die Texte sagen „Du", der Titel „Zugeschnappt!".
- **2 Spieler:** der Titel nennt den **Gewinner** („Spieler 2 hat gewonnen!"), der Verlierer steht im
  Ergebnistext.
- **3 und 4 Spieler:** nur im Protokoll und nach einem Import — dort bleibt es beim Verlierer-Satz
  („Spieler 3 hat verloren!"). `MAX_SELECTABLE_PLAYERS` = 2 verhindert, dass die Bedienung sie
  anbietet; `isPlausibleRecord` akzeptiert sie weiterhin.

## `GameSettings`: was eine Runde konfiguriert

| Feld | Standard | Bedeutung |
|---|---|---|
| `mode` | `'original'` | Zufallsmodell |
| `players` | 1 | Spielerzahl (Bedienung bietet 1 und 2) |
| `sound`, `vibration` | `true` | nur Ausgabe, keine Spielregel |
| `creature` | `'crocodile'` | gewähltes Lebewesen (Kennung aus dem Katalog) |
| `teethOverride` | `null` | abweichende Zahl drückbarer Zähne; `null` heißt: so viele, wie der Katalog vorsieht |

`teethOverride: null` ist die **einzige** Darstellung von „Standard". `effectiveTeeth` liefert
`teethOverride ?? getCreature(creature).teeth`; ein Tipp auf „+"/„−" klemmt auf `MIN_TEETH`..
`MAX_TEETH` und setzt den Wert wieder auf `null`, sobald er die Katalogzahl trifft — an den Grenzen
ändert der Tipp nichts, sonst startete ein Tipp auf den abgeblendeten Rand die laufende Runde neu. Ein
Tierwechsel setzt `teethOverride` ebenfalls auf `null` (ein anderes Tier bringt sein eigenes Gebiss
mit); dasselbe Tier erneut zu tippen ändert nichts.

Geladen wird nicht blind vertraut (`loadSettings` in `infrastructure/storage/localStorageSettings.ts`):
`mode` nur `original`/`classic`, sonst Standard; `players` ganzzahlig und auf **1..
`MAX_SELECTABLE_PLAYERS`** geklemmt (eine alte Vier-Spieler-Einstellung wird also zu 2, obwohl der
Kern 4 akzeptiert); `sound`/`vibration` nur `false`, wenn ausdrücklich `false` gespeichert ist;
unbekanntes Lebewesen → Krokodil; `teethOverride` nur bei `isValidToothCount`, sonst `null`; ein
Lesefehler liefert `DEFAULT_SETTINGS`. Alte Schlüssel werden einmalig übernommen.

Auf die laufende Runde wirken nur vier Felder: `mode`, `players`, `creature`, `teethOverride`. Ändert
sich eines davon, ruft die Steuerung `resetRound()` — die laufende Runde wird verworfen, ein aktives
Halten abgebrochen und die Bühne neu gebaut. `sound` und `vibration` ändern dagegen nie den
Spielzustand; beim Ausschalten des Tons stoppt die Steuerung nur, was gerade klingt. Die neue Runde
entsteht aus `creatureId: settings.creature`, `teeth: settings.teethOverride ?? undefined`,
`mode`, `players` — nur diese vier Werte reicht die Steuerung an `openRound` weiter.

## Die bekannte Falle: Rundenzahl in der Kopfzeile ≠ Rundennummer des Protokolls

Zwei verschiedene Zahlen tragen fast denselben Namen:

| Zahl | Herkunft | Bedeutung |
|---|---|---|
| Zahl in `#hud-round` (Kopfzeile der Spielseite) | `recorder.count() + 1` in `gameController.render()` | **Zahl der Einträge im Protokoll plus eins** — „so viele Runden liegen in diesem Browser" |
| `RoundRecord.round` (Protokoll, CSV-Spalte `runde`, Statistikseite „Runde N") | `nextRoundNumber(records)` = größte vergebene Nummer + 1 | die laufende Nummer der Aufzeichnung, für den CSV-Austausch mit dem Analyse-Werkzeug |

Beide stimmen überein, solange das Protokoll die Nummern 1..Anzahl lückenlos trägt — und fallen
auseinander, sobald es das nicht mehr tut. Der Test „hängt an das Protokoll an, wie es jetzt in der
Ablage steht" legt die Runden 7 und 8 in die Ablage; der nächste Biss schreibt Runde **9**, die
Kopfzeile zählt die zwei Einträge und zeigt **3**. Nach „Protokoll löschen" steht dort wieder 1 (Test
„zeigt nach `syncLog()` die Rundennummer des geänderten Protokolls").

Drei Details, die man beim Ändern kennen muss:

- Die Kopfzeile rechnet mit einem **Schnappschuss**: `count()` liefert die Länge von
  `currentRecords`, und das wird nur beim Anhängen (vorher neu lesen) und bei `sync()` neu geladen.
  Änderungen von außen erreichen die Steuerung als `changed-outside` über den `LogFeed` und lösen
  `syncLog()` aus — bis dahin kann die Kopfzeile veraltet sein.
- Beim Anhängen wird die Nummer aus dem **frisch gelesenen** Protokoll berechnet, nicht aus dem Stand
  vom Seitenstart: sonst schriebe ein Biss gelöschte Runden zurück und importierte weg.
- Fortgeschrieben wird an drei Stellen: der Import hängt hinter der aktuellen Höchstnummer an,
  `mergeRoundLogs` behält die Nummern der Sicherung und zählt nur die lokal neuen weiter, und die
  Identität zweier Einträge (`playedAt|creature|teeth|mode|pressOrder`) enthält die laufende Nummer
  bewusst **nicht**.

Diese Doppeldeutigkeit ist keine Nachlässigkeit, sondern eine Absage (Entscheidung E5 vom 15.10.2026):
die Zahl in der Kopfzeile ist für das Kind die verständliche („meine 47. Runde hier"), und „Deine 47.
Runde" wäre im Zweispieler-Spiel falsch, weil die Runde keinem Kind allein gehört. Wer hier etwas
umbenennt oder „vereinheitlicht", ändert eine getroffene Entscheidung — nicht einen Fehler.

## Tests, die diese Regeln halten

- `src/core/domain/round.test.ts` — Öffnen ohne gedrückte Zähne, ungültige Zahn- und Spielerzahlen,
  Ein-Zahn-Runde schnappt in beiden Modi, harmloser Zahn bleibt offen, Zuschnappen nennt Zahn,
  Druck-Nummer, Spieler und `liveCount`, Verliererrotation, Zurückweisen von Doppeldruck/fremdem
  Zahn/Druck nach dem Zuschnappen, Unveränderlichkeit, letzter Zahn, Gebiss aus dem Katalog
  (Wolf 12 Zähne), Grenzen gehen an die Auswahl, unbekanntes Tier wirft, abweichende Zahnzahl erlaubt.
- `src/core/domain/liveTeeth.test.ts` — `classic` genau ein Zahn, Kappung bei einem Zahn, 1–3 im
  Originalmodell, keine Doppelten, Reproduzierbarkeit bei gleichem Startwert, Obergrenze des Gebisses,
  unsinnige Grenzen.
- `src/core/domain/creature.test.ts`, `src/presentation/game/creatures/creatureViews.test.ts`,
  `src/katalog-json.test.ts` — Katalog, Zeichnungs-Registry und die erzeugte Katalogdatei passen
  zusammen.
- `src/presentation/game/gameController.test.ts` — Rundenzahl der Kopfzeile, Anhängen an den
  aktuellen Ablagestand, Tierwechsel und Zahnzahl-Override in Bühne, Anzeige und Protokoll.
- `src/core/use-cases/playPress.test.ts` — der Kern kündigt den Biss an, ohne dass die Bedienung die
  scharfen Zähne kennt, und reicht `DomainError` weiter.

## Verwandte Seiten

- [Zufall und Spannung](zufall-und-spannung.md) — was die scharfen Zähne zieht und wie daraus
  Bissgefahr, Zucken und Balken werden.
- [Sterne und Freischaltung](sterne-und-freischaltung.md) — was eine beendete Runde im Album auslöst.
- [Spielzug](../workflows/spielzug.md) — Geste, Halten, Dramaturgie, Ergebnis und Protokolleintrag.
- [Schichten, Ports und die Importregel](../architecture/schichten-und-importregel.md) — warum dieses
  Modell ohne Browser, DOM und Uhr prüfbar bleibt.
- Im Repository: `docs/domain-model.md` (Vokabular und Ehrlichkeitsregeln), `src/core/domain/round.ts`,
  `src/core/domain/teeth.ts`, `src/core/domain/creature.ts`, `src/core/domain/settings.ts`,
  `src/core/domain/errors.ts`.
