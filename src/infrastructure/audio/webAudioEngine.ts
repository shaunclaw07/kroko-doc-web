import type { SoundName, SoundPort } from '../../core/ports/sound';

/** Strukturelle Minimalschnittstelle eines AudioParameters (für Hüllkurven und Tonhöhen). */
export interface AudioParamLike {
  value: number;
  setValueAtTime(value: number, startTime: number): void;
  linearRampToValueAtTime(value: number, endTime: number): void;
  exponentialRampToValueAtTime(value: number, endTime: number): void;
}

/** Knoten, der in einen anderen Knoten bzw. das Ziel gemischt wird. */
export interface AudioNodeLike {
  connect(target: AudioNodeLike): void;
  disconnect(): void;
}

/** Quelle mit festem Lebenszeitraum (Oszillator oder Pufferquelle). */
export interface AudioScheduledSourceNodeLike extends AudioNodeLike {
  start(when?: number): void;
  stop(when?: number): void;
}

export interface OscillatorNodeLike extends AudioScheduledSourceNodeLike {
  type: string;
  frequency: AudioParamLike;
  detune: AudioParamLike;
}

export interface GainNodeLike extends AudioNodeLike {
  gain: AudioParamLike;
}

export interface AudioBufferLike {
  readonly length: number;
  readonly sampleRate: number;
  readonly numberOfChannels: number;
  getChannelData(channel: number): Float32Array;
}

export interface AudioBufferSourceNodeLike extends AudioScheduledSourceNodeLike {
  buffer: AudioBufferLike | null;
  playbackRate: AudioParamLike;
}

/** Strukturelle Minimalschnittstelle eines AudioContext — im Test durch einen Fake ersetzt. */
export interface AudioContextLike {
  readonly currentTime: number;
  readonly sampleRate: number;
  readonly state: string;
  readonly destination: AudioNodeLike;
  createGain(): GainNodeLike;
  createOscillator(): OscillatorNodeLike;
  createBufferSource(): AudioBufferSourceNodeLike;
  createBuffer(numberOfChannels: number, length: number, sampleRate: number): AudioBufferLike;
  resume(): Promise<void>;
}

export interface WebAudioEngineOptions {
  /** Kontext-Fabrik; Standard ist der Browser-Audio-Kontext. */
  createContext?: () => AudioContextLike | null;
  /** Startet stumm, wenn true. */
  muted?: boolean;
}

/**
 * Einziger Cast im Modul: window.AudioContext -> AudioContextLike.
 * Liefert null, wenn es keinen Browser-Audio-Kontext gibt.
 */
export function createBrowserAudioContext(): AudioContextLike | null {
  // Einziger Cast im Modul: der Browser-eigene AudioContext erfüllt die strukturelle
  // Schnittstelle zur Laufzeit, ist ohne DOM-Kontext aber nicht so deklariert. Über
  // globalThis, damit derselbe Zugriff auch das webkit-Präfix erfassen kann (altes iOS
  // und manche WebViews liefern nur window.webkitAudioContext).
  const scope = globalThis as { AudioContext?: new () => AudioContextLike; webkitAudioContext?: new () => AudioContextLike };
  const ctor = scope.AudioContext ?? scope.webkitAudioContext;
  if (typeof ctor !== 'function') return null;
  try {
    return new ctor();
  } catch {
    return null;
  }
}

/** Exponentielle Rampen dürfen nie auf exakt 0 laufen — dieser Wert steht für "still". */
const SILENCE = 0.0001;
/** Neutrale Intensität, wenn der Aufrufer keine angibt. */
const DEFAULT_INTENSITY = 0.5;

/**
 * Erzeugt alle Spielklänge synthetisch (keine Audiodateien). Der Kontext entsteht erst bei
 * der ersten Nutzung, damit die Browser-Audio-Sperre greift. Fehlt die Audio-Unterstützung,
 * bleibt das Spiel stumm, ohne je zu werfen.
 */
export class WebAudioEngine implements SoundPort {
  private readonly createContext: () => AudioContextLike | null;
  private readonly active = new Set<AudioScheduledSourceNodeLike>();
  private context: AudioContextLike | null = null;
  private muted: boolean;
  private tension = 0;
  private resumeRequested = false;

  constructor(options: WebAudioEngineOptions = {}) {
    this.createContext = options.createContext ?? createBrowserAudioContext;
    this.muted = options.muted ?? false;
  }

