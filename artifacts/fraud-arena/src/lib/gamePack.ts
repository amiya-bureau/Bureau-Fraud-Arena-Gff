/**
 * Builds a randomised game pack from the reviewed workbook content.
 *
 * Spot the Fraud: one question per level (10 total), selected randomly.
 * Fraud Detective: 5 cases selected randomly from the bank.
 *
 * The reviewed workbook content is intentionally local so old or unseeded
 * server rows cannot change the on-booth game.
 */
import { QUESTIONS, type Question } from '@/data/quiz';
import { CASES, type DetectiveCase } from '@/data/detective';
import { applyV5DetectiveContent, loadV5SpotQuestions } from '../../../../.agents/outputs/question-bank-v5';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Returns one reviewed question per level (levels 1–10). */
export async function fetchQuizGamePack(): Promise<Question[]> {
  const localQuestions = await loadV5SpotQuestions().catch(() => QUESTIONS);
  // The v5 workbook is the current content source. The API remains available
  // for a future database seed, but must not serve an older question bank.
  return Array.from({ length: 10 }, (_, i) => {
    const pool = localQuestions.filter((q) => q.level === i + 1);
    return pool[Math.floor(Math.random() * Math.max(pool.length, 1))];
  }).filter(Boolean) as Question[];
}

import { LIFELINE_QUESTIONS, type LifelineQuestion } from '@/data/lifeline';
export type { LifelineQuestion };

/** Returns a single random lifeline question. Falls back to the local bank. */
export async function fetchLifelineQuestion(): Promise<LifelineQuestion> {
  try {
    const res = await fetch(`${base}/api/lifeline/question`);
    if (!res.ok) throw new Error(`${res.status}`);
    return (await res.json()) as LifelineQuestion;
  } catch {
    return LIFELINE_QUESTIONS[Math.floor(Math.random() * LIFELINE_QUESTIONS.length)];
  }
}

/** Returns 5 reviewed Detective cases. */
export async function fetchDetectiveCasePack(): Promise<DetectiveCase[]> {
  const reviewedCases = await applyV5DetectiveContent(CASES).catch(() => CASES);
  // Preserve each case's designed graph topology, but use the workbook's
  // visitor-facing clues, brief, answer and explanation.
  const shuffled = [...reviewedCases].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 5);
}
