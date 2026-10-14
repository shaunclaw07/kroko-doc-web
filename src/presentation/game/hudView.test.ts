// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { createHudView } from './hudView';
import type { HudModel } from './hudModel';

const DOM = `
  <div id="stage"><div id="croc-mount"><svg class="creature"></svg></div></div>
  <span id="hud-round"></span><span id="hud-remaining"></span>
  <span id="hud-turn"></span><span id="hud-warning"></span>
  <span id="hud-remaining-label"></span>
  <div class="tension-panel" id="hud-panel">
    <div class="tension-meter"><div class="tension-meter__fill" id="hud-meter"></div></div>
    <div class="meter-legend"><span id="hud-progress"></span><span id="hud-tension"></span></div>
    <p id="hud-meter-hint" class="hidden"></p>
  </div>
  <button id="new-round" type="button">Neue Runde</button>
  <p id="how-to"></p>
  <section id="hud-stats"></section>
  <section id="result-panel" class="hidden"><h2 id="result-title"></h2><p id="result-text"></p><p id="result-fact"></p></section>
`;

function sampleModel(overrides: Partial<HudModel> = {}): HudModel {
  return {
    remaining: 8,
    remainingLabel: 'Zähne übrig',
    roundNumber: 1,
    progressText: '2 von 10 gedrückt',
    tensionText: 'Bissgefahr 25 %',
    turnSentence: 'Du bist dran',
    roundOpen: true,
    finalToothWarning: false,
    howToVisible: false,
    meterPercent: 20,
    beatMs: 800,
    zoom: 0,
    tense: false,
    danger: false,
    tension: 0.25,
    status: 'open',
    ...overrides,
  };
}

describe('hudView', () => {
  it('überträgt Modell-Werte auf die DOM-Elemente', () => {
    document.body.innerHTML = DOM;
    const stage = document.getElementById('stage');
    const art = document.querySelector<SVGElement>('.creature');
    const hud = createHudView(document, stage, art);

    hud.apply(sampleModel());

    expect(document.getElementById('hud-round')?.textContent).toBe('1');
    expect(document.getElementById('hud-remaining')?.textContent).toBe('8');
    expect(document.getElementById('hud-remaining-label')?.textContent).toBe('Zähne übrig');
    expect(document.getElementById('hud-progress')?.textContent).toBe('2 von 10 gedrückt');
    expect(document.getElementById('hud-tension')?.textContent).toBe('Bissgefahr 25 %');
    expect(document.getElementById('hud-turn')?.textContent).toBe('Du bist dran');
    expect(document.getElementById('hud-meter')?.style.width).toBe('20%');

    expect(stage?.dataset.status).toBe('open');
    expect(stage?.dataset.tension).toBe('0.25');
    expect(document.getElementById('result-panel')?.classList.contains('hidden')).toBe(true);
    expect(document.getElementById('hud-stats')?.classList.contains('hidden')).toBe(false);
  });

  it('setzt Klassen bei hoher Gefahr und geschlossenem Maul', () => {
    document.body.innerHTML = DOM;
    const stage = document.getElementById('stage');
    const art = document.querySelector<SVGElement>('.creature');
    const hud = createHudView(document, stage, art);

    hud.apply(
      sampleModel({
        roundOpen: false,
        status: 'snapped',
        tension: 1.0,
        tensionText: 'Runde beendet',
        turnSentence: 'Maul zu',
        danger: false,
        tense: false,
      }),
    );

    const panel = document.getElementById('hud-panel');
    expect(panel?.classList.contains('is-snapped')).toBe(true);
    expect(document.getElementById('result-panel')?.classList.contains('hidden')).toBe(false);
    expect(document.getElementById('hud-stats')?.classList.contains('hidden')).toBe(true);
    expect(document.getElementById('new-round')?.classList.contains('is-next')).toBe(true);
  });
});
