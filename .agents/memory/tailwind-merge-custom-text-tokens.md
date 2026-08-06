---
name: tailwind-merge vs custom --text-* tokens
description: Custom font-size names silently evict text colours through cn(), rendering white-on-white CTAs. Register them with extendTailwindMerge.
---

# Custom `--text-*` font sizes silently delete text colours

When a Tailwind v4 theme defines font sizes under custom names (`--text-card-title`,
`--text-display-md`, `--text-body-sm`, …), tailwind-merge cannot tell whether
`text-card-title` sets a size or a colour. It defaults to treating an unrecognised
`text-<name>` as a **colour**, so it files `text-card-title` and `text-russian` in the
same class group and keeps only the last one.

Anything routed through `cn()` loses the colour: the element then inherits its parent's
colour. A white-filled button on a dark page inherits white and becomes an unreadable
white-on-white rectangle — the label is present in the DOM and the generated CSS rule
for the colour exists, so nothing looks wrong when grepping either one.

The fix is to name the font-size tokens explicitly:

```ts
const twMerge = extendTailwindMerge({
  extend: { classGroups: { "font-size": [{ text: ["card-title", "display-md", /* … */] }] } },
})
```

**Why:** this is invisible to typecheck, to a CSS grep, and to a build. It only shows up
as a blank control in a screenshot, and a reviewer scanning code will confirm both the
utility class and the CSS rule exist and conclude it is fine.

**How to apply:** whenever a theme adds font sizes under non-standard names, extend
tailwind-merge in the same change. Suspect this immediately if a control renders as a
solid block with no visible label, or if text disappears only in components built with
`cva`/`cn` while the same classes work in a plain `className` string. New font-size
tokens must be added to that list or they reintroduce the bug.
