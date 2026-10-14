import { type RoundState, isFinalToothTension, remainingTeeth } from '../../core/domain/round';
import {
  dangerZoom,
  isHighDanger,
  isTense,
  pressProgress,
  pulseInterval,
  tensionForPress,
} from '../../core/domain/tension';

import { turnSentence } from './resultText';

export interface HudModelInput {
  round: RoundState;
  tension?: number;
  roundNumber: number;
}

export interface HudModel {
  remaining: number;
  remainingLabel: string;
  roundNumber: number;
  progressText: string;
  tensionText: string;
  turnSentence: string;
  roundOpen: boolean;
  finalToothWarning: boolean;
  howToVisible: boolean;
  meterPercent: number;
  beatMs: number;
  zoom: number;
  tense: boolean;
  danger: boolean;
  tension: number;
  status: 'open' | 'snapped';
}

export { turnSentence as formatTurnSentence };

/**
 * Reines Modell der Spielanzeige (HUD): berechnet alle Texte, Schalter und Messwerte
 * ohne Zugriff auf das DOM.
 */
export function hudModel({ round, tension = 0, roundNumber }: HudModelInput): HudModel {
  const roundOpen = round.status === 'open';
  const effectiveTension = roundOpen
    ? tensionForPress({
        pressIndex: round.pressOrder.length + 1,
        teeth: round.teeth,
        mode: round.mode,
        liveTeethMin: round.liveTeethMin,
        liveTeethMax: round.liveTeethMax,
      })
    : tension;

  const remaining = remainingTeeth(round);
  const pressIndex = round.pressOrder.length;
  const finalTooth = isFinalToothTension(round);
  const progress = pressProgress({ pressed: pressIndex, teeth: round.teeth });
  const danger = roundOpen && isHighDanger(effectiveTension);
  const tense = roundOpen && isTense(effectiveTension);

  return {
    remaining,
    remainingLabel: remaining === 1 ? 'Zahn übrig' : 'Zähne übrig',
    roundNumber,
    progressText: `${pressIndex} von ${round.teeth} gedrückt`,
    tensionText: roundOpen ? `Bissgefahr ${Math.round(effectiveTension * 100)} %` : 'Runde beendet',
    turnSentence: turnSentence(round),
    roundOpen,
    finalToothWarning: finalTooth,
    howToVisible: pressIndex === 0 && roundOpen && !finalTooth,
    meterPercent: Math.round(progress * 100),
    beatMs: pulseInterval(effectiveTension),
    zoom: roundOpen ? dangerZoom(effectiveTension) : 0,
    tense,
    danger,
    tension: effectiveTension,
    status: round.status,
  };
}
