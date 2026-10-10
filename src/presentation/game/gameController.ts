import type { HapticsPort } from '../../core/ports/haptics';
import type { SoundPort } from '../../core/ports/sound';
import type { LiveTeethSelector } from '../../core/ports/liveTeeth';
import type { RandomSource } from '../../core/ports/random';
import type { RoundRecord } from '../../contract/sessionLog';
import type { RoundLogPort } from '../../core/ports/roundLog';
import { openRound, remainingTeeth, isFinalToothTension, type RoundState } from '../../core/domain/round';
import { UniformLiveTeethSelector } from '../../core/domain/liveTeeth';
import { heartbeatInterval } from '../../core/domain/tension';
import { createRoundRecord, nextRoundNumber } from '../../core/domain/sessionLog';
import { type RandomMode } from '../../core/domain/teeth';
import { playPress } from '../../core/use-cases/playPress';
import { creatureView, type CreatureView } from './creatures';
import type { GameSettings } from '../../infrastructure/storage/localStorageSettings';

export interface GameDeps {
  rng: RandomSource;
  /** Standard ist die gleichverteilte Auswahl; Tests geben eine feste Auswahl vor. */
  selector?: LiveTeethSelector;
  sound: SoundPort;
  /** Tast-Rückmeldung. Standard ist keine — so bleiben Tests und Umgebungen ohne Vibration ruhig. */
  haptics?: HapticsPort;
  log: RoundLogPort;
  settings: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
  document: Document;
  /** Für Tests und Vorschauen austauschbar; Standard sind echte Timer. */
  wait?: (ms: number, run: () => void) => void;
}

/** Tast-Rückmeldung: kurz vor dem Biss, dann drei Stöße für das Zuschnappen (an/aus/… in ms). */
const PRE_BITE_VIBRATION_MS = 24;
const BITE_VIBRATION_PATTERN = [120, 50, 220] as const;

function defaultWait(ms: number, run: () => void): void {
  window.setTimeout(run, ms);
}

function playerName(player: number, players: number): string {
  return players === 1 ? 'Du' : `Spieler ${player}`;
}

export class GameController {
  private readonly doc: Document;
  private readonly deps: GameDeps;
  private readonly selector: LiveTeethSelector;
  private readonly wait: (ms: number, run: () => void) => void;
  private round: RoundState;
  private tension = 0;
  private busy = false;
  private heartbeatTimer: number | null = null;
  private stage: HTMLElement | null = null;
  private view: CreatureView | null = null;
  private art: SVGElement | null = null;
  private readonly records: RoundRecord[];

  constructor(deps: GameDeps) {
    this.deps = deps;
    this.doc = deps.document;
    this.wait = deps.wait ?? defaultWait;
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
    this.wireTeeth();
  }

  /** Baut Bühne und Zähne auf und verbindet alle Bedienelemente. */
  mount(): void {
    const mountPoint = this.doc.getElementById('croc-mount');
    if (mountPoint) {
      this.buildStage(mountPoint);
    }
    this.stage = this.doc.getElementById('stage');
    this.doc.getElementById('new-round')?.addEventListener('click', () => this.resetRound());
    this.render();
    this.startHeartbeat();
  }

