import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, playersTable } from "@workspace/db";
import {
  GetPlayerStandingParams,
  GetPlayerStandingResponse,
  RegisterPlayerBody,
  RegisterPlayerResponse,
} from "@workspace/api-zod";

import { firstNameOf, validateEntry } from "../lib/entryValidation";
import { computeStanding, type LeaderboardScope } from "../lib/standing";

const router: IRouter = Router();

type PlayerRow = typeof playersTable.$inferSelect;

// Registration is an open endpoint and doubles as "recognise a returning
// visitor", so anyone can post a guessed work email and read the response.
// It therefore must never echo back anything stored about that person beyond
// what the leaderboard already shows in public: first name and company.
// Full name, email and phone stay behind the host passcode in AdminLead.
function toPlayerDto(player: PlayerRow) {
  return {
    id: player.id,
    firstName: firstNameOf(player.workName),
    company: player.company,
    noWorkEmail: player.noWorkEmail,
    isDemo: player.isDemo,
    consentAt: player.consentAt,
    createdAt: player.createdAt,
  };
}

router.post("/players", async (req, res): Promise<void> => {
  const parsed = RegisterPlayerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please fill in every field." });
    return;
  }

  const checked = validateEntry(parsed.data);
  if (!checked.ok) {
    res
      .status(400)
      .json({ error: checked.error.message, field: checked.error.field });
    return;
  }

  const entry = checked.value;

  // Insert-or-recognise in one round trip. Two kiosks submitting the same email
  // at once both end up on the existing row instead of one of them erroring.
  const [inserted] = await db
    .insert(playersTable)
    .values({
      workName: entry.workName,
      email: entry.email,
      phone: entry.phone,
      company: entry.company,
      noWorkEmail: entry.noWorkEmail,
      consentAt: new Date(),
    })
    .onConflictDoNothing({ target: playersTable.email })
    .returning();

  let player = inserted;
  const returning = player === undefined;

  if (player === undefined) {
    const [existing] = await db
      .select()
      .from(playersTable)
      .where(eq(playersTable.email, entry.email))
      .limit(1);
    if (existing === undefined) {
      req.log.error({ email: entry.email }, "player upsert found no row");
      res.status(500).json({ error: "Could not save your details." });
      return;
    }
    player = existing;
  }

  const standing = await computeStanding(player.id, "cumulative");

  res.json(
    RegisterPlayerResponse.parse({
      player: toPlayerDto(player),
      returning,
      standing,
    }),
  );
});

router.get(
  "/players/:playerId/standing/:scope",
  async (req, res): Promise<void> => {
    const parsed = GetPlayerStandingParams.safeParse(req.params);
    if (!parsed.success) {
      res.status(400).json({ error: "Unknown leaderboard scope." });
      return;
    }

    const { playerId, scope } = parsed.data;

    const [player] = await db
      .select({ id: playersTable.id })
      .from(playersTable)
      .where(eq(playersTable.id, playerId))
      .limit(1);

    if (player === undefined) {
      res.status(404).json({ error: "We couldn't find that player." });
      return;
    }

    const standing = await computeStanding(
      playerId,
      scope as LeaderboardScope,
    );
    res.json(GetPlayerStandingResponse.parse(standing));
  },
);

export default router;
