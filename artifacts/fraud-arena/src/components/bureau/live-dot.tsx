import { cn } from '@/lib/utils';

/**
 * The one loop in the system: a cyan live pulse, opacity 1 -> .35 over 1.6s
 * linear. Cyan is reserved for exactly this — it is never a fill for a large
 * area, so the dot stays 6px and the label carries the meaning.
 */
export function LiveDot({
  label,
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span
        className="size-1.5 shrink-0 animate-live-pulse bg-cyan-500"
        aria-hidden="true"
      />
      {label ? (
        <span className="font-mono text-body-sm font-medium uppercase tracking-[0.03em] text-cyan-500">
          {label}
        </span>
      ) : null}
    </span>
  );
}