  private wireTeeth(): void {
    const teeth = this.doc.querySelectorAll<SVGGElement>('.tooth');
    teeth.forEach((tooth) => {
      const id = Number(tooth.dataset.tooth ?? '0');
      tooth.addEventListener('click', () => this.handlePress(id));
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

  private handlePress(toothId: number): void {
    if (this.busy || this.round.status !== 'open' || this.round.pressOrder.includes(toothId)) {
      return;
    }
    this.busy = true;
    this.deps.sound.unlock();
    const outcome = playPress({ state: this.round, tooth: toothId, tension: this.tension, rng: this.deps.rng });
    this.round = outcome.state;
    this.tension = outcome.drama.tensionAfter;
    this.deps.sound.setTension(this.tension);
    this.markPressed(toothId);
    this.render();

    if (outcome.snapped) {
      // Vor dem Biss wird es still: erst der Druck, dann Totenstille, dann CHOMP.
      this.deps.sound.stopAll();
      if (this.deps.settings.vibration) {
        this.vibrate(PRE_BITE_VIBRATION_MS);
      }
      this.wait(outcome.drama.silenceMs, () => this.snap(toothId));
      return;
    }

    this.deps.sound.play('tap', this.tension);
    this.deps.sound.play('creak', this.tension);
    if (outcome.drama.twitch) {
      this.deps.sound.play('twitch', this.tension);
      this.twitch(toothId);
    }
    this.busy = false;
    this.startHeartbeat();
  }

  private snap(toothId: number): void {
    this.busy = false;
    this.clearHeartbeat();
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
  }

  private twitch(toothId: number): void {
    this.art?.classList.add('is-twitching');
    this.shake(0.45);
    this.wait(320, () => this.art?.classList.remove('is-twitching'));
    const tooth = this.tooth(toothId);
    tooth?.classList.add('is-live');
    this.wait(260, () => {
      if (this.round.status === 'open') {
        tooth?.classList.remove('is-live');
      }
    });
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

  private startHeartbeat(): void {
    this.clearHeartbeat();
    if (!this.deps.settings.sound || this.round.status !== 'open') {
      return;
    }
    const beat = (): void => {
      if (this.round.status !== 'open' || this.busy) {
        return;
      }
      this.deps.sound.play('heartbeat', this.tension);
      this.heartbeatTimer = window.setTimeout(beat, heartbeatInterval(this.tension));
    };
    this.heartbeatTimer = window.setTimeout(beat, heartbeatInterval(this.tension));
  }

  private clearHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      window.clearTimeout(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private recordRound(): void {
    const loser = this.round.loser;
    if (!loser) {
      return;
    }
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

  /** Öffnet eine neue Runde mit den aktuellen Einstellungen. */
  resetRound(): void {
    this.clearHeartbeat();
    this.clearBiter();
    this.round = this.newRound();
    this.tension = 0;
    this.busy = false;
    const mountPoint = this.doc.getElementById('croc-mount');
    if (mountPoint) {
      this.buildStage(mountPoint);
    }
    this.deps.sound.setTension(0);
    this.render();
    this.startHeartbeat();
    this.closeSheets();
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
    } else if (!settings.sound) {
      this.clearHeartbeat();
      this.deps.sound.stopAll();
    } else {
      this.startHeartbeat();
    }
  }

  private render(): void {
    const remaining = remainingTeeth(this.round);
    const pressIndex = this.round.pressOrder.length;
    const currentPlayer = (pressIndex % this.round.players) + 1;
    this.setText('hud-remaining', String(remaining));
    this.setText('hud-presses', String(pressIndex));
    this.setText('hud-round', String(this.records.length + 1));
    this.setText('hud-tension', `${Math.round(this.tension * 100)} %`);
    this.setText(
      'hud-turn',
      this.round.status === 'snapped'
        ? 'Maul zu'
        : `${playerName(currentPlayer, this.round.players)} ist dran (${this.round.players} Spieler)`,
    );
    const warn = this.doc.getElementById('hud-warning');
    if (warn) {
      const tension = isFinalToothTension(this.round);
      warn.classList.toggle('hidden', !tension);
      warn.textContent = tension ? 'Nur noch ein Zahn — der ist garantiert scharf!' : '';
    }
    const meter = this.doc.getElementById('hud-meter');
    meter?.style.setProperty('width', `${Math.round(this.tension * 100)}%`);
    this.stage?.style.setProperty('--tension', this.tension.toFixed(3));
    this.stage?.style.setProperty('--beat-ms', `${heartbeatInterval(this.tension)}ms`);
    this.stage?.classList.toggle('is-tense', this.tension > 0.15 && this.round.status === 'open');
    if (this.stage) {
      this.stage.dataset.status = this.round.status;
      this.stage.dataset.tension = this.tension.toFixed(2);
    }
  }

  private setText(id: string, text: string): void {
    const element = this.doc.getElementById(id);
    if (element) {
      element.textContent = text;
    }
  }

  private showResult(): void {
    const loser = this.round.loser;
    if (!loser) {
      return;
    }
    const sheet = this.doc.getElementById('result-sheet') as HTMLDialogElement | null;
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
        `Insgesamt ${loser.liveCount} ${liveWord} (${live}). ` +
        `Damit sind ${this.records.length} Runden protokolliert.`;
    }
    this.deps.sound.play(this.round.players === 1 ? 'lose' : 'win', 0.8);
    if (sheet) {
      if (typeof sheet.showModal === 'function') {
        sheet.showModal();
      } else {
        // Manche Umgebungen (und ältere Browser) kennen showModal nicht.
        sheet.setAttribute('open', '');
      }
    }
  }

  closeSheets(): void {
    this.doc.querySelectorAll<HTMLDialogElement>('dialog.sheet[open]').forEach((sheet) => sheet.close());
  }
}
