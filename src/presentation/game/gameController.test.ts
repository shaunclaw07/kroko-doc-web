// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { GameController } from './gameController';
import { RecordingSound } from '../../infrastructure/testing/recordingSound';
import { ScriptedRandom } from '../../infrastructure/testing/scriptedRandom';
import type { LiveTeethSelector } from '../../core/ports/liveTeeth';
import type { RoundRecord } from '../../contract/sessionLog';
import type { RoundLogPort } from '../../core/ports/roundLog';
import type { GameSettings } from '../../infrastructure/storage/localStorageSettings';

/**
 * Prüfsonde der Bedienung: sie drückt im echten DOM (jsdom) Zähne, bis das Maul
 * zuschnappt, und belegt danach, was Ton, Anzeige und Protokoll daraus machen.
 */

class FixedLiveTeethSelector implements LiveTeethSelector {
  constructor(private readonly live: number[]) {}
  select(): number[] {
    return [...this.live];
  }
}

class MemoryLog implements RoundLogPort {
  records: RoundRecord[] = [];
  saves = 0;
  load(): RoundRecord[] {
    return [...this.records];
  }
  save(records: readonly RoundRecord[]): void {
    this.records = [...records];
    this.saves += 1;
  }
  clear(): void {
    this.records = [];
  }
}

const DOM = `
  <div id="stage"><div id="croc-mount"></div></div>
  <span id="hud-round"></span><span id="hud-remaining"></span><span id="hud-presses"></span>
  <span id="hud-tension"></span><span id="hud-turn"></span><span id="hud-warning"></span>
  <div id="hud-meter"></div>
  <button id="new-round" type="button">Neue Runde</button>
  <dialog id="result-sheet"><h2 id="result-title"></h2><p id="result-text"></p></dialog>
`;

function settings(overrides: Partial<GameSettings> = {}): GameSettings {
  return { mode: 'original', players: 1, sound: true, vibration: false, creature: 'crocodile', teethOverride: null, ...overrides };
}

function build(live: number[], overrides: Partial<GameSettings> = {}): {
  controller: GameController;
  sound: RecordingSound;
  log: MemoryLog;
} {
  document.body.innerHTML = DOM;
  const sound = new RecordingSound();
  const log = new MemoryLog();
  const controller = new GameController({
    rng: new ScriptedRandom([0.5]),
    selector: new FixedLiveTeethSelector(live),
    sound,
    log,
    settings: settings(overrides),
    onSettingsChange: () => undefined,
    document,
    wait: (_ms, run) => run(),
  });
  controller.mount();
  return { controller, sound, log };
}

