import { and, isNotNull, isNull, lte } from "drizzle-orm";
import { db, spoofUploadsTable, UPLOAD_RETENTION_HOURS } from "@workspace/db";

import { logger } from "./logger";

/**
 * "Images are deleted within 24 hours" is printed on the upload screen, so it
 * is a DPDP commitment rather than a nice-to-have. The row survives as an audit
 * trail; the bytes do not.
 */
export async function purgeExpiredUploads(): Promise<number> {
  const purged = await db
    .update(spoofUploadsTable)
    .set({ data: null, deletedAt: new Date() })
    .where(
      and(
        lte(spoofUploadsTable.expiresAt, new Date()),
        isNull(spoofUploadsTable.deletedAt),
        isNotNull(spoofUploadsTable.data),
      ),
    )
    .returning({ id: spoofUploadsTable.id });
  return purged.length;
}

export function expiryFromNow(now: Date = new Date()): Date {
  return new Date(now.getTime() + UPLOAD_RETENTION_HOURS * 60 * 60 * 1000);
}

const PURGE_INTERVAL_MS = 15 * 60 * 1000;

/** Runs on a timer as well as opportunistically, so a quiet booth still purges. */
export function startUploadPurge(): NodeJS.Timeout {
  const tick = () => {
    purgeExpiredUploads()
      .then((n) => {
        if (n > 0) logger.info({ purged: n }, "purged expired spoof uploads");
      })
      .catch((err: unknown) => {
        logger.error({ err }, "spoof upload purge failed");
      });
  };
  tick();
  const timer = setInterval(tick, PURGE_INTERVAL_MS);
  timer.unref();
  return timer;
}

/** Blocks the most obvious abuse routed through a filename on a public kiosk. */
const BLOCKED_FILENAME_TERMS = [
  "nigger",
  "nigga",
  "faggot",
  "retard",
  "chink",
  "spic",
  "kike",
  "tranny",
  "rape",
  "childporn",
  "cp0rn",
];

export function hasBlockedTerm(value: string): boolean {
  const normalized = value.toLowerCase().replace(/[^a-z]/g, "");
  return BLOCKED_FILENAME_TERMS.some((term) => normalized.includes(term));
}
