import { createHash, timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "express";

/**
 * Not real auth — just enough that a curious visitor wandering the booth cannot
 * reach the host panel from the attract loop. The passcode lives in an env var
 * so it can be rotated between event days without a redeploy of the client.
 */
export function configuredPasscode(): string | null {
  const value = process.env.ADMIN_PASSCODE;
  return value !== undefined && value.length > 0 ? value : null;
}

function constantTimeEquals(a: string, b: string): boolean {
  // Hashing first keeps the comparison constant-time across differing lengths.
  const left = createHash("sha256").update(a).digest();
  const right = createHash("sha256").update(b).digest();
  return timingSafeEqual(left, right);
}

export const requireAdmin: RequestHandler = (req, res, next) => {
  const expected = configuredPasscode();
  if (expected === null) {
    res.status(503).json({
      error:
        "The host panel is not configured — ADMIN_PASSCODE is unset on the server.",
    });
    return;
  }

  const supplied = req.header("x-admin-passcode") ?? "";
  if (!constantTimeEquals(supplied, expected)) {
    res.status(401).json({ error: "Incorrect passcode.", field: "passcode" });
    return;
  }

  next();
};