function click(toothId: number): void {
  const tooth = document.querySelector(`.tooth[data-tooth="${toothId}"]`);
  expect(tooth).not.toBeNull();
  tooth?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

describe('GameController in der Bühne', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('baut das Krokodil mit zehn Zähnen und zehn Trefferflächen auf', () => {
    build([4]);
    expect(document.querySelectorAll('.tooth')).toHaveLength(10);
    expect(document.querySelectorAll('.tooth__hit')).toHaveLength(10);
  });

  it('drückt harmlose Zähne, ohne das Maul zu schließen, und lässt Ton hören', () => {
    const { sound } = build([4]);
    click(1);
    const tooth = document.querySelector('.tooth[data-tooth="1"]');
    expect(tooth?.classList.contains('is-pressed')).toBe(true);
    expect(tooth?.getAttribute('aria-pressed')).toBe('true');
    expect(document.getElementById('hud-remaining')?.textContent).toBe('9');
    expect(document.getElementById('hud-presses')?.textContent).toBe('1');
    expect(sound.names()).toContain('tap');
    expect(sound.names()).toContain('creak');
    expect(document.getElementById('stage')?.dataset.status).toBe('open');
  });

  it('schnappt beim scharfen Zahn zu, markiert den Zahn und protokolliert die Runde', () => {
    const { sound, log } = build([4], { players: 2 });
    click(1);
    click(2);
    click(4);
    expect(document.getElementById('stage')?.dataset.status).toBe('snapped');
    expect(document.querySelector('.creature')?.classList.contains('is-snapped')).toBe(true);
    const biter = document.querySelector('.creature__biter');
    expect(biter?.getAttribute('opacity')).toBe('1');
    expect(biter?.querySelector('.creature__biter-label')?.textContent).toBe('Zahn 4');
    expect(sound.names()).toContain('snap');
    expect(sound.stopAllCalls).toBeGreaterThan(0);
    expect(log.saves).toBe(1);
    expect(log.records).toHaveLength(1);
    expect(log.records[0]?.loserTooth).toBe(4);
    expect(log.records[0]?.pressIndex).toBe(3);
    expect(log.records[0]?.pressOrder).toEqual([1, 2, 4]);
    // Druck 3 fällt bei zwei Spielern wieder auf Spieler 1 (reihum).
    expect(document.getElementById('result-title')?.textContent).toContain('Spieler 1');
    expect(document.getElementById('result-text')?.textContent).toContain('Zahn 4');
    expect(document.getElementById('result-sheet')?.hasAttribute('open')).toBe(true);
  });

  it('nennt bei zwei Spielern den Verlierer des zweiten Drucks', () => {
    build([7], { players: 2 });
    click(1);
    click(7);
    expect(document.getElementById('result-title')?.textContent).toContain('Spieler 2');
  });

  it('ignoriert weitere Drücke nach dem Zuschnappen und nach der neuen Runde geht es weiter', () => {
    const { controller, log } = build([3]);
    click(3);
    click(1);
    expect(log.records).toHaveLength(1);
    controller.resetRound();
    expect(document.getElementById('stage')?.dataset.status).toBe('open');
    expect(document.querySelector('.creature__biter')?.getAttribute('opacity')).toBe('0');
    expect(document.querySelectorAll('.tooth.is-pressed')).toHaveLength(0);
    expect(document.getElementById('hud-remaining')?.textContent).toBe('10');
  });

  it('warnt, wenn nur noch ein Zahn übrig ist — der ist garantiert scharf', () => {
    build([10], { mode: 'classic' });
    for (let tooth = 1; tooth <= 9; tooth += 1) {
      click(tooth);
    }
    const warning = document.getElementById('hud-warning');
    expect(warning?.classList.contains('hidden')).toBe(false);
    expect(warning?.textContent).toContain('garantiert scharf');
  });

  it('zählt die Runden im Protokoll fortlaufend weiter', () => {
    const { controller, log } = build([2]);
    click(2);
    controller.resetRound();
    click(2);
    expect(log.records.map((record) => record.round)).toEqual([1, 2]);
  });

  it('wechselt das Lebewesen, zeichnet dessen Gebiss und protokolliert es', () => {
    const { controller, log } = build([9], { creature: 'crocodile' });
    expect(document.querySelectorAll('.tooth')).toHaveLength(10);

    controller.applySettings({ ...settings(), creature: 'wolf' });
    expect(document.querySelectorAll('.tooth')).toHaveLength(12);
    expect(document.querySelector('.creature')?.getAttribute('data-creature')).toBe('wolf');
    // Den Schließweg setzt die Zeichnung selbst; er muss zum Gebiss passen und > 0 sein.
    const style = document.querySelector('.creature')?.getAttribute('style') ?? '';
    const shift = Number(style.match(/--close-shift:\s*([\d.]+)px/)?.[1] ?? '0');
    expect(shift).toBeGreaterThan(60);

    click(9);
    expect(log.records[0]?.creature).toBe('wolf');
    expect(log.records[0]?.teeth).toBe(12);
  });

  it('übernimmt eine eingestellte Zahnzahl in Bühne, Anzeige und Protokoll', () => {
    const { log } = build([9], { creature: 'crocodile', teethOverride: 12 });
    expect(document.querySelectorAll('.tooth')).toHaveLength(12);
    expect(document.getElementById('hud-remaining')?.textContent).toBe('12');
    click(9);
    expect(log.records[0]?.teeth).toBe(12);
    expect(log.records[0]?.creature).toBe('crocodile');
  });

  it('meldet den Spannungspegel nach außen (Bühne und Ton)', () => {
    const { sound } = build([9]);
    click(1);
    const stage = document.getElementById('stage');
    expect(Number(stage?.dataset.tension)).toBeGreaterThan(0);
    expect(sound.tensions.length).toBeGreaterThan(0);
    const meter = document.getElementById('hud-meter') as HTMLElement | null;
    expect(meter?.style.width).not.toBe('');
  });
});
