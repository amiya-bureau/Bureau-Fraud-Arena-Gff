/**
 * Seed the quiz_questions and detective_cases tables from the frontend's
 * static data files, if those tables are empty.
 *
 * This runs once at server startup (see index.ts). Adding questions to the
 * static files and restarting the server is enough to get them into the DB.
 * New questions added directly to the DB do not need a code change.
 */
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { logger } from "./logger";

// We import the raw data from the arena's data files. These live in the
// frontend package but contain no browser-only code, so the import is safe.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — cross-package import at runtime; types are fine for our use
import { QUESTIONS as SPOT_QUESTIONS } from "../../fraud-arena/src/data/quiz";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { CASES as DETECTIVE_CASES } from "../../fraud-arena/src/data/detective";

export async function seedQuestionsIfEmpty(): Promise<void> {
  try {
    const [[qCount], [cCount]] = await Promise.all([
      db.execute(sql`SELECT COUNT(*) AS n FROM quiz_questions`).then(r => r.rows),
      db.execute(sql`SELECT COUNT(*) AS n FROM detective_cases`).then(r => r.rows),
    ]);

    if (Number((qCount as any).n) === 0 && Array.isArray(SPOT_QUESTIONS) && SPOT_QUESTIONS.length > 0) {
      logger.info({ count: SPOT_QUESTIONS.length }, "Seeding quiz_questions from static data");
      for (const q of SPOT_QUESTIONS as any[]) {
        await db.execute(sql`
          INSERT INTO quiz_questions (id, level, scope, kind, select_n, stem, options, correct, why, hook, active)
          VALUES (
            ${q.id}, ${q.level}, ${q.scope}, ${q.kind}, ${q.selectN},
            ${q.stem}, ${JSON.stringify(q.options)}, ${JSON.stringify(q.correct)},
            ${q.why}, ${q.hook}, 1
          )
          ON CONFLICT (id) DO NOTHING
        `);
      }
      logger.info("quiz_questions seeded");
    }

    if (Number((cCount as any).n) === 0 && Array.isArray(DETECTIVE_CASES) && DETECTIVE_CASES.length > 0) {
      logger.info({ count: DETECTIVE_CASES.length }, "Seeding detective_cases from static data");
      for (const c of DETECTIVE_CASES as any[]) {
        await db.execute(sql`
          INSERT INTO detective_cases (
            id, "order", sector, title, clues, brief, instruction,
            nodes, clusters, edges, edge_labels, node_labels,
            answer, explanation, hook, active
          ) VALUES (
            ${c.id}, ${c.order}, ${c.sector}, ${c.title},
            ${JSON.stringify(c.clues)}, ${c.brief}, ${c.instruction},
            ${JSON.stringify(c.nodes)}, ${JSON.stringify(c.clusters)},
            ${JSON.stringify(c.edges)},
            ${c.edgeLabels ? JSON.stringify(c.edgeLabels) : null},
            ${c.nodeLabels ? JSON.stringify(c.nodeLabels) : null},
            ${JSON.stringify(c.answer)}, ${c.explanation}, ${c.hook}, 1
          )
          ON CONFLICT (id) DO NOTHING
        `);
      }
      logger.info("detective_cases seeded");
    }
  } catch (err) {
    // Non-fatal: static data is the fallback if the DB is missing
    logger.warn({ err }, "seedQuestionsIfEmpty: failed (tables may not exist yet)");
  }
}
