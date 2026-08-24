# Bureau Fraud Arena — Offline Replication Specification

**Document type:** Product and engineering specification  
**Source of truth:** Current Bureau Fraud Arena implementation  
**Prepared:** 24 August 2026  
**Purpose:** Recreate the booth game as a self-contained offline experience without the API server, database, or live Bureau detector.

> This document describes behavior, not the visual CSS implementation. The offline version should preserve the same information hierarchy, terminology, state transitions, timers, scoring, and end-of-run behavior. It may replace network integrations with local adapters.

---

## 1. Product overview

Bureau Fraud Arena is a three-game fraud-awareness experience designed for a shared booth device and visitors' phones:

1. **Spot the Fraud** — answer fraud, network-intelligence, and synthetic-media questions.
2. **Spoof the System** — upload an image and try to fool an image detector.
3. **Fraud Detective** — investigate graph-shaped fraud cases and identify the hidden ring link.

Each game is a short, independent run. A player registers once, can play the three games, earns a score per game, and can see a daily/cumulative standing. A player who has already completed a game is not allowed to silently start another run: they must answer a shared Bureau-themed Lifeline question to unlock a retry.

The original web app is a mobile-first kiosk experience. The offline replica should be usable on a phone-sized viewport and remain functional on desktop.

## 2. Offline operating model

The offline build must have these substitutions:

| Online dependency | Offline replacement |
|---|---|
| `POST /api/players` | Create or find a local player record. |
| `GET /api/players/:id/standing/today` | Calculate standing from local run records. |
| `POST /api/runs` | Append a local run, keyed by idempotency key. |
| `POST /api/runs/progress` and `GET /api/runs/progress/:key` | Save and restore a local in-progress run, or use an equivalent local state store. |
| `GET /api/lifeline/question` | Draw from the bundled Lifeline bank. |
| `POST /api/spoof/detect` | Use a deterministic local detector stub or an on-device detector. |
| Database leaderboard | Local leaderboard derived from saved runs. |
| QR URL | Use the local app URL; preserve the same route targets and `src=qr` marker. |

### Offline persistence recommendation

Use IndexedDB for structured data and localStorage for the active player pointer. A minimal implementation can use localStorage for all data if the expected booth volume is small.

Recommended stores:

```text
player:
  id, workName, firstName, email, phone, company, jobFunction, createdAt

runs:
  id, idempotencyKey, playerId, game, points, source, detail, eventDay, createdAt

runProgress:
  idempotencyKey, playerId, game, state, updatedAt
```

The current player pointer is conceptually:

```text
localStorage["bureau-player-session"]
```

Session end must remove that pointer so the next booth visitor starts as a new person. A local replica should also clear any active run state when a run is submitted successfully.

Every submitted run needs an idempotency key. Repeating a submit with the same key must return the original run rather than awarding duplicate points.

## 3. Entry points and routes

The current routes are:

| Route | Screen/behavior |
|---|---|
| `/` | Arena home and game selection |
| `/join` | Registration |
| `/spot-the-fraud` | Spot the Fraud |
| `/spoof-the-system` | Spoof the System |
| `/fraud-detective` | Fraud Detective |
| `/leaderboard` | Public leaderboard |
| `/admin` | Operational/admin view |
| `/fraud-arena` and descendants | Legacy redirect to the corresponding root route |

The three game routes are protected:

1. No player session: redirect to `/join?return=<game-route>`.
2. Existing session but not confirmed for this visit: show **Player Gate** with:
   - Continue as `<player>`
   - New Player
3. Confirmed session: render the game.

After a successful registration, the current tab auto-confirms once and enters the requested game. On the next navigation back to that game, the Player Gate appears again. This is intentional for a shared booth device.

## 4. Shared player and registration flow

### 4.1 Home screen

The home screen contains:

- Bureau masthead/header.
- Three large game bands:
  - Spot the Fraud
  - Spoof the System
  - Fraud Detective
- Arena QR panel.
- Booth Live indicator.
- If a session exists, **End session, `<first name>`**.

The Arena QR targets the home route with `?src=qr`. It does not bypass registration.

