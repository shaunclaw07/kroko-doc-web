# Tierstimmen: jedes Tier klingt anders — Umsetzungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Jedes der zehn Tiere hat eine eigene Stimme als kurze, mit ausgelieferte Tondatei: sie erklingt, wenn das Tier gewählt wird, und kurz nach dem Zuschnappen.

**Architecture:** Zehn MP3-Dateien liegen unter `public/sounds/voices/`, je Tier eine; ihre Herkunft und Lizenz stehen daneben in `QUELLEN.md`. Eine Zuordnung Tier → Datei steht in `infrastructure/audio/creatureVoices.ts`. Die bestehende `WebAudioEngine` lädt die Dateien nach der ersten Nutzergeste, dekodiert sie im **selben** Audio-Kontext und spielt sie über die neue Methode `playVoice(creatureId)` — damit gelten Ton-Schalter, Freigabe und `stopAll()` wie für jeden anderen Klang. Der `SoundPort` wächst um diese eine Methode; die Steuerung ruft sie an zwei Stellen.

**Tech Stack:** TypeScript, Web Audio (`decodeAudioData`), `fetch`, Vitest mit `FakeAudioContext`, `ffmpeg` 9 (liegt auf diesem Rechner unter scoop) zum Schneiden.

**Spec:** Es gibt kein eigenes Spec-Dokument. Grundlage sind die Entscheidungen unten; sie wandern in Aufgabe 5 als Nachtrag nach `docs/plan.md`. Vor dem Bau lesen: `AGENTS.md` (Abschnitte „Rückmeldung an den Nutzer" und „Basis-Pfad", Fallen zu Zeitgebern und zur ersten Nutzergeste), `docs/architecture.md`.

## Entscheidungen

Vom Auftraggeber entschieden (12.10.2026):

1. **Dateien statt Synthese, mit ausgeliefert.** Die Regel „Klänge synthetisiert, keine Dateien" (`README.md`, `docs/workflow.md`) fällt für die Tierstimmen. Die Spielklänge (Tipp, Herzschlag, Biss …) bleiben synthetisiert.
2. **Eine Mischung:** echte Aufnahmen für die Tiere, **generiert** für das Kichern des Vampirs und das „Oh-oh" des Menschen.
3. **Kostenlos.**

Meine Empfehlung dazu, vom Auftraggeber zu bestätigen:

4. **Nur gemeinfreie Aufnahmen (CC0 / Public Domain).** Dann braucht es keine Namensnennung im Spiel. Findet sich für ein Tier nichts, ist CC BY der Ausweg — mit Nennung im Regeln-Blatt.
5. **Ersatz, wo es keine echte Stimme gibt:** der Hai blubbert (Luftblasen unter Wasser — Haie sind stumm), der Säbelzahntiger bekommt einen Tiger, der Panther einen Leoparden, der Panda darf Bambus mampfen.
6. **Zwei Anlässe:** beim Wählen eines anderen Tiers und 120 ms nach dem Biss. Die Stimme kommt nie vor dem Urteil und nie bei einem harmlosen Druck — sie verrät nichts.
7. **Kurz und leise:** jede Datei höchstens 1,5 s, Mono, auf −3 dB Spitze angeglichen und mit 0,6 abgespielt (der Biss liegt bei 0,9). Ein echtes Löwenbrüllen soll ein sechsjähriges Kind nicht erschrecken.
8. **Wer auswählt:** ich kann Klänge nicht anhören. Ich suche Kandidaten, prüfe die Lizenz und schneide; **der Auftraggeber hört und wählt** (Aufgabe 1).
9. **Kein eigener Schalter.** Die Stimmen hängen am Schalter „Ton". Ist er aus, wird auch nichts geladen.
10. **Offen bis zur Hörprobe:** nach dem Biss laufen Biss-Klang, Stimme und Verlierer-Tonfolge übereinander. Matscht das, erklingt die Stimme nur beim Wählen — eine Zeile in `snap()` entfällt.

## Die zehn Stimmen

| Tier | Datei | Was gesucht wird | Herkunft |
|---|---|---|---|
| crocodile | `crocodile.mp3` | tiefes Grollen (Alligator-Bellow oder Krokodil) | Aufnahme |
| wolf | `wolf.mp3` | ein einzelnes Heulen | Aufnahme |
| human | `human.mp3` | „Oh-oh", freundlich | generiert |
| shark | `shark.mp3` | Blubbern unter Wasser | Aufnahme |
| mouse | `mouse.mp3` | Quieken | Aufnahme |
| vampire | `vampire.mp3` | Kichern, nicht gruselig | generiert |
| panda | `panda.mp3` | Mampfen (Bambus) oder Meckern | Aufnahme |
| lion | `lion.mp3` | kurzes Brüllen | Aufnahme |
| panther | `panther.mp3` | Fauchen oder das „Sägen" des Leoparden | Aufnahme |
| sabertooth | `sabertooth.mp3` | Knurren eines Tigers | Aufnahme |

## Global Constraints

- Sprache: Code, Namen, Meldungen **englisch**; Kommentare, Doku, UI-Texte, Commit-Beschreibungen **deutsch**.
- Gate ist beides: `pnpm typecheck` **und** `pnpm test:run` (`pnpm gate`). Exit-Code nie über eine Pipe prüfen.
- Niemals `git add -A` — explizite Pfade. Vor jedem Commit `git status --short`.
- Gearbeitet wird auf dem Zweig `tierstimmen`, **nicht** auf `main`. Kein Push ohne Auftrag.
- Jede Datei: MP3, Mono, 44,1 kHz, 64 kbit/s, ohne Metadaten, höchstens **1,5 s** und höchstens **16 000 Byte**.
- Jede Datei hat in `public/sounds/voices/QUELLEN.md` eine Zeile mit Urheber, Lizenz, Adresse der Quelle und Abrufdatum. Eine Datei ohne Zeile wird nicht ausgeliefert — ein Test hält das fest.
- Keine Pakete, kein CDN: die Dateien liegen im eigenen Baum und kommen vom eigenen Ursprung.
- Adressen nur über `import.meta.env.BASE_URL`, nie absolut mit `"/"`.
- Browser-Schnittstellen nie in der Bedienung: Ton nur über `SoundPort`; `fetch` und `decodeAudioData` stehen in `infrastructure/audio/`.
- Vor `unlock()` passiert **nichts**: kein Kontext, kein Abruf, kein Klang. Ist der Ton aus, wird auch nichts geladen.
- Eine Stimme, die zu spät fertig geladen ist (mehr als 0,5 s nach dem Anlass) oder deren Anlass von `stopAll()` überholt wurde, erklingt nicht mehr.
- Fehlt eine Datei, schlägt das Laden fehl oder kennt die Zuordnung das Tier nicht: das Spiel bleibt still und läuft weiter.
- Zeitgeber nie am globalen `window`; jeder verzögerte Rückruf prüft, ob seine Runde noch gilt.

