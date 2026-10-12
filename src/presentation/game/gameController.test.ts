// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GameController } from './gameController';
import { getCreature } from '../../core/domain/creature';
import { RecordingHaptics } from '../../infrastructure/testing/recordingHaptics';
import { RecordingSound } from '../../infrastructure/testing/recordingSound';
import { ScriptedRandom } from '../../infrastructure/testing/scriptedRandom';
import type { LiveTeethSelector } from '../../core/ports/liveTeeth';
import type { RandomSource } from '../../core/ports/random';
import type { RoundRecord } from '../../contract/sessionLog';
import type { RoundLogPort } from '../../core/ports/roundLog';
import type { GameSettings } from '../../infrastructure/storage/localStorageSettings';
import type { SessionMarkPort } from '../../core/ports/sessionMark';
import { creatureView } from './creatures';
import { GAZE_MAX, gazeOffset } from './creatures/gaze';

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
  <span id="hud-round"></span><span id="hud-remaining"></span>
  <span id="hud-turn"></span><span id="hud-warning"></span>
  <span id="hud-remaining-label"></span>
  <div class="tension-panel" id="hud-panel">
    <div class="tension-meter"><div class="tension-meter__fill" id="hud-meter"></div></div>
    <div class="meter-legend"><span id="hud-progress"></span><span id="hud-tension"></span></div>
    <p id="hud-meter-hint" class="hidden"></p>
  </div>
  <button id="new-round" type="button">Neue Runde</button>
  <p id="how-to"></p>
  <dialog class="sheet" id="settings-sheet"><output id="teeth-value"></output></dialog>
  <section id="hud-stats"></section>
  <section id="result-panel" class="hidden"><h2 id="result-title"></h2><p id="result-text"></p><p id="result-fact"></p></section>
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

/**
 * Weggeworfene Steuerungen: jede wird nach ihrem Fall abgehängt. Ohne das feuerte ein offener
 * Zeitgeber (damals der Herzschlag) in die schon abgebaute Umgebung („window is not defined") und das
 * Gate schlug gelegentlich ohne echten Fehler fehl — gemessen: 1 von 7 Läufen (11.10.2026).
 */
const gebaut: GameController[] = [];

function build(
  live: number[],
  overrides: Partial<GameSettings> = {},
  hapticsSupported = true,
  session?: SessionMarkPort,
  waitOverride: (ms: number, run: () => void) => void = compressedWait,
  rng: RandomSource = new ScriptedRandom([0.5]),
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
    rng,
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
  gebaut.push(controller);
  return { controller, sound, log, haptics };
}

