import type { HapticsPort } from '../../core/ports/haptics';
import type { SoundPort } from '../../core/ports/sound';
import type { LiveTeethSelector } from '../../core/ports/liveTeeth';
import type { RandomSource } from '../../core/ports/random';
import type { RoundRecord } from '../../contract/sessionLog';
import type { RoundLogPort } from '../../core/ports/roundLog';
import { openRound, remainingTeeth, isFinalToothTension, type RoundState } from '../../core/domain/round';
import { UniformLiveTeethSelector } from '../../core/domain/liveTeeth';
import {
  VERDICT_GAP_MS,
  dangerZoom,
  isHighDanger,
  isTense,
  pressProgress,
  pulseInterval,
  reliefLevel,
  survivedDanger,
  tensionForPress,
  type PressDrama,
} from '../../core/domain/tension';
import { METER_HINT_KEY, type SessionMarkPort } from '../../core/ports/sessionMark';
import { createRoundRecord, nextRoundNumber } from '../../core/domain/sessionLog';
import { type RandomMode } from '../../core/domain/teeth';
import { getCreature } from '../../core/domain/creature';
import { playPress } from '../../core/use-cases/playPress';
import { creatureView, type CreatureView } from './creatures';
import { clientToViewBox, gazeOffset, midpoint, type Point } from './creatures/gaze';
import type { GameSettings } from '../../infrastructure/storage/localStorageSettings';

export interface GameDeps {
  rng: RandomSource;
  /** Standard ist die gleichverteilte Auswahl; Tests geben eine feste Auswahl vor. */
  selector?: LiveTeethSelector;
  sound: SoundPort;
  /** Tast-Rückmeldung. Standard ist keine — so bleiben Tests und Umgebungen ohne Vibration ruhig. */
  haptics?: HapticsPort;
  /** Merkt sich den Balken-Hinweis für die Sitzung. Ohne diesen Port kommt kein Hinweis. */
  session?: SessionMarkPort;
  log: RoundLogPort;
  settings: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
  document: Document;
  /** Für Tests und Vorschauen austauschbar; Standard sind echte Timer. */
  wait?: (ms: number, run: () => void) => void;
  /** Uhr in Millisekunden für die Haltedauer; Standard ist `performance.now()` des Dokumentfensters. */
  now?: () => number;
}

/** Tast-Rückmeldung: ein kurzer Tipp bei jedem Zahndruck, drei Stöße beim Zuschnappen (ms). */
const TAP_VIBRATION_MS = 25;
const BITE_VIBRATION_PATTERN = [120, 50, 220] as const;
/** Kürzester Stoß bei der Erleichterung (ms) — wächst mit der erlebten Pause. */
const RELIEF_VIBRATION_MIN_MS = 12;
/** Zweite Stufe des Bisses: der Kiefer zieht nach (ms). */
const BITE_LATCH_MS = 120;
/** So lange braucht der Zahn, um unter dem Finger zu sinken (ms) — nur Bild, kein Urteil. */
const HOLD_SINK_MS = 320;
/**
 * Längstes Halten (ms). Danach federt der Zahn zurück, **ohne** Zug: ein verlorenes Loslassen
 * (Tabwechsel, Systemdialog) darf nichts entscheiden und die Bühne nicht sperren.
 */
const HOLD_MAX_MS = 4000;

/** Ein Finger liegt auf einem Zahn — entschieden ist noch nichts. */
interface Hold {
  toothId: number;
  pointerId: number;
  startedAt: number;
}

function playerName(player: number, players: number): string {
  return players === 1 ? 'Du' : `Spieler ${player}`;
}

export class GameController {
  private readonly doc: Document;
  private readonly deps: GameDeps;
  private readonly selector: LiveTeethSelector;
  private readonly wait: (ms: number, run: () => void) => void;
  private readonly now: () => number;
  /** Das laufende Halten; höchstens eines zugleich. */
  private hold: Hold | null = null;
  /** Nach `dispose()` rührt die Steuerung sich nicht mehr — späte Zeitgeber laufen ins Leere. */
  private disposed = false;
  private round: RoundState;
  private tension = 0;
  private busy = false;
  private stage: HTMLElement | null = null;
  private view: CreatureView | null = null;
  private art: SVGElement | null = null;
  /** Mitte zwischen den Pupillen des gezeichneten Tiers — von dort aus schaut es. */
  private eyes: Point | null = null;
  private records: RoundRecord[];

