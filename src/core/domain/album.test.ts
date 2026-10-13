import { describe, expect, it } from 'vitest';
import { albumFromRecords, earnsAllStars, newStars, starsOfRound } from './album';
import { listCreatures } from './creature';
import { creatureKWeights, pressPositionDistribution } from './probabilities';
import { RANDOM_MODES } from './teeth';

const round = (creature: string | undefined, teeth: number, pressIndex: number) => ({ creature, teeth, pressIndex });

describe('Sterne einer Runde', () => {
  it('gibt für jede Runde den Stern „gespielt"', () => {
    expect(starsOfRound(round('crocodile', 10, 1))).toEqual(['played']);
  });

  it('gibt „halb geschafft" ab der Hälfte harmloser Drücke — genau an der Grenze', () => {
    // Krokodil, 10 Zähne: 5 harmlose Drücke heißt, der 6. Druck schnappte.
    expect(starsOfRound(round('crocodile', 10, 5))).toEqual(['played']);
    expect(starsOfRound(round('crocodile', 10, 6))).toEqual(['played', 'halfway']);
  });

  it('gibt „bis zum letzten Zahn" nur, wenn erst der letzte Zahn schnappte', () => {
    expect(starsOfRound(round('crocodile', 10, 9))).toEqual(['played', 'halfway']);
    expect(starsOfRound(round('crocodile', 10, 10))).toEqual(['played', 'halfway', 'lastTooth']);
    expect(starsOfRound(round('mouse', 6, 6))).toEqual(['played', 'halfway', 'lastTooth']);
  });

  it('gibt mit weniger Zähnen nur „gespielt" — sonst wären zwei Zähne der kurze Weg', () => {
    expect(starsOfRound(round('crocodile', 2, 2))).toEqual(['played']);
    expect(starsOfRound(round('crocodile', 9, 9))).toEqual(['played']);
    expect(starsOfRound(round('mouse', 5, 5))).toEqual(['played']);
  });

  it('zählt auch mehr Zähne als das Gebiss des Tiers — gemessen an der eingestellten Zahl', () => {
    // Gemeldet: Krokodil mit 12 Zähnen, erst der letzte schnappte — und kein Stern.
    expect(starsOfRound(round('crocodile', 12, 12))).toEqual(['played', 'halfway', 'lastTooth']);
    expect(starsOfRound(round('crocodile', 11, 11))).toEqual(['played', 'halfway', 'lastTooth']);
    // Die Hälfte ist die Hälfte der **eingestellten** Zähne: bei 12 braucht es 6 harmlose Drücke.
    expect(starsOfRound(round('crocodile', 12, 6))).toEqual(['played']);
    expect(starsOfRound(round('crocodile', 12, 7))).toEqual(['played', 'halfway']);
    // „Bis zum letzten Zahn" heißt der letzte der eingestellten, nicht der zehnte.
    expect(starsOfRound(round('crocodile', 12, 10))).toEqual(['played', 'halfway']);
    expect(starsOfRound(round('mouse', 10, 10))).toEqual(['played', 'halfway', 'lastTooth']);
  });

  it('sagt für jede Zahnzahl, ob sie für alle Sterne zählt — die Grenze ist das Gebiss des Tiers', () => {
    for (const creature of listCreatures()) {
      for (let teeth = 1; teeth <= 12; teeth += 1) {
        expect(earnsAllStars(creature.id, teeth), `${creature.id}/${teeth}`).toBe(teeth >= creature.teeth);
      }
    }
    // Ohne oder mit unbekanntem Lebewesen gilt das Krokodil.
    expect(earnsAllStars(undefined, 9)).toBe(false);
    expect(earnsAllStars('einhorn', 10)).toBe(true);
  });

  it('zählt Runden ohne oder mit unbekanntem Lebewesen für das Krokodil', () => {
    expect(starsOfRound(round(undefined, 10, 10))).toEqual(['played', 'halfway', 'lastTooth']);
    expect(starsOfRound(round('dragon', 10, 6))).toEqual(['played', 'halfway']);
  });
});

describe('Album aus dem Protokoll', () => {
  it('hat für jedes Tier des Katalogs genau eine Seite, in Katalogreihenfolge', () => {
    const album = albumFromRecords([]);
    expect(album.map((page) => page.creature)).toEqual(listCreatures().map((creature) => creature.id));
    expect(album.every((page) => page.rounds === 0 && page.stars.length === 0)).toBe(true);
  });

  it('sammelt die Sterne eines Tiers über mehrere Runden und zählt die Runden', () => {
    const album = albumFromRecords([
      round('wolf', 12, 1),
      round('wolf', 12, 7),
      round('mouse', 6, 2),
      round(undefined, 10, 10),
    ]);
    const page = (id: string) => album.find((entry) => entry.creature === id);
    expect(page('wolf')).toMatchObject({ name: 'Wolf', rounds: 2, stars: ['played', 'halfway'] });
    expect(page('mouse')).toMatchObject({ rounds: 1, stars: ['played'] });
    expect(page('crocodile')).toMatchObject({ rounds: 1, stars: ['played', 'halfway', 'lastTooth'] });
    expect(page('lion')).toMatchObject({ rounds: 0, stars: [] });
  });

  it('hält die Sterne in fester Reihenfolge, egal in welcher sie verdient wurden', () => {
    const album = albumFromRecords([round('mouse', 6, 6), round('mouse', 6, 1)]);
    expect(album.find((page) => page.creature === 'mouse')?.stars).toEqual(['played', 'halfway', 'lastTooth']);
  });
});

describe('neue Sterne', () => {
  it('nennt genau die Sterne, die dazugekommen sind', () => {
    const before = albumFromRecords([round('wolf', 12, 1)]);
    const after = albumFromRecords([round('wolf', 12, 1), round('wolf', 12, 7), round('mouse', 6, 1)]);
    expect(newStars(before, after)).toEqual([
      { creature: 'wolf', name: 'Wolf', star: 'halfway' },
      { creature: 'mouse', name: 'Maus', star: 'played' },
    ]);
  });

  it('nennt nichts, wenn nichts dazukam — auch nicht, wenn Sterne verschwinden', () => {
    const one = albumFromRecords([round('wolf', 12, 7)]);
    expect(newStars(one, one)).toEqual([]);
    expect(newStars(one, albumFromRecords([]))).toEqual([]);
  });
});

describe('Chancen der Sterne (Rand jeder Regel, für jedes Tier und beide Zufallsmodelle)', () => {
  it('lässt „halb geschafft" in 20 bis 50 % und den letzten Zahn in 2 bis 20 % der Runden zu', () => {
    for (const creature of listCreatures()) {
      for (const mode of RANDOM_MODES) {
        const dist = pressPositionDistribution(creature.teeth, creatureKWeights(creature, mode));
        const chance = (star: 'halfway' | 'lastTooth'): number =>
          dist.reduce(
            (sum, p, index) =>
              starsOfRound({ creature: creature.id, teeth: creature.teeth, pressIndex: index + 1 }).includes(star)
                ? sum + p
                : sum,
            0,
          );
        const where = `${creature.id}/${mode}`;
        expect(chance('halfway'), where).toBeGreaterThanOrEqual(0.2);
        expect(chance('halfway'), where).toBeLessThanOrEqual(0.5 + 1e-9);
        expect(chance('lastTooth'), where).toBeGreaterThanOrEqual(0.02);
        expect(chance('lastTooth'), where).toBeLessThanOrEqual(0.2);
      }
    }
  });
});