## Review Focus

1. **Tier wählen als allererste Geste:** die Datei ist noch nicht geladen — die Stimme kommt, sobald sie da ist, aber nur innerhalb von 0,5 s. → Test, Aufgabe 3.
2. **Neue Runde in den 120 ms nach dem Biss:** die Stimme der alten Runde erklingt nicht mehr, die neue Zeichnung bekommt nicht `is-clenching`. → Test, Aufgabe 4.
3. **Kein Netz beim ersten Versuch:** der Fehlschlag wird nicht für immer gemerkt; der nächste Anlass versucht es erneut. → Test, Aufgabe 3.
4. **Ton aus:** kein Abruf, kein Knoten — auch nicht beim Freigeben. → Test, Aufgabe 3.
5. **Seite unter einem Unterpfad (`ASTRO_BASE`):** die Adresse der Dateien trägt den Basis-Pfad. → Test, Aufgabe 3; nachsehen in `dist/`, Aufgabe 5.

---

### Task 1: Die zehn Dateien beschaffen

Diese Aufgabe braucht den Auftraggeber: er hört die Kandidaten an und wählt.

**Files:**
- Create: `scripts/stimme-schneiden.sh`
- Create: `public/sounds/voices/<tier>.mp3` (zehn Dateien)
- Create: `public/sounds/voices/QUELLEN.md`

**Interfaces:**
- Produces: zehn Dateien mit den Namen aus der Tabelle „Die zehn Stimmen" und `QUELLEN.md` mit einer Tabellenzeile je Datei (Spalten: Datei · Was · Urheber · Lizenz · Quelle · Abgerufen).

- [ ] **Step 1: Zweig anlegen**

```bash
git switch -c tierstimmen
```

- [ ] **Step 2: Das Schneidewerkzeug schreiben**

`scripts/stimme-schneiden.sh`:

```bash
#!/usr/bin/env bash
# Schneidet eine Tierstimme aus einer Aufnahme und legt sie so ab, wie das Spiel sie ausliefert:
# Mono, 44,1 kHz, MP3 mit 64 kbit/s, ohne Metadaten, weich ein- und ausgeblendet und auf −3 dB
# Spitze angeglichen (bei so kurzen Stücken misst `loudnorm` nicht verlässlich).
#
# Aufruf:  bash scripts/stimme-schneiden.sh <quelle> <tier> <start-sekunden> <dauer-sekunden>
# Beispiel: bash scripts/stimme-schneiden.sh "$TMPDIR/zahn_agent-stimmen/wolf/a.ogg" wolf 2.4 1.3
set -euo pipefail

quelle="$1"; tier="$2"; start="$3"; dauer="$4"
ziel="public/sounds/voices/${tier}.mp3"
mkdir -p "$(dirname "$ziel")"

# Länger als 1,5 s wird nicht ausgeliefert.
awk -v d="$dauer" 'BEGIN { exit !(d > 0 && d <= 1.5) }' || { echo "Dauer muss zwischen 0 und 1,5 s liegen" >&2; exit 1; }

spitze=$(ffmpeg -hide_banner -ss "$start" -t "$dauer" -i "$quelle" -af volumedetect -f null - 2>&1 \
  | sed -n 's/.*max_volume: \(-\{0,1\}[0-9.]*\) dB.*/\1/p')
[ -n "$spitze" ] || { echo "Spitzenpegel nicht messbar — ist das eine Tondatei?" >&2; exit 1; }
hub=$(awk -v p="$spitze" 'BEGIN { printf "%.1f", -3 - p }')
aus=$(awk -v d="$dauer" 'BEGIN { printf "%.2f", d - 0.12 }')

ffmpeg -hide_banner -loglevel error -y -ss "$start" -t "$dauer" -i "$quelle" \
  -ac 1 -ar 44100 \
  -af "volume=${hub}dB,afade=t=in:st=0:d=0.02,afade=t=out:st=${aus}:d=0.12" \
  -map_metadata -1 -codec:a libmp3lame -b:a 64k "$ziel"

echo "$ziel: $(wc -c < "$ziel") Byte, Spitze vorher ${spitze} dB, angehoben um ${hub} dB"
```

- [ ] **Step 3: Kandidaten suchen — nur gemeinfrei**

Wikimedia Commons lässt sich ohne Anmeldung abfragen und nennt die Lizenz je Datei. Je Tier (acht Aufnahmen, siehe Tabelle) die Suche fahren und die Antwort **lesen**:

```bash
curl -s "https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=15&gsrsearch=filetype:audio%20wolf%20howl&prop=imageinfo&iiprop=url%7Cextmetadata%7Csize"
```

Übernommen wird nur, was unter `extmetadata.LicenseShortName` „CC0" oder „Public domain" trägt. Je Tier zwei bis drei Kandidaten nach `$TMPDIR/zahn_agent-stimmen/<tier>/` laden und Urheber, Lizenz und Adresse der Dateiseite notieren. Findet sich für ein Tier nichts Gemeinfreies: Freesound mit Filter „Creative Commons 0" von Hand durchsuchen; erst danach CC BY erwägen (Entscheidung 4) und den Auftraggeber fragen.

- [ ] **Step 4: Anhören lassen**

Eine Seite `$TMPDIR/zahn_agent-stimmen/index.html` schreiben, die je Tier die Kandidaten als `<audio controls>` zeigt, und dem Auftraggeber den Pfad nennen. Er wählt je Tier einen Kandidaten und die Stelle (Startsekunde); ist keiner freundlich genug, zurück zu Schritt 3.

