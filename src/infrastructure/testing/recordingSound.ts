import type { SoundName, SoundPort } from '../../core/ports/sound';

export interface SoundEvent {
  name: SoundName;
  intensity: number;
}

/** Klangattrappe für Tests: schreibt mit, was gespielt worden wäre. */
export class RecordingSound implements SoundPort {
  readonly events: SoundEvent[] = [];
  readonly tensions: number[] = [];
  stopAllCalls = 0;
  unlockCalls = 0;
  private muted = false;

  play(name: SoundName, intensity = 0): void {
    if (this.muted) {
      return;
    }
    this.events.push({ name, intensity });
  }

  setTension(level: number): void {
    this.tensions.push(level);
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  stopAll(): void {
    this.stopAllCalls += 1;
  }

  unlock(): void {
    this.unlockCalls += 1;
  }

  names(): SoundName[] {
    return this.events.map((event) => event.name);
  }
}
