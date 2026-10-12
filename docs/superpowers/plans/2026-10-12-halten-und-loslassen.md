# Drücken und halten: das Urteil kommt beim Loslassen — Umsetzungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ein Zahn sinkt, solange der Finger auf ihm liegt; entschieden wird erst beim Loslassen. Wer den Finger vom Zahn schiebt, nimmt den Druck zurück. Ein kurzer Tipp und die Tastatur funktionieren wie bisher.

**Architecture:** Die Änderung liegt allein in der Bedienung (`presentation/game/gameController.ts`). Aus dem einen `click`-Rückruf werden zwei Phasen: `pointerdown` auf einem Zahn beginnt ein **Halten** (Bild und Ton, aber kein Zug im Kern), `pointerup` am Dokument löst den Zug aus (`playPress`) oder verwirft ihn. Der Kern (`core/`) bleibt unverändert: `playPress` wird weiter genau einmal je Zug gerufen, nur später. Die Pause des Kerns (`beatMs`) bleibt die **Mindestpause**: wer kürzer hält, wartet den Rest ab; wer länger hält, bekommt das Urteil 60 ms nach dem Loslassen.

**Tech Stack:** TypeScript, Pointer Events, Vitest mit jsdom 30 (kennt `PointerEvent`, kennt `document.elementFromPoint` **nicht**), Playwright (Python) für die Sonde.

