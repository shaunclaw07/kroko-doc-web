import { afterEach, describe, expect, it, vi } from 'vitest';
import { listCreatures } from '../../core/domain/creature';
import { VOICE_GAIN, WebAudioEngine, createBrowserAudioContext, createVoiceLoader } from './webAudioEngine';
import type { WebAudioEngineOptions } from './webAudioEngine';
import { FakeAudioContext } from '../testing/fakeAudioContext';

describe('createBrowserAudioContext', () => {
  const scope = globalThis as { AudioContext?: unknown; webkitAudioContext?: unknown };
  const before = scope.AudioContext;
  const beforeWebkit = scope.webkitAudioContext;

  afterEach(() => {
    scope.AudioContext = before;
    scope.webkitAudioContext = beforeWebkit;
  });

  it('nimmt den unpräfixierten AudioContext', () => {
    scope.webkitAudioContext = undefined;
    scope.AudioContext = FakeAudioContext;
    expect(createBrowserAudioContext()).toBeInstanceOf(FakeAudioContext);
  });

  it('fällt auf webkitAudioContext zurück (altes iOS, manche WebViews)', () => {
    scope.AudioContext = undefined;
    scope.webkitAudioContext = FakeAudioContext;
    expect(createBrowserAudioContext()).toBeInstanceOf(FakeAudioContext);
  });

  it('liefert null, wenn der Konstruktor wirft', () => {
    scope.webkitAudioContext = undefined;
    scope.AudioContext = class {
      constructor() {
        throw new Error('kein Audio erlaubt');
      }
    };
    expect(createBrowserAudioContext()).toBeNull();
  });
});

/**
 * Baut eine Engine auf einem frischen Fake-Kontext — so gehören alle Logs zu diesem Klang. Die
 * Engine ist **freigegeben** (`unlock`), wie nach der ersten Nutzergeste; was davor gilt, prüft der
 * Block „Freigabe".
 */
function makeEngine(options: WebAudioEngineOptions = {}): { engine: WebAudioEngine; audio: FakeAudioContext } {
  const audio = new FakeAudioContext();
  const engine = new WebAudioEngine({ ...options, createContext: () => audio });
  engine.unlock();
  return { engine, audio };
}

/** Ein Kontext, den der Browser noch anhält: `resume()` wird gezählt, ändert aber nichts. */
function blockedContext(): FakeAudioContext {
  const audio = new FakeAudioContext();
  audio.state = 'suspended';
  audio.resume = () => {
    audio.resumeCallCount += 1;
    return Promise.resolve();
  };
  return audio;
}

describe('Freigabe', () => {
  it('plant vor der ersten Nutzergeste nichts — nicht einmal einen Kontext', () => {
    let created = 0;
    const audio = new FakeAudioContext();
    const engine = new WebAudioEngine({
      createContext: () => {
        created += 1;
        return audio;
      },
    });
    for (let beat = 0; beat < 50; beat += 1) {
      engine.play('heartbeat');
    }
    engine.play('tap');
    expect(created).toBe(0);
    expect(audio.nodeCount()).toBe(0);

    engine.unlock();
    engine.play('heartbeat');
    expect(audio.nodeCount()).toBeGreaterThan(0);
  });

  it('staut keinen Herzschlag, solange der Kontext nicht läuft', () => {
    // Gemessen am 12.10.2026: 50 gestaute Schläge spielten beim ersten Tipp gleichzeitig.
    const audio = blockedContext();
    const engine = new WebAudioEngine({ createContext: () => audio });
    engine.unlock();
    for (let beat = 0; beat < 50; beat += 1) {
      engine.play('heartbeat');
    }
    expect(audio.nodeCount()).toBe(0);

    // Die Klänge eines Tipps werden geplant — der Tipp ist die Geste, die den Kontext startet.
    engine.play('tap');
    expect(audio.nodeCount()).toBeGreaterThan(0);

    const afterTap = audio.nodeCount();
    audio.state = 'running';
    engine.play('heartbeat');
    expect(audio.nodeCount()).toBeGreaterThan(afterTap);
  });

  it('bittet erneut um Freigabe, solange der Kontext nicht läuft — und nie, wenn er läuft', () => {
    const audio = blockedContext();
    const engine = new WebAudioEngine({ createContext: () => audio });
    engine.unlock();
    engine.unlock();
    expect(audio.resumeCallCount).toBe(2);

    audio.state = 'running';
    engine.unlock();
    expect(audio.resumeCallCount).toBe(2);

    // iOS hält den Kontext nach einem Anruf oder der Bildschirmsperre an.
    audio.state = 'interrupted';
    engine.unlock();
    expect(audio.resumeCallCount).toBe(3);
  });
});

