# Tier-Album: Sterne an den Kacheln — Umsetzungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Jedes Tier kann bis zu drei Sterne sammeln (gespielt · halb geschafft · bis zum letzten Zahn). Die Sterne stehen direkt an den Kacheln der Tier-Auswahl, und ein neuer Stern wird nach dem Biss beim Namen genannt.

**Architecture:** Die Sterne werden **abgeleitet**, nicht gespeichert: eine reine Funktion im Kern (`core/domain/album.ts`) rechnet sie aus dem Rundenprotokoll. Ein kleines Modul der Bedienung (`presentation/game/albumBadges.ts`) malt sie an die vorhandenen Kacheln und hört auf das Ereignis `kroko:round-finished`, das die Steuerung schon auslöst. Die Steuerung selbst bleibt unverändert, es gibt keinen neuen Speicher und keinen neuen Port.

**Tech Stack:** Astro 5, TypeScript, Vitest + jsdom, CSS ohne Framework, Playwright (Python) für die Sonden.

**Spec:** Es gibt kein eigenes Spec-Dokument. Grundlage sind die Entscheidungen unten; sie wandern in Aufgabe 4 als Nachtrag nach `docs/plan.md`. Vor dem Bau lesen: `AGENTS.md` (Fallen zu Kachel-Klassen, Dekoration und Tipps, Ablage), `docs/domain-model.md` (Ehrlichkeitsregeln), `docs/architecture.md`.

## Entscheidungen (Empfehlung, vom Auftraggeber zu bestätigen)

1. **Eine frühere Absage wird aufgehoben.** Am 11.10.2026 hieß es in `docs/plan.md`: „Kein neues Spiel-Element (… keine Fortschrittsbelohnung): was nicht geprüft werden kann, wird nicht heimlich gebaut." Das Album ist prüfbar (reine Funktion des Protokolls) und wird nicht heimlich gebaut — aber die Aufhebung entscheidet der Auftraggeber.
2. **Drei Sterne je Tier, jeder mit Namen:**
   - **gespielt** — eine Runde mit diesem Tier, egal mit wie vielen Zähnen.
   - **halb geschafft** — mindestens die Hälfte der Zähne harmlos gedrückt (Krokodil: 5 von 10).
   - **bis zum letzten Zahn** — erst der letzte Zahn hat zugeschnappt.
