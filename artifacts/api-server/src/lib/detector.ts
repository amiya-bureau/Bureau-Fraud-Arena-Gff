// TODO: REPLACE WITH BUREAU'S REAL DETECTOR API BEFORE THE EVENT.
//
// This is the ONLY place detector logic lives. Everything else — the ladder,
// the UI, the scoring, the draw pools — must work unchanged when this is
// swapped for Bureau's real Faceguard endpoint. Keep `runDetector`'s signature
// and `DetectorVerdict`'s shape intact and nothing downstream needs to move.

import { createHash } from "node:crypto";

export type DetectorLevel = 1 | 2 | 3;

export type SignalVerdict = "synthetic" | "authentic" | "inconclusive";

export interface DetectorSignal {
  name: string;
  verdict: SignalVerdict;
  /** 0-1, higher means more evidence the image is synthetic. */
  score: number;
}

export interface HeatmapRegion {
  x: number;
  y: number;
  w: number;
  h: number;
  intensity: number;
}

export interface DetectorVerdict {
  /** True means the visitor beat this level. */
  fooled: boolean;
  /** 0-1 confidence that the image is synthetic. */
  confidence: number;
  signals: DetectorSignal[];
  heatmapRegions: HeatmapRegion[];
  latencyMs: number;
}

/** Five named signals so the reveal panel reads like a real product. */
const SIGNAL_NAMES = [
  "Frequency-domain artefacts",
  "Noise-residual consistency",
  "Facial-landmark geometry",
  "Compression-history analysis",
  "Colour-channel correlation",
] as const;

/**
 * How often each detector is beatable. Level 3 is deliberately brutal so that
 * full-ladder iPad qualifiers stay in single digits across the whole event.
 */
const BEAT_RATE: Record<DetectorLevel, number> = { 1: 0.35, 2: 0.15, 3: 0.04 };

const SYNTHETIC_THRESHOLD = 0.66;
const AUTHENTIC_THRESHOLD = 0.4;

/** Deterministic PRNG so the same image always gets the same verdict. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashImage(image: Buffer): string {
  return createHash("sha256").update(image).digest("hex");
}

/**
 * Mixing the level into the seed makes the three detectors disagree about the
 * same image, while keeping each one stable across retries — visitors do retry,
 * and they notice inconsistency.
 */
function seedFrom(hash: string, level: number): number {
  let h = Math.imul(level, 0x9e3779b9) >>> 0;
  for (let i = 0; i + 8 <= hash.length; i += 8) {
    h = Math.imul(h ^ parseInt(hash.slice(i, i + 8), 16), 0x85ebca6b) >>> 0;
  }
  return h >>> 0;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));

function verdictFor(score: number): SignalVerdict {
  if (score >= SYNTHETIC_THRESHOLD) return "synthetic";
  if (score <= AUTHENTIC_THRESHOLD) return "authentic";
  return "inconclusive";
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function runDetector(
  image: Buffer,
  level: DetectorLevel,
): Promise<DetectorVerdict> {
  const rand = mulberry32(seedFrom(hashImage(image), level));

  const latencyMs = Math.round(900 + rand() * 900);
  const fooled = rand() < BEAT_RATE[level];

  const confidence = fooled ? 0.04 + rand() * 0.4 : 0.6 + rand() * 0.39;

  const scores = SIGNAL_NAMES.map(() =>
    fooled ? rand() * 0.55 : clamp01(0.35 + rand() * 0.65),
  );

  if (!fooled) {
    // A detection always has one decisive signal behind it, so the reveal can
    // name the single strongest reason in plain language.
    const decisive = Math.floor(rand() * SIGNAL_NAMES.length);
    scores[decisive] = clamp01(
      Math.max(scores[decisive] ?? 0, 0.78 + rand() * 0.2),
    );
  }

  const signals: DetectorSignal[] = SIGNAL_NAMES.map((name, i) => {
    const score = round2(scores[i] ?? 0);
    return { name, verdict: verdictFor(score), score };
  });

  // 2-4 boxes, biased toward the centre and upper third where faces sit.
  const regionCount = 2 + Math.floor(rand() * 3);
  const heatmapRegions: HeatmapRegion[] = Array.from(
    { length: regionCount },
    () => {
      const w = 0.12 + rand() * 0.22;
      const h = 0.12 + rand() * 0.22;
      const cx = 0.5 + (rand() - 0.5) * 0.42;
      const cy = 0.36 + (rand() - 0.5) * 0.44;
      return {
        x: round2(clamp01(Math.min(cx - w / 2, 1 - w))),
        y: round2(clamp01(Math.min(cy - h / 2, 1 - h))),
        w: round2(w),
        h: round2(h),
        intensity: round2(fooled ? 0.2 + rand() * 0.35 : 0.5 + rand() * 0.5),
      };
    },
  );

  // Real detectors take time. Keeping the wait server-side means the "detectors
  // running" animation covers genuine latency, and swapping in Faceguard
  // changes nothing about how the client behaves.
  await sleep(latencyMs);

  return {
    fooled,
    confidence: round2(confidence),
    signals,
    heatmapRegions,
    latencyMs,
  };
}

/** The signal a reveal screen should name when the detector catches an image. */
export function strongestSignal(verdict: DetectorVerdict): DetectorSignal | null {
  return (
    verdict.signals.reduce<DetectorSignal | null>(
      (best, s) => (best === null || s.score > best.score ? s : best),
      null,
    ) ?? null
  );
}
