// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { GameController } from './gameController';
import { RecordingHaptics } from '../../infrastructure/testing/recordingHaptics';
import { RecordingSound } from '../../infrastructure/testing/recordingSound';
import { ScriptedRandom } from '../../infrastructure/testing/scriptedRandom';
import type { LiveTeethSelector } from '../../core/ports/liveTeeth';
import type { RoundRecord } from '../../contract/sessionLog';
import type { RoundLogPort } from '../../core/ports/roundLog';
import type { GameSettings } from '../../infrastructure/storage/localStorageSettings';
import type { SessionMarkPort } from '../../core/ports/sessionMark';

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

class MemoryMarks implements SessionMarkPort {
  private readonly seen = new Set<string>();
  has(key: string): boolean {
    return this.seen.has(key);
  }
  mark(key: string): void {
    this.seen.add(key);
  }
}

const DOM = `
  <div id="stage"><div id="croc-mount"></div></div>
  <span id="hud-round"></span><span id="hud-remaining"></span><span id="hud-presses"></span>
  <span id="hud-tension"></span><span id="hud-turn"></span><span id="hud-warning"></span>
  <span id="hud-progress"></span><p id="hud-meter-hint" class="hidden"></p>
  <div id="hud-meter"></div>
  <button id="new-round" type="button">Neue Runde</button>
  <dialog id="result-sheet"><h2 id="result-title"></h2><p id="result-text"></p></dialog>
`;

function settings(overrides: Partial<GameSettings> = {}): GameSettings {
  return { mode: 'original', players: 1, sound: true, vibration: false, creature: 'crocodile', teethOverride: null, ...overrides };
}

/**
 * Die Attrappe komprimiert den **Drama-Takt**: Pause und Urteil laufen sofort, damit ein Test nicht
 * auf 700 ms warten muss. Lange Wartezeiten (der Balken-Hinweis) bleiben dagegen stehen — wer sie
 * prüfen will, reicht eine eigene Uhr herein.
 */
function compressedWait(ms: number, run: () => void): void {
  if (ms < 1000) {
    run();
  }
}

