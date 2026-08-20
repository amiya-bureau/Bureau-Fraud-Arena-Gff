/**
 * Bureau Apollo Deepfake Detector — production integration.
 *
 * `runDetector` is the only public entry point.  When BUREAU_API_USER and
 * BUREAU_API_KEY are set it calls the real Apollo API; otherwise it falls back
 * to the deterministic fake that was used during development.  Everything
 * downstream — the spoof route, the scoring, the reveal UI — is unchanged.
 *
 * Apollo flow
 * -----------
 * 1. POST /auth/upload   multipart — returns { request_id, status:"pending" }
 * 2. GET  /auth/status?request_id=…   poll until status === "done"
 * 3. Map result.detector_rows (base detectors only) → DetectorVerdict
 */

import { createHash } from "node:crypto";

// ── Shared types (consumed by the spoof route and the API schema) ──────────

export type DetectorLevel = 1 | 2 | 3;
export type SignalVerdict = "synthetic" | "authentic" | "inconclusive";

export interface DetectorSignal {
  name: string;
  verdict: SignalVerdict;
  /** 0–1, higher = more evidence the image is synthetic. */
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
  /** true  → visitor beat the detector (it didn't flag the synthetic image) */
  fooled: boolean;
  /** 0–1, higher = more evidence the image is synthetic. */
  confidence: number;
  signals: DetectorSignal[];
  heatmapRegions: HeatmapRegion[];
  latencyMs: number;
}

export function hashImage(image: Buffer): string {
  return createHash("sha256").update(image).digest("hex");
}

// ── Bureau Apollo API ──────────────────────────────────────────────────────

const UPLOAD_URL = "https://api.apollo.bureau.id/auth/upload";
const STATUS_URL = "https://api.apollo.bureau.id/auth/status";
const POLL_INTERVAL_MS = 1_500;
const POLL_TIMEOUT_MS  = 30_000;

/**
 * Sub-region / noise-augmented variants all contain a colon in their name
 * (e.g. "Full-Resolution Pixel Analyzer: Center Noise S1").
 * Keep only true base detector rows — names with no colon at all.
 */
const SUB_REGION_RE = /:/;

interface BureauRow {
  name: string;
  /** 0–100 probability the image is synthetic according to this detector. */
  score: number;
  verdict: string;
  confidence: number;
  is_synthetic?: boolean;
}

interface BureauResult {
  detector_rows: BureauRow[];
  overall_result: "Authentic" | "Synthetic" | string;
  synthetic_confidence: number;
}

interface BureauStatusBody {
  status: "pending" | "done" | "failed";
  result?: BureauResult;
}

function authHeader(user: string, key: string): string {
  return `Basic ${Buffer.from(`${user}:${key}`).toString("base64")}`;
}

async function uploadImage(image: Buffer, user: string, key: string): Promise<string> {
  const form = new FormData();
  // Use Uint8Array — a valid BlobPart in all runtimes, avoids the
  // SharedArrayBuffer vs ArrayBuffer ambiguity on Node's Buffer.buffer.
  form.append("file", new Blob([new Uint8Array(image)], { type: "image/jpeg" }), "image.jpg");

  const res = await fetch(UPLOAD_URL, {
    method: "POST",
    headers: { Authorization: authHeader(user, key) },
    body: form,
  });
  if (!res.ok) throw new Error(`Bureau upload failed: HTTP ${res.status}`);

  const body = await res.json() as { request_id: string };
  return body.request_id;
}

