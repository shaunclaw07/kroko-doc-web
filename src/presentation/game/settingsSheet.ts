import type { HapticsPort } from '../../core/ports/haptics';
import type { GameSettings } from '../../core/domain/settings';
import type { SettingsStore } from './settingsStore';

export interface WireSettingsSheetDeps {
  doc: Document;
  /**
   * Der Speicher, nicht ein Abzug davon: jeder Griff baut auf dem Stand von **jetzt** auf. Eine
   * Kopie vom Seitenstart setzte beim nächsten Tipp hier Tier und Zahnzahl zurück, die die Leiste
   * inzwischen gestellt hat.
   */
  settings: SettingsStore;
  haptics: HapticsPort;
  apply: (next: GameSettings) => void;
}

/**
 * Verdrahtet das Einstellungsblatt (#settings-sheet) mit den Optionen für Spielerzahl,
 * Spielmodus, Ton und Vibration.
 */
export function wireSettingsSheet({ doc, settings, haptics, apply }: WireSettingsSheetDeps): void {
  const initial = settings.get();

  const soundBox = doc.getElementById('opt-sound') as HTMLInputElement | null;
  const vibrationBox = doc.getElementById('opt-vibration') as HTMLInputElement | null;
  if (soundBox) {
    soundBox.checked = initial.sound;
  }
  if (vibrationBox) {
    vibrationBox.checked = initial.vibration;
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
    button.setAttribute('aria-pressed', String(Number(button.dataset.players) === initial.players));
    button.addEventListener('click', () => {
      doc
        .querySelectorAll('#opt-players [data-players]')
        .forEach((other) => other.setAttribute('aria-pressed', 'false'));
      button.setAttribute('aria-pressed', 'true');
      apply({ ...settings.get(), players: Number(button.dataset.players ?? '1') });
    });
  });

  doc.querySelectorAll<HTMLButtonElement>('#opt-mode [data-mode]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.mode === initial.mode));
    button.addEventListener('click', () => {
      doc
        .querySelectorAll('#opt-mode [data-mode]')
        .forEach((other) => other.setAttribute('aria-pressed', 'false'));
      button.setAttribute('aria-pressed', 'true');
      apply({ ...settings.get(), mode: button.dataset.mode === 'classic' ? 'classic' : 'original' });
    });
  });

  soundBox?.addEventListener('change', () => {
    apply({ ...settings.get(), sound: soundBox.checked });
  });

  vibrationBox?.addEventListener('change', () => {
    apply({ ...settings.get(), vibration: vibrationBox.checked });
  });
}