/** Höchster geplanter Gain-Wert — Maß für "wie laut". */
function peakGain(audio: FakeAudioContext): number {
  let peak = 0;
  for (const event of audio.paramEvents) {
    if (event.param === 'gain' && event.value > peak) peak = event.value;
  }
  return peak;
}

/** Spätester geplanter Zeitpunkt — Maß für "wie lang". */
function furthestTime(audio: FakeAudioContext): number {
  let max = 0;
  for (const event of audio.paramEvents) {
    if (event.time > max) max = event.time;
  }
  return max;
}

describe('Klangdesign', () => {
  it('erzeugt beim Zuschnappen Knoten und startet sie; snap ist lauter und kürzer als creak', () => {
    const snap = makeEngine();
    snap.engine.play('snap', 1);
    expect(snap.audio.nodeCount()).toBeGreaterThan(0);
    expect(snap.audio.startedSources.length).toBeGreaterThan(0);
    expect(snap.audio.startedSources.every((source) => source.started)).toBe(true);

    const creak = makeEngine();
    creak.engine.setTension(1);
    creak.engine.play('creak', 1);

    expect(peakGain(snap.audio)).toBeGreaterThan(peakGain(creak.audio));
    expect(furthestTime(snap.audio)).toBeLessThan(furthestTime(creak.audio));
  });

  it('erzeugt bei Stummschaltung gar keinen Knoten und danach wieder', () => {
    const { engine, audio } = makeEngine();

    engine.setMuted(true);
    expect(engine.isMuted()).toBe(true);
    engine.play('tap');
    expect(audio.nodeCount()).toBe(0);

    engine.setMuted(false);
    expect(engine.isMuted()).toBe(false);
    engine.play('tap');
    expect(audio.nodeCount()).toBeGreaterThan(0);
  });

  it('macht den Herzschlag mit steigender Spannung schneller und lauter', () => {
    const calm = makeEngine();
    calm.engine.setTension(0);
    calm.engine.play('heartbeat');

    const tense = makeEngine();
    tense.engine.setTension(1);
    tense.engine.play('heartbeat');

    expect(furthestTime(tense.audio)).toBeLessThan(furthestTime(calm.audio));
    expect(peakGain(tense.audio)).toBeGreaterThan(peakGain(calm.audio));
  });

  it('beendet mit stopAll alle laufenden Quellen', () => {
    const { engine, audio } = makeEngine();
    engine.play('heartbeat');
    engine.play('win');
    expect(audio.runningSources().length).toBeGreaterThan(0);

    engine.stopAll();
    expect(audio.runningSources().length).toBe(0);
  });
});