### 4.2 Registration fields

The registration form contains:

| Field | Rule |
|---|---|
| Work Name | Required, at least 2 characters |
| Work Email | Required, valid email format |
| Phone | Required Indian mobile number |
| Company | Required |
| Job Function | Required selection |

Allowed job functions:

1. Fraud and Risk
2. Compliance
3. Product
4. Information Security
5. Engineering
6. Sales & Marketing
7. Finance
8. Founder / Investor
9. Others

### 4.3 Phone normalization

Before validation:

1. Trim whitespace.
2. Remove spaces and hyphens.
3. If it starts with `+91`, remove the prefix.
4. If it is 12 digits and starts with `91`, remove the prefix.
5. Validate exactly 10 remaining digits.
6. The first digit must be `6`, `7`, `8`, or `9`.

Examples that should normalize to the same number:

```text
919876543210
91 98765 43210
91-98765-43210
9876543210
```

### 4.4 Work-email rule

The current validation rejects common free-email domains unless the `noWorkEmail` exception is enabled:

```text
gmail, yahoo, outlook, hotmail, rediffmail, proton
```

If the offline replica includes this policy, expose the exception as a visible, deliberate option. Do not silently accept a free email.

### 4.5 Registration result

On success:

1. Create or recognize the player by email.
2. Save the player session.
3. Preserve the requested game route.
4. Enter the selected game.
5. If the player is returning, show a one-time **Welcome back** message on the rules screen.

If registration fails, remain on the form and show a network/storage error.

## 5. Shared game structure

Every game has some subset of these states:

```text
rules
playing / active game state
explanation or result
lifeline
highscore
error
```

### 5.1 Rules / briefing screen

Every game opens with:

- Eyebrow label: **Briefing**
- Game name
- Short premise
- Scoring rule
- Game Over condition
- Lifeline rule
- Optional game-specific insight bullets
- Existing daily best/rank, if present
- Start CTA

The start CTA is normally **Start game**. Fraud Detective uses **Begin investigation**.

### 5.2 Shared Lifeline screen

The Lifeline appears in two contexts:

- **Run Over.** after a game ends.
- **Attempt Over.** when a player has already played that game and returns to it.

Screen contents:

- `Lifeline` eyebrow.
- Context heading.
- Game-specific points/result display.
- One randomized Bureau-themed question.
- Four shuffled answer choices.
- Ten-second countdown.
- Retry button, initially disabled.
- Exit Run button.

Behavior:

| Event | Result |
|---|---|
| Correct answer | Timer stops; Retry unlocks; correct choice is highlighted |
| Wrong answer | Red incorrect feedback; the single attempt is consumed; timer continues |
| No answer before 10 seconds | Exit automatically to home |
| Exit Run | Return to home |
| Retry | Reset that game to its rules screen and start a fresh run |

The question options are shuffled once when the Lifeline mounts. The bank is low-difficulty wordplay/fill-in-the-blank content, and the correct answer is always **Bureau** in the current bank.

The local bank currently contains 15 questions. Example:

```text
Fill in the blank: Federal _______ of Investigation (FBI)
Agency / Bureau / Division / Office
Correct: Bureau
```

### 5.3 Failure actions

For normal question/case failures, use the shared action pattern:

- Retry
- Try the other available games
- End Run

These action buttons are at least 64px high for touch use. Failure screens show banked points and preserve the submitted result.

### 5.4 Game-end screen

The shared game-end screen contains:

- **Run Complete** or **High Score Achieved**
- Points
- Rank, when available
- Personal-best marker, when applicable
- Other games to try
- **Play again** on standard completion where enabled
- **Exit Arena**

Exit Arena clears the player session and returns to home. If all three games are complete, show **All three games complete** instead of the other-game prompt.

## 6. Spot the Fraud

### 6.1 Objective

Answer ten fraud-awareness questions covering consumer scams, network fraud, mule chains, device intelligence, synthetic media, and ring attribution.

The reviewed workbook is the authoritative content source. The offline replica must bundle the reviewed question bank and must not replace it with an older server pack.