async function pollStatus(requestId: string, user: string, key: string): Promise<BureauResult> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const res = await fetch(
      `${STATUS_URL}?request_id=${encodeURIComponent(requestId)}`,
      { headers: { Authorization: authHeader(user, key) } },
    );
    if (!res.ok) throw new Error(`Bureau status failed: HTTP ${res.status}`);

    const body = await res.json() as BureauStatusBody;
    if (body.status === "done" && body.result) return body.result;
    if (body.status === "failed") throw new Error("Bureau detector returned status: failed");

    await new Promise<void>((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  throw new Error("Bureau detector timed out (30 s)");
}

function signalVerdictFromScore(score: number): SignalVerdict {
  // Scores above 50% are Synthetic. Treat the exact midpoint as Real so the
  // UI never labels a tied result as synthetic.
  return score > 0.5 ? "synthetic" : "authentic";
}

function bureauResultToVerdict(
  result: BureauResult,
  image: Buffer,
  level: DetectorLevel,
  latencyMs: number,
): DetectorVerdict {
  // Base detector rows only — noise variants are internal calibration runs.
  const baseRows = result.detector_rows.filter((r) => !SUB_REGION_RE.test(r.name));

  // confidence: average synthetic-probability across base detectors (0–1).
  // row.score is already "probability of being synthetic" in 0–100.
  const confidence =
    baseRows.length > 0
      ? round2(baseRows.reduce((sum, r) => sum + r.score, 0) / baseRows.length / 100)
      : result.overall_result === "Authentic" ? 0.15 : 0.82;

  // The arena has one clear boundary: above 50% is Synthetic; 50% or below
  // is Real. The same rule drives the screen labels and whether a player
  // fooled the detector.
  const fooled = confidence <= 0.5;

  const signals: DetectorSignal[] = baseRows.map((r) => ({
    name: r.name,
    verdict: signalVerdictFromScore(round2(r.score / 100)),
    score: round2(r.score / 100),
  }));

  // Apollo doesn't return heatmap coordinates — generate deterministically
  // from the image hash so the reveal animation still works.
  const heatmapRegions = heatmapFromHash(hashImage(image), level);

  return { fooled, confidence, signals, heatmapRegions, latencyMs };
}

async function runBureauDetector(
  image: Buffer,
  level: DetectorLevel,
): Promise<DetectorVerdict> {
  const user = process.env.BUREAU_API_USER!;
  const key  = process.env.BUREAU_API_KEY!;
  const t0   = Date.now();

  const requestId = await uploadImage(image, user, key);
  const result    = await pollStatus(requestId, user, key);

  return bureauResultToVerdict(result, image, level, Date.now() - t0);
}

// ── Fake fallback (dev / no credentials) ──────────────────────────────────

const BEAT_RATE: Record<DetectorLevel, number> = { 1: 0.35, 2: 0.15, 3: 0.04 };
const FAKE_SIGNAL_NAMES = [
  "Frequency-domain artefacts",
  "Noise-residual consistency",
  "Facial-landmark geometry",
  "Compression-history analysis",
  "Colour-channel correlation",
] as const;

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

function seedFrom(hash: string, level: number): number {
  let h = Math.imul(level, 0x9e3779b9) >>> 0;
  for (let i = 0; i + 8 <= hash.length; i += 8) {
    h = Math.imul(h ^ parseInt(hash.slice(i, i + 8), 16), 0x85ebca6b) >>> 0;
  }
  return h >>> 0;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;
const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));

function fakeSignalVerdict(score: number): SignalVerdict {
  return signalVerdictFromScore(score);
}

function heatmapFromHash(hash: string, level: number): HeatmapRegion[] {
  const rand = mulberry32(seedFrom(hash, level + 100));
  const count = 2 + Math.floor(rand() * 3);
  return Array.from({ length: count }, () => {
    const w  = 0.12 + rand() * 0.22;
    const h  = 0.12 + rand() * 0.22;
    const cx = 0.5  + (rand() - 0.5) * 0.42;
    const cy = 0.36 + (rand() - 0.5) * 0.44;
    return {
      x: round2(clamp01(Math.min(cx - w / 2, 1 - w))),
      y: round2(clamp01(Math.min(cy - h / 2, 1 - h))),
      w: round2(w),
      h: round2(h),
      intensity: round2(0.3 + rand() * 0.7),
    };
  });
}

async function runFakeDetector(
  image: Buffer,
  level: DetectorLevel,
): Promise<DetectorVerdict> {
  const hash  = hashImage(image);
  const rand  = mulberry32(seedFrom(hash, level));
  const latMs = Math.round(900 + rand() * 900);
  const fooled = rand() < BEAT_RATE[level];
  const conf   = fooled ? 0.04 + rand() * 0.4 : 0.6 + rand() * 0.39;

  const scores = FAKE_SIGNAL_NAMES.map(() =>
    fooled ? rand() * 0.55 : clamp01(0.35 + rand() * 0.65),
  );
  if (!fooled) {
    const decisive = Math.floor(rand() * FAKE_SIGNAL_NAMES.length);
    scores[decisive] = clamp01(Math.max(scores[decisive] ?? 0, 0.78 + rand() * 0.2));
  }

  const signals: DetectorSignal[] = FAKE_SIGNAL_NAMES.map((name, i) => ({
    name,
    verdict: fakeSignalVerdict(round2(scores[i] ?? 0)),
    score: round2(scores[i] ?? 0),
  }));

  await new Promise<void>((r) => setTimeout(r, latMs));

  return {
    fooled,
    confidence: round2(conf),
    signals,
    heatmapRegions: heatmapFromHash(hash, level),
    latencyMs: latMs,
  };
}

// ── Public entry point ─────────────────────────────────────────────────────

/**
 * Run the deepfake detector against an uploaded image.
 *
 * Uses the real Bureau Apollo API when credentials are present; otherwise
 * falls back to the deterministic fake (development / CI).
 */
export async function runDetector(
  image: Buffer,
  level: DetectorLevel,
): Promise<DetectorVerdict> {
  if (process.env.BUREAU_API_USER && process.env.BUREAU_API_KEY) {
    return runBureauDetector(image, level);
  }
  return runFakeDetector(image, level);
}

/** The signal a reveal screen should name when the detector catches an image. */
export function strongestSignal(verdict: DetectorVerdict): DetectorSignal | null {
  return verdict.signals.reduce<DetectorSignal | null>(
    (best, s) => (best === null || s.score > best.score ? s : best),
    null,
  );
}
