import { Router, type IRouter } from "express";
import { db, type GameKey, type LeaderboardViewRow } from "@workspace/db";
import {
  GetLeaderboardQueryParams,
  GetLeaderboardResponse,
} from "@workspace/api-zod";

import { firstNameOf } from "../lib/entryValidation";
import {
  rankedRows,
  viewForScope,
  type LeaderboardScope,
} from "../lib/standing";

const router: IRouter = Router();

interface RankedRow {
  rank: number;
  playerId: string;
  displayName: string;
  company: string;
  spotTheFraud: number;
  spoofTheSystem: number;
  fraudDetective: number;
  bonus: number;
  total: number;
  gamesPlayed: number;
  isDemo: boolean;
}

router.get("/leaderboard", async (req, res): Promise<void> => {
  const parsed = GetLeaderboardQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid leaderboard request." });
    return;
  }

  const scope = (parsed.data.scope ?? "cumulative") as LeaderboardScope;
  const game = parsed.data.game;
  const limit = parsed.data.limit ?? 10;
  const playerId = parsed.data.playerId;

  // Booth-scale data — a couple of thousand rows at most across two days — so
  // ranking in memory is clearer than a windowed query, and it keeps the
  // per-game tabs, the pinned row and each player's own standing on exactly
  // the same ordering (see rankedRows).
  const rows = await db.select().from(viewForScope(scope));

  const ranked: RankedRow[] = rankedRows(rows, game).map((row, index) => ({
    rank: index + 1,
    playerId: row.playerId ?? "",
    // First name only: this is rendered on a wall display in a public hall.
    displayName: firstNameOf(row.workName ?? ""),
    company: row.company ?? "",
    spotTheFraud: row.spotTheFraud ?? 0,
    spoofTheSystem: row.spoofTheSystem ?? 0,
    fraudDetective: row.fraudDetective ?? 0,
    bonus: row.bonus ?? 0,
    total: row.total ?? 0,
    gamesPlayed: row.gamesPlayed ?? 0,
    isDemo: row.isDemo ?? false,
  }));

  const top = ranked.slice(0, limit);

  const pinned =
    playerId !== undefined && !top.some((row) => row.playerId === playerId)
      ? (ranked.find((row) => row.playerId === playerId) ?? null)
      : null;

  res.json(
    GetLeaderboardResponse.parse({
      scope,
      game: game ?? null,
      rows: top,
      pinned,
      totalPlayers: ranked.length,
      updatedAt: new Date(),
    }),
  );
});

export default router;
