import { describe, expect, it } from 'vitest';
import {
  CREATURES,
  DEFAULT_CREATURE_ID,
  MAX_FACT_LENGTH,
  getCreature,
  isKnownCreature,
  listCreatures,
  validateCreature,
} from './creature';
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
      // 0 heißt „hat gar keine Zähne" (Venusfliegenfalle) — sonst nie weniger als im Spiel.
      if (creature.realTeeth !== 0) {
        expect(creature.realTeeth, creature.id).toBeGreaterThanOrEqual(creature.teeth);
      }
    }
  });

  it('trägt für jedes Tier einen kurzen Satz über das echte Tier', () => {
    for (const creature of listCreatures()) {
      expect(creature.fact.trim().length, creature.id).toBeGreaterThan(0);
      expect(creature.fact.length, creature.id).toBeLessThanOrEqual(MAX_FACT_LENGTH);
      expect(creature.fact, creature.id).toMatch(/[.!]$/);
    }
  });

  it('behauptet in keinem Satz etwas über scharfe Zähne — die zieht allein der Zufall', () => {
    for (const creature of listCreatures()) {
      expect(creature.fact, creature.id).not.toMatch(/scharf|gefährlich|meist|häufiger/i);
    }
  });

  it('meldet einen leeren oder zu langen Satz als Widerspruch', () => {
    const base = listCreatures()[0];
    if (!base) throw new Error('catalog is empty');
    expect(validateCreature({ ...base, fact: '  ' })).toContain(`${base.id}: fact is empty`);
    // Die echte Zahnzahl: 0 heißt „hat gar keine" — alles andere unter der Spielzahl ist ein Fehler.
    expect(validateCreature({ ...base, realTeeth: 0 })).toEqual([]);
    expect(validateCreature({ ...base, realTeeth: base.teeth - 1 })).toHaveLength(1);
    expect(validateCreature({ ...base, fact: 'x'.repeat(MAX_FACT_LENGTH + 1) })).toContain(
      `${base.id}: fact is longer than ${MAX_FACT_LENGTH} characters`,
    );
  });
});
