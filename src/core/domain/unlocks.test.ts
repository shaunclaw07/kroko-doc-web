import { describe, expect, it } from 'vitest';
import { albumFromRecords, type AlbumRound } from './album';
import { getCreature, listCreatures } from './creature';
import { FINAL_GOAL, STARTING_CREATURES, UNLOCK_STEPS, newlyUnlocked, unlockState } from './unlocks';

/** Eine Runde mit ganzem Gebiss, die genau `stars` Sterne bringt (1, 2 oder 3). */
function round(creature: string, stars: 1 | 2 | 3): AlbumRound {
  const teeth = getCreature(creature).teeth;
  const pressIndex = stars === 3 ? teeth : stars === 2 ? Math.ceil(teeth / 2) + 1 : 1;
  return { creature, teeth, pressIndex };
}

const stateOf = (rounds: AlbumRound[]) => unlockState(albumFromRecords(rounds));

describe('Die Folge der Tiere', () => {
  it('führt jedes Katalogtier genau einmal — am Start oder in der Folge', () => {
    const placed = [...STARTING_CREATURES, ...UNLOCK_STEPS.map((step) => step.creature)];
    expect([...placed].sort()).toEqual(listCreatures().map((creature) => creature.id).sort());
    expect(new Set(placed).size).toBe(placed.length);
  });

  it('beginnt mit Krokodil, Maus und Wolf und endet mit den Bonusfiguren, zuletzt dem T-Rex', () => {
    expect(STARTING_CREATURES).toEqual(['crocodile', 'mouse', 'wolf']);
    expect(UNLOCK_STEPS.map((step) => step.creature)).toEqual([
      'shark', 'panda', 'human', 'lion', 'vampire', 'panther', 'sabertooth', 'flytrap', 'trex',
    ]);
    expect(UNLOCK_STEPS[UNLOCK_STEPS.length - 1]?.creature).toBe(FINAL_GOAL);
  });

  it('öffnet bei 3, 5, 7, 9, 11, 13 und 15 Sternen, die Bonusfiguren bei 20 und 28', () => {
    expect(UNLOCK_STEPS.map((step) => step.stars)).toEqual([3, 5, 7, 9, 11, 13, 15, 20, 28]);
  });

  it('braucht für keine Schwelle einen dritten Stern — außer für das letzte Ziel', () => {
    // Vor Schritt i sind die Starttiere und i frühere Tiere offen; jedes gibt ohne Glück beim
    // letzten Zahn höchstens zwei Sterne.
    UNLOCK_STEPS.forEach((step, index) => {
      const open = STARTING_CREATURES.length + index;
      if (step.creature === FINAL_GOAL) {
        // Die benannte Ausnahme: der T-Rex soll weit weg sein, bleibt aber erreichbar.
        expect(step.stars, step.creature).toBeGreaterThan(2 * open);
        expect(step.stars, step.creature).toBeLessThanOrEqual(3 * open);
      } else {
        expect(step.stars, step.creature).toBeLessThanOrEqual(2 * open);
      }
    });
  });

  it('lässt die Schwellen steigen', () => {
    const stars = UNLOCK_STEPS.map((step) => step.stars);
    expect([...stars].sort((a, b) => a - b)).toEqual(stars);
    expect(new Set(stars).size).toBe(stars.length);
  });
});

