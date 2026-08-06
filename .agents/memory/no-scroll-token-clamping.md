---
name: Converting a desktop-scaled app to a fixed no-scroll phone shell
description: The token-level tactic that avoids editing every call site, and the layout rules that make "must fit one screen" actually hold.
---

# Making an existing app fit one phone screen without scrolling

**Absorb the scale change in the design tokens, not the call sites.** Convert
every `--text-*` and `--spacing-*` token to `clamp(min, Xcqi, max)` where the
max is the existing desktop value. The whole codebase becomes phone-appropriate
without touching the components that consume the tokens.

**Why:** a "make it fit a phone" request otherwise turns into an edit of every
padding and font-size in the app, which is both enormous and easy to get
inconsistent. The tokens are the one place the scale is defined.

**How to apply:**
- Use `cqi`, not `vw`, when the app renders inside a fixed-width column (a
  centred phone frame on desktop). Viewport units resolve against the browser
  window, so they pick the desktop maximum inside a narrow column — which
  misbehaves precisely in preview and screenshots, where the work gets judged.
  Declare `container-type: inline-size` on the shell. Outside a container
  `cqi` falls back to the viewport, which is the same number on real hardware.
- **Fixed-px line heights must be converted** to unitless or percentage values
  at the same time. A 60px line height under a clamped 32px headline leaves a
  visible hole.
- Any new font-size token must also be registered wherever `tailwind-merge` is
  extended, or it gets treated as a colour. See the tailwind-merge note.

## Layout rules that make the no-scroll guarantee hold

- A screen is `flex flex-col` inside a `100dvh` shell with `overflow: hidden`.
  Absorbing regions need `flex-1` **and** `min-h-0` — `flex-1` alone will not
  shrink below content size, and the overflow silently escapes the shell.
- Never `h-screen` on an inner element inside such a shell.
- Lists that must not scroll should share the leftover height
  (`flex-1 basis-0` with a `min-h-[44px]` floor) rather than stacking to fixed
  row heights.
- Make a bottom tab bar **opt-in** per screen rather than default-on. A screen
  that forgets the prop then renders full-height instead of silently losing the
  tab bar's height mid-game.
- Verify by screenshot at the smallest target size, not by reading the DOM.
  Automated geometry checks report false overlaps when nodes are wrapped in
  padded hit areas, and they miss text that is present but invisible.
