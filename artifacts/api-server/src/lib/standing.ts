import { and, count, desc, eq, gt } from "drizzle-orm";
import {
  db,
  FRAUD_FIGHTER_BONUS,
  GAME_CAPS,
  leaderboardCumulativeView,
  leaderboardTodayView,
  MAX_TOTAL,
  type GameKey,
  type LeaderboardViewRow,
} from "@workspace/db";

export type LeaderboardScope = "today" | "cumulative";

export const GAME_KEYS: GameKey[] = [
  "spot_the_fraud",
  "spoof_the_system",
  "fraud_detective",
];

export function viewForScope(scope: LeaderboardScope) {
  return scope === "today" ? leaderboardTodayView : leaderboardCumulativeView;
}

export function pointsFor(row: LeaderboardViewRow, game: GameKey): number {
  if (game === "spot_the_fraud") return row.spotTheFraud ?? 0;
  if (game === "spoof_the_system") return row.spoofTheSystem ?? 0;
  return row.fraudDetective ?? 0;
}

export function playedGame(row: LeaderboardViewRow, game: GameKey): boolean {
  if (game === "spot_the_fraud") return row.playedSpotTheFraud ?? false;
  if (game === "spoof_the_system") return row.playedSpoofTheSystem ?? false;
  return row.playedFraudDetective ?? false;
}

/**
 * The one definition of leaderboard order. Both the board and a player's own
 * standing rank through here, because a visitor reading "You are 3rd" beside a
 * wall display that puts them 4th is the kind of thing that starts an argument
 * at the booth. Ties break on games played, then name, so the order is total
 * and stable rather than dependent on however Postgres returned the rows.
 */
export function compareRows(
  a: LeaderboardViewRow,
  b: LeaderboardViewRow,
  game?: GameKey,
): number {
  const value = (row: LeaderboardViewRow): number =>
    game !== undefined ? pointsFor(row, game) : (row.total ?? 0);

  return (
    value(b) - value(a) ||
    (b.gamesPlayed ?? 0) - (a.gamesPlayed ?? 0) ||
    (a.workName ?? "").localeCompare(b.workName ?? "")
  );
}

/** Rows that belong on the board at all, in board order. */
export function rankedRows(
  rows: LeaderboardViewRow[],
  game?: GameKey,
): LeaderboardViewRow[] {
  return rows
    .filter((row) =>
      game !== undefined ? playedGame(row, game) : (row.gamesPlayed ?? 0) > 0,
    )
    .sort((a, b) => compareRows(a, b, game));
}

export interface GameScore {
  game: GameKey;
  points: number;
  cap: number;
  played: boolean;
}

export interface PlayerStanding {
  playerId: string;
  scope: LeaderboardScope;
  scores: GameScore[];
  bonus: number;
  total: number;
  maxTotal: number;
  rank: number | null;
  playedAllThree: boolean;
}

export function scoresFromRow(row: LeaderboardViewRow): GameScore[] {
  return [
    {
      game: "spot_the_fraud",
      points: row.spotTheFraud ?? 0,
      cap: GAME_CAPS.spot_the_fraud,
      played: row.playedSpotTheFraud ?? false,
    },
    {
      game: "spoof_the_system",
      points: row.spoofTheSystem ?? 0,
      cap: GAME_CAPS.spoof_the_system,
      played: row.playedSpoofTheSystem ?? false,
    },
    {
      game: "fraud_detective",
      points: row.fraudDetective ?? 0,
      cap: GAME_CAPS.fraud_detective,
      played: row.playedFraudDetective ?? false,
    },
  ];
}

/** An empty standing, so a brand-new player still gets a well-formed response. */
export function emptyStanding(
  playerId: string,
  scope: LeaderboardScope,
): PlayerStanding {
  return {
    playerId,
    scope,
    scores: GAME_KEYS.map((game) => ({
      game,
      points: 0,
      cap: GAME_CAPS[game],
      played: false,
    })),
    bonus: 0,
    total: 0,
    maxTotal: MAX_TOTAL,
    rank: null,
    playedAllThree: false,
  };
}

/**
 * Reads the player's line off the leaderboard view rather than recomputing it,
 * so a standing can never disagree with the board it is shown next to.
 */
export async function computeStanding(
  playerId: string,
  scope: LeaderboardScope,
): Promise<PlayerStanding> {
  // Read the whole board and rank through the shared comparator rather than
  // counting rows ahead with a query: the two must agree exactly, and booth
  // scale is a couple of thousand rows at most.
  const rows = await db.select().from(viewForScope(scope));
  const row = rows.find((candidate) => candidate.playerId === playerId);

  if (!row) return emptyStanding(playerId, scope);

  const total = row.total ?? 0;
  const gamesPlayed = row.gamesPlayed ?? 0;

  // Unplayed visitors are unranked rather than tied last on zero.
  let rank: number | null = null;
  if (gamesPlayed > 0) {
    const index = rankedRows(rows).findIndex(
      (candidate) => candidate.playerId === playerId,
    );
    rank = index >= 0 ? index + 1 : null;
  }

  return {
    playerId,
    scope,
    scores: scoresFromRow(row),
    bonus: row.bonus ?? 0,
    total,
    maxTotal: MAX_TOTAL,
    rank,
    playedAllThree: gamesPlayed === 3,
  };
}

export { FRAUD_FIGHTER_BONUS, GAME_CAPS, MAX_TOTAL, desc };