- [ ] **Step 5: Die zwei generierten Stimmen**

„Oh-oh" (Mensch) und Kichern (Vampir) erzeugt der Auftraggeber mit einem Klanggenerator seiner Wahl — oder nimmt sie selbst auf, das ist die sauberste Lizenz. **Vor** der Verwendung die Nutzungsbedingungen des Werkzeugs lesen: erlaubt sein muss die kostenlose Weitergabe in einer öffentlichen Web-App, und eine verlangte Namensnennung gehört ins Regeln-Blatt. Werkzeug, Datum und Adresse der Bedingungen kommen in `QUELLEN.md`. Die Dateien nach `$TMPDIR/zahn_agent-stimmen/human/` und `…/vampire/` legen.

- [ ] **Step 6: Schneiden**

Für jedes der zehn Tiere mit der gewählten Quelle und Stelle:

```bash
bash scripts/stimme-schneiden.sh "<quelle>" <tier> <start> <dauer>
```

Expected: je Zeile `public/sounds/voices/<tier>.mp3: <höchstens 16000> Byte, …`. Danach nachmessen:

```bash
for f in public/sounds/voices/*.mp3; do
  echo "$f $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f") s $(wc -c < "$f") Byte"
done
```

Expected: zehn Zeilen, jede Dauer ≤ 1,5 s (MP3 hängt wenige Hundertstel an), jede Größe ≤ 16 000 Byte.

- [ ] **Step 7: `QUELLEN.md` schreiben**

`public/sounds/voices/QUELLEN.md` mit der Überschrift „Tierstimmen: Herkunft und Lizenz" und einer Tabelle (Datei · Was · Urheber · Lizenz · Quelle · Abgerufen), eine Zeile je Datei, die Adresse der Quelle ausgeschrieben. Die Datei wird mit ausgeliefert — das ist gewollt: die Herkunft liegt neben dem Klang.

- [ ] **Step 8: Der Auftraggeber hört die geschnittenen Dateien**

Die zehn fertigen Dateien einmal hintereinander anhören lassen: gleich laut? keine erschreckend? Abweichungen mit einem anderen Start oder kürzerer Dauer neu schneiden.

- [ ] **Step 9: Commit**

```bash
git add scripts/stimme-schneiden.sh public/sounds/voices
git status --short
git commit -m "Ton: zehn Tierstimmen als Dateien, Herkunft und Lizenz daneben; Schneidewerkzeug"
```

---

### Task 2: Zuordnung Tier → Datei, mit Wächter

**Files:**
- Create: `src/infrastructure/audio/creatureVoices.ts`
- Test: `src/infrastructure/audio/creatureVoices.test.ts`

**Interfaces:**
- Consumes: die Dateien und `QUELLEN.md` aus Aufgabe 1.
- Produces: `CREATURE_VOICE_FILES: Readonly<Record<string, string>>` (Kennung → Dateiname), `MAX_VOICE_BYTES = 16000`, `voiceUrl(baseUrl: string, creatureId: string): string | null`.

- [ ] **Step 1: Den fallenden Test schreiben**

`src/infrastructure/audio/creatureVoices.test.ts`:

```ts
import { existsSync, readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { listCreatures } from '../../core/domain/creature';
import { CREATURE_VOICE_FILES, MAX_VOICE_BYTES, voiceUrl } from './creatureVoices';

const FOLDER = new URL('../../../public/sounds/voices/', import.meta.url);
const SOURCES = readFileSync(new URL('QUELLEN.md', FOLDER), 'utf8');

describe('Tierstimmen als Dateien', () => {
  it('gibt jedem Tier des Katalogs eine Datei — und keinem, das es nicht gibt', () => {
    const ids = listCreatures().map((creature) => creature.id).sort();
    expect(Object.keys(CREATURE_VOICE_FILES).sort()).toEqual(ids);
  });

  it('liefert jede Datei wirklich aus: vorhanden, MP3, klein genug', () => {
    for (const [id, file] of Object.entries(CREATURE_VOICE_FILES)) {
      const path = new URL(file, FOLDER);
      expect(existsSync(path), `${id}: ${file} fehlt`).toBe(true);
      expect(statSync(path).size, id).toBeLessThanOrEqual(MAX_VOICE_BYTES);
      expect(statSync(path).size, id).toBeGreaterThan(1000);
      // Ein MP3-Rahmen beginnt mit elf gesetzten Bits (das Werkzeug schreibt keine ID3-Marke).
      const head = readFileSync(path).subarray(0, 2);
      expect(head[0], id).toBe(0xff);
      expect((head[1] ?? 0) & 0xe0, id).toBe(0xe0);
    }
  });

  it('nennt für jede Datei Lizenz und Quelle — sonst wird sie nicht ausgeliefert', () => {
    for (const [id, file] of Object.entries(CREATURE_VOICE_FILES)) {
      const row = SOURCES.split('\n').find((line) => line.includes(`\`${file}\``));
      expect(row, `${id}: ${file} steht nicht in QUELLEN.md`).toBeDefined();
      expect(row, id).toMatch(/CC0|Public Domain|gemeinfrei|CC BY|selbst aufgenommen|generiert/i);
      expect(row, id).toMatch(/https?:\/\/|selbst aufgenommen/);
    }
  });

  it('baut die Adresse aus dem Basis-Pfad und kennt kein fremdes Tier', () => {
    expect(voiceUrl('/', 'wolf')).toBe('/sounds/voices/wolf.mp3');
    expect(voiceUrl('/zahn_agent/', 'wolf')).toBe('/zahn_agent/sounds/voices/wolf.mp3');
    expect(voiceUrl('/', 'dragon')).toBeNull();
  });
});
```

- [ ] **Step 2: Lauf — der Test muss fallen**

Run: `pnpm vitest run src/infrastructure/audio/creatureVoices.test.ts`
Expected: FAIL („Cannot find module './creatureVoices'").

- [ ] **Step 3: Die Zuordnung schreiben**

`src/infrastructure/audio/creatureVoices.ts`:

```ts
/**
 * Die Stimmen der Tiere sind kurze Tondateien unter `public/sounds/voices/` — die einzigen Klänge
 * des Spiels, die nicht synthetisiert sind (Entscheidung vom 12.10.2026). Herkunft und Lizenz jeder
 * Datei stehen daneben in `QUELLEN.md`; ein Test liefert keine Datei ohne diese Zeile aus.
 */
