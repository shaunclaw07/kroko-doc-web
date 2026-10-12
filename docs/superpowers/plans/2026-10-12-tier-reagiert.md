# Das Tier reagiert auf die Gefahr: Blick und Zittern — Umsetzungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die Augen des Tiers folgen dem Finger und bleiben auf dem zuletzt gedrückten Zahn; ab 30 % Bissgefahr zittert der Oberkiefer leicht, ab 50 % deutlich. Beides füllt die Stille zwischen den Drücken — ohne Ton.

**Architecture:** Der Blick ist eine reine Rechnung in der Bedienung (`presentation/game/creatures/gaze.ts`): aus der Augenmitte und einem Ziel wird ein Versatz von höchstens 4 SVG-Einheiten. Die Steuerung schreibt ihn als `--look-x`/`--look-y` an die Zeichnung, das Stylesheet verschiebt damit die Pupillen (`.pupil`, die Klasse tragen schon alle zehn Tiere). Das Zittern sind zwei Zustandsklassen an der Zeichnung (`is-wary`, `is-trembling`), gesetzt aus den **vorhandenen** Schwellen `isTense` und `isHighDanger`. Der Kern (`core/`) wird nicht geändert.

**Tech Stack:** TypeScript, CSS-Variablen und SVG-Transformationen, Vitest mit jsdom 30 (rechnet kein CSS und liefert für `getBoundingClientRect` lauter Nullen), Playwright (Python) für die Sonde.

