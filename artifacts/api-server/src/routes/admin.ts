import { Router, type IRouter } from "express";
import { and, avg, count, countDistinct, desc, eq, isNull, max } from "drizzle-orm";
import {
  appSettingsTable,
  db,
  GAME_CAPS,
  leaderboardCumulativeView,
  playersTable,
  runsTable,
  SETTING_SIX_DEGREES_CAUTION_ACK,
  spoofUploadsTable,
  type GameKey,
} from "@workspace/db";
import {
  GetAdminLeadsResponse,
  GetAdminStatsResponse,
  GetContentAccuracyResponse,
  GetDrawPoolsResponse,
  GetSpoofUploadsResponse,
  RunAdminActionBody,
  RunAdminActionResponse,
} from "@workspace/api-zod";

import { buildAccuracyReport, foolsFromSpoofDetail } from "../lib/accuracy";
import { requireAdmin } from "../lib/adminAuth";
import { clearDemoRows, seedDemoRows } from "../lib/demoSeed";
import { currentEventDay } from "../lib/eventDay";
import { GAME_KEYS } from "../lib/standing";

const router: IRouter = Router();

router.use("/admin", requireAdmin);

/** Overall tier label from the cumulative total, for the lead export. */
function tierForTotal(total: number): string {
  if (total >= 200) return "Master";
  if (total >= 100) return "Achiever";
  if (total > 0) return "Participation";
  return "Registered";
}

async function sixDegreesAcknowledged(): Promise<boolean> {
  const [row] = await db
    .select()
    .from(appSettingsTable)
    .where(eq(appSettingsTable.key, SETTING_SIX_DEGREES_CAUTION_ACK))
    .limit(1);
  return row?.value === true;
}

router.get("/admin/stats", async (_req, res): Promise<void> => {
  const eventDay = currentEventDay();
  const live = isNull(runsTable.voidedAt);
  const liveToday = and(eq(runsTable.eventDay, eventDay), live);

  const [
    [playersTotal],
    [runsTotal],
    [runsToday],
    [playersToday],
    perGameRows,
    [kiosk],
    [phone],
    [demoRows],
    [uploads],
    acknowledged,
    cumulative,
  ] = await Promise.all([
    db.select({ n: count() }).from(playersTable),
    db.select({ n: count() }).from(runsTable).where(live),
    db.select({ n: count() }).from(runsTable).where(liveToday),
    db
      .select({ n: countDistinct(runsTable.playerId) })
      .from(runsTable)
      .where(liveToday),
    db
      .select({
        game: runsTable.game,
        runs: count(),
        players: countDistinct(runsTable.playerId),
        averagePoints: avg(runsTable.points),
        bestPoints: max(runsTable.points),
      })
      .from(runsTable)
      .where(live)
      .groupBy(runsTable.game),
    db
      .select({ n: count() })
      .from(runsTable)
      .where(and(eq(runsTable.source, "kiosk"), live)),
    db
      .select({ n: count() })
      .from(runsTable)
      .where(and(eq(runsTable.source, "phone"), live)),
    db
      .select({ n: count() })
      .from(playersTable)
      .where(eq(playersTable.isDemo, true)),
    db
      .select({ n: count() })
      .from(spoofUploadsTable)
      .where(isNull(spoofUploadsTable.deletedAt)),
    sixDegreesAcknowledged(),
    db.select().from(leaderboardCumulativeView),
  ]);

  const byGame = new Map(perGameRows.map((row) => [row.game, row]));

  res.json(
    GetAdminStatsResponse.parse({
      playersToday: playersToday?.n ?? 0,
      playersTotal: playersTotal?.n ?? 0,
      runsToday: runsToday?.n ?? 0,
      runsTotal: runsTotal?.n ?? 0,
      playedAllThreeToday: cumulative.filter((r) => (r.gamesPlayed ?? 0) === 3)
        .length,
      // Every game is listed even at zero, so the host sees a station that has
      // gone quiet rather than a row that silently disappeared.
      perGame: GAME_KEYS.map((game) => {
        const row = byGame.get(game);
        return {
          game,
          runs: row?.runs ?? 0,
          players: row?.players ?? 0,
          averagePoints:
            row?.averagePoints == null
              ? 0
              : Math.round(Number(row.averagePoints) * 10) / 10,
          bestPoints: row?.bestPoints ?? 0,
        };
      }),
      runsByKiosk: kiosk?.n ?? 0,
      runsByPhone: phone?.n ?? 0,
      demoRowCount: demoRows?.n ?? 0,
      uploadsRetained: uploads?.n ?? 0,
      sixDegreesCautionAcknowledged: acknowledged,
      eventDay,
    }),
  );
});