describe('unlockState', () => {
  it('zeigt ohne Runden die drei Starttiere und den Hai als nächstes', () => {
    const state = stateOf([]);
    expect(state.stars).toBe(0);
    expect(state.unlocked).toEqual(['crocodile', 'mouse', 'wolf']);
    expect(state.next).toEqual({ creature: 'shark', name: 'Hai', stars: 3, missing: 3 });
  });

  it('öffnet den Hai genau beim dritten Stern, nicht beim zweiten', () => {
    const two = stateOf([round('crocodile', 1), round('mouse', 1)]);
    expect(two.unlocked).not.toContain('shark');
    expect(two.next?.missing).toBe(1);
    const three = stateOf([round('crocodile', 1), round('mouse', 1), round('wolf', 1)]);
    expect(three.unlocked).toEqual(['crocodile', 'mouse', 'wolf', 'shark']);
    expect(three.next).toEqual({ creature: 'panda', name: 'Panda', stars: 5, missing: 2 });
  });

  it('zählt Sterne, nicht Runden: drei Sterne eines einzigen Tiers genügen', () => {
    expect(stateOf([round('mouse', 3)]).unlocked).toContain('shark');
    expect(stateOf([round('mouse', 1), round('mouse', 1), round('mouse', 1)]).unlocked).not.toContain('shark');
  });

  it('prüft jede Schwelle an ihrem Rand', () => {
    for (const [index, step] of UNLOCK_STEPS.entries()) {
      // Sterne der Reihe nach verteilen: je Tier zwei, in der Reihenfolge des Öffnens.
      const order = [...STARTING_CREATURES, ...UNLOCK_STEPS.map((entry) => entry.creature)];
      // Das letzte Ziel braucht dritte Sterne — dort gibt jedes Tier bis zu drei.
      const most = step.creature === FINAL_GOAL ? 3 : 2;
      const roundsFor = (total: number): AlbumRound[] => {
        const rounds: AlbumRound[] = [];
        let left = total;
        for (const creature of order) {
          if (left <= 0) break;
          const take = Math.min(most, left) as 1 | 2 | 3;
          rounds.push(round(creature, take));
          left -= take;
        }
        return rounds;
      };
      expect(stateOf(roundsFor(step.stars - 1)).unlocked, `${step.creature} bei ${step.stars - 1}`).not.toContain(step.creature);
      const reached = stateOf(roundsFor(step.stars));
      expect(reached.unlocked, `${step.creature} bei ${step.stars}`).toContain(step.creature);
      expect(reached.unlocked).toHaveLength(STARTING_CREATURES.length + index + 1);
    }
  });

  it('hat mit 15 Sternen alle zehn Stammtiere offen und nennt die Venusfliegenfalle als nächstes', () => {
    const all = listCreatures().slice(0, 8).map((creature) => round(creature.id, 2));
    const state = stateOf(all);
    expect(state.stars).toBe(16);
    expect(state.unlocked).toHaveLength(10);
    expect(state.next).toEqual({ creature: 'flytrap', name: 'Venusfliegenfalle', stars: 20, missing: 4 });
  });

  it('öffnet die Venusfliegenfalle mit zwei Sternen je Stammtier — ganz ohne dritten Stern', () => {
    const state = stateOf(listCreatures().slice(0, 10).map((creature) => round(creature.id, 2)));
    expect(state.stars).toBe(20);
    expect(state.unlocked).toContain('flytrap');
    expect(state.next).toEqual({ creature: 'trex', name: 'T-Rex', stars: 28, missing: 8 });
  });

  it('zählt die Sterne der Venusfliegenfalle auf dem Weg zum T-Rex mit und kennt danach kein Ziel mehr', () => {
    // Elf Wesen mit je zwei Sternen sind 22; sechs dritte Sterne fehlen — egal von welchem Wesen.
    const two = listCreatures().slice(0, 11).map((creature) => round(creature.id, 2));
    const five = listCreatures().slice(0, 5).map((creature) => round(creature.id, 3));
    expect(stateOf([...two, ...five]).stars).toBe(27);
    expect(stateOf([...two, ...five]).unlocked).not.toContain('trex');
    const done = stateOf([...two, ...five, round('flytrap', 3)]);
    expect(done.stars).toBe(28);
    expect(done.unlocked).toHaveLength(12);
    expect(done.next).toBeNull();
  });

  it('zählt alte Runden mit einem Tier mit, das heute gesperrt wäre', () => {
    // Wer vor der Sperre mit dem Säbelzahntiger gespielt hat, behält seine Sterne.
    const state = stateOf([round('sabertooth', 3)]);
    expect(state.stars).toBe(3);
    expect(state.unlocked).toEqual(['crocodile', 'mouse', 'wolf', 'shark']);
    expect(state.unlocked).not.toContain('sabertooth');
  });
});

describe('newlyUnlocked', () => {
  it('nennt, was seit dem letzten Stand dazukam, in der Folge', () => {
    const before = stateOf([round('crocodile', 1), round('mouse', 1)]);
    const after = stateOf([round('crocodile', 1), round('mouse', 1), round('wolf', 3)]);
    expect(newlyUnlocked(before, after).map((entry) => entry.name)).toEqual(['Hai', 'Panda']);
  });

  it('nennt nichts, wenn sich nichts geöffnet hat', () => {
    const before = stateOf([round('crocodile', 1)]);
    const after = stateOf([round('crocodile', 1), round('mouse', 1)]);
    expect(newlyUnlocked(before, after)).toEqual([]);
  });
});
