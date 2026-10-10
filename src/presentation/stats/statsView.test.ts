// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { MIN_SAMPLE_FOR_VERDICT, renderReport } from './statsView';
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