  constructor(deps: GameDeps) {
    this.deps = deps;
    this.doc = deps.document;
    this.wait =
      deps.wait ??
      ((ms, run) =>
        void this.win()?.setTimeout(() => {
          if (!this.disposed) {
            run();
          }
        }, ms));
    this.now = deps.now ?? (() => this.win()?.performance.now() ?? 0);
    this.selector = deps.selector ?? new UniformLiveTeethSelector();
    this.records = deps.log.load();
    this.round = this.newRound();
  }

  private newRound(): RoundState {
    return openRound(
      {
        creatureId: this.deps.settings.creature,
        teeth: this.deps.settings.teethOverride ?? undefined,
        mode: this.deps.settings.mode,
        players: this.deps.settings.players,
      },
      { rng: this.deps.rng, selector: this.selector },
    );
  }

  /** Zeichnet das gewählte Lebewesen und verbindet seine Zähne. */
  private buildStage(mountPoint: HTMLElement): void {
    this.view = creatureView(this.round.creatureId, this.round.teeth);
    mountPoint.innerHTML = this.view.render();
    this.art = this.doc.querySelector('.creature');
    // Die Augenmitte gehört zu **diesem** Tier; ein neues Tier oder eine neue Runde schaut geradeaus.
    const pupils = Array.from(this.art?.querySelectorAll('.pupil') ?? []);
    this.eyes = midpoint(
      pupils.map((pupil) => ({ x: Number(pupil.getAttribute('cx')), y: Number(pupil.getAttribute('cy')) })),
    );
    this.lookAt(null);
    this.wireTeeth();
  }

  /** Baut Bühne und Zähne auf und verbindet alle Bedienelemente. */
  mount(): void {
    const mountPoint = this.doc.getElementById('croc-mount');
    if (mountPoint) {
      this.buildStage(mountPoint);
    }
    this.stage = this.doc.getElementById('stage');
    this.stage?.addEventListener('pointermove', this.onStagePointer);
    this.stage?.addEventListener('pointerdown', this.onStagePointer);
    // Das Loslassen wird am Dokument gehört: mit der Maus endet es dort, wo der Zeiger gerade
    // steht — nicht unbedingt auf dem Zahn.
    this.doc.addEventListener('pointerup', this.onPointerUp);
    this.doc.addEventListener('pointercancel', this.onPointerCancel);
    this.doc.getElementById('new-round')?.addEventListener('click', () => this.resetRound());
    this.render();
  }

  private wireTeeth(): void {
    const teeth = this.doc.querySelectorAll<SVGGElement>('.tooth');
    teeth.forEach((tooth) => {
      const id = Number(tooth.dataset.tooth ?? '0');
      tooth.addEventListener('pointerdown', (event) => {
        const pointer = event as PointerEvent;
        // Nur der erste Finger bzw. die Haupttaste — ein zweiter Finger beginnt keinen Druck.
        if (!pointer.isPrimary || pointer.button !== 0) {
          return;
        }
        this.beginHold(id, pointer.pointerId);
      });
      // Ein Zeiger-Tipp endet zusätzlich mit `click` (detail ≥ 1) — den Zug hat `pointerup` schon
      // ausgelöst. Ein `click` ohne Zeiger (detail 0) kommt von Tastatur und Hilfstechnik.
      tooth.addEventListener('click', (event) => {
        if ((event as MouseEvent).detail === 0) {
          this.handlePress(id);
        }
      });
      // Langes Halten darf kein Systemmenü öffnen.
      tooth.addEventListener('contextmenu', (event) => event.preventDefault());
      tooth.addEventListener('keydown', (event) => {
        const key = (event as KeyboardEvent).key;
        if (key === 'Enter' || key === ' ' || key === 'Spacebar') {
          event.preventDefault();
          this.handlePress(id);
        }
      });
    });
  }

  private tooth(id: number): SVGGElement | null {
    return this.doc.querySelector<SVGGElement>(`.tooth[data-tooth="${id}"]`);
  }

  private canPress(toothId: number): boolean {
    return !this.busy && this.round.status === 'open' && !this.round.pressOrder.includes(toothId);
  }

