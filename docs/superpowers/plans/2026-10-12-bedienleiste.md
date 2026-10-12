# Bedienleiste: die häufigen Griffe auf der Spielseite — Umsetzungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tier, Zahnzahl und „Neue Runde" liegen als große Griffe auf der Spielseite; kein Blatt außer den Regeln scrollt mehr, auf Handy und Tablet.

**Architecture:** Die Spielseite bekommt eine Leiste (`#controls`) mit drei Griffen; auf Tablets steht zusätzlich die Tier-Auswahl dauerhaft offen (`#creature-rail`). Die Verdrahtung zieht aus dem Seitenskript in das geprüfte Modul `presentation/game/quickControls.ts`. Das Layout je Gerät ist reines CSS (drei Stufen: unter 640 px, ab 640 px, quer ab 900 px).

**Tech Stack:** Astro 5, TypeScript, Vitest + jsdom, CSS ohne Framework, Playwright (Python) für die Sonden.

**Spec:** `docs/plan.md`, Abschnitt „Nachtrag 12.10.2026 (Entwurf, noch nicht gebaut): die häufigen Griffe kommen auf die Spielseite". Vor dem Bau lesen, dazu `AGENTS.md` (Fallen) und `docs/language-guidelines.md`.

## Global Constraints

- Sprache: Code, Namen, Meldungen **englisch**; Kommentare, Doku, UI-Texte, Commit-Beschreibungen **deutsch**.
- Gate ist beides: `pnpm typecheck` **und** `pnpm test:run` (`pnpm gate`). Exit-Code nie über eine Pipe prüfen.
- Niemals `git add -A` — explizite Pfade. Vor jedem Commit `git status --short`.
- Gearbeitet wird auf dem Zweig `bedienleiste`, **nicht** auf `main` (ein Push auf `main` veröffentlicht). Kein Push ohne Auftrag.
- Jeder Griff: mindestens **48 px hoch** und **44 px breit**; die Griffe der Leiste **56 px hoch**.
- Auf den acht Größen 320×568, 360×640, 390×844, 412×915, 768×1024, 1024×768, 820×1180, 1180×820 scrollt die Spielseite nicht und kein Blatt außer `#rules-sheet`.
- Tippzahlen: Tier 2 (unter 640 px) bzw. 1 (ab 640 px), Zähne 1, Neue Runde 1.
- Tier und Zahnzahl starten die Runde sofort neu, ohne Nachfrage.
- Spielerzahl in der Bedienung: 1 oder 2. `MAX_PLAYERS = 4` im Kern bleibt unverändert.
- Kacheln tragen weder `.creature` noch `.tooth`; jede Verwendung von `creaturePortrait(id, suffix)` hat ihr eigenes `suffix` (`wahl`, `kachel`, `leiste`).
- Kein `display` auf einem `dialog` ohne `[open]`; kein `transform` auf einem modalen `dialog`.
- Interne Verweise nur über `import.meta.env.BASE_URL`.
- Keine `.test.ts` in `src/pages/`.
- Die Sonden laufen hier mit `python scripts/<name>.py` (Playwright ist im System-Python installiert, `uv` fehlt auf diesem Rechner). Der Server muss laufen: `pnpm dev` im Hintergrund, Adresse `http://localhost:4321`.
- Maße in diesem Plan sind **gerechnet**. Gültig ist, was die Sonde misst; weicht sie ab, wird das CSS angepasst, nicht die Sonde.

## Abweichungen vom Entwurf (beim Planen gefunden, klein)

