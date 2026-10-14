import type { HudModel } from './hudModel';
import type { RoundState } from '../../core/domain/round';
import { resultFact, resultText, resultTitle } from './resultText';
import { METER_HINT_KEY, type SessionMarkPort } from '../../core/ports/sessionMark';
import { gazeOffset, type Point } from './creatures/gaze';

export interface HudView {
  apply(model: HudModel): void;
  setArt(art: SVGElement | null): void;
  setStage(stage: HTMLElement | null): void;
  showResult(round: RoundState): void;
  revealMeterHint(marks?: SessionMarkPort, wait?: (ms: number, run: () => void) => void): void;
  lookAt(target: Point | null, eyes: Point | null): void;
  markBiter(toothId: number, anchor: Point): void;
  clearBiter(): void;
  markPressed(toothId: number): void;
  startPressBeat(beatMs: number): void;
  endPressBeat(): void;
  shake(level: number, tension: number, wait: (ms: number, run: () => void) => void): void;
  settle(reliefLevel: number, wait: (ms: number, run: () => void) => void): void;
  snap(toothId: number): void;
  clench(): void;
  twitch(toothId: number, wait: (ms: number, run: () => void) => void): void;
  tooth(toothId: number): SVGGElement | null;
}

const IDS = {
  remaining: 'hud-remaining',
  remainingLabel: 'hud-remaining-label',
  round: 'hud-round',
  progress: 'hud-progress',
  tension: 'hud-tension',
  turn: 'hud-turn',
  warning: 'hud-warning',
  howTo: 'how-to',
  meter: 'hud-meter',
  meterHint: 'hud-meter-hint',
  panel: 'hud-panel',
  resultPanel: 'result-panel',
  resultTitle: 'result-title',
  resultText: 'result-text',
  resultFact: 'result-fact',
  stats: 'hud-stats',
  newRound: 'new-round',
  stage: 'stage',
} as const;

function reducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Sicht des Spiels: wendet Modell-Werte, Bühneneffekte und Textanzeigen auf das DOM an.
 * Verwaltet alle Elementkennungen an einer Stelle.
 */