  private readonly onPointerUp = (event: Event): void => {
    const hold = this.hold;
    const pointer = event as PointerEvent;
    if (!hold || pointer.pointerId !== hold.pointerId) {
      return;
    }
    if (this.releasedOnTooth(pointer, hold.toothId)) {
      this.releaseHold();
    } else {
      this.cancelHold();
    }
  };

  private readonly onPointerCancel = (event: Event): void => {
    if (this.hold && (event as PointerEvent).pointerId === this.hold.pointerId) {
      this.cancelHold();
    }
  };

  /** Liegt der Zeiger beim Loslassen noch auf dem Zahn? Wer ihn wegschiebt, nimmt den Druck zurück. */
  private releasedOnTooth(pointer: PointerEvent, toothId: number): boolean {
    // jsdom kennt `elementFromPoint` nicht — dort gilt jedes Loslassen als auf dem Zahn.
    if (typeof this.doc.elementFromPoint !== 'function') {
      return true;
    }
    const under = this.doc.elementFromPoint(pointer.clientX, pointer.clientY);
    return under !== null && this.tooth(toothId)?.contains(under) === true;
  }

  /** Was der Finger sofort merkt: Stoß und Klang. Verrät nichts — es hängt nur an der Gefahr. */
  private feelPress(): void {
    if (this.deps.settings.vibration) {
      this.vibrate(TAP_VIBRATION_MS);
    }
    this.deps.sound.play('tap', this.tension);
    this.deps.sound.play('creak', this.tension);
    this.deps.sound.play('breath', this.tension);
  }

  /**
   * Der Finger liegt auf: der Zahn sinkt, der Kiefer knarrt, das Tier hält den Atem an.
   * Entschieden ist noch nichts — `playPress` läuft erst beim Loslassen.
   */
  private beginHold(toothId: number, pointerId: number): void {
    if (this.hold || !this.canPress(toothId)) {
      return;
    }
    const hold: Hold = { toothId, pointerId, startedAt: this.now() };
    this.hold = hold;
    this.deps.sound.unlock();
    this.tooth(toothId)?.classList.add('is-held');
    this.startPressBeat(HOLD_SINK_MS);
    this.feelPress();
    // Die Obergrenze gehört zu **diesem** Halten — ein späteres rührt sie nicht an.
    this.wait(HOLD_MAX_MS, () => {
      if (this.hold === hold) {
        this.cancelHold();
      }
    });
  }

  /** Der Zahn federt zurück, ohne Zug: Finger weggeschoben, Geste abgebrochen oder zu lange gezögert. */
  private cancelHold(): void {
    const hold = this.hold;
    if (!hold) {
      return;
    }
    this.hold = null;
    this.tooth(hold.toothId)?.classList.remove('is-held');
    this.endPressBeat();
    this.deps.sound.stopAll();
  }

  private releaseHold(): void {
    const hold = this.hold;
    if (!hold) {
      return;
    }
    this.hold = null;
    this.resolvePress(hold.toothId, Math.max(0, this.now() - hold.startedAt), true);
  }

  /** Kurzer Druck ohne Halten — Tastatur und Hilfstechnik. */
  private handlePress(toothId: number): void {
    if (this.hold || !this.canPress(toothId)) {
      return;
    }
    this.deps.sound.unlock();
    this.resolvePress(toothId, 0, false);
  }