### 6.2 State machine

```text
rules
  -> playing
  -> explain
       -> playing (Continue)
       -> highscore (perfect run)
       -> lifeline (run submitted)
       -> error (submission failed)
```

`explain` result types:

```text
correct
nearMiss
wrong
timeout
skipped
```

### 6.3 Level configuration

The level configuration is:

| Level | Label/theme | Timer | Full-clear points | Near-miss points |
|---:|---|---:|---:|---:|
| 1 | MCQ - single answer / Consumer scams | 20s | 4 | 0 |
| 2 | MCQ - single answer / Network basics | 20s | 5 | 0 |
| 3 | Spot the Fake / Synthetic media | 25s | 6 | 0 |
| 4 | MCQ - single answer / Ring mechanics | 25s | 7 | 0 |
| 5 | LEVEL UP / Network at scale | 35s | 8 | 4 |
| 6 | MCQ / Cross-application signals | 35s | 10 | 5 |
| 7 | Spot the Fake / Synthetic media | 35s | 12 | 6 |
| 8 | LEVEL UP / Fraud patterns | 40s | 14 | 7 |
| 9 | Spot the Fake / Synthetic media | 40s | 16 | 8 |
| 10 | MCQ / Expert ring attribution | 40s | 18 | 9 |

The theoretical maximum is 100 points.

**Important:** The actual number of answers required is read from each question's `selectN`, not inferred only from the level table. The offline port must preserve each authored question's `selectN` exactly. This supports single-answer and multi-answer questions, including reviewed-bank exceptions.

### 6.4 Active question screen

HUD order:

1. Level/type label and score.
2. Ten-segment level progress bar.
3. Remaining recovery skips.
4. Timer bar.
5. Question stem.
6. Selection instruction.
7. Answer choices.
8. Submit response and compact Skip controls.

Text choices show numbered answer rows. Image questions show a contained card grid with image labels and a selection marker.

For image questions:

- Each correct authored option receives a Fake asset.
- Each incorrect authored option receives a Real asset.
- The cards are shuffled independently from their logical option indexes.
- The runtime must keep a run-scoped set of used image asset IDs so cards do not repeat within a run.
- The question bank remains the scoring authority; the image assets are presentation data.

### 6.5 Selection and scoring

Let:

```text
required = currentQuestion.selectN
selected = selected option indexes
correct = currentQuestion.correct
```

The Submit button is disabled until `selected.length === required`.

Scoring:

```text
correctCount = count(selected index values that appear in correct)

if correctCount === required:
    award currentLevel.points
    mark the level cleared
    result = correct

else if required > 1 and correctCount === required - 1:
    award currentLevel.nearMiss
    result = nearMiss
    consume one recovery skip

else:
    award 0
    result = wrong
    consume one recovery skip
```

The current implementation only compares the number of correct selections; the offline version should additionally ensure duplicate selections are impossible.

### 6.6 Timer

- Timer starts at the level's configured seconds.
- It decrements once per second.
- A transition from a positive value to zero triggers timeout exactly once.
- Timeout awards zero points and consumes one recovery skip.

### 6.7 Skip and recovery

Each Spot run begins with **3 recovery skips**.

The following consume one recovery skip:

- Explicit Skip.
- Wrong answer.
- Near miss.
- Timeout.

If a skip remains after the failure:

1. Show the failure/explanation screen.
2. Show exact copy: **Skip Used**.
3. Show a five-second progress/countdown.
4. Auto-continue to the next level.
5. Allow manual Continue.

The first recovery skip should be represented by the initial progress bar at 100%.

If no skip remains:

1. Show the failure screen.
2. Show banked points.
3. Show Retry / other games / End Run actions.
4. Auto-exit after ten seconds if the player does not act.

An explicit Skip is not an answer and awards zero points. It still advances when a recovery skip is available.

### 6.8 Correct-answer explanation

Correct answers show:

- Correct status.
- Points awarded.
- Mechanism explanation (`why`).
- Content hook.
- Five-second Continue countdown.
- Manual Continue.

