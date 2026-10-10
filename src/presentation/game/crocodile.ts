/**
 * Zeichnung des Krokodils als SVG-Markup. Bewusst als Zeichenkette, damit die
 * Bedienung sie einmal einsetzt und danach nur noch Klassen toggelt.
 *
 * Grundfarben stehen als SVG-Attribute direkt an den Formen. Das Stylesheet färbt
 * nur noch Zustände um (gedrückt, scharf, Maul zu) — so bleibt die Zeichnung auch
 * dann heil, wenn eine CSS-Regel mal nicht greift.
 *
 * Geometrie (Seitenansicht, Kopf links, viewBox 640x420):
 *  - Scharnier des Oberkiefers: (392, 250); das Maul steht offen, der Oberkiefer
 *    dreht beim Zuschnappen um -10 Grad (CSS .croc.is-snapped).
 *  - Die drückbaren Zähne stehen im Unterkiefer und ragen in die Mundhöhle.
 */

/** Scharnier — dieselben Werte stehen als transform-origin im Stylesheet. */
export const HINGE_X = 392;
export const HINGE_Y = 250;

const SNOUT_X = 58;
const TOOTH_FIRST_X = 112;
const TOOTH_LAST_X = 366;
const TOOTH_HEIGHT = 32;
const TOOTH_HALF_WIDTH = 12;

/** Kieferlinien: Ober- und Unterkiefer laufen zum Scharnier hin zusammen. */
function gumY(x: number): number {
  return 246 + (x - SNOUT_X) * ((262 - 246) / (396 - SNOUT_X));
}

function upperEdgeY(x: number): number {
  return 197 + (x - SNOUT_X) * ((232 - 197) / (392 - SNOUT_X));
}

/** Ankerpunkt für die Bissmarkierung: Mitte des Zahns, knapp über dem Zahnfleisch. */
export function toothAnchor(toothId: number, teeth: number): { x: number; y: number } {
  const positions = toothPositions(teeth);
  const index = Math.min(Math.max(toothId - 1, 0), positions.length - 1);
  const x = positions[index] ?? TOOTH_FIRST_X;
  return { x, y: gumY(x) - 30 };
}

/** X-Positionen der drückbaren Zähne — gleichmäßig über den Unterkiefer verteilt. */
export function toothPositions(teeth: number): number[] {
  if (teeth <= 1) {
    return [TOOTH_FIRST_X];
  }
  const step = (TOOTH_LAST_X - TOOTH_FIRST_X) / (teeth - 1);
  return Array.from({ length: teeth }, (_, index) => Number((TOOTH_FIRST_X + step * index).toFixed(2)));
}

function toothPath(x: number): string {
  const base = gumY(x);
  const tip = base - TOOTH_HEIGHT;
  const half = TOOTH_HALF_WIDTH;
  return [
    `M ${(x - half).toFixed(2)} ${base.toFixed(2)}`,
    `C ${(x - half + 2).toFixed(2)} ${(base - 13).toFixed(2)} ${(x - 5).toFixed(2)} ${(base - 26).toFixed(2)} ${x} ${tip.toFixed(2)}`,
    `C ${(x + 5).toFixed(2)} ${(base - 26).toFixed(2)} ${(x + half - 2).toFixed(2)} ${(base - 13).toFixed(2)} ${(x + half).toFixed(2)} ${base.toFixed(2)}`,
    'Z',
  ].join(' ');
}

function toothMarkup(teeth: number): string {
  return toothPositions(teeth)
    .map((x, index) => {
      const id = index + 1;
      const base = gumY(x);
      return [
        `<g class="tooth" data-tooth="${id}" role="button" tabindex="0" aria-pressed="false" aria-label="Zahn ${id} drücken">`,
        `<path class="tooth__shape" d="${toothPath(x)}" fill="#fbf7e8" stroke="#d9d0b0" stroke-width="1.5" />`,
        `<rect class="tooth__hit" x="${(x - 15).toFixed(2)}" y="${(base - TOOTH_HEIGHT - 12).toFixed(2)}" width="30" height="${TOOTH_HEIGHT + 26}" rx="10" fill="transparent" />`,
        '</g>',
      ].join('');
    })
    .join('');
}

/** Rückenkamm: Zacken sitzen auf der Rückenlinie des Rumpfes. */
function scutes(): string {
  const ridge: Array<[number, number]> = [
    [356, 182],
    [414, 168],
    [472, 172],
    [528, 186],
    [580, 206],
  ];
  return ridge
    .map(([x, y]) => `<path fill="#245b41" d="M ${x} ${y} L ${x + 19} ${y - 27} L ${x + 38} ${y + 5} Z" />`)
    .join('');
}

function steam(): string {
  return [
    '<g class="steam">',
    '<ellipse cx="100" cy="146" rx="10" ry="5.5" fill="#e8f4f0" opacity="0.42" />',
    '<ellipse cx="122" cy="134" rx="8" ry="4.5" fill="#e8f4f0" opacity="0.3" />',
    '</g>',
  ].join('');
}

