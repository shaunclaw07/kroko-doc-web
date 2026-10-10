import type { LiveTeethSelector } from '../ports/liveTeeth';
import type { RandomSource } from '../ports/random';
import { DomainError } from './errors';
import { isValidPlayerCount, isValidToothCount, type RandomMode, type ToothId } from './teeth';

export interface RoundConfig {
  teeth: number;
  mode: RandomMode;
  players: number;
}

export interface RoundDeps {
  rng: RandomSource;
  selector: LiveTeethSelector;
}

export interface LoserInfo {
  tooth: ToothId;
  /** Bei welchem Druck der Runde (1-basiert) es schnappte. */
  pressIndex: number;
  /** 1-basierter Spieler, der den scharfen Zahn gedrückt hat. */
  player: number;
  /** Wie viele Zähne gleichzeitig scharf waren (Ursache der Spannung). */
  liveCount: number;
}

export interface RoundState {
  readonly teeth: number;
  readonly mode: RandomMode;
  readonly players: number;
  readonly status: 'open' | 'snapped';
  /** Gedrückte Zähne in der Reihenfolge des Drückens. */
  readonly pressOrder: readonly ToothId[];
  /** Scharfe Zähne — die Bedienung darf sie nie anzeigen, solange die Runde läuft. */
  readonly live: readonly ToothId[];
  readonly loser: LoserInfo | null;
}

function assertConfig(config: RoundConfig): void {
  if (!isValidToothCount(config.teeth)) {
    throw new DomainError('invalid-tooth-count', `tooth count ${config.teeth} is not allowed`);
  }
  if (!isValidPlayerCount(config.players)) {
    throw new DomainError('invalid-player-count', `player count ${config.players} is not allowed`);
  }
}

function assertPressable(state: RoundState, tooth: number): void {
  if (!Number.isInteger(tooth) || tooth < 1 || tooth > state.teeth) {
    throw new DomainError('tooth-out-of-range', `tooth ${tooth} is out of range 1..${state.teeth}`);
  }
  if (state.status !== 'open') {
    throw new DomainError('round-finished', 'round is already finished');
  }
  if (state.pressOrder.includes(tooth)) {
    throw new DomainError('tooth-already-pressed', `tooth ${tooth} is already pressed`);
  }
}

function playerFor(pressIndex: number, players: number): number {
  return ((pressIndex - 1) % players) + 1;
}

/** Öffnet eine Runde: zieht die scharfen Zähne, noch ist kein Zahn gedrückt. */
export function openRound(config: RoundConfig, deps: RoundDeps): RoundState {
  assertConfig(config);
  const live = deps.selector.select(deps.rng, config.teeth, config.mode);
  return {
    teeth: config.teeth,
    mode: config.mode,
    players: config.players,
    status: 'open',
    pressOrder: [],
    live: [...live].sort((a, b) => a - b),
    loser: null,
  };
}

/** Ein Druck auf einen Zahn. Unveränderlich: gibt einen neuen Zustand zurück. */
export function pressTooth(state: RoundState, tooth: ToothId): RoundState {
  assertPressable(state, tooth);
  const pressOrder = [...state.pressOrder, tooth];
  const pressIndex = pressOrder.length;
  if (state.live.includes(tooth)) {
    return {
      ...state,
      status: 'snapped',
      pressOrder,
      loser: { tooth, pressIndex, player: playerFor(pressIndex, state.players), liveCount: state.live.length },
    };
  }
  return { ...state, pressOrder };
}

export function remainingTeeth(state: RoundState): number {
  return state.teeth - state.pressOrder.length;
}

/** Nur noch ein ungedrückter Zahn: der ist zwangsläufig scharf — höchste Spannung. */
export function isFinalToothTension(state: RoundState): boolean {
  return state.status === 'open' && remainingTeeth(state) === 1;
}