Correct Continue moves to the next level. Completing level 10 submits the run.

### 6.9 Spot submission payload

Submit a run with:

```text
playerId
game: "spot_the_fraud"
points
source: "phone" when src=qr, otherwise "kiosk"
idempotencyKey
detail:
  levelReached
  cleared[]
  nearMiss
  skipped[]
  recoverySkipsUsed
  tier
  perLevel[]
```

Tier:

```text
Master      if level 10 was cleared
Achiever    otherwise if level 5 was cleared
Participation otherwise
```

A perfect run is one where all ten levels are cleared. A perfect submission opens High Score instead of Lifeline.

## 7. Spoof the System

### 7.1 Objective

Upload an AI-generated or synthetic image and try to fool the Bureau detector across three increasingly difficult levels.

### 7.2 State machine

```text
rules
  -> uploading
  -> detecting
  -> reveal
  -> decision
       -> uploading (risk next level)
       -> lifeline (take banked points / caught)
       -> highscore (all three fooled)
       -> error (run submission failed)
```

### 7.3 Scoring ladder

| Level cleared | Points added | Total banked |
|---:|---:|---:|
| 1 | 17 | 17 |
| 2 | 33 | 50 |
| 3 | 50 | 100 |

If the detector catches the image at a level, the run ends and points from earlier cleared levels remain banked:

```text
Caught at level 1 -> 0 points
Caught at level 2 -> 17 points
Caught at level 3 -> 50 points
```

The server accepts only the fixed submitted totals `0`, `17`, `50`, or `100`. The offline version should preserve the same ladder.

### 7.4 Upload screen

Contents:

- Level number.
- Heading: **Upload your AI generated image**
- Copy: **Choose a JPEG or PNG image under 5 MB to test the detector.**
- QR panel: **Scan to upload the AI generated image from your phone.**
- Select image button.

Accepted types:

```text
image/jpeg
image/png
```

The file must be strictly less than 5 MiB:

```text
file.size < 5 * 1024 * 1024
```

Reject invalid files before scanning and show a clear error. The server-side/offline adapter must enforce the same limit.

The image is read as a data URL. The base64 payload is sent to the detector adapter along with:

```text
playerId
level
image
mimeType
fileName
```

### 7.5 Detecting screen

Show:

- Uploaded image beneath a dark overlay.
- **Analysis active** status.
- **Scanning payload** heading.
- Animated detector message.
- Progress bar from 0% toward 95% while waiting.
- **Bureau detector running** label.

The current message cycle is:

1. Extracting frequency vectors…
2. Running noise-residual analysis…
3. Checking compression history…
4. Mapping facial-landmark geometry…
5. Evaluating adversarial robustness…
6. Scoring synthetic artefacts…
7. Cross-referencing detector ensemble…

On detector success, progress becomes 100% and the app enters Reveal.

### 7.6 Offline detector contract

The detector adapter returns:

```text
{
  fooled: boolean,
  confidence: number,       // 0 to 1
  signals: [
    { name: string, verdict: string, score: number }
  ],
  heatmapRegions: [
    { x: number, y: number, w: number, h: number, intensity: number }
  ],
  latencyMs: number
}
```

For a fully offline build, use a deterministic result derived from the image hash, level, and an optional seeded test fixture. The same image and level should produce the same result during a run.

### 7.7 Verdict semantics

The detector feed classifies each pass using the strict boundary:

```text
score > 0.50  -> Synthetic
score <= 0.50 -> Real
```

The overall UI uses:

```text
fooled = true  -> Real Image, award the level points
fooled = false -> Fake Image, run ends
```

This naming is intentional: the player is trying to make a synthetic image pass as Real.

### 7.8 Reveal screen

Reveal has two phases:

1. Detector passes reveal one at a time, approximately every 600ms.
2. After all passes are visible, hold the completed verdict for five seconds.

Show:

- **Analysis complete**
- **Detector Verdict**
- Uploaded image.
- Dark/grayscale treatment while unresolved.
- Heatmap regions when the detector catches the image.
- Detector pass ticker in a two-row visible window.
- Verdict pill:
  - `Real Image` and `+<points> points` when fooled.
  - `Fake Image` and `No points awarded` when caught.