/** Feste Zähne im Oberkiefer (nur Zeichnung) — bewusst in den Lücken der unteren. */
function upperTeeth(): string {
  const xs = [126, 211, 296, 352];
  return xs
    .map((x) => {
      const top = upperEdgeY(x) - 2;
      return `<path fill="#fbf7e8" stroke="#d9d0b0" stroke-width="1.2" d="M ${x - 8} ${top.toFixed(2)} C ${x - 5} ${(top + 7).toFixed(2)} ${x - 3} ${(top + 10).toFixed(2)} ${x} ${(top + 14).toFixed(2)} C ${x + 3} ${(top + 10).toFixed(2)} ${x + 5} ${(top + 7).toFixed(2)} ${x + 8} ${top.toFixed(2)} Z" />`;
    })
    .join('');
}

export function buildCrocodile(teeth: number): string {
  return [
    `<svg class="croc" viewBox="0 0 640 420" role="group" aria-label="Krokodil mit ${teeth} Zähnen, Maul offen">`,

    // --- Rumpf mit Schwanz und Beinen (unbeweglich) ---
    '<g class="croc__body">',
    '<path fill="#2f6b4f" d="M 330 190 C 420 158 520 168 604 208 C 642 226 636 268 596 278 C 520 300 410 302 330 288 Z" />',
    '<path fill="#4c8f6c" opacity="0.45" d="M 340 186 C 430 160 520 170 596 208 C 560 196 470 182 340 186 Z" />',
    scutes(),
    '<path fill="#2a6249" stroke="#1c4531" stroke-width="2" d="M 436 288 C 430 314 422 330 408 344 L 448 344 C 462 326 468 306 468 290 Z" />',
    '<path fill="#2a6249" stroke="#1c4531" stroke-width="2" d="M 540 296 C 536 318 530 332 518 344 L 558 344 C 570 328 574 310 572 298 Z" />',
    '<path fill="#d9cfa8" opacity="0.4" d="M 344 284 C 420 298 520 296 590 278 C 520 292 420 292 344 284 Z" />',
    '</g>',

    // --- Kopf: Unterkiefer (unbeweglich) ---
    '<g class="croc__lower">',
    '<path fill="#35745a" d="M 58 246 C 150 256 280 264 388 262 L 396 262 L 398 290 C 300 302 168 296 58 274 Z" />',
    '<path fill="#7a2f3f" d="M 58 246 C 150 256 280 264 388 262 L 388 270 C 280 272 150 264 58 254 Z" />',
    // Mundhöhle: zwischen Zahnfleischlinie und Unterkante des Oberkiefers
    '<path fill="#5e1f2c" d="M 58 246 C 150 256 280 264 390 262 L 393 232 C 330 208 240 190 140 186 C 108 184 78 188 58 194 Z" />',
    // Zunge
    '<path fill="#a8424f" d="M 104 242 C 200 250 300 254 372 252 L 372 258 C 300 260 200 256 104 248 Z" />',
    // Zähne des Unterkiefers (drückbar)
    '<g class="croc__teeth">',
    toothMarkup(teeth),
    '</g>',
    '</g>',

    // --- Kopf: Oberkiefer (beweglich, dreht um das Scharnier) ---
    '<g class="croc__upper">',
    '<path fill="#4b8f6b" d="M 54 158 C 140 138 250 142 340 172 L 392 194 L 394 232 L 340 208 C 240 188 140 182 54 194 Z" />',
    '<path fill="#6fb08a" opacity="0.5" d="M 60 164 C 140 148 240 150 330 178 L 336 188 C 240 164 140 160 60 176 Z" />',
    upperTeeth(),
    '<ellipse fill="#10221a" cx="86" cy="176" rx="7" ry="4.5" />',
    '<ellipse fill="#10221a" cx="108" cy="175" rx="7" ry="4.5" />',
    steam(),
    '<g class="croc__eye">',
    '<circle fill="#f7f4e6" cx="322" cy="172" r="16" />',
    '<ellipse fill="#245b41" cx="322" cy="157" rx="17" ry="7" />',
    '<circle fill="#10171b" cx="325" cy="175" r="7" />',
    '<circle fill="#ffffff" cx="328" cy="170" r="2.6" opacity="0.85" />',
    '</g>',
    '</g>',

    // Spannungs-Puls im Hals
    '<ellipse class="croc__heart" cx="152" cy="242" rx="62" ry="26" fill="#e2574c" opacity="0.3" />',

    // Bissmarkierung: liegt über allem, damit der scharfe Zahn auch bei
    // geschlossenem Maul zu sehen ist.
    '<g class="croc__biter" aria-hidden="true" opacity="0">',
    '<circle class="croc__biter-halo" cx="0" cy="0" r="30" fill="#e2574c" opacity="0.25" />',
    '<circle class="croc__biter-ring" cx="0" cy="0" r="19" fill="none" stroke="#e2574c" stroke-width="4" />',
    '<text class="croc__biter-label" x="0" y="-34" text-anchor="middle" fill="#ffd9d5" font-size="17" font-weight="bold">Zahn</text>',
    '</g>',

    `<text x="320" y="392" text-anchor="middle" fill="#b9ae95" font-size="15">${teeth} Zähne — antippen</text>`,
    '</svg>',
  ].join('');
}
