import type { NextUnlock } from '../../core/domain/unlocks';

/**
 * Was die Freischaltung dem Spieler sagt und zeigt: die Marke am gesperrten Tier, der Satz zum
 * Fortschritt, die Karte des neuen Tiers und das Konfetti. Welche Tiere offen sind, entscheidet
 * allein `core/domain/unlocks.ts` — hier steht nur die Sprache dazu.
 */

/**
 * Namen im Dativ, wo er vom Katalognamen abweicht („bis zum Löwen", „mit dem Menschen").
 */
const DATIVE_NAMES: Readonly<Record<string, string>> = {
  human: 'Menschen',
  lion: 'Löwen',
};

/**
 * Wesen mit weiblichem Namen: „bis **zur** Venusfliegenfalle", „mit **der** Venusfliegenfalle".
 * Wer ein weiteres ergänzt, trägt es hier ein — der Test dazu nennt jedes Wesen der Folge beim
 * Namen und fällt bei einem, das hier fehlt.
 */
const FEMININE: ReadonlySet<string> = new Set(['flytrap']);

export function dativeName(creature: string, name: string): string {
  return DATIVE_NAMES[creature] ?? name;
}

/** Name im Dativ samt Artikel: „dem Löwen", „der Venusfliegenfalle". */
function dativeWithArticle(creature: string, name: string): string {
  return `${FEMININE.has(creature) ? 'der' : 'dem'} ${dativeName(creature, name)}`;
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
  const to = FEMININE.has(next.creature) ? 'zur' : 'zum';
  return `${missingStarsText(next.missing)} bis ${to} ${dativeName(next.creature, next.name)}.`;
}

/** Beschriftung einer gesperrten Kachel für Bildschirmleser. */
export function lockedTileLabel(name: string, missing: number): string {
  return `${name}, gesperrt — ${missingStarsText(missing).toLowerCase()}`;
}

/**
 * Die Überschrift der Freischaltung — bewusst **ohne Oberbegriff**: „Neues Tier: Mensch!" passte
 * weder zum Menschen noch zum Vampir (gemeldet vom Auftraggeber am 13.10.2026).
 */
export function unlockTitle(found: readonly { name: string }[]): string {
  const names = found.map((entry) => entry.name);
  const list =
    names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} und ${names[names.length - 1]}`;
  return `Neu dabei: ${list}!`;
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