  /**
   * Der Zug: jetzt erst wird gezogen. `heldMs` ist die Zeit, die der Finger schon auflag — die
   * Pause des Kerns ist die Mindestpause, gewartet wird nur noch ihr Rest. `felt` sagt, ob Stoß,
   * Klang und Sink-Bewegung schon beim Auflegen kamen.
   */
  private resolvePress(toothId: number, heldMs: number, felt: boolean): void {
    this.busy = true;
    const outcome = playPress({ state: this.round, tooth: toothId, rng: this.deps.rng });
    this.round = outcome.state;
    this.tension = outcome.drama.tensionAfter;
    this.deps.sound.setTension(this.tension);
    this.tooth(toothId)?.classList.remove('is-held');
    this.markPressed(toothId);
    // Das Tier schaut auf den Zahn, der gerade gedrückt wurde — auch bei Tastatur ohne Zeiger.
    this.lookAt(this.view?.toothAnchor(toothId) ?? null);
    this.render();

    if (!felt) {
      // Die Pause: sie kommt bei jedem Druck, und ihre Länge sagt nichts über den Ausgang.
      this.startPressBeat(outcome.drama.beatMs);
      this.feelPress();
    }
    // Die Erleichterung wächst mit der Pause, die der Spieler **erlebt** hat — auch der gehaltenen.
    const drama: PressDrama = {
      ...outcome.drama,
      reliefLevel: reliefLevel(Math.max(outcome.drama.beatMs, heldMs)),
    };
    // Das Urteil gehört zu **dieser** Runde. Startet in der Pause eine neue („Neue Runde", eine
    // Einstellung), läuft es ins Leere — sonst schnappte das Maul über einer offenen Runde zu.
    const played = this.round;
    this.wait(Math.max(0, outcome.drama.beatMs - heldMs), () => {
      if (this.round !== played) {
        return;
      }
      // Der Riss: alles reißt ab. Die Lücke ist für beide Ausgänge gleich — 60 ms nichts.
      // Die Pose der Pause bleibt dabei stehen, erst das Urteil löst sie auf.
      this.deps.sound.stopAll();
      this.wait(VERDICT_GAP_MS, () => {
        if (this.round !== played) {
          return;
        }
        if (outcome.snapped) {
          this.snap(toothId);
          return;
        }
        this.settle(toothId, drama);
      });
    });
  }

  /** Zeigt die Pause im Bild: der Zahn sinkt, der Kiefer knarrt, das Tier hält den Atem an. */
  private startPressBeat(beatMs: number): void {
    this.stage?.style.setProperty('--press-beat', `${Math.max(1, Math.round(beatMs))}ms`);
    this.art?.classList.add('is-pressing');
  }

  private endPressBeat(): void {
    this.art?.classList.remove('is-pressing');
  }

  /**
   * Harmloser Ausgang: die Feder kommt zur Ruhe. Die Erleichterung wächst mit der Pause — die hat
   * der Spieler selbst erlebt, sie verrät also nichts.
   */
  private settle(toothId: number, drama: PressDrama): void {
    this.endPressBeat();
    this.stage?.style.setProperty('--relief', drama.reliefLevel.toFixed(2));
    this.art?.classList.add('is-settling');
    this.wait(420, () => this.art?.classList.remove('is-settling'));
    this.deps.sound.play('settle', drama.reliefLevel);
    if (this.deps.settings.vibration) {
      const stoß = RELIEF_VIBRATION_MIN_MS + Math.round((TAP_VIBRATION_MS - RELIEF_VIBRATION_MIN_MS) * drama.reliefLevel);
      this.vibrate(stoß);
    }
    // Das Zucken ist ein eigener Schreck — es kommt nach der Erleichterung.
    if (drama.twitch) {
      this.deps.sound.play('twitch', this.tension);
      this.twitch(toothId);
    }
    this.busy = false;
  }

  private snap(toothId: number): void {
    this.busy = false;
    this.endPressBeat();
    this.deps.sound.play('snap', 1);
    if (this.deps.settings.vibration) {
      this.vibrate(BITE_VIBRATION_PATTERN);
    }
    this.art?.classList.add('is-snapped');
    this.art?.classList.add('is-lunging');
    this.tooth(toothId)?.classList.add('is-live');
    this.markBiter(toothId);
    this.shake(1);
    this.render();
    this.recordRound();
    this.showResult();
    // Zweite Stufe: der Kiefer zieht nach — das Maul wirkt wie eine Feder, nicht wie ein Sprung.
    // Dazu die Stimme des Tiers. Beides gehört zu **dieser** Runde: startet in den 120 ms eine
    // neue, bekäme sonst die offene Zeichnung den zusammengebissenen Kiefer.
    const bitten = this.round;
    this.wait(BITE_LATCH_MS, () => {
      if (this.round !== bitten) {
        return;
      }
      this.art?.classList.add('is-clenching');
      this.shake(0.45);
      this.deps.sound.playVoice(bitten.creatureId);
    });
  }

  private twitch(toothId: number): void {
    this.art?.classList.add('is-twitching');
    this.shake(0.45);
    this.wait(320, () => this.art?.classList.remove('is-twitching'));
    const tooth = this.tooth(toothId);
    tooth?.classList.add('is-live');
    // Immer zurücknehmen: dieser Zahn war harmlos. Die Bedingung „nur bei offener Runde" ließ das
    // Glühen stehen, wenn der nächste Druck binnen 260 ms zuschnappte — im Endbild sah dann ein
    // harmloser Zahn scharf aus.
    this.wait(260, () => tooth?.classList.remove('is-live'));
  }

