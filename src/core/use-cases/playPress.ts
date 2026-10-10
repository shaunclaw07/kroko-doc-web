import { pressTooth, type RoundState } from '../domain/round';
import { planPressDrama, type PressDrama } from '../domain/tension';
import type { RandomSource } from '../ports/random';
import type { ToothId } from '../domain/teeth';

export interface PressOutcome {
  state: RoundState;
  drama: PressDrama;
  snapped: boolean;
  /** Zahn, bei dem es schnappte (null, wenn der Druck harmlos war). */
  tooth: ToothId;
}

/**
 * Ein Druck auf einen Zahn samt Dramaturgie. Die Dramaturgie braucht das Wissen,
 * ob dieser Zahn scharf ist — dieses Wissen bleibt damit im Kern und nicht in der
 * Bedienung, die es sonst über die Zeitsteuerung verraten könnte.
 */
export function playPress(args: {
  state: RoundState;
  tooth: ToothId;
  rng: RandomSource;
}): PressOutcome {
  const willSnap = args.state.live.includes(args.tooth);
  const drama = planPressDrama({
    willSnap,
    pressIndex: args.state.pressOrder.length + 1,
    remaining: args.state.teeth - args.state.pressOrder.length,
    teeth: args.state.teeth,
    // Die Spannung kommt aus dem Modell der Runde — es wird kein Pegel durchgereicht.
    mode: args.state.mode,
    liveTeethMin: args.state.liveTeethMin,
    liveTeethMax: args.state.liveTeethMax,
    rng: args.rng,
  });
  const state = pressTooth(args.state, args.tooth);
  return { state, drama, snapped: willSnap, tooth: args.tooth };
}
