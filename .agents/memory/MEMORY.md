# Memory Index

- [OpenAPI codegen constraints](openapi-codegen-constraints.md) — `type: integer` and duplicate path+query param names both break Orval codegen in this repo; avoid both.
- [Drizzle views need manual drops](drizzle-view-push.md) — `drizzle-kit push` silently leaves an existing view unchanged, so column changes never land.
- [Moving an artifact off "/"](artifact-path-moves.md) — vite base, router base and root-absolute asset paths each break silently; curl passes while the browser loads the wrong app.