  /** Zeigt Ring und Beschriftung an der Stelle des scharfen Zahns. */
  private markBiter(toothId: number): void {
    const group = this.doc.querySelector<SVGGElement>('.creature__biter');
    if (!group) {
      return;
    }
    const anchor = this.view?.toothAnchor(toothId) ?? { x: 0, y: 0 };
    group.setAttribute('transform', `translate(${anchor.x.toFixed(1)} ${anchor.y.toFixed(1)})`);
    const label = group.querySelector('.creature__biter-label');
    if (label) {
      label.textContent = `Zahn ${toothId}`;
    }
    group.setAttribute('opacity', '1');
  }

  private clearBiter(): void {
    this.doc.querySelector('.creature__biter')?.setAttribute('opacity', '0');
  }

  private markPressed(toothId: number): void {
    const tooth = this.tooth(toothId);
    tooth?.classList.add('is-pressed');
    tooth?.setAttribute('aria-pressed', 'true');
  }

  /**
   * Richtet den Blick auf einen Punkt der Zeichnung (`null` = geradeaus). Der Versatz hängt nur
   * an Augenmitte und Ziel — nie an den scharfen Zähnen.
   */
  private lookAt(target: Point | null): void {
    const offset = target && this.eyes ? gazeOffset(this.eyes, target) : { x: 0, y: 0 };
    this.art?.style.setProperty('--look-x', offset.x.toFixed(2));
    this.art?.style.setProperty('--look-y', offset.y.toFixed(2));
  }

  /** Der Zeiger über der Bühne zieht den Blick mit — solange das Maul offen ist. */
  private readonly onStagePointer = (event: Event): void => {
    if (this.disposed || !this.art || this.round.status !== 'open') {
      return;
    }
    const pointer = event as PointerEvent;
    const at = clientToViewBox({ x: pointer.clientX, y: pointer.clientY }, this.art.getBoundingClientRect());
    if (at) {
      this.lookAt(at);
    }
  };

  private shake(level: number): void {
    if (this.reducedMotion() || !this.stage) {
      return;
    }
    this.stage.style.setProperty('--tension', String(Math.max(this.tension, level)));
    this.stage.classList.add('is-shaking');
    this.wait(430, () => this.stage?.classList.remove('is-shaking'));
  }

