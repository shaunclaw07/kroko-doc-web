/**
 * Belegt den Mechanismus des flakigen Gates — nicht die Häufigkeit.
 *
 * Der Herzschlag der Steuerung hing am GLOBALEN `window` (alte Fassung, Zeile 296). Die Testumgebung
 * baut am Ende ab und ENTFERNT das globale Fenster — die Zeitgeber der Umgebung laufen aber weiter.
 * Ein dann feuernder Rückruf findet `window` nicht mehr und stirbt als unbehandelter
 * ReferenceError: das Gate endet mit Code 1, ohne dass ein Test fachlich rot war.
 *
 * Die neue Fassung hängt am Fenster des DOKUMENTS (`document.defaultView`) und wird mit `dispose()`
 * abgehängt: nichts kann mehr ins Leere feuern.
 */
const { JSDOM } = require('jsdom');

function warte(ms) {
  return new Promise((fertig) => setTimeout(fertig, ms));
}

function fangeEin(sammler) {
  process.once('uncaughtException', (fehler) => sammler.push(`unbehandelt: ${fehler.name}: ${fehler.message}`));
}

async function alteFassung() {
  const dom = new JSDOM('<!doctype html><body></body>');
  global.window = dom.window;
  const feuer = [];
  fangeEin(feuer);
  // genau das Muster der alten Steuerung: das globale Fenster
  window.setTimeout(() => {
    window.clearTimeout(0);
    feuer.push('kein Fehler');
  }, 40);
  // so baut die Testumgebung ab: das globale Fenster verschwindet, die Zeitgeber laufen weiter
  delete global.window;
  await warte(150);
  return feuer[0] ?? 'Zeitgeber kam nicht';
}

async function neueFassung() {
  const dom = new JSDOM('<!doctype html><body><div id="buehne"></div></body>');
  const doc = dom.window.document;
  global.window = dom.window;
  const feuer = [];
  fangeEin(feuer);
  const fenster = doc.defaultView;
  const kennung = fenster.setTimeout(() => feuer.push('Herzschlag lief, obwohl abgehängt — FALSCH'), 40);
  fenster.clearTimeout(kennung); // das tut `dispose()`
  delete global.window; // die Umgebung baut ab
  // ein später Rückruf, wie ihn `this.wait(...)` hinterlässt: er rührt nur das Dokument an
  doc.defaultView?.setTimeout(() => {
    const buehne = doc.getElementById('buehne');
    feuer.push(`später Rückruf: ${buehne === null ? 'kein Element' : 'Element da, kein Fehler'}`);
  }, 40);
  await warte(150);
  return feuer.length === 0 ? 'nichts feuerte (alles abgehängt)' : feuer.join(' | ');
}

(async () => {
  console.log('alte Fassung (globales window):', await alteFassung());
  console.log('neue Fassung (Fenster des Dokuments, abgehängt):', await neueFassung());
})();
