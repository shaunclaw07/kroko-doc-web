/**
 * Symbol-Sonde: erzeugt das App-Symbol aus der **eigenen Zeichnung** des Krokodils und prüft, dass
 * die ausgelieferten Dateien dazu passen.
 *
 * Das Symbol zeigt das Kopfbild (dieselbe Zeichnung wie die Tier-Auswahl — reine Zeichnung ohne
 * bedienbare Zähne) mit **geschlossenem Maul**. Die vier Regeln, mit denen die App beim Zuschnappen
 * das Maul schließt (`.creature.is-snapped …` in `presentation/styles/app.css`), sind hier
 * nachgebildet: Oberkiefer und Schnauze fahren um ihre Schließwege, Rachen und ruhende obere
 * Zahnreihe verschwinden.
 *
 * Neu erzeugen (nach jeder Änderung an der Zeichnung des Krokodils):
 *     ICON_NEU=1 pnpm vitest run src/icon.test.ts
 *     python3 scripts/icon-png.py          # rastern der PNG-Größen
 *
 * Der Vertrag der Zeichnungen selbst steht in creatureViews.test.ts — diese Sonde hält fest, dass
 * das Symbol nicht heimlich von der Zeichnung abdriftet.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ARTWORKS, creaturePortrait, creatureView } from './presentation/game/creatures';

const PROJEKT = fileURLToPath(new URL('..', import.meta.url));
const PUBLIC = join(PROJEKT, 'public');
const MANIFEST = join(PUBLIC, 'manifest.webmanifest');

/** Aus Krokodil-Zeichnung abgeleitet: Kachelfläche hinter dem Kopf, wie das vorige Symbol. */
const KACHEL = '#0d1a20';
const KACHEL_BREITE = 512;
/**
 * Zwei Fassungen aus derselben Zeichnung:
 *  - `RUND`       — die Kachel für Tab, Lesezeichen und Startbildschirm (Eckenrundung wie beim
 *                   vorigen Symbol: 14 von 64).
 *  - `MASKIERBAR` — für Android: voll gefüllt ohne Rundung, die Zeichnung kleiner, weil das System
 *                   den Rand anschneiden darf. 70 % der Breite liegt sicher in der Schutzzone
 *                   (Android schneidet bis auf 80 % zurück).
 */
const RUND = { zoom: 0.88, ecken: 14 / 64 };
const MASKIERBAR = { zoom: 0.7, ecken: 0 };
const LEBEWESEN = 'crocodile';

/** Die vier Änderungen des Zustands „geschnappt" — Werte aus den Schließwegen der App. */
function maulZu(markup: string, closeShift: number, shellShift: number): string {
  let zu = markup
    .replace(
      '<g class="jaw__upper">',
      `<g class="jaw__upper" transform="translate(0 ${closeShift.toFixed(1)})">`,
    )
    .replace(
      '<g class="jaw__shell">',
      `<g class="jaw__shell" transform="translate(0 ${shellShift.toFixed(1)})">`,
    );
  for (const tag of [
    '<g class="mouth__hole">',
    '<g class="mouth__inner">',
    '<g class="teeth teeth--upper">',
  ]) {
    zu = zu.replace(tag, `${tag.slice(0, -1)} opacity="0">`);
  }
  return zu;
}

/** Das vollständige Symbol: dunkle Kachel, darin der Kopf, eingepasst und mittig. */
function symbolSvg(rahmen: { zoom: number; ecken: number }): string {
  const view = creatureView(LEBEWESEN);
  // Schließwege: dieselbe Rechnung wie factory.ts (Oberkiefer voll, Schnauze anteilig).
  const closeShift = view.closeShift;
  const shellShift = closeShift * (ARTWORKS[LEBEWESEN]?.shellFactor ?? 0.55);
  const bild = creaturePortrait(LEBEWESEN, 'symbol');
  const innen = bild.slice(bild.indexOf('>') + 1, bild.lastIndexOf('</svg>'));

  const nutz = KACHEL_BREITE * rahmen.zoom;
  const skala = nutz / view.viewBox.width;
  const hoehe = view.viewBox.height * skala;
  const x = (KACHEL_BREITE - nutz) / 2;
  const y = (KACHEL_BREITE - hoehe) / 2;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${KACHEL_BREITE} ${KACHEL_BREITE}" ` +
    `role="img" aria-label="Krokodil mit geschlossenem Maul">` +
    `<rect width="${KACHEL_BREITE}" height="${KACHEL_BREITE}" ` +
    `rx="${(KACHEL_BREITE * rahmen.ecken).toFixed(0)}" fill="${KACHEL}"/>` +
    `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${skala.toFixed(5)})">` +
    maulZu(innen, closeShift, shellShift) +
    `</g></svg>`
  );
}

/** Breite und Höhe aus dem IHDR-Block eines PNG (die Datei muss echt sein, nicht nur da). */
function pngGroesse(pfad: string): [number, number] {
  const daten = readFileSync(pfad);
  expect(daten.subarray(1, 4).toString('ascii'), `${pfad}: keine PNG-Datei`).toBe('PNG');
  return [daten.readUInt32BE(16), daten.readUInt32BE(20)];
}

