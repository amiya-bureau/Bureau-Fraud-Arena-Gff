---
name: Question bank and case bank architecture
description: How the Spot the Fraud question bank, Fraud Detective case bank, and Lifeline question bank are structured, randomized, and served.
---

## Question bank (Spot the Fraud)

- The reviewed workbook is the canonical visitor-facing content source: 149 Spot questions across the ten levels and refreshed presentation content for all 52 Detective cases.
- The generated local payload is decoded in the browser. A run chooses one reviewed Spot question per level and five reviewed Detective cases at random.
- Every reviewed Spot question has four options; questions have one or two correct choices only.
- The authored arrays remain as an emergency decode fallback, but are not the canonical bank.

## Case bank (Fraud Detective)

- The existing 52-case graph topology stays in place. Workbook content overlays the sector, title, clues, brief, answer, explanation, and hook, retaining each case's designed answer-node IDs.
- Each run selects five cases at random.

## Lifeline question bank (all three games)

- `src/data/lifeline.ts` — 15 Bureau-focused MCQ/logo questions. All correct answers reference Bureau. `LifelineQuestion` interface: `{ id, type: 'mcq'|'logo', stem, options: string[], correctIndex: number }`.
- `lib/db/src/schema/questions.ts` — `lifelineQuestionsTable` exists (DB table currently empty; frontend always uses local fallback).
- API route: `GET /api/lifeline/question` (random active question; returns 503 when empty — frontend falls back gracefully).
- `src/lib/gamePack.ts` — `fetchLifelineQuestion()` added; falls back to local random pick.
- Component: `src/components/lifeline-gate.tsx` — amber-tinted question card, 10s countdown bar, one-attempt mechanic, shuffled options. Retry button unlocks on correct answer; timeout → onExit.

## Post-game flow (Lifeline Gate — replaces GameEndScreen + 50:50)

- **On game over** in all three games: endRun → `setLifelineContext('gameover')` + `setGameState('lifeline')`. LifelineGate renders with score as `scoreDisplay`. Correct answer → onRetry resets all game state and goes back to 'rules'. Timeout/Exit → navigate to '/'.
- **On re-entry** (player who has already played navigates to a game): `useEffect` + `reentryChecked = useRef(false)` checks `standing.scores.find(s => s.game === '<key>')?.played`. If true: `setLifelineContext('reentry')` + `setGameState('lifeline')`. The ref prevents the check re-firing when standing query re-resolves.
- `GameEndScreen` is no longer used by any of the three main games (it may still exist as a component but is not imported).
- The 50:50 lifeline button and `handleFiftyFifty`/`BUREAU_QUESTIONS`/`bureauSeen`/`fiftyFifty` state were removed from Spot the Fraud entirely.

## Reviewed local content versus server packs

- Quiz and Detective server endpoints may still contain old or unseeded rows. The booth game intentionally uses the reviewed local payload rather than those endpoints.
- Lifeline questions remain independent and continue to prefer the server with a local fallback.

**Why:** Content was approved from a workbook and must be identical for every booth visitor; allowing a stale database pack to win would silently undo that review.

**How to apply:** Keep Spot and Detective loaders pointed to the reviewed local payload until the database has been explicitly reseeded from the exact same source and parity has been verified.

## Player gate (returning player)

- `src/components/player-gate.tsx` — shown by `ProtectedRoute` in `App.tsx` when a session already exists.
- "Continue as [name]" → `setConfirmed(true)`, enters game immediately.
- "New Player" → `clearSession()` + redirect to `/join?return=<path>`.
- Confirmation is per-navigation: leaving and re-entering shows the gate again (intentional — enables smooth handoff between booth visitors).