export const CREATURE_VOICE_FILES: Readonly<Record<string, string>> = {
  crocodile: 'crocodile.mp3',
  wolf: 'wolf.mp3',
  human: 'human.mp3',
  shark: 'shark.mp3',
  mouse: 'mouse.mp3',
  vampire: 'vampire.mp3',
  panda: 'panda.mp3',
  lion: 'lion.mp3',
  panther: 'panther.mp3',
  sabertooth: 'sabertooth.mp3',
};

/** Obergrenze je Datei: 64 kbit/s sind 8000 Byte je Sekunde — das hält sie zugleich kurz. */
export const MAX_VOICE_BYTES = 16000;

/** Adresse einer Stimme unter dem Basis-Pfad der Seite (mit Schluss-Schrägstrich). */
export function voiceUrl(baseUrl: string, creatureId: string): string | null {
  const file = CREATURE_VOICE_FILES[creatureId];
  return file === undefined ? null : `${baseUrl}sounds/voices/${file}`;
}
```

- [ ] **Step 4: Lauf — grün, dann Gate**

Run: `pnpm vitest run src/infrastructure/audio/creatureVoices.test.ts` → PASS.
Run: `pnpm gate` → grün (`infrastructure/audio` steht in `FOLDER_LAYER`; `node:fs` ist in der Infrastruktur erlaubt).

- [ ] **Step 5: Commit**

```bash
git add src/infrastructure/audio/creatureVoices.ts src/infrastructure/audio/creatureVoices.test.ts
git commit -m "Ton: Zuordnung Tier zu Stimmdatei; ein Test liefert keine Datei ohne Lizenzzeile aus"
```

---

### Task 3: Port und Engine laden und spielen eine Stimme

**Files:**
- Modify: `src/core/ports/sound.ts` (neue Methode)
- Modify: `src/infrastructure/audio/webAudioEngine.ts`
- Modify: `src/infrastructure/testing/fakeAudioContext.ts` (`decodeAudioData`)
- Modify: `src/infrastructure/testing/recordingSound.ts` (`voices`)
- Test: `src/infrastructure/audio/webAudioEngine.test.ts`

**Interfaces:**
- Consumes: `CREATURE_VOICE_FILES`, `voiceUrl` aus Aufgabe 2.
- Produces: `SoundPort.playVoice(creatureId: string): void`.
- Produces: `WebAudioEngineOptions.loadVoice?: (creatureId: string) => Promise<ArrayBuffer | null>` und `WebAudioEngineOptions.voiceBaseUrl?: string`.
- Produces: `createVoiceLoader(baseUrl: string): (creatureId: string) => Promise<ArrayBuffer | null>`.
- Produces: `AudioContextLike.decodeAudioData(data, onDecoded?, onError?)`; `FakeAudioContext.decodedCount: number`.
- Produces: `RecordingSound.voices: string[]` — Kennungen in der Reihenfolge der Aufrufe (stumm: nichts).
- Produces: `VOICE_GAIN = 0.6`, `VOICE_LATE_LIMIT_S = 0.5` (exportiert aus `webAudioEngine.ts`).

- [ ] **Step 1: Die Attrappen erweitern**

In `src/infrastructure/testing/fakeAudioContext.ts` in `FakeAudioContext` ein Feld `decodedCount = 0;` und die Methode:

```ts
  /** Dekodieren kostet im Test nichts: ein Byte gilt als ein Abtastwert (24 000 Byte = 0,5 s). */
  decodeAudioData(data: ArrayBuffer): Promise<AudioBufferLike> {
    this.decodedCount += 1;
    return Promise.resolve(new FakeAudioBuffer(1, Math.max(1, data.byteLength), this.sampleRate));
  }
```

In `src/infrastructure/testing/recordingSound.ts` ein Feld `readonly voices: string[] = [];` nach `events` und die Methode nach `play`:

```ts
  playVoice(creatureId: string): void {
    if (this.muted) {
      return;
    }
    this.voices.push(creatureId);
  }
```

- [ ] **Step 2: Die fallenden Tests schreiben**

In `src/infrastructure/audio/webAudioEngine.test.ts` am Ende anhängen. Importe oben ergänzen: `vi` aus `'vitest'`, `listCreatures` aus `'../../core/domain/creature'`, `VOICE_GAIN, createVoiceLoader` aus `'./webAudioEngine'`.

```ts
/** Lässt alle anstehenden Zusagen (Laden, Dekodieren) durchlaufen. */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

/** Engine mit eigener Ladefunktion: sie schreibt mit, was verlangt wurde. */
function voiceEngine(options: WebAudioEngineOptions = {}): {
  engine: WebAudioEngine;
  audio: FakeAudioContext;
  asked: string[];
} {
  const audio = new FakeAudioContext();
  const asked: string[] = [];
  const engine = new WebAudioEngine({
    createContext: () => audio,
    loadVoice: (id) => {
      asked.push(id);
      return Promise.resolve(id === 'dragon' ? null : new ArrayBuffer(24000));
    },
    ...options,
  });
  return { engine, audio, asked };
}