  private reducedMotion(): boolean {
    return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private vibrate(pattern: number | readonly number[]): void {
    // Der Port kapselt die Browser-Schnittstelle: hier steht kein navigator-Zugriff mehr,
    // damit die Bedienung auch ohne Vibration (iOS-Safari, Tests) prüfbar bleibt.
    this.deps.haptics?.vibrate(pattern);
  }

  /**
   * Das Fenster des Dokuments. Bewusst **nie** das globale `window`: nach dem Abbau der
   * Testumgebung gibt es das nicht mehr, ein spät feuernder Zeitgeber endete dann als
   * unbehandelter Fehler und machte das Gate unzuverlässig (gemessen: 1 von 7 Läufen).
   */
  private win(): (Window & typeof globalThis) | null {
    return this.doc.defaultView ?? null;
  }

  /**
   * Die Steuerung abhängen: späte Zeitgeber rühren nichts mehr an. Der Test ruft das nach jedem
   * Fall auf — so läuft kein Rückruf in eine schon abgebaute Umgebung.
   */
  dispose(): void {
    this.hold = null;
    this.stage?.removeEventListener('pointermove', this.onStagePointer);
    this.stage?.removeEventListener('pointerdown', this.onStagePointer);
    this.doc.removeEventListener('pointerup', this.onPointerUp);
    this.doc.removeEventListener('pointercancel', this.onPointerCancel);
    this.disposed = true;
  }

  private recordRound(): void {
    const loser = this.round.loser;
    if (!loser) {
      return;
    }
    // Erst lesen, dann anhängen: die Statistikseite (anderer Tab, oder vor der Zurück-Taste) kann
    // das Protokoll inzwischen gelöscht oder per Import erweitert haben. Mit dem Stand vom
    // Seitenstart überschrieb das Spiel beides (gemessen am 12.10.2026: 3 gelöschte Runden waren
    // wieder da, 5 importierte weg).
    this.records = this.deps.log.load();
    this.records.push(
      createRoundRecord({
        round: nextRoundNumber(this.records),
        playedAt: new Date().toISOString(),
        mode: this.round.mode,
        creature: this.round.creatureId,
        teeth: this.round.teeth,
        players: this.round.players,
        loserTooth: loser.tooth,
        pressIndex: loser.pressIndex,
        liveCount: loser.liveCount,
        pressOrder: this.round.pressOrder,
      }),
    );
    this.deps.log.save(this.records);
    this.doc.dispatchEvent(new CustomEvent('kroko:round-finished', { detail: { records: this.records.length } }));
  }

  /**
   * Liest das Protokoll neu — für den Fall, dass es außerhalb dieser Steuerung geändert wurde
   * (Statistikseite in einem anderen Tab, Rückkehr über die Zurück-Taste). Sonst zeigte die
   * Rundennummer bis zum nächsten Biss den alten Stand.
   */
  syncLog(): void {
    this.records = this.deps.log.load();
    this.render();
  }

  /** Öffnet eine neue Runde mit den aktuellen Einstellungen. */
  resetRound(): void {
    // Ein laufendes Halten gehört zur alten Runde — sein Loslassen darf die neue nicht treffen.
    this.hold = null;
    this.clearBiter();
    this.round = this.newRound();
    // Schon der erste Druck hat eine Gefahr — der Balken startet nicht bei null.
    this.tension = this.tensionOfNextPress();
    this.busy = false;
    const mountPoint = this.doc.getElementById('croc-mount');
    if (mountPoint) {
      this.buildStage(mountPoint);
    }
    this.deps.sound.setTension(0);
    this.render();
  }

  applySettings(settings: GameSettings): void {
    const modeChanged = settings.mode !== this.deps.settings.mode;
    const playersChanged = settings.players !== this.deps.settings.players;
    const creatureChanged = settings.creature !== this.deps.settings.creature;
    const teethChanged = settings.teethOverride !== this.deps.settings.teethOverride;
    Object.assign(this.deps.settings, settings);
    this.deps.onSettingsChange(settings);
    this.deps.sound.setMuted(!settings.sound);
    if (modeChanged || playersChanged || creatureChanged || teethChanged) {
      this.resetRound();
      // Das neue Tier stellt sich vor. Der Tipp auf die Kachel ist die Nutzergeste — die Seite
      // gibt den Ton bei `pointerup` frei, also vor diesem `click`.
      if (creatureChanged) {
        // Was vom vorigen Tier noch klingt (seine Stimme, die Tonfolge nach dem Biss), bricht ab —
        // sonst reden beim schnellen Durchtippen der Köpfe mehrere Tiere durcheinander.
        this.deps.sound.stopAll();
        this.deps.sound.playVoice(settings.creature);
      }
    } else if (!settings.sound) {
      this.deps.sound.stopAll();
    }
  }

  private render(): void {
    // Die Gefahr des **nächsten** Drucks — und zwar auch vor dem ersten. Sonst stünde am
    // Rundenbeginn 0 %, obwohl der erste Druck bereits gefährlich ist.
    // Ist das Maul zu, gibt es keinen nächsten Druck — dann wird auch keine Gefahr mehr behauptet
    // (gemeldet: „Bissgefahr 100 % obwohl der Mund zu ist"; der Wert blieb vom Zuschnappen stehen,
    // dort ist er genau 1). Die Zeile nennt stattdessen den Ausgang.
    const roundOpen = this.round.status === 'open';
    if (roundOpen) {
      this.tension = this.tensionOfNextPress();
    }
    const remaining = remainingTeeth(this.round);
    const pressIndex = this.round.pressOrder.length;
    const currentPlayer = (pressIndex % this.round.players) + 1;
    this.setText('hud-remaining', String(remaining));
    // Einzahl, wenn nur ein Zahn übrig ist — dann steht er allein auf der Bühne.
    this.setText('hud-remaining-label', remaining === 1 ? 'Zahn übrig' : 'Zähne übrig');
    this.setText('hud-round', String(this.records.length + 1));
    // Die Zeile unter dem Balken: links der Fortschritt, rechts die Gefahr — beide mit Wort.
    this.setText('hud-progress', `${pressIndex} von ${this.round.teeth} gedrückt`);
    this.setText(
      'hud-tension',
      roundOpen ? `Bissgefahr ${Math.round(this.tension * 100)} %` : 'Runde beendet',
    );
    this.setText('hud-turn', this.turnSentence(currentPlayer));
    // Das Ergebnis steht auf der Seite, solange das Maul zu ist — an der Stelle des Spielstands,
    // denn bei geschlossenem Maul gibt es keine Zähne mehr zu zählen. Die neue Runde räumt es weg.
    this.doc.getElementById('result-panel')?.classList.toggle('hidden', roundOpen);
    this.doc.getElementById('hud-stats')?.classList.toggle('hidden', !roundOpen);
    // „Neue Runde" steht immer in der Leiste. Bei geschlossenem Maul ist er der nächste Schritt
    // und wird betont.
    this.doc.getElementById('new-round')?.classList.toggle('is-next', !roundOpen);
    const finalTooth = isFinalToothTension(this.round);
    const warn = this.doc.getElementById('hud-warning');
    if (warn) {
      warn.classList.toggle('hidden', !finalTooth);
      warn.textContent = finalTooth ? 'Nur noch ein Zahn — der ist garantiert scharf!' : '';
    }
    // Die Anleitung gilt vor dem ersten Druck. Danach macht sie dem einmaligen Hinweis und der
    // Warnung Platz: auf 320 × 568 reicht die Höhe über der Leiste nicht für alle drei.
    this.doc
      .getElementById('how-to')
      ?.classList.toggle('hidden', pressIndex > 0 || !roundOpen || finalTooth);
    const meter = this.doc.getElementById('hud-meter');
    // Die Füllung ist der Fortschritt, nicht die Gefahr — die Gefahr trägt die Farbe.
    const progress = pressProgress({ pressed: pressIndex, teeth: this.round.teeth });
    meter?.style.setProperty('width', `${Math.round(progress * 100)}%`);
    // Die Zustandsklassen gehören an den Kasten, der Balken und Zeile **enthält** (`#hud-panel`).
    // An der Bühne hat sie keine Regel erreicht — der Balken liegt außerhalb von `.stage`, die
    // Gefahrfarbe kam dort nie an (gemessen im Browser, `docs/e2e-nachweise.md` §5t).
    const panel = this.doc.getElementById('hud-panel');
    panel?.style.setProperty('--beat-ms', `${pulseInterval(this.tension)}ms`);
    panel?.classList.toggle('is-tense', roundOpen && isTense(this.tension));
    panel?.classList.toggle('is-danger', roundOpen && isHighDanger(this.tension));
    panel?.classList.toggle('is-snapped', !roundOpen);
    // Das Tier spürt die Gefahr mit: leichtes Zittern über 30 %, deutliches ab 50 % — dieselben
    // Schwellen wie der Balken, also dieselbe öffentliche Zahl. Bei geschlossenem Maul nie: eine
    // Animation am Oberkiefer überschriebe dort seine Schließ-Transformation.
    const danger = roundOpen && isHighDanger(this.tension);
    this.art?.classList.toggle('is-trembling', danger);
    this.art?.classList.toggle('is-wary', roundOpen && isTense(this.tension) && !danger);
    // Die Bühne behält ihre eigenen Werte: `--tension` färbt das Bild dunkler, `--beat-ms` taktet
    // den Puls, `data-status`/`data-tension` tragen die Sonden.
    this.stage?.style.setProperty('--tension', this.tension.toFixed(3));
    // Ab der Rot-Schwelle rückt die Bühne heran. Bei geschlossenem Maul gibt es keinen nächsten
    // Druck — dann auch keinen Zoom (wie die Gefahr-Anzeige, die dort verstummt).
    this.stage?.style.setProperty('--zoom', (roundOpen ? dangerZoom(this.tension) : 0).toFixed(3));
    this.stage?.style.setProperty('--beat-ms', `${pulseInterval(this.tension)}ms`);
    if (this.stage) {
      this.stage.dataset.status = this.round.status;
      this.stage.dataset.tension = this.tension.toFixed(2);
    }
    if (pressIndex >= 1) {
      this.revealMeterHint();
    }
  }

  /**
   * Erklärt den Balken genau einmal je Sitzung — beim ersten Druck. Danach nie wieder: ein Hinweis,
   * der in jeder Runde neu auftaucht, ist keine Hilfe mehr, sondern eine Zumutung. Antippen blendet
   * ihn sofort weg.
   */
  private revealMeterHint(): void {
    const marks = this.deps.session;
    const hint = this.doc.getElementById('hud-meter-hint');
    if (!marks || !hint || marks.has(METER_HINT_KEY)) {
      return;
    }
    marks.mark(METER_HINT_KEY);
    hint.classList.remove('hidden');
    hint.addEventListener('click', () => hint.classList.add('hidden'), { once: true });
    this.wait(4000, () => hint.classList.add('hidden'));
  }

  /**
   * Zugzeile. Bei einem Spieler heißt es „Du bist dran“ — die erste Fassung klebte „ ist dran“ an
   * `playerName()` und schrieb damit „Du ist dran“. Bei mehreren Spielern genügt der Name: die
   * Spielerzahl steht in den Einstellungen, sie muss nicht in jedem Zug wiederholt werden.
   */
  private turnSentence(player: number): string {
    if (this.round.status === 'snapped') {
      return 'Maul zu';
    }
    return this.round.players === 1 ? 'Du bist dran' : `${playerName(player, this.round.players)} ist dran`;
  }

  /** Gefahr des nächsten Drucks — dieselbe Rechnung wie im Kern, nur für die Anzeige. */
  private tensionOfNextPress(): number {
    return tensionForPress({
      pressIndex: this.round.pressOrder.length + 1,
      teeth: this.round.teeth,
      mode: this.round.mode,
      liveTeethMin: this.round.liveTeethMin,
      liveTeethMax: this.round.liveTeethMax,
    });
  }

  private setText(id: string, text: string): void {
    const element = this.doc.getElementById(id);
    if (element) {
      element.textContent = text;
    }
  }

  /**
   * Der Mut der Runde: die hoechste ueberstandene Bissgefahr. Er gibt dem Gefahren-Balken einen
   * Zweck — die Gefahr, die man uebersteht, ist das, was am Tisch erzaehlt wird. Kommt aus derselben
   * Kurve wie der Balken (`survivedDanger`), ist also dieselbe Wahrheit wie die Anzeige.
   */
  private mutSentence(pressIndex: number): string {
    const percent = Math.round(
      survivedDanger({
        pressIndex,
        teeth: this.round.teeth,
        mode: this.round.mode,
        liveTeethMin: this.round.liveTeethMin,
        liveTeethMax: this.round.liveTeethMax,
      }) * 100,
    );
    if (percent <= 0) {
      return '';
    }
    if (this.round.players === 1) {
      return ` Dein mutigster Druck: ${percent} % Bissgefahr — und der Zahn war harmlos.`;
    }
    // Der letzte harmlose Druck kam reihum von diesem Spieler.
    const player = ((pressIndex - 2) % this.round.players) + 1;
    return (
      ` Mutigster Druck: ${playerName(player, this.round.players)} bei ${percent} % Bissgefahr` +
      ' — und der Zahn war harmlos.'
    );
  }

  private showResult(): void {
    const loser = this.round.loser;
    if (!loser) {
      return;
    }
    const title = this.doc.getElementById('result-title');
    const text = this.doc.getElementById('result-text');
    if (title) {
      title.textContent =
        this.round.players === 1
          ? 'Zugeschnappt!'
          : `${playerName(loser.player, this.round.players)} hat verloren!`;
    }
    if (text) {
      const live = [...this.round.live].sort((a, b) => a - b).join(', ');
      const liveWord = loser.liveCount === 1 ? 'Zahn war scharf' : 'Zähne waren scharf';
      text.textContent =
        `Zahn ${loser.tooth} hat zugeschnappt — der ${loser.pressIndex}. Druck dieser Runde. ` +
        `Insgesamt ${loser.liveCount} ${liveWord} (${live}).` +
        this.mutSentence(loser.pressIndex);
    }
    // Der Satz gehört zum Tier **dieser** Runde — nicht zur Einstellung, die sich ändern kann.
    this.setText('result-fact', `Wusstest du? ${getCreature(this.round.creatureId).fact}`);
    this.deps.sound.play(this.round.players === 1 ? 'lose' : 'win', 0.8);
  }
}
