import { describe, expect, it } from 'vitest';
import { CREATURES, getCreature } from '../../../core/domain/creature';
import { MAX_TEETH, MIN_TEETH } from '../../../core/domain/teeth';
import { MIN_TAP_TARGET_PX, maxTapFriendlyTeeth, tapTargetPx } from './geometry';
import { ARTWORKS, creatureView, listCreatureViews } from './index';
import { ARTWORKS as ALL_ARTWORKS } from './index';

/**
 * Vertrag der Zeichen-Schicht: jedes Lebewesen im Katalog muss eine Zeichnung haben, die
 * genau sein Gebiss darstellt. Damit ist "neues Tier ergänzen" abgesichert — fehlt die
 * Zeichnung oder passt die Zahnzahl nicht, wird der Test rot.
 */

function toothIds(markup: string): number[] {
  return [...markup.matchAll(/data-tooth="(\d+)"/g)].map((match) => Number(match[1]));
}

describe('Zeichnungen der Lebewesen', () => {
  it('hat für jedes Katalog-Lebewesen eine Zeichnung — und keine überzählige', () => {
    const catalogIds = CREATURES.map((creature) => creature.id).sort();
    expect(Object.keys(ARTWORKS).sort()).toEqual(catalogIds);
    expect(listCreatureViews().map((view) => view.id)).toEqual(CREATURES.map((creature) => creature.id));
  });

  it('zeichnet je Lebewesen genau so viele Zähne wie der Katalog nennt', () => {
    for (const creature of CREATURES) {
      const ids = toothIds(creatureView(creature.id).render());
      expect(ids, creature.id).toHaveLength(creature.teeth);
      expect(new Set(ids).size, creature.id).toBe(creature.teeth);
      expect(Math.min(...ids), creature.id).toBe(1);
      expect(Math.max(...ids), creature.id).toBe(creature.teeth);
    }
  });

  it('enthält alle Bühnen-Ebenen in der erwarteten Reihenfolge', () => {
    for (const creature of CREATURES) {
      const markup = creatureView(creature.id).render();
      const order = [
        'creature__body',
        'mouth__hole',
        'mouth__inner',
        'jaw__shell',
        'jaw__upper',
        'teeth--upper',
        'class="teeth"',
        'jaw__lower',
        'creature__face',
        'creature__biter',
      ];
      let cursor = -1;
      for (const layer of order) {
        const position = markup.indexOf(layer);
        expect(position, `${creature.id}: ${layer}`).toBeGreaterThan(cursor);
        cursor = position;
      }
    }
  });

  it('erzeugt nur gültiges Markup — kein undefined, kein NaN', () => {
    for (const creature of CREATURES) {
      const markup = creatureView(creature.id).render();
      expect(markup, creature.id).not.toMatch(/undefined|NaN|null/);
      expect(markup.startsWith('<svg'), creature.id).toBe(true);
      expect(markup.endsWith('</svg>'), creature.id).toBe(true);
      expect(markup, creature.id).toContain(`data-creature="${creature.id}"`);
      // Die Trefferfläche gehört zu jedem drückbaren Zahn.
      expect(markup.match(/tooth__hit/g), creature.id).toHaveLength(creature.teeth);
    }
  });

  it('legt jeden Zahnanker innerhalb der Bühne', () => {
    for (const creature of CREATURES) {
      const view = creatureView(creature.id);
      const anchors = Array.from({ length: creature.teeth }, (_, index) => view.toothAnchor(index + 1));
      for (const anchor of anchors) {
        expect(Number.isFinite(anchor.x) && Number.isFinite(anchor.y), creature.id).toBe(true);
        expect(anchor.x, creature.id).toBeGreaterThan(0);
        expect(anchor.x, creature.id).toBeLessThan(view.viewBox.width);
        expect(anchor.y, creature.id).toBeGreaterThan(0);
        expect(anchor.y, creature.id).toBeLessThan(view.viewBox.height - 8);
      }
      // Die Zähne stehen auf einem Bogen: die Spitzen liegen nicht alle auf einer Höhe.
      const heights = new Set(anchors.map((anchor) => Math.round(anchor.y / 10)));
      expect(heights.size, creature.id).toBeGreaterThan(2);
    }
  });

  it('fährt den Oberkiefer weit genug zu, um das Maul zu schließen', () => {
    for (const creature of CREATURES) {
      const view = creatureView(creature.id);
      expect(view.closeShift, creature.id).toBeGreaterThan(60);
      expect(view.closeShift, creature.id).toBeLessThan(420);
    }
  });

  it('zeichnet reproduzierbar', () => {
    for (const creature of CREATURES) {
      expect(creatureView(creature.id).render()).toBe(creatureView(creature.id).render());
    }
  });

  it('zeichnet auch abweichende Zahnzahlen sauber', () => {
    for (const creature of CREATURES) {
      for (const count of [MIN_TEETH, 6, 10, MAX_TEETH]) {
        const view = creatureView(creature.id, count);
        const ids = toothIds(view.render());
        expect(ids, `${creature.id}/${count}`).toHaveLength(count);
        expect(new Set(ids).size, `${creature.id}/${count}`).toBe(count);
        expect(view.teeth, `${creature.id}/${count}`).toBe(count);
        for (let index = 1; index <= count; index += 1) {
          const anchor = view.toothAnchor(index);
          expect(anchor.x, `${creature.id}/${count}/${index}`).toBeGreaterThan(0);
          expect(anchor.x, `${creature.id}/${count}/${index}`).toBeLessThan(view.viewBox.width);
        }
      }
    }
  });

  it('macht Zähne bei vielen Zähnen schmaler, damit sie sich nicht überdecken', () => {
    const wide = creatureView('crocodile', 6).render();
    const narrow = creatureView('crocodile', MAX_TEETH).render();
    const widthOf = (markup: string): number => {
      const first = markup.match(/class="tooth__shape" d="M (-?[\d.]+)/)?.[1] ?? '0';
      return Math.abs(Number(first)) * 2;
    };
    expect(widthOf(narrow)).toBeLessThan(widthOf(wide));
  });

  it('nimmt ohne Angabe die Zahnzahl des Lebewesens', () => {
    for (const creature of CREATURES) {
      expect(creatureView(creature.id).teeth, creature.id).toBe(creature.teeth);
    }
  });

  it('gibt jedem Zahn auf dem Handy eine Trefferfläche von mindestens 44 Pixeln', () => {
    // Ein 358 px breites Handy ist der enge Fall; die Zähne sitzen auf einem Ring um das
    // ganze Maul, damit sich diese Größe auf mehr Zähne verteilen lässt.
    for (const creature of CREATURES) {
      const ring = ALL_ARTWORKS[creature.id]?.ring;
      expect(ring, creature.id).toBeTruthy();
      if (!ring) continue;
      for (let count = MIN_TEETH; count <= MAX_TEETH; count += 1) {
        expect(tapTargetPx(count, ring), `${creature.id}/${count}`).toBeGreaterThanOrEqual(MIN_TAP_TARGET_PX);
      }
    }
  });

  it('belegt, wo die Grenze liegt (die Obergrenze ist gemessen, nicht geschätzt)', () => {
    const crocodile = ALL_ARTWORKS['crocodile'];
    const human = ALL_ARTWORKS['human'];
    expect(crocodile && human).toBeTruthy();
    if (!crocodile || !human) return;
    // Das Krokodil hat den größten Ring und verkraftet mehr Zähne als die Obergrenze erlaubt.
    expect(maxTapFriendlyTeeth(crocodile.ring)).toBeGreaterThanOrEqual(MAX_TEETH);
    // Beim Menschen ist bei 16 Zähnen Schluss — genau deshalb steht die Grenze bei 12.
    expect(maxTapFriendlyTeeth(human.ring)).toBeLessThan(16);
    expect(tapTargetPx(16, human.ring)).toBeLessThan(MIN_TAP_TARGET_PX);
  });

  it('wirft bei einem unbekannten Lebewesen, statt etwas anderes zu zeichnen', () => {
    expect(() => creatureView('drache')).toThrow();
    expect(() => creatureView('drache')).toThrowError(/not known/);
  });

  it('nennt Name und Zahnzahl aus dem Katalog', () => {
    const view = creatureView('wolf');
    const creature = getCreature('wolf');
    expect(view.name).toBe(creature.name);
    expect(view.teeth).toBe(creature.teeth);
  });
});
