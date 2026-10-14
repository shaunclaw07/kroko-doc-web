import { type HapticsPort, TAP_VIBRATION_MS, BITE_VIBRATION_PATTERN, RELIEF_VIBRATION_MIN_MS } from '../../core/ports/haptics';
import type { SoundPort } from '../../core/ports/sound';
import type { LiveTeethSelector } from '../../core/ports/liveTeeth';
import type { RandomSource } from '../../core/ports/random';
import type { RoundLogPort } from '../../core/ports/roundLog';
import { openRound, type RoundState } from '../../core/domain/round';
import { UniformLiveTeethSelector } from '../../core/domain/liveTeeth';
import { VERDICT_GAP_MS, reliefLevel, type PressDrama } from '../../core/domain/tension';
import { hudModel } from './hudModel';
import { createHudView, type HudView } from './hudView';
import { createRoundRecorder, type RoundRecorder } from './roundRecorder';
import { type SessionMarkPort } from '../../core/ports/sessionMark';
import { playPress } from '../../core/use-cases/playPress';
import { creatureView, type CreatureView } from './creatures';
import { clientToViewBox, midpoint, type Point } from './creatures/gaze';
import type { GameSettings } from '../../core/domain/settings';
import type { LogFeed } from './logFeed';
import type { SettingsStore } from './settingsStore';
import { createHoldGesture, type HoldGesture, HOLD_SINK_MS } from './holdGesture';

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
  feed?: LogFeed;
  settings: SettingsStore;
  document: Document;
  /** Für Tests und Vorschauen austauschbar; Standard sind echte Timer. */
  wait?: (ms: number, run: () => void) => void;
  /** Uhr in Millisekunden für die Haltedauer; Standard ist `performance.now()` des Dokumentfensters. */
  now?: () => number;
}

export { TAP_VIBRATION_MS, BITE_VIBRATION_PATTERN } from '../../core/ports/haptics';
/** Zweite Stufe des Bisses: der Kiefer zieht nach (ms). */
const BITE_LATCH_MS = 120;

export class GameController {
  private readonly doc: Document;
  private readonly deps: GameDeps;
  private readonly selector: LiveTeethSelector;
  private readonly wait: (ms: number, run: () => void) => void;
  private readonly now: () => number;
  private readonly holdGesture: HoldGesture;
  private readonly recorder: RoundRecorder;
  private readonly hud: HudView;
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
  private unsubscribeSettings: (() => void) | null = null;
  private unsubscribeFeed: (() => void) | null = null;

  constructor(deps: GameDeps) {
    this.deps = deps;
    this.doc = deps.document;
    this.hud = createHudView(this.doc);
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
    this.recorder = createRoundRecorder({ log: deps.log, feed: deps.feed });
    this.holdGesture = createHoldGesture({
      doc: this.doc,
      now: this.now,
      wait: this.wait,
      canPress: (id) => this.canPress(id),
      feel: () => {
        this.deps.sound.unlock();
        this.hud.startPressBeat(HOLD_SINK_MS);
        this.feelPress();
      },
      onPress: (toothId, heldMs, felt) => {
        if (!felt) {
          this.deps.sound.unlock();
        }
        this.resolvePress(toothId, heldMs, felt);
      },
      onCancel: () => {
        this.hud.endPressBeat();
        this.deps.sound.stopAll();
      },
    });
    this.round = this.newRound();
    this.unsubscribeSettings = this.deps.settings.subscribe((next, previous) => {
      this.onSettingsChanged(next, previous);
    });
    this.unsubscribeFeed =
      this.deps.feed?.subscribe((event) => {
        if (event === 'changed-outside') {
          this.syncLog();
        }
      }) ?? null;
  }

  private newRound(): RoundState {
    const current = this.deps.settings.get();
    return openRound(
      {
        creatureId: current.creature,
        teeth: current.teethOverride ?? undefined,
        mode: current.mode,
        players: current.players,
      },
      { rng: this.deps.rng, selector: this.selector },
    );
  }

  /** Zeichnet das gewählte Lebewesen und verbindet seine Zähne. */
  private buildStage(mountPoint: HTMLElement): void {
    this.view = creatureView(this.round.creatureId, this.round.teeth);
    mountPoint.innerHTML = this.view.render();
    this.art = this.doc.querySelector('.creature');
    this.hud.setArt(this.art);
    // Die Augenmitte gehört zu **diesem** Tier; ein neues Tier oder eine neue Runde schaut geradeaus.
    const pupils = Array.from(this.art?.querySelectorAll('.pupil') ?? []);
    this.eyes = midpoint(
      pupils.map((pupil) => ({ x: Number(pupil.getAttribute('cx')), y: Number(pupil.getAttribute('cy')) })),
    );
    this.hud.lookAt(null, this.eyes);
    this.wireTeeth();
  }

  /** Baut Bühne und Zähne auf und verbindet alle Bedienelemente. */
  mount(): void {
    const mountPoint = this.doc.getElementById('croc-mount');
    if (mountPoint) {
      this.buildStage(mountPoint);
    }
    this.stage = this.doc.getElementById('stage');
    this.hud.setStage(this.stage);
    this.hud.setArt(this.art);
    this.stage?.addEventListener('pointermove', this.onStagePointer);
    this.stage?.addEventListener('pointerdown', this.onStagePointer);
    this.doc.getElementById('new-round')?.addEventListener('click', () => this.resetRound());
    this.render();
  }

  private wireTeeth(): void {
    const teeth = this.doc.querySelectorAll<SVGGElement>('.tooth');
    this.holdGesture.wireTeeth(teeth);
  }

  private canPress(toothId: number): boolean {
    return !this.busy && this.round.status === 'open' && !this.round.pressOrder.includes(toothId);
  }

