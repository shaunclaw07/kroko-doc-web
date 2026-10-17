# Architektur

> **Art:** Regel — Zweck: Schichten, Importregel A1–A8 und Fehlerarten des Kerns; erzwungen von `src/architecture.test.ts`.
> **Verwandt:** [`docs/freischaltung.md`](freischaltung.md), [`docs/e2e-nachweise.md`](e2e-nachweise.md), [`docs/fallen.md`](fallen.md)

## Schichten

```
core/domain      Fachregeln in Reinform: Katalog der Wesen, Zähne, Runde, Zufallsmodell, Spannung,
                 Statistik, Album und Freischaltung, Einstellungen (GameSettings), Rundenprotokoll
core/ports       Nähte nach außen: RandomSource, LiveTeethSelector, RoundLogPort, RemoteLogPort,
                 SoundPort, HapticsPort, SessionMarkPort
core/use-cases   Abläufe: playPress (ein Druck samt Dramaturgie), syncRoundLog (Abgleich mit der Sicherung)
contract         Außenvertrag der Bedienung: reicht RoundRecord und CSV_HEADER aus core/domain/records weiter
infrastructure   Adapter: crypto-Zufall, Web-Audio und Stimmen, Vibration, localStorage/sessionStorage,
                 Sicherung über HTTP, Testattrappen
presentation     Bedienung: Verdrahtung der Seiten, Spielsteuerung, Einstellungen, SVG-Zeichnung,
                 Statistikseite, Stile
```

Die Astro-Seiten (`src/pages/`, `src/layouts/`) gehören zu keiner Mappe in `FOLDER_LAYER`: ihr
Skript baut nur die Adapter und ruft **eine** Verdrahtungsfunktion der Bedienung (`wireGamePage`
in `presentation/game/gamePage.ts`, `wireStatsPage` in `presentation/stats/statsPage.ts`). Alles,
was darüber hinausgeht, steht in geprüften Modulen — das Skript einer `.astro`-Seite prüft weder
`tsc` noch jsdom ([`docs/freischaltung.md`](freischaltung.md), letzter Punkt).

**Tondateien.** Die Tierstimmen sind die einzigen Klänge aus Dateien (`public/sounds/voices/`).
Der Kern kennt davon nur eine Naht: `SoundPort.playVoice(creatureId)`. Welche Datei zu welchem
Tier gehört (`infrastructure/audio/creatureVoices.ts`), wie sie geholt (`fetch`) und dekodiert
wird (`decodeAudioData`), steht allein im Adapter `infrastructure/audio/webAudioEngine.ts` — die
Bedienung nennt nur die Kennung des Tiers und reicht den Basis-Pfad der Seite herein. Im Test
ersetzt eine Ladefunktion (`loadVoice`) das Netz und `FakeAudioContext` das Dekodieren.

**Sicherung der Runden.** Ein Kinderprofil verwirft beim Schließen des Browsers alles, was die
Seite im Gerät ablegt — damit auch die Sterne, die aus dem Rundenprotokoll abgeleitet werden.
Trägt die Adresse einen Sicherungscode (`…/s/<code>` oder `?s=<code>`), gleicht die Seite ihr Protokoll deshalb mit einem
kleinen Worker ab (`worker/backup.js`, Cloudflare, unter dem eigenen Ursprung: `api/log/<code>`).
Der Kern kennt davon eine Naht (`RemoteLogPort`: holen, schreiben), eine Regel
(`mergeRoundLogs`: der Stand der Sicherung bleibt, was nur das Gerät kennt, wird angehängt) und
einen Ablauf (`syncRoundLog`). Der Adapter `infrastructure/storage/httpRemoteLog.ts` spricht mit
dem Worker; `presentation/game/backupSync.ts` reiht die Abgleiche hintereinander und meldet ihr
Ergebnis. **Ohne Code geschieht nichts** — kein Abruf, kein Knopf, kein Hinweis: die Sicherung
ist kein Angebot der öffentlichen Seite, der Worker kennt nur Codes, die der Betreiber selbst
angelegt hat. `worker/` liegt außerhalb von `src/` und gehört zu keiner Schicht.

## Die Bedienung im Innern

Seit dem Aufräumen vom 14.10.2026 (Nachweise in [`docs/e2e-nachweise.md`](e2e-nachweise.md)):

