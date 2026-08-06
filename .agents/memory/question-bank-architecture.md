---
name: Question bank and case bank architecture
description: How the Spot the Fraud question bank and Fraud Detective case bank are structured, randomized, and served.
---

## Question bank (Spot the Fraud)

- `src/data/quiz.ts` defines `QUESTIONS_A` (30 authored questions, levels 1–10) and exports `QUESTIONS = [...QUESTIONS_A, ...BATCH_B_QUESTIONS]`.
- `src/data/quiz-batch-b.ts` exports `BATCH_B_QUESTIONS` — 110 additional questions covering all 10 levels, Indian fintech context.
- Total bank: 140 questions; one per level is picked randomly per play.
- `LEVELS`, `BUREAU_QUESTIONS`, and all type exports remain in `quiz.ts`.

## Case bank (Fraud Detective)

- `src/data/detective.ts` has 52 cases (FD-01 to FD-52) in the `CASES` array.
- 5 original cases (FD-01 to FD-05) + 47 new cases (FD-06 to FD-52, 8 fraud-pattern groups).
- 5 random cases are picked per play.

## Server-side randomization (DB, currently empty)

- DB tables `quiz_questions` and `detective_cases` exist (schema pushed).
- API routes: `GET /api/quiz/game-pack` (one per level, random) and `GET /api/detective/case-pack` (5 random cases).
- `src/lib/gamePack.ts` calls these endpoints; on 503 or error it falls back to local random selection.
- Auto-seeding at startup was removed — cross-package esbuild imports (`artifacts/api-server` importing `artifacts/fraud-arena/src/data/`) fail at build time. The local fallback works perfectly for the booth.

**Why:** Seeding from `index.ts` would require a cross-workspace TS import that esbuild resolves at build time; the workspace boundary breaks it. The fallback in `gamePack.ts` is sufficient for the demo — DB seeding can be added later via a standalone seed script in `lib/db`.

## Post-game navigation

- `src/components/game-end-screen.tsx` — shared; used by all 3 games at gameover.
- Shows the other 2 games (coloured cards) + "Play again" + "Exit Arena".
- "Exit Arena" calls `clearSession()` and navigates to `/`.
- If `standing.playedAllThree` is true, the other-games section is replaced with a banner.

## Player gate (returning player)

- `src/components/player-gate.tsx` — shown by `ProtectedRoute` in `App.tsx` when a session already exists.
- "Continue as [name]" → `setConfirmed(true)`, enters game immediately.
- "New Player" → `clearSession()` + redirect to `/join?return=<path>`.
- Confirmation is per-navigation: leaving and re-entering shows the gate again (intentional — enables smooth handoff between booth visitors).