describe('App-Symbol', () => {
  const erwartet = symbolSvg(RUND);
  const erwartetMaskierbar = symbolSvg(MASKIERBAR);

  it('liegt als SVG vor und zeigt genau die aktuelle Zeichnung', () => {
    const dateien: [string, string][] = [
      ['favicon.svg', erwartet],
      ['icon-maskable.svg', erwartetMaskierbar],
    ];
    for (const [name, inhalt] of dateien) {
      const pfad = join(PUBLIC, name);
      if (process.env.ICON_NEU === '1') {
        writeFileSync(pfad, inhalt);
        console.log(`neu erzeugt: ${pfad}`);
      }
      expect(existsSync(pfad), `public/${name} fehlt — mit ICON_NEU=1 erzeugen`).toBe(true);
      expect(readFileSync(pfad, 'utf8'), name).toBe(inhalt);
    }
  });

  it('hält die maskierbare Fassung kleiner und randlos (Android schneidet den Rand an)', () => {
    const radius = (svg: string) => Number(svg.match(/<rect[^>]*rx="(\d+)"/)?.[1] ?? -1);
    const skalierung = (svg: string) => Number(svg.match(/scale\(([\d.]+)\)/)?.[1] ?? -1);
    expect(radius(erwartetMaskierbar)).toBe(0);
    expect(radius(erwartet)).toBeGreaterThan(0);
    expect(skalierung(erwartetMaskierbar)).toBeLessThan(skalierung(erwartet));
  });

  it('hat das Maul wirklich zu (Rachen und obere Zahnreihe verdeckt)', () => {
    // Die drei Teile, die im offenen Zustand den Rachen zeigen, sind unsichtbar …
    for (const tag of ['mouth__hole', 'mouth__inner', 'teeth teeth--upper']) {
      expect(erwartet).toContain(`class="${tag}" opacity="0"`);
    }
    // … und der Oberkiefer sitzt um den Schließweg tiefer.
    expect(erwartet).toContain(`class="jaw__upper" transform="translate(0 ${creatureView('crocodile').closeShift.toFixed(1)})"`);
  });

  it('rechnet die Schließwege genauso wie die Bühne', () => {
    // Gegenprobe an der App selbst: dieselben Werte, die die Bühne ins Markup schreibt.
    const buehne = creatureView(LEBEWESEN).render();
    const closeShift = creatureView(LEBEWESEN).closeShift;
    const shellShift = closeShift * (ARTWORKS[LEBEWESEN]?.shellFactor ?? 0.55);
    expect(buehne).toContain(`--close-shift: ${closeShift.toFixed(1)}px`);
    expect(buehne).toContain(`--shell-shift: ${shellShift.toFixed(1)}px`);
  });

  it('zeigt keine bedienbaren Zähne (dieselbe Regel wie die Tier-Auswahl)', () => {
    expect(erwartet).not.toContain('class="tooth"');
    expect(erwartet).not.toContain('data-tooth');
    expect(erwartet).not.toContain('class="creature"');
  });

  it('verweist auf nichts Fremdes (kein Netz, keine fremden Kennungen)', () => {
    // Der Namensraum ist der einzige erlaubte Netzverweis — sonst darf nichts nach draußen zeigen.
    const ohneNamensraum = erwartet.replace('xmlns="http://www.w3.org/2000/svg"', '');
    expect(ohneNamensraum).not.toContain('http');
    const verweise = [...erwartet.matchAll(/url\(#([\w-]+)\)/g)].map((treffer) => treffer[1]);
    const kennungen = [...erwartet.matchAll(/id="([\w-]+)"/g)].map((treffer) => treffer[1]);
    for (const verweis of verweise) {
      expect(kennungen, `url(#${verweis}) zeigt ins Leere`).toContain(verweis);
    }
  });

  it('steht im Manifest, und jede dort genannte Datei gibt es', () => {
    const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8')) as {
      icons: { src: string; sizes: string; type: string }[];
    };
    expect(manifest.icons.length).toBeGreaterThanOrEqual(4);
    for (const icon of manifest.icons) {
      const datei = join(PUBLIC, icon.src.replace(/^\.\//, ''));
      expect(existsSync(datei), `${icon.src} fehlt in public/`).toBe(true);
    }
    // Die Größen, die Android und iOS zum Installieren brauchen.
    const groessen = manifest.icons.map((icon) => icon.sizes);
    for (const pflicht of ['192x192', '512x512', '180x180', 'any']) {
      expect(groessen).toContain(pflicht);
    }
  });

  it('hat PNG-Größen, die zu ihren Namen passen', () => {
    const erwarteteGroessen: [string, number][] = [
      ['apple-touch-icon.png', 180],
      ['icon-192.png', 192],
      ['icon-512.png', 512],
      ['icon-maskable-512.png', 512],
    ];
    for (const [name, kante] of erwarteteGroessen) {
      const pfad = join(PUBLIC, name);
      expect(existsSync(pfad), `${name} fehlt — python3 scripts/icon-png.py laufen lassen`).toBe(true);
      expect(pngGroesse(pfad), name).toEqual([kante, kante]);
    }
  });
});