- „Runde N" verschwindet nicht ganz, sondern rückt klein in die Kopfzeile (`#hud-round`). Grund: `syncLog()` hat sonst keine sichtbare Wirkung mehr. „schon N getippt" (`#hud-presses`) entfällt wie entworfen.
- Die Anleitung („Tippe einen Zahn an …") steht nur **vor dem ersten Druck** und nicht neben der Letzter-Zahn-Warnung. Grund: sonst reicht bei 320×568 die Höhe nicht für Hinweis und Warnung.
- Tablet hochkant zeigt die Köpfe in **einer Zehnerreihe**, erst ab 1100 px Höhe als 5×2. Grund: bei 768×1024 passen zwei Reihen großer Kacheln nicht ohne Scrollen.
- Im Zahnrad stehen „Regeln", „Statistik" und „Fertig" in **einer** Reihe, und die Spielerknöpfe heißen „Allein" und „Zu zweit".

## Review Focus

1. **Handy quer (844×390):** die Seite darf scrollen, aber die feste Leiste darf nichts dauerhaft verdecken — nach dem Scrollen ans Ende liegt der letzte Inhalt über der Leiste. → Sonde, Aufgabe 6.
2. **Ein-Zahn-Spiel:** die Letzter-Zahn-Warnung steht schon beim Laden; die Seite scrollt trotzdem nicht. → Sonde, Aufgabe 6.
3. **Gespeicherte Spielerzahl 3 oder 4:** lädt als 2, ohne Fehler. → Test, Aufgabe 1.
4. **Zahnzahl ändern in der Pause vor dem Urteil:** das Urteil des alten Drucks trifft die neue Runde nicht. → Test, Aufgabe 3.
5. **Browser ohne Vibration (Safari iOS):** der Hinweis macht das Zahnrad-Blatt höher; es scrollt bei 320×568 trotzdem nicht. → Sonde, Aufgabe 6.

---

### Task 1: Spielerzahl höchstens zwei

**Files:**
- Modify: `src/core/domain/teeth.ts` (nach `MAX_PLAYERS`)
- Modify: `src/infrastructure/storage/localStorageSettings.ts` (Import, Zeile mit `Math.min(4, …)`)
- Test: `src/infrastructure/storage/localStorageSettings.test.ts`

**Interfaces:**
- Produces: `export const MAX_SELECTABLE_PLAYERS = 2` in `core/domain/teeth.ts`.

- [ ] **Step 1: Zweig anlegen**

```bash
git checkout -b bedienleiste
```

- [ ] **Step 2: Fehlschlagenden Test schreiben**

In `src/infrastructure/storage/localStorageSettings.test.ts` im `describe('Einstellungen', …)` ergänzen:

```ts
  it('begrenzt eine gespeicherte Spielerzahl von 3 oder 4 auf 2 — die Bedienung bietet nur noch 1 und 2', () => {
    for (const players of [3, 4]) {
      const storage = new MemoryStorage();
      storage.setItem(SETTINGS_KEY, JSON.stringify({ ...DEFAULT_SETTINGS, players }));
      expect(loadSettings(storage).players).toBe(2);
    }
  });
```

Im bestehenden Test um Zeile 76/77 (Übernahme aus dem früheren Schlüssel, `players: 3`) die Erwartung von `toBe(3)` auf `toBe(2)` ändern.

- [ ] **Step 3: Lauf — muss rot sein**

Run: `pnpm vitest run src/infrastructure/storage/localStorageSettings.test.ts`
Expected: FAIL, „expected 3 to be 2".

- [ ] **Step 4: Umsetzen**

`src/core/domain/teeth.ts`, direkt unter `export const MAX_PLAYERS = 4;`:

```ts
/**
 * Höchste Spielerzahl, die die Bedienung anbietet (Entscheidung vom 12.10.2026). `MAX_PLAYERS`
 * bleibt die Grenze für protokollierte und importierte Runden — die gab es mit 3 und 4 Spielern.
 */
export const MAX_SELECTABLE_PLAYERS = 2;
```

`src/infrastructure/storage/localStorageSettings.ts`: `MAX_SELECTABLE_PLAYERS` in den Import aus `../../core/domain/teeth` aufnehmen und

```ts
      players: Math.min(4, Math.max(1, players)),
```

ersetzen durch

```ts
      players: Math.min(MAX_SELECTABLE_PLAYERS, Math.max(1, players)),
```

- [ ] **Step 5: Lauf — muss grün sein**

Run: `pnpm vitest run src/infrastructure/storage/localStorageSettings.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/core/domain/teeth.ts src/infrastructure/storage/localStorageSettings.ts src/infrastructure/storage/localStorageSettings.test.ts
git commit -m "Einstellungen: die Bedienung kennt nur noch ein oder zwei Spieler"
```

---

### Task 2: Modul `quickControls` — Rechnung und Verdrahtung der Leiste

**Files:**
- Create: `src/presentation/game/quickControls.ts`
- Test: `src/presentation/game/quickControls.test.ts`

**Interfaces:**
- Consumes: `settingsAfterCreatureChoice(current, chosen)` aus `./creatureChoice`; `getCreature(id)` aus `core/domain/creature` (Felder `name`, `teeth`, `liveTeethMin`, `liveTeethMax`, `note`, `realTeeth`); `MIN_TEETH`, `MAX_TEETH`.
- Produces:
  - `effectiveTeeth(settings: GameSettings): number`
  - `settingsAfterTeethStep(current: GameSettings, delta: number): GameSettings | null`
  - `interface QuickControlDeps { doc: Document; settings: GameSettings; apply: (next: GameSettings) => void; portrait: (creatureId: string, suffix: string) => string; onCreatureChosen: () => void }`
  - `wireQuickControls(deps: QuickControlDeps): { paint: () => void }`
  - Erwartete Kennungen im Dokument: `teeth-minus`, `teeth-plus`, `teeth-value`, `teeth-label`, `creature-open`, `creature-icon`, `creature-name`, `creature-detail-line`, `creature-detail-note`, `creature-detail-real`, dazu beliebig viele `button[data-creature]`.

`settings` ist dieselbe Objektreferenz, die die Steuerung hält; `GameController.applySettings` schreibt mit `Object.assign` hinein, deshalb liest `paint()` immer den aktuellen Stand.

- [ ] **Step 1: Fehlschlagende Tests schreiben**

`src/presentation/game/quickControls.test.ts`:

```ts
// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { effectiveTeeth, settingsAfterTeethStep, wireQuickControls } from './quickControls';
import { MAX_TEETH, MIN_TEETH } from '../../core/domain/teeth';
import type { GameSettings } from '../../infrastructure/storage/localStorageSettings';

function settings(overrides: Partial<GameSettings> = {}): GameSettings {
  return { mode: 'original', players: 1, sound: true, vibration: false, creature: 'crocodile', teethOverride: null, ...overrides };
}

const DOM = `
  <ul id="creature-rail">
    <li><button type="button" data-creature="crocodile"></button></li>
    <li><button type="button" data-creature="mouse"></button></li>
  </ul>
  <button type="button" id="creature-open"><span id="creature-icon"></span><span id="creature-name"></span></button>
  <button type="button" id="teeth-minus">−</button>
  <output id="teeth-value"></output><span id="teeth-label"></span>
  <button type="button" id="teeth-plus">+</button>
  <ul id="creature-list"><li><button type="button" data-creature="mouse"></button></li></ul>
  <p id="creature-detail-line"></p><p id="creature-detail-note"></p><p id="creature-detail-real"></p>
  <svg class="creature" data-creature="crocodile"></svg>
`;

function wire(start: GameSettings): { current: GameSettings; applied: GameSettings[]; chosen: number } {
  document.body.innerHTML = DOM;
  const state = { current: start, applied: [] as GameSettings[], chosen: 0 };
  wireQuickControls({
    doc: document,
    settings: start,
    // Wie die Steuerung: dieselbe Referenz wird fortgeschrieben.
    apply: (next) => {
      Object.assign(start, next);
      state.applied.push({ ...next });
    },
    portrait: (id, suffix) => `<svg data-portrait="${id}-${suffix}"></svg>`,
    onCreatureChosen: () => {
      state.chosen += 1;
    },
  });
  return state;
}

const byId = (id: string): HTMLElement => document.getElementById(id) as HTMLElement;

describe('Zahnzahl der Leiste', () => {
  it('nimmt ohne eigene Zahl das Gebiss des Tiers', () => {
    expect(effectiveTeeth(settings())).toBe(10);
    expect(effectiveTeeth(settings({ creature: 'mouse' }))).toBe(6);
    expect(effectiveTeeth(settings({ teethOverride: 4 }))).toBe(4);
  });

  it('zählt einen Schritt weiter und merkt sich die Abweichung', () => {
    expect(settingsAfterTeethStep(settings(), -1)?.teethOverride).toBe(9);
    expect(settingsAfterTeethStep(settings(), 1)?.teethOverride).toBe(11);
  });

  it('vergisst die Abweichung, wenn der Schritt beim Gebiss des Tiers landet', () => {
    expect(settingsAfterTeethStep(settings({ teethOverride: 9 }), 1)?.teethOverride).toBeNull();
  });

  it('ändert an den Grenzen nichts — dann startet auch keine neue Runde', () => {
    expect(settingsAfterTeethStep(settings({ teethOverride: MIN_TEETH }), -1)).toBeNull();
    expect(settingsAfterTeethStep(settings({ teethOverride: MAX_TEETH }), 1)).toBeNull();
  });
});

describe('Verdrahtung der Leiste', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('zeigt beim Start Zahl, Wort, Tier und Kopfbild', () => {
    wire(settings());
    expect(byId('teeth-value').textContent).toBe('10');
    expect(byId('teeth-label').textContent).toBe('Zähne');
    expect(byId('creature-name').textContent).toBe('Krokodil');
    expect(byId('creature-icon').innerHTML).toContain('crocodile-wahl');
    expect(byId('creature-open').getAttribute('aria-label')).toBe('Tier wählen, gerade: Krokodil');
  });

  it('ein Tipp auf Minus übernimmt eine Zahnzahl weniger', () => {
    const state = wire(settings());
    byId('teeth-minus').click();
    expect(state.applied).toHaveLength(1);
    expect(state.applied[0]?.teethOverride).toBe(9);
    expect(byId('teeth-value').textContent).toBe('9');
  });

  it('blendet an der Grenze den Knopf ab und schreibt „Zahn" in der Einzahl', () => {
    const state = wire(settings({ teethOverride: 2 }));
    byId('teeth-minus').click();
    expect(byId('teeth-value').textContent).toBe('1');
    expect(byId('teeth-label').textContent).toBe('Zahn');
    expect((byId('teeth-minus') as HTMLButtonElement).disabled).toBe(true);
    expect((byId('teeth-plus') as HTMLButtonElement).disabled).toBe(false);
    byId('teeth-minus').click();
    expect(state.applied).toHaveLength(1);
  });

  it('ein Tipp auf eine Kachel wählt das Tier mit dessen Gebiss — in der Reihe wie im Blatt', () => {
    const state = wire(settings({ teethOverride: 4 }));
    (document.querySelector('#creature-list [data-creature="mouse"]') as HTMLButtonElement).click();
    expect(state.applied[0]).toMatchObject({ creature: 'mouse', teethOverride: null });
    expect(state.chosen).toBe(1);
    expect(byId('teeth-value').textContent).toBe('6');
    expect(byId('creature-name').textContent).toBe('Maus');
    const pressed = Array.from(document.querySelectorAll('button[data-creature]')).map(
      (button) => `${button.getAttribute('data-creature')}:${button.getAttribute('aria-pressed')}`,
    );
    expect(pressed).toEqual(['crocodile:false', 'mouse:true', 'mouse:true']);
  });

  it('dasselbe Tier erneut zu tippen ändert nichts, schließt aber die Auswahl', () => {
    const state = wire(settings({ teethOverride: 5 }));
    (document.querySelector('#creature-rail [data-creature="crocodile"]') as HTMLButtonElement).click();
    expect(state.applied).toEqual([]);
    expect(state.chosen).toBe(1);
    expect(byId('teeth-value').textContent).toBe('5');
  });

  it('lässt die Bühne in Ruhe — auch sie trägt data-creature', () => {
    wire(settings());
    expect(document.querySelector('svg.creature')?.hasAttribute('aria-pressed')).toBe(false);
  });

  it('füllt die Kurzinfo des gewählten Tiers', () => {
    wire(settings({ creature: 'mouse' }));
    expect(byId('creature-detail-line').textContent).toContain('6 Zähne');
    expect(byId('creature-detail-note').textContent).not.toBe('');
    expect(byId('creature-detail-real').textContent).toContain('Echtes Gebiss');
  });
});
```

- [ ] **Step 2: Lauf — muss rot sein**

Run: `pnpm vitest run src/presentation/game/quickControls.test.ts`
Expected: FAIL, Modul `./quickControls` nicht gefunden.

- [ ] **Step 3: Modul schreiben**

`src/presentation/game/quickControls.ts`:

```ts
import { getCreature } from '../../core/domain/creature';
import { MAX_TEETH, MIN_TEETH } from '../../core/domain/teeth';
import type { GameSettings } from '../../infrastructure/storage/localStorageSettings';
import { settingsAfterCreatureChoice } from './creatureChoice';

/**
 * Die Leiste der Spielseite: Tier, Zahnzahl und (über die Steuerung) „Neue Runde".
 *
 * Bis zum 12.10.2026 lagen diese Griffe hinter dem Zahnrad — gemessen: 4 Tipps für ein anderes
 * Tier, 3 für eine andere Zahnzahl, und das Blatt scrollte auf jedem Handy. Die Verdrahtung stand
 * als Seitenskript in `pages/index.astro`; dort lädt jsdom sie nicht, also prüfte sie kein Test.
 */

/** Zahnzahl, die gerade gilt: eigener Wert oder das Gebiss des Tiers. */
export function effectiveTeeth(settings: GameSettings): number {
  return settings.teethOverride ?? getCreature(settings.creature).teeth;
}

/**
 * Was ein Tipp auf „−" oder „+" an den Einstellungen ändert. An den Grenzen ändert er nichts
 * (`null`) — sonst startete ein Tipp auf den abgeblendeten Rand die laufende Runde neu.
 */
export function settingsAfterTeethStep(current: GameSettings, delta: number): GameSettings | null {
  const now = effectiveTeeth(current);
  const next = Math.max(MIN_TEETH, Math.min(MAX_TEETH, now + delta));
  if (next === now) {
    return null;
  }
  const standard = getCreature(current.creature).teeth;
  return { ...current, teethOverride: next === standard ? null : next };
}

export interface QuickControlDeps {
  doc: Document;
  /** Dieselbe Referenz, die die Steuerung fortschreibt — `paint()` liest immer den Stand von jetzt. */
  settings: GameSettings;
  apply: (next: GameSettings) => void;
  portrait: (creatureId: string, suffix: string) => string;
  /** Nach jedem Tipp auf eine Kachel — die Seite schließt damit das Auswahlblatt. */
  onCreatureChosen: () => void;
}

export function wireQuickControls(deps: QuickControlDeps): { paint: () => void } {
  const { doc, settings } = deps;
  const byId = (id: string): HTMLElement | null => doc.getElementById(id);
  // `button[…]`, nicht `[data-creature]` allein: auch die Zeichnung auf der Bühne trägt das Attribut.
  const tiles = (): HTMLButtonElement[] =>
    Array.from(doc.querySelectorAll<HTMLButtonElement>('button[data-creature]'));

  const paint = (): void => {
    const creature = getCreature(settings.creature);
    const teeth = effectiveTeeth(settings);
    const value = byId('teeth-value');
    if (value) value.textContent = String(teeth);
    const label = byId('teeth-label');
    if (label) label.textContent = teeth === 1 ? 'Zahn' : 'Zähne';
    const minus = byId('teeth-minus') as HTMLButtonElement | null;
    const plus = byId('teeth-plus') as HTMLButtonElement | null;
    if (minus) minus.disabled = teeth <= MIN_TEETH;
    if (plus) plus.disabled = teeth >= MAX_TEETH;

    const name = byId('creature-name');
    if (name) name.textContent = creature.name;
    const icon = byId('creature-icon');
    if (icon) icon.innerHTML = deps.portrait(creature.id, 'wahl');
    byId('creature-open')?.setAttribute('aria-label', `Tier wählen, gerade: ${creature.name}`);
    for (const tile of tiles()) {
      tile.setAttribute('aria-pressed', String(tile.dataset.creature === settings.creature));
    }

    const line = byId('creature-detail-line');
    if (line) {
      const live =
        creature.liveTeethMin === creature.liveTeethMax
          ? `${creature.liveTeethMin}`
          : `${creature.liveTeethMin}–${creature.liveTeethMax}`;
      line.textContent = `${creature.name}: ${creature.teeth} Zähne — bei jedem Tipp sind ${live} davon gefährlich.`;
    }
    const note = byId('creature-detail-note');
    if (note) note.textContent = creature.note;
    const real = byId('creature-detail-real');
    if (real) real.textContent = `Echtes Gebiss: ${creature.realTeeth} Zähne.`;
  };

  const step = (delta: number): void => {
    const next = settingsAfterTeethStep(settings, delta);
    if (next) {
      deps.apply(next);
    }
    paint();
  };
  byId('teeth-minus')?.addEventListener('click', () => step(-1));
  byId('teeth-plus')?.addEventListener('click', () => step(1));

  for (const tile of tiles()) {
    tile.addEventListener('click', () => {
      const next = settingsAfterCreatureChoice(settings, tile.dataset.creature);
      if (next) {
        deps.apply(next);
      }
      paint();
      deps.onCreatureChosen();
    });
  }

  paint();
  return { paint };
}
```

- [ ] **Step 4: Lauf — muss grün sein**

Run: `pnpm vitest run src/presentation/game/quickControls.test.ts`
Expected: PASS (11 Tests). Schlägt „6 Zähne" oder „Maus" fehl, die echten Werte in `src/core/domain/creature.ts` nachlesen und den **Test** an den Katalog angleichen, nicht umgekehrt.

- [ ] **Step 5: Gate und Commit**

Run: `pnpm gate` — Expected: grün (der Schichten-Wächter kennt `presentation/game` schon).

```bash
git add src/presentation/game/quickControls.ts src/presentation/game/quickControls.test.ts
git commit -m "Bedienung: Leiste fuer Tier und Zahnzahl als geprueftes Modul"
```

---

### Task 3: Steuerung — „Neue Runde" immer da, Anleitung nur vor dem ersten Druck

**Files:**
- Modify: `src/presentation/game/gameController.ts` (`mount()` um Zeile 107, `render()` um Zeile 425–447)
- Test: `src/presentation/game/gameController.test.ts`

**Interfaces:**
- Produces (im Dokument): `#new-round` trägt die Klasse `is-next`, solange das Maul zu ist; `#how-to` trägt `hidden` nach dem ersten Druck, bei geschlossenem Maul und beim letzten Zahn. `#restart-round` und `#hud-presses` werden nicht mehr angefasst.

- [ ] **Step 1: Prüf-DOM und Tests anpassen (rot)**

In `src/presentation/game/gameController.test.ts`:

1. In der Konstante `DOM` `<span id="hud-presses"></span>` und die Zeile `<button id="restart-round" …>` entfernen; ergänzen: `<p id="how-to"></p>`.
2. Die drei Erwartungen auf `hud-presses` ersetzen:
   - um Zeile 208: `expect(document.getElementById('hud-progress')?.textContent).toBe('1 von 10 gedrückt');`
   - um Zeile 577: `expect(document.getElementById('hud-progress')?.textContent).toBe('1 von 10 gedrückt');`
3. Den Test „zeigt nach dem Biss einen Knopf ‚Neue Runde' auf der Bühne …" (um Zeile 311–326) ersetzen durch:

```ts
  it('hebt „Neue Runde" nach dem Biss hervor — der Knopf steht immer in der Leiste', () => {
    // Bis zum 12.10.2026 erschien dafür ein eigener Knopf auf der Bühne; jetzt ist „Neue Runde"
    // immer da und wird bei geschlossenem Maul nur betont.
    build([3]);
    const again = document.getElementById('new-round') as HTMLButtonElement;
    expect(again.classList.contains('is-next')).toBe(false);
    click(1);
    expect(again.classList.contains('is-next')).toBe(false);
    click(3);
    expect(again.classList.contains('is-next')).toBe(true);
    document.getElementById('result-sheet')?.removeAttribute('open');
    again.click();
    expect(again.classList.contains('is-next')).toBe(false);
    expect(document.getElementById('stage')?.dataset.status).toBe('open');
    expect(document.getElementById('hud-progress')?.textContent).toBe('0 von 10 gedrückt');
  });

  it('zeigt die Anleitung nur vor dem ersten Druck', () => {
    const { controller } = build([3]);
    const howTo = document.getElementById('how-to');
    expect(howTo?.classList.contains('hidden')).toBe(false);
    click(1);
    expect(howTo?.classList.contains('hidden')).toBe(true);
    controller.resetRound();
    expect(howTo?.classList.contains('hidden')).toBe(false);
  });

  it('lässt die Anleitung weg, wenn schon die Letzter-Zahn-Warnung steht', () => {
    build([1], { teethOverride: 1 });
    expect(document.getElementById('hud-warning')?.classList.contains('hidden')).toBe(false);
    expect(document.getElementById('how-to')?.classList.contains('hidden')).toBe(true);
  });

  it('eine neue Zahnzahl in der Pause vor dem Urteil lässt das alte Urteil ins Leere laufen', () => {
    const pending: Array<() => void> = [];
    const { controller, log } = build([1], {}, true, undefined, (_ms, run) => {
      pending.push(run);
    });
    click(1);
    controller.applySettings(settings({ teethOverride: 9 }));
    while (pending.length > 0) {
      pending.shift()?.();
    }
    expect(document.querySelectorAll('.tooth')).toHaveLength(9);
    expect(document.getElementById('stage')?.dataset.status).toBe('open');
    expect(log.records).toEqual([]);
  });
```

- [ ] **Step 2: Lauf — muss rot sein**

Run: `pnpm vitest run src/presentation/game/gameController.test.ts`
Expected: FAIL in „hebt ‚Neue Runde' nach dem Biss hervor" (`is-next` fehlt) und in den beiden Anleitungs-Tests.

- [ ] **Step 3: Steuerung ändern**

`src/presentation/game/gameController.ts`:

In `mount()` die Zeile

```ts
    this.doc.getElementById('restart-round')?.addEventListener('click', () => this.resetRound());
```

löschen.

In `render()` die Zeile `this.setText('hud-presses', String(pressIndex));` löschen und den Block

```ts
    // Bei geschlossenem Maul steht der Weg zur nächsten Runde auf der Bühne — auch dann, wenn das
    // Ergebnis-Blatt schon zu ist.
    this.doc.getElementById('restart-round')?.classList.toggle('hidden', roundOpen);
    const warn = this.doc.getElementById('hud-warning');
    if (warn) {
      const tension = isFinalToothTension(this.round);
      warn.classList.toggle('hidden', !tension);
      warn.textContent = tension ? 'Nur noch ein Zahn — der ist garantiert scharf!' : '';
    }
```

ersetzen durch

```ts
    // „Neue Runde" steht immer in der Leiste. Bei geschlossenem Maul ist er der nächste Schritt
    // und wird betont — auch dann, wenn das Ergebnis-Blatt schon zu ist.
    this.doc.getElementById('new-round')?.classList.toggle('is-next', !roundOpen);
    const finalTooth = isFinalToothTension(this.round);
    const warn = this.doc.getElementById('hud-warning');
    if (warn) {
      warn.classList.toggle('hidden', !finalTooth);
      warn.textContent = finalTooth ? 'Nur noch ein Zahn — der ist garantiert scharf!' : '';
    }
    // Die Anleitung gilt vor dem ersten Druck. Danach macht sie dem einmaligen Hinweis und der
    // Warnung Platz: auf 320 × 568 reicht die Höhe über der Leiste nicht für alle drei.
    this.doc
      .getElementById('how-to')
      ?.classList.toggle('hidden', pressIndex > 0 || !roundOpen || finalTooth);
```

- [ ] **Step 4: Lauf — muss grün sein**

Run: `pnpm vitest run src/presentation/game/gameController.test.ts`
Expected: PASS. Schlägt „eine neue Zahnzahl in der Pause …" fehl, greift der Rundenschutz in `handlePress` nicht für `applySettings` — dann **anhalten und melden**, das wäre ein eigener Fehler.

- [ ] **Step 5: Gate und Commit**

Run: `pnpm gate` — Expected: grün.

```bash
git add src/presentation/game/gameController.ts src/presentation/game/gameController.test.ts
git commit -m "Buehne: Neue Runde steht immer in der Leiste, die Anleitung nur vor dem ersten Druck"
```

---

### Task 4: Markup und Seitenskript der Spielseite

**Files:**
- Modify: `src/pages/index.astro` (ganzer `<main>`, Blätter `settings-sheet`, `creature-sheet`, `rules-sheet`, `<script>`)
- Modify: `src/auswahl.test.ts`
- Create: `src/bedienleiste.test.ts`

**Interfaces:**
- Consumes: `wireQuickControls` (Aufgabe 2), `#new-round`/`#how-to` (Aufgabe 3).
- Produces (Kennungen und Klassen, auf die Aufgabe 5 und 6 bauen): `.play`, `.side`, `#creature-rail.creature-grid.creature-rail`, `#controls.controls`, `.quick-pick#creature-open`, `.quick-teeth`, `.quick-new#new-round`, `.round-tag`, `.switches`, `#how-to`.

- [ ] **Step 1: Markup-Wächter schreiben (rot)**

`src/bedienleiste.test.ts`:

```ts
/**
 * Wächter der Spielseite: die drei häufigen Griffe (Tier, Zahnzahl, Neue Runde) stehen auf der
 * Seite und nicht mehr hinter dem Zahnrad (Entscheidung vom 12.10.2026). Das Verhalten prüft
 * `scripts/pruefen-bedienung.py` im echten Browser; jsdom lädt das Seitenskript nicht.
 * Liegt neben `src/pages/`, nicht darin — Astro baut dort jede Datei als Seite.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SEITE = readFileSync(new URL('./pages/index.astro', import.meta.url), 'utf8');
const SPIEL = SEITE.slice(SEITE.indexOf('<main'), SEITE.indexOf('</main>'));
const ZAHNRAD = SEITE.slice(SEITE.indexOf('id="settings-sheet"'), SEITE.indexOf('id="creature-sheet"'));
const REGELN = SEITE.slice(SEITE.indexOf('id="rules-sheet"'), SEITE.indexOf('id="result-sheet"'));

describe('Spielseite', () => {
  it('trägt Tier, Zahnzahl und Neue Runde selbst', () => {
    for (const id of ['creature-open', 'teeth-minus', 'teeth-plus', 'teeth-value', 'new-round']) {
      expect(SPIEL).toContain(`id="${id}"`);
    }
  });
  it('zeigt die Köpfe auf Tablets dauerhaft — mit eigener Beschnitt-Kennung', () => {
    expect(SPIEL).toContain('id="creature-rail"');
    expect(SPIEL).toContain("creaturePortrait(creature.id, 'leiste')");
  });
  it('kennt die abgeschafften Anzeigen nicht mehr', () => {
    expect(SEITE).not.toContain('restart-round');
    expect(SEITE).not.toContain('hud-presses');
    expect(SEITE).not.toContain('teeth-reset');
  });
});

describe('Zahnrad', () => {
  it('enthält die häufigen Griffe nicht mehr', () => {
    for (const id of ['creature-open', 'teeth-minus', 'teeth-plus', 'new-round']) {
      expect(ZAHNRAD).not.toContain(`id="${id}"`);
    }
  });
  it('bietet genau einen oder zwei Spieler an', () => {
    expect(ZAHNRAD).toContain('data-players="1"');
    expect(ZAHNRAD).toContain('data-players="2"');
    expect(ZAHNRAD).not.toContain('data-players="3"');
    expect(ZAHNRAD).not.toContain('data-players="4"');
  });
  it('hat einen Ausgang am Fuß', () => {
    expect(ZAHNRAD).toContain('data-close-sheet');
    expect(ZAHNRAD).toContain('Fertig');
  });
});

describe('Regeln', () => {
  it('tragen die Kurzinfo zum gewählten Tier', () => {
    for (const id of ['creature-detail-line', 'creature-detail-note', 'creature-detail-real']) {
      expect(REGELN).toContain(id);
    }
  });
  it('rechnen nicht mehr mit vier Spielern', () => {
    expect(REGELN).not.toContain('4 Spielern');
  });
});
```

In `src/auswahl.test.ts` den letzten Test („hat die drei Textstellen, die die Kurzinfo füllt") ersetzen durch:

```ts
  it('trägt keine Kurzinfo mehr — sie steht im Regeln-Blatt, damit alle Köpfe ohne Scrollen passen', () => {
    expect(AUSWAHL).not.toContain('creature-detail');
  });
```

und im Kopfkommentar der Datei „danach muss das Blatt zu und der Name im Einstellungsblatt neu sein" ändern in „danach muss das Blatt zu und das Tier auf der Bühne neu sein".

Run: `pnpm vitest run src/bedienleiste.test.ts src/auswahl.test.ts` — Expected: FAIL.

- [ ] **Step 2: `<main>` ersetzen**

In `src/pages/index.astro` alles von `<main class="app">` bis `</main>` ersetzen durch (der Zahnrad-Pfad `d="…"` bleibt wörtlich der bestehende):

```astro
  <main class="app">
    <header class="topbar">
      <div class="brand">
        <!-- Dasselbe Zeichen wie Tab und Startbildschirm (public/logo.svg, erzeugt in
             src/icon.test.ts aus der eigenen Zeichnung des Krokodils, Maul zu). -->
        <img
          class="brand__mark"
          src={`${import.meta.env.BASE_URL}logo.svg`}
          alt=""
          aria-hidden="true"
          width="34"
          height="34"
        />
        <span>Zahn Agent</span>
      </div>
      <span class="round-tag">Runde <strong id="hud-round">1</strong></span>
      <button type="button" class="icon-button" id="settings-open" aria-haspopup="dialog" aria-label="Einstellungen öffnen">
        <!-- bestehendes Zahnrad-SVG unverändert -->
      </button>
    </header>

    <!-- Das Spielfeld: Bühne und Spielstand. Auf dem Tablet quer ist das die linke Spalte. -->
    <div class="play">
      <section class="stage" id="stage" data-status="open" aria-label="Spielbühne">
        <div id="croc-mount"></div>
      </section>

      <!-- Eine große Aussage, daneben wer dran ist. -->
      <section class="hud" aria-label="Spielstand">
        <div class="stat stat--big">
          <span class="stat__value" id="hud-remaining">10</span>
          <span class="stat__label" id="hud-remaining-label">Zähne übrig</span>
        </div>
        <div class="turn">
          <span class="turn__dot" aria-hidden="true"></span>
          <span id="hud-turn">Du bist dran</span>
        </div>
      </section>

      <!-- Der Balken trägt zwei Aussagen: die Füllung ist der Fortschritt, die Farbe die Gefahr.
           Die Zustandsklassen (`is-tense`, `is-danger`, `is-snapped`) sitzen an DIESEM Kasten, denn
           er enthält Balken, Zeile und Hinweis (docs/e2e-nachweise.md §5t). -->
      <div class="tension-panel" id="hud-panel">
        <div class="tension-meter" role="img" aria-label="Fortschritt der Runde und Bissgefahr des nächsten Drucks">
          <div class="tension-meter__fill" id="hud-meter"></div>
        </div>
        <div class="meter-legend">
          <span id="hud-progress">0 von 10 gedrückt</span>
          <span id="hud-tension">Bissgefahr 0 %</span>
        </div>
        <p class="meter-hint hidden" id="hud-meter-hint">
          Je mehr Zähne getippt sind, desto sicherer schnappt es zu.
        </p>
      </div>

      <p class="alarm hidden" id="hud-warning" role="status"></p>

      <!-- Nur vor dem ersten Druck: danach macht die Anleitung Hinweis und Warnung Platz. -->
      <p class="how-to" id="how-to">Tippe einen Zahn an. Einer ist der falsche — dann schnappt es zu!</p>
      <p class="sr-only">Mit der Tastatur: mit der Tabulatortaste einen Zahn auswählen, dann die Eingabetaste drücken.</p>
    </div>

    <!--
      Die drei häufigen Griffe stehen auf der Spielseite (Entscheidung vom 12.10.2026; vorher
      hinter dem Zahnrad: 4 Tipps für ein anderes Tier, 3 für die Zahnzahl). Unter 640 px ist die
      Leiste am unteren Rand fest und die Köpfe öffnen sich als Blatt; ab 640 px stehen die Köpfe
      dauerhaft offen (`#creature-rail`) und der Tier-Griff entfällt.
      Die Kacheln tragen weder `.creature` noch `.tooth` — die Steuerung fragt diese Klassen ab.
    -->
    <aside class="side" aria-label="Spiel einstellen">
      <ul class="creature-grid creature-rail" id="creature-rail" role="group" aria-label="Lebewesen">
        {creatures.map((creature) => (
          <li>
            <button type="button" data-creature={creature.id} aria-pressed={creature.id === DEFAULT_CREATURE_ID}>
              <span class="creature-grid__icon" aria-hidden="true">
                <Fragment set:html={creaturePortrait(creature.id, 'leiste')} />
              </span>
              <span class="creature-grid__name">{creature.name}</span>
            </button>
          </li>
        ))}
      </ul>

      <div class="controls" id="controls">
        <button type="button" class="quick-pick" id="creature-open" aria-haspopup="dialog">
          <span class="quick-pick__icon" id="creature-icon" aria-hidden="true">
            {first && <Fragment set:html={creaturePortrait(first.id, 'wahl')} />}
          </span>
          <span class="quick__label">Tier</span>
          <span class="sr-only" id="creature-name">{first?.name}</span>
        </button>

        <div class="quick-teeth" role="group" aria-label="Zahl der Zähne">
          <button type="button" id="teeth-minus" aria-label="Ein Zahn weniger">−</button>
          <span class="quick-teeth__value">
            <output id="teeth-value">{first?.teeth}</output>
            <span class="quick__label" id="teeth-label">Zähne</span>
          </span>
          <button type="button" id="teeth-plus" aria-label="Ein Zahn mehr">+</button>
        </div>

        <button type="button" class="quick-new" id="new-round">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M20 12a8 8 0 1 1-2.6-5.9"></path>
            <path d="M20 4v5h-5"></path>
          </svg>
          <span>Neue Runde</span>
        </button>
      </div>
    </aside>
  </main>
```

- [ ] **Step 3: Zahnrad-Blatt ersetzen**

Den ganzen `<dialog … id="settings-sheet">…</dialog>` ersetzen durch (das ✕-SVG im Kopf bleibt wörtlich das bestehende):

```astro
  <dialog class="sheet sheet--columns" id="settings-sheet" aria-labelledby="settings-title">
    <!-- Der Kopf bleibt stehen: das ✕ ist der Ausgang, der immer erreichbar ist. -->
    <div class="sheet__head">
      <div class="sheet__grip" aria-hidden="true"></div>
      <div class="sheet__headrow">
        <h2 id="settings-title">Einstellungen</h2>
        <button type="button" class="sheet__close" data-close-sheet aria-label="Einstellungen schließen">
          <!-- bestehendes ✕-SVG unverändert -->
        </button>
      </div>
    </div>

    <!-- Nur was je Sitzung gestellt wird. Tier, Zähne und „Neue Runde" stehen auf der Spielseite. -->
    <div class="set">
      <span class="set__label">Wie viele spielen?</span>
      <div class="segmented" id="opt-players" role="group" aria-label="Spielerzahl">
        <button type="button" data-players="1" aria-pressed="true">Allein</button>
        <button type="button" data-players="2" aria-pressed="false">Zu zweit</button>
      </div>
    </div>

    <div class="set">
      <span class="set__label">Wie gefährlich?</span>
      <div class="segmented" id="opt-mode" role="group" aria-label="Zufallsmodell">
        <button type="button" data-mode="original" aria-pressed="true">wie das Spielzeug</button>
        <button type="button" data-mode="classic" aria-pressed="false">nur ein Zahn</button>
      </div>
    </div>

    <div class="switches">
      <label class="switch"><input type="checkbox" id="opt-sound" checked /> Ton</label>
      <label class="switch"><input type="checkbox" id="opt-vibration" checked /> Wackeln</label>
    </div>
    <p class="muted small" id="vibration-hint" hidden></p>

    <div class="row sheet__actions">
      <button type="button" class="button--ghost" id="rules-open">Regeln</button>
      <a class="button button--ghost" href={`${base}statistik`}>Statistik</a>
      <!-- Der Weg zurück zum Spiel. Ohne ihn blieb nur die Escape-Taste — die hat kein Tablet. -->
      <button type="button" class="button--primary" data-close-sheet>Fertig</button>
    </div>
  </dialog>
```

- [ ] **Step 4: Auswahlblatt und Regeln-Blatt ändern**

Im `<dialog … id="creature-sheet">` den Block `<div class="creature-detail">…</div>` ersatzlos löschen. Kopf und Fuß des Blatts bleiben.

Im `<dialog … id="rules-sheet">`:

1. Direkt vor `<details>` einfügen:

```astro
    <div class="creature-detail">
      <p id="creature-detail-line"></p>
      <p class="muted small" id="creature-detail-note"></p>
      <p class="muted small" id="creature-detail-real"></p>
    </div>
```

2. Im Absatz „Rechenwerte" den Satzteil

```
erwartete Drücke bis zum Biss = 3,97; bei 4 Spielern verliert der Startspieler zu 33,9 %,
        danach 28,3 % / 20,7 % / 17,0 %. Wer bis zum letzten Zahn überlebt, verliert garantiert.
```

ersetzen durch

```
erwartete Drücke bis zum Biss = 3,97. Wer bis zum letzten Zahn überlebt, verliert garantiert.
```

(Die Verlustchance bei zwei Spielern wird **nicht** aus dem Kopf eingesetzt. Wer sie nennen will, rechnet sie mit `core/domain/probabilities.ts` nach und belegt sie mit einem Test.)

- [ ] **Step 5: Seitenskript ersetzen**

Im `<script>` von `src/pages/index.astro`:

1. Importe: `settingsAfterCreatureChoice`, `getCreature` und `MAX_TEETH, MIN_TEETH` entfernen; ergänzen:

```ts
    import { wireQuickControls } from '../presentation/game/quickControls';
```

2. Den Kurztext des Vibrations-Hinweises kürzen:

```ts
        vibrationHint.textContent = 'Dieser Browser kann nicht wackeln (z. B. Safari auf dem iPhone).';
```

3. Alles von `const creatureName = document.getElementById('creature-name');` bis einschließlich des `forEach` über `#creature-list [data-creature]` (also `effectiveTeeth`, `paintCreature`, `paintDetail`, `setTeeth` und die Lauscher für `settings-open`, `teeth-minus`, `teeth-plus`, `teeth-reset`, `creature-open`, Kacheln) ersetzen durch:

```ts
    // Die Leiste der Spielseite (Tier, Zähne): Regeln und Test stehen in quickControls.ts.
    // Ein Tipp auf eine Kachel wählt und schließt das Auswahlblatt — auf dem Tablet ist es gar
    // nicht offen, `closeSheet` tut dann nichts.
    wireQuickControls({
      doc: document,
      settings,
      apply: (next: GameSettings) => controller.applySettings(next),
      portrait: creaturePortrait,
      onCreatureChosen: () => {
        const sheet = sheetOf('creature-sheet');
        if (sheet?.hasAttribute('open')) closeSheet(sheet);
      },
    });

    document.getElementById('settings-open')?.addEventListener('click', () => openSheet('settings-sheet'));
    document.getElementById('creature-open')?.addEventListener('click', () => openSheet('creature-sheet'));
```

Die Lauscher für `result-again`, `rules-open`, `[data-close-sheet]`, `wireOutsideTapDismissal` und die Ton-Freigabe bleiben unverändert.

- [ ] **Step 6: Läufe**

Run: `pnpm vitest run src/bedienleiste.test.ts src/auswahl.test.ts` — Expected: PASS.
Run: `pnpm gate` — Expected: grün (ein ungenutzter Import lässt `pnpm typecheck` nicht fallen; trotzdem die Importliste des Skripts von Hand durchgehen).
Run: `pnpm build` — Expected: Bau ohne Fehler. Danach `dist/index.html` öffnen und nachsehen: `href="/statistik"`, `id="controls"`, `id="creature-rail"` stehen drin.

- [ ] **Step 7: Commit**

```bash
git add src/pages/index.astro src/auswahl.test.ts src/bedienleiste.test.ts
git commit -m "Spielseite: Tier, Zaehne und Neue Runde stehen auf der Seite, das Zahnrad traegt nur noch Seltenes"
```

Die Seite ist nach dieser Aufgabe bedienbar, aber ungestaltet — das Layout kommt in Aufgabe 5.

---

### Task 5: Layout und Größen (CSS)

**Files:**
- Modify: `src/presentation/styles/app.css`

**Interfaces:**
- Consumes: die Klassen und Kennungen aus Aufgabe 4.

jsdom rechnet kein CSS; der Nachweis dieser Aufgabe ist die Sonde aus Aufgabe 6. Hier wird gebaut und im Browser angesehen.

- [ ] **Step 1: Entfallene Regeln löschen**

Aus `app.css` entfernen: `.picker`, `.picker__icon`, `.picker__text`, `.picker__name`, `.stepper`, `.stepper button`, `.stepper output`, `.button--small`, `.stat--quiet`, `.stat--quiet strong`, `.restart` (samt Kommentar darüber), das `@media (min-width: 480px) { .creature-grid { … } }` und in der Regel für die Blattspalten die Zeile `dialog.sheet.sheet--columns[open] > .sheet-link,`.
Vorher prüfen, dass nichts anderes sie braucht: `grep -rn "stepper\|picker\|button--small\|stat--quiet" src --include=*.astro --include=*.ts` darf außerhalb von `app.css` keine Treffer liefern. `.sheet-link` selbst bleibt, falls `statistik.astro` sie nutzt (`grep -n "sheet-link" src/pages/statistik.astro`); sonst ebenfalls löschen.

- [ ] **Step 2: Griffgrößen anheben**

Bestehende Regeln ändern:

- `button, .button`: `min-height: 44px;` → `min-height: 48px;`
- `.segmented button`: `min-height: 40px;` → `min-height: 48px;`
- `.switch`: ergänzen `min-height: 48px;`
- `.sheet__close`: `width: 44px; height: 44px;` → `width: 48px; height: 48px;` (Kommentar darüber: „48 px Trefferfläche")
- `.meter-legend`: `font-size: 0.8rem;` → `font-size: 0.95rem;`
- `.meter-hint`: `font-size: 0.8rem;` → `font-size: 0.9rem;`
- `dialog.sheet`: unter `max-height: 82vh;` die Zeile `max-height: 88dvh;` ergänzen (die erste bleibt als Rückfall für Browser ohne `dvh`).
- `.app`: `padding: 1rem 1rem 2.5rem;` → `padding: 1rem 1rem calc(5.25rem + env(safe-area-inset-bottom));`
- `.hud`: `flex-wrap: wrap;` → `flex-wrap: nowrap;`
- `.turn`: ergänzen `flex: 1; min-width: 0; line-height: 1.2;`
- `.creature-grid`: `grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px;` → `grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px;`; der Kommentar darüber wird: „Vier Spalten: alle zehn Köpfe stehen auf dem schmalsten Handy ohne Scrollen (gemessen, `scripts/pruefen-bedienung.py`)."
- `.creature-grid button`: `gap: 6px; padding: 8px 8px 10px; border-radius: 16px;` → `gap: 4px; min-height: 48px; padding: 6px 4px 8px; border-radius: 12px;`
- `.creature-grid__name`: ersetzen durch

```css
.creature-grid__name {
  min-height: 2.3em;
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1.15;
  text-align: center;
  /* „Säbelzahntiger" passt in keine 65-px-Kachel: trennen statt abschneiden. */
  hyphens: auto;
  overflow-wrap: anywhere;
}
```

- `.creature-detail` (jetzt im Regeln-Blatt): den Kommentar darüber ändern in „Die Kurzinfo zum gewählten Tier steht im Regeln-Blatt."

- [ ] **Step 3: Neue Regeln anfügen**

Am Ende von `app.css`:

```css
/* --- Spielseite: Spielfeld und Griffe ---
   Drei Stufen, Maß ist die Fläche und nicht die Geräteklasse:
   unter 640 px  Leiste fest am unteren Rand, die Köpfe öffnen sich als Blatt;
   ab 640 px     die Köpfe stehen dauerhaft offen, der Tier-Griff entfällt;
   quer ab 900   zwei Spalten — links das Spielfeld, rechts Köpfe, Zähne, Neue Runde.
   Alle Zahlen sind im Browser nachgemessen (scripts/pruefen-bedienung.py). */
.play {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.round-tag {
  margin-left: auto;
  font-size: 0.9rem;
  color: var(--ink-dim);
}

.round-tag strong {
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

/* Unter 640 px hat die Spalte keinen eigenen Kasten: die Leiste ist fest, die Reihe verborgen. */
.side {
  display: contents;
}

.creature-rail {
  display: none;
}

.controls {
  position: fixed;
  inset: auto 0 0 0;
  z-index: 5;
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr);
  align-items: stretch;
  gap: 8px;
  padding: 10px max(1rem, calc((100vw - 760px) / 2 + 1rem)) calc(10px + env(safe-area-inset-bottom));
  background: #0b151b;
  border-top: 1px solid var(--line);
}

/* Jeder Griff der Leiste trägt sein Wort („Tier", „Zähne") — ein Bild ohne Wort ist kein Knopf. */
.quick__label {
  font-size: 0.7rem;
  line-height: 1;
  color: var(--ink-dim);
}

.quick-pick {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  width: 60px;
  min-height: 56px;
  padding: 4px;
}

.quick-pick__icon {
  display: block;
  width: 48px;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.25);
}

.quick-teeth {
  display: flex;
  align-items: stretch;
  gap: 4px;
}

.quick-teeth button {
  width: 44px;
  min-height: 56px;
  padding: 0;
  font-size: 1.6rem;
  line-height: 1;
}

.quick-teeth button:disabled {
  opacity: 0.35;
  cursor: default;
}

.quick-teeth__value {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  min-width: 34px;
}

.quick-teeth__value output {
  font-size: 1.35rem;
  font-weight: 800;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.quick-new {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 56px;
  padding: 0.3rem 0.5rem;
  font-weight: 700;
  line-height: 1.15;
}

.quick-new svg {
  flex: none;
  width: 20px;
  height: 20px;
}

/* Maul zu: „Neue Runde" ist der nächste Schritt. */
.quick-new.is-next {
  background: linear-gradient(180deg, var(--jw-green-light), var(--jw-green-dark));
  border-color: rgba(255, 255, 255, 0.2);
}

/* Auf dem schmalsten Handy bleiben dem Knopf rund 82 px: das Zeichen weicht dem Wort. */
@media (max-width: 359px) {
  .quick-new svg {
    display: none;
  }
}

/* Das Zahnrad-Blatt: Ton und Wackeln nebeneinander, damit es auch bei 320 × 568 nicht scrollt. */
.switches {
  display: flex;
  gap: 1.2rem;
  margin-top: 0.8rem;
}

@media (min-width: 640px) {
  .app {
    max-width: 760px;
  }

  .side {
    display: block;
  }

  /* Die Köpfe stehen offen: eine Reihe aus zehn. */
  .creature-rail {
    display: grid;
    grid-template-columns: repeat(10, minmax(0, 1fr));
    margin: 0;
  }

  .quick-pick {
    display: none;
  }

  .controls {
    grid-template-columns: auto minmax(0, 1fr);
  }
}

/* Hohe Tablets hochkant haben Platz für große Köpfe in zwei Reihen. */
@media (min-width: 640px) and (min-height: 1100px) and (orientation: portrait) {
  .creature-rail {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }

  .creature-rail .creature-grid__name {
    min-height: 0;
    font-size: 0.9rem;
  }
}

/* Tablet quer: zwei Spalten. Die Breite des Spielfelds folgt der HÖHE des Fensters — die Zeichnung
   ist 640 : 460, also 1,39 mal so breit wie hoch; 17 rem sind Kopfzeile, Spielstand und Abstände. */
@media (min-width: 900px) and (min-height: 600px) and (orientation: landscape) {
  .app {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 20rem;
    grid-template-areas: "top top" "play side";
    column-gap: 1.5rem;
    row-gap: 1rem;
    align-items: start;
    max-width: 1180px;
    padding-bottom: 1rem;
  }

  .topbar {
    grid-area: top;
  }

  .play {
    grid-area: play;
    justify-self: center;
    width: 100%;
    max-width: calc((100dvh - 17rem) * 1.39);
  }

  .side {
    grid-area: side;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .creature-rail {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .controls {
    position: static;
    grid-template-columns: minmax(0, 1fr);
    padding: 0;
    background: none;
    border: 0;
  }

  .quick-teeth {
    justify-content: center;
  }

  .quick-teeth button {
    width: 64px;
  }
}
```

- [ ] **Step 4: Ansehen**

Run: `pnpm dev` (im Hintergrund), dann im Browser `http://localhost:4321` bei 390×844, 820×1180 und 1180×820 ansehen (Gerätesimulation). Erwartet: Leiste unten fest (Handy), Köpfe offen (Tablet), zwei Spalten (quer). Ein Tipp auf „−" ändert die Zähne auf der Bühne sofort.

- [ ] **Step 5: Gate und Commit**

Run: `pnpm gate` — Expected: grün.

```bash
git add src/presentation/styles/app.css
git commit -m "Spielseite: Leiste am unteren Rand, Koepfe auf dem Tablet offen, quer zwei Spalten; Griffe ab 48 px"
```

---

### Task 6: Sonde `pruefen-bedienung.py`, bestehende Sonden nachziehen, messen

**Files:**
- Create: `scripts/pruefen-bedienung.py`
- Modify: `scripts/pruefen-blaetter.py`, `scripts/pruefen-tiere.py`, `scripts/pruefen-trefferflaeche.py`
- Modify (nur wenn die Messung es verlangt): `src/presentation/styles/app.css`

- [ ] **Step 1: Die neue Sonde schreiben**

`scripts/pruefen-bedienung.py`:

```python
"""Beweis am lebenden Gegenstand: Sind Tier, Zahnzahl und „Neue Runde" ohne Blatt und ohne
Scrollen erreichbar — auf Handy und Tablet?

Gemessen wird im echten Browser auf acht Größen (320 × 568 bis 1180 × 820):
  - die Spielseite scrollt nicht und die feste Leiste verdeckt keinen Inhalt — beim Laden, nach
    einem Druck (einmaliger Hinweis sichtbar) und im Ein-Zahn-Spiel (Warnung sichtbar);
  - kein Griff ist kleiner als 48 px hoch oder 44 px breit, keiner liegt außerhalb des Bildes;
  - Tippzahlen: Zähne 1, Neue Runde 1, Tier 2 (unter 640 px, über das Blatt) bzw. 1 (ab 640 px);
  - weder das Auswahlblatt noch das Zahnrad-Blatt scrollt; das Zahnrad bietet zwei Spielerzahlen;
  - ohne Vibration (Safari iOS, nachgestellt) scrollt das Zahnrad-Blatt bei 320 × 568 trotzdem nicht;
  - Handy quer (844 × 390) darf scrollen, aber am Ende liegt der Inhalt über der Leiste.

Vorher (Stand aeffba8, gemessen am 12.10.2026): Tier 4 Tipps, Zähne 3, Neue Runde 3; das
Einstellungsblatt hatte 821 px Inhalt in 466–750 px, die Tier-Auswahl scrollte auf sieben von acht
Größen.

Aufruf (der Server muss laufen):

    uv run --with playwright python scripts/pruefen-bedienung.py
    uv run --with playwright python scripts/pruefen-bedienung.py https://zahn-agent.schaflabs.com
"""
import json
import sys

from playwright.sync_api import sync_playwright

BASIS = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4321"
BLICKE = [(320, 568), (360, 640), (390, 844), (412, 915), (768, 1024), (1024, 768), (820, 1180), (1180, 820)]
SCHMAL = 640  # darunter öffnen sich die Köpfe als Blatt
SCHLUESSEL = "zahn_agent:settings:v1"
# Der ungünstigste Fall für die Breite: der längste Tiername und der längste Zug-Satz.
ZWEI = {"creature": "sabertooth", "teethOverride": None, "sound": False, "vibration": False,
        "mode": "original", "players": 2}
EIN_ZAHN = {**ZWEI, "teethOverride": 1}
MIN_HOEHE = 48
MIN_BREITE = 44

SEITE = """
() => {
  const sichtbar = (e) => { const s = getComputedStyle(e); const r = e.getBoundingClientRect();
    return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0; };
  const griffe = Array.from(document.querySelectorAll('main button, main a')).filter(sichtbar).map((e) => {
    const r = e.getBoundingClientRect();
    return { n: e.id || e.getAttribute('data-creature') || e.textContent.trim().slice(0, 16),
             w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10,
             imBild: r.top >= 0 && r.bottom <= innerHeight + 0.5 && r.left >= 0 && r.right <= innerWidth + 0.5 };
  });
  const leiste = document.getElementById('controls');
  const inhalt = Array.from(document.querySelectorAll('.play > *, #creature-rail')).filter(sichtbar)
    .map((e) => e.getBoundingClientRect().bottom);
  return {
    seite: document.documentElement.scrollHeight, sicht: innerHeight,
    seiteBreit: document.documentElement.scrollWidth, breite: innerWidth,
    griffe, fest: getComputedStyle(leiste).position === 'fixed',
    leisteOben: leiste.getBoundingClientRect().top, inhaltUnten: Math.max(...inhalt),
    buehne: Math.round(document.getElementById('stage').getBoundingClientRect().width),
    status: document.getElementById('stage').dataset.status,
  };
}
"""

BLATT = """
(id) => {
  const b = document.getElementById(id); const r = b.getBoundingClientRect();
  const griffe = Array.from(b.querySelectorAll('button, a, summary, label.switch')).map((e) => {
    const k = e.getBoundingClientRect();
    return { n: e.id || e.getAttribute('data-creature') || e.getAttribute('aria-label') || e.textContent.trim().slice(0, 16),
             w: Math.round(k.width * 10) / 10, h: Math.round(k.height * 10) / 10,
             raus: k.right > r.right + 0.6 || k.left < r.left - 0.6 };
  });
  // Ein Name, der aus seiner Kachel ragt, ist abgeschnitten oder liegt über dem Nachbarn.
  const namen = Array.from(b.querySelectorAll('.creature-grid__name')).filter((n) => {
    const k = n.getBoundingClientRect(); const eltern = n.closest('button').getBoundingClientRect();
    return k.right > eltern.right + 0.6 || k.left < eltern.left - 0.6 || n.scrollWidth > n.clientWidth + 1;
  }).map((n) => n.textContent.trim());
  return { offen: b.open === true, inhalt: b.scrollHeight, sicht: b.clientHeight, griffe, namen };
}
"""


def frisch(browser, w, h, einstellungen, ohne_vibration=False):
    ctx = browser.new_context(viewport={"width": w, "height": h}, has_touch=True)
    ctx.add_init_script(
        "if (!localStorage.getItem('%s')) localStorage.setItem('%s', %s);"
        % (SCHLUESSEL, SCHLUESSEL, json.dumps(json.dumps(einstellungen)))
    )
    if ohne_vibration:
        ctx.add_init_script("delete Navigator.prototype.vibrate;")
    page = ctx.new_page()
    page.goto(BASIS, wait_until="load")
    page.wait_for_selector(".tooth")
    return ctx, page


def seite_pruefen(d, lage, darf_scrollen=False):
    f = []
    if not darf_scrollen and d["seite"] > d["sicht"] + 1:
        f.append(f"{lage}: die Seite scrollt ({d['seite']} px in {d['sicht']} px)")
    if d["seiteBreit"] > d["breite"] + 1:
        f.append(f"{lage}: die Seite ist breiter als das Fenster ({d['seiteBreit']} px)")
    if d["fest"] and d["inhaltUnten"] > d["leisteOben"] + 0.5:
        f.append(f"{lage}: die Leiste verdeckt Inhalt (Inhalt bis {d['inhaltUnten']:.0f}, Leiste ab {d['leisteOben']:.0f})")
    for g in d["griffe"]:
        if g["h"] < MIN_HOEHE or g["w"] < MIN_BREITE:
            f.append(f"{lage}: Griff {g['n']!r} ist {g['w']} × {g['h']} px")
        if not darf_scrollen and not g["imBild"]:
            f.append(f"{lage}: Griff {g['n']!r} liegt außerhalb des Bildes")
    return f


def blatt_pruefen(d, lage):
    f = []
    if not d["offen"]:
        f.append(f"{lage}: das Blatt ist nicht offen")
    if d["inhalt"] > d["sicht"] + 1:
        f.append(f"{lage}: das Blatt scrollt ({d['inhalt']} px in {d['sicht']} px)")
    for g in d["griffe"]:
        if g["h"] < MIN_HOEHE or g["w"] < MIN_BREITE:
            f.append(f"{lage}: Griff {g['n']!r} ist {g['w']} × {g['h']} px")
        if g["raus"]:
            f.append(f"{lage}: Griff {g['n']!r} ragt aus dem Blatt")
    if d["namen"]:
        f.append(f"{lage}: Namen ragen aus ihrer Kachel: {d['namen']}")
    return f


def tier_auf_der_buehne(page):
    return page.evaluate("() => document.querySelector('svg.creature').dataset.creature")


def main() -> int:
    funde = []
    print(f"Bedien-Sonde gegen {BASIS}\n")
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for w, h in BLICKE:
            lage = f"{w} × {h}"
            ctx, page = frisch(browser, w, h, ZWEI)
            d = page.evaluate(SEITE)
            funde += seite_pruefen(d, f"{lage} beim Laden")

            # Zähne: ein Tipp.
            vorher = page.locator(".tooth").count()
            page.click("#teeth-minus")
            zaehne = page.locator(".tooth").count()
            if zaehne != vorher - 1:
                funde.append(f"{lage}: ein Tipp auf Minus ergibt {zaehne} statt {vorher - 1} Zähne")

            # Tier: zwei Tipps über das Blatt (schmal) oder einer in der offenen Reihe.
            if w < SCHMAL:
                page.click("#creature-open")
                page.wait_for_timeout(300)
                funde += blatt_pruefen(page.evaluate(BLATT, "creature-sheet"), f"{lage} Tier-Auswahl")
                page.click('#creature-list [data-creature="shark"]')
                page.wait_for_timeout(200)
                if page.evaluate("() => document.getElementById('creature-sheet').open"):
                    funde.append(f"{lage}: die Tier-Auswahl ist nach dem Tipp noch offen")
                tipps = 2
            else:
                if page.locator("#creature-open").is_visible():
                    funde.append(f"{lage}: der Tier-Griff steht neben der offenen Reihe")
                page.click('#creature-rail [data-creature="shark"]')
                tipps = 1
            if tier_auf_der_buehne(page) != "shark":
                funde.append(f"{lage}: nach {tipps} Tipp(s) steht {tier_auf_der_buehne(page)!r} auf der Bühne")

            # Ein Druck, der die Runde offen lässt (würfeln, bis es passt) — dann steht der Hinweis.
            for _ in range(12):
                page.click("#new-round")
                page.click("#stage .tooth")
                page.wait_for_timeout(1200)
                if page.evaluate("() => document.getElementById('stage').dataset.status") == "open":
                    break
                if page.evaluate("() => document.getElementById('result-sheet').open"):
                    page.click("#result-again")
            nach = page.evaluate(SEITE)
            if nach["status"] == "open":
                funde += seite_pruefen(nach, f"{lage} nach einem Druck")
            else:
                funde.append(f"{lage}: in zwölf Versuchen blieb keine Runde nach einem Druck offen")

            # Neue Runde: ein Tipp.
            page.click("#new-round")
            fortschritt = page.inner_text("#hud-progress")
            if not fortschritt.startswith("0 von"):
                funde.append(f"{lage}: nach 'Neue Runde' steht {fortschritt!r}")

            # Zahnrad: scrollt nicht, zwei Spielerzahlen, keine häufigen Griffe.
            page.click("#settings-open")
            page.wait_for_timeout(300)
            blatt = page.evaluate(BLATT, "settings-sheet")
            funde += blatt_pruefen(blatt, f"{lage} Zahnrad")
            spieler = page.locator("#opt-players [data-players]").count()
            if spieler != 2:
                funde.append(f"{lage}: das Zahnrad bietet {spieler} Spielerzahlen")
            print(f"{lage:>11s} | Bühne {d['buehne']:4d} px | Seite {d['seite']:4d} in {d['sicht']:4d} | "
                  f"Inhalt bis {d['inhaltUnten']:6.1f}, Leiste ab {d['leisteOben']:6.1f} ({'fest' if d['fest'] else 'im Fluss'}) | "
                  f"Tier {tipps} Tipp(s) | Zahnrad {blatt['inhalt']} in {blatt['sicht']} px")
            ctx.close()

            # Ein-Zahn-Spiel: die Warnung steht schon beim Laden.
            ctx, page = frisch(browser, w, h, EIN_ZAHN)
            ein = page.evaluate(SEITE)
            if not page.locator("#hud-warning").is_visible():
                funde.append(f"{lage}: im Ein-Zahn-Spiel fehlt die Warnung")
            funde += seite_pruefen(ein, f"{lage} Ein-Zahn-Spiel")
            # Nach dem Biss: ein Tipp zur nächsten Runde.
            page.click("#stage .tooth")
            page.wait_for_selector("#result-sheet[open]")
            page.click("#result-again")
            if page.evaluate("() => document.getElementById('stage').dataset.status") != "open":
                funde.append(f"{lage}: 'Noch eine Runde' startet keine Runde")
            ctx.close()

        # Ohne Vibration (Safari iOS): der Hinweis steht da, das Blatt scrollt trotzdem nicht.
        ctx, page = frisch(browser, 320, 568, ZWEI, ohne_vibration=True)
        page.click("#settings-open")
        page.wait_for_timeout(300)
        if not page.locator("#vibration-hint").is_visible():
            funde.append("ohne Vibration: der Hinweis fehlt (oder die Sonde stellt Safari nicht nach)")
        ohne = page.evaluate(BLATT, "settings-sheet")
        funde += blatt_pruefen(ohne, "320 × 568 Zahnrad ohne Vibration")
        print(f"Ohne Vibration, 320 × 568: Zahnrad {ohne['inhalt']} in {ohne['sicht']} px")
        ctx.close()

        # Handy quer: Scrollen ist erlaubt, Verdecken nicht.
        ctx, page = frisch(browser, 844, 390, ZWEI)
        page.evaluate("() => window.scrollTo(0, document.documentElement.scrollHeight)")
        quer = page.evaluate(SEITE)
        funde += seite_pruefen(quer, "844 × 390 (quer, ans Ende gescrollt)", darf_scrollen=True)
        print(f"Handy quer, 844 × 390: Seite {quer['seite']} in {quer['sicht']} px, "
              f"Inhalt bis {quer['inhaltUnten']:.1f}, Leiste ab {quer['leisteOben']:.1f}")
        ctx.close()
        browser.close()

    print()
    for fund in funde:
        print("FUND:", fund)
    print(f"Auffälligkeiten: {len(funde)}")
    return 1 if funde else 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 2: Messen und nachstellen**

Run (Server läuft): `PYTHONIOENCODING=utf-8 python scripts/pruefen-bedienung.py`
Expected am Ende: `Auffälligkeiten: 0`. Die **Ausgabe lesen**, nicht nur den Exit-Code.

Bei Funden wird das CSS aus Aufgabe 5 nachgestellt — in dieser Reihenfolge der wahrscheinlichsten Fälle:

| Fund | Stellschraube |
|---|---|
| Seite scrollt / Leiste verdeckt Inhalt bei 320×568 | `.app { padding-bottom }` muss Leistenhöhe + 8 px sein; sonst `.how-to { font-size: 0.9rem }` |
| Seite scrollt bei 768×1024 oder 820×1180 | `.app { max-width }` unter `@media (min-width: 640px)` in 20-px-Schritten senken |
| Seite scrollt quer (1024×768, 1180×820) | die `17rem` in `.play { max-width }` in 1-rem-Schritten erhöhen; rechte Spalte: `.creature-rail` Kachel-Innenabstand senken |
| Name ragt aus der Kachel | `.creature-grid__name { font-size }` auf `0.68rem`; nie den Namen abschneiden |
| Tier-Auswahl scrollt bei 320×568 | `.creature-grid button { padding }` senken; zuletzt den Fuß „Fertig" des Auswahlblatts weglassen (✕ gibt es dort nicht — dann vorher einen Blattkopf mit ✕ wie im Zahnrad einbauen) |
| Zahnrad scrollt bei 320×568 | `.set { margin-top }` von 1.1rem auf 0.8rem |
| „Neue Runde" unter 44 px breit bei 320 | `.quick-teeth button { width }` bleibt 44; `.quick-pick { width: 56px }` |
| „ohne Vibration: der Hinweis fehlt" | in `src/infrastructure/haptics/browserHaptics.ts` nachlesen, wie `isSupported()` prüft, und das Init-Skript der Sonde daran angleichen |

Nach jeder Änderung die Sonde erneut fahren. Wer einen Wert ändert, trägt die **gemessene** Zahl in den Kommentar daneben ein.

- [ ] **Step 3: `pruefen-blaetter.py` nachziehen**

1. Abschnitt „1. Tastatur im Einstellungsblatt": die beiden Zeilen mit `#teeth-minus` ersetzen durch

```python
                ("Enter auf Modus", '#opt-mode [data-mode="classic"]', "Enter"),
                ("Leertaste auf Modus", '#opt-mode [data-mode="classic"]', " "),
```

2. Abschnitt „2. Tier-Auswahl" vollständig ersetzen durch:

```python
        # 2. Tier-Auswahl: unter 640 px ein Blatt, das ein Tipp schliesst; ab 640 px die offene Reihe.
        for blick in BLICKE:
            context, page = frisch(browser, blick)
            schmal = blick["width"] < 640
            for tier in ("wolf", "crocodile", "sabertooth"):
                if schmal:
                    page.click("#creature-open")
                    page.click(f'#creature-list [data-creature="{tier}"]')
                else:
                    page.click(f'#creature-rail [data-creature="{tier}"]')
                noch_offen = offen(page, "creature-sheet")
                steht = page.evaluate("() => document.querySelector('svg.creature').dataset.creature")
                print(f"Auswahl {blick['width']} px, {tier}: Auswahl offen = {noch_offen}, Buehne = {steht}")
                if noch_offen:
                    funde.append(f"{blick['width']} px: Auswahlblatt nach Tipp auf {tier} noch offen")
                if steht != tier:
                    funde.append(f"{blick['width']} px: nach Tipp auf {tier} steht {steht} auf der Buehne")
            # Gegenprobe: ein Zeigertipp neben das Zahnrad-Blatt schliesst es weiterhin.
            page.click("#settings-open")
            page.mouse.click(blick["width"] / 2, 40)
            if offen(page, "settings-sheet"):
                funde.append(f"{blick['width']} px: Tipp neben das Einstellungsblatt schliesst es nicht mehr")
            print(f"Gegenprobe {blick['width']} px: Tipp daneben schliesst = "
                  f"{not offen(page, 'settings-sheet')}")
            context.close()
```

3. Abschnitt „3. Nach dem Biss": jede Stelle mit `restart-round` auf `new-round` umstellen und die Erwartungen ändern — der Knopf steht jetzt **immer** da:

```python
        context, page = frisch(browser, HANDY, ein_zahn)
        betont_vorher = page.evaluate("() => document.getElementById('new-round').classList.contains('is-next')")
        page.click('.tooth[data-tooth="1"]')
        page.wait_for_selector("#result-sheet[open]")
        page.mouse.click(195, 250)  # weiter auf die Buehne getippt
        ergebnis_steht = offen(page, "result-sheet")
        page.click("#result-sheet [data-close-sheet]")
        knopf = page.evaluate(
            """() => {
              const k = document.getElementById('new-round');
              const r = k.getBoundingClientRect();
              return { betont: k.classList.contains('is-next'), breite: r.width, hoehe: r.height,
                       imBild: r.top >= 0 && r.bottom <= innerHeight };
            }"""
        )
        page.click("#new-round")
        nachher = page.evaluate(
            """() => ({ status: document.getElementById('stage').dataset.status,
                        betont: document.getElementById('new-round').classList.contains('is-next') })"""
        )
        print("Nach dem Biss: Ergebnis bleibt nach Tipp auf die Buehne =", ergebnis_steht,
              "| betont vorher:", betont_vorher, "| nach Schliessen:", knopf, "| nach Neue Runde:", nachher)
        if betont_vorher:
            funde.append("'Neue Runde' ist schon bei offener Runde betont")
        if not ergebnis_steht:
            funde.append("Tipp auf die Buehne schliesst das Ergebnis-Blatt")
        if not knopf["betont"] or knopf["hoehe"] < 48 or not knopf["imBild"]:
            funde.append(f"'Neue Runde' nach dem Schliessen nicht erreichbar oder nicht betont: {knopf}")
        if nachher["status"] != "open" or nachher["betont"]:
            funde.append(f"'Neue Runde' startet keine Runde: {nachher}")
        context.close()
```

4. Abschnitt „4. Dasselbe Tier erneut tippen": die Zeile `page.click("#settings-open")` löschen (der Tier-Griff steht auf der Seite).

Run: `PYTHONIOENCODING=utf-8 python scripts/pruefen-blaetter.py` — Expected: `ERGEBNIS: in Ordnung`.

- [ ] **Step 4: `pruefen-tiere.py` nachziehen**

1. Im Kopfkommentar den Absatz „Neu am 12.10.2026 …" ergänzen um: „Seit dem Umbau der Spielseite (12.10.2026, Bedienleiste) öffnet sich das Auswahlblatt direkt von der Spielseite; die Kurzinfo steht im Regeln-Blatt."
2. In `EIN_TIPP`: die Zeilen `const einstellungen = …`, `einstellungenOffen: …` und `zaehne: text('creature-teeth'),` entfernen; ergänzen `buehne: document.querySelector('svg.creature').dataset.creature,`.
3. In `main()`: die Zeilen `page.click("#settings-open")` und das folgende `page.wait_for_timeout(500)` entfernen.
4. In der Auswertung den Block

```python
        if not stand["einstellungenOffen"]:
            funde.append(f"{name}: Einstellungsblatt wurde mitgeschlossen")
        if stand["name"] != stand["nameDerMarke"] or not stand["name"]:
            funde.append(f"{name}: Einstellungsblatt zeigt {stand['name']!r}, "
                         f"markierte Kachel {stand['nameDerMarke']!r}")
```

ersetzen durch

```python
        if stand["buehne"] != erwartete_kennung[name]:
            funde.append(f"{name}: auf der Buehne steht {stand['buehne']!r}")
        if stand["name"] != stand["nameDerMarke"] or not stand["name"]:
            funde.append(f"{name}: der Tier-Griff nennt {stand['name']!r}, "
                         f"markierte Kachel {stand['nameDerMarke']!r}")
```

Run: `PYTHONIOENCODING=utf-8 python scripts/pruefen-tiere.py` — Expected: `ERGEBNIS: in Ordnung`. (Die Sonde läuft bei 390 px, dort gibt es das Blatt.)

- [ ] **Step 5: `pruefen-trefferflaeche.py` nachziehen**

Den Block von `seite.click("#settings-open")` (erste Stelle) bis vor `bericht(f"{breite} px, 12 Zähne", …)` ersetzen durch (die Griffe stehen auf der Seite, „Standard" gibt es nicht mehr):

```python
        for _ in range(9):
            seite.click("#teeth-minus")
        bericht(f"{breite} px, 1 Zahn", seite.evaluate(MESSEN))

        for _ in range(9):
            seite.click("#teeth-plus")
        bericht(f"{breite} px, 10 Zähne (wieder hochgezählt)", seite.evaluate(MESSEN))

        # 12 Zähne: der Fall, in dem die Vorgabe auf 320 px nicht mehr geht
        for _ in range(2):
            seite.click("#teeth-plus")
        print("   Regler:", seite.inner_text("#teeth-value"))
```

In der Tippprobe `seite.inner_text("#hud-presses")` an beiden Stellen durch `seite.inner_text("#hud-progress")` ersetzen.

Run: `PYTHONIOENCODING=utf-8 python scripts/pruefen-trefferflaeche.py` — Expected: bei 320 px und 10 Zähnen weiterhin mindestens 44 px Trefferfläche (die Bühne bleibt 288 px breit), drei Zeilen „registriert", keine „TOT".

- [ ] **Step 6: Die übrigen Sonden fahren**

Run: `PYTHONIOENCODING=utf-8 python scripts/pruefen-blattbreite.py` — Expected: `Auffälligkeiten: 0`, in jeder Zeile `beim Laden   none`.
Run: `PYTHONIOENCODING=utf-8 python scripts/pruefen-anzeige.py` — Expected: wie vor dem Umbau (kein Fund).

Meldet `pruefen-blattbreite.py` „Tablet: 1 Spalte" (das Zahnrad hat nur noch drei Felder), ist das ein echter Fund im CSS und kein Anlass, die Sonde zu lockern.

- [ ] **Step 7: Gate und Commit**

Run: `pnpm gate` — Expected: grün.

```bash
git add scripts/pruefen-bedienung.py scripts/pruefen-blaetter.py scripts/pruefen-tiere.py scripts/pruefen-trefferflaeche.py src/presentation/styles/app.css
git commit -m "Sonden: Bedienleiste auf acht Groessen gemessen, bestehende Sonden auf die neue Spielseite umgestellt"
```

---

### Task 7: Doku, Nachweis, Abschluss

**Files:**
- Modify: `README.md`, `AGENTS.md`, `docs/testing.md`, `docs/e2e-nachweise.md`, `docs/plan.md`

- [ ] **Step 1: Zahlen holen**

Run: `pnpm gate` — die Zeile „Tests … passed" und „Test Files … passed" notieren (vorher: **293 Tests in 23 Dateien**; hinzugekommen sind zwei Dateien).

- [ ] **Step 2: README**

- Abschnitt „Die Startseite zeigt …" (um Zeile 66–76) neu fassen: die Startseite zeigt das Spiel **und** die Leiste mit Tier, Zähnen, Neuer Runde; das Zahnrad trägt Spielerzahl (allein / zu zweit), Gefährlichkeit, Ton, Wackeln, Regeln, Statistik; „Tier wählen": unter 640 px Tier-Griff → Kachel (2 Tipps), auf dem Tablet stehen die Köpfe offen (1 Tipp).
- „1–4 Spieler" (um Zeile 72 und 122) → „1–2 Spieler".
- Testzahl (um Zeile 32 und 108) auf den Wert aus Step 1.
- Die Tabellenzeile „4 Spieler reihum" (um Zeile 208) **bleibt**: sie beschreibt das Modell, nicht die Bedienung.

- [ ] **Step 3: AGENTS.md**

- In der Falle „Ein Auswahlblatt wählt mit dem Tipp und schließt sich …" den Klammersatz „(das Einstellungsblatt bleibt offen, die Kurzinfo beschreibt das gewählte Tier)" ersetzen durch „(seit dem 12.10.2026 öffnet es sich von der Spielseite; die Kurzinfo steht im Regeln-Blatt)".
- Eine neue Falle anhängen und die Zahl in der Überschrift „Neunundzwanzig Fallen" nachzählen und anpassen:

```markdown
- **Was oft gebraucht wird, gehört nicht hinter ein Blatt.** Tier, Zahnzahl und „Neue Runde" lagen
  hinter dem Zahnrad: gemessen am 12.10.2026 vier Tipps für ein anderes Tier, drei für die Zahnzahl,
  und das Blatt scrollte auf jedem Handy (821 px Inhalt in 466–750 px). Seitdem stehen sie in der
  Leiste der Spielseite; das Zahnrad trägt nur, was je **Sitzung** gestellt wird. Nachmessen:
  `uv run --with playwright python scripts/pruefen-bedienung.py` (erwartet: 0 Auffälligkeiten).
  Wer einen Griff ergänzt, fragt zuerst: je Runde oder je Sitzung?
```

- [ ] **Step 4: docs/testing.md und docs/e2e-nachweise.md**

- `docs/testing.md`: Testzahl nachziehen; die Sonde `scripts/pruefen-bedienung.py` in die Liste der Sonden aufnehmen (was sie misst, erwartete Schlusszeile); die Stelle um Zeile 122 („der Knopf `#restart-round` …") auf `#new-round` mit der Klasse `is-next` umschreiben.
- `docs/e2e-nachweise.md`: einen neuen Abschnitt mit der nächsten freien Nummer (nach §5u) anlegen: Anlass, die Tabelle „vorher" aus `docs/plan.md`, die **wörtliche Ausgabe** von `pruefen-bedienung.py` aus dem letzten Lauf, die geänderten Stellschrauben mit Messwert.

- [ ] **Step 5: docs/plan.md**

In der Überschrift des Nachtrags „(Entwurf, noch nicht gebaut)" durch „(gebaut)" ersetzen und am Ende des Nachtrags einen Absatz **„Gebaut."** anfügen: die vier Abweichungen vom Entwurf (aus diesem Plan), die gemessenen Endwerte je Größe, Testzahl, Verweis auf den neuen Paragrafen der Nachweisakte.

- [ ] **Step 6: Doku prüfen**

In `docs/workflow.md` den Abschnitt zur Doku-Prüfung lesen und die dort genannten Befehle fahren (`scripts/doku-pruefen.sh`, `scripts/doku-pfade-pruefen.py`) — **ohne** `>/dev/null`, Ausgabe lesen; scharf (`ALTE_WERTE_STRIKT=1`) nur über `README.md` und `docs/testing.md`.
Expected: keine Funde; alte Testzahlen (293) stehen nur noch dort, wo sie Geschichte sind.

- [ ] **Step 7: Schlusslauf**

Run: `pnpm gate` — Expected: grün.
Run: `pnpm build` — Expected: Bau ohne Fehler; in `dist/index.html` stehen `/statistik`, `/_astro/…`, `/favicon.svg`.
Run: `PYTHONIOENCODING=utf-8 python scripts/pruefen-bedienung.py` — Expected: `Auffälligkeiten: 0`.
Run: `git status --short` — keine Zeile mit ` D`, nichts Unbeabsichtigtes.

- [ ] **Step 8: Commit**

```bash
git add README.md AGENTS.md docs/testing.md docs/e2e-nachweise.md docs/plan.md docs/superpowers/plans/2026-10-12-bedienleiste.md
git commit -m "Doku: Bedienleiste, Nachweis der Messung, Testzahlen"
```

Nicht pushen und nicht nach `main` zusammenführen — das entscheidet der Auftraggeber (ein Push auf `main` veröffentlicht die Seite).