function click(toothId: number): void {
  const tooth = document.querySelector(`.tooth[data-tooth="${toothId}"]`);
  expect(tooth).not.toBeNull();
  tooth?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

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

describe('GameController in der Bühne', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    for (const controller of gebaut.splice(0)) {
      controller.dispose();
    }
  });

  it('nennt nach dem Biss einen Satz über das echte Tier', () => {
    build([4], { creature: 'mouse' });
    expect(document.getElementById('result-fact')?.textContent).toBe('');
    click(4);
    expect(document.getElementById('result-fact')?.textContent).toBe(
      `Wusstest du? ${getCreature('mouse').fact}`,
    );
  });

  it('nennt nach einem Tierwechsel den Satz des neuen Tiers', () => {
    const { controller } = build([4], { creature: 'mouse' });
    click(4);
    controller.applySettings(settings({ creature: 'wolf' }));
    click(4);
    expect(document.getElementById('result-fact')?.textContent).toBe(
      `Wusstest du? ${getCreature('wolf').fact}`,
    );
  });

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

  it('bricht beim Tierwechsel ab, was noch klingt — bevor das neue Tier sich meldet', () => {
    const { controller, sound } = build([4]);
    // Bei jedem Abbruch mitschreiben, wie viele Stimmen bis dahin gespielt waren: die Reihenfolge
    // zählt — ein Abbruch **nach** der neuen Stimme würde genau sie abschneiden.
    const voicesAtStop: number[] = [];
    const stopAll = sound.stopAll.bind(sound);
    sound.stopAll = () => {
      voicesAtStop.push(sound.voices.length);
      stopAll();
    };
    controller.applySettings(settings({ creature: 'mouse' }));
    expect(voicesAtStop).toEqual([0]);
    expect(sound.voices).toEqual(['mouse']);

    // Nur die Zahnzahl: es klingt keine Stimme, die man abbrechen müsste.
    controller.applySettings(settings({ creature: 'mouse', teethOverride: 4 }));
    expect(voicesAtStop).toEqual([0]);
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

  it('spielt im Leerlauf nichts von selbst — es gibt keinen Herzschlag mehr', () => {
    vi.useFakeTimers();
    try {
      const { sound } = build([2]);
      const before = sound.names().length;
      vi.advanceTimersByTime(10000);
      expect(sound.names()).toHaveLength(before);
    } finally {
      vi.useRealTimers();
    }
  });

  it('hängt die Steuerung ab: nach dispose() läuft kein spätes Urteil mehr', () => {
    // Ein Zeitgeber, der nach dem Testende in eine abgebaute Umgebung feuerte („window is not
    // defined"), machte das Gate gelegentlich rot. Hier mit den echten Zeitgebern der Steuerung.
    vi.useFakeTimers();
    try {
      document.body.innerHTML = DOM;
      const sound = new RecordingSound();
      const controller = new GameController({
        rng: new ScriptedRandom([0.5]),
        selector: new FixedLiveTeethSelector([2]),
        sound,
        log: new MemoryLog(),
        settings: settings(),
        onSettingsChange: () => undefined,
        document,
      });
      controller.mount();
      click(2);
      expect(sound.names(), 'ohne offenen Druck wäre der Test sinnlos').not.toContain('snap');

      controller.dispose();
      vi.advanceTimersByTime(10000);
      expect(sound.names()).not.toContain('snap');
      expect(document.querySelector('.creature')?.classList.contains('is-snapped')).toBe(false);
    } finally {
      vi.useRealTimers();
    }
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
    expect(document.getElementById('hud-progress')?.textContent).toBe('1 von 10 gedrückt');
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
    expect(document.getElementById('result-panel')?.classList.contains('hidden')).toBe(false);
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

  it('lässt das Einstellungsblatt offen, während dort gestellt wird', () => {
    // Gemeldeter Fehler (11.10.2026): jeder Tipp auf „−" schloss das Blatt, weil die neue Runde
    // alle Blätter zumachte — man konnte die Zahnzahl nicht mehr einstellen.
    const { controller } = build([4]);
    const sheet = document.getElementById('settings-sheet') as HTMLDialogElement;
    sheet.setAttribute('open', '');
    controller.applySettings({ ...settings(), teethOverride: 12 });
    expect(sheet.hasAttribute('open')).toBe(true);
    expect(document.getElementById('hud-remaining')?.textContent).toBe('12');
    // Ein zweiter Tipp: das Blatt steht weiter und die neue Runde gilt.
    controller.applySettings({ ...settings(), teethOverride: 11 });
    expect(sheet.hasAttribute('open')).toBe(true);
    expect(document.getElementById('hud-remaining')?.textContent).toBe('11');
  });

  it('zeigt das Ergebnis nach dem Biss auf der Seite — kein Blatt, das man wegtippen muss', () => {
    // Bis zum 12.10.2026 öffnete sich ein modales Blatt. Seit Tier, Zähne und „Neue Runde" auf der
    // Seite stehen, hielt es nur noch auf (Wunsch des Auftraggebers).
    build([3]);
    const panel = document.getElementById('result-panel');
    const stats = document.getElementById('hud-stats');
    expect(panel?.classList.contains('hidden')).toBe(true);
    expect(stats?.classList.contains('hidden')).toBe(false);
    click(1);
    expect(panel?.classList.contains('hidden')).toBe(true);
    click(3);
    expect(panel?.classList.contains('hidden')).toBe(false);
    // Bei geschlossenem Maul gibt es keine Zähne mehr zu zählen: das Ergebnis steht an ihrer Stelle.
    expect(stats?.classList.contains('hidden')).toBe(true);
    expect(document.querySelector('dialog[open]')).toBeNull();
  });

  it('räumt das Ergebnis mit der neuen Runde wieder weg', () => {
    const { controller } = build([3]);
    click(3);
    controller.resetRound();
    expect(document.getElementById('result-panel')?.classList.contains('hidden')).toBe(true);
    expect(document.getElementById('hud-stats')?.classList.contains('hidden')).toBe(false);
  });

  it('nennt im Ergebnis keine Protokollzahl mehr — die Runde steht in der Kopfzeile', () => {
    build([3]);
    click(3);
    expect(document.getElementById('result-text')?.textContent).not.toContain('protokolliert');
  });

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

  it('nimmt das Glühen eines Zuckens zurück, auch wenn der nächste Druck sofort zuschnappt', () => {
    // Der Zeitgeber des Zuckens (260 ms) wird festgehalten und erst nach dem Biss ausgeführt —
    // so, als hätte jemand sofort weitergetippt. Zufall: 0,5 für die Pause, 0,01 lässt es zucken.
    const held: Array<() => void> = [];
    const wait = (ms: number, run: () => void): void => {
      if (ms === 260) {
        held.push(run);
      } else if (ms < 1000) {
        run();
      }
    };
    build([2], {}, true, undefined, wait, new ScriptedRandom([0.5, 0.01]));
    const tooth = (id: number): Element | null => document.querySelector(`.tooth[data-tooth="${id}"]`);

    click(1);
    expect(tooth(1)?.classList.contains('is-live'), 'ohne Zucken wäre der Test sinnlos').toBe(true);
    click(2);
    expect(document.getElementById('stage')?.dataset.status).toBe('snapped');
    held.forEach((run) => run());

    expect(tooth(1)?.classList.contains('is-live')).toBe(false);
    expect(tooth(2)?.classList.contains('is-live')).toBe(true);
  });

  it('warnt, wenn nur noch ein Zahn übrig ist — der ist garantiert scharf', () => {
    build([10], { mode: 'classic' });
    expect(document.getElementById('hud-remaining-label')?.textContent).toBe('Zähne übrig');
    for (let tooth = 1; tooth <= 9; tooth += 1) {
      click(tooth);
    }
    const warning = document.getElementById('hud-warning');
    expect(warning?.classList.contains('hidden')).toBe(false);
    expect(warning?.textContent).toContain('garantiert scharf');
    // Sprache: bei einem einzigen übrigen Zahn steht dort die Einzahl.
    expect(document.getElementById('hud-remaining')?.textContent).toBe('1');
    expect(document.getElementById('hud-remaining-label')?.textContent).toBe('Zahn übrig');
  });

  it('zählt die Runden im Protokoll fortlaufend weiter', () => {
    const { controller, log } = build([2]);
    click(2);
    controller.resetRound();
    click(2);
    expect(log.records.map((record) => record.round)).toEqual([1, 2]);
  });

  it('hängt an das Protokoll an, wie es jetzt in der Ablage steht — nicht wie beim Seitenstart', () => {
    // Gemessen am 12.10.2026 mit zwei Tabs: 3 Runden gespielt, in der Statistik gelöscht und 5
    // importiert. Der nächste Biss schrieb die 3 gelöschten zurück und verwarf die 5 importierten.
    const { controller, log } = build([2]);
    click(2);
    controller.resetRound();
    const imported = [7, 8].map((round) => ({ ...log.records[0]!, round, loserTooth: 5 }));
    log.records = imported;
    click(2);
    expect(log.records.map((record) => record.round)).toEqual([7, 8, 9]);
    expect(log.records.slice(0, 2)).toEqual(imported);
  });

  it('zeigt nach syncLog() die Rundennummer des geänderten Protokolls', () => {
    const { controller, log } = build([2]);
    click(2);
    controller.resetRound();
    expect(document.getElementById('hud-round')?.textContent).toBe('2');
    log.records = [];
    controller.syncLog();
    expect(document.getElementById('hud-round')?.textContent).toBe('1');
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

  it('nennt den Zug in richtiger Sprache — „Du bist dran“, nicht „Du ist dran“', () => {
    build([4]);
    expect(document.getElementById('hud-turn')?.textContent).toBe('Du bist dran');
    click(1);
    expect(document.getElementById('hud-turn')?.textContent).toBe('Du bist dran');
  });

  it('nennt bei mehreren Spielern den Namen dessen, der dran ist', () => {
    build([9], { players: 2 });
    expect(document.getElementById('hud-turn')?.textContent).toBe('Spieler 1 ist dran');
    click(1);
    expect(document.getElementById('hud-turn')?.textContent).toBe('Spieler 2 ist dran');
    click(9);
    expect(document.getElementById('hud-turn')?.textContent).toBe('Maul zu');
  });

  it('füllt den Balken mit dem Fortschritt, nicht mit der Gefahr', () => {
    // Beim Krokodil steht die Gefahr nach dem ersten Druck bei 20 %, der Fortschritt bei 10 %.
    build([9]);
    click(1);
    const meter = document.getElementById('hud-meter') as HTMLElement;
    expect(meter.style.width).toBe('10%');
    expect(document.getElementById('stage')?.dataset.tension).toBe('0.21');
  });

  it('wird rot, wenn noch zwei Zaehne anstehen — nicht erst beim allerletzten', () => {
    // Der Stolperdraht der Schwelle. Mit HIGH_DANGER = 0.6 wurde es erst beim letzten Zahn rot
    // (und damit nie bei einem ueberstandenen Druck); seit 0.5 einen Druck frueher, weil 55,0 %
    // erreicht werden. Faellt dieser Test, hat jemand die Schwelle wieder angefasst.
    build([10]);
    const panel = document.getElementById('hud-meter')?.closest('.tension-panel');
    for (const id of [1, 2, 3, 4, 5, 6, 7]) {
      click(id);
    }
    expect(panel?.classList.contains('is-danger')).toBe(false);
    click(8);
    expect(panel?.classList.contains('is-danger')).toBe(true);
  });

  it('setzt die Zustandsklassen an den Kasten, der den Balken enthält', () => {
    // jsdom rechnet kein CSS, deshalb prüft dieser Test die **Struktur**: nur wenn der Balken in
    // seinem Kasten steht, erreichen ihn die Farbregeln. Vorher hing `is-danger` an der Bühne und
    // der Balken stand außerhalb — bei 100 % Bissgefahr blieb er grün→gold (gemessen im Browser,
    // docs/e2e-nachweise.md §5t). Die Farben selbst misst `scripts/pruefen-anzeige.py`.
    build([9]);
    const meter = document.getElementById('hud-meter');
    expect(meter).not.toBeNull();
    expect(meter?.closest('.tension-panel')).not.toBeNull();
    expect(document.getElementById('stage')?.contains(meter ?? null)).toBe(false);
  });

  it('steht mit einem Zahn sofort auf „rot" — und die Klasse sitzt am Balkenkasten', () => {
    // Ein Zahn: der nächste Druck schnappt garantiert, die Gefahr ist genau 1.
    build([1], { teethOverride: 1 });
    const panel = document.getElementById('hud-meter')?.closest('.tension-panel');
    expect(document.getElementById('hud-tension')?.textContent).toBe('Bissgefahr 100 %');
    expect(panel?.classList.contains('is-danger')).toBe(true);
    expect(panel?.classList.contains('is-tense')).toBe(true);
    expect(panel?.classList.contains('is-snapped')).toBe(false);
  });

  it('nimmt nach dem Zuschnappen die Bissgefahr zurück — es gibt keinen nächsten Druck', () => {
    // Gemeldet: „Bissgefahr 100 % obwohl der Mund zu ist". Der Wert stand noch vom Zuschnappen da.
    build([1], { teethOverride: 1 });
    click(1);
    expect(document.getElementById('stage')?.dataset.status).toBe('snapped');
    expect(document.getElementById('hud-tension')?.textContent).toBe('Runde beendet');
    expect(document.getElementById('hud-tension')?.textContent).not.toContain('Bissgefahr');
    // Der Fortschritt bleibt wahr: gedrückter Zahn von Zähnen.
    expect(document.getElementById('hud-progress')?.textContent).toBe('1 von 1 gedrückt');
    const panel = document.getElementById('hud-meter')?.closest('.tension-panel');
    expect(panel?.classList.contains('is-snapped')).toBe(true);
    expect(panel?.classList.contains('is-danger')).toBe(false);
    expect(panel?.classList.contains('is-tense')).toBe(false);
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

  it('lässt einen Druck der alten Runde nicht in die neue Runde zuschnappen', () => {
    // „Neue Runde" in der Pause vor der Auflösung: das Urteil des alten Drucks darf die neue Runde
    // nicht treffen — sonst steht ein geschlossenes Maul über einer offenen Runde.
    const pending: Array<() => void> = [];
    const { log, sound } = build([1], {}, true, undefined, (_ms, run) => {
      pending.push(run);
    });
    click(1);
    (document.getElementById('new-round') as HTMLButtonElement).click();
    while (pending.length > 0) {
      pending.shift()?.();
    }
    expect(document.querySelector('.creature')?.classList.contains('is-snapped')).toBe(false);
    expect(document.getElementById('stage')?.dataset.status).toBe('open');
    expect(sound.names()).not.toContain('snap');
    expect(log.records).toEqual([]);
    // Die neue Runde ist bespielbar.
    click(2);
    expect(document.getElementById('hud-progress')?.textContent).toBe('1 von 10 gedrückt');
  });

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

  it('lässt den Browser aus dem gehaltenen Zahn kein Wischen machen — sonst bricht ein wackelnder Finger ab', () => {
    // Gemessen am 12.10.2026: 14 px Weg auf 65 px Trefferfläche genügten für ein `pointercancel`.
    const { waits } = buildHold([4]);
    const touchStart = (id: number): boolean => {
      const event = new Event('touchstart', { bubbles: true, cancelable: true });
      toothElement(id).dispatchEvent(event);
      return event.defaultPrevented;
    };
    expect(touchStart(1), 'ohne Halten bleibt das Wischen frei').toBe(false);

    pointer('pointerdown', toothElement(1));
    expect(touchStart(1)).toBe(true);
    expect(touchStart(2), 'nur der gehaltene Zahn').toBe(false);

    pointer('pointerup', toothElement(1));
    waits.filter((entry) => entry.ms >= 1000).forEach((entry) => entry.run());
    expect(touchStart(1), 'von einem gedrückten Zahn aus lässt sich scrollen').toBe(false);
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

  function zoom(): string | undefined {
    return document.getElementById('stage')?.style.getPropertyValue('--zoom');
  }

  it('lässt die Bühne am Rundenbeginn in Ruhe (Krokodil: 20 % Bissgefahr)', () => {
    build([10]);
    expect(zoom()).toBe('0.000');
  });

  it('rückt ab der Rot-Schwelle heran — abgeleitet aus der Bissgefahr des nächsten Drucks', () => {
    build([10]);
    // Krokodil, 10 Zähne: der 8. Druck hat 40,7 % (noch nicht rot), der 9. Druck 55,0 %.
    for (const tooth of [1, 2, 3, 4, 5, 6, 7]) click(tooth);
    expect(zoom()).toBe('0.000');
    click(8);
    expect(zoom()).toBe('0.460');
    click(9);
    expect(zoom()).toBe('1.000');
  });

  it('ist bei einem einzigen Zahn von Anfang an ganz herangerückt', () => {
    build([1], { teethOverride: 1 });
    expect(zoom()).toBe('1.000');
  });

  it('steht nach dem Biss wieder auf 0', () => {
    build([1], { teethOverride: 1 });
    click(1);
    expect(document.getElementById('stage')?.dataset.status).toBe('snapped');
    expect(zoom()).toBe('0.000');
  });

  it('steht nach einer neuen Runde wieder auf 0', () => {
    const { controller } = build([10]);
    for (const tooth of [1, 2, 3, 4, 5, 6, 7, 8]) click(tooth);
    expect(zoom()).toBe('0.460');
    controller.resetRound();
    expect(zoom()).toBe('0.000');
  });
});
