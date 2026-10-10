import type { RandomSource } from '../ports/random';

/**
 * Spannungsdramaturgie — reine Rechenregeln, damit sie prüfbar bleiben.
 * Die Bedienung übersetzt das Ergebnis in Ton, Bild und Vibration.
 */

/** Grundchance, dass das Maul zuckt, ohne zuzuschnappen. */
export const TWITCH_BASE_CHANCE = 0.12;
/** Kürzeste und längste "Totenstille" vor einer Entscheidung (Millisekunden). */
export const SILENCE_MIN_MS = 400;
export const SILENCE_MAX_MS = 900;
/** Herzschlag-Abstand an den Enden des Spannungsbereichs (Millisekunden). */
export const HEARTBEAT_SLOW_MS = 900;
export const HEARTBEAT_FAST_MS = 380;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/** Spannungspegel nach einem Druck: steigt mit jedem Druck und mit dem Rundenschwund. */
export function tensionAfterPress(args: {
  current: number;
  pressIndex: number;
  remaining: number;
  teeth: number;
}): number {
  const scarcity = args.teeth > 0 ? 1 - args.remaining / args.teeth : 0;
  return clamp01(args.current + 0.18 + 0.35 * scarcity + 0.02 * args.pressIndex);
}

/** Chance auf ein Zucken: nur bei harmlosen Drücken und nie beim letzten Zahn. */
export function twitchChance(args: { tension: number; remaining: number }): number {
  if (args.remaining <= 1) {
    return 0;
  }
  return clamp01(TWITCH_BASE_CHANCE * (0.6 + 0.9 * clamp01(args.tension)));
}

/** Länge der Totenstille: vor dem Biss lang und länger, je weniger Zähne übrig sind. */
export function silenceDuration(args: {
  willSnap: boolean;
  remaining: number;
  teeth: number;
  rng: RandomSource;
}): number {
  if (!args.willSnap) {
    return 0;
  }
  const scarcity = args.teeth > 1 ? 1 - (args.remaining - 1) / (args.teeth - 1) : 1;
  const base = SILENCE_MIN_MS + (SILENCE_MAX_MS - SILENCE_MIN_MS) * (0.4 + 0.6 * scarcity);
  const jitter = args.rng.next() * 60 - 30;
  return Math.round(Math.max(SILENCE_MIN_MS, Math.min(SILENCE_MAX_MS + 30, base + jitter)));
}

/** Herzschlag-Abstand in Millisekunden — höhere Spannung, schnellerer Puls. */
export function heartbeatInterval(tension: number): number {
  const level = clamp01(tension);
  return Math.round(HEARTBEAT_SLOW_MS - (HEARTBEAT_SLOW_MS - HEARTBEAT_FAST_MS) * level);
}

export interface PressDrama {
  /** Maul zuckt sichtbar, schnappt aber nicht zu. */
  twitch: boolean;
  /** Wartezeit vor der Entscheidung (0 = sofort). */
  silenceMs: number;
  /** Stärke des Bildschirmbebens 0..1. */
  shakeLevel: number;
  /** Spannungspegel nach diesem Druck 0..1. */
  tensionAfter: number;
}

export function planPressDrama(args: {
  tension: number;
  /** Kennt nur der Kern: schnappt dieser Druck zu? */
  willSnap: boolean;
  pressIndex: number;
  remaining: number;
  teeth: number;
  rng: RandomSource;
}): PressDrama {
  const tensionAfter = tensionAfterPress({
    current: args.tension,
    pressIndex: args.pressIndex,
    remaining: args.remaining,
    teeth: args.teeth,
  });
  if (args.willSnap) {
    return {
      twitch: false,
      silenceMs: silenceDuration(args),
      shakeLevel: clamp01(0.75 + 0.25 * tensionAfter),
      tensionAfter: 1,
    };
  }
  // Ehrlichkeitsregel: ein Zucken darf nur ein harmloser Druck auslösen — sonst
  // würde die Anzeige lügen (Maul zuckt, obwohl der Zahn scharf war).
  const twitch = args.rng.next() < twitchChance({ tension: args.tension, remaining: args.remaining });
  return {
    twitch,
    silenceMs: 0,
    shakeLevel: twitch ? clamp01(0.35 + 0.4 * tensionAfter) : 0,
    tensionAfter,
  };
}
