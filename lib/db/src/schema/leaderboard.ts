import { sql } from "drizzle-orm";
import { boolean, integer, pgView, text, uuid } from "drizzle-orm/pg-core";

/**
 * The leaderboard is derived, never stored.
 *
 * A player's score for a game is their BEST SINGLE RUN, not their latest and
 * not the sum of their runs — so replaying can only ever help. Voided runs
 * (host-granted goodwill re-runs) drop out. The 40-point Fraud Fighter bonus
 * for playing all three games is computed here rather than written to a row,
 * which is why there is no aggregate table anywhere in this schema.
 *
 * Two views, one per scope:
 *  - `leaderboard_today`      — runs from the current Asia/Kolkata calendar day
 *  - `leaderboard_cumulative` — best run per game across the whole event
 *
 * Cumulative is the best run per game over all days rather than the sum of
 * daily bests, which keeps the ceiling at 315 no matter how many days a
 * visitor comes back.
 */
const leaderboardColumns = {
  playerId: uuid("player_id"),
  workName: text("work_name"),
  company: text("company"),
  isDemo: boolean("is_demo"),
  spotTheFraud: integer("spot_the_fraud"),
  spoofTheSystem: integer("spoof_the_system"),
  fraudDetective: integer("fraud_detective"),
  /**
   * Played-flags matter separately from points: a run can legitimately score
   * zero, so "did they play this game" cannot be inferred from the score.
   */
  playedSpotTheFraud: boolean("played_spot_the_fraud"),
  playedSpoofTheSystem: boolean("played_spoof_the_system"),
  playedFraudDetective: boolean("played_fraud_detective"),
  gamesPlayed: integer("games_played"),
  bonus: integer("bonus"),
  total: integer("total"),
};

const selectBody = (dayFilter: string) => sql.raw(`
  SELECT
    p.id AS player_id,
    p.work_name AS work_name,
    p.company AS company,
    p.is_demo AS is_demo,
    COALESCE(MAX(r.points) FILTER (WHERE r.game = 'spot_the_fraud'), 0)::int AS spot_the_fraud,
    COALESCE(MAX(r.points) FILTER (WHERE r.game = 'spoof_the_system'), 0)::int AS spoof_the_system,
    COALESCE(MAX(r.points) FILTER (WHERE r.game = 'fraud_detective'), 0)::int AS fraud_detective,
    (COUNT(*) FILTER (WHERE r.game = 'spot_the_fraud') > 0) AS played_spot_the_fraud,
    (COUNT(*) FILTER (WHERE r.game = 'spoof_the_system') > 0) AS played_spoof_the_system,
    (COUNT(*) FILTER (WHERE r.game = 'fraud_detective') > 0) AS played_fraud_detective,
    COUNT(DISTINCT r.game)::int AS games_played,
    (CASE WHEN COUNT(DISTINCT r.game) = 3 THEN 40 ELSE 0 END)::int AS bonus,
    (
      COALESCE(MAX(r.points) FILTER (WHERE r.game = 'spot_the_fraud'), 0)
      + COALESCE(MAX(r.points) FILTER (WHERE r.game = 'spoof_the_system'), 0)
      + COALESCE(MAX(r.points) FILTER (WHERE r.game = 'fraud_detective'), 0)
      + CASE WHEN COUNT(DISTINCT r.game) = 3 THEN 40 ELSE 0 END
    )::int AS total
  FROM players p
  LEFT JOIN runs r
    ON r.player_id = p.id
   AND r.voided_at IS NULL
   ${dayFilter}
  GROUP BY p.id, p.work_name, p.company, p.is_demo
`);

export const leaderboardTodayView = pgView(
  "leaderboard_today",
  leaderboardColumns,
).as(selectBody("AND r.event_day = (now() AT TIME ZONE 'Asia/Kolkata')::date"));

export const leaderboardCumulativeView = pgView(
  "leaderboard_cumulative",
  leaderboardColumns,
).as(selectBody(""));

export type LeaderboardViewRow =
  typeof leaderboardCumulativeView.$inferSelect;
