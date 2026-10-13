# Architektur

## Schichten

```
core/domain      Fachregeln in Reinform: Zähne, Runde, Zufallsmodell, Spannung, Statistik
core/ports       Nähte nach außen: RandomSource, LiveTeethSelector, RoundLogPort, RemoteLogPort, SoundPort, HapticsPort
core/use-cases   Abläufe: playPress (ein Druck samt Dramaturgie), syncRoundLog (Abgleich mit der Sicherung)
contract         Außenvertrag der Bedienung: Rundenprotokoll (RoundRecord, CSV-Format)
infrastructure   Adapter: crypto-Zufall, Web-Audio, Vibration, localStorage, Testattrappen
presentation     Bedienung: Spielsteuerung, SVG-Zeichnung, Statistikansicht, Seiten
```

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
| `invalid-tooth-count` | Zahnzahl außerhalb 4..12 oder keine ganze Zahl |
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