describe('Tierstimmen in der Engine', () => {
  it('lädt nach der ersten Nutzergeste jede Stimme des Katalogs genau einmal', async () => {
    const { engine, audio, asked } = voiceEngine();
    expect(asked).toEqual([]);
    engine.unlock();
    engine.unlock();
    await settle();
    expect([...asked].sort()).toEqual(listCreatures().map((creature) => creature.id).sort());
    expect(audio.decodedCount).toBe(listCreatures().length);
    // Laden und Dekodieren legen keinen Knoten an — gespielt wird erst auf Anlass.
    expect(audio.nodeCount()).toBe(0);
  });

  it('spielt eine geladene Stimme sofort, in ihrer Länge und leiser als den Biss', async () => {
    const { engine, audio } = voiceEngine();
    engine.unlock();
    await settle();
    engine.playVoice('wolf');
    expect(audio.startedSources).toHaveLength(1);
    // 24 000 Abtastwerte bei 48 kHz sind eine halbe Sekunde.
    expect(audio.startedSources[0]?.stopTime).toBeCloseTo(0.5, 6);
    expect(peakGain(audio)).toBe(VOICE_GAIN);
    expect(VOICE_GAIN).toBeLessThan(0.9);
  });

  it('spielt eine Stimme, die beim Anlass noch lädt, sobald sie da ist — genau einmal', async () => {
    const { engine, audio } = voiceEngine();
    engine.unlock();
    engine.playVoice('wolf');
    expect(audio.startedSources).toHaveLength(0);
    await settle();
    expect(audio.startedSources).toHaveLength(1);
  });

  it('lässt eine Stimme fallen, die mehr als eine halbe Sekunde zu spät kommt', async () => {
    let deliver: (bytes: ArrayBuffer) => void = () => undefined;
    const { engine, audio } = voiceEngine({
      loadVoice: () => new Promise<ArrayBuffer>((resolve) => { deliver = resolve; }),
    });
    engine.unlock();
    engine.playVoice('wolf');
    audio.currentTime = 0.8;
    deliver(new ArrayBuffer(24000));
    await settle();
    expect(audio.startedSources).toHaveLength(0);
    // Geladen ist sie trotzdem — der nächste Anlass spielt sie sofort.
    engine.playVoice('wolf');
    expect(audio.startedSources).toHaveLength(1);
  });

  it('lässt eine Stimme fallen, deren Anlass von stopAll() überholt wurde', async () => {
    const { engine, audio } = voiceEngine();
    engine.unlock();
    engine.playVoice('wolf');
    engine.stopAll();
    await settle();
    expect(audio.startedSources).toHaveLength(0);
  });

  it('bricht eine laufende Stimme mit stopAll() ab', async () => {
    const { engine, audio } = voiceEngine();
    engine.unlock();
    await settle();
    engine.playVoice('lion');
    engine.stopAll();
    expect(audio.runningSources()).toHaveLength(0);
  });

  it('lädt und spielt nichts, wenn der Ton aus ist', async () => {
    const { engine, audio, asked } = voiceEngine({ muted: true });
    engine.unlock();
    engine.playVoice('wolf');
    await settle();
    expect(asked).toEqual([]);
    expect(audio.nodeCount()).toBe(0);
  });

  it('tut vor der ersten Nutzergeste nichts — kein Kontext, kein Abruf', async () => {
    let created = 0;
    const asked: string[] = [];
    const engine = new WebAudioEngine({
      createContext: () => {
        created += 1;
        return new FakeAudioContext();
      },
      loadVoice: (id) => {
        asked.push(id);
        return Promise.resolve(new ArrayBuffer(8));
      },
    });
    engine.playVoice('wolf');
    await settle();
    expect(created).toBe(0);
    expect(asked).toEqual([]);
  });

  it('bleibt still, wenn es die Stimme nicht gibt oder das Laden scheitert — und versucht es später erneut', async () => {
    let fail = true;
    const asked: string[] = [];
    const audio = new FakeAudioContext();
    const engine = new WebAudioEngine({
      createContext: () => audio,
      muted: false,
      loadVoice: (id) => {
        asked.push(id);
        return fail ? Promise.reject(new Error('offline')) : Promise.resolve(new ArrayBuffer(24000));
      },
    });
    engine.unlock();
    await settle();
    expect(() => engine.playVoice('wolf')).not.toThrow();
    await settle();
    expect(audio.startedSources).toHaveLength(0);

    fail = false;
    engine.playVoice('wolf');
    await settle();
    expect(audio.startedSources).toHaveLength(1);
    expect(asked.filter((id) => id === 'wolf').length).toBeGreaterThanOrEqual(2);
  });
});

describe('Laden der Stimmdateien', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('holt die Datei unter dem Basis-Pfad der Seite', async () => {
    const urls: string[] = [];
    vi.stubGlobal('fetch', (url: string) => {
      urls.push(url);
      return Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(4)) });
    });
    const bytes = await createVoiceLoader('/zahn_agent/')('wolf');
    expect(urls).toEqual(['/zahn_agent/sounds/voices/wolf.mp3']);
    expect(bytes?.byteLength).toBe(4);
  });

  it('liefert nichts bei einer Fehlantwort und fragt für ein unbekanntes Tier gar nicht erst', async () => {
    let calls = 0;
    vi.stubGlobal('fetch', () => {
      calls += 1;
      return Promise.resolve({ ok: false, arrayBuffer: () => Promise.resolve(new ArrayBuffer(4)) });
    });
    expect(await createVoiceLoader('/')('wolf')).toBeNull();
    expect(await createVoiceLoader('/')('dragon')).toBeNull();
    expect(calls).toBe(1);
  });
});
```

- [ ] **Step 3: Lauf — die Tests müssen fallen**

Run: `pnpm vitest run src/infrastructure/audio/webAudioEngine.test.ts`
Expected: FAIL (`createVoiceLoader` und `VOICE_GAIN` gibt es nicht).

- [ ] **Step 4: Port**

In `src/core/ports/sound.ts` im Interface nach `play(…)`:

```ts
  /**
   * Die Stimme eines Tiers (Kennung aus dem Katalog). Kennt die Umsetzung das Tier nicht oder ist
   * die Stimme nicht rechtzeitig da, bleibt sie still. Die Bedienung ruft sie beim Wählen und nach
   * dem Biss — nie vor einem Urteil.
   */
  playVoice(creatureId: string): void;
```

- [ ] **Step 5: Engine**

In `src/infrastructure/audio/webAudioEngine.ts`:

Import ergänzen:

```ts
import { CREATURE_VOICE_FILES, voiceUrl } from './creatureVoices';
```

In `AudioContextLike` nach `createBuffer(…)`:

```ts
  /**
   * Dekodiert eine Tondatei. Neuere Browser geben eine Zusage zurück, ältere Safari-Fassungen
   * rufen nur die Rückrufe — die Engine bedient beides.
   */
  decodeAudioData(
    data: ArrayBuffer,
    onDecoded?: (buffer: AudioBufferLike) => void,
    onError?: (error: unknown) => void,
  ): Promise<AudioBufferLike> | void;
