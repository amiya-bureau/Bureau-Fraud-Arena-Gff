---
name: Moving an artifact off the site root
description: What silently breaks when a web artifact's previewPath changes from "/" to a prefix, and how to verify the move.
---

# Moving an artifact between "/" and a path prefix

Changing `previewPath` in `artifact.toml` re-routes the proxy but fixes nothing
inside the app. Three separate layers each have to agree with the new prefix,
and each fails **silently and differently**:

1. **Vite `base`** — must come from the `BASE_PATH` env var. If the config
   ignores it, the served HTML still requests `/@vite/client` and
   `/src/main.tsx`. The proxy hands those to whichever artifact owns `/`, so
   the browser loads a *different app's* modules while `curl` of the same URL
   returns the correct HTML. Symptom: curl looks right, the browser shows the
   other app.
2. **Client router base** — wouter/react-router need
   `base={import.meta.env.BASE_URL.replace(/\/$/, "")}` or every route falls
   through to the 404 page while assets load fine.
3. **Root-absolute asset paths in source** (`src="/foo.png"`,
   `bg-[url('/foo.png')]`, string values in data objects). These resolve
   against the site root regardless of `base`. Figma/design exports are full of
   them.

**Why:** the workspace proxy routes purely by path prefix, so any root-relative
URL escapes the artifact and hits whatever owns `/`. Nothing errors — it just
serves the wrong thing.

**How to apply:** after any `previewPath` change, verify in this order — fetch
the HTML and confirm module/asset URLs carry the prefix; screenshot the page
(curl alone will not catch layer 1); then check a deep route and one image.

For a large export with the layer-3 problem in many files and several syntactic
forms, a small `enforce: "pre"` Vite plugin doing a literal string substitution
of the prefix beats editing every call site, and survives a re-export.

**Also:** these Vite configs intentionally *throw* when `PORT`/`BASE_PATH` are
missing rather than defaulting. A default would emit a production bundle
pointing at the wrong root. Consequence: a bare `pnpm --filter <pkg> run build`
from a shell fails; supply both vars to reproduce a production build by hand.
