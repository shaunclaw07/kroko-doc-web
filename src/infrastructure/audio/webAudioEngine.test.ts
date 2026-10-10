import { describe, expect, it } from 'vitest';
import { WebAudioEngine } from './webAudioEngine';
import type { WebAudioEngineOptions } from './webAudioEngine';
import { FakeAudioContext } from '../testing/fakeAudioContext';

/** Baut eine Engine auf einem frischen Fake-Kontext — so gehören alle Logs zu diesem Klang. */
function makeEngine(options: WebAudioEngineOptions = {}): { engine: WebAudioEngine; audio: FakeAudioContext } {
  const audio = new FakeAudioContext();
  const engine = new WebAudioEngine({ ...options, createContext: () => audio });
  return { engine, audio };
}

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

  it('ruft resume() über unlock() genau einmal wirksam auf', () => {
    const { engine, audio } = makeEngine();
    engine.unlock();
    engine.unlock();
    engine.unlock();
    expect(audio.resumeCallCount).toBe(1);
  });

  it('bleibt stumm, wenn resume() scheitert', async () => {
    const audio = new FakeAudioContext();
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