describe('Robustheit', () => {
  it('wirft ohne verfügbaren AudioContext nirgends', () => {
    const engine = new WebAudioEngine({ createContext: () => null });
    expect(() => {
      engine.play('snap', 1);
      engine.play('creak');
      engine.play('heartbeat');
      engine.setTension(0.5);
      engine.setMuted(true);
      engine.setMuted(false);
      engine.stopAll();
      engine.unlock();
    }).not.toThrow();
    expect(typeof engine.isMuted()).toBe('boolean');
  });

  it('bleibt stumm, wenn resume() scheitert', async () => {
    const audio = new FakeAudioContext();
    audio.state = 'suspended';
    audio.resume = () => {
      audio.resumeCallCount += 1;
      return Promise.reject(new Error('not allowed'));
    };
    const engine = new WebAudioEngine({ createContext: () => audio });
    expect(() => engine.unlock()).not.toThrow();
    await Promise.resolve();
    expect(audio.resumeCallCount).toBe(1);
  });

  it('klemmt den Spannungspegel auf 0..1', () => {
    const below = makeEngine();
    below.engine.setTension(-5);
    below.engine.play('heartbeat');

    const zero = makeEngine();
    zero.engine.setTension(0);
    zero.engine.play('heartbeat');

    const above = makeEngine();
    above.engine.setTension(4);
    above.engine.play('heartbeat');

    const one = makeEngine();
    one.engine.setTension(1);
    one.engine.play('heartbeat');

    expect(furthestTime(below.audio)).toBeCloseTo(furthestTime(zero.audio), 6);
    expect(furthestTime(above.audio)).toBeCloseTo(furthestTime(one.audio), 6);
    expect(furthestTime(zero.audio)).not.toBeCloseTo(furthestTime(one.audio), 6);

    expect(peakGain(below.audio)).toBeCloseTo(peakGain(zero.audio), 6);
    expect(peakGain(above.audio)).toBeCloseTo(peakGain(one.audio), 6);
  });
});

/** Lässt alle anstehenden Zusagen (Laden, Dekodieren) durchlaufen. */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

/** Engine mit eigener Ladefunktion: sie schreibt mit, was verlangt wurde. */
function voiceEngine(options: WebAudioEngineOptions = {}): {
  engine: WebAudioEngine;
  audio: FakeAudioContext;
  asked: string[];
} {
  const audio = new FakeAudioContext();
  const asked: string[] = [];
  const engine = new WebAudioEngine({
    createContext: () => audio,
    loadVoice: (id) => {
      asked.push(id);
      return Promise.resolve(id === 'dragon' ? null : new ArrayBuffer(24000));
    },
    ...options,
  });
  return { engine, audio, asked };
}

