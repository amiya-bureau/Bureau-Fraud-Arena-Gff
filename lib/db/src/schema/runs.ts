import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { playersTable } from "./players";

export const gameEnum = pgEnum("game", [
  "spot_the_fraud",
  "spoof_the_system",
  "fraud_detective",
]);

export const runSourceEnum = pgEnum("run_source", ["kiosk", "phone"]);

/** Hard per-game ceilings. Points are clamped to these on write. */
export const GAME_CAPS = {
  spot_the_fraud: 100,
  spoof_the_system: 75,
  fraud_detective: 100,
} as const;

/** Awarded for playing all three games. Derived on read, never stored. */
export const FRAUD_FIGHTER_BONUS = 40;

export const MAX_TOTAL =
  GAME_CAPS.spot_the_fraud +
  GAME_CAPS.spoof_the_system +
  GAME_CAPS.fraud_detective +
  FRAUD_FIGHTER_BONUS;

export type GameKey = keyof typeof GAME_CAPS;

/**
 * One completed play of one game. Runs are append-only: a player's score for a
 * game is the best single run, so a weaker replay is recorded but never lowers
 * a standing. Nothing aggregated is ever stored here.
 */
export const runsTable = pgTable(
  "runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    playerId: uuid("player_id")
      .notNull()
      .references(() => playersTable.id, { onDelete: "cascade" }),
    game: gameEnum("game").notNull(),
    points: integer("points").notNull(),
    /** Per-game breakdown: level outcomes, lifelines used, per-case guesses. */
    detail: jsonb("detail").$type<Record<string, unknown>>(),
    source: runSourceEnum("source").notNull(),
    /** Calendar day in Asia/Kolkata, computed server-side at write time. */
    eventDay: date("event_day", { mode: "string" }).notNull(),
    /** Client-generated per run. Makes submission safe to retry. */
    idempotencyKey: text("idempotency_key").notNull(),
    /** Set when a host voids a run so a visitor can replay after a failure. */
    voidedAt: timestamp("voided_at", { withTimezone: true }),
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("runs_idempotency_key_idx").on(table.idempotencyKey),
    index("runs_player_game_idx").on(table.playerId, table.game),
    index("runs_event_day_idx").on(table.eventDay),
  ],
);

export const insertRunSchema = createInsertSchema(runsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertRun = z.infer<typeof insertRunSchema>;
export type Run = typeof runsTable.$inferSelect;

/**
 * In-flight run state, keyed by the same idempotency key the finished run will
 * use. Lets a kiosk browser reload resume mid-run instead of losing it.
 */
export const runProgressTable = pgTable("run_progress", {
  idempotencyKey: text("idempotency_key").primaryKey(),
  playerId: uuid("player_id")
    .notNull()
    .references(() => playersTable.id, { onDelete: "cascade" }),
  game: gameEnum("game").notNull(),
  state: jsonb("state").$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type RunProgressRow = typeof runProgressTable.$inferSelect;

/** The current event day in Asia/Kolkata, as evaluated by Postgres. */
export const eventDaySql = sql<string>`(now() AT TIME ZONE 'Asia/Kolkata')::date`;