- Five-second auto-continue countdown.
- Manual Continue.

### 7.9 Decision screen

After successfully fooling levels 1 or 2, show:

- `<total> total points banked.`
- Explanation that the latest level added its points.
- Ladder rows for 0, 17, 50, and 100.
- **Risk level N**
- **Take `<points>` pts**

Risk continues to the next level. Take submits the current banked total and ends the run voluntarily.

If level 3 is fooled, submit 100 points immediately and show High Score.

### 7.10 Spoof run details

Submit:

```text
playerId
game: "spoof_the_system"
points
source: "phone" when src=qr, otherwise "kiosk"
idempotencyKey
detail:
  attempts[]:
    level
    fooled
    confidence
  ladderReached
  quitVoluntarily
  drawPool: "mystery_prize" when at least 2 images were fooled, otherwise null
  tier: "Achiever" when points >= 50, otherwise "Participation"
```

Three fooled attempts is a perfect run and opens High Score.

## 8. Fraud Detective

### 8.1 Objective

Solve five network investigations. Each case displays a graph of accounts, devices, loans, sellers, wallets, or related entities. The player must identify the node that exposes the ring pattern.

The reviewed local Detective case bank is authoritative. The case pack should randomly select five reviewed cases and renumber them 1–5 for the current run.

### 8.2 State machine

```text
rules
  -> primer
  -> case
       -> case (Next case)
       -> casefail
       -> bonus
       -> highscore
       -> lifeline
       -> error
```

The current UI folds the primer into the briefing through the **What you're looking for** section:

- Fraud rings cluster; members transact with each other.
- Look for a bridge node linking two clusters that should not interact.
- Look for an unusually connected hub or a newly formed group.

### 8.3 Case screen

HUD order:

1. Sector label and score.
2. Five-case progress bar.
3. Recovery skips remaining.
4. 45-second case timer.
5. Graph canvas.
6. Objective.
7. Clues.
8. Submit accusation and Skip case.

The visible Case heading is intentionally omitted to give the graph more room.

Graph behavior:

- Use a deterministic force-directed layout for each case.
- Use a padded SVG `viewBox` to fit all nodes and labels.
- Preserve spacing by scaling the viewBox, not by compressing node positions.
- Start zoomed out with all nodes fitted.
- Permit touch pan and zoom with deliberate bounds.
- Use colored nodes/edges after the case resolves to reveal the answer.
- A graph full-screen toggle hides Objective and Clues but retains timer and actions.

### 8.4 Case content model

Each case contains:

```text
id
order
sector
title
clues[]
brief
instruction
nodes[]
clusters: { clusterName: nodeId[] }
edges: [sourceId, targetId][]
edgeLabels: optional map
nodeLabels: optional map
answer: nodeId[]
explanation
hook
```

Examples of case patterns:

- A bridge account linking two otherwise isolated communities.
- A fan-in account receiving multiple loan disbursements.
- A circular guarantor chain.
- A shared attacker device across several accounts.
- A self-dealing seller/refund loop.

### 8.5 Case timer and failure

- Every case gets exactly 45 seconds.
- Use a real deadline (`startedAt + 45 seconds`) rather than trusting render count.
- Sync the visible timer frequently enough to avoid drift.
- At zero, reveal/fail the case and consume a recovery skip.

### 8.6 Accusation rules

The player taps one node, then submits.

```text
If selected node is in currentCase.answer:
    mark solved
    award 15 case points
    show Case Closed

Otherwise:
    reveal the answer
    award 0
    consume one recovery skip
    show case failure
```

The current content uses one answer node per case. Keep the answer type as an array so the data model can support multi-node cases.

The **Reveal** action on the failure view reveals the answer without consuming an additional recovery skip.

### 8.7 Case Closed

When solved:

- Show **Case Closed**.
- Show the case explanation.
- Show a five-second **Next case loading** countdown.
- Allow manual **Next Round**.
- Advance automatically after five seconds.

