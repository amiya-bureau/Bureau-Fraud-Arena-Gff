/**
 * The event runs in Mumbai, so "today" is always the Asia/Kolkata calendar day
 * regardless of where the server happens to be. Runs are stamped with this at
 * write time and the today-leaderboard view filters on the same expression.
 */
export function currentEventDay(now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD, which is exactly what a Postgres `date` wants.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
