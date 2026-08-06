# Memory Index

- [OpenAPI codegen constraints](openapi-codegen-constraints.md) — `type: integer` and duplicate path+query param names both break Orval codegen in this repo; avoid both.
- [Drizzle views need manual drops](drizzle-view-push.md) — `drizzle-kit push` silently leaves an existing view unchanged, so column changes never land.
- [Moving an artifact off "/"](artifact-path-moves.md) — vite base, router base and root-absolute asset paths each break silently; curl passes while the browser loads the wrong app.
- [tailwind-merge vs custom --text-* tokens](tailwind-merge-custom-text-tokens.md) — custom font-size names evict text colours through cn(), giving white-on-white buttons that typecheck and grep clean.
- [Fitting force graphs on phones](force-graph-phone-fit.md) — scale the SVG viewBox, not the node positions; compressing positions packs fixed-size node boxes into each other.
- [Fitting a whole app to one screen](no-scroll-token-clamping.md) — clamp the type and spacing tokens in cqi and the existing call sites become phone-sized for free.
