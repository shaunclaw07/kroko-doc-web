import { getCreature, listCreatures } from '../../core/domain/creature';
import type { NextUnlock } from '../../core/domain/unlocks';

/**
 * Was die Freischaltung dem Spieler sagt und zeigt: die Marke am gesperrten Tier, der Satz zum
 * Fortschritt, die Karte des neuen Tiers und das Konfetti. Welche Tiere offen sind, entscheidet
 * allein `core/domain/unlocks.ts` — hier steht nur die Sprache dazu.
 */

export function dativeName(creature: string, name: string): string {
  return getCreature(creature).grammar?.dative ?? name;
}

/** Name im Dativ samt Artikel: „dem Löwen", „der Venusfliegenfalle". */
function dativeWithArticle(creature: string, name: string): string {
  const grammar = getCreature(creature).grammar;
  return `${grammar?.feminine ? 'der' : 'dem'} ${dativeName(creature, name)}`;
}

/** Die Zahl bekommt ihr Substantiv: „Noch 1 Stern", „Noch 2 Sterne". */
export function missingStarsText(missing: number): string {
  return `Noch ${missing} ${missing === 1 ? 'Stern' : 'Sterne'}`;
}

/** Fehlende Sterne als Zeichen — für Kinder, die noch nicht lesen. */
export function missingStarsSymbols(missing: number): string {
  return '☆'.repeat(Math.max(0, missing));
}

export function progressSentence(next: NextUnlock): string {
  const to = getCreature(next.creature).grammar?.feminine ? 'zur' : 'zum';
  return `${missingStarsText(next.missing)} bis ${to} ${dativeName(next.creature, next.name)}.`;
}

/** Beschriftung einer gesperrten Kachel für Bildschirmleser. */
export function lockedTileLabel(name: string, missing: number): string {
  return `${name}, gesperrt — ${missingStarsText(missing).toLowerCase()}`;
}

/** Zählt Namen auf: „A", „A und B", „A, B und C". */
export function joinNames(names: readonly string[]): string {
  if (names.length <= 1) {
    return names[0] ?? '';
  }
  return `${names.slice(0, -1).join(', ')} und ${names[names.length - 1]}`;
}

/** Die Namen der Wesen mit 1–3 scharfen Zähnen als Aufzählung (für das Regeln-Blatt). */
export function threeLiveNames(): string {
  return joinNames(
    listCreatures()
      .filter((creature) => creature.liveTeethMax === 3)
      .map((creature) => creature.name),
  );
}

/**
 * Die Überschrift der Freischaltung — bewusst **ohne Oberbegriff**: „Neues Tier: Mensch!" passte
 * weder zum Menschen noch zum Vampir (gemeldet vom Auftraggeber am 13.10.2026).
 */
export function unlockTitle(found: readonly { name: string }[]): string {
  return `Neu dabei: ${joinNames(found.map((entry) => entry.name))}!`;
}

export function playLabel(creature: string, name: string): string {
  return `Mit ${dativeWithArticle(creature, name)} spielen`;
}

/** Das Schloss der gesperrten Kachel. */
export const LOCK_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" ' +
  'stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"></rect>' +
  '<path d="M8 11V8a4 4 0 0 1 8 0v3"></path></svg>';

const CONFETTI_COLORS = ['#f2c94c', '#8fce33', '#e8a0ae', '#6fc3df', '#f2994a', '#ffffff'];
const CONFETTI_PIECES = 90;

/**
 * Konfetti über den ganzen Bildschirm. Es fängt keinen Tipp ab (CSS), braucht kein Paket und
 * räumt sich selbst weg, wenn seine Animation endet — ohne Zeitgeber, der eine abgebaute Seite
 * träfe. Wer am Gerät „Bewegung reduzieren" eingestellt hat, bekommt keines.
 */
export function launchConfetti(doc: Document, random: () => number = Math.random): boolean {
  const reduced = doc.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  if (reduced) {
    return false;
  }
  doc.getElementById('confetti')?.remove();
  const layer = doc.createElement('div');
  layer.id = 'confetti';
  layer.className = 'confetti';
  layer.setAttribute('aria-hidden', 'true');
  for (let index = 0; index < CONFETTI_PIECES; index += 1) {
    const piece = doc.createElement('i');
    piece.style.left = `${(random() * 100).toFixed(1)}%`;
    piece.style.background = CONFETTI_COLORS[index % CONFETTI_COLORS.length] ?? '#ffffff';
    piece.style.animationDelay = `${(random() * 0.9).toFixed(2)}s`;
    piece.style.animationDuration = `${(2.2 + random() * 1.4).toFixed(2)}s`;
    piece.style.setProperty('--drift', `${Math.round((random() - 0.5) * 160)}px`);
    piece.style.setProperty('--spin', `${Math.round(360 + random() * 720)}deg`);
    layer.appendChild(piece);
  }
  // Die Schicht selbst läuft so lange wie das längste Stück; danach verschwindet sie.
  layer.addEventListener('animationend', (event) => {
    if (event.target === layer) {
      layer.remove();
    }
  });
  doc.body.appendChild(layer);
  return true;
}
