import type { RoundRecord } from '../../contract/sessionLog';
import type { RandomMode } from '../../core/domain/teeth';
import { HIGH_DANGER, tensionForPress } from '../../core/domain/tension';
import { DEFAULT_K_WEIGHTS, expectedPresses, modeKWeights, pressPositionDistribution } from '../../core/domain/probabilities';
import { analyseSession, bravestRound, verdict, type ChiSquareResult, type SessionReport } from '../../core/domain/statistics';
import { getCreature } from '../../core/domain/creature';

/** Unter dieser Rundenzahl gibt es bewusst keine Signifikanz-Aussage. */
export const MIN_SAMPLE_FOR_VERDICT = 100;

function escapeHtml(text: string): string {
  return text.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char] ?? char);
}

function percent(value: number): string {
  return `${(value * 100).toFixed(1)} %`;
}

function testTag(result: ChiSquareResult | null): string {
  if (!result) {
    return '<span class="tag tag--warn">zu wenig Daten</span>';
  }
  const label = result.significant ? 'auffällig' : 'unauffällig';
  const kind = result.significant ? 'bad' : 'ok';
  return `<span class="tag tag--${kind}">${label}</span> <span class="small muted">chi2 = ${result.chiSquare.toFixed(
    2,
  )}, df = ${result.df}, p = ${result.pValue < 0.001 ? result.pValue.toExponential(2) : result.pValue.toFixed(3)}</span>`;
}

function bars(counts: readonly number[], total: number, model?: readonly number[]): string {
  const max = Math.max(1, ...counts);
  return counts
    .map((count, index) => {
      const share = total > 0 ? count / total : 0;
      const width = (count / max) * 100;
      const modelShare = model?.[index] !== undefined && total > 0 ? ` <span class="small muted">Modell ${percent(
        model[index] ?? 0,
      )}</span>` : '';
      return [
        '<div class="bar">',
        `<span class="small muted">${index + 1}</span>`,
        `<span class="bar__track"><span class="bar__fill${count === 0 ? ' bar__fill--flat' : ''}" style="width:${width.toFixed(
          1,
        )}%"></span></span>`,
        `<span class="small">${count} · ${percent(share)}${modelShare}</span>`,
        '</div>',
      ].join('');
    })
    .join('');
}

function autocorrelationTable(report: SessionReport): string {
  if (report.autocorrelations.length === 0) {
    return '<p class="muted small">Nicht genug Runden für eine Musterprüfung.</p>';
  }
  return [
    '<div class="bars">',
    report.autocorrelations
      .map((entry) => {
        const value = entry.value === null ? '—' : entry.value.toFixed(3);
        const tag = entry.value === null
          ? '<span class="tag tag--warn">keine Daten</span>'
          : entry.remarkable
            ? '<span class="tag tag--bad">auffällig</span>'
            : '<span class="tag tag--ok">unauffällig</span>';
        return `<div class="row small"><span class="muted">Versatz ${entry.lag}: r = ${value}</span>${tag}</div>`;
      })
      .join(''),
    '</div>',
  ].join('');
}