  /** Was der Finger sofort merkt: Stoß und Klang. Verrät nichts — es hängt nur an der Gefahr. */
  private feelPress(): void {
    if (this.deps.settings.get().vibration) {
      this.vibrate(TAP_VIBRATION_MS);
    }
    this.deps.sound.play('tap', this.tension);
    this.deps.sound.play('creak', this.tension);
    this.deps.sound.play('breath', this.tension);
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
    this.hud.markPressed(toothId);
    // Das Tier schaut auf den Zahn, der gerade gedrückt wurde — auch bei Tastatur ohne Zeiger.
    this.hud.lookAt(this.view?.toothAnchor(toothId) ?? null, this.eyes);
    this.render();

    if (!felt) {
      // Die Pause: sie kommt bei jedem Druck, und ihre Länge sagt nichts über den Ausgang.
      this.hud.startPressBeat(outcome.drama.beatMs);
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

  /**
   * Harmloser Ausgang: die Feder kommt zur Ruhe. Die Erleichterung wächst mit der Pause — die hat
   * der Spieler selbst erlebt, sie verrät also nichts.
   */
  private settle(toothId: number, drama: PressDrama): void {
    this.hud.settle(drama.reliefLevel, this.wait);
    this.deps.sound.play('settle', drama.reliefLevel);
    if (this.deps.settings.get().vibration) {
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
    this.deps.sound.play('snap', 1);
    if (this.deps.settings.get().vibration) {
      this.vibrate(BITE_VIBRATION_PATTERN);
    }
    this.hud.snap(toothId);
    const anchor = this.view?.toothAnchor(toothId) ?? { x: 0, y: 0 };
    this.hud.markBiter(toothId, anchor);
    this.hud.shake(1, this.tension, this.wait);
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
      this.hud.clench();
      this.hud.shake(0.45, this.tension, this.wait);
      this.deps.sound.playVoice(bitten.creatureId);
    });
  }

  private twitch(toothId: number): void {
    this.hud.twitch(toothId, this.wait);
    this.hud.shake(0.45, this.tension, this.wait);
  }

  /** Der Zeiger über der Bühne zieht den Blick mit — solange das Maul offen ist. */
  private readonly onStagePointer = (event: Event): void => {
    if (this.disposed || !this.art || this.round.status !== 'open') {
      return;
    }
    const pointer = event as PointerEvent;
    const at = clientToViewBox({ x: pointer.clientX, y: pointer.clientY }, this.art.getBoundingClientRect());
    if (at) {
      this.hud.lookAt(at, this.eyes);
    }
  };

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
    this.unsubscribeSettings?.();
    this.unsubscribeSettings = null;
    this.unsubscribeFeed?.();
    this.unsubscribeFeed = null;
    this.holdGesture.dispose();
    this.stage?.removeEventListener('pointermove', this.onStagePointer);
    this.stage?.removeEventListener('pointerdown', this.onStagePointer);
    this.disposed = true;
  }

  private recordRound(): void {
    this.recorder.record(this.round);
  }

  /**
   * Liest das Protokoll neu — für den Fall, dass es außerhalb dieser Steuerung geändert wurde
   * (Statistikseite in einem anderen Tab, Rückkehr über die Zurück-Taste). Sonst zeigte die
   * Rundennummer bis zum nächsten Biss den alten Stand.
   */
  syncLog(): void {
    this.recorder.sync();
    this.render();
  }

  /** Öffnet eine neue Runde mit den aktuellen Einstellungen. */
  resetRound(): void {
    // Ein laufendes Halten gehört zur alten Runde — sein Loslassen darf die neue nicht treffen.
    this.holdGesture.cancel();
    this.hud.clearBiter();
    this.round = this.newRound();
    this.busy = false;
    const mountPoint = this.doc.getElementById('croc-mount');
    if (mountPoint) {
      this.buildStage(mountPoint);
    }
    this.deps.sound.setTension(0);
    this.render();
  }

  private onSettingsChanged(next: GameSettings, previous: GameSettings): void {
    const modeChanged = next.mode !== previous.mode;
    const playersChanged = next.players !== previous.players;
    const creatureChanged = next.creature !== previous.creature;
    const teethChanged = next.teethOverride !== previous.teethOverride;
    this.deps.sound.setMuted(!next.sound);
    if (modeChanged || playersChanged || creatureChanged || teethChanged) {
      this.resetRound();
      // Das neue Tier stellt sich vor. Der Tipp auf die Kachel ist die Nutzergeste — die Seite
      // gibt den Ton bei `pointerup` frei, also vor diesem `click`.
      if (creatureChanged) {
        // Was vom vorigen Tier noch klingt (seine Stimme, die Tonfolge nach dem Biss), bricht ab —
        // sonst reden beim schnellen Durchtippen der Köpfe mehrere Tiere durcheinander.
        this.deps.sound.stopAll();
        this.deps.sound.playVoice(next.creature);
      }
    } else if (!next.sound) {
      this.deps.sound.stopAll();
    }
  }

  applySettings(settings: GameSettings): void {
    this.deps.settings.set(settings);
  }

  private render(): void {
    const model = hudModel({
      round: this.round,
      tension: this.tension,
      roundNumber: this.recorder.count() + 1,
    });
    this.tension = model.tension;
    this.hud.apply(model);
    if (this.round.pressOrder.length >= 1) {
      this.hud.revealMeterHint(this.deps.session, this.wait);
    }
  }

  private showResult(): void {
    if (!this.round.loser) {
      return;
    }
    this.hud.showResult(this.round);
    this.deps.sound.play(this.round.players === 1 ? 'lose' : 'win', 0.8);
  }
}