export function createHudView(
  doc: Document,
  stage: HTMLElement | null = null,
  art: SVGElement | null = null,
): HudView {
  let currentStage = stage;
  let currentArt = art;

  function resolveArt(): SVGElement | null {
    return currentArt?.isConnected ? currentArt : doc.querySelector<SVGElement>('.creature');
  }

  function resolveStage(): HTMLElement | null {
    return currentStage?.isConnected ? currentStage : (doc.getElementById(IDS.stage) as HTMLElement | null);
  }

  function setText(id: string, text: string): void {
    const el = doc.getElementById(id);
    if (el) {
      el.textContent = text;
    }
  }

  function toothElement(toothId: number): SVGGElement | null {
    return doc.querySelector<SVGGElement>(`.tooth[data-tooth="${toothId}"]`);
  }

  return {
    setArt(nextArt: SVGElement | null): void {
      currentArt = nextArt;
    },
    setStage(nextStage: HTMLElement | null): void {
      currentStage = nextStage;
    },
    tooth: toothElement,

    apply(model: HudModel): void {
      setText(IDS.remaining, String(model.remaining));
      setText(IDS.remainingLabel, model.remainingLabel);
      setText(IDS.round, String(model.roundNumber));
      setText(IDS.progress, model.progressText);
      setText(IDS.tension, model.tensionText);
      setText(IDS.turn, model.turnSentence);

      doc.getElementById(IDS.resultPanel)?.classList.toggle('hidden', model.roundOpen);
      doc.getElementById(IDS.stats)?.classList.toggle('hidden', !model.roundOpen);
      doc.getElementById(IDS.newRound)?.classList.toggle('is-next', !model.roundOpen);

      const warn = doc.getElementById(IDS.warning);
      if (warn) {
        warn.classList.toggle('hidden', !model.finalToothWarning);
        warn.textContent = model.finalToothWarning ? 'Nur noch ein Zahn — der ist garantiert scharf!' : '';
      }

      doc.getElementById(IDS.howTo)?.classList.toggle('hidden', !model.howToVisible);

      const meter = doc.getElementById(IDS.meter);
      meter?.style.setProperty('width', `${model.meterPercent}%`);

      const panel = doc.getElementById(IDS.panel);
      panel?.style.setProperty('--beat-ms', `${model.beatMs}ms`);
      panel?.classList.toggle('is-tense', model.tense);
      panel?.classList.toggle('is-danger', model.danger);
      panel?.classList.toggle('is-snapped', !model.roundOpen);

      const liveArt = resolveArt();
      liveArt?.classList.toggle('is-trembling', model.danger);
      liveArt?.classList.toggle('is-wary', model.tense && !model.danger);

      const liveStage = resolveStage();
      liveStage?.style.setProperty('--tension', model.tension.toFixed(3));
      liveStage?.style.setProperty('--zoom', model.zoom.toFixed(3));
      liveStage?.style.setProperty('--beat-ms', `${model.beatMs}ms`);
      if (liveStage) {
        liveStage.dataset.status = model.status;
        liveStage.dataset.tension = model.tension.toFixed(2);
      }
    },

    showResult(round: RoundState): void {
      const loser = round.loser;
      if (!loser) {
        return;
      }
      setText(IDS.resultTitle, resultTitle(round.players, loser.player));
      setText(IDS.resultText, resultText(round));
      setText(IDS.resultFact, resultFact(round.creatureId));
    },

    revealMeterHint(marks?: SessionMarkPort, wait?: (ms: number, run: () => void) => void): void {
      const hint = doc.getElementById(IDS.meterHint);
      if (!marks || !hint || marks.has(METER_HINT_KEY)) {
        return;
      }
      marks.mark(METER_HINT_KEY);
      hint.classList.remove('hidden');
      hint.addEventListener('click', () => hint.classList.add('hidden'), { once: true });
      wait?.(4000, () => hint.classList.add('hidden'));
    },

    lookAt(target: Point | null, eyes: Point | null): void {
      const liveArt = resolveArt();
      const offset = target && eyes ? gazeOffset(eyes, target) : { x: 0, y: 0 };
      liveArt?.style.setProperty('--look-x', offset.x.toFixed(2));
      liveArt?.style.setProperty('--look-y', offset.y.toFixed(2));
    },

    markBiter(toothId: number, anchor: Point): void {
      const group = doc.querySelector<SVGGElement>('.creature__biter');
      if (!group) {
        return;
      }
      group.setAttribute('transform', `translate(${anchor.x.toFixed(1)} ${anchor.y.toFixed(1)})`);
      const label = group.querySelector('.creature__biter-label');
      if (label) {
        label.textContent = `Zahn ${toothId}`;
      }
      group.setAttribute('opacity', '1');
    },

    clearBiter(): void {
      doc.querySelector('.creature__biter')?.setAttribute('opacity', '0');
    },

    markPressed(toothId: number): void {
      const tooth = toothElement(toothId);
      tooth?.classList.add('is-pressed');
      tooth?.setAttribute('aria-pressed', 'true');
    },

    startPressBeat(beatMs: number): void {
      resolveStage()?.style.setProperty('--press-beat', `${Math.max(1, Math.round(beatMs))}ms`);
      resolveArt()?.classList.add('is-pressing');
    },

    endPressBeat(): void {
      resolveArt()?.classList.remove('is-pressing');
    },

    shake(level: number, tension: number, wait: (ms: number, run: () => void) => void): void {
      const liveStage = resolveStage();
      if (reducedMotion() || !liveStage) {
        return;
      }
      liveStage.style.setProperty('--tension', String(Math.max(tension, level)));
      liveStage.classList.add('is-shaking');
      wait(430, () => liveStage?.classList.remove('is-shaking'));
    },

    settle(reliefLevel: number, wait: (ms: number, run: () => void) => void): void {
      const liveStage = resolveStage();
      const liveArt = resolveArt();
      this.endPressBeat();
      liveStage?.style.setProperty('--relief', reliefLevel.toFixed(2));
      liveArt?.classList.add('is-settling');
      wait(420, () => liveArt?.classList.remove('is-settling'));
    },

    snap(toothId: number): void {
      this.endPressBeat();
      const liveArt = resolveArt();
      liveArt?.classList.add('is-snapped');
      liveArt?.classList.add('is-lunging');
      toothElement(toothId)?.classList.add('is-live');
    },

    clench(): void {
      resolveArt()?.classList.add('is-clenching');
    },

    twitch(toothId: number, wait: (ms: number, run: () => void) => void): void {
      const liveArt = resolveArt();
      liveArt?.classList.add('is-twitching');
      wait(320, () => liveArt?.classList.remove('is-twitching'));
      const tooth = toothElement(toothId);
      tooth?.classList.add('is-live');
      wait(260, () => tooth?.classList.remove('is-live'));
    },
  };
}
