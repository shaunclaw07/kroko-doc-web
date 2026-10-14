import type { HapticsPort } from '../../core/ports/haptics';
import type { GameSettings } from '../../infrastructure/storage/localStorageSettings';

export interface WireSettingsSheetDeps {
  doc: Document;
  settings: GameSettings;
  haptics: HapticsPort;
  apply: (next: GameSettings) => void;
}

/**
 * Verdrahtet das Einstellungsblatt (#settings-sheet) mit den Optionen für Spielerzahl,
 * Spielmodus, Ton und Vibration.
 */
export function wireSettingsSheet({ doc, settings, haptics, apply }: WireSettingsSheetDeps): void {
  let current: GameSettings = { ...settings };

  const soundBox = doc.getElementById('opt-sound') as HTMLInputElement | null;
  const vibrationBox = doc.getElementById('opt-vibration') as HTMLInputElement | null;
  if (soundBox) {
    soundBox.checked = current.sound;
  }
  if (vibrationBox) {
    vibrationBox.checked = current.vibration;
  }

  // Ehrlich statt still: kann der Browser nicht vibrieren (Safari auf iOS), sagen wir es und
  // schalten den Griff ab — sonst sucht man den Fehler beim Handy oder im Spiel.
  const vibrationHint = doc.getElementById('vibration-hint');
  if (vibrationBox && !haptics.isSupported()) {
    vibrationBox.checked = false;
    vibrationBox.disabled = true;
    if (vibrationHint) {
      vibrationHint.hidden = false;
      vibrationHint.textContent = 'Dieser Browser kann nicht wackeln (z. B. Safari auf dem iPhone).';
    }
  }

  doc.querySelectorAll<HTMLButtonElement>('#opt-players [data-players]').forEach((button) => {
    button.setAttribute('aria-pressed', String(Number(button.dataset.players) === current.players));
    button.addEventListener('click', () => {
      doc
        .querySelectorAll('#opt-players [data-players]')
        .forEach((other) => other.setAttribute('aria-pressed', 'false'));
      button.setAttribute('aria-pressed', 'true');
      current = { ...current, players: Number(button.dataset.players ?? '1') };
      apply(current);
    });
  });

  doc.querySelectorAll<HTMLButtonElement>('#opt-mode [data-mode]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.mode === current.mode));
    button.addEventListener('click', () => {
      doc
        .querySelectorAll('#opt-mode [data-mode]')
        .forEach((other) => other.setAttribute('aria-pressed', 'false'));
      button.setAttribute('aria-pressed', 'true');
      current = { ...current, mode: button.dataset.mode === 'classic' ? 'classic' : 'original' };
      apply(current);
    });
  });

  soundBox?.addEventListener('change', () => {
    current = { ...current, sound: soundBox.checked };
    apply(current);
  });

  vibrationBox?.addEventListener('change', () => {
    current = { ...current, vibration: vibrationBox.checked };
    apply(current);
  });
}