**Spec:** Es gibt kein eigenes Spec-Dokument. Grundlage sind die Entscheidungen unten; sie wandern in Aufgabe 5 als Nachtrag nach `docs/plan.md`. Vor dem Bau lesen: `AGENTS.md` (Fallen „Das Gesicht liegt über den Zähnen", „Die Zeichnung hat zwei Wahrheiten", „Eine Zustandsklasse muss den Kasten enthalten, den sie färbt", Abschnitt „Freundliche Zeichnung"), `docs/tiermodell-anleitung.md`, `docs/domain-model.md` („Spannungsdramaturgie").

**Reihenfolge der drei Pläne:** zweiter von dreien — nach `2026-10-12-halten-und-loslassen.md`, vor `2026-10-12-heranzoomen.md`. Er ist auch ohne den ersten baubar. Zeilennummern gelten für den Stand `0511a05`; gesucht wird nach dem **zitierten Text**.

## Entscheidungen

Vom Auftraggeber entschieden (12.10.2026): „Das Tier reagiert auf die Gefahr" wird gebaut.

Im Selbst-Sparring entschieden (jede Antwort mit einer Tatsache aus dem Baum):

1. **Nur die Pupille bewegt sich**, nicht Linse, Iris oder Glanzpunkt. Grund: alle zehn Tiere tragen `class="pupil"` an genau zwei Formen; die Linse ist bei allen eine weiße Ellipse (`fill="#ffffff"`). Eine Änderung an den zehn Zeichnungen ist nicht nötig.
2. **Höchstens 4 SVG-Einheiten.** Nachgerechnet am engsten Auge: beim Panther liegt die Pupille (r 10,5, Mitte um 1,4 versetzt) in einer Iris von r 17 — 5,1 Einheiten Luft; beim Panda sind es in der Linse 18 × 17 senkrecht 6. Vier bleibt bei jedem Tier in der Linse. Ein Test rechnet das für alle zehn nach.
3. **Beide Augen schauen parallel.** Ein Versatz für beide, gerechnet von der Mitte zwischen den Pupillen. Schielen sähe für ein Kind falsch aus.
4. **Ziel ist der Zeiger über der Bühne**, und beim Zug der Anker des gedrückten Zahns (`CreatureView.toothAnchor`). Auf dem Handy gibt es kein Schweben: dort bleibt der Blick dort, wo der Finger zuletzt war — also auf dem gedrückten Zahn. Die Tastatur bekommt denselben Blick über den Anker.
5. **Der Blick verrät nichts.** Er hängt nur am Zeiger und am gedrückten Zahn, nie an den scharfen Zähnen. Bei geschlossenem Maul folgt er dem Zeiger nicht mehr.
6. **Zittern in zwei Stufen aus den vorhandenen Schwellen:** `is-wary` über 30 % (`isTense`), `is-trembling` ab 50 % (`isHighDanger`). Keine neue Schwelle, keine neue Rechnung im Kern.
7. **Es zittert der Oberkiefer** (`.jaw__upper`), 2 bzw. 3 SVG-Einheiten. Die oberen Zähne fahren mit; bei 390 px Bühne sind 3 Einheiten rund 1,7 px — die Trefferfläche (≥ 44 px) trägt das.
8. **Die Regeln stehen vor den Druck-Regeln im Stylesheet.** `is-pressing`, `is-settling`, `is-twitching` und `is-clenching` animieren dasselbe Element mit gleicher Spezifität; die spätere Regel gewinnt. Das Zittern muss also **vor** „Fakeout-Zucken" stehen, sonst schluckt es das Knarren der Pause.
9. **`prefers-reduced-motion`:** die vorhandene Regel (`* { animation: none !important; transition: none !important; }`) schaltet das Zittern ab; die Pupillen springen dann ohne Übergang. Das genügt.

**Abgesagt:** Augen, die sich bei Gefahr weiten oder das Tier ängstlich machen (für ein Kind soll das Tier verspielt bleiben, nicht leiden); ein Blick auf einen **scharfen** Zahn als „Tell" (verriete den Ausgang); Zittern der ganzen Bühne (kollidiert mit `is-shaking` und verschöbe alle Trefferflächen).

**Offen — nur der Auftraggeber kann es beurteilen:** ob 4 Einheiten Blick am Handy sichtbar genug sind und ob das Zittern spannend oder unruhig wirkt. Stellschrauben: `GAZE_MAX` in `creatures/gaze.ts`, `--tremble` und die Dauern in `app.css`.

## Global Constraints

- Sprache: Code, Namen, Meldungen **englisch**; Kommentare, Doku, UI-Texte, Commit-Beschreibungen **deutsch**.
- Gate ist beides: `pnpm typecheck` **und** `pnpm test:run` (`pnpm gate`). Exit-Code nie über eine Pipe prüfen.
- Niemals `git add -A` — explizite Pfade. Vor jedem Commit `git status --short`.
- Direkte Commits auf `main`. **Kein Push.**
- Der Kern (`src/core/`) wird in diesem Plan **nicht** geändert. Die zehn Zeichnungen (`creatures/<tier>.ts`) werden **nicht** geändert.
- Formen und Farben stehen in den Zeichnungen, **nur Zustände** im CSS. Geometrie wird berechnet, nicht gesetzt.
- Augen und Pupillen dürfen nie in den Zahnring ragen — der Blick bleibt innerhalb der Linse.
- Nichts darf den Ausgang verraten: Blick und Zittern hängen nur an öffentlichen Größen (Zeiger, gedrückter Zahn, Bissgefahr).
- Kopfbilder (`.creature-portrait`) dürfen sich nicht mitbewegen: Selektoren und Abfragen gelten der Bühne (`.creature`, `this.art`).
- Browser-Schnittstellen nie am globalen `window`.
- Windows, Python-Sonden: `PYTHONIOENCODING=utf-8` davor setzen.

## Review Focus

- **Zeichnung ohne Größe** (jsdom, versteckte Seite: `getBoundingClientRect` liefert 0 × 0): kein `NaN` in `--look-x`, der Blick bleibt, wie er war. → Tests in Aufgabe 1 (`clientToViewBox`) und Aufgabe 2 („lässt den Blick stehen, wenn die Zeichnung keine Größe hat").
- **Zeiger genau auf der Augenmitte** (Abstand 0): Versatz 0, keine Division durch null. → Test in Aufgabe 1.
- **Neue Runde oder anderes Tier:** der Blick steht wieder gerade, und die Augenmitte gehört zum **neuen** Tier. → Test in Aufgabe 2 („schaut nach einer neuen Runde wieder geradeaus").
- **Maul zu:** kein Zittern über dem geschlossenen Kiefer (eine Animation überschriebe die Schließ-Transformation), kein Blick mehr hinter dem Zeiger her. → Test in Aufgabe 3 („zittert nach dem Biss nicht mehr") und Aufgabe 2 („folgt dem Zeiger nach dem Biss nicht mehr").
- **Pupille verlässt die Linse** bei einem der zehn Tiere. → Test in Aufgabe 1 (alle zehn Tiere, acht Richtungen) und Sonde in Aufgabe 4.

## Dateien

| Datei | Verantwortung in diesem Plan |
|---|---|
| `src/presentation/game/creatures/gaze.ts` | Rechnung des Blicks (neu) |
| `src/presentation/game/creatures/gaze.test.ts` | Rechnung und Linsen-Grenze aller Tiere (neu) |
| `src/presentation/game/gameController.ts` | Blick setzen, Zeiger hören, Zustandsklassen des Zitterns |
| `src/presentation/game/gameController.test.ts` | Prüfsonde dazu |
| `src/presentation/styles/app.css` | Pupillen-Versatz, Zittern |
| `scripts/pruefen-blick.py` | Sonde im echten Browser (neu) |
| `AGENTS.md`, `README.md`, `docs/domain-model.md`, `docs/tiermodell-anleitung.md`, `docs/testing.md`, `docs/workflow.md`, `docs/plan.md`, `docs/e2e-nachweise.md` | Doku nachziehen |

---

### Task 1: Die Rechnung des Blicks

**Files:**
- Create: `src/presentation/game/creatures/gaze.ts`
- Test: `src/presentation/game/creatures/gaze.test.ts`

**Interfaces:**
- Consumes: `VIEWBOX` (`./geometry`, `{ width: 640, height: 460 }`), `creatureView(id)` (`./index`), `CREATURES` (`core/domain/creature`).
- Produces:
  - `interface Point { x: number; y: number }`
  - `const GAZE_MAX = 4`, `const GAZE_FULL_DISTANCE = 120`
  - `gazeOffset(from: Point, target: Point): Point`
  - `midpoint(points: readonly Point[]): Point | null`
  - `clientToViewBox(client: Point, box: { left: number; top: number; width: number; height: number }): Point | null`

- [ ] **Step 1: Den fehlschlagenden Test schreiben**

`src/presentation/game/creatures/gaze.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { CREATURES } from '../../../core/domain/creature';
import { GAZE_FULL_DISTANCE, GAZE_MAX, clientToViewBox, gazeOffset, midpoint } from './gaze';
import { creatureView } from './index';

describe('gazeOffset', () => {
  it('schaut in die Richtung des Ziels, höchstens GAZE_MAX weit', () => {
    const eyes = { x: 320, y: 110 };
    expect(gazeOffset(eyes, { x: 320 + GAZE_FULL_DISTANCE, y: 110 })).toEqual({ x: GAZE_MAX, y: 0 });
    expect(gazeOffset(eyes, { x: 0, y: 110 })).toEqual({ x: -GAZE_MAX, y: 0 });
    const down = gazeOffset(eyes, { x: 320, y: 460 });
    expect(down.x).toBeCloseTo(0, 6);
    expect(down.y).toBeCloseTo(GAZE_MAX, 6);
  });

  it('schaut bei nahem Ziel weniger weit — und bei Abstand null gar nicht', () => {
    const eyes = { x: 320, y: 110 };
    const near = gazeOffset(eyes, { x: 320 + GAZE_FULL_DISTANCE / 2, y: 110 });
    expect(near.x).toBeCloseTo(GAZE_MAX / 2, 6);
    expect(gazeOffset(eyes, eyes)).toEqual({ x: 0, y: 0 });
  });

  it('liefert nie NaN, auch nicht für unsinnige Ziele', () => {
    const offset = gazeOffset({ x: 320, y: 110 }, { x: Number.NaN, y: Number.POSITIVE_INFINITY });
    expect(offset).toEqual({ x: 0, y: 0 });
  });
});

describe('midpoint', () => {
  it('mittelt die Punkte und übergeht unbrauchbare', () => {
    expect(midpoint([{ x: 146, y: 114 }, { x: 498, y: 114 }])).toEqual({ x: 322, y: 114 });
    expect(midpoint([{ x: 10, y: 20 }, { x: Number.NaN, y: 0 }])).toEqual({ x: 10, y: 20 });
    expect(midpoint([])).toBeNull();
  });
});

describe('clientToViewBox', () => {
  it('rechnet Bildschirmpunkte in die Einheiten der Zeichnung um', () => {
    const box = { left: 16, top: 100, width: 320, height: 230 };
    expect(clientToViewBox({ x: 16, y: 100 }, box)).toEqual({ x: 0, y: 0 });
    expect(clientToViewBox({ x: 176, y: 215 }, box)).toEqual({ x: 320, y: 230 });
  });

  it('liefert nichts, wenn die Zeichnung keine Größe hat (jsdom, versteckte Seite)', () => {
    expect(clientToViewBox({ x: 5, y: 5 }, { left: 0, top: 0, width: 0, height: 0 })).toBeNull();
  });
});

/** Attribut einer Form als Zahl. */
function attr(tag: string, name: string): number {
  const match = new RegExp(`\\s${name}="([-0-9.]+)"`).exec(tag);
  return match ? Number(match[1]) : Number.NaN;
}

interface Shape {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

function shape(tag: string): Shape {
  const r = attr(tag, 'r');
  return {
    cx: attr(tag, 'cx'),
    cy: attr(tag, 'cy'),
    rx: Number.isNaN(r) ? attr(tag, 'rx') : r,
    ry: Number.isNaN(r) ? attr(tag, 'ry') : r,
  };
}

function inside(lens: Shape, x: number, y: number): boolean {
  return ((x - lens.cx) / lens.rx) ** 2 + ((y - lens.cy) / lens.ry) ** 2 <= 1;
}

describe('Blick aller Tiere', () => {
  it('lässt die Pupille bei vollem Blick in jeder Richtung in der weißen Linse', () => {
    for (const creature of CREATURES) {
      const tags = creatureView(creature.id).render().match(/<(?:ellipse|circle)\b[^>]*>/g) ?? [];
      const pupils = tags.filter((tag) => tag.includes('class="pupil"')).map(shape);
      const lenses = tags.filter((tag) => tag.includes('fill="#ffffff"')).map(shape);
      expect(pupils, creature.id).toHaveLength(2);
      for (const pupil of pupils) {
        // Die Linse ist die **kleinste** weiße Form um die Pupille: der Glanzpunkt ist kleiner als
        // die Pupille, ein weißer Kopf (Panda) größer als die Linse.
        const lens = lenses
          .filter((candidate) => candidate.rx > pupil.rx && inside(candidate, pupil.cx, pupil.cy))
          .sort((one, other) => one.rx * one.ry - other.rx * other.ry)[0];
        expect(lens, `${creature.id}: keine Linse um die Pupille bei ${pupil.cx}/${pupil.cy}`).toBeDefined();
        if (!lens) continue;
        for (let direction = 0; direction < 8; direction += 1) {
          const angle = (direction * Math.PI) / 4;
          const cx = pupil.cx + Math.cos(angle) * GAZE_MAX;
          const cy = pupil.cy + Math.sin(angle) * GAZE_MAX;
          for (let edge = 0; edge < 16; edge += 1) {
            const around = (edge * Math.PI) / 8;
            const x = cx + Math.cos(around) * pupil.rx;
            const y = cy + Math.sin(around) * pupil.ry;
            expect(inside(lens, x, y), `${creature.id}: Pupille verlässt die Linse (Richtung ${direction})`).toBe(true);
          }
        }
      }
    }
  });
});
```

- [ ] **Step 2: Scheitern ansehen**

Run: `pnpm vitest run src/presentation/game/creatures/gaze.test.ts`
Expected: FAIL mit „Failed to resolve import "./gaze"".

- [ ] **Step 3: Die Rechnung schreiben**

`src/presentation/game/creatures/gaze.ts`:

```ts
import { VIEWBOX } from './geometry';

/** Punkt in den Einheiten der Zeichnung (oder des Bildschirms, wo es dabeisteht). */
export interface Point {
  x: number;
  y: number;
}

/**
 * Größter Weg einer Pupille in SVG-Einheiten. Nachgerechnet am engsten Auge (Panther: Pupille
 * r 10,5 in einer Iris von r 17); der Test hält es für alle Tiere fest. Wer den Wert anhebt,
 * fährt `gaze.test.ts` und `scripts/pruefen-blick.py`.
 */
export const GAZE_MAX = 4;
/** Ab diesem Abstand schaut das Tier voll zur Seite; ein nahes Ziel zieht den Blick weniger weit. */
export const GAZE_FULL_DISTANCE = 120;

/**
 * Versatz der Pupillen: von der Augenmitte in Richtung des Ziels. Hängt nur an zwei Punkten —
 * der Blick kann deshalb nichts über scharfe Zähne verraten.
 */
export function gazeOffset(from: Point, target: Point): Point {
  const dx = target.x - from.x;
  const dy = target.y - from.y;
  const distance = Math.hypot(dx, dy);
  if (!Number.isFinite(distance) || distance < 1) {
    return { x: 0, y: 0 };
  }
  const reach = GAZE_MAX * Math.min(1, distance / GAZE_FULL_DISTANCE);
  return { x: (dx / distance) * reach, y: (dy / distance) * reach };
}

/** Mitte mehrerer Punkte — die Augenmitte aus den beiden Pupillen. */
export function midpoint(points: readonly Point[]): Point | null {
  const usable = points.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
  if (usable.length === 0) {
    return null;
  }
  return {
    x: usable.reduce((sum, point) => sum + point.x, 0) / usable.length,
    y: usable.reduce((sum, point) => sum + point.y, 0) / usable.length,
  };
}

/**
 * Bildschirmpunkt → Einheiten der Zeichnung. `box` ist der gemessene Kasten des SVG; hat er keine
 * Größe (jsdom, versteckte Seite), gibt es keinen Punkt.
 */
export function clientToViewBox(
  client: Point,
  box: { left: number; top: number; width: number; height: number },
): Point | null {
  if (!(box.width > 0) || !(box.height > 0)) {
    return null;
  }
  return {
    x: ((client.x - box.left) / box.width) * VIEWBOX.width,
    y: ((client.y - box.top) / box.height) * VIEWBOX.height,
  };
}
```

- [ ] **Step 4: Tests laufen lassen**

Run: `pnpm vitest run src/presentation/game/creatures/gaze.test.ts`
Expected: PASS, 7 Fälle. Fällt der Fall „Blick aller Tiere" für ein Tier, **nicht** die Zeichnung ändern und nicht den Test lockern: die gemeldete Richtung und das Tier notieren, `GAZE_MAX` auf 3 senken und dem Auftraggeber im Abschluss nennen, welches Tier die Grenze gesetzt hat.

- [ ] **Step 5: Gate und Commit**

Run: `pnpm gate`, danach `echo "gate=$?"` in eigener Zeile. Expected: `gate=0`.

```bash
git status --short
git add src/presentation/game/creatures/gaze.ts src/presentation/game/creatures/gaze.test.ts
git commit -m "Zeichnung: Rechnung des Blicks, die Pupille bleibt bei allen zehn Tieren in der Linse"
```

---

### Task 2: Der Blick in Steuerung und Stylesheet

**Files:**
- Modify: `src/presentation/game/gameController.ts`
- Modify: `src/presentation/styles/app.css`
- Test: `src/presentation/game/gameController.test.ts`

**Interfaces:**
- Consumes: `gazeOffset`, `midpoint`, `clientToViewBox`, `Point`, `GAZE_MAX` (Task 1); `CreatureView.toothAnchor(toothId): { x: number; y: number }`.
- Produces: CSS-Variablen `--look-x` und `--look-y` (Zahl mit zwei Nachkommastellen, SVG-Einheiten) am Element `svg.creature`; CSS-Variable `--pupil-scale` an `.creature.is-pressing`.

- [ ] **Step 1: Die fehlschlagenden Tests schreiben**

In `src/presentation/game/gameController.test.ts` oben bei den Importen ergänzen:

```ts
import { creatureView } from './creatures';
import { GAZE_MAX, gazeOffset } from './creatures/gaze';
```

und **innerhalb** von `describe('GameController in der Bühne', ...)` einfügen:

```ts
  /** Der Blick, wie er an der Zeichnung steht. */
  function look(): { x: string; y: string } {
    const art = document.querySelector<SVGElement>('.creature');
    return {
      x: art?.style.getPropertyValue('--look-x') ?? '',
      y: art?.style.getPropertyValue('--look-y') ?? '',
    };
  }

  /** Gibt der Zeichnung eine Größe — jsdom misst sonst 0 × 0. */
  function sizeStage(): void {
    const art = document.querySelector('.creature');
    if (!art) throw new Error('Zeichnung fehlt');
    art.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 640, height: 460, right: 640, bottom: 460, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
  }

  function moveOverStage(clientX: number, clientY: number): void {
    document
      .getElementById('stage')
      ?.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX, clientY }));
  }

  it('schaut am Rundenbeginn geradeaus', () => {
    build([4]);
    expect(look()).toEqual({ x: '0.00', y: '0.00' });
  });

  it('schaut auf den Zahn, der gerade gedrückt wurde', () => {
    build([4]);
    click(1);
    // Krokodil: Pupillen bei 146/114 und 498/114 — die Augenmitte ist 322/114.
    const expected = gazeOffset({ x: 322, y: 114 }, creatureView('crocodile', 10).toothAnchor(1));
    expect(look()).toEqual({ x: expected.x.toFixed(2), y: expected.y.toFixed(2) });
    expect(Math.hypot(expected.x, expected.y)).toBeGreaterThan(1);
  });

  it('folgt dem Zeiger über der Bühne', () => {
    build([4]);
    sizeStage();
    moveOverStage(0, 114);
    expect(look()).toEqual({ x: (-GAZE_MAX).toFixed(2), y: '0.00' });
    moveOverStage(640, 114);
    expect(look()).toEqual({ x: GAZE_MAX.toFixed(2), y: '0.00' });
  });

  it('lässt den Blick stehen, wenn die Zeichnung keine Größe hat', () => {
    build([4]);
    moveOverStage(0, 114);
    expect(look()).toEqual({ x: '0.00', y: '0.00' });
  });

  it('schaut nach einer neuen Runde wieder geradeaus', () => {
    const { controller } = build([4]);
    click(1);
    controller.resetRound();
    expect(look()).toEqual({ x: '0.00', y: '0.00' });
  });

  it('folgt dem Zeiger nach dem Biss nicht mehr', () => {
    build([4]);
    click(4);
    const afterBite = look();
    sizeStage();
    moveOverStage(0, 114);
    expect(look()).toEqual(afterBite);
  });

  it('folgt nach dispose() keinem Zeiger mehr', () => {
    const { controller } = build([4]);
    sizeStage();
    controller.dispose();
    moveOverStage(0, 114);
    expect(look()).toEqual({ x: '0.00', y: '0.00' });
  });
```

- [ ] **Step 2: Scheitern ansehen**

Run: `pnpm vitest run src/presentation/game/gameController.test.ts`
Expected: FAIL — die sieben neuen Fälle rot (`expected { x: '', y: '' } to deeply equal { x: '0.00', y: '0.00' }`).

- [ ] **Step 3: Die Steuerung erweitern**

In `src/presentation/game/gameController.ts`:

(a) Import ergänzen (nach dem Import aus `'./creatures'`):

```ts
import { clientToViewBox, gazeOffset, midpoint, type Point } from './creatures/gaze';
```

(b) Feld ergänzen (nach `private art: SVGElement | null = null;`):

```ts
  /** Mitte zwischen den Pupillen des gezeichneten Tiers — von dort aus schaut es. */
  private eyes: Point | null = null;
```

(c) In `buildStage(...)` nach `this.art = this.doc.querySelector('.creature');` ergänzen:

```ts
    // Die Augenmitte gehört zu **diesem** Tier; ein neues Tier oder eine neue Runde schaut geradeaus.
    const pupils = Array.from(this.art?.querySelectorAll('.pupil') ?? []);
    this.eyes = midpoint(
      pupils.map((pupil) => ({ x: Number(pupil.getAttribute('cx')), y: Number(pupil.getAttribute('cy')) })),
    );
    this.lookAt(null);
```

(d) In `mount()` nach `this.stage = this.doc.getElementById('stage');` ergänzen:

```ts
    this.stage?.addEventListener('pointermove', this.onStagePointer);
    this.stage?.addEventListener('pointerdown', this.onStagePointer);
```

(e) Direkt nach der Methode `markPressed(...)` einfügen:

```ts
  /**
   * Richtet den Blick auf einen Punkt der Zeichnung (`null` = geradeaus). Der Versatz hängt nur
   * an Augenmitte und Ziel — nie an den scharfen Zähnen.
   */
  private lookAt(target: Point | null): void {
    const offset = target && this.eyes ? gazeOffset(this.eyes, target) : { x: 0, y: 0 };
    this.art?.style.setProperty('--look-x', offset.x.toFixed(2));
    this.art?.style.setProperty('--look-y', offset.y.toFixed(2));
  }

  /** Der Zeiger über der Bühne zieht den Blick mit — solange das Maul offen ist. */
  private readonly onStagePointer = (event: Event): void => {
    if (this.disposed || !this.art || this.round.status !== 'open') {
      return;
    }
    const pointer = event as PointerEvent;
    const at = clientToViewBox({ x: pointer.clientX, y: pointer.clientY }, this.art.getBoundingClientRect());
    if (at) {
      this.lookAt(at);
    }
  };
```

(f) An der **einen** Stelle, an der ein Zug `this.markPressed(toothId);` ruft (in `handlePress`, oder — wenn der Plan „Drücken und halten" schon gebaut ist — in `resolvePress`), direkt danach ergänzen:

```ts
    // Das Tier schaut auf den Zahn, der gerade gedrückt wurde — auch bei Tastatur ohne Zeiger.
    this.lookAt(this.view?.toothAnchor(toothId) ?? null);
```

(g) In `dispose()` vor `this.disposed = true;` ergänzen:

```ts
    this.stage?.removeEventListener('pointermove', this.onStagePointer);
    this.stage?.removeEventListener('pointerdown', this.onStagePointer);
```

- [ ] **Step 4: Das Stylesheet anpassen**

In `src/presentation/styles/app.css` die beiden Regeln

```css
.pupil {
  transform-box: fill-box;
  transform-origin: center;
  transition: transform 200ms ease-out;
}

.creature.is-pressing .pupil {
  transform: scale(0.74);
}
```

ersetzen durch

```css
/* Der Blick: die Steuerung schreibt --look-x/--look-y (SVG-Einheiten, höchstens GAZE_MAX) an die
   Zeichnung. Verschieben und Zusammenziehen stehen in **einer** Transformation — zwei Regeln mit
   `transform` höben einander auf. In den Kopfbildern fehlen die Variablen, dort bleibt alles stehen. */
.pupil {
  transform-box: fill-box;
  transform-origin: center;
  transform: translate(calc(var(--look-x, 0) * 1px), calc(var(--look-y, 0) * 1px)) scale(var(--pupil-scale, 1));
  transition: transform 200ms ease-out;
}

.creature.is-pressing .pupil {
  --pupil-scale: 0.74;
}
```

- [ ] **Step 5: Tests und Gate**

Run: `pnpm vitest run src/presentation/game/gameController.test.ts`, dann `pnpm gate` mit `echo "gate=$?"` in eigener Zeile.
Expected: alle Fälle grün, `gate=0`. Fällt `src/icon.test.ts`, wurde eine Zeichnung angefasst — das verlangt dieser Plan nicht; die Änderung zurücknehmen.

- [ ] **Step 6: Commit**

```bash
git status --short
git add src/presentation/game/gameController.ts src/presentation/game/gameController.test.ts src/presentation/styles/app.css
git commit -m "Bühne: die Augen folgen dem Zeiger und bleiben auf dem gedrückten Zahn"
```

---

### Task 3: Das Zittern des Kiefers

**Files:**
- Modify: `src/presentation/game/gameController.ts`
- Modify: `src/presentation/styles/app.css`
- Test: `src/presentation/game/gameController.test.ts`

**Interfaces:**
- Consumes: `isTense(tension)` (wahr über 30 %) und `isHighDanger(tension)` (wahr ab 50 %) aus `core/domain/tension` — beide sind in der Steuerung schon importiert.
- Produces: Zustandsklassen `is-wary` und `is-trembling` am Element `svg.creature`, nie beide zugleich, nie bei geschlossenem Maul; Keyframes `jaw-tremble`.

- [ ] **Step 1: Die fehlschlagenden Tests schreiben**

Innerhalb von `describe('GameController in der Bühne', ...)`:

```ts
  function artClasses(): DOMTokenList | undefined {
    return document.querySelector('.creature')?.classList;
  }

  it('zittert am Rundenbeginn nicht (Krokodil: 20 % Bissgefahr)', () => {
    build([10]);
    expect(artClasses()?.contains('is-wary')).toBe(false);
    expect(artClasses()?.contains('is-trembling')).toBe(false);
  });

  it('zittert leicht über 30 % und deutlich ab 50 % — nie beides zugleich', () => {
    build([10]);
    // Krokodil, 10 Zähne: der 7. Druck hat 33,8 %, der 9. Druck 55,0 % Bissgefahr.
    for (const tooth of [1, 2, 3, 4, 5, 6]) click(tooth);
    expect(artClasses()?.contains('is-wary')).toBe(true);
    expect(artClasses()?.contains('is-trembling')).toBe(false);
    click(7);
    click(8);
    expect(artClasses()?.contains('is-wary')).toBe(false);
    expect(artClasses()?.contains('is-trembling')).toBe(true);
  });

  it('zittert bei einem einzigen Zahn von Anfang an deutlich (100 %)', () => {
    build([1], { teethOverride: 1 });
    expect(artClasses()?.contains('is-trembling')).toBe(true);
  });

  it('zittert nach dem Biss nicht mehr', () => {
    build([1], { teethOverride: 1 });
    click(1);
    expect(artClasses()?.contains('is-snapped')).toBe(true);
    expect(artClasses()?.contains('is-wary')).toBe(false);
    expect(artClasses()?.contains('is-trembling')).toBe(false);
  });
```

- [ ] **Step 2: Scheitern ansehen**

Run: `pnpm vitest run src/presentation/game/gameController.test.ts`
Expected: FAIL — „zittert leicht über 30 %…" und „zittert bei einem einzigen Zahn…" rot (`expected false to be true`); die beiden anderen neuen Fälle sind schon grün, weil die Klassen noch nirgends gesetzt werden.

- [ ] **Step 3: Die Klassen setzen**

In `src/presentation/game/gameController.ts` in `render()` direkt **nach** der Zeile `panel?.classList.toggle('is-snapped', !roundOpen);` einfügen:

```ts
    // Das Tier spürt die Gefahr mit: leichtes Zittern über 30 %, deutliches ab 50 % — dieselben
    // Schwellen wie der Balken, also dieselbe öffentliche Zahl. Bei geschlossenem Maul nie: eine
    // Animation am Oberkiefer überschriebe dort seine Schließ-Transformation.
    const danger = roundOpen && isHighDanger(this.tension);
    this.art?.classList.toggle('is-trembling', danger);
    this.art?.classList.toggle('is-wary', roundOpen && isTense(this.tension) && !danger);
```

- [ ] **Step 4: Das Stylesheet ergänzen**

In `src/presentation/styles/app.css` **direkt vor** dem Kommentar `/* Fakeout-Zucken: das Maul zuckt kurz, ohne zuzuschnappen. */` einfügen:

```css
/* Das Tier spürt die Gefahr mit: der Oberkiefer zittert leicht über 30 % Bissgefahr und deutlich
   ab 50 % (Klassen aus der Steuerung, dieselben Schwellen wie der Balken). Diese Regeln stehen mit
   Absicht **vor** dem Zucken und vor der Pause: `is-twitching`, `is-pressing`, `is-settling` und
   `is-clenching` animieren dasselbe Element mit gleicher Spezifität — die spätere Regel gewinnt,
   und das Zittern darf keine von ihnen schlucken. */
.creature.is-wary .jaw__upper {
  --tremble: 2px;
  animation: jaw-tremble 1.4s ease-in-out infinite;
}

.creature.is-trembling .jaw__upper {
  --tremble: 3px;
  animation: jaw-tremble 0.42s ease-in-out infinite;
}

@keyframes jaw-tremble {
  0%, 100% { transform: translateY(0); }
  30% { transform: translateY(var(--tremble, 2px)); }
  70% { transform: translateY(calc(var(--tremble, 2px) * -0.5)); }
}
```

- [ ] **Step 5: Die Reihenfolge im Stylesheet nachsehen**

Run: `grep -n "jaw-tremble\|is-twitching .jaw__upper\|is-pressing .jaw__upper\|is-settling .jaw__upper\|is-clenching .jaw__upper" src/presentation/styles/app.css`
Expected: beide Zeilen mit `animation: jaw-tremble` tragen **kleinere** Zeilennummern als alle vier anderen Treffer.

- [ ] **Step 6: Tests und Gate**

Run: `pnpm gate`, danach `echo "gate=$?"` in eigener Zeile. Expected: `gate=0`.

- [ ] **Step 7: Commit**

```bash
git status --short
git add src/presentation/game/gameController.ts src/presentation/game/gameController.test.ts src/presentation/styles/app.css
git commit -m "Bühne: der Oberkiefer zittert mit der Bissgefahr — leicht über 30 %, deutlich ab 50 %"
```

---

### Task 4: Sonde im echten Browser

jsdom rechnet kein CSS: ob die Pupille wirklich wandert, in der Linse bleibt und ob das Zittern das Knarren der Pause nicht schluckt, zeigt erst ein Browser.

**Files:**
- Create: `scripts/pruefen-blick.py`

**Interfaces:**
- Consumes: `svg.creature`, `.creature__face ellipse[fill="#ffffff"]`, `.pupil`, `.jaw__upper`, Klassen `is-wary`/`is-trembling`/`is-pressing`, Ablage-Schlüssel `zahn_agent:settings:v1`.
- Produces: Ausgabezeile `Auffälligkeiten: <n>` und Exit-Code 0/1.

- [ ] **Step 1: Die Sonde schreiben**

`scripts/pruefen-blick.py`:

```python
"""
Blick-Sonde: prüft im **echten Browser**, dass die Augen dem Zeiger folgen, die Pupille dabei in
der Linse bleibt und der Kiefer mit der Bissgefahr zittert. jsdom rechnet kein CSS.

Geprüft wird:

    1. Blick      → je Tier: Zeiger links und rechts der Bühne verschiebt die Pupillen in
                    verschiedene Richtungen; an fünf Zeigerstellen bleibt jede Pupille in ihrer
                    weißen Linse
    2. Kopfbilder → die Pupillen der Auswahl-Kacheln bewegen sich nicht mit
    3. Zittern    → zehn Zähne am Start: keine Animation; ein Zahn (100 %): `jaw-tremble`
    4. Pause      → während `is-pressing` läuft `jaw-crack`, nicht das Zittern
    5. Ruhe       → mit `prefers-reduced-motion` läuft keine Animation

Aufruf (der Entwicklungsserver muss laufen):
    uv run --with playwright python scripts/pruefen-blick.py [URL]

Rückgabe 0 = in Ordnung, 1 = Fund.
"""
import json
import sys

from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4321"
SETTINGS_KEY = "zahn_agent:settings:v1"
TIERE = ["crocodile", "wolf", "human", "shark", "mouse", "vampire", "panda", "lion", "panther", "sabertooth"]


def einstellungen(tier: str, zaehne) -> dict:
    return {"mode": "original", "players": 1, "sound": False, "vibration": False,
            "creature": tier, "teethOverride": zaehne}


AUGEN = """() => {
  const art = document.querySelector('svg.creature');
  const linsen = Array.from(art.querySelectorAll('.creature__face ellipse[fill="#ffffff"]'))
    .map((linse) => linse.getBoundingClientRect());
  return Array.from(art.querySelectorAll('.pupil')).map((pupille) => {
    const p = pupille.getBoundingClientRect();
    const mx = p.left + p.width / 2;
    const my = p.top + p.height / 2;
    // Die kleinste weiße Ellipse um die Pupillenmitte ist ihre Linse.
    const linse = linsen
      .filter((l) => mx >= l.left && mx <= l.right && my >= l.top && my <= l.bottom)
      .sort((a, b) => a.width * a.height - b.width * b.height)[0];
    return {
      mitteX: mx,
      mitteY: my,
      inLinse: !!linse && p.left >= linse.left - 0.5 && p.right <= linse.right + 0.5
        && p.top >= linse.top - 0.5 && p.bottom <= linse.bottom + 0.5,
    };
  });
}"""

KACHEL = """() => {
  const pupille = document.querySelector('.creature-portrait .pupil');
  return pupille ? getComputedStyle(pupille).transform : '(keine Kachel)';
}"""

KIEFER = """() => {
  const art = document.querySelector('svg.creature');
  const stil = getComputedStyle(art.querySelector('.jaw__upper'));
  return { animation: stil.animationName, dauer: stil.animationDuration, klassen: art.getAttribute('class') };
}"""


def main() -> int:
    funde: list[str] = []

    def pruefe(gut: bool, text: str) -> None:
        print(("  ok    " if gut else "  FUND  ") + text)
        if not gut:
            funde.append(text)

    with sync_playwright() as p:
        browser = p.chromium.launch()

        def neue_seite(werte: dict, ruhe: bool = False):
            kontext = browser.new_context(viewport={"width": 390, "height": 844},
                                          reduced_motion="reduce" if ruhe else "no-preference")
            seite = kontext.new_page()
            seite.goto(URL, wait_until="load")
            seite.evaluate("([k, v]) => localStorage.setItem(k, v)", [SETTINGS_KEY, json.dumps(werte)])
            seite.reload(wait_until="load")
            seite.wait_for_timeout(600)
            return seite

        print("1 — Blick, je Tier")
        for tier in TIERE:
            seite = neue_seite(einstellungen(tier, None))
            kasten = seite.evaluate("""() => {
              const r = document.querySelector('svg.creature').getBoundingClientRect();
              return { l: r.left, t: r.top, w: r.width, h: r.height };
            }""")
            stellen = {
                "links": (kasten["l"] + 4, kasten["t"] + kasten["h"] / 2),
                "rechts": (kasten["l"] + kasten["w"] - 4, kasten["t"] + kasten["h"] / 2),
                "oben": (kasten["l"] + kasten["w"] / 2, kasten["t"] + 4),
                "unten": (kasten["l"] + kasten["w"] / 2, kasten["t"] + kasten["h"] - 4),
                "mitte": (kasten["l"] + kasten["w"] / 2, kasten["t"] + kasten["h"] / 2),
            }
            lagen = {}
            for name, (x, y) in stellen.items():
                seite.mouse.move(x, y)
                seite.wait_for_timeout(320)
                lagen[name] = seite.evaluate(AUGEN)
            alle_drin = all(auge["inLinse"] for lage in lagen.values() for auge in lage)
            weg = lagen["rechts"][0]["mitteX"] - lagen["links"][0]["mitteX"]
            pruefe(len(lagen["mitte"]) == 2, f"{tier}: zwei Pupillen gefunden ({len(lagen['mitte'])})")
            pruefe(alle_drin, f"{tier}: jede Pupille bleibt an allen fünf Stellen in ihrer Linse")
            pruefe(weg > 1.0, f"{tier}: der Blick wandert von links nach rechts ({weg:.2f} px)")
            if tier == TIERE[0]:
                print("2 — Kopfbilder")
                seite.mouse.move(*stellen["links"])
                seite.wait_for_timeout(320)
                kachel = seite.evaluate(KACHEL)
                pruefe(kachel in ("none", "matrix(1, 0, 0, 1, 0, 0)"),
                       f"die Pupille der Kachel steht still (transform: {kachel})")
                print("1 — Blick, je Tier (weiter)")
            seite.context.close()

        print("3 — Zittern")
        seite = neue_seite(einstellungen("crocodile", 10))
        ruhig = seite.evaluate(KIEFER)
        pruefe(ruhig["animation"] == "none", f"zehn Zähne am Start: keine Animation ({ruhig['animation']})")
        seite.context.close()

        seite = neue_seite(einstellungen("vampire", 1))
        laut = seite.evaluate(KIEFER)
        pruefe(laut["animation"] == "jaw-tremble" and "is-trembling" in laut["klassen"],
               f"ein Zahn: der Kiefer zittert ({laut['animation']}, {laut['dauer']}, Klassen: {laut['klassen']})")

        print("4 — Pause")
        seite.evaluate("() => document.querySelector('svg.creature').classList.add('is-pressing')")
        pause = seite.evaluate(KIEFER)
        pruefe(pause["animation"] == "jaw-crack",
               f"in der Pause gewinnt das Knarren, nicht das Zittern ({pause['animation']})")
        seite.context.close()

        print("5 — Ruhe")
        seite = neue_seite(einstellungen("vampire", 1), ruhe=True)
        still = seite.evaluate(KIEFER)
        pruefe(still["animation"] == "none", f"mit reduzierter Bewegung läuft nichts ({still['animation']})")
        seite.context.close()

        browser.close()

    print(f"\nAuffälligkeiten: {len(funde)}")
    return 1 if funde else 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 2: Server starten und die Sonde fahren**

Vorher prüfen, ob Port 4321 schon antwortet (`curl -s -o /dev/null -w "%{http_code}" http://localhost:4321/`); sonst `pnpm dev` im Hintergrund starten.

Run: `PYTHONIOENCODING=utf-8 uv run --with playwright python scripts/pruefen-blick.py`, danach `echo "sonde=$?"` in eigener Zeile.
Expected: 35 Zeilen `ok` (30 für die Tiere, 1 Kachel, 4 für Zittern, Pause und Ruhe), `Auffälligkeiten: 0`, `sonde=0`. Die **Ausgabe ansehen**.

Ein `FUND` „bleibt … in ihrer Linse" heißt: `GAZE_MAX` ist für dieses Tier zu groß, obwohl der Test in Aufgabe 1 grün war — dann misst der Browser strenger (Strichstärke). `GAZE_MAX` auf 3 senken, Test und Sonde erneut fahren. Ein `FUND` bei „Pause" heißt: die Zitter-Regeln stehen im Stylesheet zu weit hinten (Aufgabe 3, Schritt 5).

- [ ] **Step 3: Die Zahnsicht gegenprüfen**

Der Blick verschiebt Formen im Gesicht — die Gesichtsebene liegt über den Zähnen.

Run:

```bash
pnpm vitest run src/render-probe.test.ts
PYTHONIOENCODING=utf-8 uv run --with playwright python scripts/pruefen-zahnsicht.py
```

Expected: `0 Auffälligkeiten`. (Die Sonde misst die ruhende Zeichnung; da die Pupille die Linse nicht verlässt und die Linse außerhalb des Zahnrings liegt, bleibt das Ergebnis gültig.)

- [ ] **Step 4: Server beenden und Commit**

```bash
git status --short
git add scripts/pruefen-blick.py
git commit -m "Sonde: Blick, Linsen-Grenze aller Tiere und Zittern im echten Browser"
```

---

### Task 5: Doku nachziehen

**Files:**
- Modify: `AGENTS.md`, `README.md`, `docs/domain-model.md`, `docs/tiermodell-anleitung.md`, `docs/testing.md`, `docs/workflow.md`, `docs/plan.md`, `docs/e2e-nachweise.md`

**Interfaces:**
- Consumes: Testzahl aus `pnpm test:run`, Ausgabe der Sonde aus Task 4.
- Produces: nichts.

- [ ] **Step 1: Testzahl messen**

Run: `pnpm test:run`, die Zeilen `Test Files` und `Tests` ablesen (es kommen 18 Fälle und eine Datei hinzu: 7 + 7 + 4). Die **gemessene** Zahl ersetzt die alte in `README.md` (drei Stellen: Startanleitung, Befehlstabelle, Nachweistabelle) und `docs/testing.md` (Zeilen „Testdateien" und „Tests"). Die alte Zahl vorher mit `grep -n "Tests" README.md docs/testing.md` feststellen und für die Doku-Prüfung in Schritt 7 merken.

- [ ] **Step 2: `AGENTS.md`**

In der Falle „Die Zeichnung hat zwei Wahrheiten" die Liste der Zustände um `is-wary` und `is-trembling` ergänzen (hinter `is-clenching`).

Im Abschnitt „Ein neues Lebewesen ergänzen", Punkt 2, ans Ende anhängen: „Die beiden Pupillen tragen `class="pupil"` und liegen in einer weißen Linse (`fill="#ffffff"`) mit mindestens 4 Einheiten Luft ringsum — sie folgen dem Zeiger (`creatures/gaze.ts`); `gaze.test.ts` fällt sonst."

Im Abschnitt „Befehle" eine Zeile ergänzen:

```bash
uv run --with playwright python scripts/pruefen-blick.py       # Blick, Linsen-Grenze, Zittern (Server muss laufen)
```

- [ ] **Step 3: `docs/domain-model.md` und `docs/tiermodell-anleitung.md`**

In `docs/domain-model.md` in der Tabelle „Spannungsdramaturgie" zwei Zeilen anhängen:

```
| Blick | die Pupillen folgen dem Zeiger und bleiben auf dem gedrückten Zahn, höchstens 4 SVG-Einheiten (`creatures/gaze.ts`); hängt nie an den scharfen Zähnen |
| Zittern | der Oberkiefer zittert leicht über 30 % Bissgefahr (`is-wary`) und deutlich ab 50 % (`is-trembling`) — dieselben Schwellen wie der Balken; bei geschlossenem Maul nie |
```

In `docs/tiermodell-anleitung.md` im Abschnitt, der beschreibt, wohin die Augen dürfen, einen Absatz ergänzen:

```
**Die Pupille wandert.** Beide Pupillen tragen `class="pupil"` und folgen dem Zeiger um höchstens
4 Einheiten (`GAZE_MAX` in `creatures/gaze.ts`). Die weiße Linse (`fill="#ffffff"`) muss deshalb
rings um die Pupille mindestens 4 Einheiten Luft lassen — `gaze.test.ts` rechnet das für jedes Tier
in acht Richtungen nach, `scripts/pruefen-blick.py` misst es im Browser.
```

- [ ] **Step 4: `docs/testing.md` und `docs/workflow.md`**

In `docs/testing.md` in der Tabelle der Testdateien eine Zeile nach der zu `creatureViews.test.ts` einfügen:

```
| `src/presentation/game/creatures/gaze.test.ts` | Rechnung des Blicks (Richtung, Höchstweg, Abstand null, kein `NaN`), Umrechnung Bildschirm → Zeichnung (auch ohne Größe) und die **Linsen-Grenze**: bei vollem Blick bleibt die Pupille jedes Tiers in acht Richtungen in ihrer weißen Linse |
```

an die Zeile zu `gameController.test.ts` vor dem schließenden ` |` anhängen:

```
; **Blick** (geradeaus am Rundenbeginn, auf den gedrückten Zahn, dem Zeiger nach, nicht nach dem Biss und nicht nach `dispose()`) und **Zittern** (keines am Start, leicht über 30 %, deutlich ab 50 %, nie beides, nie bei geschlossenem Maul)
```

und in der Liste der Sonden ergänzen:

```
- **Blick-Sonde** — `scripts/pruefen-blick.py` bewegt den Zeiger über die Bühne aller zehn Tiere
  und liest die berechneten Stile des Kiefers. Erwartet: 35 Zeilen `ok` und `Auffälligkeiten: 0`.
  `uv run --with playwright python scripts/pruefen-blick.py`
```

In `docs/workflow.md` in der Tabelle „Skripte im Baum" einfügen:

```
| `pruefen-blick.py` | Sonde: die Augen folgen dem Zeiger, die Pupille bleibt bei jedem Tier in der Linse, der Kiefer zittert mit der Bissgefahr | `uv run --with playwright python scripts/pruefen-blick.py` |
```

- [ ] **Step 5: `README.md`**

In der Liste der Eigenschaften beim Punkt „**Nervenkitzel:**" vor „Screen-Shake" einfügen: „Augen, die dem Finger folgen, ein Kiefer, der mit der Bissgefahr zittert,".

- [ ] **Step 6: `docs/plan.md` und `docs/e2e-nachweise.md`**

Ans Ende von `docs/plan.md` einen Nachtrag „## Nachtrag 12.10.2026 (gebaut): das Tier reagiert auf die Gefahr" setzen: Anlass, die neun **Entscheidungen** und die drei **Absagen** aus dem Abschnitt „Entscheidungen" dieses Plans (wörtlich), die Zeile „**Offen — nur der Auftraggeber kann es beurteilen:**", der tatsächlich verwendete Wert von `GAZE_MAX` (4 oder 3, mit dem Tier, das die Grenze gesetzt hat), und „Gate **N Tests in M Dateien**. Nicht gepusht." mit den gemessenen Zahlen.

In `docs/e2e-nachweise.md` vor „## 6. Von Prüfern gefundene Umgebungsfallen" einen Abschnitt mit der nächsten freien Kennung (`grep -n "^## 5" docs/e2e-nachweise.md | tail -1` zeigt die letzte) anlegen: „## 5xx. Blick und Zittern (12.10.2026)". Inhalt: der Aufruf der Sonde, ihre **wörtliche** Ausgabe als Codeblock, und der Satz „Nicht geprüft: ob Blick und Zittern am Handy spannend wirken — das sieht nur der Auftraggeber."

- [ ] **Step 7: Doku prüfen**

`ALT` um die alte Testzahl aus Schritt 1 ergänzen (Beispiel mit 386):

```bash
ALT="196|2,29 s|Drei Gebisse|232 Tests|Acht Gebisse|acht Kacheln|vier breite Backenzähne|2,1–2,5 s|293 Tests|386"
ALTE_WERTE="$ALT" ALTE_WERTE_STRIKT=1 bash scripts/doku-pruefen.sh README.md docs/testing.md
echo "doku=$?"
python3 scripts/doku-pfade-pruefen.py . README.md AGENTS.md docs/*.md
echo "pfade=$?"
```

Expected: `doku=0`, „Alle genannten Pfade existieren.", `pfade=0`.

- [ ] **Step 8: Gate, Bau, Commit**

Run: `pnpm gate` und `pnpm build`, Exit-Codes je in eigener Zeile prüfen. Expected: beide `0`.

```bash
git status --short
git add AGENTS.md README.md docs/domain-model.md docs/tiermodell-anleitung.md docs/testing.md docs/workflow.md docs/plan.md docs/e2e-nachweise.md
git commit -m "Doku: Blick und Zittern — Regel für die Linse, Nachweis der Sonde, Entscheidungen"
```

**Kein Push.** Dem Auftraggeber melden: was gebaut ist, Testzahl, Ausgabe der Sonde, der verwendete `GAZE_MAX`, und dass die Wirkung am Handy nur er beurteilen kann.