3. **Stern zwei und drei gelten nur mit dem ganzen Gebiss** (Zahnzahl des Katalogs). Sonst gäbe es beide mit „2 Zähne" fast geschenkt: dort reicht ein einziger harmloser Druck.
4. **Die Chancen sind gerechnet, nicht geraten** (am 12.10.2026 mit `pressPositionDistribution` für alle zehn Tiere, Modus „wie das Spielzeug"): „halb geschafft" gelingt je Runde in 26,9 % (Krokodil), 27,3 % (Mensch), 35,0 % (Maus) und 36,4 % (die übrigen sieben) der Fälle; „bis zum letzten Zahn" in 2,8 % (Mensch), 3,3 % (Krokodil), 4,2 % (die sieben Zwölf-Zahn-Tiere mit 1–2 scharfen Zähnen) und 8,3 % (Maus). Der dritte Stern ist damit eine lange Jagd — im Schnitt 12 bis 36 Runden je Tier. Im Modus „nur ein Zahn" sind es 50 % und 8,3 bis 16,7 %. Ein Test hält die Spannen für jedes Tier und beide Modi fest.
5. **Sterne sind Glück, kein Können** — das Spiel ist reiner Zufall. Die Regeln sagen das so; es gibt keine Punkte, keine Serien, keinen Tagesdruck.
6. **Kein eigener Speicher.** „Protokoll löschen" auf der Statistikseite löscht auch die Sterne; die Nachfrage dort sagt das. Ein CSV-Import bringt Sterne mit.
7. **Kein neues Blatt, kein zusätzlicher Tipp.** Die Sterne liegen als Überlagerung **auf** den Kacheln (ändern keine Maße); die Ansage eines neuen Sterns liegt als Überlagerung auf der Bühne, solange das Maul zu ist. Die Erklärung steht im Regeln-Blatt.

## Global Constraints

- Sprache: Code, Namen, Meldungen **englisch**; Kommentare, Doku, UI-Texte, Commit-Beschreibungen **deutsch**.
- Gate ist beides: `pnpm typecheck` **und** `pnpm test:run` (`pnpm gate`). Exit-Code nie über eine Pipe prüfen.
- Niemals `git add -A` — explizite Pfade. Vor jedem Commit `git status --short`.
- Gearbeitet wird auf dem Zweig `tier-album`, **nicht** auf `main`. Kein Push ohne Auftrag.
- Der Kern bleibt rein: `core/domain/album.ts` ohne `document`, `window`, `localStorage`, `navigator`, `new Date(`.
- Kacheln tragen weder `.creature` noch `.tooth`; die neuen Klassen heißen `album-stars`, `album-star`, `album-summary`, `star-toast`.
- Alles Neue auf Kachel und Bühne hat `pointer-events: none` — Dekoration fängt keinen Tipp ab.
- Die Überlagerungen ändern **keine** Maße: auf den acht Größen 320×568 bis 1180×820 bleiben `scripts/pruefen-bedienung.py`, `scripts/pruefen-tiere.py` und `scripts/pruefen-trefferflaeche.py` bei 0 Auffälligkeiten.
- Anzeigen werden benannt: kein Stern ohne Wort (Beschriftung für Bildschirmleser an der Kachel, Legende im Regeln-Blatt, Name des Sterns in der Ansage).
- Wer die Ablage liest, liest sie **jetzt**: das Album rechnet bei jedem Malen aus `log.load()`, nie aus einer gemerkten Liste.
- Keine `.test.ts` in `src/pages/`. Die Sonden laufen mit `python scripts/<name>.py` (`uv` fehlt auf diesem Rechner); der Server muss laufen (`pnpm dev`).

## Review Focus

1. **Runde mit eigener Zahnzahl (z. B. 2 Zähne):** gibt nur den Stern „gespielt", nie die beiden anderen. → Test, Aufgabe 1.
2. **Altdaten ohne Lebewesen / unbekannte Kennung im CSV:** zählen für das Krokodil, wie überall sonst in der Statistik. → Test, Aufgabe 1.
3. **Protokoll in einem anderen Tab gelöscht oder importiert:** die Sterne ziehen nach, **ohne** Ansage (niemand hat gerade gespielt). → Test, Aufgabe 2.
4. **Volle Ablage (Schreiben scheitert):** `log.load()` liefert den Stand im Arbeitsspeicher, der Stern erscheint trotzdem; nach einem Neuladen kann er fehlen. Bekannte Grenze, im Nachtrag benennen. → gegenlesen, Aufgabe 4.
5. **Mehrmaliges Malen:** die Sterne stehen einmal an der Kachel, nicht bei jedem Biss ein weiteres Mal. → Test, Aufgabe 2.

---

### Task 1: Die Sterne im Kern

**Files:**
- Create: `src/core/domain/album.ts`
- Test: `src/core/domain/album.test.ts`
- Modify: `src/core/domain/creature.ts` (neue Funktion `creatureOrDefault`)
- Modify: `src/core/domain/statistics.ts` (private `creatureOfRound` entfällt zugunsten von `creatureOrDefault`)

**Interfaces:**
- Produces: `creatureOrDefault(id: string | undefined): CreatureDefinition` in `core/domain/creature.ts`.
- Produces: `ALBUM_STARS: readonly ['played', 'halfway', 'lastTooth']`, `type AlbumStar`.
- Produces: `interface AlbumPage { creature: string; name: string; rounds: number; stars: readonly AlbumStar[] }`
- Produces: `interface NewStar { creature: string; name: string; star: AlbumStar }`
- Produces: `starsOfRound(round: { creature?: string; teeth: number; pressIndex: number }): AlbumStar[]`
- Produces: `albumFromRecords(records: readonly { creature?: string; teeth: number; pressIndex: number }[]): AlbumPage[]` — genau eine Seite je Katalogtier, in Katalogreihenfolge; `stars` in der Reihenfolge von `ALBUM_STARS`.
- Produces: `newStars(before: readonly AlbumPage[], after: readonly AlbumPage[]): NewStar[]`

- [ ] **Step 1: Zweig anlegen**

```bash
git switch -c tier-album
```

- [ ] **Step 2: Den fallenden Test schreiben**

`src/core/domain/album.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { albumFromRecords, newStars, starsOfRound } from './album';
import { listCreatures } from './creature';
import { creatureKWeights, pressPositionDistribution } from './probabilities';
import { RANDOM_MODES } from './teeth';

const round = (creature: string | undefined, teeth: number, pressIndex: number) => ({ creature, teeth, pressIndex });

describe('Sterne einer Runde', () => {
  it('gibt für jede Runde den Stern „gespielt"', () => {
    expect(starsOfRound(round('crocodile', 10, 1))).toEqual(['played']);
  });

  it('gibt „halb geschafft" ab der Hälfte harmloser Drücke — genau an der Grenze', () => {
    // Krokodil, 10 Zähne: 5 harmlose Drücke heißt, der 6. Druck schnappte.
    expect(starsOfRound(round('crocodile', 10, 5))).toEqual(['played']);
    expect(starsOfRound(round('crocodile', 10, 6))).toEqual(['played', 'halfway']);
  });

  it('gibt „bis zum letzten Zahn" nur, wenn erst der letzte Zahn schnappte', () => {
    expect(starsOfRound(round('crocodile', 10, 9))).toEqual(['played', 'halfway']);
    expect(starsOfRound(round('crocodile', 10, 10))).toEqual(['played', 'halfway', 'lastTooth']);
    expect(starsOfRound(round('mouse', 6, 6))).toEqual(['played', 'halfway', 'lastTooth']);
  });

  it('gibt mit eigener Zahnzahl nur „gespielt" — sonst wären zwei Zähne der kurze Weg', () => {
    expect(starsOfRound(round('crocodile', 2, 2))).toEqual(['played']);
    expect(starsOfRound(round('crocodile', 12, 12))).toEqual(['played']);
    expect(starsOfRound(round('mouse', 10, 10))).toEqual(['played']);
  });

  it('zählt Runden ohne oder mit unbekanntem Lebewesen für das Krokodil', () => {
    expect(starsOfRound(round(undefined, 10, 10))).toEqual(['played', 'halfway', 'lastTooth']);
    expect(starsOfRound(round('dragon', 10, 6))).toEqual(['played', 'halfway']);
  });
});

describe('Album aus dem Protokoll', () => {
  it('hat für jedes Tier des Katalogs genau eine Seite, in Katalogreihenfolge', () => {
    const album = albumFromRecords([]);
    expect(album.map((page) => page.creature)).toEqual(listCreatures().map((creature) => creature.id));
    expect(album.every((page) => page.rounds === 0 && page.stars.length === 0)).toBe(true);
  });

  it('sammelt die Sterne eines Tiers über mehrere Runden und zählt die Runden', () => {
    const album = albumFromRecords([
      round('wolf', 12, 1),
      round('wolf', 12, 7),
      round('mouse', 6, 2),
      round(undefined, 10, 10),
    ]);
    const page = (id: string) => album.find((entry) => entry.creature === id);
    expect(page('wolf')).toMatchObject({ name: 'Wolf', rounds: 2, stars: ['played', 'halfway'] });
    expect(page('mouse')).toMatchObject({ rounds: 1, stars: ['played'] });
    expect(page('crocodile')).toMatchObject({ rounds: 1, stars: ['played', 'halfway', 'lastTooth'] });
    expect(page('lion')).toMatchObject({ rounds: 0, stars: [] });
  });

  it('hält die Sterne in fester Reihenfolge, egal in welcher sie verdient wurden', () => {
    const album = albumFromRecords([round('mouse', 6, 6), round('mouse', 6, 1)]);
    expect(album.find((page) => page.creature === 'mouse')?.stars).toEqual(['played', 'halfway', 'lastTooth']);
  });
});

describe('neue Sterne', () => {
  it('nennt genau die Sterne, die dazugekommen sind', () => {
    const before = albumFromRecords([round('wolf', 12, 1)]);
    const after = albumFromRecords([round('wolf', 12, 1), round('wolf', 12, 7), round('mouse', 6, 1)]);
    expect(newStars(before, after)).toEqual([
      { creature: 'wolf', name: 'Wolf', star: 'halfway' },
      { creature: 'mouse', name: 'Maus', star: 'played' },
    ]);
  });

  it('nennt nichts, wenn nichts dazukam — auch nicht, wenn Sterne verschwinden', () => {
    const one = albumFromRecords([round('wolf', 12, 7)]);
    expect(newStars(one, one)).toEqual([]);
    expect(newStars(one, albumFromRecords([]))).toEqual([]);
  });
});

describe('Chancen der Sterne (Rand jeder Regel, für jedes Tier und beide Zufallsmodelle)', () => {
  it('lässt „halb geschafft" in 20 bis 50 % und den letzten Zahn in 2 bis 20 % der Runden zu', () => {
    for (const creature of listCreatures()) {
      for (const mode of RANDOM_MODES) {
        const dist = pressPositionDistribution(creature.teeth, creatureKWeights(creature, mode));
        const chance = (star: 'halfway' | 'lastTooth'): number =>
          dist.reduce(
            (sum, p, index) =>
              starsOfRound({ creature: creature.id, teeth: creature.teeth, pressIndex: index + 1 }).includes(star)
                ? sum + p
                : sum,
            0,
          );
        const where = `${creature.id}/${mode}`;
        expect(chance('halfway'), where).toBeGreaterThanOrEqual(0.2);
        expect(chance('halfway'), where).toBeLessThanOrEqual(0.5 + 1e-9);
        expect(chance('lastTooth'), where).toBeGreaterThanOrEqual(0.02);
        expect(chance('lastTooth'), where).toBeLessThanOrEqual(0.2);
      }
    }
  });
});
```

- [ ] **Step 3: Lauf — der Test muss fallen**

Run: `pnpm vitest run src/core/domain/album.test.ts`
Expected: FAIL („Cannot find module './album'").

- [ ] **Step 4: `creatureOrDefault` im Katalog**

In `src/core/domain/creature.ts` nach `getCreature`:

```ts
/** Lebewesen einer Runde; fehlt die Kennung (Altdaten) oder ist sie unbekannt, gilt das Krokodil. */
export function creatureOrDefault(id: string | undefined): CreatureDefinition {
  return getCreature(id !== undefined && isKnownCreature(id) ? id : DEFAULT_CREATURE_ID);
}
```

In `src/core/domain/statistics.ts` die private Funktion `creatureOfRound` samt Kommentar löschen, ihre Aufrufe (`creatureOfRound(`) durch `creatureOrDefault(` ersetzen und den Import aus `./creature` anpassen, bis `pnpm typecheck` ohne ungenutzte Namen durchläuft. Eine Regel, eine Stelle.

- [ ] **Step 5: Das Album schreiben**

`src/core/domain/album.ts`:

```ts
import { CREATURES, creatureOrDefault } from './creature';

/**
 * Das Tier-Album: bis zu drei Sterne je Lebewesen, **abgeleitet** aus dem Rundenprotokoll. Es gibt
 * keinen eigenen Speicher — wer das Protokoll löscht, löscht die Sterne, und die Zahl kann nie von
 * den Runden abweichen, aus denen sie stammt.
 *
 * Die Sterne sind Glück, kein Können: welcher Zahn scharf ist, entscheidet allein der Zufall.
 */
export const ALBUM_STARS = ['played', 'halfway', 'lastTooth'] as const;
export type AlbumStar = (typeof ALBUM_STARS)[number];

export interface AlbumPage {
  /** Kennung aus dem Katalog. */
  creature: string;
  name: string;
  /** Gespielte Runden mit diesem Tier, egal mit wie vielen Zähnen. */
  rounds: number;
  /** Verdiente Sterne in der Reihenfolge von `ALBUM_STARS`. */
  stars: readonly AlbumStar[];
}

export interface NewStar {
  creature: string;
  name: string;
  star: AlbumStar;
}

/** Was das Album von einer Runde wissen muss — jeder Protokolleintrag erfüllt das. */
export interface AlbumRound {
  creature?: string;
  teeth: number;
  /** Der Druck, bei dem es schnappte (1-basiert). */
  pressIndex: number;
}

/**
 * Sterne einer einzelnen Runde. „Halb geschafft" und „bis zum letzten Zahn" gelten nur mit dem
 * **ganzen Gebiss** des Tiers: mit zwei eingestellten Zähnen wäre ein einziger harmloser Druck
 * schon beides.
 */
export function starsOfRound(round: AlbumRound): AlbumStar[] {
  const stars: AlbumStar[] = ['played'];
  if (round.teeth !== creatureOrDefault(round.creature).teeth) {
    return stars;
  }
  const harmless = round.pressIndex - 1;
  if (harmless >= Math.ceil(round.teeth / 2)) {
    stars.push('halfway');
  }
  if (round.pressIndex === round.teeth) {
    stars.push('lastTooth');
  }
  return stars;
}

/** Eine Seite je Katalogtier, in Katalogreihenfolge. */
export function albumFromRecords(records: readonly AlbumRound[]): AlbumPage[] {
  const earned = new Map<string, { rounds: number; stars: Set<AlbumStar> }>();
  for (const record of records) {
    const id = creatureOrDefault(record.creature).id;
    const entry = earned.get(id) ?? { rounds: 0, stars: new Set<AlbumStar>() };
    entry.rounds += 1;
    for (const star of starsOfRound(record)) {
      entry.stars.add(star);
    }
    earned.set(id, entry);
  }
  return CREATURES.map((creature) => {
    const entry = earned.get(creature.id);
    return {
      creature: creature.id,
      name: creature.name,
      rounds: entry?.rounds ?? 0,
      stars: ALBUM_STARS.filter((star) => entry?.stars.has(star) ?? false),
    };
  });
}

/** Sterne, die in `after` stehen und in `before` noch nicht — in Katalog- und Sternreihenfolge. */
export function newStars(before: readonly AlbumPage[], after: readonly AlbumPage[]): NewStar[] {
  const found: NewStar[] = [];
  for (const page of after) {
    const had = before.find((entry) => entry.creature === page.creature)?.stars ?? [];
    for (const star of page.stars) {
      if (!had.includes(star)) {
        found.push({ creature: page.creature, name: page.name, star });
      }
    }
  }
  return found;
}
```

- [ ] **Step 6: Lauf — grün, dann Gate**

Run: `pnpm vitest run src/core/domain/album.test.ts src/core/domain/statistics.test.ts` → PASS.
Fällt der Chancen-Test für ein Tier, wird **nicht** die Spanne im Test geweitet: dann stimmt die Regel für dieses Gebiss nicht, und das ist eine Frage an den Auftraggeber.
Run: `pnpm gate` → grün (der Schichten-Wächter prüft `album.ts` mit).

- [ ] **Step 7: Commit**

```bash
git add src/core/domain/album.ts src/core/domain/album.test.ts src/core/domain/creature.ts src/core/domain/statistics.ts
git commit -m "Kern: Tier-Album als reine Ableitung aus dem Protokoll, Chancen je Tier im Test"
```

---

### Task 2: Sterne an den Kacheln, Ansage nach dem Biss

**Files:**
- Create: `src/presentation/game/albumBadges.ts`
- Test: `src/presentation/game/albumBadges.test.ts`

**Interfaces:**
- Consumes: `albumFromRecords`, `newStars`, `ALBUM_STARS`, `AlbumPage`, `AlbumStar`, `NewStar` aus Aufgabe 1; `RoundLogPort` aus `core/ports/roundLog`.
- Consumes (DOM, alles optional): `button[data-creature]` (Kacheln), `.album-summary` (beliebig viele), `#star-toast`. Ereignis `kroko:round-finished` am Dokument (löst die Steuerung nach dem Speichern aus).
- Produces: `STAR_LABELS: Readonly<Record<AlbumStar, string>>`, `albumSummary(pages: readonly AlbumPage[]): string`, `newStarSentence(found: readonly NewStar[]): string`, `wireAlbum(deps: { doc: Document; log: RoundLogPort }): { paint: () => void }`.

- [ ] **Step 1: Den fallenden Test schreiben**

`src/presentation/game/albumBadges.test.ts`:

```ts
// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { albumFromRecords } from '../../core/domain/album';
import type { RoundRecord } from '../../contract/sessionLog';
import type { RoundLogPort } from '../../core/ports/roundLog';
import { albumSummary, newStarSentence, wireAlbum } from './albumBadges';

const DOM = `
  <div id="stage" data-status="snapped"><p id="star-toast" class="star-toast hidden"></p></div>
  <ul>
    <li><button type="button" data-creature="crocodile"><span class="creature-grid__name">Krokodil</span></button></li>
    <li><button type="button" data-creature="mouse"><span class="creature-grid__name">Maus</span></button></li>
  </ul>
  <ul><li><button type="button" data-creature="mouse"><span class="creature-grid__name">Maus</span></button></li></ul>
  <p class="album-summary"></p>
  <svg class="creature" data-creature="crocodile"></svg>
`;

class MemoryLog implements RoundLogPort {
  records: RoundRecord[] = [];
  load(): RoundRecord[] {
    return [...this.records];
  }
  save(records: readonly RoundRecord[]): void {
    this.records = [...records];
  }
  clear(): void {
    this.records = [];
  }
}

function played(creature: string, teeth: number, pressIndex: number): RoundRecord {
  return {
    round: 1,
    playedAt: '2026-10-12T09:00:00.000Z',
    creature,
    teeth,
    mode: 'original',
    players: 1,
    loserTooth: pressIndex,
    pressIndex,
    liveCount: 1,
    pressOrder: Array.from({ length: pressIndex }, (_, index) => index + 1),
  };
}

const tiles = (id: string): HTMLButtonElement[] =>
  Array.from(document.querySelectorAll<HTMLButtonElement>(`button[data-creature="${id}"]`));
const earned = (tile: Element): number => tile.querySelectorAll('.album-star.is-earned').length;
const finish = (): void => {
  document.dispatchEvent(new CustomEvent('kroko:round-finished'));
};

describe('Sterne an den Kacheln', () => {
  let log: MemoryLog;

  beforeEach(() => {
    document.body.innerHTML = DOM;
    log = new MemoryLog();
  });

  it('zeigt an jeder Kachel drei Plätze und füllt die verdienten', () => {
    log.records = [played('mouse', 6, 6), played('crocodile', 10, 1)];
    wireAlbum({ doc: document, log });
    for (const tile of tiles('mouse')) {
      expect(tile.querySelectorAll('.album-star')).toHaveLength(3);
      expect(earned(tile)).toBe(3);
    }
    expect(earned(tiles('crocodile')[0] as Element)).toBe(1);
  });

  it('benennt die Sterne für Bildschirmleser an der Kachel', () => {
    log.records = [played('crocodile', 10, 6)];
    wireAlbum({ doc: document, log });
    expect(tiles('crocodile')[0]?.getAttribute('aria-label')).toBe('Krokodil, 2 von 3 Sternen');
    expect(tiles('mouse')[0]?.getAttribute('aria-label')).toBe('Maus, 0 von 3 Sternen');
    expect(tiles('crocodile')[0]?.querySelector('.album-stars')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('rührt die Zeichnung auf der Bühne nicht an — auch sie trägt data-creature', () => {
    wireAlbum({ doc: document, log });
    expect(document.querySelector('svg.creature .album-stars')).toBeNull();
  });

  it('malt bei jedem Lauf dieselben drei Plätze, nicht drei weitere', () => {
    const album = wireAlbum({ doc: document, log });
    album.paint();
    album.paint();
    expect(tiles('mouse')[0]?.querySelectorAll('.album-stars')).toHaveLength(1);
    expect(tiles('mouse')[0]?.querySelectorAll('.album-star')).toHaveLength(3);
  });

  it('fasst das Album in einem Satz zusammen', () => {
    log.records = [played('mouse', 6, 6), played('crocodile', 10, 1)];
    wireAlbum({ doc: document, log });
    expect(document.querySelector('.album-summary')?.textContent).toBe(
      '2 von 10 Tieren gespielt · 4 von 30 Sternen',
    );
  });
});

describe('Ansage eines neuen Sterns', () => {
  let log: MemoryLog;

  beforeEach(() => {
    document.body.innerHTML = DOM;
    log = new MemoryLog();
  });

  const toast = (): HTMLElement => document.getElementById('star-toast') as HTMLElement;

  it('nennt nach dem Biss Tier und Stern beim Namen', () => {
    wireAlbum({ doc: document, log });
    log.records = [played('mouse', 6, 1)];
    finish();
    expect(toast().textContent).toBe('Neuer Stern: Maus — gespielt!');
    expect(toast().classList.contains('hidden')).toBe(false);
    expect(earned(tiles('mouse')[0] as Element)).toBe(1);
  });

  it('nennt mehrere Sterne einer Runde zusammen', () => {
    wireAlbum({ doc: document, log });
    log.records = [played('mouse', 6, 6)];
    finish();
    expect(toast().textContent).toBe('Neue Sterne: Maus — gespielt, halb geschafft, bis zum letzten Zahn!');
  });

  it('schweigt, wenn die Runde nichts Neues brachte — und räumt die alte Ansage weg', () => {
    wireAlbum({ doc: document, log });
    log.records = [played('mouse', 6, 1)];
    finish();
    log.records = [played('mouse', 6, 1), played('mouse', 6, 2)];
    finish();
    expect(toast().textContent).toBe('');
    expect(toast().classList.contains('hidden')).toBe(true);
  });

  it('sagt nichts an, wenn sich das Protokoll von außen ändert (anderer Tab, Import)', () => {
    const album = wireAlbum({ doc: document, log });
    log.records = [played('mouse', 6, 6)];
    album.paint();
    expect(toast().classList.contains('hidden')).toBe(true);
    expect(earned(tiles('mouse')[0] as Element)).toBe(3);
    // Und der nächste Biss vergleicht mit dem Stand von **jetzt**, nicht mit dem vom Seitenstart.
    log.records = [played('mouse', 6, 6), played('mouse', 6, 3)];
    finish();
    expect(toast().textContent).toBe('');
  });
});

describe('Sätze des Albums', () => {
  it('zählt Tiere und Sterne', () => {
    expect(albumSummary(albumFromRecords([]))).toBe('0 von 10 Tieren gespielt · 0 von 30 Sternen');
  });

  it('nennt nur das erste Tier, falls mehrere zugleich neue Sterne haben', () => {
    expect(
      newStarSentence([
        { creature: 'wolf', name: 'Wolf', star: 'halfway' },
        { creature: 'mouse', name: 'Maus', star: 'played' },
      ]),
    ).toBe('Neuer Stern: Wolf — halb geschafft!');
    expect(newStarSentence([])).toBe('');
  });
});
```

- [ ] **Step 2: Lauf — der Test muss fallen**

Run: `pnpm vitest run src/presentation/game/albumBadges.test.ts`
Expected: FAIL („Cannot find module './albumBadges'").

- [ ] **Step 3: Das Modul schreiben**

`src/presentation/game/albumBadges.ts`:

```ts
import {
  ALBUM_STARS,
  albumFromRecords,
  newStars,
  type AlbumPage,
  type AlbumStar,
  type NewStar,
} from '../../core/domain/album';
import type { RoundLogPort } from '../../core/ports/roundLog';

/**
 * Das Tier-Album in der Bedienung: Sterne an den Kacheln der Tier-Auswahl und die Ansage eines
 * neuen Sterns nach dem Biss. Die Sterne kommen bei **jedem** Malen frisch aus dem Protokoll — ein
 * gemerkter Stand wäre eine zweite Wahrheit neben der Ablage (die Statistikseite löscht und
 * importiert dort).
 */

/** Jeder Stern hat ein Wort: ein Zeichen ohne Namen ist keine Aussage. */
export const STAR_LABELS: Readonly<Record<AlbumStar, string>> = {
  played: 'gespielt',
  halfway: 'halb geschafft',
  lastTooth: 'bis zum letzten Zahn',
};

export function albumSummary(pages: readonly AlbumPage[]): string {
  const playedCount = pages.filter((page) => page.rounds > 0).length;
  const stars = pages.reduce((sum, page) => sum + page.stars.length, 0);
  return `${playedCount} von ${pages.length} Tieren gespielt · ${stars} von ${pages.length * ALBUM_STARS.length} Sternen`;
}

/** Die Ansage nach dem Biss. Eine Runde gehört einem Tier — genannt wird das erste. */
export function newStarSentence(found: readonly NewStar[]): string {
  const first = found[0];
  if (!first) {
    return '';
  }
  const labels = found.filter((entry) => entry.creature === first.creature).map((entry) => STAR_LABELS[entry.star]);
  return `${labels.length === 1 ? 'Neuer Stern' : 'Neue Sterne'}: ${first.name} — ${labels.join(', ')}!`;
}

export interface AlbumDeps {
  doc: Document;
  log: RoundLogPort;
}

export function wireAlbum(deps: AlbumDeps): { paint: () => void } {
  const { doc, log } = deps;
  let shown: AlbumPage[] = [];

  /** Die drei Plätze einer Kachel — einmal angelegt, danach nur umgefärbt. */
  const starsOf = (tile: HTMLButtonElement): HTMLElement[] => {
    let holder = tile.querySelector<HTMLElement>('.album-stars');
    if (!holder) {
      holder = doc.createElement('span');
      holder.className = 'album-stars';
      holder.setAttribute('aria-hidden', 'true');
      for (let index = 0; index < ALBUM_STARS.length; index += 1) {
        const star = doc.createElement('span');
        star.className = 'album-star';
        star.textContent = '★';
        holder.appendChild(star);
      }
      tile.appendChild(holder);
    }
    return Array.from(holder.querySelectorAll<HTMLElement>('.album-star'));
  };

  const paint = (): void => {
    shown = albumFromRecords(log.load());
    // `button[…]`, nicht `[data-creature]` allein: auch die Zeichnung auf der Bühne trägt das Attribut.
    for (const tile of Array.from(doc.querySelectorAll<HTMLButtonElement>('button[data-creature]'))) {
      const page = shown.find((entry) => entry.creature === tile.dataset.creature);
      if (!page) {
        continue;
      }
      starsOf(tile).forEach((star, index) => star.classList.toggle('is-earned', index < page.stars.length));
      tile.setAttribute('aria-label', `${page.name}, ${page.stars.length} von ${ALBUM_STARS.length} Sternen`);
    }
    const summary = albumSummary(shown);
    doc.querySelectorAll('.album-summary').forEach((element) => {
      element.textContent = summary;
    });
  };

  const announce = (sentence: string): void => {
    const toast = doc.getElementById('star-toast');
    if (!toast) {
      return;
    }
    toast.textContent = sentence;
    toast.classList.toggle('hidden', sentence.length === 0);
  };

  // Die Steuerung meldet jede beendete Runde, **nachdem** sie gespeichert hat.
  doc.addEventListener('kroko:round-finished', () => {
    const before = shown;
    paint();
    announce(newStarSentence(newStars(before, shown)));
  });

  paint();
  return { paint };
}
```

`index < page.stars.length` stimmt, weil die Sterne aufeinander aufbauen (wer den dritten hat, hat mit dem ganzen Gebiss gespielt und die Hälfte geschafft) — der Test „hält die Sterne in fester Reihenfolge" aus Aufgabe 1 deckt das.

- [ ] **Step 4: Lauf — grün, dann Gate**

Run: `pnpm vitest run src/presentation/game/albumBadges.test.ts` → PASS.
Run: `pnpm gate` → grün (`presentation/game` steht in `FOLDER_LAYER`).

- [ ] **Step 5: Commit**

```bash
git add src/presentation/game/albumBadges.ts src/presentation/game/albumBadges.test.ts
git commit -m "Bedienung: Sterne des Albums an den Kacheln, Ansage eines neuen Sterns nach dem Biss"
```

---

### Task 3: Seite, Stil, Statistikseite

**Files:**
- Modify: `src/pages/index.astro` (Bühne, Regeln-Blatt, Seitenskript)
- Modify: `src/pages/statistik.astro` (Nachfrage vor dem Löschen)
- Modify: `src/presentation/styles/app.css`
- Test: `src/bedienleiste.test.ts`

**Interfaces:**
- Consumes: `wireAlbum({ doc, log })` aus Aufgabe 2; die Klassen `album-stars`, `album-star`, `is-earned`, `album-summary`; die Kennung `star-toast`.

- [ ] **Step 1: Die fallenden Wächter schreiben**

In `src/bedienleiste.test.ts` im `describe('Spielseite', …)`:

```ts
  it('trägt die Ansage eines neuen Sterns auf der Bühne — als Meldung, nicht als Blatt', () => {
    const buehne = SPIEL.slice(SPIEL.indexOf('id="stage"'), SPIEL.indexOf('id="hud-stats"'));
    expect(buehne).toContain('id="star-toast"');
    expect(buehne).toContain('role="status"');
  });
  it('verdrahtet das Album mit derselben Ablage wie das Spiel', () => {
    expect(SEITE).toContain("from '../presentation/game/albumBadges'");
    expect(SEITE).toContain('wireAlbum({ doc: document, log })');
  });
```

Im `describe('Regeln', …)`:

```ts
  it('erklären die drei Sterne beim Namen und sagen, dass sie Glück sind', () => {
    for (const wort of ['album-summary', 'gespielt', 'halb geschafft', 'bis zum letzten Zahn', 'Glück']) {
      expect(REGELN).toContain(wort);
    }
  });
```

- [ ] **Step 2: Lauf — die Wächter müssen fallen**

Run: `pnpm vitest run src/bedienleiste.test.ts`
Expected: drei neue Fälle FAIL.

- [ ] **Step 3: Markup**

In `src/pages/index.astro` in der Bühne nach `<div id="croc-mount"></div>`:

```astro
        <!-- Ansage eines neuen Sterns (Tier-Album). Liegt ÜBER der Bühne und ändert keine Maße;
             sichtbar nur, solange das Maul zu ist (CSS an `data-status`). Fängt keinen Tipp ab. -->
        <p class="star-toast hidden" id="star-toast" role="status"></p>
```

Im Regeln-Blatt nach dem `</div>` von `.creature-detail`:

```astro
    <div class="album-rules">
      <p>
        <strong>Sterne sammeln:</strong> Jedes Tier kann drei Sterne bekommen —
        ★ <strong>gespielt</strong>, ★★ <strong>halb geschafft</strong> (die Hälfte der Zähne war
        harmlos) und ★★★ <strong>bis zum letzten Zahn</strong>. Für den zweiten und dritten Stern
        braucht das Tier alle seine Zähne. Sterne sind Glück: welcher Zahn zuschnappt, weiß niemand.
      </p>
      <p class="muted small album-summary"></p>
    </div>
```

Im Seitenskript importieren:

```ts
    import { wireAlbum } from '../presentation/game/albumBadges';
```

Nach `controller.mount();`:

```ts
    // Das Tier-Album: Sterne an den Kacheln, abgeleitet aus derselben Ablage. Es hört selbst auf
    // `kroko:round-finished`; was von außen kommt (anderer Tab, Zurück-Taste), zieht `paint()` nach.
    const album = wireAlbum({ doc: document, log });
```

In den beiden vorhandenen Abgleichen (`storage` und `pageshow`) jeweils nach `controller.syncLog();` die Zeile `album.paint();` ergänzen.

- [ ] **Step 4: Die Nachfrage vor dem Löschen**

In `src/pages/statistik.astro` den Text in `confirm(…)` ersetzen durch:

```ts
'Wirklich alle protokollierten Runden löschen? Damit verschwinden auch die Sterne im Tier-Album.'
```

- [ ] **Step 5: Stil**

In `src/presentation/styles/app.css` nach dem Block `.creature-grid button[aria-pressed="true"] { … }`:

```css
/* --- Tier-Album: Sterne liegen ÜBER der Kachel und ändern keine Maße (gemessen,
   scripts/pruefen-bedienung.py). Sie fangen keinen Tipp ab — der gehört der Kachel. */
.creature-grid button {
  position: relative;
}

.album-stars {
  position: absolute;
  top: 3px;
  right: 3px;
  display: flex;
  gap: 1px;
  padding: 1px 4px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.55);
  font-size: 0.6rem;
  line-height: 1.3;
  pointer-events: none;
}

.album-star {
  color: rgba(255, 255, 255, 0.28);
}

.album-star.is-earned {
  color: #f2c94c;
}

/* Die Ansage eines neuen Sterns: oben über der Bühne, nur bei geschlossenem Maul.
   `.stage` ist schon `position: relative` — die Ansage richtet sich daran aus. */
.star-toast {
  position: absolute;
  top: 8px;
  left: 50%;
  max-width: calc(100% - 16px);
  margin: 0;
  padding: 0.3rem 0.8rem;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.72);
  color: #f2c94c;
  font-size: 0.85rem;
  font-weight: 700;
  text-align: center;
  translate: -50% 0;
  pointer-events: none;
}

.stage:not([data-status="snapped"]) .star-toast {
  display: none;
}
```

Nachgesehen am 12.10.2026: `.stage` trägt bereits `position: relative` und `overflow: hidden`, und `.hidden` ist `display: none !important` — die Klasse gewinnt also gegen `.star-toast`. Die Regel `.creature-grid button { position: relative; }` steht neben der vorhandenen Regel gleichen Selektors: dort einfügen statt einen zweiten Block anzulegen, wenn die vorhandene noch kein `position` hat.

- [ ] **Step 6: Lauf — grün, Gate, Bau**

Run: `pnpm vitest run src/bedienleiste.test.ts` → PASS.
Run: `pnpm gate` → grün.
Run: `pnpm build` → 2 Seiten; in `dist/index.html` steht `id="star-toast"`.

- [ ] **Step 7: Commit**

```bash
git add src/pages/index.astro src/pages/statistik.astro src/presentation/styles/app.css src/bedienleiste.test.ts
git commit -m "Spielseite: Tier-Album verdrahtet, Sterne im Regeln-Blatt erklaert; Loeschen nennt die Sterne"
```

---

### Task 4: Am lebenden Gegenstand prüfen, Doku

**Files:**
- Modify: `docs/plan.md` (Nachtrag), `README.md` („Was es kann", Testzahl), `docs/testing.md` (Stand, Tabelle „Was wo geprüft wird"), `docs/e2e-nachweise.md` (neuer Abschnitt), `docs/domain-model.md` (Vokabular: Stern, Album)

- [ ] **Step 1: Die drei Sonden — die Überlagerungen dürfen nichts verschieben**

```bash
pnpm dev          # in einem zweiten Terminal, läuft weiter
python scripts/pruefen-bedienung.py
python scripts/pruefen-tiere.py
python scripts/pruefen-trefferflaeche.py
```

Expected: jeweils 0 Auffälligkeiten. Die **Ausgabe ansehen**. Jede Abweichung ist ein Fehler im CSS aus Aufgabe 3 (eine Überlagerung hat doch ein Maß geändert oder einen Tipp gefangen), nicht in der Sonde.

- [ ] **Step 2: Mit bekannten Daten ansehen**

Auf `http://localhost:4321/statistik` → „CSV importieren", einfügen:

```
runde;reihenfolge;verlierer_zahn;modus;zaehne;spieler;druck_nummer;scharfe_zaehne;lebewesen;zeitpunkt
1;1-2-3-4-5-6;6;original;6;1;6;1;mouse;2026-10-12T09:00:00.000Z
2;1-2-3-4-5-6-7;7;original;12;1;7;1;wolf;2026-10-12T09:01:00.000Z
3;1;1;original;10;1;1;2;crocodile;2026-10-12T09:02:00.000Z
4;1-2;2;original;2;1;2;1;lion;2026-10-12T09:03:00.000Z
```

Zurück zum Spiel. Erwartet an den Kacheln: Maus ★★★, Wolf ★★, Krokodil ★, Löwe ★ (nur „gespielt" — zwei Zähne sind nicht sein ganzes Gebiss), alle anderen leer. Im Regeln-Blatt: „4 von 10 Tieren gespielt · 7 von 30 Sternen". Bei 320 × 568 **und** 1180 × 820 ansehen: Sind die Sterne auf der kleinsten Kachel lesbar, verdecken sie kein Auge? Dann mit dem Panda bis zum Biss spielen: Ansage „Neuer Stern: Panda — gespielt!" steht über der Bühne, verdeckt die Markierung des scharfen Zahns nicht, und verschwindet mit „Neue Runde". Danach „Protokoll löschen": die Nachfrage nennt die Sterne, die Kacheln sind wieder leer.

- [ ] **Step 3: Nachtrag in `docs/plan.md`**

Überschrift `## Nachtrag <Datum> (gebaut): das Tier-Album`. Inhalt: Auftrag im Wortlaut, die sieben Entscheidungen mit Grund — **ausdrücklich** die aufgehobene Absage vom 11.10.2026 samt Zustimmung des Auftraggebers —, die gerechneten Chancen je Stern, die Messung der drei Sonden, die bekannte Grenze (volle Ablage: Stern kann nach dem Neuladen fehlen) und was abgesagt wurde (eigenes Album-Blatt, Punkte, Serien, Stern für „mutigster Druck").

- [ ] **Step 4: README, Testzahlen, Fachmodell**

`pnpm test:run` fahren und die Zahl aus der Ausgabe in `README.md` und `docs/testing.md` übernehmen; dort auch `album.test.ts` und `albumBadges.test.ts` in die Tabelle eintragen. In „Was es kann" einen Punkt **Tier-Album** ergänzen (drei Sterne, abgeleitet aus dem Protokoll, Sterne sind Glück). In `docs/domain-model.md` das Vokabular um „Stern" und „Album" erweitern.

- [ ] **Step 5: Doku prüfen**

```bash
ALT="196|2,29 s|Drei Gebisse|232 Tests|Acht Gebisse|acht Kacheln|vier breite Backenzähne|2,1–2,5 s|293 Tests|318 Tests"
ALTE_WERTE="$ALT" ALTE_WERTE_STRIKT=1 bash scripts/doku-pruefen.sh README.md docs/testing.md
ALTE_WERTE="$ALT" bash scripts/doku-pruefen.sh AGENTS.md docs/workflow.md docs/plan.md docs/e2e-nachweise.md docs/domain-model.md
python scripts/doku-pfade-pruefen.py . README.md AGENTS.md docs/*.md
pnpm gate
```

Die Ausgabe ansehen, nicht nur den Exit-Code.

- [ ] **Step 6: Commit**

```bash
git status --short
git add docs/plan.md README.md docs/testing.md docs/e2e-nachweise.md docs/domain-model.md
git commit -m "Doku: Tier-Album, aufgehobene Absage, Chancen der Sterne, Messung der Sonden"
```