router.get("/admin/leads", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      playerId: playersTable.id,
      workName: playersTable.workName,
      email: playersTable.email,
      phone: playersTable.phone,
      company: playersTable.company,
      jobFunction: playersTable.jobFunction,
      noWorkEmail: playersTable.noWorkEmail,
      consentAt: playersTable.consentAt,
      isDemo: playersTable.isDemo,
      createdAt: playersTable.createdAt,
      gamesPlayed: leaderboardCumulativeView.gamesPlayed,
      spotTheFraud: leaderboardCumulativeView.spotTheFraud,
      spoofTheSystem: leaderboardCumulativeView.spoofTheSystem,
      fraudDetective: leaderboardCumulativeView.fraudDetective,
      bonus: leaderboardCumulativeView.bonus,
      total: leaderboardCumulativeView.total,
    })
    .from(playersTable)
    .leftJoin(
      leaderboardCumulativeView,
      eq(leaderboardCumulativeView.playerId, playersTable.id),
    )
    .orderBy(desc(playersTable.createdAt));

  res.json(
    GetAdminLeadsResponse.parse(
      rows.map((row) => ({
        ...row,
        gamesPlayed: row.gamesPlayed ?? 0,
        spotTheFraud: row.spotTheFraud ?? 0,
        spoofTheSystem: row.spoofTheSystem ?? 0,
        fraudDetective: row.fraudDetective ?? 0,
        bonus: row.bonus ?? 0,
        total: row.total ?? 0,
        tier: tierForTotal(row.total ?? 0),
      })),
    ),
  );
});

router.get("/admin/draw-pools", async (_req, res): Promise<void> => {
  const [spoofRuns, board] = await Promise.all([
    db
      .select({
        playerId: runsTable.playerId,
        points: runsTable.points,
        detail: runsTable.detail,
        workName: playersTable.workName,
        email: playersTable.email,
        company: playersTable.company,
        phone: playersTable.phone,
      })
      .from(runsTable)
      .innerJoin(playersTable, eq(playersTable.id, runsTable.playerId))
      .where(
        and(
          eq(runsTable.game, "spoof_the_system"),
          isNull(runsTable.voidedAt),
          eq(playersTable.isDemo, false),
        ),
      ),
    db.select().from(leaderboardCumulativeView),
  ]);

  // Qualification follows the player's best Spoof run, matching how the
  // leaderboard scores that game.
  const best = new Map<string, { points: number; fools: number; entry: Record<string, unknown> }>();
  for (const run of spoofRuns) {
    const existing = best.get(run.playerId);
    if (existing !== undefined && existing.points >= run.points) continue;
    best.set(run.playerId, {
      points: run.points,
      fools: foolsFromSpoofDetail(run.detail),
      entry: {
        playerId: run.playerId,
        workName: run.workName,
        email: run.email,
        company: run.company,
        phone: run.phone,
      },
    });
  }

  const pool = (fools: number) =>
    [...best.values()]
      .filter((b) => b.fools === fools)
      .map((b) => ({ ...b.entry, fools: b.fools }));

  const playerById = new Map(
    spoofRuns.map((r) => [
      r.playerId,
      { workName: r.workName, email: r.email, company: r.company, phone: r.phone },
    ]),
  );

  res.json(
    GetDrawPoolsResponse.parse({
      airpods: pool(2),
      ipad: pool(3),
      fraudFighter: board
        .filter((r) => (r.gamesPlayed ?? 0) === 3 && r.isDemo !== true)
        .map((r) => ({
          playerId: r.playerId ?? "",
          workName: r.workName ?? "",
          email: playerById.get(r.playerId ?? "")?.email ?? "",
          company: r.company ?? "",
          phone: playerById.get(r.playerId ?? "")?.phone,
          fools: best.get(r.playerId ?? "")?.fools ?? 0,
        })),
    }),
  );
});

