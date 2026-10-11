/**
 * Zeichnungsvertrag eines Lebewesens. Ein neues Tier ist ein Modul mit Kunstwerk-Daten
 * plus einem Eintrag in der Registry — die Steuerung kennt kein einzelnes Tier.
 */

export interface ToothSpec {
  /** Form des Zahns: Kegel (Raubtier), flach (Schneidezahn), quadratisch (Backenzahn). */
  kind: 'cone' | 'flat' | 'square';
  length: number;
  width: number;
}

/** Lage des drückbaren Zahnrings in SVG-Einheiten (Winkel in Grad, y zeigt nach unten). */
export interface RingGeometry {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  /** Erster drückbarer Zahn (rechte Seite des Unterkiefers). */
  fromDeg: number;
  /** Letzter drückbarer Zahn bei Teilbogen; bei fullCircle wird gleichmäßig verteilt. */
  toDeg: number;
  /**
   * Zähne rund um das ganze Maul verteilen (oben und unten). Verdoppelt den Platz je Zahn
   * und damit die Trefferfläche auf dem Handy.
   */
  fullCircle?: boolean;
}

/** Zahnfleisch- bzw. Lippenband auf dem Ring. */
export interface BandSpec {
  /** Dicke des Bandes; bei upperShell die Ausdehnung nach außen. */
  thickness: number;
  fromDeg: number;
  toDeg: number;
  fill: string;
  stroke?: string;
}

/**
 * Blick von vorne oben in das offene Maul. Die Ebenen zeichnet die Fabrik in fester
 * Reihenfolge: Hinterkopf, Maulöffnung, Rachen, Oberkiefer, Zähne, Unterkiefer, Gesicht.
 */
export interface CreatureArtwork {
  /**
   * Kopfumriss als Pfad — dient als Beschnitt. Ohne ihn ragen die Zahnfleischbänder beim
   * Zuschnappen neben dem Kopf heraus, weil der Oberkiefer über den Kopf hinausfährt.
   */
  silhouette: string;
  /** Kopf/Fell/Schnauzenkontur hinter allem — füllt beim Zuschnappen die Maulfläche. */
  body: string;
  /**
   * Farbe der Maulöffnung (Rachenloch). Die Form berechnet die Fabrik aus Ring und
   * Banddicken, damit die Öffnung exakt unter beiden Zahnfleischbändern verschwindet.
   */
  holeFill: string;
  /** Rachen und Zunge in der Öffnung. */
  inner: string;
  /** Oberkiefer-Band (Zahnfleisch/Lippe). */
  upper: BandSpec;
  /**
   * Sichtbarer Außenring des Oberkiefers (Schnauze, Lippe, Fellkante) — wächst vom Ring
   * nach außen. Liegt über der Kopfform und fährt beim Biss mit.
   */
  upperShell?: BandSpec;
  /** Anteil des Schließwegs, den die Schnauze mitfährt (0,55 = gut die Hälfte). */
  shellFactor?: number;
  /** Unterkiefer-Band. */
  lower: BandSpec;
  /** Zusätzliche Zeichnung am Oberkiefer (Schnauzenspitze, Nüstern) — fährt mit. */
  upperExtra?: string;
  /** Zusätzliche Zeichnung am Unterkiefer (Lippe, Kinn) — bleibt liegen. */
  lowerExtra?: string;
  /** Ruhige Teile über dem Maul: Augen, Ohren, Nüstern. */
  face: string;
  /**
   * Zahnprofil als Funktion der eingestellten Zahnzahl (Standard des Tieres, vom Nutzer
   * änderbar). So bleibt ein Gebiss auch bei 6 oder 20 Zähnen stimmig: der Wolf behält
   * seine vier Fangzähne, der Mensch seine Schneide-, Eck- und Backenzähne.
   */
  teethProfile: (count: number) => ToothSpec[];
  ring: RingGeometry;
  /** Beschreibung für Screenreader. */
  label: string;
}

export interface ToothAnchor {
  x: number;
  y: number;
}

export interface CreatureView {
  readonly id: string;
  readonly name: string;
  readonly teeth: number;
  readonly viewBox: { width: number; height: number };
  /** Wie weit der Oberkiefer beim Biss fährt (aus Ring und Banddicken berechnet). */
  readonly closeShift: number;
  /** Fertiges SVG-Markup der Bühne. */
  render(): string;
  /**
   * Kopfbild desselben Tieres für Kacheln und Vorschauen: reine Zeichnung, ohne bedienbare Zähne.
   * `suffix` macht die Beschnitt-Kennung eindeutig, weil mehrere Kopfbilder und die Bühne
   * gleichzeitig im Dokument stehen.
   */
  portrait(suffix: string): string;
  /** Spitze eines Zahns — Anker für die Bissmarkierung. */
  toothAnchor(toothId: number): ToothAnchor;
}
