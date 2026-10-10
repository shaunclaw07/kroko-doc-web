/**
 * Außenvertrag des Rundenprotokolls: was die Bedienung sehen darf.
 * Die Fachtypen liegen im Kern (core/domain/records), die Naht in core/ports.
 */
export type { RoundRecord } from '../core/domain/records';
export { CSV_HEADER } from '../core/domain/records';
