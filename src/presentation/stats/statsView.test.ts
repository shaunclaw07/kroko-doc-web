// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
  MIN_SAMPLE_FOR_VERDICT,
  renderReport,
  dangerCurveHtml,
  dangerCurvePoints,
  renderDangerCurve,
  persistenceNote,
  sampleStatus,
} from './statsView';
import { createRoundRecord } from '../../core/domain/sessionLog';
import type { RoundRecord } from '../../contract/sessionLog';
import { fairRounds } from '../../infrastructure/testing/fairRounds';
import { SeededRandom } from '../../infrastructure/testing/seededRandom';

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

describe('renderReport bei gemischten Gebissen', () => {
  /** 360 faire Runden aus drei Gebissen — dieselben wie in `statistics.test.ts`. */
  function mixed(): RoundRecord[] {
    const rng = new SeededRandom(7);
    return [
      ...fairRounds(rng, 'crocodile', 120, 1),
      ...fairRounds(rng, 'mouse', 120, 121),
      ...fairRounds(rng, 'wolf', 120, 241),
    ];
  }

  it('wertet jedes Gebiss für sich aus und meldet bei fairen Runden nichts Auffälliges', () => {
    const target = mount();
    renderReport(target, mixed());
    const groups = Array.from(target.querySelectorAll('details.report-group'));
    expect(groups).toHaveLength(3);
    // Die erste Gruppe steht offen, die anderen sind eingeklappt.
    expect(groups.map((group) => group.hasAttribute('open'))).toEqual([true, false, false]);
    const titles = groups.map((group) => group.querySelector('summary')?.textContent ?? '');
    expect(titles).toContain('Krokodil · 10 Zähne · 1–3 scharf — 120 Runden');
    expect(titles).toContain('Maus · 6 Zähne · 1–2 scharf — 120 Runden');
    expect(titles).toContain('Wolf · 12 Zähne · 1–2 scharf — 120 Runden');
    expect(target.querySelector('.tag--bad')).toBeNull();
    expect(target.textContent).toContain('Jedes Gebiss wird für sich ausgewertet');
    expect(target.textContent).not.toContain('passt nicht zu den Daten');
  });

  it('zeigt beim Wolf das Modell, gegen das auch geprüft wird (5.42, nicht 4.69)', () => {
    const target = mount();
    renderReport(target, fairRounds(new SeededRandom(7), 'wolf', 120));
    const text = target.textContent ?? '';
    expect(text).toContain('5.42');
    expect(text).not.toContain('4.69');
    expect(text).toContain('Wolf · 12 Zähne · 1–2 scharf');
    expect(text).not.toContain('Jedes Gebiss wird für sich ausgewertet');
  });

  it('zeigt den Test gegen die Gleichverteilung der Druck-Position nur im Modus classic', () => {
    const original = mount();
    renderReport(original, fairRounds(new SeededRandom(7), 'crocodile', 120));
    expect(original.textContent).not.toContain('Druck-Position gegen Gleichverteilung');
    const classic = mount();
    renderReport(classic, fairRounds(new SeededRandom(7), 'crocodile', 120, 1, undefined, 'classic'));
    expect(classic.textContent).toContain('Druck-Position gegen Gleichverteilung');
    expect(classic.textContent).toContain('genau 1 scharf');
  });

  it('zeigt unter der Mindestzahl keine Muster-Marken', () => {
    const target = mount();
    renderReport(target, fairRounds(new SeededRandom(7), 'crocodile', 30));
    expect(target.textContent).toContain('Nicht genug Runden für eine Musterprüfung');
    expect(target.textContent).not.toContain('Versatz 1');
  });

  it('schreibt bei einer einzigen Runde die Einzahl', () => {
    const target = mount();
    renderReport(target, fairRounds(new SeededRandom(7), 'crocodile', 1));
    expect(target.querySelector('summary')?.textContent).toContain('— 1 Runde');
  });

  it('wirft nicht bei einem Lebewesen, das der Katalog nicht kennt', () => {
    // Die Ablage kann eine Kennung tragen, die es nicht (mehr) gibt — dort gilt das Krokodil.
    const target = mount();
    const fremd = records(3).map((record) => ({ ...record, creature: 'drache', pressIndex: 5 }));
    expect(() => renderReport(target, fremd)).not.toThrow();
    expect(target.textContent).toContain('Krokodil');
  });
});

describe('sampleStatus', () => {
  it('zählt bei einem einzigen Gebiss gegen die Mindestzahl', () => {
    expect(sampleStatus([])).toBe('0 von 100 Runden für eine belastbare Aussage.');
    expect(sampleStatus(records(40))).toBe('40 von 100 Runden für eine belastbare Aussage.');
    expect(sampleStatus(records(120))).toBe('120 Runden ausgewertet.');
  });

  it('behauptet bei mehreren dünnen Gebissen keine Auswertung, nur weil die Summe reicht', () => {
    const rng = new SeededRandom(7);
    const duenn = [...fairRounds(rng, 'crocodile', 80, 1), ...fairRounds(rng, 'mouse', 70, 81)];
    expect(sampleStatus(duenn)).toBe(
      '150 Runden in 2 Gebissen — das größte hat 80 von 100 Runden für eine belastbare Aussage.',
    );
    const gemischt = [...fairRounds(rng, 'crocodile', 120, 1), ...fairRounds(rng, 'mouse', 30, 121)];
    expect(sampleStatus(gemischt)).toBe(
      '150 Runden ausgewertet — 1 von 2 Gebissen haben genug Runden für eine belastbare Aussage.',
    );
  });
});

describe('persistenceNote', () => {
  it('benennt jede Antwort des Browsers mit einem eigenen Satz', () => {
    expect(persistenceNote('persistent')).toContain('zugesagt');
    expect(persistenceNote('best-effort')).toContain('keine Zusage');
    expect(persistenceNote('unknown')).toContain('sagt nicht');
  });

  it('nennt den CSV-Export als Ausweg, solange nichts zugesagt ist', () => {
    expect(persistenceNote('persistent')).not.toContain('CSV');
    expect(persistenceNote('best-effort')).toContain('CSV');
    expect(persistenceNote('unknown')).toContain('CSV');
  });
});

describe('Tests, die ein Gebiss nicht hergibt', () => {
  it('nennt bei einem einzigen Zahn „nicht prüfbar" statt „zu wenig Daten"', () => {
    const einZahn = Array.from({ length: MIN_SAMPLE_FOR_VERDICT }, (_, index) =>
      createRoundRecord({
        round: index + 1, playedAt: '2026-10-12T09:00:00.000Z', mode: 'original', teeth: 1, players: 1,
        loserTooth: 1, pressIndex: 1, liveCount: 1, pressOrder: [1],
      }),
    );
    const target = mount();
    renderReport(target, einZahn);
    expect(target.textContent).toContain('nicht prüfbar');
    expect(target.textContent).not.toContain('zu wenig Daten');
  });
});