```

In `WebAudioEngineOptions`:

```ts
  /** Holt die Datei einer Tierstimme; `null` heißt: gibt es nicht. Standard: `createVoiceLoader`. */
  loadVoice?: (creatureId: string) => Promise<ArrayBuffer | null>;
  /** Basis-Pfad der Seite mit Schluss-Schrägstrich (`import.meta.env.BASE_URL`). Ohne ihn bleiben die Tiere still. */
  voiceBaseUrl?: string;
```

Nach `createBrowserAudioContext`:

```ts
/** Holt Stimmdateien vom eigenen Ursprung. Eine Fehlantwort oder ein unbekanntes Tier ergibt `null`. */
export function createVoiceLoader(baseUrl: string): (creatureId: string) => Promise<ArrayBuffer | null> {
  return async (creatureId) => {
    const url = voiceUrl(baseUrl, creatureId);
    if (url === null || typeof fetch !== 'function') return null;
    const response = await fetch(url);
    return response.ok ? response.arrayBuffer() : null;
  };
}

/** Lautstärke der Tierstimmen — unter dem Biss (0,9), damit sich kein Kind erschreckt. */
export const VOICE_GAIN = 0.6;
/** So spät darf eine Stimme nach ihrem Anlass noch kommen (Sekunden); danach wäre sie ein Fremdkörper. */
export const VOICE_LATE_LIMIT_S = 0.5;

function decode(context: AudioContextLike, bytes: ArrayBuffer): Promise<AudioBufferLike> {
  return new Promise((resolve, reject) => {
    const result = context.decodeAudioData(bytes, resolve, reject);
    if (result && typeof result.then === 'function') {
      result.then(resolve, reject);
    }
  });
}
```

In der Klasse neue Felder nach `unlocked`:

```ts
  private readonly loadVoice: (creatureId: string) => Promise<ArrayBuffer | null>;
  /** Fertig dekodierte Stimmen. */
  private readonly voices = new Map<string, AudioBufferLike>();
  /** Laufende Abrufe — damit keine Datei zweimal zugleich geholt wird. */
  private readonly voiceLoads = new Map<string, Promise<AudioBufferLike | null>>();
  private voicesRequested = false;
  /** Zählt `stopAll()`: eine Stimme, die danach erst fertig lädt, gehört zu einem alten Anlass. */
  private voiceEpoch = 0;
```

Im Konstruktor:

```ts
    const baseUrl = options.voiceBaseUrl;
    this.loadVoice =
      options.loadVoice ?? (baseUrl === undefined ? () => Promise.resolve(null) : createVoiceLoader(baseUrl));
```

Nach `play(…)`:

```ts
  playVoice(creatureId: string): void {
    // Dieselben Sperren wie in `play`: stumm heißt kein Knoten und kein Abruf, und vor der ersten
    // Nutzergeste passiert nichts.
    if (this.muted || !this.unlocked) return;
    const context = this.ensureContext();
    if (context === null) return;
    const ready = this.voices.get(creatureId);
    if (ready !== undefined) {
      this.startVoice(context, ready);
      return;
    }
    // Noch nicht da (das Tier wurde mit der allerersten Geste gewählt): nachreichen — aber nur,
    // solange der Anlass noch gilt.
    const epoch = this.voiceEpoch;
    const asked = context.currentTime;
    void this.fetchVoice(context, creatureId).then((buffer) => {
      if (buffer === null || this.muted || epoch !== this.voiceEpoch) return;
      if (context.currentTime - asked > VOICE_LATE_LIMIT_S) return;
      this.startVoice(context, buffer);
    });
  }
```

In `stopAll()` als erste Zeile:

```ts
    this.voiceEpoch += 1;
```

In `unlock()` direkt nach `if (context === null) return;`:

```ts
    this.requestVoices(context);
```

Vor `private clamp01`:

```ts
  /** Holt nach der ersten Geste alle Stimmen im Hintergrund — einmal, und nur bei eingeschaltetem Ton. */
  private requestVoices(context: AudioContextLike): void {
    if (this.voicesRequested || this.muted) return;
    this.voicesRequested = true;
    for (const creatureId of Object.keys(CREATURE_VOICE_FILES)) {
      void this.fetchVoice(context, creatureId);
    }
  }

  /** Lädt und dekodiert eine Stimme. Ein Fehlschlag wird nicht gemerkt: der nächste Anlass versucht es erneut. */
  private fetchVoice(context: AudioContextLike, creatureId: string): Promise<AudioBufferLike | null> {
    const running = this.voiceLoads.get(creatureId);
    if (running !== undefined) return running;
    const load = Promise.resolve()
      .then(() => this.loadVoice(creatureId))
      .then((bytes) => (bytes === null ? null : decode(context, bytes)))
      .catch(() => null)
      .then((buffer) => {
        this.voiceLoads.delete(creatureId);
        if (buffer !== null) this.voices.set(creatureId, buffer);
        return buffer;
      });
    this.voiceLoads.set(creatureId, load);
    return load;
  }

  private startVoice(context: AudioContextLike, buffer: AudioBufferLike): void {
    try {
      const now = context.currentTime;
      const source = context.createBufferSource();
      source.buffer = buffer;
      const gain = context.createGain();
      gain.gain.setValueAtTime(VOICE_GAIN, now);
      source.connect(gain);
      gain.connect(context.destination);
      this.startSource(source, now, buffer.length / buffer.sampleRate);
    } catch {
      // Fehlende Audio-Unterstützung darf das Spiel niemals abbrechen.
    }
  }
