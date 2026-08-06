import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Question kind — matches the Kind type in the arena's data/quiz.ts.
 * 'text' is a standard MCQ; 'image' is a "spot the fake" grid.
 */
export const questionKindEnum = pgEnum("question_kind", ["text", "image"]);

/**
 * Spot the Fraud quiz questions, sourced from Bureau's fraud-awareness content.
 *
 * The arena picks one question per level at random for each play, so both the
 * seeded defaults and any future additions automatically rotate in — no code
 * change needed to extend the question bank.
 *
 * Schema mirrors the Question interface in data/quiz.ts so the frontend can
 * consume either source without conversion.
 */
export const quizQuestionsTable = pgTable("quiz_questions", {
  id: text("id").primaryKey(), // e.g. "SF-A-L01-01"
  level: integer("level").notNull(), // 1–10, maps to LEVELS array index
  scope: text("scope").notNull(), // content tag for host analytics
  kind: questionKindEnum("kind").notNull(),
  selectN: integer("select_n").notNull(), // how many correct options must be chosen
  stem: text("stem").notNull(),
  options: jsonb("options").$type<string[]>().notNull(), // ordered list of option texts
  correct: jsonb("correct").$type<number[]>().notNull(), // 1-based indices of correct options
  why: text("why").notNull(), // explanation shown after answer
  hook: text("hook").notNull(), // one-line content tag for hosts
  active: integer("active").notNull().default(1), // 0 = disabled, 1 = active
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertQuizQuestionSchema = createInsertSchema(quizQuestionsTable).omit({
  createdAt: true,
});
export type InsertQuizQuestion = z.infer<typeof insertQuizQuestionSchema>;
export type QuizQuestion = typeof quizQuestionsTable.$inferSelect;

// ---------------------------------------------------------------------------

/**
 * Fraud Detective cases — graph puzzles where the player identifies a suspect
 * account in a transaction network.
 *
 * The arena picks 5 cases at random for each play. The graph structure is
 * stored as JSON so the frontend can render it with d3-force directly.
 */
export const detectiveCasesTable = pgTable("detective_cases", {
  id: text("id").primaryKey(), // e.g. "FD-01"
  order: integer("order").notNull(), // original ordering hint (used for fallback sort)
  sector: text("sector").notNull(), // display label in the app bar
  title: text("title").notNull(),
  clues: jsonb("clues").$type<string[]>().notNull(), // 3 investigator clues
  brief: text("brief").notNull(), // scenario paragraph
  instruction: text("instruction").notNull(), // "Tap the account you believe X"
  nodes: jsonb("nodes").$type<string[]>().notNull(), // all node IDs
  clusters: jsonb("clusters").$type<Record<string, string[]>>().notNull(),
  edges: jsonb("edges").$type<[string, string][]>().notNull(),
  edgeLabels: jsonb("edge_labels").$type<Record<string, string>>(),
  nodeLabels: jsonb("node_labels").$type<Record<string, string>>(),
  answer: jsonb("answer").$type<string[]>().notNull(), // correct node ID(s)
  explanation: text("explanation").notNull(),
  hook: text("hook").notNull(),
  active: integer("active").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertDetectiveCaseSchema = createInsertSchema(detectiveCasesTable).omit({
  createdAt: true,
});
export type InsertDetectiveCase = z.infer<typeof insertDetectiveCaseSchema>;
export type DetectiveCase = typeof detectiveCasesTable.$inferSelect;
