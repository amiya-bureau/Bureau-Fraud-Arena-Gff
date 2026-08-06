/**
 * Per-item accuracy, reconstructed from the `detail` jsonb on each run so a
 * broken or impossible question can be spotted and pulled mid-event.
 *
 * Everything here reads defensively: a malformed or older `detail` blob must
 * degrade to "no data for that item" and never take the host panel down in the
 * middle of a trade show.
 */

export interface ItemAccuracy {
  id: string;
  label: string;
  level: number | null;
  attempts: number;
  correct: number;
  accuracy: number;
}

interface Tally {
  attempts: number;
  correct: number;
  level: number | null;
  label: string;
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

const asString = (v: unknown): string | null =>
  typeof v === "string" && v.length > 0 ? v : null;

const asNumber = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

class TallyMap {
  private readonly map = new Map<string, Tally>();

  record(id: string, correct: boolean, level: number | null, label: string) {
    const existing = this.map.get(id) ?? {
      attempts: 0,
      correct: 0,
      level,
      label,
    };
    existing.attempts += 1;
    if (correct) existing.correct += 1;
    if (existing.level === null && level !== null) existing.level = level;
    this.map.set(id, existing);
  }

  toReport(): ItemAccuracy[] {
    return [...this.map.entries()]
      .map(([id, t]) => ({
        id,
        label: t.label,
        level: t.level,
        attempts: t.attempts,
        correct: t.correct,
        accuracy: t.attempts === 0 ? 0 : Math.round((t.correct / t.attempts) * 100) / 100,
      }))
      .sort((a, b) => a.accuracy - b.accuracy || a.id.localeCompare(b.id));
  }
}

export interface AccuracyReport {
  questions: ItemAccuracy[];
  cases: ItemAccuracy[];
  bonusQuestions: ItemAccuracy[];
}

export interface RunDetailRow {
  game: string;
  detail: unknown;
}

export function buildAccuracyReport(rows: RunDetailRow[]): AccuracyReport {
  const questions = new TallyMap();
  const cases = new TallyMap();
  const bonusQuestions = new TallyMap();

  for (const row of rows) {
    if (!isRecord(row.detail)) continue;

    if (row.game === "spot_the_fraud") {
      for (const entry of asArray(row.detail.perLevel)) {
        if (!isRecord(entry)) continue;
        const id = asString(entry.questionId);
        if (id === null) continue;
        // A skipped level was never answered, so it says nothing about whether
        // the question itself is fair.
        const outcome = asString(entry.outcome);
        if (outcome === "skipped") continue;
        questions.record(id, entry.correct === true, asNumber(entry.level), id);
      }
    }

    if (row.game === "fraud_detective") {
      for (const entry of asArray(row.detail.cases)) {
        if (!isRecord(entry)) continue;
        const id = asString(entry.id) ?? asString(entry.caseId);
        if (id === null) continue;
        // "Correct" means solved cleanly. First-guess success is the signal
        // that tells a host whether a case is unfairly hard.
        const wrongGuesses = asNumber(entry.wrongGuesses) ?? 0;
        const solvedCleanly = wrongGuesses === 0 && entry.revealed !== true;
        cases.record(id, solvedCleanly, null, id);
      }

      const bonus = isRecord(row.detail.bonus) ? row.detail.bonus : null;
      const answers = asArray(bonus?.answers ?? row.detail.bonusAnswers);
      for (const entry of answers) {
        if (!isRecord(entry)) continue;
        const n = asNumber(entry.n);
        const id = asString(entry.id) ?? (n === null ? null : `BONUS-${n}`);
        if (id === null) continue;
        bonusQuestions.record(id, entry.correct === true, n, id);
      }
    }
  }

  return {
    questions: questions.toReport(),
    cases: cases.toReport(),
    bonusQuestions: bonusQuestions.toReport(),
  };
}

/** Number of detector fools a Spoof run recorded, for the draw pools. */
export function foolsFromSpoofDetail(detail: unknown): number {
  if (!isRecord(detail)) return 0;
  const attempts = asArray(detail.attempts);
  if (attempts.length > 0) {
    return attempts.filter((a) => isRecord(a) && a.fooled === true).length;
  }
  // Fall back to the pool the client stamped on the run.
  const pool = asString(detail.drawPool);
  if (pool === "ipad") return 3;
  if (pool === "airpods") return 2;
  return 0;
}
