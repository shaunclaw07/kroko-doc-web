export type DomainErrorCode =
  | 'tooth-out-of-range'
  | 'tooth-already-pressed'
  | 'round-finished'
  | 'invalid-tooth-count'
  | 'invalid-player-count';

/** Regelverstoß im Kern. Die Bedienung fängt ihn und zeigt eine eigene Meldung. */
export class DomainError extends Error {
  readonly code: DomainErrorCode;

  constructor(code: DomainErrorCode, message: string) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
  }
}
