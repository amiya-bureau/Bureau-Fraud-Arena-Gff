import { eq } from "drizzle-orm";
import { db, playersTable, runsTable, type GameKey } from "@workspace/db";

import { currentEventDay } from "./eventDay";

/**
 * Twelve plausible entries so the wall display never looks empty at 9am on day
 * one. They are real rows in `players`/`runs` — the leaderboard is a view, so
 * there is nowhere else to put them — but every row is flagged `is_demo` and
 * the host panel clears the lot in one tap when real traffic starts.
 */
interface DemoPlayer {
  workName: string;
  company: string;
  spotTheFraud?: number;
  spoofTheSystem?: 15 | 40 | 60 | 75;
  fraudDetective?: number;
}

const DEMO_PLAYERS: DemoPlayer[] = [
  { workName: "Ananya Iyer", company: "Razorpay", spotTheFraud: 88, spoofTheSystem: 75, fraudDetective: 74 },
  { workName: "Rohit Malhotra", company: "HDFC Bank", spotTheFraud: 74, spoofTheSystem: 60, fraudDetective: 80 },
  { workName: "Ishita Verma", company: "ICICI Bank", spotTheFraud: 62, spoofTheSystem: 60, fraudDetective: 84 },
  { workName: "Kavya Nair", company: "CRED", spotTheFraud: 66, spoofTheSystem: 40, fraudDetective: 74 },
  { workName: "Arjun Deshpande", company: "Axis Bank", spotTheFraud: 52, spoofTheSystem: 40, fraudDetective: 63 },
  { workName: "Meera Krishnan", company: "PhonePe", spotTheFraud: 80, spoofTheSystem: 15, fraudDetective: 48 },
  { workName: "Sneha Pillai", company: "Zerodha", spotTheFraud: 96, fraudDetective: 90 },
  { workName: "Karthik Reddy", company: "Slice", spoofTheSystem: 75, fraudDetective: 63 },
  { workName: "Vikram Sethi", company: "Paytm", spotTheFraud: 44, spoofTheSystem: 40 },
  { workName: "Nikhil Bhatt", company: "Groww", spoofTheSystem: 15, fraudDetective: 68 },
  { workName: "Divya Menon", company: "Kotak Mahindra Bank", spotTheFraud: 38 },
  { workName: "Aditya Rao", company: "Jupiter", spotTheFraud: 25 },
];

const slug = (name: string): string =>
  name.toLowerCase().replace(/[^a-z]+/g, ".");

/** Obviously-fake addresses, so a demo row can never be mistaken for a lead. */
const demoEmail = (name: string): string => `${slug(name)}@demo.bureau.invalid`;

const demoPhone = (index: number): string =>
  `9${String(800000000 + index * 111111).padStart(9, "0")}`;

function spoofDetail(points: 15 | 40 | 60 | 75) {
  const fools = points === 75 ? 3 : points === 60 ? 2 : points === 40 ? 1 : 0;
  const attempts = [1, 2, 3]
    .slice(0, Math.min(3, fools + 1))
    .map((level) => ({ level, fooled: level <= fools, confidence: level <= fools ? 0.31 : 0.87 }));
  const tier =
    points === 75 ? "Master" : points >= 40 ? "Achiever" : "Participation";
  return {
    attempts,
    ladderReached: fools,
    quitVoluntarily: false,
    drawPool: fools === 3 ? "ipad" : fools === 2 ? "airpods" : null,
    tier,
  };
}

function detailFor(game: GameKey, points: number): Record<string, unknown> {
  if (game === "spoof_the_system") {
    return spoofDetail(points as 15 | 40 | 60 | 75);
  }
  if (game === "fraud_detective") {
    const caseCount = Math.floor(points / 16);
    return {
      cases: Array.from({ length: caseCount }, (_, i) => ({
        id: `FD-0${i + 1}`,
        points: 16,
        wrongGuesses: 0,
        revealed: false,
      })),
      casePoints: caseCount * 16,
      bonusPoints: points - caseCount * 16,
      tier: points >= 80 ? "Master" : points >= 40 ? "Achiever" : "Participation",
      demo: true,
    };
  }
  return {
    levelReached: Math.max(1, Math.round(points / 10)),
    tier: points >= 90 ? "Master" : points >= 45 ? "Achiever" : "Participation",
    demo: true,
  };
}

export interface SeedResult {
  players: number;
  runs: number;
}

export async function seedDemoRows(): Promise<SeedResult> {
  const eventDay = currentEventDay();
  let players = 0;
  let runs = 0;

  for (const [index, demo] of DEMO_PLAYERS.entries()) {
    const email = demoEmail(demo.workName);

    const [inserted] = await db
      .insert(playersTable)
      .values({
        workName: demo.workName,
        email,
        phone: demoPhone(index),
        company: demo.company,
        consentAt: new Date(),
        isDemo: true,
      })
      .onConflictDoNothing({ target: playersTable.email })
      .returning({ id: playersTable.id });

    let playerId = inserted?.id;
    if (playerId === undefined) {
      const [existing] = await db
        .select({ id: playersTable.id })
        .from(playersTable)
        .where(eq(playersTable.email, email));
      if (existing === undefined) continue;
      playerId = existing.id;
    } else {
      players += 1;
    }

    const scores: [GameKey, number | undefined][] = [
      ["spot_the_fraud", demo.spotTheFraud],
      ["spoof_the_system", demo.spoofTheSystem],
      ["fraud_detective", demo.fraudDetective],
    ];

    for (const [game, points] of scores) {
      if (points === undefined) continue;
      const result = await db
        .insert(runsTable)
        .values({
          playerId,
          game,
          points,
          detail: detailFor(game, points),
          // Half of them arrive "from a phone" so the kiosk-vs-phone split in
          // the host panel is not a flat zero before real traffic.
          source: index % 2 === 0 ? "kiosk" : "phone",
          eventDay,
          idempotencyKey: `demo-${slug(demo.workName)}-${game}-${eventDay}`,
          isDemo: true,
        })
        .onConflictDoNothing({ target: runsTable.idempotencyKey })
        .returning({ id: runsTable.id });
      if (result.length > 0) runs += 1;
    }
  }

  return { players, runs };
}

/** Cascades to their runs, so nothing demo-flagged survives in the view. */
export async function clearDemoRows(): Promise<number> {
  const deleted = await db
    .delete(playersTable)
    .where(eq(playersTable.isDemo, true))
    .returning({ id: playersTable.id });
  return deleted.length;
}