function reportHtml(report: SessionReport, records: readonly RoundRecord[]): string {
  const mode: 'original' | 'classic' = records[0]?.mode ?? 'original';
  const weights = modeKWeights(mode);
  const model = pressPositionDistribution(report.teeth, weights);
  const enough = report.rounds >= MIN_SAMPLE_FOR_VERDICT;
  const brave = bravestRound(records);
  return [
    '<div class="hud">',
    `<div class="stat"><div class="stat__label">Runden</div><div class="stat__value">${report.rounds}</div></div>`,
    `<div class="stat"><div class="stat__label">Zähne</div><div class="stat__value">${report.teeth}</div></div>`,
    `<div class="stat"><div class="stat__label">Modus</div><div class="stat__value">${
      mode === 'classic' ? 'genau 1' : '1–3 scharf'
    }</div></div>`,
    `<div class="stat"><div class="stat__label">Drücke bis Biss</div><div class="stat__value">${report.observedPresses.toFixed(
      2,
    )}</div></div>`,
    `<div class="stat"><div class="stat__label">Erwartet (Modell)</div><div class="stat__value">${expectedPresses(
      model,
    ).toFixed(2)}</div></div>`,
    `<div class="stat"><div class="stat__label">Häufigster Zahn</div><div class="stat__value">${
      report.mostLikelyTooth ?? '—'
    }</div></div>`,
    `<div class="stat"><div class="stat__label">Mutigste Runde</div><div class="stat__value">${
      brave ? `${Math.round(brave.danger * 100)} %` : '—'
    }</div></div>`,
    '</div>',
    `<p>${escapeHtml(verdict(report, MIN_SAMPLE_FOR_VERDICT))}</p>`,
    brave
      ? `<p class="small">Mutigste Runde: ${Math.round(brave.danger * 100)} % Bissgefahr in Runde ${
          brave.round
        } (${escapeHtml(getCreature(brave.creature).name)}) — die höchste Gefahr, die überstanden wurde. ` +
        'Ein einzelner Wert ist kein statistischer Befund, sondern eine Geschichte.</p>'
      : '',
    enough ? '' : '<p class="small muted">Für statistische Aussagen fehlen Runden — die Tests bleiben deshalb aus.</p>',
    '<h3 class="small muted">Verlierer-Zahn (Häufigkeit)</h3>',
    `<div class="bars">${bars(report.countsByTooth, report.rounds)}</div>`,
    '<h3 class="small muted" style="margin-top:1rem">Position in der Druckreihenfolge</h3>',
    `<div class="bars">${bars(report.countsByPressIndex, report.rounds, model)}</div>`,
    '<h3 class="small muted" style="margin-top:1rem">Tests</h3>',
    `<p class="small">Zahn-Nummern gegen Gleichverteilung: ${testTag(report.toothTest)}</p>`,
    `<p class="small">Druck-Position gegen Gleichverteilung: ${testTag(report.pressIndexTest)}</p>`,
    `<p class="small">Druck-Position gegen das Zugmodell: ${testTag(report.modelTest)}</p>`,
    '<h3 class="small muted" style="margin-top:1rem">Mustersuche (Autokorrelation)</h3>',
    autocorrelationTable(report),
    '<h3 class="small muted" style="margin-top:1rem">Rohdaten</h3>',
    `<details><summary class="small muted">Letzte ${Math.min(records.length, 50)} Runden als Text</summary><div class="report">${escapeHtml(
      records
        .slice(-50)
        .map(
          (record) =>
            `Runde ${record.round}: ${record.teeth} Zähne, Modus ${record.mode}, ${record.players} Spieler, ` +
            `Drücke ${record.pressOrder.join('-')} → Zahn ${record.loserTooth} (Position ${record.pressIndex}, ` +
            `${record.liveCount} scharf)`,
        )
        .join('\n'),
    )}</div></details>`,
  ].join('');
}

/** Schreibt den Bericht in das übergebene Element. */
export function renderReport(target: HTMLElement, records: readonly RoundRecord[]): void {
  if (records.length === 0) {
    target.innerHTML = '<p class="muted">Noch keine Runden protokolliert. Spielt ein paar Runden, dann füllt sich diese Seite.</p>';
    return;
  }
  const report = analyseSession(records, MIN_SAMPLE_FOR_VERDICT);
  target.innerHTML = reportHtml(report, records);
}

/** Wofür die Kurve gerechnet wird: das eingestellte Gebiss. */
export interface DangerCurveArgs {
  creatureName: string;
  teeth: number;
  mode: RandomMode;
  liveTeethMin: number;
  liveTeethMax: number;
}

/** Die Bissgefahr je Druck — dieselbe Zahl, die der Balken im Spiel zeigt. */
export function dangerCurvePoints(args: DangerCurveArgs): number[] {
  return Array.from({ length: args.teeth }, (_, index) =>
    tensionForPress({
      pressIndex: index + 1,
      teeth: args.teeth,
      mode: args.mode,
      liveTeethMin: args.liveTeethMin,
      liveTeethMax: args.liveTeethMax,
    }),
  );
}

/**
 * Die Kurve als Balken. Die letzte Zahl ist zwangsläufig 100 % — kein Rechenfehler, sondern der
 * Grund, warum die letzte Runde dem gehört, der sie bis zum Schluss trägt.
 */
export function dangerCurveHtml(args: DangerCurveArgs): string {
  const points = dangerCurvePoints(args);
  const rows = points
    .map((danger, index) => {
      const hot = danger >= HIGH_DANGER ? ' bar__fill--hot' : '';
      const last = index === points.length - 1 ? ' <span class="muted">(garantiert scharf)</span>' : '';
      return [
        '<div class="bar">',
        `<span class="small muted">${index + 1}</span>`,
        `<span class="bar__track"><span class="bar__fill${hot}" style="width:${(danger * 100).toFixed(1)}%"></span></span>`,
        `<span class="small">${percent(danger)}${last}</span>`,
        '</div>',
      ].join('');
    })
    .join('');
  return [
    `<p><strong>${escapeHtml(args.creatureName)}, ${args.teeth} Zähne</strong> — so gefährlich ist jeder Druck: `,
    `von ${percent(points[0] ?? 0)} beim ersten bis 100 % beim letzten.</p>`,
    `<div class="bars">${rows}</div>`,
    '<p class="muted small">Der Balken im Spiel zeigt genau diese Zahl. Sie ist aus dem Modell gerechnet, ',
    'nicht aus euren Runden — deshalb stimmt sie auch beim ersten Spiel.</p>',
  ].join('');
}

/** Die Kurve auf die Seite bringen. */
export function renderDangerCurve(target: HTMLElement, args: DangerCurveArgs): void {
  target.innerHTML = dangerCurveHtml(args);
}
