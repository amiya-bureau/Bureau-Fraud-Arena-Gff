import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
// Keep the API fallback aligned with the reviewed client-side lifeline bank.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — this shared static bank contains no browser-only code
import { LIFELINE_QUESTIONS } from "../../../fraud-arena/src/data/lifeline";

const router: IRouter = Router();

function randomLifelineQuestion() {
  return LIFELINE_QUESTIONS[Math.floor(Math.random() * LIFELINE_QUESTIONS.length)];
}

/**
 * Game pack for Spot the Fraud.
 *
 * Returns one randomly-selected active question per level (1–10), so the
 * client has everything it needs for a full play without any per-question
 * round-trips. Answers are included — the game validates client-side, matching
 * the existing pattern in the arena.
 *
 * The random selection happens in Postgres (ORDER BY RANDOM() LIMIT 1 per
 * level), not in Node, so the distribution is even across the question bank.
 */
router.get("/quiz/game-pack", async (req, res): Promise<void> => {
  try {
    // One random active question per level, levels 1–10.
    const rows = await db.execute(sql`
      SELECT DISTINCT ON (level)
        id, level, scope, kind, select_n AS "selectN",
        stem, options, correct, why, hook
      FROM quiz_questions
      WHERE active = 1
      ORDER BY level, RANDOM()
    `);

    if (!rows.rows.length) {
      res.status(503).json({ error: "Question bank is empty." });
      return;
    }

    // Group into an array ordered by level
    const byLevel = Array.from({ length: 10 }, (_, i) => {
      const row = rows.rows.find((r: any) => r.level === i + 1);
      return row ?? null;
    }).filter(Boolean);

    res.json({ questions: byLevel });
  } catch (err) {
    req.log.error(err, "quiz/game-pack failed");
    res.status(500).json({ error: "Could not load questions." });
  }
});

/**
 * Case pack for Fraud Detective.
 *
 * Returns 5 randomly-selected active cases. The client shuffles them into its
 * own play order, so a second play will likely draw different cases.
 */
router.get("/detective/case-pack", async (req, res): Promise<void> => {
  try {
    const rows = await db.execute(sql`
      SELECT
        id, "order", sector, title, clues, brief, instruction,
        nodes, clusters, edges, edge_labels AS "edgeLabels",
        node_labels AS "nodeLabels", answer, explanation, hook
      FROM detective_cases
      WHERE active = 1
      ORDER BY RANDOM()
      LIMIT 5
    `);

    if (!rows.rows.length) {
      res.status(503).json({ error: "Case bank is empty." });
      return;
    }

    res.json({ cases: rows.rows });
  } catch (err) {
    req.log.error(err, "detective/case-pack failed");
    res.status(500).json({ error: "Could not load cases." });
  }
});

/**
 * Lifeline question — one random active question from the lifeline bank.
 *
 * The reviewed static bank is used when the optional database bank is empty,
 * so callers receive a valid question instead of an avoidable 503.
 */
router.get("/lifeline/question", async (req, res): Promise<void> => {
  try {
    const rows = await db.execute(sql`
      SELECT id, type, stem, options, correct_index AS "correctIndex"
      FROM lifeline_questions
      WHERE active = 1
      ORDER BY RANDOM()
      LIMIT 1
    `);

    if (!rows.rows.length) {
      req.log.warn("lifeline_questions is empty; serving the reviewed static bank");
      res.json(randomLifelineQuestion());
      return;
    }

    res.json(rows.rows[0]);
  } catch (err) {
    req.log.warn({ err }, "lifeline/question database lookup failed; serving the reviewed static bank");
    res.json(randomLifelineQuestion());
  }
});

export default router;
