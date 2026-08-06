---
name: Drizzle view changes need a manual DROP
description: drizzle-kit push does not replace an existing Postgres view, so edits to a view's column list never reach the database.
---

# `drizzle-kit push` does not update an existing view

When you change the column list or body of a view defined in the Drizzle schema, `push` reports
`[✓] Changes applied` **without touching the view**. The database keeps the old definition.

**Why this is nasty:** the ORM's generated `SELECT` now names columns that do not exist on the live
view, so every read against it fails at runtime with a `Failed query: select "…" from "…"` error
listing the *new* columns. Nothing fails at push time and nothing fails at compile time — the app
typechecks, boots, and then 500s on the first request that reads the view.

**How to apply:** after any edit to a view's shape, drop it explicitly and then push:

```sql
DROP VIEW IF EXISTS <view_name>;
```

Then re-run the workspace's db push. Confirm the new columns really exist by querying
`information_schema.columns` for the view, not by trusting the push output. Drop dependent views
first if one view selects from another.