```

- [ ] **Step 6: Lauf — grün, dann Gate**

Run: `pnpm vitest run src/infrastructure/audio/webAudioEngine.test.ts` → PASS, **auch die alten Fälle** (der Block „Freigabe" zählt Knoten nach `unlock()` — das Laden legt keine an).
Run: `pnpm gate` → grün. Meldet `tsc` eine weitere Klasse, die `SoundPort` oder `AudioContextLike` umsetzt, bekommt sie die fehlende Methode.

- [ ] **Step 7: Commit**

```bash
git add src/core/ports/sound.ts src/infrastructure/audio/webAudioEngine.ts src/infrastructure/audio/webAudioEngine.test.ts src/infrastructure/testing/fakeAudioContext.ts src/infrastructure/testing/recordingSound.ts
git commit -m "Ton: SoundPort.playVoice laedt und spielt Stimmdateien im selben Audio-Kontext, mit denselben Sperren wie play"
```

---

### Task 4: Die Steuerung ruft die Stimme, die Seite reicht den Basis-Pfad herein

**Files:**
- Modify: `src/presentation/game/gameController.ts` (`snap`, `applySettings`)
- Modify: `src/pages/index.astro` (Seitenskript: `voiceBaseUrl`)
- Test: `src/presentation/game/gameController.test.ts`, `src/bedienleiste.test.ts`

**Interfaces:**
- Consumes: `SoundPort.playVoice(creatureId)`, `RecordingSound.voices`, `WebAudioEngineOptions.voiceBaseUrl` aus Aufgabe 3.

- [ ] **Step 1: Die fallenden Tests schreiben**

In `src/presentation/game/gameController.test.ts` im `describe('GameController in der Bühne', …)`:

```ts
  it('lässt das Tier nach dem Biss seine Stimme hören — und nie bei einem harmlosen Zahn', () => {
    const { sound } = build([9], { creature: 'wolf' });
    click(1);
    expect(sound.voices).toEqual([]);
    click(9);
    expect(sound.voices).toEqual(['wolf']);
  });

  it('spielt die Stimme der alten Runde nicht mehr, wenn schon eine neue läuft', () => {
    // Der Kiefer zieht 120 ms nach dem Biss nach — in dieser Zeit kann „Neue Runde" getippt werden.
    const spaet: Array<() => void> = [];
    // Auch die Pause vor dem Urteil kann 120 ms lang sein (`BEAT_MIN_MS`) — zurückgehalten wird
    // deshalb nur, was **nach** dem Zuschnappen geplant wird.
    const snapped = (): boolean =>
      document.querySelector('.creature')?.classList.contains('is-snapped') ?? false;
    const latchLater = (ms: number, run: () => void): void => {
      if (ms === 120 && snapped()) {
        spaet.push(run);
        return;
      }
      if (ms < 1000) run();
    };
    const { controller, sound } = build([4], { creature: 'wolf' }, true, undefined, latchLater);
    click(4);
    expect(spaet, 'ohne den späten Rückruf wäre der Test sinnlos').toHaveLength(1);
    controller.resetRound();
    spaet.forEach((run) => run());
    expect(sound.voices).toEqual([]);
    expect(document.querySelector('.creature')?.classList.contains('is-clenching')).toBe(false);
  });

  it('lässt ein neu gewähltes Tier sich vorstellen', () => {
    const { controller, sound } = build([4]);
    controller.applySettings(settings({ creature: 'mouse' }));
    expect(sound.voices).toEqual(['mouse']);
  });

  it('bleibt still, wenn dasselbe Tier bleibt und nur die Zahnzahl wechselt', () => {
    const { controller, sound } = build([4]);
    controller.applySettings(settings({ teethOverride: 6 }));
    expect(sound.voices).toEqual([]);
  });

  it('bleibt beim Wählen und beim Biss still, wenn der Ton aus ist', () => {
    const { controller, sound } = build([4], { sound: false });
    controller.applySettings(settings({ sound: false, creature: 'mouse' }));
    click(4);
    expect(sound.voices).toEqual([]);
  });
```

Hinweis zum letzten Fall: `build` schaltet die Attrappe nicht selbst stumm; das tut erst `applySettings` (`setMuted(!settings.sound)`). Deshalb kommt der Tierwechsel **vor** dem Biss.

In `src/bedienleiste.test.ts` im `describe('Spielseite', …)`:

```ts
  it('reicht der Engine den Basis-Pfad für die Tierstimmen — nie eine feste Adresse', () => {
    expect(SEITE).toContain('voiceBaseUrl: import.meta.env.BASE_URL');
    expect(SEITE).not.toContain("'/sounds/");
    expect(SEITE).not.toContain('"/sounds/');
  });
```

- [ ] **Step 2: Lauf — die Tests müssen fallen**

Run: `pnpm vitest run src/presentation/game/gameController.test.ts src/bedienleiste.test.ts`
Expected: die neuen Fälle FAIL (`voices` bleibt leer, `is-clenching` sitzt an der neuen Zeichnung, `voiceBaseUrl` fehlt); „bleibt beim Wählen und beim Biss still …" kann schon grün sein.

- [ ] **Step 3: Nach dem Biss**

In `src/presentation/game/gameController.ts` in `snap()` den Zeitgeber am Ende ersetzen:

```ts
    // Zweite Stufe: der Kiefer zieht nach — das Maul wirkt wie eine Feder, nicht wie ein Sprung.
    // Dazu die Stimme des Tiers. Beides gehört zu **dieser** Runde: startet in den 120 ms eine
    // neue, bekäme sonst die offene Zeichnung den zusammengebissenen Kiefer.
    const bitten = this.round;
    this.wait(BITE_LATCH_MS, () => {
      if (this.round !== bitten) {
        return;
      }
      this.art?.classList.add('is-clenching');
      this.shake(0.45);
      this.deps.sound.playVoice(bitten.creatureId);
    });
