import type { SoundName, SoundPort } from '../../core/ports/sound';
import { CREATURE_VOICE_FILES, voiceUrl } from './creatureVoices';

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
  /**
   * Dekodiert eine Tondatei. Neuere Browser geben eine Zusage zurück, ältere Safari-Fassungen
   * rufen nur die Rückrufe — die Engine bedient beides.
   */
  decodeAudioData(
    data: ArrayBuffer,
    onDecoded?: (buffer: AudioBufferLike) => void,
    onError?: (error: unknown) => void,
  ): Promise<AudioBufferLike> | void;
  resume(): Promise<void>;
}

export interface WebAudioEngineOptions {
  /** Kontext-Fabrik; Standard ist der Browser-Audio-Kontext. */
  createContext?: () => AudioContextLike | null;
  /** Startet stumm, wenn true. */
  muted?: boolean;
  /** Holt die Datei einer Tierstimme; `null` heißt: gibt es nicht. Standard: `createVoiceLoader`. */
  loadVoice?: (creatureId: string) => Promise<ArrayBuffer | null>;
  /** Basis-Pfad der Seite mit Schluss-Schrägstrich (`import.meta.env.BASE_URL`). Ohne ihn bleiben die Tiere still. */
  voiceBaseUrl?: string;
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

/** Holt Stimmdateien vom eigenen Ursprung. Eine Fehlantwort oder ein unbekanntes Tier ergibt `null`. */
export function createVoiceLoader(baseUrl: string): (creatureId: string) => Promise<ArrayBuffer | null> {
  return async (creatureId) => {
    const url = voiceUrl(baseUrl, creatureId);
    if (url === null || typeof fetch !== 'function') return null;
    const response = await fetch(url);
    return response.ok ? response.arrayBuffer() : null;
  };
}

/** Lautstärke der Tierstimmen — unter dem Biss (0,9), damit sich kein Kind erschreckt. */
export const VOICE_GAIN = 0.6;
/** So spät darf eine Stimme nach ihrem Anlass noch kommen (Sekunden); danach wäre sie ein Fremdkörper. */
export const VOICE_LATE_LIMIT_S = 0.5;

function decode(context: AudioContextLike, bytes: ArrayBuffer): Promise<AudioBufferLike> {
  return new Promise((resolve, reject) => {
    const result = context.decodeAudioData(bytes, resolve, reject);
    if (result && typeof result.then === 'function') {
      result.then(resolve, reject);
    }
  });
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
  /** Erst nach der ersten Nutzergeste wird überhaupt etwas geplant (siehe `play`). */
  private unlocked = false;
  private readonly loadVoice: (creatureId: string) => Promise<ArrayBuffer | null>;
  /** Fertig dekodierte Stimmen. */
  private readonly voices = new Map<string, AudioBufferLike>();
  /** Laufende Abrufe — damit keine Datei zweimal zugleich geholt wird. */
  private readonly voiceLoads = new Map<string, Promise<AudioBufferLike | null>>();
  private voicesRequested = false;
  /** Zählt `stopAll()`: eine Stimme, die danach erst fertig lädt, gehört zu einem alten Anlass. */
  private voiceEpoch = 0;

  constructor(options: WebAudioEngineOptions = {}) {
    this.createContext = options.createContext ?? createBrowserAudioContext;
    this.muted = options.muted ?? false;
    const baseUrl = options.voiceBaseUrl;
    this.loadVoice =
      options.loadVoice ?? (baseUrl === undefined ? () => Promise.resolve(null) : createVoiceLoader(baseUrl));
  }

  play(name: SoundName, intensity: number = DEFAULT_INTENSITY): void {
    if (this.muted) return; // stumm: kein Knoten, kein Ton
    // Vor der ersten Nutzergeste hält der Browser den Kontext an: seine Uhr steht, und alles, was
    // jetzt geplant wird, startet beim Freigeben **gleichzeitig** (gemessen mit dem früheren
    // Herzschlag: nach 20 s Leerlauf lagen 50 Schläge übereinander, Spitzenpegel 6,6 statt 0,26).
    if (!this.unlocked) return;
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
        case 'twitch':
          this.playTwitch(context, now, level);
          break;
        case 'snap':
          this.playSnap(context, now, level);
          break;
        case 'breath':
          this.playBreath(context, now, level);
          break;
        case 'settle':
          this.playSettle(context, now, level);
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

  playVoice(creatureId: string): void {
    // Dieselben Sperren wie in `play`: stumm heißt kein Knoten und kein Abruf, und vor der ersten
    // Nutzergeste passiert nichts.
    if (this.muted || !this.unlocked) return;
    const context = this.ensureContext();
    if (context === null) return;
    const ready = this.voices.get(creatureId);
    if (ready !== undefined) {
      this.startVoice(context, ready);
      return;
    }
    // Noch nicht da (das Tier wurde mit der allerersten Geste gewählt): nachreichen — aber nur,
    // solange der Anlass noch gilt.
    const epoch = this.voiceEpoch;
    const asked = context.currentTime;
    void this.fetchVoice(context, creatureId).then((buffer) => {
      if (buffer === null || this.muted || epoch !== this.voiceEpoch) return;
      if (context.currentTime - asked > VOICE_LATE_LIMIT_S) return;
      this.startVoice(context, buffer);
    });
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
    this.voiceEpoch += 1;
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
    this.unlocked = true;
    const context = this.ensureContext();
    if (context === null) return;
    this.requestVoices(context);
    // Nicht „höchstens einmal": die erste Geste kann eine sein, die der Browser nicht als Freigabe
    // zählt, und ein laufender Kontext kann wieder angehalten werden (iOS nach Anruf oder Sperre).
    if (context.state === 'running') return;
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

  /** Holt nach der ersten Geste alle Stimmen im Hintergrund — einmal, und nur bei eingeschaltetem Ton. */
  private requestVoices(context: AudioContextLike): void {
    if (this.voicesRequested || this.muted) return;
    this.voicesRequested = true;
    for (const creatureId of Object.keys(CREATURE_VOICE_FILES)) {
      void this.fetchVoice(context, creatureId);
    }
  }

  /** Lädt und dekodiert eine Stimme. Ein Fehlschlag wird nicht gemerkt: der nächste Anlass versucht es erneut. */
  private fetchVoice(context: AudioContextLike, creatureId: string): Promise<AudioBufferLike | null> {
    const running = this.voiceLoads.get(creatureId);
    if (running !== undefined) return running;
    const load = Promise.resolve()
      .then(() => this.loadVoice(creatureId))
      .then((bytes) => (bytes === null ? null : decode(context, bytes)))
      .catch(() => null)
      .then((buffer) => {
        this.voiceLoads.delete(creatureId);
        if (buffer !== null) this.voices.set(creatureId, buffer);
        return buffer;
      });
    this.voiceLoads.set(creatureId, load);
    return load;
  }

  private startVoice(context: AudioContextLike, buffer: AudioBufferLike): void {
    try {
      const now = context.currentTime;
      const source = context.createBufferSource();
      source.buffer = buffer;
      const gain = context.createGain();
      gain.gain.setValueAtTime(VOICE_GAIN, now);
      source.connect(gain);
      gain.connect(context.destination);
      this.startSource(source, now, buffer.length / buffer.sampleRate);
    } catch {
      // Fehlende Audio-Unterstützung darf das Spiel niemals abbrechen.
    }
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

  /** Ein einzelner dumpfer Stoß: kurz tief absackende Sinus-Welle mit weichem Anschlag. */
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

  /** breath: langer, weicher Atemzug — Rauschen mit träger Hüllkurve füllt die Pause aus. */
  private playBreath(context: AudioContextLike, now: number, level: number): void {
    const duration = 0.45 + level * 0.25;
    const source = context.createBufferSource();
    source.buffer = this.createNoiseBuffer(context, duration);
    source.playbackRate.setValueAtTime(0.5 + level * 0.3, now);
    const gain = context.createGain();
    const peak = 0.06 + this.tension * 0.1;
    gain.gain.setValueAtTime(SILENCE, now);
    gain.gain.linearRampToValueAtTime(peak, now + duration * 0.35); // einatmen
    gain.gain.linearRampToValueAtTime(peak * 0.5, now + duration * 0.75);
    gain.gain.exponentialRampToValueAtTime(SILENCE, now + duration); // ausatmen
    source.connect(gain);
    gain.connect(context.destination);
    this.startSource(source, now, duration);
  }

  /** settle: die Feder kommt zur Ruhe — leiser Klick mit kurzem, tiefem Nachklang. */
  private playSettle(context: AudioContextLike, now: number, level: number): void {
    const duration = 0.06;
    const source = context.createBufferSource();
    source.buffer = this.createNoiseBuffer(context, duration);
    source.playbackRate.setValueAtTime(0.9 + level * 0.4, now);
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.1 + level * 0.16, now);
    gain.gain.exponentialRampToValueAtTime(SILENCE, now + duration);
    source.connect(gain);
    gain.connect(context.destination);
    this.startSource(source, now, duration);
    // Das tiefe, kurze Zurücksinken des Kiefers darunter.
    this.thump(context, now + 0.01, 96 + level * 24, 0.12 + level * 0.2, 0.16 + level * 0.1);
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
