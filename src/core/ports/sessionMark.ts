/**
 * Merkt sich Ereignisse — aber nur für die laufende Sitzung. Gedacht für Hinweise, die man
 * genau einmal sehen soll: dauerhaft gespeichert wären sie beim nächsten Besuch weg, obwohl der
 * Spieler sie vielleicht nie gelesen hat.
 */
export interface SessionMarkPort {
  /** Wurde dieser Hinweis in dieser Sitzung schon gezeigt? */
  has(key: string): boolean;
  /** Als gezeigt vermerken. */
  mark(key: string): void;
}

/** Schlüssel des Hinweises, der den Balken erklärt. */
export const METER_HINT_KEY = 'hint:meter';
