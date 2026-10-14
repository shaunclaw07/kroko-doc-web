// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import type { RoundRecord } from '../../contract/sessionLog';
import { getCreature, listCreatures } from '../../core/domain/creature';
import type { RemoteLogPort } from '../../core/ports/remoteLog';
import type { RoundLogPort } from '../../core/ports/roundLog';
import { STORAGE_KEY, type StorageLike } from '../../infrastructure/storage/localStorageLog';
import { SETTINGS_KEY } from '../../infrastructure/storage/localStorageSettings';
import { RecordingHaptics } from '../../infrastructure/testing/recordingHaptics';
import { RecordingSound } from '../../infrastructure/testing/recordingSound';
import { ScriptedRandom } from '../../infrastructure/testing/scriptedRandom';
import { wireGamePage } from './gamePage';

const DOM = `
  <header>
    <span class="round-tag">Runde <strong id="hud-round">1</strong></span>
    <button type="button" id="settings-open" aria-label="Einstellungen öffnen"></button>
  </header>
  <div id="stage" data-status="open">
    <div id="croc-mount"></div>
    <div id="stage-notes">
      <p id="star-toast" class="hidden"></p>
      <p id="unlock-progress" class="hidden"></p>
      <div id="unlock-card" class="hidden">
        <span id="unlock-icon"></span><p id="unlock-title"></p>
        <button type="button" id="unlock-play"></button>
      </div>
    </div>
  </div>
  <section id="hud-stats">
    <span id="hud-remaining">10</span>
    <span id="hud-remaining-label">Zähne übrig</span>
    <span id="hud-turn">Du bist dran</span>
  </section>
  <section id="result-panel" class="hidden">
    <h2 id="result-title">Zugeschnappt!</h2>
    <p id="result-text"></p>
    <p id="result-fact"></p>
  </section>
  <div id="hud-panel">
    <div class="tension-meter"><div class="tension-meter__fill" id="hud-meter"></div></div>
    <div class="meter-legend"><span id="hud-progress">0 von 10 gedrückt</span><span id="hud-tension" class="sr-only">Bissgefahr 0 %</span></div>
    <p id="hud-meter-hint" class="hidden"></p>
  </div>
  <p id="hud-warning" class="hidden"></p>
  <p id="how-to">Tippe oder halte einen Zahn.</p>
  <p id="lock-hint" class="sr-only"></p>

  <ul id="creature-rail">
    ${listCreatures()
      .map(
        (c) =>
          `<li><button type="button" data-creature="${c.id}"><span class="creature-grid__icon"></span><span class="creature-grid__name">${c.name}</span></button></li>`,
      )
      .join('')}
  </ul>

  <div id="controls">
    <button type="button" id="creature-open"><span id="creature-icon"></span><span id="creature-name">Krokodil</span></button>
    <button type="button" id="teeth-minus">−</button>
    <output id="teeth-value">10</output>
    <span id="teeth-label">Zähne</span>
    <button type="button" id="teeth-plus">+</button>
    <button type="button" id="new-round">Neue Runde</button>
  </div>

  <dialog class="sheet" id="settings-sheet">
    <div id="opt-players">
      <button type="button" data-players="1" aria-pressed="true">1</button>
      <button type="button" data-players="2" aria-pressed="false">2</button>
    </div>
    <div id="opt-mode">
      <button type="button" data-mode="original" aria-pressed="true">original</button>
      <button type="button" data-mode="classic" aria-pressed="false">classic</button>
    </div>
    <input type="checkbox" id="opt-sound" checked />
    <input type="checkbox" id="opt-vibration" checked />
    <p id="vibration-hint" hidden></p>
    <button type="button" id="rules-open">Regeln</button>
    <button type="button" data-close-sheet>Fertig</button>
  </dialog>

  <dialog class="sheet" id="creature-sheet">
    <ul id="creature-list">
      ${listCreatures()
        .map(
          (c) =>
            `<li><button type="button" data-creature="${c.id}"><span class="creature-grid__icon"></span><span class="creature-grid__name">${c.name}</span></button></li>`,
        )
        .join('')}
    </ul>
    <button type="button" data-close-sheet>Fertig</button>
  </dialog>

  <dialog class="sheet" id="rules-sheet">
    <p id="creature-detail-line"></p>
    <p id="creature-detail-note"></p>
    <p id="creature-detail-real"></p>
    <button type="button" data-close-sheet>Fertig</button>
  </dialog>
`;