The transition must be idempotent so the manual and automatic actions cannot advance twice.

### 8.8 Detective recovery

Each run begins with **2 recovery skips**.

The following consume one:

- Wrong accusation.
- Timeout.
- Explicit Skip case.

When a recovery skip remains:

1. Show the resolved answer/failure screen.
2. Show exact copy: **Skip Used**.
3. Allow/auto-continue to the next case.

When no skip remains:

1. Show Case Failed.
2. Show Retry / other games / End Run actions.
3. Auto-exit after ten seconds if the player does not act.

### 8.9 Bonus round

After all five cases, run the bonus questions:

- Each correct bonus answer awards 5 points.
- There is a two-second delay between bonus questions.
- The bonus score is added to the final total.

### 8.10 Detective scoring

Let:

```text
caseScore = 15 * number of solved cases
bonusScore = 5 * number of correct bonus answers
correctCaseCount = number of case results with points > 0 and not revealed
```

Milestones:

```text
if correctCaseCount >= 3: add 10
if correctCaseCount === 5: add 15
```

Final score:

```text
total = caseScore + bonusScore + milestoneBonus
```

The all-five bonus is additive to the three-or-more bonus. Therefore five correct cases earn both milestone bonuses.

Tiers:

```text
Master        total >= 80
Achiever      total >= 40
Participation otherwise
```

### 8.11 Detective submission payload

```text
playerId
game: "fraud_detective"
points: total
source: "phone" when src=qr, otherwise "kiosk"
idempotencyKey
detail:
  cases[]
  casePoints
  milestonePoints
  bonusRoundPoints
  recoverySkipsUsed
  tier
```

A perfect Detective run has five solved, unrevealed cases. It should open High Score after submission.

## 9. Leaderboard and run recording

The server validates run totals before recording:

- Floor submitted points.
- Clamp to the game's published cap.
- Spoof totals must be one of `0`, `17`, `50`, `100`.
- Verify the player exists.
- Compare against the player's previous best for the current event day.
- Record `isPersonalBest`.
- Return the updated standing.
- Delete matching in-progress state after successful submission.

Offline behavior should match these rules:

1. Never create duplicate runs from a repeated submit.
2. Never trust arbitrary client points; recompute or validate from local run state.
3. Keep each game's score separate.
4. Preserve `source` as `phone` or `kiosk`.
5. Support today's standing and cumulative leaderboard views.

Leaderboard rows show public player data only, such as first name and company. Do not display email or phone.

## 10. Content packaging

The current content locations are:

```text
artifacts/fraud-arena/src/data/quiz.ts
artifacts/fraud-arena/src/data/image-quiz-pool.ts
artifacts/fraud-arena/src/data/ai-quiz-images.ts
artifacts/fraud-arena/src/data/detective.ts
artifacts/fraud-arena/src/data/lifeline.ts
artifacts/fraud-arena/src/lib/gamePack.ts
artifacts/fraud-arena/src/assets/image-quiz/real/
artifacts/fraud-arena/src/assets/image-quiz/fake/
```

The reviewed workbook output is loaded by `gamePack.ts`:

- Spot the Fraud: one reviewed question per level.
- Fraud Detective: five reviewed cases selected for the run.
- Lifeline: API question with the local bank as fallback.

For the offline replica, bundle the reviewed banks directly. Keep the content schema and answer indexes unchanged. Option and node presentation may be randomized, but answer indexes must remain stable.

## 11. Exact cross-game acceptance checklist

### Entry and registration

- [ ] Home shows all three games.
- [ ] Arena QR opens home with `src=qr`.
- [ ] Spoof QR opens Spoof with `src=qr`.
- [ ] Game without a session redirects to registration.
- [ ] Registration preserves the requested return game.
- [ ] Indian phone formats normalize correctly.
- [ ] Invalid phone, email, name, company, and missing Job Function are blocked.
- [ ] Returning players receive the correct Player Gate.
- [ ] End session clears the active player.

### Shared controls

