/**
 * Fetches a randomised game pack from the server at the start of a play.
 *
 * Spot the Fraud: one question per level (10 total), selected randomly.
 * Fraud Detective: 5 cases selected randomly from the bank.
 *
 * Both fall back to the local static data if the server is unavailable,
 * so a network hiccup does not break the game.
 */
import { QUESTIONS, type Question } from '@/data/quiz';
import { CASES, type DetectiveCase } from '@/data/detective';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Returns one question per level (levels 1–10), server-selected randomly. */
export async function fetchQuizGamePack(): Promise<Question[]> {
  try {
    const res = await fetch(`${base}/api/quiz/game-pack`);
    if (!res.ok) throw new Error(`${res.status}`);
    const data = await res.json() as { questions: Question[] };
    if (Array.isArray(data.questions) && data.questions.length === 10) {
      return data.questions;
    }
    throw new Error('incomplete pack');
  } catch {
    // Fallback: pick one question per level locally
    return Array.from({ length: 10 }, (_, i) => {
      const pool = QUESTIONS.filter((q) => q.level === i + 1);
      return pool[Math.floor(Math.random() * Math.max(pool.length, 1))];
    }).filter(Boolean) as Question[];
  }
}

/** Returns 5 detective cases, server-selected randomly. */
export async function fetchDetectiveCasePack(): Promise<DetectiveCase[]> {
  try {
    const res = await fetch(`${base}/api/detective/case-pack`);
    if (!res.ok) throw new Error(`${res.status}`);
    const data = await res.json() as { cases: DetectiveCase[] };
    if (Array.isArray(data.cases) && data.cases.length > 0) {
      return data.cases;
    }
    throw new Error('empty pack');
  } catch {
    // Fallback: shuffle local cases and take 5
    const shuffled = [...CASES].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 5);
  }
}
