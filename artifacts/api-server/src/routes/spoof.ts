import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  ALLOWED_UPLOAD_MIME_TYPES,
  db,
  MAX_UPLOAD_BYTES,
  playersTable,
  spoofUploadsTable,
} from "@workspace/db";
import { DetectSpoofBody, DetectSpoofResponse } from "@workspace/api-zod";

import {
  hashImage,
  runDetector,
  DetectorInputError,
  type DetectorLevel,
} from "../lib/detector";
import { expiryFromNow, hasBlockedTerm, purgeExpiredUploads } from "../lib/uploads";

const router: IRouter = Router();

/** Shown on the reveal so the visitor knows which detector just beat them. */
const DETECTOR_NAMES: Record<DetectorLevel, string> = {
  1: "Detector L1 — Baseline",
  2: "Detector L2 — Hardened",
  3: "Detector L3 — Adversarial",
};

const isAllowedMimeType = (
  value: string,
): value is (typeof ALLOWED_UPLOAD_MIME_TYPES)[number] =>
  (ALLOWED_UPLOAD_MIME_TYPES as readonly string[]).includes(value);

router.post("/spoof/detect", async (req, res): Promise<void> => {
  const parsed = DetectSpoofBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "That upload didn't come through." });
    return;
  }

  const { playerId, image, fileName } = parsed.data;
  const level = Math.round(parsed.data.level) as DetectorLevel;
  const mimeType = parsed.data.mimeType.toLowerCase().trim();

  if (!isAllowedMimeType(mimeType)) {
    res.status(400).json({
      error: "We can only read JPEG or PNG images.",
      field: "mimeType",
    });
    return;
  }

  if (fileName !== undefined && hasBlockedTerm(fileName)) {
    res
      .status(400)
      .json({ error: "That file name isn't allowed here.", field: "fileName" });
    return;
  }

  const bytes = Buffer.from(image, "base64");
  if (bytes.length === 0) {
    res
      .status(400)
      .json({ error: "That image looks empty — try again.", field: "image" });
    return;
  }
  if (bytes.length >= MAX_UPLOAD_BYTES) {
    res
      .status(400)
      .json({ error: "Images need to be under 5 MB.", field: "image" });
    return;
  }

  const [player] = await db
    .select({ id: playersTable.id })
    .from(playersTable)
    .where(eq(playersTable.id, playerId))
    .limit(1);

  if (player === undefined) {
    res.status(400).json({ error: "We couldn't find that player." });
    return;
  }

  let verdict;
  try {
    verdict = await runDetector(bytes, level, mimeType);
  } catch (error) {
    if (error instanceof DetectorInputError) {
      res.status(400).json({ error: error.message, field: "image" });
      return;
    }
    throw error;
  }

  const [upload] = await db
    .insert(spoofUploadsTable)
    .values({
      playerId,
      level,
      mimeType,
      sizeBytes: bytes.length,
      data: bytes.toString("base64"),
      imageHash: hashImage(bytes),
      fooled: verdict.fooled,
      confidence: String(verdict.confidence),
      expiresAt: expiryFromNow(),
    })
    .returning({ id: spoofUploadsTable.id });

  if (upload === undefined) {
    req.log.error({ playerId, level }, "spoof upload insert returned no row");
    res.status(500).json({ error: "We couldn't record that attempt." });
    return;
  }

  // Opportunistic purge keeps the retention promise honest even if the timer
  // missed a window, and it costs nothing on a quiet request.
  void purgeExpiredUploads().catch((err: unknown) => {
    req.log.warn({ err }, "opportunistic upload purge failed");
  });

  res.json(
    DetectSpoofResponse.parse({
      ...verdict,
      level,
      uploadId: upload.id,
      detectorName: DETECTOR_NAMES[level],
    }),
  );
});

export default router;
