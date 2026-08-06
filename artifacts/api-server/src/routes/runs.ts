import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { and, eq, isNull, max, sql } from "drizzle-orm";
import {
  db,
  GAME_CAPS,
  playersTable,
  runProgressTable,
  runsTable,
} from "@workspace/db";
import {
  GetRunProgressParams,
  GetRunProgressResponse,
  SaveRunProgressBody,
  SaveRunProgressResponse,
  SubmitRunBody,
  SubmitRunResponse,
} from "@workspace/api-zod";

import { currentEventDay } from "../lib/eventDay";
import { computeStanding } from "../lib/standing";

const router: IRouter = Router();

/** Fail attempt 1, beat L1, beat L2, beat L3 — plus an abandoned run. */
const SPOOF_LADDER = new Set([0, 15, 40, 60, 75]);

router.post("/runs", async (req, res): Promise<void> => {
  const parsed = SubmitRunBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ issues: parsed.error.issues }, "run rejected: bad shape");
    res.status(400).json({ error: "That run couldn't be read." });
    return;
  }

  const { playerId, game, points, source, idempotencyKey, detail } =
    parsed.data;

  // Never trust a score from a kiosk browser: clamp to the published cap.
  const pointsRecorded = Math.max(
    0,
    Math.min(GAME_CAPS[game], Math.floor(points)),
  );

  // Spoof the System is a fixed ladder, so anything off a rung is a tampered
  // or buggy client rather than a real run. Check what was *submitted*, not
  // the clamped value: clamping first would quietly promote a bogus 100 to the
  // top rung of 75, which is the one direction we must never round towards.
  // The other two games accumulate per-question points, so their space of
  // valid totals is genuinely wide and the cap is the only server-side check.
  if (game === "spoof_the_system" && !SPOOF_LADDER.has(Math.floor(points))) {
    req.log.warn({ points }, "run rejected: off-ladder spoof score");
    res.status(400).json({ error: "That isn't a valid Spoof score." });
    return;
  }

  const eventDay = currentEventDay();

  const outcome = await db.transaction(async (tx) => {
    const [player] = await tx
      .select({ id: playersTable.id })
      .from(playersTable)
      .where(eq(playersTable.id, playerId))
      .limit(1);

    if (player === undefined) return null;

    // The best-run comparison has to sit inside the transaction, or two runs
    // landing together can both believe they were the personal best.
    const [previous] = await tx
      .select({ best: max(runsTable.points) })
      .from(runsTable)
      .where(
        and(
          eq(runsTable.playerId, playerId),
          eq(runsTable.game, game),
          eq(runsTable.eventDay, eventDay),
          isNull(runsTable.voidedAt),
        ),
      );

    const previousBest = previous?.best ?? null;

    // Let the unique index decide the race, and always come back with a row.
    //
    // DO NOTHING would be wrong here: it reports the conflict but returns
    // nothing, and a follow-up SELECT in this same transaction is not
    // guaranteed to see the winner's row until that transaction commits. The
    // loser could then find neither its own insert nor the original and would
    // tell a visitor their run failed while it was in fact being recorded.
    //
    // A no-op DO UPDATE instead blocks on the concurrent writer and returns
    // the committed row, so both retries walk away with the same run. If the
    // winner rolls back, this simply inserts as normal.
    //
    // We mint the id ourselves so we can tell the two cases apart: getting our
    // own id back means we were the one that inserted.
    const newRunId = randomUUID();

    const [run] = await tx
      .insert(runsTable)
      .values({
        id: newRunId,
        playerId,
        game,
        points: pointsRecorded,
        detail: detail ?? null,
        source,
        eventDay,
        idempotencyKey,
      })
      .onConflictDoUpdate({
        target: runsTable.idempotencyKey,
        set: { idempotencyKey: sql`excluded.idempotency_key` },
      })
      .returning();

    if (run === undefined) return null;

    if (run.id !== newRunId) {
      // The key was already recorded: replay the original run verbatim.
      return { run, duplicate: true, isPersonalBest: false };
    }

    await tx
      .delete(runProgressTable)
      .where(eq(runProgressTable.idempotencyKey, idempotencyKey));

    return {
      run,
      duplicate: false,
      isPersonalBest: previousBest === null || pointsRecorded > previousBest,
    };
  });

  if (outcome === null) {
    res.status(400).json({ error: "We couldn't find that player." });
    return;
  }

  const standing = await computeStanding(playerId, "today");

  res.json(
    SubmitRunResponse.parse({
      runId: outcome.run.id,
      game: outcome.run.game,
      pointsSubmitted: points,
      pointsRecorded: outcome.run.points,
      isPersonalBest: outcome.isPersonalBest,
      duplicate: outcome.duplicate,
      standing,
    }),
  );
});

router.post("/runs/progress", async (req, res): Promise<void> => {
  const parsed = SaveRunProgressBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Could not save progress." });
    return;
  }

  const { idempotencyKey, playerId, game, state } = parsed.data;

  const [saved] = await db
    .insert(runProgressTable)
    .values({ idempotencyKey, playerId, game, state })
    .onConflictDoUpdate({
      target: runProgressTable.idempotencyKey,
      set: { state, updatedAt: new Date() },
    })
    .returning();

  if (saved === undefined) {
    res.status(400).json({ error: "Could not save progress." });
    return;
  }

  res.json(SaveRunProgressResponse.parse(saved));
});

router.get("/runs/progress/:idempotencyKey", async (req, res): Promise<void> => {
  const parsed = GetRunProgressParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Could not read progress." });
    return;
  }

  const [progress] = await db
    .select()
    .from(runProgressTable)
    .where(eq(runProgressTable.idempotencyKey, parsed.data.idempotencyKey))
    .limit(1);

  if (progress === undefined) {
    res.status(404).json({ error: "No run in progress." });
    return;
  }

  res.json(GetRunProgressResponse.parse(progress));
});

export default router;