  play(name: SoundName, intensity: number = DEFAULT_INTENSITY): void {
    if (this.muted) return; // stumm: kein Knoten, kein Ton
    const context = this.ensureContext();
    if (context === null) return;
    const now = context.currentTime;
    const level = this.clamp01(intensity);
    try {
      switch (name) {
        case 'tap':
          this.playTap(context, now, level);
          break;
        case 'creak':
          this.playCreak(context, now, level);
          break;
        case 'heartbeat':
          this.playHeartbeat(context, now);
          break;
        case 'twitch':
          this.playTwitch(context, now, level);
          break;
        case 'snap':
          this.playSnap(context, now, level);
          break;
        case 'win':
          this.playWin(context, now, level);
          break;
        case 'lose':
          this.playLose(context, now);
          break;
      }
    } catch {
      // Fehlende Audio-Unterstützung darf das Spiel niemals abbrechen.
    }
  }

  setTension(level: number): void {
    this.tension = this.clamp01(level);
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  stopAll(): void {
    const when = this.context === null ? 0 : this.context.currentTime;
    for (const source of this.active) {
      try {
        source.stop(when);
      } catch {
        // Quelle war bereits beendet.
      }
      try {
        source.disconnect();
      } catch {
        // Quelle war bereits getrennt.
      }
    }
    this.active.clear();
  }

  unlock(): void {
    const context = this.ensureContext();
    if (context === null) return;
    if (this.resumeRequested) return; // resume() höchstens einmal wirksam
    this.resumeRequested = true;
    try {
      const resume = context.resume();
      if (resume && typeof resume.catch === 'function') {
        resume.catch(() => {
          // Sperre bleibt bestehen — das Spiel läuft stumm weiter.
        });
      }
    } catch {
      // resume() darf niemals nach außen werfen.
    }
  }

  /** Erzeugt den Kontext beim ersten Bedarf; Fehler der Fabrik werden zu null. */
  private ensureContext(): AudioContextLike | null {
    if (this.context !== null) return this.context;
    let created: AudioContextLike | null = null;
    try {
      created = this.createContext();
    } catch {
      created = null;
    }
    if (created === null) return null;
    this.context = created;
    return created;
  }

  private clamp01(value: number): number {
    if (!Number.isFinite(value)) return 0;
    if (value <= 0) return 0;
    if (value >= 1) return 1;
    return value;
  }

  private startSource(source: AudioScheduledSourceNodeLike, startTime: number, duration: number): void {
    source.start(startTime);
    source.stop(startTime + duration);
    this.active.add(source);
  }

  private createNoiseBuffer(context: AudioContextLike, seconds: number): AudioBufferLike {
    const length = Math.max(1, Math.floor(context.sampleRate * seconds));
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) {
      data[index] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /** tap: kurzer, trockener Klick — sehr kurzes Rauschen mit steiler Hüllkurve. */
  private playTap(context: AudioContextLike, now: number, level: number): void {
    const duration = 0.03;
    const peak = 0.28 + level * 0.14;
    const source = context.createBufferSource();
    source.buffer = this.createNoiseBuffer(context, duration);
    const gain = context.createGain();
    gain.gain.setValueAtTime(peak, now);
    gain.gain.exponentialRampToValueAtTime(SILENCE, now + duration);
    source.connect(gain);
    gain.connect(context.destination);
    this.startSource(source, now, duration);
  }

  /** creak: knarrende Säge mit leicht steigender Tonhöhe und Tremolo; Dauer ~0,3 s. */
  private playCreak(context: AudioContextLike, now: number, level: number): void {
    const duration = 0.3;
    const baseFrequency = 170 + this.tension * 160; // Tonhöhe wächst mit der Spannung
    const peak = 0.05 + this.tension * 0.12; // Lautstärke wächst mit der Spannung
    const oscillator = context.createOscillator();
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(baseFrequency, now);
    oscillator.frequency.linearRampToValueAtTime(baseFrequency * (1.15 + level * 0.1), now + duration);
    const gain = context.createGain();
    gain.gain.setValueAtTime(peak, now);
    // Tremolo per gestaffelter Hüllkurve: das Rattern der rostigen Feder.
    const steps = 10;
    for (let step = 1; step <= steps; step += 1) {
      const at = now + (duration * step) / steps;
      const loud = step % 2 === 0 ? peak : peak * 0.35;
      gain.gain.linearRampToValueAtTime(loud, at);
    }
    gain.gain.linearRampToValueAtTime(SILENCE, now + duration + 0.02);
    oscillator.connect(gain);
    gain.connect(context.destination);
    this.startSource(oscillator, now, duration + 0.02);
  }

  /** heartbeat: zwei tiefe Sinus-Stöße (lub-dub); höhere Spannung = engere und lautere Schläge. */
  private playHeartbeat(context: AudioContextLike, now: number): void {
    const gap = 0.34 - this.tension * 0.22; // höhere Spannung -> schnellere Schläge
    const lubFrequency = 88 + this.tension * 6;
    const dubFrequency = 68 + this.tension * 6;
    const lubGain = 0.28 + this.tension * 0.4;
    const dubGain = 0.22 + this.tension * 0.34;
    this.thump(context, now, lubFrequency, lubGain, 0.18);
    this.thump(context, now + gap, dubFrequency, dubGain, 0.22);
  }

  /** Ein einzelner Herzstoß: kurz tief absackende Sinus-Welle mit weichem Anschlag. */
  private thump(context: AudioContextLike, at: number, frequency: number, peak: number, duration: number): void {
    const oscillator = context.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency * 1.6, at);
    oscillator.frequency.exponentialRampToValueAtTime(frequency, at + 0.05);
    const gain = context.createGain();
    gain.gain.setValueAtTime(SILENCE, at);
    gain.gain.linearRampToValueAtTime(peak, at + 0.012);
    gain.gain.exponentialRampToValueAtTime(SILENCE, at + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    this.startSource(oscillator, at, duration);
  }

  /** twitch: sehr kurzer, heller Blip — das Maul zuckt, schnappt aber nicht. */
  private playTwitch(context: AudioContextLike, now: number, level: number): void {
    const duration = 0.06;
    const frequency = 1500 + level * 700;
    const oscillator = context.createOscillator();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.4, now + duration);
    const gain = context.createGain();
    gain.gain.setValueAtTime(SILENCE, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(SILENCE, now + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    this.startSource(oscillator, now, duration);
  }

  /** snap: das Zuschnappen — Rauschburst mit steil abfallender Tonhöhe, hart und laut. */
  private playSnap(context: AudioContextLike, now: number, level: number): void {
    const duration = 0.18;
    const noise = context.createBufferSource();
    noise.buffer = this.createNoiseBuffer(context, duration);
    noise.playbackRate.setValueAtTime(2.4 + level * 0.6, now);
    noise.playbackRate.exponentialRampToValueAtTime(0.25, now + duration);
    const noiseGain = context.createGain();
    noiseGain.gain.setValueAtTime(0.9, now);
    noiseGain.gain.exponentialRampToValueAtTime(SILENCE, now + duration);
    noise.connect(noiseGain);
    noiseGain.connect(context.destination);
    this.startSource(noise, now, duration);

    // Tiefer "Chomp"-Stoß untermauert den Biss.
    const thud = context.createOscillator();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(150, now);
    thud.frequency.exponentialRampToValueAtTime(45, now + 0.12);
    const thudGain = context.createGain();
    thudGain.gain.setValueAtTime(0.6, now);
    thudGain.gain.exponentialRampToValueAtTime(SILENCE, now + 0.12);
    thud.connect(thudGain);
    thudGain.connect(context.destination);
    this.startSource(thud, now, 0.12);
  }

  /** win: helle, aufsteigende Dreiklangsfolge (C5-E5-G5). */
  private playWin(context: AudioContextLike, now: number, level: number): void {
    const notes = [523.25, 659.25, 783.99];
    const step = 0.09;
    for (let index = 0; index < notes.length; index += 1) {
      const frequency = notes[index] ?? 523.25;
      this.chime(context, now + index * step, frequency, 0.22 + level * 0.06, 0.22, 'triangle');
    }
  }

  /** lose: absteigende, dumpfe Tonfolge. */
  private playLose(context: AudioContextLike, now: number): void {
    const notes = [330, 262, 196, 147];
    const step = 0.14;
    for (let index = 0; index < notes.length; index += 1) {
      const frequency = notes[index] ?? 147;
      this.chime(context, now + index * step, frequency, 0.2, 0.3, 'sine');
    }
  }

  /** Einzelner Klangbaustein für win/lose: weicher Anschlag, dann exponentiell ausklingend. */
  private chime(
    context: AudioContextLike,
    at: number,
    frequency: number,
    peak: number,
    duration: number,
    type: string,
  ): void {
    const oscillator = context.createOscillator();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, at);
    const gain = context.createGain();
    gain.gain.setValueAtTime(SILENCE, at);
    gain.gain.linearRampToValueAtTime(peak, at + 0.01);
    gain.gain.exponentialRampToValueAtTime(SILENCE, at + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    this.startSource(oscillator, at, duration);
  }
}