describe('Tierstimmen in der Engine', () => {
  it('lädt nach der ersten Nutzergeste jede Stimme des Katalogs genau einmal', async () => {
    const { engine, audio, asked } = voiceEngine();
    expect(asked).toEqual([]);
    engine.unlock();
    engine.unlock();
    await settle();
    expect([...asked].sort()).toEqual(listCreatures().map((creature) => creature.id).sort());
    expect(audio.decodedCount).toBe(listCreatures().length);
    // Laden und Dekodieren legen keinen Knoten an — gespielt wird erst auf Anlass.
    expect(audio.nodeCount()).toBe(0);
  });

  it('spielt eine geladene Stimme sofort, in ihrer Länge und leiser als den Biss', async () => {
    const { engine, audio } = voiceEngine();
    engine.unlock();
    await settle();
    engine.playVoice('wolf');
    expect(audio.startedSources).toHaveLength(1);
    // 24 000 Abtastwerte bei 48 kHz sind eine halbe Sekunde.
    expect(audio.startedSources[0]?.stopTime).toBeCloseTo(0.5, 6);
    expect(peakGain(audio)).toBe(VOICE_GAIN);
    expect(VOICE_GAIN).toBeLessThan(0.9);
  });

  it('spielt eine Stimme, die beim Anlass noch lädt, sobald sie da ist — genau einmal', async () => {
    const { engine, audio } = voiceEngine();
    engine.unlock();
    engine.playVoice('wolf');
    expect(audio.startedSources).toHaveLength(0);
    await settle();
    expect(audio.startedSources).toHaveLength(1);
  });

  it('lässt eine Stimme fallen, die mehr als eine halbe Sekunde zu spät kommt', async () => {
    // Jede Stimme wartet auf ihre eigene Lieferung — nach `unlock()` sind alle zehn unterwegs.
    const waiting = new Map<string, (bytes: ArrayBuffer) => void>();
    const { engine, audio } = voiceEngine({
      loadVoice: (id) =>
        new Promise<ArrayBuffer>((resolve) => {
          waiting.set(id, resolve);
        }),
    });
    engine.unlock();
    engine.playVoice('wolf');
    await settle();
    audio.currentTime = 0.8;
    waiting.get('wolf')?.(new ArrayBuffer(24000));
    await settle();
    expect(audio.startedSources).toHaveLength(0);
    // Geladen ist sie trotzdem — der nächste Anlass spielt sie sofort.
    engine.playVoice('wolf');
    expect(audio.startedSources).toHaveLength(1);
  });

  it('lässt eine Stimme fallen, deren Anlass von stopAll() überholt wurde', async () => {
    const { engine, audio } = voiceEngine();
    engine.unlock();
    engine.playVoice('wolf');
    engine.stopAll();
    await settle();
    expect(audio.startedSources).toHaveLength(0);
  });

  it('bricht eine laufende Stimme mit stopAll() ab', async () => {
    const { engine, audio } = voiceEngine();
    engine.unlock();
    await settle();
    engine.playVoice('lion');
    engine.stopAll();
    expect(audio.runningSources()).toHaveLength(0);
  });

  it('lädt und spielt nichts, wenn der Ton aus ist', async () => {
    const { engine, audio, asked } = voiceEngine({ muted: true });
    engine.unlock();
    engine.playVoice('wolf');
    await settle();
    expect(asked).toEqual([]);
    expect(audio.nodeCount()).toBe(0);
  });

  it('tut vor der ersten Nutzergeste nichts — kein Kontext, kein Abruf', async () => {
    let created = 0;
    const asked: string[] = [];
    const engine = new WebAudioEngine({
      createContext: () => {
        created += 1;
        return new FakeAudioContext();
      },
      loadVoice: (id) => {
        asked.push(id);
        return Promise.resolve(new ArrayBuffer(8));
      },
    });
    engine.playVoice('wolf');
    await settle();
    expect(created).toBe(0);
    expect(asked).toEqual([]);
  });

  it('bleibt still, wenn das Laden scheitert — und versucht es beim nächsten Anlass erneut', async () => {
    let fail = true;
    const asked: string[] = [];
    const audio = new FakeAudioContext();
    const engine = new WebAudioEngine({
      createContext: () => audio,
      loadVoice: (id) => {
        asked.push(id);
        return fail ? Promise.reject(new Error('offline')) : Promise.resolve(new ArrayBuffer(24000));
      },
    });
    engine.unlock();
    await settle();
    expect(() => engine.playVoice('wolf')).not.toThrow();
    await settle();
    expect(audio.startedSources).toHaveLength(0);

    fail = false;
    engine.playVoice('wolf');
    await settle();
    expect(audio.startedSources).toHaveLength(1);
    expect(asked.filter((id) => id === 'wolf').length).toBeGreaterThanOrEqual(2);
  });

  it('bleibt bei einem unbekannten Tier still, statt zu werfen', async () => {
    const { engine, audio } = voiceEngine();
    engine.unlock();
    await settle();
    expect(() => engine.playVoice('dragon')).not.toThrow();
    await settle();
    expect(audio.startedSources).toHaveLength(0);
  });
});

describe('Laden der Stimmdateien', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('holt die Datei unter dem Basis-Pfad der Seite', async () => {
    const urls: string[] = [];
    vi.stubGlobal('fetch', (url: string) => {
      urls.push(url);
      return Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(4)) });
    });
    const bytes = await createVoiceLoader('/zahn_agent/')('wolf');
    expect(urls).toEqual(['/zahn_agent/sounds/voices/wolf.mp3']);
    expect(bytes?.byteLength).toBe(4);
  });

  it('liefert nichts bei einer Fehlantwort und fragt für ein unbekanntes Tier gar nicht erst', async () => {
    let calls = 0;
    vi.stubGlobal('fetch', () => {
      calls += 1;
      return Promise.resolve({ ok: false, arrayBuffer: () => Promise.resolve(new ArrayBuffer(4)) });
    });
    expect(await createVoiceLoader('/')('wolf')).toBeNull();
    expect(await createVoiceLoader('/')('dragon')).toBeNull();
    expect(calls).toBe(1);
  });
});
