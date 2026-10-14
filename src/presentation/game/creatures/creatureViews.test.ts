import { describe, expect, it } from 'vitest';
import { CREATURES, getCreature } from '../../../core/domain/creature';
import { MAX_TEETH, MIN_TEETH } from '../../../core/domain/teeth';
import { MIN_STAGE_WIDTH_PX, MIN_TAP_TARGET_PX, VIEWBOX, maxTapFriendlyTeeth, tapTargetPx, toothSpacing } from './geometry';
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

  /**
   * Das Gesicht wird als letzte Ebene **über** die Zähne gemalt. Die Zähne stehen auf dem Ring und
   * zeigen nach innen — jede runde Gesichtsform (Auge, Iris, Wange, Ohr, Monokel), die in die
   * Ringellipse ragt, deckt deshalb bei irgendeiner Zahnzahl einen Zahn zu. Gemessen am 12.10.2026:
   * der Augenfleck des Pandas verdeckte bei 11 Zähnen einen Zahn ganz, das Auge des Hais bei 8
   * Zähnen 82 %. Die Regel gilt unabhängig von der Zahnzahl, weil sie den Ring prüft, nicht den Zahn.
   */
  it('hält Augen, Wangen und Ohren aus dem Zahnring heraus — kein Zahn liegt unter dem Gesicht', () => {
    const MARGIN = 2;
    const attribute = (tag: string, name: string): number | undefined => {
      const match = tag.match(new RegExp(`\\s${name}="([^"]+)"`));
      return match ? Number(match[1]) : undefined;
    };
    for (const creature of CREATURES) {
      const art = ALL_ARTWORKS[creature.id]!;
      const { cx, cy, rx, ry } = art.ring;
      const shapes = art.face.match(/<(?:ellipse|circle)\b[^>]*>/g) ?? [];
      // Mindestens zwei Augen — sonst prüfte die Regel bei geändertem Markup still nichts mehr.
      expect(shapes.length, creature.id).toBeGreaterThanOrEqual(2);
      // Eine gedrehte oder verschobene Form läge woanders, als ihre Attribute sagen.
      expect(art.face, creature.id).not.toMatch(/<g\b[^>]*transform=[^>]*>\s*<(?:ellipse|circle)/);
      for (const tag of shapes) {
        expect(tag, creature.id).not.toContain('transform=');
        const x = attribute(tag, 'cx') ?? 0;
        const y = attribute(tag, 'cy') ?? 0;
        const grow = (attribute(tag, 'stroke-width') ?? 0) / 2 + MARGIN;
        const shapeRx = (attribute(tag, 'rx') ?? attribute(tag, 'r') ?? 0) + grow;
        const shapeRy = (attribute(tag, 'ry') ?? attribute(tag, 'r') ?? 0) + grow;
        for (let deg = 0; deg < 360; deg += 5) {
          const px = x + shapeRx * Math.cos((deg * Math.PI) / 180);
          const py = y + shapeRy * Math.sin((deg * Math.PI) / 180);
          const inRing = ((px - cx) / rx) ** 2 + ((py - cy) / ry) ** 2;
          expect(inRing, `${creature.id}: ${tag} ragt bei ${deg}° in den Zahnring`).toBeGreaterThanOrEqual(1);
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

  it('gibt jedem Zahn auf der schmalsten Bühne 44 Pixel — bis an die Grenze des Zahnabstands', () => {
    // Der enge Fall ist ein 320-px-Gerät: dort ist die Bühne gemessen 286 px breit, der gezeichnete
    // Maßstab entspricht aber nur 285,8 px (die Zeichnung ist im Kasten höhenbegrenzt). Gerechnet
    // wird mit 285 px — zwei Pixel Reserve, damit die Vorgabe nicht an der Rundung hängt, und
    // dieselbe Zahl, die `MIN_STAGE_WIDTH_PX` in `geometry.ts` nennt. Zuvor galt die Vorgabe nur für
    // 358 px — auf einem 320-px-Gerät waren es 43,2 px. Zwei Regeln greifen: die Vorgabe und der
    // halbe Zahnabstand,
    // damit sich zwei Trefferflächen nicht überdecken. Wo beide zusammen nicht gehen, gewinnt der
    // Abstand — mehr wäre ein Tippziel, das dem Nachbarn den Druck stiehlt.
    // Der Grenzfall: ein halber Zahnabstand von rechnerisch genau 44 px (Mensch bei 11 Zähnen) darf
    // nicht an der Gleitkomma-Rundung entscheiden — er zählt als „erreicht", wird aber mit seiner
    // eigenen Grenze geprüft. Alles darunter ist der Abstand und wird als Ausnahme festgehalten.
    const RUNDUNG_PX = 0.05;
    const knapp: string[] = [];
    for (const creature of CREATURES) {
      const ring = ALL_ARTWORKS[creature.id]?.ring;
      expect(ring, creature.id).toBeTruthy();
      if (!ring) continue;
      for (let count = MIN_TEETH; count <= MAX_TEETH; count += 1) {
        const px = tapTargetPx(count, ring, MIN_STAGE_WIDTH_PX);
        const abstandPx = toothSpacing(count, ring) * (MIN_STAGE_WIDTH_PX / VIEWBOX.width);
        if (abstandPx < MIN_TAP_TARGET_PX - RUNDUNG_PX) {
          expect(px, `${creature.id}/${count}`).toBeCloseTo(abstandPx, 9);
          knapp.push(`${creature.id}/${count}`);
        } else {
          expect(px, `${creature.id}/${count}`).toBeGreaterThanOrEqual(MIN_TAP_TARGET_PX - RUNDUNG_PX);
        }
      }
    }
    // Belegter Stand (11.10.2026, gerechnet mit dieser Geometrie): bei 12 Zähnen reicht der Abstand
    // auf 285 px bei neun der zehn Lebewesen nicht — nur das Krokodil hat einen so großen Ring,
    // dass es die Vorgabe überall schafft. Bei 11 Zähnen bleiben nur die zwei engsten Ringe übrig
    // (Maus und Vampir). Panda und Löwe kamen am 11.10.2026 dazu: der Panda-Ring stand zuerst auf
    // rx 195 und fiel damit auch bei 11 Zähnen unter die Vorgabe; er ist auf die Breite des
    // Löwen-Rings (200) gebracht worden, damit die Ausnahme nicht ohne Not wächst. Panther und
    // Säbelzahntiger tragen denselben Ring (rx 200) und stehen deshalb ebenfalls in der Liste.
    expect(knapp).toEqual([
      'wolf/12',
      'human/12',
      'shark/12',
      'mouse/11',
      'mouse/12',
      'vampire/11',
      'vampire/12',
      'panda/12',
      'lion/12',
      'panther/12',
      'sabertooth/12',
      // Die Venusfliegenfalle trägt einen so engen Ring wie die Maus (Bogenlänge rund 997 gegen
      // 999 Einheiten), der T-Rex den der Katzen (rx 200).
      'flytrap/11',
      'flytrap/12',
      'trex/12',
    ]);
  });

  it('belegt, wo die Trefferfläche auf einem 320-px-Gerät endet (gemessen, nicht geschätzt)', () => {
    const maus = ALL_ARTWORKS['mouse'];
    expect(maus).toBeTruthy();
    if (!maus) return;
    // 10 Zähne schaffen die Vorgabe auf 285 px (44,0 px). Bei 12 Zähnen lässt der halbe Zahnabstand
    // (41,6 SVG-Einheiten) nur 37,1 px zu — die schmalste Maus ist der engste Fall im ganzen
    // Katalog, und sie ist der Grund, warum die Grenze bei 11 Zähnen beginnt. Auf einem gewöhnlichen
    // Handy (358 px Bühne) hält die Vorgabe auch bei 12 Zähnen; im Browser gemessen wurden bei
    // 320 px Blick (286 px Bühne) 44,15 px für einen einzelnen Zahn.
    expect(tapTargetPx(10, maus.ring, MIN_STAGE_WIDTH_PX)).toBeCloseTo(44.0, 1);
    expect(tapTargetPx(12, maus.ring, MIN_STAGE_WIDTH_PX)).toBeCloseTo(37.1, 1);
    expect(tapTargetPx(12, maus.ring, MIN_STAGE_WIDTH_PX)).toBeLessThan(MIN_TAP_TARGET_PX);
    expect(tapTargetPx(12, maus.ring, 358)).toBeGreaterThanOrEqual(MIN_TAP_TARGET_PX);
    // Und die Gegenprobe für den gemeldeten Fall: ein einziger Zahn schafft die Vorgabe jetzt
    // auf jedem Lebewesen — vorher waren es dort 43,2 px.
    for (const art of Object.values(ALL_ARTWORKS)) {
      expect(tapTargetPx(1, art.ring, MIN_STAGE_WIDTH_PX)).toBeCloseTo(MIN_TAP_TARGET_PX, 6);
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

/**
 * Die Kopfbilder tragen die Auswahl-Kacheln. Zwei Fallen stecken darin, beide hier festgehalten:
 * (1) keine Klasse, die die Steuerung abfragt (`.creature`, `.tooth`, `.creature__biter`) — sonst
 * greift `document.querySelector('.creature')` die Kachel statt der Bühne ab; (2) je Kopfbild eine
 * **eigene** Beschnitt-Kennung, weil doppelte Kennungen die Bühne mit dem Kopfumriss der Kachel
 * zuschneiden würden.
 */
describe('Kopfbilder für die Auswahl', () => {
  function clipIds(markup: string): string[] {
    return [...markup.matchAll(/clipPath id="([^"]+)"/g)].map((match) => match[1] ?? '');
  }

  it('zeichnet das Kopfbild ohne alles Bedienbare', () => {
    for (const creature of CREATURES) {
      const markup = creatureView(creature.id).portrait('kachel');
      expect(markup, creature.id).toMatch(/^<svg/);
      expect(markup, creature.id).toContain('class="creature-portrait"');
      expect(markup, creature.id).not.toContain('class="creature"');
      expect(markup, creature.id).not.toMatch(/class="tooth"/);
      expect(markup, creature.id).not.toContain('tooth__hit');
      expect(markup, creature.id).not.toContain('data-tooth');
      expect(markup, creature.id).not.toContain('tabindex');
      expect(markup, creature.id).not.toContain('creature__biter');
      expect(markup, creature.id).not.toMatch(/undefined|NaN|null/);
      // Alle Zähne sind da, aber als reine Zeichnung.
      expect(markup.match(/rest-tooth/g), creature.id).toHaveLength(creature.teeth);
    }
  });

  it('gibt jedem Kopfbild eine eigene Beschnitt-Kennung', () => {
    const tile = creatureView('crocodile').portrait('kachel');
    const preview = creatureView('crocodile').portrait('wahl');
    const other = creatureView('wolf').portrait('kachel');
    expect(clipIds(tile)).toHaveLength(1);
    expect(clipIds(preview)).not.toEqual(clipIds(tile));
    expect(clipIds(other)).not.toEqual(clipIds(tile));
    // Und die Kennung der Bühne ist von beiden verschieden.
    const stage = clipIds(creatureView('crocodile').render());
    expect(stage).toHaveLength(1);
    expect(clipIds(tile)).not.toEqual(stage);
    expect(clipIds(preview)).not.toEqual(stage);
  });

  it('zeigt dieselbe Zeichnung wie die Bühne — gleiche Ebenen, gleiche Reihenfolge', () => {
    for (const creature of CREATURES) {
      const view = creatureView(creature.id);
      const markup = view.portrait('kachel');
      let cursor = -1;
      for (const layer of [
        'creature__body',
        'mouth__hole',
        'mouth__inner',
        'jaw__shell',
        'jaw__upper',
        'teeth--upper',
        'class="teeth"',
        'jaw__lower',
        'creature__face',
      ]) {
        const position = markup.indexOf(layer);
        expect(position, `${creature.id}: ${layer}`).toBeGreaterThan(cursor);
        cursor = position;
      }
      // Gleicher Ausschnitt, gleiche Zahl gezeichneter Zähne, gleiche Zahnformen.
      expect(markup, creature.id).toContain(`viewBox="0 0 ${view.viewBox.width} ${view.viewBox.height}"`);
      expect(markup.match(/tooth__shape/g), creature.id).toHaveLength(creature.teeth);
      expect(markup.match(/tooth__glow/g), creature.id).toBeNull();
      expect(view.portrait('kachel'), creature.id).toBe(view.portrait('kachel'));
    }
  });

  it('zeichnet die Zahnformen für abweichende Zahnzahlen genau wie die Bühne', () => {
    for (const creature of CREATURES) {
      for (const count of [MIN_TEETH, MAX_TEETH]) {
        const view = creatureView(creature.id, count);
        const shapes = (markup: string): string[] =>
          [...markup.matchAll(/class="tooth__shape" d="([^"]+)"/g)].map((match) => match[1] ?? '');
        expect(shapes(view.portrait('kachel')), `${creature.id}/${count}`).toEqual(shapes(view.render()));
      }
    }
  });

  it('spiegelt die Zahnarten über die Zwillingsregel (Zwilling von i ist count - i)', () => {
    // Zahn 0 sitzt in der Ringmitte unten, Zahn count/2 in der Ringmitte oben. Der Spiegelpartner
    // von Zahn i (im Markup 1-basiert) ist deshalb count + 2 - i.
    //
    // Geprüft wird bei der Standardzahnzahl jedes Lebewesens und bei jeder GERADEN Zahnzahl. Bei
    // ungeraden Zahlen trägt die Ringmitte oben keinen Zahn (nur bei geraden liegt dort einer);
    // dort flankieren die Eckzähne von Vampir, Panther und Säbelzahntiger bewusst die Mitte und
    // sind dann nicht spiegelgleich — siehe AGENTS.md, „Freundliche Zeichnung".
    const kindsOf = (markup: string): string[] =>
      [...markup.matchAll(/data-tooth="(\d+)" data-kind="(\w+)"/g)]
        .map((match) => [Number(match[1]), match[2] ?? ''] as const)
        .sort((a, b) => a[0] - b[0])
        .map(([, kind]) => kind);

    for (const creature of CREATURES) {
      // Wirklich jede gerade Zahl: anfangs liefen hier nur Standard und 12 — der Kommentar oben
      // versprach mehr, als der Test hielt.
      for (let count = 2; count <= MAX_TEETH; count += 2) {
        const kinds = kindsOf(creatureView(creature.id, count).render());
        expect(kinds, `${creature.id}/${count}`).toHaveLength(count);
        for (let nr = 1; nr <= count; nr += 1) {
          const partner = ((count - nr + 2 - 1) % count) + 1;
          expect(kinds[nr - 1], `${creature.id}/${count}: Zahn ${nr} gegen Zwilling ${partner}`).toBe(
            kinds[partner - 1],
          );
        }
      }
    }
  });
});
