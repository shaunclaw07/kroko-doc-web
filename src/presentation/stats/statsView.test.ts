// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { MIN_SAMPLE_FOR_VERDICT, renderReport, dangerCurveHtml, dangerCurvePoints, renderDangerCurve } from './statsView';
import { createRoundRecord } from '../../core/domain/sessionLog';
import type { RoundRecord } from '../../contract/sessionLog';

/** Erzeugt ein Protokoll; mit `favouriteTooth` bekommt ein Zahn messbar mehr Bisse. */
function records(count: number, favouriteTooth: number | null = null): RoundRecord[] {
  return Array.from({ length: count }, (_, index) => {
    const loserTooth = favouriteTooth !== null && index % 2 === 0 ? favouriteTooth : (index % 10) + 1;
    return createRoundRecord({
      round: index + 1,
      playedAt: '2026-10-10T09:00:00.000Z',
      mode: 'original',
      teeth: 10,
      players: 1,
      loserTooth,
      pressIndex: ((loserTooth - 1) % 10) + 1,
      liveCount: 2,
      pressOrder: Array.from({ length: 10 }, (__, step) => ((step + loserTooth - 1) % 10) + 1),
    });
  });
}

function mount(): HTMLElement {
  document.body.innerHTML = '<div id="report-mount"></div>';
  return document.getElementById('report-mount') as HTMLElement;
}

describe('renderReport', () => {
  it('zeigt ohne Runden einen Hinweis statt Zahlen', () => {
    const target = mount();
    renderReport(target, []);
    expect(target.textContent).toContain('Noch keine Runden');
    expect(target.querySelector('.bars')).toBeNull();
  });

  it('bleibt unter der Mindestzahl ehrlich und lässt die Tests aus', () => {
    const target = mount();
    renderReport(target, records(MIN_SAMPLE_FOR_VERDICT - 1));
    expect(target.textContent).toContain('zu wenig Daten');
    expect(target.textContent).toContain('Für statistische Aussagen fehlen Runden');
  });

  it('rechnet ab genug Runden Chi2, Modellvergleich und Mustersuche', () => {
    const target = mount();
    renderReport(target, records(120));
    const text = target.textContent ?? '';
    expect(text).toContain('chi2');
    expect(text).toContain('Druck-Position gegen das Zugmodell');
    expect(text).toContain('Versatz 1');
    expect(target.querySelectorAll('.bar').length).toBeGreaterThanOrEqual(20);
    expect(text).toContain('3.97');
  });

  it('erkennt einen bevorzugten Zahn als auffällig', () => {
    const target = mount();
    renderReport(target, records(200, 4));
    const text = target.textContent ?? '';
    expect(text).toContain('auffällig');
    expect(target.querySelector('.tag--bad')).not.toBeNull();
  });

  it('zeigt die letzten Runden als Rohdaten', () => {
    const target = mount();
    renderReport(target, records(12));
    expect(target.querySelector('.report')?.textContent).toContain('Runde 12');
  });
});

describe('dangerCurveHtml', () => {
  const args = { creatureName: 'Krokodil', teeth: 10, mode: 'original' as const, liveTeethMin: 1, liveTeethMax: 3 };

  it('rechnet die Gefahr je Druck wie der Balken im Spiel', () => {
    const points = dangerCurvePoints(args);
    expect(points).toHaveLength(10);
    expect(points[0]).toBeCloseTo(0.2, 3);
    expect(points[9]).toBe(1);
    points.forEach((value, index) => {
      if (index > 0) {
        expect(value).toBeGreaterThan(points[index - 1] ?? 0);
      }
    });
  });

  it('zeigt eine Zeile je Zahn und markiert den letzten', () => {
    const html = dangerCurveHtml(args);
    expect(html.match(/class="bar"/g)).toHaveLength(10);
    expect(html).toContain('garantiert scharf');
    expect(html).toContain('20.0 %');
    expect(html).toContain('100.0 %');
  });

  it('faerbt ab 50 % heiss — der vorletzte Krokodil-Druck ist rot, der achte noch nicht', () => {
    // Diese Zeile ist der Stolperdraht der Schwelle. Bei 60 % war nur der letzte Druck rot (und
    // damit nie ein ueberstandener); bei 50 % ist es zusaetzlich der vorletzte (55,0 %).
    expect(dangerCurveHtml(args).match(/bar__fill--hot/g)).toHaveLength(2);
    const mouse = dangerCurveHtml({ ...args, creatureName: 'Maus', teeth: 6, liveTeethMin: 1, liveTeethMax: 2 });
    expect(mouse.match(/bar__fill--hot/g)).toHaveLength(2);
    // Der zweithoechste Wert des Krokodils (9. Druck) liegt bei 55,0 % — knapp darunter.
    expect(dangerCurvePoints(args)[8]).toBeCloseTo(0.55, 3);
  });

  it('rechnet im Modus classic mit 1 geteilt durch die uebrigen Zaehne', () => {
    expect(dangerCurvePoints({ ...args, mode: 'classic' })[0]).toBeCloseTo(0.1, 3);
  });

  it('ueberlebt eine Zahnzahl ohne Zaehne', () => {
    expect(dangerCurvePoints({ ...args, teeth: 0 })).toEqual([]);
    expect(() => dangerCurveHtml({ ...args, teeth: 0 })).not.toThrow();
  });

  it('schreibt bei einem einzigen Zahn die Einzahl', () => {
    // Am lebenden Gegenstand gesehen: der Bericht schrieb „Krokodil, 1 Zähne". Die Einzahl gilt
    // seit dem 11.10.2026, weil die kleinste Zahnzahl 1 ist — dieselbe Grenze wie im Spiel.
    const eins = dangerCurveHtml({ ...args, teeth: 1, liveTeethMin: 1, liveTeethMax: 1 });
    expect(eins).toContain('Krokodil, 1 Zahn<');
    expect(eins).not.toContain('1 Zähne');
    expect(dangerCurveHtml({ ...args, teeth: 2 })).toContain('2 Zähne');
  });

  it('bringt die Kurve in ein Element', () => {
    document.body.innerHTML = '<div id="mount"></div>';
    renderDangerCurve(document.getElementById('mount') as HTMLElement, args);
    expect(document.getElementById('mount')?.querySelectorAll('.bar')).toHaveLength(10);
  });
});
