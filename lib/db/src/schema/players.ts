import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * A booth visitor. The lowercased work email is the identity key, so a visitor
 * who plays one game on a kiosk and another on their phone merges onto a single
 * row instead of appearing twice on the leaderboard.
 */
export const playersTable = pgTable("players", {
  id: uuid("id").primaryKey().defaultRandom(),
  workName: text("work_name").notNull(),
  /** Always stored lowercased. Unique — this is the identity key. */
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  company: text("company").notNull(),
  /**
   * Set when the visitor used the "I don't have a work email" override on the
   * entry form. Flags the row for sales triage rather than blocking entry.
   */
  noWorkEmail: boolean("no_work_email").notNull().default(false),
  /** DPDP consent timestamp. Never null — nothing submits until the box is ticked. */
  consentAt: timestamp("consent_at", { withTimezone: true }).notNull(),
  /** Seeded demo rows, so the host can clear them in one tap before doors open. */
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertPlayerSchema = createInsertSchema(playersTable).omit({
  id: true,
  createdAt: true,
});
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof playersTable.$inferSelect;
