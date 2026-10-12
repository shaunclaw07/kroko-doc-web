import type {
  AudioBufferLike,
  AudioBufferSourceNodeLike,
  AudioContextLike,
  AudioNodeLike,
  AudioParamLike,
  GainNodeLike,
  OscillatorNodeLike,
} from '../audio/webAudioEngine';

export type FakeNodeKind = 'gain' | 'oscillator' | 'bufferSource';

export type FakeParamMethod = 'setValueAtTime' | 'linearRampToValueAtTime' | 'exponentialRampToValueAtTime';

/** Eine protokollierte Parameteränderung (Hüllkurve, Tonhöhe, Rate, Tremolo). */
export interface FakeParamEvent {
  readonly nodeId: number;
  readonly nodeKind: FakeNodeKind;
  readonly param: string;
  readonly method: FakeParamMethod;
  readonly value: number;
  readonly time: number;
}

/** Gemeinsame Felder aller startbaren Quellen — so kann der Test "läuft noch?" abfragen. */
interface FakeSourceNode {
  readonly id: number;
  started: boolean;
  stopped: boolean;
  startTime: number | null;
  stopTime: number | null;
  isRunning(now: number): boolean;
}

export type FakeSource = (FakeOscillatorNode | FakeBufferSourceNode) & FakeSourceNode;

/** Protokolliert alle Aufrufe und geplanten Parameteränderungen — Grundlage der Klangtests. */
export class FakeAudioParam implements AudioParamLike {
  value = 0;

  constructor(
    private readonly context: FakeAudioContext,
    private readonly ownerId: number,
    private readonly ownerKind: FakeNodeKind,
    private readonly name: string,
  ) {}

  setValueAtTime(value: number, startTime: number): void {
    this.record('setValueAtTime', value, startTime);
  }

  linearRampToValueAtTime(value: number, endTime: number): void {
    this.record('linearRampToValueAtTime', value, endTime);
  }

  exponentialRampToValueAtTime(value: number, endTime: number): void {
    this.record('exponentialRampToValueAtTime', value, endTime);
  }

  private record(method: FakeParamMethod, value: number, time: number): void {
    this.value = value;
    this.context.paramEvents.push({
      nodeId: this.ownerId,
      nodeKind: this.ownerKind,
      param: this.name,
      method,
      value,
      time,
    });
  }
}

export class FakeGainNode implements GainNodeLike {
  readonly kind: FakeNodeKind = 'gain';
  readonly id: number;
  readonly gain: FakeAudioParam;
  readonly connections: AudioNodeLike[] = [];
  disconnected = false;

  constructor(private readonly context: FakeAudioContext) {
    this.id = context.nextNodeId();
    this.gain = new FakeAudioParam(context, this.id, 'gain', 'gain');
    context.createdNodes.push(this);
  }

  connect(target: AudioNodeLike): void {
    this.connections.push(target);
  }

  disconnect(): void {
    this.disconnected = true;
  }
}

export class FakeOscillatorNode implements OscillatorNodeLike {
  readonly kind: FakeNodeKind = 'oscillator';
  readonly id: number;
  type = 'sine';
  readonly frequency: FakeAudioParam;
  readonly detune: FakeAudioParam;
  started = false;
  stopped = false;
  startTime: number | null = null;
  stopTime: number | null = null;
  readonly connections: AudioNodeLike[] = [];
  disconnected = false;

  constructor(private readonly context: FakeAudioContext) {
    this.id = context.nextNodeId();
    this.frequency = new FakeAudioParam(context, this.id, 'oscillator', 'frequency');
    this.detune = new FakeAudioParam(context, this.id, 'oscillator', 'detune');
    context.createdNodes.push(this);
  }

  connect(target: AudioNodeLike): void {
    this.connections.push(target);
  }

  disconnect(): void {
    this.disconnected = true;
  }

  start(when = 0): void {
    this.started = true;
    this.startTime = when;
    this.context.startedSources.push(this);
  }

  stop(when = 0): void {
    this.stopped = true;
    this.stopTime = when;
  }

  isRunning(now: number): boolean {
    return this.started && (this.stopTime === null || this.stopTime > now);
  }
}

