// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS, type GameSettings } from '../../core/domain/settings';
import { RecordingHaptics } from '../../infrastructure/testing/recordingHaptics';
import { createSettingsStore } from './settingsStore';
import { wireSettingsSheet } from './settingsSheet';

const DOM = `
  <div class="segmented" id="opt-players" role="group" aria-label="Spielerzahl">
    <button type="button" data-players="1" aria-pressed="true">Allein</button>
    <button type="button" data-players="2" aria-pressed="false">Zu zweit</button>
  </div>
  <div class="segmented" id="opt-mode" role="group" aria-label="Zufallsmodell">
    <button type="button" data-mode="original" aria-pressed="true">wie das Spielzeug</button>
    <button type="button" data-mode="classic" aria-pressed="false">nur ein Zahn</button>
  </div>
  <input type="checkbox" id="opt-sound" checked />
  <input type="checkbox" id="opt-vibration" checked />
  <p id="vibration-hint" hidden></p>
`;

function createFixture(initialSettings?: Partial<GameSettings>, supported = true) {
  document.body.innerHTML = DOM;
  const settings: GameSettings = {
    ...DEFAULT_SETTINGS,
    ...initialSettings,
  };
  const haptics = new RecordingHaptics(supported);
  const store = createSettingsStore(settings);
  const apply = vi.fn((next: GameSettings) => store.set(next));
  wireSettingsSheet({ doc: document, settings: store, haptics, apply });
  return { settings, store, haptics, apply };
}

describe('settingsSheet', () => {
  it('initialisiert Schalter und Knöpfe aus den übergebenen Einstellungen', () => {
    createFixture({ players: 2, mode: 'classic', sound: false, vibration: false });

    const btnPlayer1 = document.querySelector<HTMLButtonElement>('#opt-players [data-players="1"]');
    const btnPlayer2 = document.querySelector<HTMLButtonElement>('#opt-players [data-players="2"]');
    const btnOriginal = document.querySelector<HTMLButtonElement>('#opt-mode [data-mode="original"]');
    const btnClassic = document.querySelector<HTMLButtonElement>('#opt-mode [data-mode="classic"]');
    const soundBox = document.getElementById('opt-sound') as HTMLInputElement;
    const vibrationBox = document.getElementById('opt-vibration') as HTMLInputElement;

    expect(btnPlayer1?.getAttribute('aria-pressed')).toBe('false');
    expect(btnPlayer2?.getAttribute('aria-pressed')).toBe('true');
    expect(btnOriginal?.getAttribute('aria-pressed')).toBe('false');
    expect(btnClassic?.getAttribute('aria-pressed')).toBe('true');
    expect(soundBox.checked).toBe(false);
    expect(vibrationBox.checked).toBe(false);
  });

  it('Tipp auf Spielerzahl ruft apply mit geänderter Spielerzahl und setzt aria-pressed', () => {
    const { apply } = createFixture({ players: 1 });

    const btnPlayer1 = document.querySelector<HTMLButtonElement>('#opt-players [data-players="1"]');
    const btnPlayer2 = document.querySelector<HTMLButtonElement>('#opt-players [data-players="2"]');

    btnPlayer2?.click();

    expect(btnPlayer1?.getAttribute('aria-pressed')).toBe('false');
    expect(btnPlayer2?.getAttribute('aria-pressed')).toBe('true');
    expect(apply).toHaveBeenCalledWith(expect.objectContaining({ players: 2 }));
  });

  it('Tipp auf Spielmodus ruft apply mit geändertem Modus und setzt aria-pressed', () => {
    const { apply } = createFixture({ mode: 'original' });

    const btnOriginal = document.querySelector<HTMLButtonElement>('#opt-mode [data-mode="original"]');
    const btnClassic = document.querySelector<HTMLButtonElement>('#opt-mode [data-mode="classic"]');

    btnClassic?.click();

    expect(btnOriginal?.getAttribute('aria-pressed')).toBe('false');
    expect(btnClassic?.getAttribute('aria-pressed')).toBe('true');
    expect(apply).toHaveBeenCalledWith(expect.objectContaining({ mode: 'classic' }));
  });

  it('Änderung an Ton- und Vibrations-Checkboxen ruft apply', () => {
    const { apply } = createFixture({ sound: true, vibration: true });

    const soundBox = document.getElementById('opt-sound') as HTMLInputElement;
    const vibrationBox = document.getElementById('opt-vibration') as HTMLInputElement;

    soundBox.checked = false;
    soundBox.dispatchEvent(new Event('change'));
    expect(apply).toHaveBeenCalledWith(expect.objectContaining({ sound: false }));

    vibrationBox.checked = false;
    vibrationBox.dispatchEvent(new Event('change'));
    expect(apply).toHaveBeenCalledWith(expect.objectContaining({ vibration: false }));
  });

  it('übernimmt, was die Leiste inzwischen gestellt hat (Tier, Zähne), statt den Stand vom Start', () => {
    const { store, apply } = createFixture({ creature: 'crocodile', teethOverride: null });
    store.set({ ...store.get(), creature: 'wolf', teethOverride: 6 });

    document.querySelector<HTMLButtonElement>('#opt-players [data-players="2"]')?.click();
    (document.getElementById('opt-sound') as HTMLInputElement).click();

    expect(apply).toHaveBeenLastCalledWith(
      expect.objectContaining({ creature: 'wolf', teethOverride: 6, players: 2, sound: false }),
    );
  });

  it('sperrt Wackeln und zeigt Hinweis, wenn Haptics nicht unterstützt wird', () => {
    createFixture({ vibration: true }, false);

    const vibrationBox = document.getElementById('opt-vibration') as HTMLInputElement;
    const vibrationHint = document.getElementById('vibration-hint') as HTMLElement;

    expect(vibrationBox.checked).toBe(false);
    expect(vibrationBox.disabled).toBe(true);
    expect(vibrationHint.hidden).toBe(false);
    expect(vibrationHint.textContent).toBe('Dieser Browser kann nicht wackeln (z. B. Safari auf dem iPhone).');
  });
});
