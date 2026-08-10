---
name: Question bank and case bank architecture
description: How the Spot the Fraud question bank, Fraud Detective case bank, and Lifeline question bank are structured, randomized, and served.
---

## Question bank (Spot the Fraud)

- `src/data/quiz.ts` defines `QUESTIONS_A` (30 authored questions, levels 1–10) and exports `QUESTIONS = [...QUESTIONS_A, ...BATCH_B_QUESTIONS]`.
- `src/data/quiz-batch-b.ts` exports `BATCH_B_QUESTIONS` — 110 additional questions covering all 10 levels, Indian fintech context.
- Total bank: 140 questions; one per level is picked randomly per play.
- `LEVELS` and all type exports remain in `quiz.ts`. `BUREAU_QUESTIONS` and `BureauQuestion` were removed when the 50:50/sponsor mechanic was replaced by the lifeline system.

## Case bank (Fraud Detective)

- `src/data/detective.ts` has 52 cases (FD-01 to FD-52) in the `CASES` array.
- 5 original cases (FD-01 to FD-05) + 47 new cases (FD-06 to FD-52, 8 fraud-pattern groups).
- 5 random cases are picked per play.

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

## Server-side randomization (DB, currently empty)

- DB tables `quiz_questions`, `detective_cases`, and `lifeline_questions` exist (schema pushed).
- API routes: `GET /api/quiz/game-pack`, `GET /api/detective/case-pack`, `GET /api/lifeline/question`.
- All fall back to local data on 503 or error. The local fallback works perfectly for the booth.
- Auto-seeding removed — cross-package esbuild imports fail at build time. Seeding via a standalone script in `lib/db` can be added later.

**Why no seeding:** `artifacts/api-server` importing `artifacts/fraud-arena/src/data/` fails at esbuild build time across the workspace boundary. Local fallbacks in `gamePack.ts` are sufficient for the demo.

## Player gate (returning player)

- `src/components/player-gate.tsx` — shown by `ProtectedRoute` in `App.tsx` when a session already exists.
- "Continue as [name]" → `setConfirmed(true)`, enters game immediately.
- "New Player" → `clearSession()` + redirect to `/join?return=<path>`.
- Confirmation is per-navigation: leaving and re-entering shows the gate again (intentional — enables smooth handoff between booth visitors).