```

- [ ] **Step 4: Beim Wählen**

In `applySettings()` den Zweig des Neustarts erweitern:

```ts
    if (modeChanged || playersChanged || creatureChanged || teethChanged) {
      this.resetRound();
      // Das neue Tier stellt sich vor. Der Tipp auf die Kachel ist die Nutzergeste — die Seite
      // gibt den Ton bei `pointerup` frei, also vor diesem `click`.
      if (creatureChanged) {
        this.deps.sound.playVoice(settings.creature);
      }
    } else if (!settings.sound) {
```

- [ ] **Step 5: Die Seite**

In `src/pages/index.astro` im Seitenskript die Zeile mit `new WebAudioEngine(…)` ersetzen:

```ts
    // Die Tierstimmen sind Dateien unter dem Basis-Pfad der Seite (public/sounds/voices/).
    const sound = new WebAudioEngine({ muted: !settings.sound, voiceBaseUrl: import.meta.env.BASE_URL });
```

- [ ] **Step 6: Lauf — grün, Gate, Bau**

Run: `pnpm vitest run src/presentation/game/gameController.test.ts src/bedienleiste.test.ts` → PASS (alle, auch die alten).
Run: `pnpm gate` → grün.
Run: `pnpm build`, dann `ls dist/sounds/voices` → zehn MP3-Dateien und `QUELLEN.md`.

- [ ] **Step 7: Commit**

```bash
git add src/presentation/game/gameController.ts src/presentation/game/gameController.test.ts src/pages/index.astro src/bedienleiste.test.ts
git commit -m "Spiel: das Tier meldet sich beim Waehlen und nach dem Biss; der spaete Kiefer-Rueckruf traegt seine Runde"
```

---

### Task 5: Hörprobe im Spiel, Doku, Nachweis

**Files:**
- Modify: `docs/plan.md` (Nachtrag), `README.md` („Was es kann", „Daten und Datenschutz", Testzahl), `docs/workflow.md` (Abschnitt „Umgebung"), `docs/testing.md` (Stand, Tabelle „Was wo geprüft wird"), `AGENTS.md` („Ein neues Lebewesen ergänzen": neuer Schritt mit Stimmdatei, Zuordnung und Zeile in `QUELLEN.md`)

- [ ] **Step 1: Hörprobe durch den Auftraggeber**

`pnpm dev` starten, `http://localhost:4321` öffnen. Der Auftraggeber hört — das kann kein Test:

1. Als **allererste** Geste ein anderes Tier wählen: kommt die Stimme (kurz verzögert ist in Ordnung), oder bleibt es still?
2. Jedes der zehn Tiere einmal wählen: erkennbar, freundlich, gleich laut?
3. Mit zwei, drei Tieren bis zum Biss spielen: matschen Biss, Stimme und Tonfolge?
4. Ton aus, Seite neu laden, ein Tier wählen: im Netzwerk-Reiter der Entwicklerwerkzeuge darf **keine** MP3-Datei geladen werden.
5. Einmal am Handy.

Ergebnis notieren. Zu laut oder zu leise insgesamt: `VOICE_GAIN` ändern. Eine einzelne Stimme: neu schneiden (Aufgabe 1, Schritt 6). Matscht es nach dem Biss: die Zeile `this.deps.sound.playVoice(bitten.creatureId);` in `snap()` streichen und den ersten Test aus Aufgabe 4 auf `toEqual([])` nach dem Biss umstellen.

- [ ] **Step 2: Nachtrag in `docs/plan.md`**

Überschrift `## Nachtrag <Datum> (gebaut): Tierstimmen als Dateien`. Inhalt: Auftrag im Wortlaut („Bei den Tierstimmen würde ich gerne die Sounds vorher generieren lassen und dann mit ausliefern …", „Mischung (echte Tiere, dazu generiertes Kichern und „Oh-oh")"), die zehn Entscheidungen mit Grund, die Tabelle der Stimmen mit Verweis auf `public/sounds/voices/QUELLEN.md`, die Gesamtgröße der zehn Dateien, das Ergebnis der Hörprobe **als Urteil des Auftraggebers**, und der Satz: „Am echten Handy ist der Klang nur vom Nutzer geprüft."

- [ ] **Step 3: Die Regel „keine Dateien" berichtigen**

- `README.md`, Punkt „Nervenkitzel": aus „synthetisierte Klänge (Web Audio, keine Dateien)" wird: die Spielklänge sind synthetisiert, die **Tierstimmen** sind zehn kurze Dateien aus dem eigenen Baum (Herkunft und Lizenz in `public/sounds/voices/QUELLEN.md`).
- `README.md`, Punkt „Kein Netz nötig": bleibt wahr — ergänzen, dass auch die Stimmen vom eigenen Ursprung kommen.
- `docs/workflow.md`, Abschnitt „Umgebung": „die Klänge sind synthetisiert" um die Ausnahme ergänzen.
- `AGENTS.md`: neuer Schritt in „Ein neues Lebewesen ergänzen" (ohne Datei, Zuordnung und Lizenzzeile fällt `creatureVoices.test.ts`).

- [ ] **Step 4: Testzahlen**

`pnpm test:run` fahren und die Zahl aus der Ausgabe in `README.md` und `docs/testing.md` übernehmen; in `docs/testing.md` die Zeile für `src/infrastructure/audio/creatureVoices.test.ts` eintragen.

- [ ] **Step 5: Doku prüfen und bauen**

```bash
ALT="196|2,29 s|Drei Gebisse|232 Tests|Acht Gebisse|acht Kacheln|vier breite Backenzähne|2,1–2,5 s|293 Tests|318 Tests"
ALTE_WERTE="$ALT" ALTE_WERTE_STRIKT=1 bash scripts/doku-pruefen.sh README.md docs/testing.md
ALTE_WERTE="$ALT" bash scripts/doku-pruefen.sh AGENTS.md docs/workflow.md docs/plan.md docs/e2e-nachweise.md
python scripts/doku-pfade-pruefen.py . README.md AGENTS.md docs/*.md
pnpm gate
ASTRO_BASE=/zahn_agent pnpm build
grep -o 'sounds/voices[^"]*' -r dist/_astro | head
pnpm build
```

Die Ausgabe ansehen, nicht nur den Exit-Code. Der Bau mit `ASTRO_BASE` ist die Gegenprobe zum Basis-Pfad: im gebauten Skript steht kein `"/sounds/…"` als feste Adresse; der letzte Bau stellt den Normalzustand (`/`) wieder her.

- [ ] **Step 6: Commit**

```bash
git status --short
git add docs/plan.md README.md docs/workflow.md docs/testing.md AGENTS.md
git commit -m "Doku: Tierstimmen als Dateien, Quellen, Ergebnis der Hoerprobe, Testzahlen"
```