- **Eine Quelle für die Einstellungen.** `presentation/game/settingsStore.ts` hält `GameSettings`
  (`get`, `set`, `subscribe`). Spielsteuerung, Schnellleiste und Einstellungsblatt melden sich dort
  an und lesen bei jedem Griff `get()` — eine Kopie vom Seitenstart setzte nach einem Tierwechsel das
  alte Tier zurück (gefunden im Review, Test in `settingsSheet.test.ts`). Gespeichert wird über
  `infrastructure/storage/localStorageSettings.ts`.
- **Eine Quelle für Änderungen am Protokoll.** `presentation/game/logFeed.ts` unterscheidet
  `roundFinished` (eigener Biss: Sterne, Karte, Konfetti) von `changedOutside` (anderer Tab,
  Zurück-Taste, Abgleich mit der Sicherung: still aktualisieren). Ein DOM-Ereignis gibt es dafür
  nicht mehr.
- **Die Spielsteuerung ist aufgeteilt.** `gameController.ts` hält die Runde und reicht weiter an
  `holdGesture.ts` (Halten und Wegschieben eines Zahns), `hudModel.ts` (was die Anzeige sagt — reine
  Rechnung ohne DOM), `hudView.ts` (schreibt es in die Seite), `resultText.ts` (Sätze nach dem Biss)
  und `roundRecorder.ts` (die fertige Runde ins Protokoll). **Zeitgeber laufen nur über `wait` der
  Steuerung**, kein Teilmodul ruft `setTimeout` selbst; jeder verzögerte Rückruf prüft, ob seine
  Runde noch gilt ([`docs/fallen.md`](fallen.md)).
- **Die Zeichnung kennt kein Spiel.** `presentation/game/creatures/` liefert je Wesen ein
  Kunstwerk und eine Fabrik, die daraus SVG baut; die Steuerung kennt kein einzelnes Tier. Was zu
  einem neuen Tier gehört: [`docs/neues-tier.md`](neues-tier.md).

## Die Importregel (A1–A6)

| ID | Regel |
|---|---|
| A1 | `core/domain` darf nur `core/domain` und `core/ports` importieren. |
| A2 | `core/ports` darf nur `core/ports`, `core/domain` und `contract` importieren. |
| A3 | `core/use-cases` darf `core/*` und `contract` importieren. |
| A4 | `contract` darf `contract` und `core/domain` importieren. |
| A5 | `infrastructure` darf alles außer `presentation` importieren. |
| A6 | `presentation` darf alles importieren; sie ist die Kompositionswurzel. |

Zusätzlich (A7/A8):

| ID | Regel |
|---|---|
| A7 | `node:*`-Importe sind nur in `infrastructure` und in Testdateien erlaubt. |
| A8 | `core/domain` und `core/use-cases` enthalten kein `document`, `window`, `localStorage`, `navigator`, `performance.now` und kein `new Date(`. Die Uhr kommt von außen (`playedAt` setzt die Bedienung). |

Durchsetzung: `src/architecture.test.ts`. Jede Mappe unter `src/` muss in `FOLDER_LAYER`
stehen, sonst schlägt der Lauf fehl. **Dieser Test darf nie rot sein.**

## Fehlerarten

Der Kern wirft `DomainError` mit `code`:

| Code | Auslöser |
|---|---|
| `tooth-out-of-range` | Zahn außerhalb 1..n oder keine ganze Zahl |
| `tooth-already-pressed` | derselbe Zahn zweimal in einer Runde |
| `round-finished` | Druck nach dem Zuschnappen |
| `invalid-tooth-count` | Zahnzahl außerhalb 1..12 (`MIN_TEETH`, `MAX_TEETH` in `core/domain/teeth.ts`) oder keine ganze Zahl |
| `invalid-player-count` | Spielerzahl außerhalb 1..4 |
| `unknown-creature` | Gebiss-Kennung, die nicht im Katalog steht (`getCreature`) |

Die Bedienung fängt Verstöße ab, bevor sie entstehen (sie prüft den Zustand selbst), und
zeigt deutsche Texte statt der englischen Kernmeldungen.

## Warum diese Trennung hier wirklich Geld spart

- Die Dramaturgie (Spannung, Pause, Riss, Zucken, Erleichterung) ist **reine Rechnung** in
  `core/domain/tension.ts`. Damit ist der Nervenkitzel prüfbar, obwohl er sich in Ton und
  Bild abspielt.
- Die Entscheidung „schnappt dieser Druck zu?" bleibt im Kern (`playPress`). Die Bedienung
  bekommt nur die Dramaturgie — sie könnte das Geheimnis sonst über die Wartezeit verraten.
- Die Statistik ist reine Mathematik (`core/domain/statistics.ts`) und wird in der
  Bedienung nur noch formatiert.
