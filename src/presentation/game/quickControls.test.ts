// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { effectiveTeeth, fewTeethWarning, settingsAfterTeethStep, wireQuickControls } from './quickControls';
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
  <p id="how-to">Tippe oder halte einen Zahn.</p>
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

  it('ein Tipp auf ein gesperrtes Tier wählt nichts und lässt die Auswahl offen', () => {
    document.body.innerHTML = DOM;
    const start = settings();
    const applied: GameSettings[] = [];
    const tapped: string[] = [];
    let chosen = 0;
    wireQuickControls({
      doc: document,
      settings: start,
      apply: (next) => applied.push(next),
      portrait: () => '',
      onCreatureChosen: () => {
        chosen += 1;
      },
      isLocked: (id) => id === 'mouse',
      onLockedTap: (id) => tapped.push(id),
    });
    (document.querySelector('#creature-list [data-creature="mouse"]') as HTMLButtonElement).click();
    expect(applied).toEqual([]);
    expect(chosen).toBe(0);
    expect(tapped).toEqual(['mouse']);
    expect(byId('creature-name').textContent).toBe('Krokodil');
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

  it('warnt an der Stelle der Anleitung, wenn die Zahnzahl nur den ersten Stern bringt', () => {
    wire(settings());
    const howTo = byId('how-to');
    expect(howTo.textContent).toBe('Tippe oder halte einen Zahn.');
    expect(howTo.classList.contains('how-to--warning')).toBe(false);
    // Ein Zahn weniger als das Gebiss des Krokodils: die Warnung nennt die Zahl, ab der es zählt.
    byId('teeth-minus').click();
    expect(howTo.textContent).toBe('Nur der erste Stern: für alle drei braucht es mindestens 10 Zähne.');
    expect(howTo.textContent).toBe(fewTeethWarning(10));
    expect(howTo.classList.contains('how-to--warning')).toBe(true);
    // Zurück auf das ganze Gebiss — und darüber hinaus: die Anleitung ist wieder da.
    byId('teeth-plus').click();
    expect(howTo.textContent).toBe('Tippe oder halte einen Zahn.');
    byId('teeth-plus').click();
    expect(byId('teeth-value').textContent).toBe('11');
    expect(howTo.textContent).toBe('Tippe oder halte einen Zahn.');
    expect(howTo.classList.contains('how-to--warning')).toBe(false);
  });

  it('misst die Warnung am Gebiss des gewählten Tiers, nicht an einer festen Zahl', () => {
    // Sechs Zähne sind für die Maus das ganze Gebiss, für das Krokodil zu wenig.
    wire(settings({ creature: 'mouse' }));
    expect(byId('how-to').classList.contains('how-to--warning')).toBe(false);
    wire(settings({ creature: 'crocodile', teethOverride: 6 }));
    expect(byId('how-to').classList.contains('how-to--warning')).toBe(true);
  });

  it('sagt bei einem Vorbild ohne Zähne „keine Zähne" statt einer Null', () => {
    wire(settings({ creature: 'flytrap' }));
    expect(byId('creature-detail-line').textContent).toContain('Venusfliegenfalle: 8 Zähne');
    expect(byId('creature-detail-real').textContent).toBe('Echtes Gebiss: keine Zähne.');
    expect(byId('creature-detail-real').textContent).not.toContain('0');
  });
});