**Spec:** Es gibt kein eigenes Spec-Dokument. Grundlage sind die Entscheidungen unten; sie wandern in Aufgabe 4 als Nachtrag nach `docs/plan.md`. Vor dem Bau lesen: `AGENTS.md` (Abschnitt „Rückmeldung an den Nutzer", die Fallen „Ein Zeitgeber trägt die Runde", „Dekoration darf keinen Tipp abfangen", „Zeitgeber nie am globalen `window`"), `docs/domain-model.md` (Abschnitt „Spannungsdramaturgie"), `docs/workflow.md`.

**Reihenfolge der drei Pläne:** dieser zuerst, dann `2026-10-12-tier-reagiert.md`, dann `2026-10-12-heranzoomen.md`. Jeder ist für sich baubar. Zeilennummern in den Plänen gelten für den Stand `0511a05`; gesucht wird nach dem **zitierten Text**, nicht nach der Nummer.

## Entscheidungen

Vom Auftraggeber entschieden (12.10.2026): die drei Empfehlungen „Drücken und halten", „Das Tier reagiert auf die Gefahr", „Heranzoomen bei Rot" werden gebaut, in dieser Reihenfolge.

Im Selbst-Sparring entschieden (jede Antwort mit einer Tatsache aus dem Baum):

1. **Beim Auflegen wird nichts entschieden.** `playPress` läuft erst beim Loslassen. Grund: ein Finger, der nur scrollen will, endet mit `pointercancel` (so begründet `src/pages/index.astro` schon die Ton-Freigabe bei `pointerup`) — er darf keinen Zug kosten.
2. **Vom Zahn schieben nimmt den Druck zurück.** Geprüft wird beim Loslassen mit `document.elementFromPoint` gegen den Zahn. Das verrät nichts: bis dahin ist nichts gezogen.
3. **Die Pause des Kerns bleibt Mindestpause.** Gewartet wird `max(0, beatMs − Haltedauer)`. Ein kurzer Tipp fühlt sich damit an wie heute (120–700 ms), und schnelles Tippen kürzt die Pause nicht ab. Die Länge hängt weiter nur an Zufall, Spannung und der Hand des Spielers — nie am Ausgang.
4. **Tastatur und Hilfstechnik: kurzer Druck wie bisher.** `keydown` (Enter, Leertaste) und ein `click` ohne Zeiger (`detail === 0`) lösen sofort aus. Ein `click` **mit** Zeiger (`detail ≥ 1`) wird übergangen — den Zug hat `pointerup` schon ausgelöst.
5. **Obergrenze 4 s, danach federt der Zahn zurück** (kein Zug). Grund: ein verlorenes `pointerup` (Tabwechsel, Systemdialog) darf nichts entscheiden und die Bühne nicht sperren.
6. **Nur ein Halten zugleich.** Ein zweiter Finger beginnt keinen zweiten Druck (`isPrimary`, und ein laufendes Halten sperrt).
7. **Die Erleichterung wächst mit der erlebten Pause** — also mit `max(beatMs, Haltedauer)`. Wer lange gehalten hat, atmet hörbarer aus.
8. **Tipp-Rückmeldung beim Auflegen:** Vibration (25 ms) und die Klänge `tap`, `creak`, `breath` kommen beim Auflegen des Fingers, nicht beim Loslassen. Beim Zurücknehmen bricht `stopAll()` sie ab.

**Abgesagt:** Auslösen bei Erreichen der Obergrenze (ein hängendes Halten würde einen Zug erzwingen); Halten per Tastatur (`keydown`/`keyup` mit Tastenwiederholung — eigener Fehlerraum ohne Gewinn); ein Fortschrittsring um den gehaltenen Zahn (sähe aus wie ein Zeitlimit).

**Offen — nur der Auftraggeber kann es beurteilen:** wie sich das Halten am Handy anfühlt, ob 4 s zu kurz oder zu lang sind, und ob ein langer Druck auf dem Fire-Tablet oder in Safari ein Systemmenü öffnet (die Sonde prüft nur Chromium).

## Global Constraints

- Sprache: Code, Namen, Meldungen **englisch**; Kommentare, Doku, UI-Texte, Commit-Beschreibungen **deutsch**.
- Gate ist beides: `pnpm typecheck` **und** `pnpm test:run` (`pnpm gate`). Exit-Code nie über eine Pipe prüfen.
- Niemals `git add -A` — explizite Pfade. Vor jedem Commit `git status --short`.
- Direkte Commits auf `main`. **Kein Push** — ein Push veröffentlicht die Seite und wartet auf das Wort des Auftraggebers.
- Browser-Schnittstellen nie am globalen `window`: Zeitgeber und Uhr über `this.win()` (`this.doc.defaultView`), Ton über `SoundPort`, Vibration über `HapticsPort`.
- Jeder verzögerte Rückruf prüft, ob sein Anlass noch besteht (Runde, Halten).
- Der Kern (`src/core/`) wird in diesem Plan **nicht** geändert.
- Nichts darf den Ausgang verraten: vor dem Loslassen wird `playPress` nicht gerufen, und keine Dauer hängt am Ausgang.
- Nur die Zähne sind bedienbar; `pointer-events: all` bleibt allein am Trefferkreis `.tooth__hit`.
- Windows, Python-Sonden: `PYTHONIOENCODING=utf-8` davor setzen.

## Review Focus

- **Finger scrollt über einen Zahn** (`pointercancel`): der Zahn federt zurück, kein Zug. → Test in Aufgabe 1 („nimmt den Druck bei `pointercancel` zurück").
- **Zweiter Finger während des Haltens:** kein zweiter Druck, und sein Loslassen beendet das erste Halten nicht. → Test in Aufgabe 1 („lässt einen zweiten Finger nichts beginnen").
- **„Neue Runde" oder eine Einstellung während des Haltens:** das spätere Loslassen trifft die neue Runde nicht. → Test in Aufgabe 1 („vergisst das Halten, wenn eine neue Runde beginnt").
- **Loslassen geht verloren:** nach 4 s federt der Zahn zurück, die Bühne bleibt bedienbar. → Test in Aufgabe 1 („federt nach der Obergrenze zurück").
- **Zeiger-Tipp zählt doppelt** (`pointerup` und danach `click`): genau ein Zug. → Test in Aufgabe 1 („übergeht den `click` eines Zeigers") und Sonde in Aufgabe 3.

## Dateien

| Datei | Verantwortung in diesem Plan |
|---|---|
| `src/presentation/game/gameController.ts` | Halten beginnen, auslösen, zurücknehmen; Obergrenze; Abhängen |
| `src/presentation/game/gameController.test.ts` | Prüfsonde für alle Fälle oben |
| `src/presentation/styles/app.css` | Zustand `is-held`, kein Systemmenü am Zahn |
| `src/pages/index.astro` | Anleitung und Regeln nennen das Halten |
| `src/regeln.test.ts` | hält die beiden Sätze fest |
| `scripts/pruefen-halten.py` | Sonde im echten Browser (neu) |
| `AGENTS.md`, `README.md`, `docs/domain-model.md`, `docs/testing.md`, `docs/workflow.md`, `docs/plan.md`, `docs/e2e-nachweise.md` | Doku nachziehen |

---

### Task 1: Halten, Auslösen und Zurücknehmen in der Steuerung

**Files:**
- Modify: `src/presentation/game/gameController.ts`
- Test: `src/presentation/game/gameController.test.ts`

**Interfaces:**
- Consumes: `playPress` (`core/use-cases/playPress`), `reliefLevel(beatMs: number): number` und `VERDICT_GAP_MS` (`core/domain/tension`), `SoundPort`, `HapticsPort`.
- Produces: `GameDeps.now?: () => number` (Uhr in Millisekunden, für Tests austauschbar); CSS-Klasse `is-held` am `.tooth`-Element während des Haltens; unverändert `is-pressing` an `.creature` und `--press-beat` an `#stage`.

- [ ] **Step 1: Hilfen für die Tests ergänzen**

In `src/presentation/game/gameController.test.ts` direkt **nach** der Funktion `click(...)` einfügen:

```ts
/**
 * Zeiger-Ereignis. `isPrimary` und `button` stehen ausdrücklich da: jsdom gibt `isPrimary: false`
 * vor, und die Steuerung nimmt nur den ersten Finger bzw. die Haupttaste.
 */
function pointer(
  type: 'pointerdown' | 'pointerup' | 'pointercancel',
  target: EventTarget,
  init: PointerEventInit = {},
): void {
  target.dispatchEvent(
    new PointerEvent(type, { bubbles: true, pointerId: 1, isPrimary: true, button: 0, ...init }),
  );
}

function toothElement(id: number): Element {
  const tooth = document.querySelector(`.tooth[data-tooth="${id}"]`);
  if (!tooth) {
    throw new Error(`Zahn ${id} fehlt`);
  }
  return tooth;
}

interface Waiting {
  ms: number;
  run: () => void;
}

/**
 * Steuerung mit eigener Uhr und mitgeschriebenen Wartezeiten. Kurze Wartezeiten laufen sofort
 * (wie `compressedWait`), die Obergrenze des Haltens (4000 ms) bleibt stehen und wird von Hand
 * ausgeführt.
 */
function buildHold(
  live: number[],
  overrides: Partial<GameSettings> = {},
): {
  controller: GameController;
  sound: RecordingSound;
  haptics: RecordingHaptics;
  clock: { ms: number };
  waits: Waiting[];
} {
  document.body.innerHTML = DOM;
  const sound = new RecordingSound();
  const haptics = new RecordingHaptics(true);
  const clock = { ms: 0 };
  const waits: Waiting[] = [];
  const controller = new GameController({
    rng: new ScriptedRandom([0.5]),
    selector: new FixedLiveTeethSelector(live),
    sound,
    haptics,
    log: new MemoryLog(),
    settings: settings(overrides),
    onSettingsChange: () => undefined,
    document,
    now: () => clock.ms,
    wait: (ms, run) => {
      waits.push({ ms, run });
      if (ms < 1000) {
        run();
      }
    },
  });
  controller.mount();
  gebaut.push(controller);
  return { controller, sound, haptics, clock, waits };
}

function progressText(): string | null | undefined {
  return document.getElementById('hud-progress')?.textContent;
}
```

- [ ] **Step 2: Die fehlschlagenden Tests schreiben**

Im selben Testfile **innerhalb** von `describe('GameController in der Bühne', ...)`, vor dessen schließender Klammer, einfügen (dort hängt `afterEach` jede Steuerung ab):

```ts
  it('entscheidet beim Auflegen des Fingers noch nichts: der Zahn sinkt nur', () => {
    const { sound, haptics } = buildHold([4], { vibration: true });
    const tensionsBefore = sound.tensions.length;
    pointer('pointerdown', toothElement(1));
    expect(toothElement(1).classList.contains('is-held')).toBe(true);
    expect(toothElement(1).getAttribute('aria-pressed')).not.toBe('true');
    expect(document.querySelector('.creature')?.classList.contains('is-pressing')).toBe(true);
    expect(progressText()).toBe('0 von 10 gedrückt');
    expect(sound.names()).toEqual(['tap', 'creak', 'breath']);
    expect(sound.tensions).toHaveLength(tensionsBefore);
    expect(haptics.patterns).toEqual([25]);
  });

  it('löst den Druck beim Loslassen auf dem Zahn aus — genau einmal', () => {
    const { sound } = buildHold([4]);
    pointer('pointerdown', toothElement(1));
    pointer('pointerup', toothElement(1));
    expect(progressText()).toBe('1 von 10 gedrückt');
    expect(toothElement(1).getAttribute('aria-pressed')).toBe('true');
    expect(toothElement(1).classList.contains('is-held')).toBe(false);
    expect(sound.names().filter((name) => name === 'tap')).toHaveLength(1);
    expect(sound.names()).toContain('settle');
    expect(document.getElementById('stage')?.dataset.status).toBe('open');
  });

  it('wartet nach einem kurzen Tipp den Rest der Pause ab, nach langem Halten nichts mehr', () => {
    const { clock, waits } = buildHold([4]);
    let before = waits.length;
    pointer('pointerdown', toothElement(1));
    pointer('pointerup', toothElement(1));
    // Erst die Obergrenze des Haltens, dann der Rest der Pause aus dem Kern (120–700 ms).
    expect(waits[before]?.ms).toBe(4000);
    expect(waits[before + 1]?.ms).toBeGreaterThanOrEqual(120);
    expect(waits[before + 1]?.ms).toBeLessThanOrEqual(700);

    before = waits.length;
    pointer('pointerdown', toothElement(2));
    clock.ms += 2000;
    pointer('pointerup', toothElement(2));
    expect(waits[before]?.ms).toBe(4000);
    expect(waits[before + 1]?.ms).toBe(0);
  });

  it('schnappt erst beim Loslassen zu, auch wenn der scharfe Zahn lange gehalten wird', () => {
    const { clock, sound } = buildHold([1]);
    pointer('pointerdown', toothElement(1));
    clock.ms += 1500;
    expect(document.getElementById('stage')?.dataset.status).toBe('open');
    expect(sound.names()).not.toContain('snap');
    pointer('pointerup', toothElement(1));
    expect(document.getElementById('stage')?.dataset.status).toBe('snapped');
    expect(sound.names()).toContain('snap');
  });

  it('nimmt den Druck zurück, wenn der Finger vom Zahn geschoben wird', () => {
    const { sound } = buildHold([4]);
    const doc = document as unknown as { elementFromPoint?: (x: number, y: number) => Element | null };
    doc.elementFromPoint = () => document.body;
    try {
      const stopsBefore = sound.stopAllCalls;
      pointer('pointerdown', toothElement(1));
      pointer('pointerup', document.body);
      expect(progressText()).toBe('0 von 10 gedrückt');
      expect(toothElement(1).classList.contains('is-held')).toBe(false);
      expect(document.querySelector('.creature')?.classList.contains('is-pressing')).toBe(false);
      expect(sound.stopAllCalls).toBe(stopsBefore + 1);
    } finally {
      delete doc.elementFromPoint;
    }
    // Der Zahn bleibt drückbar.
    pointer('pointerdown', toothElement(1));
    pointer('pointerup', toothElement(1));
    expect(progressText()).toBe('1 von 10 gedrückt');
  });

  it('nimmt den Druck bei pointercancel zurück (der Finger scrollt)', () => {
    buildHold([4]);
    pointer('pointerdown', toothElement(1));
    pointer('pointercancel', toothElement(1));
    expect(progressText()).toBe('0 von 10 gedrückt');
    expect(toothElement(1).classList.contains('is-held')).toBe(false);
    pointer('pointerup', toothElement(1));
    expect(progressText()).toBe('0 von 10 gedrückt');
  });

  it('lässt einen zweiten Finger nichts beginnen und nichts beenden', () => {
    buildHold([4]);
    pointer('pointerdown', toothElement(1));
    pointer('pointerdown', toothElement(2), { pointerId: 2, isPrimary: false });
    pointer('pointerdown', toothElement(3), { pointerId: 3 });
    expect(toothElement(2).classList.contains('is-held')).toBe(false);
    expect(toothElement(3).classList.contains('is-held')).toBe(false);
    pointer('pointerup', toothElement(2), { pointerId: 2, isPrimary: false });
    expect(toothElement(1).classList.contains('is-held')).toBe(true);
    expect(progressText()).toBe('0 von 10 gedrückt');
    pointer('pointerup', toothElement(1));
    expect(progressText()).toBe('1 von 10 gedrückt');
  });

  it('übergeht den click eines Zeigers — den Zug hat pointerup schon ausgelöst', () => {
    buildHold([4]);
    toothElement(1).dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    expect(progressText()).toBe('0 von 10 gedrückt');
    // Ohne Zeiger (Tastatur, Hilfstechnik) bleibt der kurze Druck.
    toothElement(1).dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));
    expect(progressText()).toBe('1 von 10 gedrückt');
  });

  it('federt nach der Obergrenze zurück, statt einen Zug zu erzwingen', () => {
    const { waits } = buildHold([4]);
    const before = waits.length;
    pointer('pointerdown', toothElement(1));
    expect(waits[before]?.ms).toBe(4000);
    waits[before]?.run();
    expect(toothElement(1).classList.contains('is-held')).toBe(false);
    expect(progressText()).toBe('0 von 10 gedrückt');
    pointer('pointerup', toothElement(1));
    expect(progressText()).toBe('0 von 10 gedrückt');
  });

  it('vergisst das Halten, wenn eine neue Runde beginnt', () => {
    const { controller, waits } = buildHold([4]);
    const before = waits.length;
    pointer('pointerdown', toothElement(1));
    controller.resetRound();
    pointer('pointerup', toothElement(1));
    expect(progressText()).toBe('0 von 10 gedrückt');
    expect(toothElement(1).getAttribute('aria-pressed')).not.toBe('true');
    // Auch die Obergrenze der alten Runde rührt die neue nicht an.
    pointer('pointerdown', toothElement(2));
    waits[before]?.run();
    expect(toothElement(2).classList.contains('is-held')).toBe(true);
  });

  it('löst nach dispose() nichts mehr aus', () => {
    const { controller } = buildHold([4]);
    pointer('pointerdown', toothElement(1));
    controller.dispose();
    pointer('pointerup', toothElement(1));
    expect(progressText()).toBe('0 von 10 gedrückt');
  });

  it('lässt die Erleichterung mit der erlebten Pause wachsen — auch mit der gehaltenen', () => {
    const { clock, sound } = buildHold([4]);
    pointer('pointerdown', toothElement(1));
    clock.ms += 2000;
    pointer('pointerup', toothElement(1));
    expect(sound.events.find((event) => event.name === 'settle')?.intensity).toBe(1);
  });
```

- [ ] **Step 3: Tests laufen lassen und das Scheitern ansehen**

Run: `pnpm vitest run src/presentation/game/gameController.test.ts`
Expected: FAIL. Typfehler „`now` does not exist in type `GameDeps`" bzw. die zwölf neuen Fälle rot (z. B. „expected false to be true" bei `is-held`). Die bisherigen 49 Fälle bleiben grün. Meldet der Lauf stattdessen `PointerEvent is not defined`, in der Hilfsfunktion `new window.PointerEvent(...)` schreiben.

- [ ] **Step 4: Die Steuerung umbauen**

In `src/presentation/game/gameController.ts`:

(a) Im Import aus `'../../core/domain/tension'` den Namen `reliefLevel` ergänzen (alphabetisch nach `pulseInterval`).

(b) In `GameDeps` nach dem Feld `wait` ergänzen:

```ts
  /** Uhr in Millisekunden für die Haltedauer; Standard ist `performance.now()` des Dokumentfensters. */
  now?: () => number;
```

(c) Nach der Konstante `BITE_LATCH_MS` ergänzen:

```ts
/** So lange braucht der Zahn, um unter dem Finger zu sinken (ms) — nur Bild, kein Urteil. */
const HOLD_SINK_MS = 320;
/**
 * Längstes Halten (ms). Danach federt der Zahn zurück, **ohne** Zug: ein verlorenes Loslassen
 * (Tabwechsel, Systemdialog) darf nichts entscheiden und die Bühne nicht sperren.
 */
const HOLD_MAX_MS = 4000;

/** Ein Finger liegt auf einem Zahn — entschieden ist noch nichts. */
interface Hold {
  toothId: number;
  pointerId: number;
  startedAt: number;
}
```

(d) In der Klasse nach `private readonly wait: ...` ergänzen:

```ts
  private readonly now: () => number;
  /** Das laufende Halten; höchstens eines zugleich. */
  private hold: Hold | null = null;
```

und im Konstruktor nach der Zuweisung von `this.wait`:

```ts
    this.now = deps.now ?? (() => this.win()?.performance.now() ?? 0);
```

(e) In `mount()` nach `this.stage = this.doc.getElementById('stage');` ergänzen:

```ts
    // Das Loslassen wird am Dokument gehört: mit der Maus endet es dort, wo der Zeiger gerade
    // steht — nicht unbedingt auf dem Zahn.
    this.doc.addEventListener('pointerup', this.onPointerUp);
    this.doc.addEventListener('pointercancel', this.onPointerCancel);
```

(f) Die Methode `wireTeeth()` ganz ersetzen durch:

```ts
  private wireTeeth(): void {
    const teeth = this.doc.querySelectorAll<SVGGElement>('.tooth');
    teeth.forEach((tooth) => {
      const id = Number(tooth.dataset.tooth ?? '0');
      tooth.addEventListener('pointerdown', (event) => {
        const pointer = event as PointerEvent;
        // Nur der erste Finger bzw. die Haupttaste — ein zweiter Finger beginnt keinen Druck.
        if (!pointer.isPrimary || pointer.button !== 0) {
          return;
        }
        this.beginHold(id, pointer.pointerId);
      });
      // Ein Zeiger-Tipp endet zusätzlich mit `click` (detail ≥ 1) — den Zug hat `pointerup` schon
      // ausgelöst. Ein `click` ohne Zeiger (detail 0) kommt von Tastatur und Hilfstechnik.
      tooth.addEventListener('click', (event) => {
        if ((event as MouseEvent).detail === 0) {
          this.handlePress(id);
        }
      });
      // Langes Halten darf kein Systemmenü öffnen.
      tooth.addEventListener('contextmenu', (event) => event.preventDefault());
      tooth.addEventListener('keydown', (event) => {
        const key = (event as KeyboardEvent).key;
        if (key === 'Enter' || key === ' ' || key === 'Spacebar') {
          event.preventDefault();
          this.handlePress(id);
        }
      });
    });
  }
```

(g) Die Methode `handlePress(toothId)` ganz ersetzen durch den folgenden Block (die Methoden `startPressBeat` und `endPressBeat` darunter bleiben, wie sie sind):

```ts
  private canPress(toothId: number): boolean {
    return !this.busy && this.round.status === 'open' && !this.round.pressOrder.includes(toothId);
  }

  private readonly onPointerUp = (event: Event): void => {
    const hold = this.hold;
    const pointer = event as PointerEvent;
    if (!hold || pointer.pointerId !== hold.pointerId) {
      return;
    }
    if (this.releasedOnTooth(pointer, hold.toothId)) {
      this.releaseHold();
    } else {
      this.cancelHold();
    }
  };

  private readonly onPointerCancel = (event: Event): void => {
    if (this.hold && (event as PointerEvent).pointerId === this.hold.pointerId) {
      this.cancelHold();
    }
  };

  /** Liegt der Zeiger beim Loslassen noch auf dem Zahn? Wer ihn wegschiebt, nimmt den Druck zurück. */
  private releasedOnTooth(pointer: PointerEvent, toothId: number): boolean {
    // jsdom kennt `elementFromPoint` nicht — dort gilt jedes Loslassen als auf dem Zahn.
    if (typeof this.doc.elementFromPoint !== 'function') {
      return true;
    }
    const under = this.doc.elementFromPoint(pointer.clientX, pointer.clientY);
    return under !== null && this.tooth(toothId)?.contains(under) === true;
  }

  /** Was der Finger sofort merkt: Stoß und Klang. Verrät nichts — es hängt nur an der Gefahr. */
  private feelPress(): void {
    if (this.deps.settings.vibration) {
      this.vibrate(TAP_VIBRATION_MS);
    }
    this.deps.sound.play('tap', this.tension);
    this.deps.sound.play('creak', this.tension);
    this.deps.sound.play('breath', this.tension);
  }

  /**
   * Der Finger liegt auf: der Zahn sinkt, der Kiefer knarrt, das Tier hält den Atem an.
   * Entschieden ist noch nichts — `playPress` läuft erst beim Loslassen.
   */
  private beginHold(toothId: number, pointerId: number): void {
    if (this.hold || !this.canPress(toothId)) {
      return;
    }
    const hold: Hold = { toothId, pointerId, startedAt: this.now() };
    this.hold = hold;
    this.deps.sound.unlock();
    this.tooth(toothId)?.classList.add('is-held');
    this.startPressBeat(HOLD_SINK_MS);
    this.feelPress();
    // Die Obergrenze gehört zu **diesem** Halten — ein späteres rührt sie nicht an.
    this.wait(HOLD_MAX_MS, () => {
      if (this.hold === hold) {
        this.cancelHold();
      }
    });
  }

  /** Der Zahn federt zurück, ohne Zug: Finger weggeschoben, Geste abgebrochen oder zu lange gezögert. */
  private cancelHold(): void {
    const hold = this.hold;
    if (!hold) {
      return;
    }
    this.hold = null;
    this.tooth(hold.toothId)?.classList.remove('is-held');
    this.endPressBeat();
    this.deps.sound.stopAll();
  }

  private releaseHold(): void {
    const hold = this.hold;
    if (!hold) {
      return;
    }
    this.hold = null;
    this.resolvePress(hold.toothId, Math.max(0, this.now() - hold.startedAt), true);
  }

  /** Kurzer Druck ohne Halten — Tastatur und Hilfstechnik. */
  private handlePress(toothId: number): void {
    if (this.hold || !this.canPress(toothId)) {
      return;
    }
    this.deps.sound.unlock();
    this.resolvePress(toothId, 0, false);
  }

  /**
   * Der Zug: jetzt erst wird gezogen. `heldMs` ist die Zeit, die der Finger schon auflag — die
   * Pause des Kerns ist die Mindestpause, gewartet wird nur noch ihr Rest. `felt` sagt, ob Stoß,
   * Klang und Sink-Bewegung schon beim Auflegen kamen.
   */
  private resolvePress(toothId: number, heldMs: number, felt: boolean): void {
    this.busy = true;
    const outcome = playPress({ state: this.round, tooth: toothId, rng: this.deps.rng });
    this.round = outcome.state;
    this.tension = outcome.drama.tensionAfter;
    this.deps.sound.setTension(this.tension);
    this.tooth(toothId)?.classList.remove('is-held');
    this.markPressed(toothId);
    this.render();

    if (!felt) {
      // Die Pause: sie kommt bei jedem Druck, und ihre Länge sagt nichts über den Ausgang.
      this.startPressBeat(outcome.drama.beatMs);
      this.feelPress();
    }
    // Die Erleichterung wächst mit der Pause, die der Spieler **erlebt** hat — auch der gehaltenen.
    const drama: PressDrama = {
      ...outcome.drama,
      reliefLevel: reliefLevel(Math.max(outcome.drama.beatMs, heldMs)),
    };
    // Das Urteil gehört zu **dieser** Runde. Startet in der Pause eine neue („Neue Runde", eine
    // Einstellung), läuft es ins Leere — sonst schnappte das Maul über einer offenen Runde zu.
    const played = this.round;
    this.wait(Math.max(0, outcome.drama.beatMs - heldMs), () => {
      if (this.round !== played) {
        return;
      }
      // Der Riss: alles reißt ab. Die Lücke ist für beide Ausgänge gleich — 60 ms nichts.
      // Die Pose der Pause bleibt dabei stehen, erst das Urteil löst sie auf.
      this.deps.sound.stopAll();
      this.wait(VERDICT_GAP_MS, () => {
        if (this.round !== played) {
          return;
        }
        if (outcome.snapped) {
          this.snap(toothId);
          return;
        }
        this.settle(toothId, drama);
      });
    });
  }
```

(h) In `dispose()` vor `this.disposed = true;` ergänzen:

```ts
    this.hold = null;
    this.doc.removeEventListener('pointerup', this.onPointerUp);
    this.doc.removeEventListener('pointercancel', this.onPointerCancel);
```

(i) In `resetRound()` als erste Zeile ergänzen:

```ts
    // Ein laufendes Halten gehört zur alten Runde — sein Loslassen darf die neue nicht treffen.
    this.hold = null;
```

- [ ] **Step 5: Tests laufen lassen**

Run: `pnpm vitest run src/presentation/game/gameController.test.ts`
Expected: PASS, 61 Fälle (49 + 12). Schlägt ein **alter** Fall zur Tonfolge oder Vibration fehl, stimmt die Reihenfolge im kurzen Druck nicht mehr: dort muss gelten `unlock` → `playPress` → `setTension` → `render` → Vibration → `tap`, `creak`, `breath`.

- [ ] **Step 6: Gate**

Run: `pnpm gate` und danach `echo "gate=$?"` in **eigener** Zeile.
Expected: `gate=0`.

- [ ] **Step 7: Commit**

```bash
git status --short
git add src/presentation/game/gameController.ts src/presentation/game/gameController.test.ts
git commit -m "Bedienung: Zahn halten, das Urteil kommt beim Loslassen; wegschieben nimmt den Druck zurück"
```

---

### Task 2: Zustand `is-held` im Bild, Anleitung und Regeln

**Files:**
- Modify: `src/presentation/styles/app.css`
- Modify: `src/pages/index.astro`
- Test: `src/regeln.test.ts`

**Interfaces:**
- Consumes: Klasse `is-held` am `.tooth` (Task 1).
- Produces: nichts für spätere Aufgaben außer den Texten, die die Sonde in Task 3 nicht prüft.

- [ ] **Step 1: Den fehlschlagenden Test schreiben**

In `src/regeln.test.ts` in den bestehenden `describe`-Block (die Datei liest `src/pages/index.astro` schon als Konstante `SEITE`) einfügen:

```ts
  it('erklärt das Halten: in der Anleitung und in den Regeln', () => {
    expect(SEITE).toContain('Tippe oder halte einen Zahn.');
    expect(SEITE).toContain('entschieden wird erst, wenn du loslässt');
    expect(SEITE).toContain('dann zählt der Druck nicht');
  });
```

- [ ] **Step 2: Scheitern ansehen**

Run: `pnpm vitest run src/regeln.test.ts`
Expected: FAIL mit „expected '…' to contain 'Tippe oder halte einen Zahn.'".

- [ ] **Step 3: Texte ändern**

In `src/pages/index.astro` die Zeile

```html
      <p class="how-to" id="how-to">Tippe einen Zahn an. Einer ist der falsche — dann schnappt es zu!</p>
```

ersetzen durch

```html
      <p class="how-to" id="how-to">Tippe oder halte einen Zahn. Einer ist der falsche — dann schnappt es zu!</p>
```

Im Regeln-Blatt (`<dialog class="sheet" id="rules-sheet" …>`) **nach** dem ersten Absatz („Jede Person tippt nacheinander einen Zahn an. …") einfügen:

```html
    <p>
      Du kannst einen Zahn auch gedrückt halten: entschieden wird erst, wenn du loslässt. Wer sich
      nicht traut, schiebt den Finger vom Zahn — dann zählt der Druck nicht.
    </p>
```

Vorher `grep -rn "Tippe einen Zahn an" src` fahren: steht der alte Satz noch in einem Test, dort mitziehen.

- [ ] **Step 4: Stil ergänzen**

In `src/presentation/styles/app.css`:

(a) Die Regel `.tooth { cursor: pointer; }` ersetzen durch:

```css
.tooth {
  cursor: pointer;
  /* Langes Halten ist eine Spielgeste — kein Auswahl- oder Systemmenü. */
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}
```

(b) Direkt **nach** der Regel `.tooth.is-pressed .tooth__shape, .tooth[aria-pressed="true"] .tooth__shape { transform: translateY(22px); fill: #cfc7ac; }` einfügen:

```css
/* Gehalten: der Zahn sinkt schon, behält aber seine Farbe — entschieden ist noch nichts.
   Erst der Zug färbt ihn (is-pressed). */
.tooth.is-held .tooth__shape {
  transform: translateY(22px);
}
```

(c) Im Abschnitt „Die Pause vor der Auflösung" den Selektor der Übergangsregel um den gehaltenen Zahn erweitern, aus

```css
.tooth.is-pressed .tooth__shape,
.tooth[aria-pressed="true"] .tooth__shape {
  transition: transform var(--press-beat, 160ms) cubic-bezier(0.15, 0.85, 0.3, 1), fill 0.15s ease;
}
```

wird

```css
.tooth.is-held .tooth__shape,
.tooth.is-pressed .tooth__shape,
.tooth[aria-pressed="true"] .tooth__shape {
  transition: transform var(--press-beat, 160ms) cubic-bezier(0.15, 0.85, 0.3, 1), fill 0.15s ease;
}
```

- [ ] **Step 5: Tests und Bau**

Run: `pnpm gate`, dann `pnpm build`, jeweils mit `echo "…=$?"` in eigener Zeile.
Expected: beide `0`. In `dist/index.html` nachsehen: `grep -c "Tippe oder halte einen Zahn" dist/index.html` → `1`.

- [ ] **Step 6: Commit**

```bash
git status --short
git add src/presentation/styles/app.css src/pages/index.astro src/regeln.test.ts
git commit -m "Spielseite: gehaltener Zahn sinkt ohne Farbwechsel; Anleitung und Regeln nennen das Halten"
```

---

### Task 3: Sonde im echten Browser

jsdom kennt weder Geometrie noch `elementFromPoint` — ob das Wegschieben wirklich zurücknimmt und ob ein Zeiger-Tipp nur einmal zählt, zeigt erst ein Browser.

**Files:**
- Create: `scripts/pruefen-halten.py`

**Interfaces:**
- Consumes: `#hud-progress`, `#stage[data-status]`, `.tooth[data-tooth]`, `.tooth__hit`, Klasse `is-held`, Ablage-Schlüssel `zahn_agent:settings:v1`.
- Produces: Ausgabezeile `Auffälligkeiten: <n>` und Exit-Code 0/1 (zitiert in Task 4).

- [ ] **Step 1: Die Sonde schreiben**

`scripts/pruefen-halten.py`:

```python
"""
Halte-Sonde: prüft im **echten Browser**, dass ein Zahn erst beim Loslassen entschieden wird.

jsdom kennt keine Geometrie und kein `elementFromPoint` — genau daran hängen das Zurücknehmen
(Finger vom Zahn geschoben) und die Frage, ob ein Zeiger-Tipp nur einmal zählt.

Geprüft wird:

    1. Halten            → 1,5 s lang kein Zug, der Zahn trägt `is-held`; Loslassen zählt genau einen
    2. Wegschieben       → kein Zug, der Zahn steht wieder
    3. kurzer Mausklick  → genau ein Zug (pointerup und click dürfen nicht beide zählen)
    4. Obergrenze        → nach 4 s federt der Zahn zurück, das späte Loslassen zählt nicht
    5. Tastatur          → Eingabetaste auf dem Zahn zählt einen Zug
    6. Finger-Tipp       → ein Tipp auf dem Berührungsbildschirm zählt genau einen Zug
    7. ein Zahn          → Runde bleibt beim Halten offen und schnappt erst nach dem Loslassen zu

Aufruf (der Entwicklungsserver muss laufen):
    uv run --with playwright python scripts/pruefen-halten.py [URL]

Rückgabe 0 = in Ordnung, 1 = Fund.
"""
import json
import sys

from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4321"
SETTINGS_KEY = "zahn_agent:settings:v1"

ZEHN_ZAEHNE = {"mode": "original", "players": 1, "sound": False, "vibration": False,
               "creature": "crocodile", "teethOverride": 10}
EIN_ZAHN = {"mode": "original", "players": 1, "sound": False, "vibration": False,
            "creature": "vampire", "teethOverride": 1}

MITTE = """(zahn) => {
  const tooth = document.querySelector(`.tooth[data-tooth="${zahn}"]`);
  const r = tooth.querySelector('.tooth__hit').getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}"""

LAGE = """(zahn) => {
  const tooth = document.querySelector(`.tooth[data-tooth="${zahn}"]`);
  return {
    fortschritt: document.getElementById('hud-progress').textContent.trim(),
    status: document.getElementById('stage').dataset.status,
    gehalten: tooth.classList.contains('is-held'),
    gedrueckt: tooth.getAttribute('aria-pressed') === 'true',
  };
}"""


def main() -> int:
    funde: list[str] = []

    def pruefe(gut: bool, text: str) -> None:
        print(("  ok    " if gut else "  FUND  ") + text)
        if not gut:
            funde.append(text)

    with sync_playwright() as p:
        browser = p.chromium.launch()

        def neue_seite(einstellungen: dict, beruehrung: bool = False):
            kontext = browser.new_context(viewport={"width": 390, "height": 844}, has_touch=beruehrung)
            seite = kontext.new_page()
            seite.goto(URL, wait_until="load")
            seite.evaluate("([k, v]) => localStorage.setItem(k, v)",
                           [SETTINGS_KEY, json.dumps(einstellungen)])
            seite.reload(wait_until="load")
            seite.wait_for_timeout(600)
            return seite

        print("1 — Halten")
        seite = neue_seite(ZEHN_ZAEHNE)
        stelle = seite.evaluate(MITTE, "3")
        seite.mouse.move(stelle["x"], stelle["y"])
        seite.mouse.down()
        seite.wait_for_timeout(1500)
        lage = seite.evaluate(LAGE, "3")
        pruefe(lage["fortschritt"] == "0 von 10 gedrückt", f"beim Halten kein Zug (steht: {lage['fortschritt']})")
        pruefe(lage["gehalten"] and not lage["gedrueckt"], "der gehaltene Zahn trägt is-held und ist nicht gedrückt")
        seite.mouse.up()
        seite.wait_for_timeout(300)
        lage = seite.evaluate(LAGE, "3")
        pruefe(lage["fortschritt"] == "1 von 10 gedrückt", f"Loslassen zählt genau einen Zug (steht: {lage['fortschritt']})")
        pruefe(lage["gedrueckt"] and not lage["gehalten"], "nach dem Loslassen ist der Zahn gedrückt")
        seite.context.close()

        print("2 — Wegschieben")
        seite = neue_seite(ZEHN_ZAEHNE)
        stelle = seite.evaluate(MITTE, "3")
        seite.mouse.move(stelle["x"], stelle["y"])
        seite.mouse.down()
        seite.wait_for_timeout(300)
        seite.mouse.move(4, 4, steps=6)
        seite.mouse.up()
        seite.wait_for_timeout(300)
        lage = seite.evaluate(LAGE, "3")
        pruefe(lage["fortschritt"] == "0 von 10 gedrückt", f"weggeschoben zählt nicht (steht: {lage['fortschritt']})")
        pruefe(not lage["gehalten"] and not lage["gedrueckt"], "der Zahn steht wieder")
        seite.context.close()

        print("3 — kurzer Mausklick")
        seite = neue_seite(ZEHN_ZAEHNE)
        stelle = seite.evaluate(MITTE, "3")
        seite.mouse.click(stelle["x"], stelle["y"])
        seite.wait_for_timeout(1200)
        lage = seite.evaluate(LAGE, "3")
        pruefe(lage["fortschritt"] == "1 von 10 gedrückt", f"ein Klick ist ein Zug (steht: {lage['fortschritt']})")
        seite.context.close()

        print("4 — Obergrenze")
        seite = neue_seite(ZEHN_ZAEHNE)
        stelle = seite.evaluate(MITTE, "3")
        seite.mouse.move(stelle["x"], stelle["y"])
        seite.mouse.down()
        seite.wait_for_timeout(4500)
        lage = seite.evaluate(LAGE, "3")
        pruefe(not lage["gehalten"], "nach 4 s federt der Zahn zurück")
        seite.mouse.up()
        seite.wait_for_timeout(300)
        lage = seite.evaluate(LAGE, "3")
        pruefe(lage["fortschritt"] == "0 von 10 gedrückt", f"das späte Loslassen zählt nicht (steht: {lage['fortschritt']})")
        seite.context.close()

        print("5 — Tastatur")
        seite = neue_seite(ZEHN_ZAEHNE)
        seite.focus('.tooth[data-tooth="3"]')
        seite.keyboard.press("Enter")
        seite.wait_for_timeout(1200)
        lage = seite.evaluate(LAGE, "3")
        pruefe(lage["fortschritt"] == "1 von 10 gedrückt", f"Eingabetaste zählt einen Zug (steht: {lage['fortschritt']})")
        seite.context.close()

        print("6 — Finger-Tipp")
        seite = neue_seite(ZEHN_ZAEHNE, beruehrung=True)
        stelle = seite.evaluate(MITTE, "3")
        seite.touchscreen.tap(stelle["x"], stelle["y"])
        seite.wait_for_timeout(1200)
        lage = seite.evaluate(LAGE, "3")
        pruefe(lage["fortschritt"] == "1 von 10 gedrückt", f"ein Finger-Tipp ist ein Zug (steht: {lage['fortschritt']})")
        seite.context.close()

        print("7 — ein Zahn: das Urteil kommt erst nach dem Loslassen")
        seite = neue_seite(EIN_ZAHN)
        stelle = seite.evaluate(MITTE, "1")
        seite.mouse.move(stelle["x"], stelle["y"])
        seite.mouse.down()
        seite.wait_for_timeout(1500)
        lage = seite.evaluate(LAGE, "1")
        pruefe(lage["status"] == "open", f"beim Halten bleibt die Runde offen (ist: {lage['status']})")
        seite.mouse.up()
        seite.wait_for_timeout(400)
        lage = seite.evaluate(LAGE, "1")
        pruefe(lage["status"] == "snapped", f"nach dem Loslassen schnappt es zu (ist: {lage['status']})")
        seite.context.close()

        browser.close()

    print(f"\nAuffälligkeiten: {len(funde)}")
    return 1 if funde else 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 2: Server starten und die Sonde fahren**

Vorher prüfen, ob Port 4321 schon belegt ist: `curl -s -o /dev/null -w "%{http_code}" http://localhost:4321/`. Antwortet er nicht mit `200`, `pnpm dev` im Hintergrund starten (kein Befehl mit Timeout über 600 s daneben).

Run: `PYTHONIOENCODING=utf-8 uv run --with playwright python scripts/pruefen-halten.py`, danach `echo "sonde=$?"` in eigener Zeile.
Expected: dreizehn Zeilen `ok`, `Auffälligkeiten: 0`, `sonde=0`. Die **Ausgabe ansehen**, nicht nur den Code.

Ein `FUND` wird behoben, nicht wegerklärt. Häufigste Ursache bei Fall 2: der Punkt (4, 4) liegt auf einem Element, das den Zahn enthält — dann eine Stelle außerhalb der Bühne wählen und im Skript begründen.

- [ ] **Step 3: Die bestehenden Sonden fahren — sie drücken Zähne mit der Maus**

Run (jeweils mit `PYTHONIOENCODING=utf-8` und `http://localhost:4321` als Argument, wo das Skript eine Adresse nimmt):

```bash
uv run --with playwright python scripts/pruefen-trefferflaeche.py http://localhost:4321
uv run --with playwright python scripts/pruefen-anzeige.py http://localhost:4321
uv run --with playwright python scripts/pruefen-bedienung.py http://localhost:4321
uv run --with playwright python scripts/pruefen-blaetter.py http://localhost:4321
```

Expected: `pruefen-trefferflaeche.py` meldet bei allen drei Tippproben „registriert"; die anderen `Auffälligkeiten: 0` bzw. keine Funde. `pruefen-bedienung.py` ist wichtig, weil die Anleitung elf Zeichen länger geworden ist: bricht sie auf 320 × 568 in eine zweite Zeile und verdeckt etwas, den Satz kürzen auf „Tippe oder halte einen Zahn — einer schnappt zu!" und Test und Seite gemeinsam ändern.

- [ ] **Step 4: Server beenden und Commit**

Den selbst gestarteten Server beenden (PowerShell: `Get-NetTCPConnection -LocalPort 4321 -State Listen`, dann den Prozess stoppen).

```bash
git status --short
git add scripts/pruefen-halten.py
git commit -m "Sonde: Halten, Wegschieben, Obergrenze und Einfachzählung im echten Browser"
```

---

### Task 4: Doku nachziehen

**Files:**
- Modify: `AGENTS.md`, `README.md`, `docs/domain-model.md`, `docs/testing.md`, `docs/workflow.md`, `docs/plan.md`, `docs/e2e-nachweise.md`

**Interfaces:**
- Consumes: Testzahl aus `pnpm test:run`, Ausgabe der Sonde aus Task 3.
- Produces: nichts.

- [ ] **Step 1: Testzahl messen**

Run: `pnpm test:run` und die Zeilen `Test Files` und `Tests` ablesen. Diese **gemessene** Zahl (erwartet 386 in 28 Dateien: 373 + 12 + 1) ersetzt in `README.md` (drei Stellen) und `docs/testing.md` (eine Stelle) die alte. Die alte Zahl mit `grep -n "373" README.md docs/testing.md` suchen.

- [ ] **Step 2: `AGENTS.md`**

In der Falle „Die Zeichnung hat zwei Wahrheiten" die Liste der Zustände um `is-held` ergänzen:

```
`presentation/game/creatures/<tier>.ts`, nur Zustände im CSS (`is-held`, `is-pressed`, `is-snapped`,
```

Im Abschnitt „Rückmeldung an den Nutzer" beim Punkt „Muster sind Absicht" den Satzteil „bei **jedem** Zahndruck — direkt aus der Fingerberührung heraus" belassen und danach einfügen: „(seit dem Halten: beim **Auflegen** des Fingers, nicht beim Loslassen)".

Im Abschnitt „Befehle" eine Zeile ergänzen:

```bash
uv run --with playwright python scripts/pruefen-halten.py      # Halten, Wegschieben, Obergrenze (Server muss laufen)
```

- [ ] **Step 3: `docs/domain-model.md`**

In der Tabelle „Spannungsdramaturgie" die Zeile „Pause (`beatMs`)" ersetzen durch:

```
| Pause (`beatMs`) | bei **jedem** Druck, 120–700 ms; die Länge wird **unabhängig vom Ausgang** gezogen (früh meist kurz, spät bis ans Ende des Fensters). Sie ist die **Mindestpause**: wer den Zahn länger hält, bekommt das Urteil 60 ms nach dem Loslassen |
| Halten | der Zahn sinkt beim Auflegen des Fingers, gezogen wird erst beim Loslassen; wegschieben, `pointercancel` oder 4 s Zögern nehmen den Druck zurück |
```

und die Zeile „Erleichterung" durch:

```
| Erleichterung | 0..1, abgeleitet aus der **erlebten** Pause (`max(beatMs, Haltedauer)`); nur beim harmlosen Druck |
```

- [ ] **Step 4: `docs/testing.md` und `docs/workflow.md`**

In `docs/testing.md` an die Zeile der Tabelle zu `src/presentation/game/gameController.test.ts` vor dem schließenden ` |` anhängen:

```
; **Halten**: beim Auflegen wird nichts entschieden, Loslassen auf dem Zahn zählt genau einen Zug, Wegschieben, `pointercancel`, die Obergrenze von 4 s, eine neue Runde und `dispose()` nehmen ihn zurück, ein zweiter Finger beginnt nichts, der `click` eines Zeigers wird übergangen
```

und unter „Nachweise" bzw. in der Liste der Sonden einen Punkt nach dem Muster der vorhandenen ergänzen:

```
- **Halte-Sonde** — `scripts/pruefen-halten.py` hält, schiebt weg, klickt, tippt und drückt die
  Eingabetaste im echten Browser. Erwartet: dreizehn Zeilen `ok` und `Auffälligkeiten: 0` (Exit 0).
  `uv run --with playwright python scripts/pruefen-halten.py`
```

In `docs/workflow.md` in der Tabelle „Skripte im Baum" nach der Zeile zu `pruefen-bedienung.py` einfügen:

```
| `pruefen-halten.py` | Sonde: Zahn halten, wegschieben, Obergrenze; Klick, Finger-Tipp und Eingabetaste zählen genau einen Zug | `uv run --with playwright python scripts/pruefen-halten.py` |
```

- [ ] **Step 5: `README.md`**

Im Abschnitt „Spielen" (Punkt 1, beginnt mit „**Spielen:** auf einen Zahn im Maul tippen.") nach dem ersten Satz einfügen: „Du kannst ihn auch gedrückt halten — entschieden wird erst beim Loslassen, und wer den Finger wegschiebt, nimmt den Druck zurück."

In der Liste der Eigenschaften beim Punkt „**Nervenkitzel:**" vor „Screen-Shake" einfügen: „Halten statt Tippen (das Urteil kommt beim Loslassen),".

- [ ] **Step 6: `docs/plan.md` und `docs/e2e-nachweise.md`**

Ans Ende von `docs/plan.md` einen Nachtrag „## Nachtrag 12.10.2026 (gebaut): Zahn halten, das Urteil kommt beim Loslassen" setzen. Inhalt: der Anlass (Frage des Auftraggebers nach mehr Nervenkitzel, seine Zustimmung zu den drei Empfehlungen), die acht **Entscheidungen** und die drei **Absagen** aus dem Abschnitt „Entscheidungen" dieses Plans (wörtlich übernehmen), die Zeile „**Offen — nur der Auftraggeber kann es beurteilen:**" von dort, und zuletzt „Gate **N Tests in 28 Dateien**. Nicht gepusht." mit der gemessenen Zahl.

In `docs/e2e-nachweise.md` vor „## 6. Von Prüfern gefundene Umgebungsfallen" einen Abschnitt mit der nächsten freien Kennung anlegen (die letzte ist `5ab` → `5ac`): „## 5ac. Zahn halten: das Urteil kommt beim Loslassen (12.10.2026)". Inhalt: der Aufruf der Sonde, ihre **wörtliche** Ausgabe aus Task 3 als Codeblock, und ein Satz „Nicht geprüft: echtes Gerät, Safari, Silk — die Sonde läuft in Chromium."

- [ ] **Step 7: Doku prüfen**

```bash
ALT="196|2,29 s|Drei Gebisse|232 Tests|Acht Gebisse|acht Kacheln|vier breite Backenzähne|2,1–2,5 s|293 Tests|373"
ALTE_WERTE="$ALT" ALTE_WERTE_STRIKT=1 bash scripts/doku-pruefen.sh README.md docs/testing.md
echo "doku=$?"
python3 scripts/doku-pfade-pruefen.py . README.md AGENTS.md docs/*.md
echo "pfade=$?"
```

Expected: `doku=0`, „Alle genannten Pfade existieren.", `pfade=0`. Die Ausgabe ansehen.

- [ ] **Step 8: Gate, Bau, Commit**

Run: `pnpm gate` und `pnpm build`, jeweils Exit-Code in eigener Zeile prüfen. Expected: beide `0`.

```bash
git status --short
git add AGENTS.md README.md docs/domain-model.md docs/testing.md docs/workflow.md docs/plan.md docs/e2e-nachweise.md
git commit -m "Doku: Zahn halten — Regeln, Nachweis der Sonde, Entscheidungen und Absagen"
```

**Kein Push.** Dem Auftraggeber melden: was gebaut ist, die Testzahl, die Ausgabe der Sonde, und dass das Gefühl am Handy nur er prüfen kann.