class MemoryStorage implements StorageLike {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
}

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

class MockRemoteLog implements RemoteLogPort {
  pullCalls = 0;
  pushCalls = 0;
  async pull(): Promise<RoundRecord[]> {
    this.pullCalls++;
    return [];
  }
  async push(): Promise<void> {
    this.pushCalls++;
  }
}

function played(creature: string, stars: 1 | 2 | 3): RoundRecord {
  const teeth = getCreature(creature).teeth;
  const pressIndex = stars === 3 ? teeth : stars === 2 ? Math.ceil(teeth / 2) + 1 : 1;
  return {
    round: 1,
    playedAt: '2026-10-13T09:00:00.000Z',
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

describe('gamePage', () => {
  let storage: MemoryStorage;
  let log: MemoryLog;
  let sound: RecordingSound;
  let haptics: RecordingHaptics;

  beforeEach(() => {
    document.body.innerHTML = DOM;
    storage = new MemoryStorage();
    log = new MemoryLog();
    sound = new RecordingSound();
    haptics = new RecordingHaptics(true);
  });

  function setup(options?: { remote?: RemoteLogPort }) {
    return wireGamePage({
      doc: document,
      win: window,
      storage,
      log,
      rng: new ScriptedRandom([0.5]),
      sound,
      haptics,
      portrait: (id, suffix) => `<svg data-portrait="${id}-${suffix}"></svg>`,
      remote: options?.remote,
    });
  }

  it('(a) nach wireGamePage stehen Zähne auf der Bühne', () => {
    setup();
    const teeth = document.querySelectorAll('.tooth');
    expect(teeth.length).toBe(10);
  });

  it('(b) ein gespeichertes gesperrtes Tier wird zum Krokodil und so gespeichert', () => {
    storage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        mode: 'original',
        players: 1,
        sound: true,
        vibration: true,
        creature: 'vampire',
        teethOverride: null,
      }),
    );

    setup();

    const saved = JSON.parse(storage.getItem(SETTINGS_KEY) ?? '{}');
    expect(saved.creature).toBe('crocodile');
    expect(document.querySelector('.creature')?.getAttribute('data-creature')).toBe('crocodile');
  });

  it('(c) ein storage-Ereignis mit dem Schlüssel des Protokolls malt Rundennummer und Sterne neu', () => {
    setup();
    expect(document.getElementById('hud-round')?.textContent).toBe('1');

    log.records = [played('crocodile', 1), played('crocodile', 1), played('crocodile', 1)];
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));

    expect(document.getElementById('hud-round')?.textContent).toBe('4');
  });

  it('(d) der Knopf der Freischaltkarte wechselt das Tier und die Leiste zeigt es', () => {
    log.records = [played('crocodile', 1), played('mouse', 1)];
    setup();

    // 3. Stern erreicht: Hai schaltet frei
    log.records = [...log.records, played('wolf', 1)];
    document.dispatchEvent(new CustomEvent('kroko:round-finished'));

    const unlockCard = document.getElementById('unlock-card');
    expect(unlockCard?.classList.contains('hidden')).toBe(false);

    const unlockPlay = document.getElementById('unlock-play');
    expect(unlockPlay?.getAttribute('data-play')).toBe('shark');
    unlockPlay?.click();

    expect(document.getElementById('creature-name')?.textContent).toBe('Hai');
    const sharkTile = document.querySelector('#creature-rail button[data-creature="shark"]');
    expect(sharkTile?.getAttribute('aria-pressed')).toBe('true');
  });

  it('(e) mit remote wird nach kroko:round-finished abgeglichen, ohne remote nie', async () => {
    const remote = new MockRemoteLog();

    // 1. Ohne remote: kein Aufruf beim Start oder nach kroko:round-finished
    setup();
    document.dispatchEvent(new CustomEvent('kroko:round-finished'));
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(remote.pullCalls).toBe(0);

    // 2. Mit remote: Abgleich beim Start und nach kroko:round-finished
    setup({ remote });
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(remote.pullCalls).toBe(1);

    document.dispatchEvent(new CustomEvent('kroko:round-finished'));
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(remote.pullCalls).toBe(2);
  });

  it('(f) pointerup gibt den Ton frei', () => {
    setup();
    expect(sound.unlockCalls).toBe(0);

    window.dispatchEvent(new Event('pointerup'));
    expect(sound.unlockCalls).toBe(1);
  });
});
