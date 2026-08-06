import { cn } from '@/lib/utils';

/**
 * StatReadout — the oversized stat with a violet corner block.
 *
 * Numbers are stated bare and pre-formatted, with a lower-case fragment
 * underneath. The 118px figure is transcribed from the source; `size` steps it
 * down for denser surfaces without abandoning the proportion.
 */
export function StatReadout({
  value,
  caption,
  size = 'lg',
  tone = 'on-dark',
  corner = true,
  className,
}: {
  value: React.ReactNode;
  caption?: string;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'on-dark' | 'on-light';
  corner?: boolean;
  className?: string;
}) {
  const sizes = {
    sm: 'text-display-lg',
    md: 'text-article',
    lg: 'text-stat',
  } as const;

  return (
    <div className={cn('relative', className)}>
      {corner ? (
        <span
          aria-hidden="true"
          className="absolute right-0 top-0 size-3 bg-violet-700"
        />
      ) : null}
      <div
        className={cn(
          sizes[size],
          'font-sans font-normal tabular-nums',
          tone === 'on-dark' ? 'text-white' : 'text-russian',
        )}
      >
        {value}
      </div>
      {caption ? (
        <div
          className={cn(
            'mt-2 font-mono text-body-sm font-medium uppercase tracking-[0.03em]',
            tone === 'on-dark'
              ? 'text-[var(--text-on-dark-muted)]'
              : 'text-[var(--text-muted)]',
          )}
        >
          {caption}
        </div>
      ) : null}
    </div>
  );
}
