import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Small key/value store for host-panel state that outlives a browser session —
 * currently just whether the Six Degrees verification caution was ticked off.
 */
export const appSettingsTable = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<unknown>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const SETTING_SIX_DEGREES_CAUTION_ACK = "six_degrees_caution_ack";

export type AppSetting = typeof appSettingsTable.$inferSelect;
