import { cn } from '@/lib/utils';

/**
 * PixelChevron — five 4px squares in a 12 x 20 box, used after every CTA label.
 *
 * Drawn rather than borrowed from an icon set: Lucide's chevron has rounded
 * caps and a stroke, and this mark is square and solid by definition.
 */
export function PixelChevron({ className }: { className?: string }) {
  return (
    <svg
      width="12"
      height="20"
      viewBox="0 0 12 20"
      fill="none"
      aria-hidden="true"
      className={cn('shrink-0', className)}
    >
      <rect x="0" y="0" width="4" height="4" fill="currentColor" />
      <rect x="4" y="4" width="4" height="4" fill="currentColor" />
      <rect x="8" y="8" width="4" height="4" fill="currentColor" />
      <rect x="4" y="12" width="4" height="4" fill="currentColor" />
      <rect x="0" y="16" width="4" height="4" fill="currentColor" />
    </svg>
  );
}
