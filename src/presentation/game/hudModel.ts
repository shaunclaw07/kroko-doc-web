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

/**
 * Reines Modell der Spielanzeige (HUD): berechnet alle Texte, Schalter und Messwerte
 * ohne Zugriff auf das DOM.
 */
export function hudModel({ round, tension = 0, roundNumber }: HudModelInput): HudModel {
  // Die Gefahr des **nächsten** Drucks — und zwar auch vor dem ersten. Sonst stünde am
  // Rundenbeginn 0 %, obwohl der erste Druck bereits gefährlich ist.
  // Ist das Maul zu, gibt es keinen nächsten Druck — dann wird auch keine Gefahr mehr behauptet
  // (gemeldet: „Bissgefahr 100 % obwohl der Mund zu ist"; der Wert blieb vom Zuschnappen stehen,
  // dort ist er genau 1). Die Zeile nennt stattdessen den Ausgang.
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
  // Das Tier spürt die Gefahr mit: leichtes Zittern über 30 %, deutliches ab 50 % — dieselben
  // Schwellen wie der Balken, also dieselbe öffentliche Zahl. Bei geschlossenem Maul nie: eine
  // Animation am Oberkiefer überschriebe dort seine Schließ-Transformation.
  const danger = roundOpen && isHighDanger(effectiveTension);
  const tense = roundOpen && isTense(effectiveTension);

  return {
    remaining,
    // Einzahl, wenn nur ein Zahn übrig ist — dann steht er allein auf der Bühne.
    remainingLabel: remaining === 1 ? 'Zahn übrig' : 'Zähne übrig',
    roundNumber,
    progressText: `${pressIndex} von ${round.teeth} gedrückt`,
    tensionText: roundOpen ? `Bissgefahr ${Math.round(effectiveTension * 100)} %` : 'Runde beendet',
    turnSentence: turnSentence(round),
    roundOpen,
    finalToothWarning: finalTooth,
    // Die Anleitung gilt vor dem ersten Druck. Danach macht sie dem einmaligen Hinweis und der
    // Warnung Platz: auf 320 × 568 reicht die Höhe über der Leiste nicht für alle drei.
    howToVisible: pressIndex === 0 && roundOpen && !finalTooth,
    // Die Füllung ist der Fortschritt, nicht die Gefahr — die Gefahr trägt die Farbe.
    meterPercent: Math.round(progress * 100),
    beatMs: pulseInterval(effectiveTension),
    // Ab der Rot-Schwelle rückt die Bühne heran. Bei geschlossenem Maul gibt es keinen nächsten
    // Druck — dann auch keinen Zoom (wie die Gefahr-Anzeige, die dort verstummt).
    zoom: roundOpen ? dangerZoom(effectiveTension) : 0,
    tense,
    danger,
    tension: effectiveTension,
    status: round.status,
  };
}