export class FakeBufferSourceNode implements AudioBufferSourceNodeLike {
  readonly kind: FakeNodeKind = 'bufferSource';
  readonly id: number;
  buffer: AudioBufferLike | null = null;
  readonly playbackRate: FakeAudioParam;
  started = false;
  stopped = false;
  startTime: number | null = null;
  stopTime: number | null = null;
  readonly connections: AudioNodeLike[] = [];
  disconnected = false;

  constructor(private readonly context: FakeAudioContext) {
    this.id = context.nextNodeId();
    this.playbackRate = new FakeAudioParam(context, this.id, 'bufferSource', 'playbackRate');
    context.createdNodes.push(this);
  }

  connect(target: AudioNodeLike): void {
    this.connections.push(target);
  }

  disconnect(): void {
    this.disconnected = true;
  }

  start(when = 0): void {
    this.started = true;
    this.startTime = when;
    this.context.startedSources.push(this);
  }

  stop(when = 0): void {
    this.stopped = true;
    this.stopTime = when;
  }

  isRunning(now: number): boolean {
    return this.started && (this.stopTime === null || this.stopTime > now);
  }
}

export class FakeAudioBuffer implements AudioBufferLike {
  readonly numberOfChannels: number;
  readonly length: number;
  readonly sampleRate: number;
  private readonly channels: Float32Array[] = [];

  constructor(numberOfChannels: number, length: number, sampleRate: number) {
    this.numberOfChannels = numberOfChannels;
    this.length = length;
    this.sampleRate = sampleRate;
    for (let channel = 0; channel < numberOfChannels; channel += 1) {
      this.channels.push(new Float32Array(length));
    }
  }

  getChannelData(channel: number): Float32Array {
    return this.channels[channel] ?? new Float32Array(this.length);
  }
}

/** Endstation: nimmt Verbindungen an, wird selbst aber nicht protokolliert. */
class FakeDestinationNode implements AudioNodeLike {
  readonly connections: AudioNodeLike[] = [];

  connect(target: AudioNodeLike): void {
    this.connections.push(target);
  }

  disconnect(): void {
    // Zielknoten hat nichts zu trennen.
  }
}

/**
 * Fake-AudioContext für Node-Tests: protokolliert erzeugte Knoten, Starts/Stops und alle
 * geplanten Parameteränderungen. Die Zeit steht still (currentTime = 0), damit Tests die
 * geplanten Zeiten deterministisch vergleichen können.
 */
export class FakeAudioContext implements AudioContextLike {
  currentTime = 0;
  sampleRate = 48000;
  state = 'running';
  readonly destination: AudioNodeLike = new FakeDestinationNode();
  resumeCallCount = 0;
  decodedCount = 0;
  readonly createdNodes: Array<FakeGainNode | FakeOscillatorNode | FakeBufferSourceNode> = [];
  readonly startedSources: FakeSource[] = [];
  readonly paramEvents: FakeParamEvent[] = [];
  readonly buffers: FakeAudioBuffer[] = [];
  private nodeCounter = 0;

  nextNodeId(): number {
    this.nodeCounter += 1;
    return this.nodeCounter;
  }

  createGain(): GainNodeLike {
    return new FakeGainNode(this);
  }

  createOscillator(): OscillatorNodeLike {
    return new FakeOscillatorNode(this);
  }

  createBufferSource(): AudioBufferSourceNodeLike {
    return new FakeBufferSourceNode(this);
  }

  createBuffer(numberOfChannels: number, length: number, sampleRate: number): AudioBufferLike {
    const buffer = new FakeAudioBuffer(numberOfChannels, length, sampleRate);
    this.buffers.push(buffer);
    return buffer;
  }

  /** Dekodieren kostet im Test nichts: ein Byte gilt als ein Abtastwert (24 000 Byte = 0,5 s). */
  decodeAudioData(data: ArrayBuffer): Promise<AudioBufferLike> {
    this.decodedCount += 1;
    return Promise.resolve(new FakeAudioBuffer(1, Math.max(1, data.byteLength), this.sampleRate));
  }

  resume(): Promise<void> {
    this.resumeCallCount += 1;
    this.state = 'running';
    return Promise.resolve();
  }

  /** Anzahl der über die create*-Methoden erzeugten Knoten. */
  nodeCount(): number {
    return this.createdNodes.length;
  }

  /** Alle Quellen, die laut geplantem stop() zum aktuellen Zeitpunkt noch laufen. */
  runningSources(): FakeSource[] {
    return this.startedSources.filter((source) => source.isRunning(this.currentTime));
  }
}
