import { existsSync, readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { listCreatures } from '../../core/domain/creature';
import { CREATURE_VOICE_FILES, MAX_VOICE_BYTES, voiceUrl } from './creatureVoices';

const FOLDER = new URL('../../../public/sounds/voices/', import.meta.url);
const SOURCES = readFileSync(new URL('QUELLEN.md', FOLDER), 'utf8');

describe('Tierstimmen als Dateien', () => {
  it('gibt jedem Tier des Katalogs eine Datei — und keinem, das es nicht gibt', () => {
    const ids = listCreatures().map((creature) => creature.id).sort();
    expect(Object.keys(CREATURE_VOICE_FILES).sort()).toEqual(ids);
  });

  it('liefert jede Datei wirklich aus: vorhanden, MP3, klein genug', () => {
    for (const [id, file] of Object.entries(CREATURE_VOICE_FILES)) {
      const path = new URL(file, FOLDER);
      expect(existsSync(path), `${id}: ${file} fehlt`).toBe(true);
      expect(statSync(path).size, id).toBeLessThanOrEqual(MAX_VOICE_BYTES);
      expect(statSync(path).size, id).toBeGreaterThan(1000);
      // Ein MP3-Rahmen beginnt mit elf gesetzten Bits (das Werkzeug schreibt keine ID3-Marke).
      const head = readFileSync(path).subarray(0, 2);
      expect(head[0], id).toBe(0xff);
      expect((head[1] ?? 0) & 0xe0, id).toBe(0xe0);
    }
  });

  it('nennt für jede Datei Lizenz und Quelle — sonst wird sie nicht ausgeliefert', () => {
    for (const [id, file] of Object.entries(CREATURE_VOICE_FILES)) {
      const row = SOURCES.split('\n').find((line) => line.includes(`\`${file}\``));
      expect(row, `${id}: ${file} steht nicht in QUELLEN.md`).toBeDefined();
      expect(row, id).toMatch(/CC0|Public Domain|gemeinfrei|CC BY|selbst aufgenommen|generiert/i);
      expect(row, id).toMatch(/https?:\/\/|selbst aufgenommen|erzeugt mit/);
    }
  });

  it('baut die Adresse aus dem Basis-Pfad und kennt kein fremdes Tier', () => {
    expect(voiceUrl('/', 'wolf')).toBe('/sounds/voices/wolf.mp3');
    expect(voiceUrl('/zahn_agent/', 'wolf')).toBe('/zahn_agent/sounds/voices/wolf.mp3');
    expect(voiceUrl('/', 'dragon')).toBeNull();
  });
});