router.get("/admin/accuracy", async (_req, res): Promise<void> => {
  const rows = await db
    .select({ game: runsTable.game, detail: runsTable.detail })
    .from(runsTable)
    .where(and(isNull(runsTable.voidedAt), eq(runsTable.isDemo, false)));

  res.json(GetContentAccuracyResponse.parse(buildAccuracyReport(rows)));
});

router.get("/admin/uploads", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: spoofUploadsTable.id,
      playerId: spoofUploadsTable.playerId,
      playerName: playersTable.workName,
      level: spoofUploadsTable.level,
      mimeType: spoofUploadsTable.mimeType,
      sizeBytes: spoofUploadsTable.sizeBytes,
      fooled: spoofUploadsTable.fooled,
      createdAt: spoofUploadsTable.createdAt,
      expiresAt: spoofUploadsTable.expiresAt,
    })
    .from(spoofUploadsTable)
    .innerJoin(playersTable, eq(playersTable.id, spoofUploadsTable.playerId))
    .where(isNull(spoofUploadsTable.deletedAt))
    .orderBy(desc(spoofUploadsTable.createdAt))
    .limit(200);

  res.json(GetSpoofUploadsResponse.parse(rows));
});

router.post("/admin/actions", async (req, res): Promise<void> => {
  const parsed = RunAdminActionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Unknown action." });
    return;
  }

  const { action, runId, uploadId } = parsed.data;

  const reply = (applied: boolean, message: string, affected?: number) => {
    res.json(
      RunAdminActionResponse.parse({ action, applied, affected, message }),
    );
  };

  if (action === "clear_demo_rows") {
    const affected = await clearDemoRows();
    reply(true, `Cleared ${affected} demo players and their runs.`, affected);
    return;
  }

  if (action === "seed_demo_rows") {
    const seeded = await seedDemoRows();
    reply(
      true,
      `Seeded ${seeded.players} demo players and ${seeded.runs} runs.`,
      seeded.players,
    );
    return;
  }

  if (action === "void_run") {
    if (runId === undefined) {
      res.status(400).json({ error: "Pick a run to void.", field: "runId" });
      return;
    }
    // Voiding rather than deleting: the run stays auditable, but drops out of
    // the view so the player can replay for a clean score.
    const voided = await db
      .update(runsTable)
      .set({ voidedAt: new Date() })
      .where(and(eq(runsTable.id, runId), isNull(runsTable.voidedAt)))
      .returning({ id: runsTable.id });
    reply(
      voided.length > 0,
      voided.length > 0
        ? "Run voided — they can play that game again for a fresh score."
        : "That run was already voided.",
      voided.length,
    );
    return;
  }

  if (action === "delete_upload") {
    if (uploadId === undefined) {
      res
        .status(400)
        .json({ error: "Pick an upload to remove.", field: "uploadId" });
      return;
    }
    const removed = await db
      .update(spoofUploadsTable)
      .set({ data: null, deletedAt: new Date() })
      .where(
        and(
          eq(spoofUploadsTable.id, uploadId),
          isNull(spoofUploadsTable.deletedAt),
        ),
      )
      .returning({ id: spoofUploadsTable.id });
    reply(
      removed.length > 0,
      removed.length > 0 ? "Image removed." : "That image was already removed.",
      removed.length,
    );
    return;
  }

  await db
    .insert(appSettingsTable)
    .values({ key: SETTING_SIX_DEGREES_CAUTION_ACK, value: true })
    .onConflictDoUpdate({
      target: appSettingsTable.key,
      set: { value: true, updatedAt: new Date() },
    });
  reply(true, "Six Degrees caution acknowledged.");
});

export { GAME_CAPS };
export type { GameKey };
export default router;
