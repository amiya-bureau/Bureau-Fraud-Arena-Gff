// Export your models here. Add one export per file.
//
// Bureau Fraud Arena — booth games hub for Global Fintech Fest 2026.
//
// Two real tables carry the game data: `players` (identity, keyed on the
// lowercased work email) and `runs` (append-only, one row per completed play).
// Everything a leaderboard needs is derived from `runs` by the views in
// ./leaderboard — no aggregated score is ever written to a row.

export * from "./players";
export * from "./runs";
export * from "./spoofUploads";
export * from "./appSettings";
export * from "./leaderboard";