- [ ] Rules screen appears before every fresh run.
- [ ] Existing best score appears on the rules screen.
- [ ] Lifeline has a ten-second timer.
- [ ] Correct Lifeline answer unlocks Retry and stops the timer.
- [ ] Wrong Lifeline answer cannot be changed.
- [ ] Lifeline timeout exits to home.
- [ ] Failure action buttons remain touchable and at least 64px tall.
- [ ] Submit/retry is idempotent.

### Spot the Fraud

- [ ] Ten levels load from the reviewed bank.
- [ ] Level timers match the table.
- [ ] The authored question `selectN` controls required selection count.
- [ ] Exact matches award full points.
- [ ] One-missing multi-select answers award near-miss points.
- [ ] Other wrong answers and timeouts award zero.
- [ ] Three recovery skips are consumed correctly.
- [ ] Recovery auto-continues after five seconds.
- [ ] Exhausted recovery shows the normal run-over actions.
- [ ] Image cards are contained, readable, and do not repeat within a run.
- [ ] Perfect completion shows High Score.

### Spoof the System

- [ ] JPEG and PNG under 5 MiB are accepted.
- [ ] Files at or over 5 MiB are rejected before detector processing.
- [ ] Other MIME types are rejected.
- [ ] Detecting screen has dark overlay, ticker, and progress.
- [ ] Confidence above 50% is Synthetic; 50% or below is Real.
- [ ] Fooling levels awards 17, 33, and 50.
- [ ] Cumulative totals are 17, 50, and 100.
- [ ] A caught image ends the run while preserving earlier points.
- [ ] Risk/Take decision is available after levels 1 and 2.
- [ ] Perfect completion shows High Score.

### Fraud Detective

- [ ] Five reviewed cases load and are renumbered 1–5.
- [ ] Every case has a 45-second real deadline.
- [ ] Graph fits all nodes and labels on mobile.
- [ ] Graph can pan/zoom without disappearing.
- [ ] Full-screen graph hides Objective and Clues only.
- [ ] Correct node awards 15.
- [ ] Wrong node, timeout, and skip consume recovery skips.
- [ ] Two recovery skips are available per run.
- [ ] Case Closed remains visible for five seconds.
- [ ] Manual and automatic next-case actions cannot double-advance.
- [ ] Bonus questions award 5 each.
- [ ] Three-case and all-five milestone bonuses are cumulative.
- [ ] Perfect completion shows High Score.

## 12. Recommended offline test fixtures

Use deterministic fixtures so the offline build can be tested without waiting or guessing:

```text
Spot:
  all-correct fixture -> 100 points -> High Score
  wrong at level 1 -> skip recovery -> Continue
  wrong four times -> exhausted run
  near miss on a multi-select question -> near-miss points
  repeated image draw -> no duplicate asset IDs

Spoof:
  level 1 fooled -> 17 points
  levels 1 and 2 fooled, Take -> 50 points
  level 3 fooled -> 100 points -> High Score
  caught at level 2 -> 17 points
  file size >= 5 MiB -> local validation error, no detector call

Detective:
  all five correct -> 75 case points + 10 + 15, plus bonus score
  three correct -> 45 case points + 10
  wrong/timeout with skips remaining -> Skip Used
  exhausted skips -> run-over action stack

Shared:
  Lifeline correct -> Retry enabled
  Lifeline wrong -> answer locked
  Lifeline timeout -> home
  duplicate submit key -> one recorded run
```

## 13. Visual and interaction principles to preserve

- Mobile-first fixed-height shell; avoid horizontal overflow.
- Dark Bureau interface with violet, coral, lime, cyan, amber, and Russian/ink neutrals.
- Fixed headers and bottom actions; flexible middle content may scroll.
- Compact Skip controls sit beside the primary Submit action.
- Question/case content is the flexible region on compact failure/Lifeline layouts.
- Use direct, declarative copy and the shared term **Lifeline**.
- Keep timers visible and fair; do not reset a live timer because of a rerender or reconnect.
- Preserve banked points across later failures.
- Make automatic transitions manually reachable as well.
- Never make a player silently lose an active run because local storage or the network is temporarily unavailable.
