import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * The editorial type scale from the Bureau guideline, declared as `--text-*`
 * tokens in index.css.
 *
 * tailwind-merge has to be told about these by name. It cannot tell whether a
 * custom `text-<name>` utility sets a font size or a colour, and defaults to
 * treating an unrecognised name as a colour. Without this list it therefore
 * files `text-card-title` and `text-russian` under the same class group and
 * drops whichever comes first — which silently removed the dark label colour
 * from white CTAs and rendered them white-on-white.
 */
const FONT_SIZES = [
  "hero",
  "display-3xl",
  "display-2xl",
  "display-xl",
  "display-lg",
  "display-md",
  "slide",
  "module",
  "stat",
  "card-title",
  "article",
  "lede",
  "body-lede",
  "body-lg",
  "body-md",
  "body-sm",
  "caption",
  "eyebrow",
  "eyebrow-micro",
]

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: FONT_SIZES }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