function build(
  live: number[],
  overrides: Partial<GameSettings> = {},
  hapticsSupported = true,
  session?: SessionMarkPort,
  waitOverride: (ms: number, run: () => void) => void = compressedWait,
): {
  controller: GameController;
  sound: RecordingSound;
  log: MemoryLog;
  haptics: RecordingHaptics;
} {
  document.body.innerHTML = DOM;
  const sound = new RecordingSound();
  const log = new MemoryLog();
  const haptics = new RecordingHaptics(hapticsSupported);
  const controller = new GameController({
    rng: new ScriptedRandom([0.5]),
    selector: new FixedLiveTeethSelector(live),
    sound,
    haptics,
    log,
    settings: settings(overrides),
    session,
    onSettingsChange: () => undefined,
    document,
    wait: waitOverride,
  });
  controller.mount();
  return { controller, sound, log, haptics };
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

  it('fühlt sich bei jedem Druck an: Tipp beim Drücken, weicher Stoß bei der Erleichterung, Muster beim Biss', () => {
    const { haptics } = build([9], { vibration: true });
    click(1);
    // Erst der feste Tipp des Drückens, danach der Stoß der Erleichterung (12–25 ms).
    expect(haptics.patterns[0]).toBe(25);
    expect(haptics.patterns).toHaveLength(2);
    expect(haptics.patterns[1]).toBeGreaterThanOrEqual(12);
    expect(haptics.patterns[1]).toBeLessThanOrEqual(25);
    click(9);
    // Beim Biss: Tipp beim Drücken, dann das volle Muster — keine Erleichterung dazwischen.
    expect(haptics.patterns[2]).toBe(25);
    expect(haptics.patterns[3]).toEqual([120, 50, 220]);
  });

  it('gibt beim Druck auf einen harmlosen Zahn einen kurzen Tipp und danach die Erleichterung', () => {
    const { haptics } = build([4, 7], { vibration: true });
    click(1);
    expect(haptics.patterns[0]).toBe(25);
    expect(haptics.patterns).toHaveLength(2);
    expect(document.querySelector('.tooth[data-tooth="1"]')?.classList.contains('is-pressed')).toBe(true);
  });

  it('vibriert gar nicht, wenn Vibration abgeschaltet ist', () => {
    const { haptics } = build([9], { vibration: false });
    click(9);
    expect(haptics.patterns).toEqual([]);
  });

  it('läuft ohne Vibrations-Schnittstelle fehlerfrei durch (Safari auf iOS)', () => {
    const { haptics } = build([9], { vibration: true }, false);
    expect(() => click(9)).not.toThrow();
    expect(haptics.patterns).toEqual([]);
    expect(document.getElementById('result-text')?.textContent).toBeTruthy();
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

  it('nennt im Ergebnis den Mut: die hoechste ueberstandene Bissgefahr', () => {
    build([4]);
    click(1);
    click(2);
    click(4);
    // Schnappt beim 3. Druck; ueberstanden wurden Druck 1 und 2, die Gefahr stieg auf 21,3 %.
    const text = document.getElementById('result-text')?.textContent ?? '';
    expect(text).toContain('mutigster Druck');
    expect(text).toContain('21 %');
  });

  it('nennt den mutigsten Druck beim Namen, wenn mehrere Spieler am Tisch sitzen', () => {
    build([4], { players: 2 });
    click(1);
    click(2);
    click(4);
    // Druck 2 kam reihum von Spieler 2 — das war der letzte harmlose Druck der Runde.
    const text = document.getElementById('result-text')?.textContent ?? '';
    expect(text).toContain('Spieler 2');
    expect(text).toContain('21 %');
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

  it('beschriftet Fortschritt und Gefahr mit Worten', () => {
    build([9]);
    expect(document.getElementById('hud-progress')?.textContent).toBe('0 von 10 gedrückt');
    expect(document.getElementById('hud-tension')?.textContent).toBe('Bissgefahr 20 %');
    click(1);
    expect(document.getElementById('hud-progress')?.textContent).toBe('1 von 10 gedrückt');
    expect(document.getElementById('hud-tension')?.textContent).toMatch(/^Bissgefahr \d+ %$/);
  });

  it('füllt den Balken mit dem Fortschritt, nicht mit der Gefahr', () => {
    // Beim Krokodil steht die Gefahr nach dem ersten Druck bei 20 %, der Fortschritt bei 10 %.
    build([9]);
    click(1);
    const meter = document.getElementById('hud-meter') as HTMLElement;
    expect(meter.style.width).toBe('10%');
    expect(document.getElementById('stage')?.dataset.tension).toBe('0.21');
  });

  it('wird erst rot, wenn der letzte Zahn ansteht', () => {
    build([10]);
    const stage = document.getElementById('stage');
    for (const id of [1, 2, 3, 4, 5, 6, 7, 8]) {
      click(id);
    }
    expect(stage?.classList.contains('is-danger')).toBe(false);
    click(9);
    expect(stage?.classList.contains('is-danger')).toBe(true);
  });

  it('erklärt den Balken genau einmal je Sitzung', () => {
    const session = new MemoryMarks();
    build([9], {}, true, session);
    const hint = document.getElementById('hud-meter-hint');
    expect(hint?.classList.contains('hidden')).toBe(true);
    click(1);
    expect(hint?.classList.contains('hidden')).toBe(false);
    click(2);
    expect(hint?.classList.contains('hidden')).toBe(false);
    // Neue Runde in derselben Sitzung: der Hinweis bleibt weg.
    (document.getElementById('new-round') as HTMLButtonElement).click();
    click(1);
    expect(session.has('hint:meter')).toBe(true);
  });

  it('nimmt den Hinweis nach einigen Sekunden selbst zurück', () => {
    const pending: Array<() => void> = [];
    build([9], {}, true, new MemoryMarks(), (ms, run) => {
      if (ms >= 1000) {
        pending.push(run);
        return;
      }
      run();
    });
    click(1);
    const hint = document.getElementById('hud-meter-hint');
    expect(hint?.classList.contains('hidden')).toBe(false);
    expect(pending.length).toBe(1);
    pending.forEach((run) => run());
    expect(hint?.classList.contains('hidden')).toBe(true);
  });

  it('blendet den Hinweis beim Antippen aus', () => {
    build([9], {}, true, new MemoryMarks());
    click(1);
    const hint = document.getElementById('hud-meter-hint');
    hint?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(hint?.classList.contains('hidden')).toBe(true);
  });
});
