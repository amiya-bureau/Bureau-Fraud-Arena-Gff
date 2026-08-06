---
name: OpenAPI codegen constraints
description: Two schema shapes in lib/api-spec/openapi.yaml that silently break Orval codegen or produce uncompilable output.
---

# Two things to never put in `openapi.yaml`

## 1. Never use `type: integer`

Use `type: number` and enforce integer semantics server-side.

**Why:** the installed Orval emits `zod.int()` for `type: integer`, which is a **zod v4** API. The
workspace catalog pins zod to v3, where `.int()` exists only as a method on `z.number()`, not as a
standalone `z.int()`. Codegen "succeeds" and then `lib/api-zod` fails to compile with a confusing
error pointing at generated code rather than at the spec.

**How to apply:** any time you add a count, a score, a limit, or an ID that feels integral. Declare
it `type: number` in the spec, and validate integrality in the route handler where you can return a
proper 400.

## 2. Never reuse a parameter name across path and query on the same operation

If an operation has a path parameter and a query parameter with the same name, Orval generates two
colliding exports and TypeScript fails with **TS2308** ("module has already exported a member named
X").

**Why:** the generated model file re-exports both parameter types under the same identifier.

**How to apply:** when a resource is addressed by something that also appears as a filter, promote
one of them to a path segment with a distinct role, or rename the query parameter. In this repo the
leaderboard `scope` had to become a path segment for exactly this reason.
