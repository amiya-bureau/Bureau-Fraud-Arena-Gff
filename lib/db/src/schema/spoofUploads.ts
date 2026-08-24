import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

import { playersTable } from "./players";

/** DPDP commitment surfaced to the visitor: uploads live for 24 hours, then go. */
export const UPLOAD_RETENTION_HOURS = 24;

/** Rejected at or above this size, before anything is written. */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const ALLOWED_UPLOAD_MIME_TYPES = [
  "image/jpeg",
  "image/png",
] as const;

/**
 * An image a visitor submitted to Spoof the System. Bytes are held so the host
 * can honour an on-the-spot "delete my photo" request and so the automatic
 * 24-hour purge has something real to remove.
 */
export const spoofUploadsTable = pgTable("spoof_uploads", {
  id: uuid("id").primaryKey().defaultRandom(),
  playerId: uuid("player_id")
    .notNull()
    .references(() => playersTable.id, { onDelete: "cascade" }),
  level: integer("level").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  /** Base64-encoded image bytes. Removed by the purge or by a host action. */
  data: text("data"),
  /** Stable hash of the bytes — the detector stub is deterministic from this. */
  imageHash: text("image_hash").notNull(),
  fooled: boolean("fooled").notNull(),
  confidence: text("confidence"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export type SpoofUploadRow = typeof spoofUploadsTable.$inferSelect;

export const uploadMimeTypeSchema = z.enum(ALLOWED_UPLOAD_MIME_TYPES);
