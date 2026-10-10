import { describe, expect, it } from 'vitest';
import { CREATURES, DEFAULT_CREATURE_ID, getCreature, isKnownCreature, listCreatures, validateCreature } from './creature';
import { DomainError } from './errors';

describe('Katalog der Lebewesen', () => {
  it('enthält das Krokodil als Standard', () => {
    expect(getCreature().id).toBe(DEFAULT_CREATURE_ID);
    expect(getCreature('crocodile').name).toBe('Krokodil');
  });

  it('bietet mindestens Krokodil, Wolf und Mensch an', () => {
    const ids = listCreatures().map((creature) => creature.id);
    expect(ids).toContain('crocodile');
    expect(ids).toContain('wolf');
    expect(ids).toContain('human');
  });

  it('hat für jeden Eintrag eindeutige Kennungen', () => {
    const ids = CREATURES.map((creature) => creature.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('hat keinen widersprüchlichen Eintrag', () => {
    for (const creature of CREATURES) {
      expect(validateCreature(creature)).toEqual([]);
    }
  });

  it('kennt unbekannte Lebewesen nicht und wirft dann', () => {
    expect(isKnownCreature('drache')).toBe(false);
    expect(() => getCreature('drache')).toThrow(DomainError);
    expect(() => getCreature('drache')).toThrowError(/not known/);
  });

  it('beschreibt jedes Lebewesen mit einem Satz', () => {
    for (const creature of CREATURES) {
      expect(creature.note.length).toBeGreaterThan(20);
      expect(creature.realTeeth).toBeGreaterThanOrEqual(creature.teeth);
    }
  });
});
