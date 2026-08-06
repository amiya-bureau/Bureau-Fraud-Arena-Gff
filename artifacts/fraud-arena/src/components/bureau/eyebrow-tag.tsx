import { cn } from '@/lib/utils';

/**
 * EyebrowTag — the bracketed uppercase mono chip that opens each module.
 *
 * The brackets are real characters rather than borders so they inherit the
 * type's colour and optical weight. Eyebrows are four words at most.
 */
export function EyebrowTag({
  children,
  tone = 'violet',
  className,
}: {
  children: React.ReactNode;
  /** violet marks where the system is working; cyan is reserved for live. */
  tone?: 'violet' | 'cyan' | 'coral' | 'muted' | 'dark';
  className?: string;
}) {
  const tones = {
    violet: 'text-violet-500',
    cyan: 'text-cyan-500',
    coral: 'text-coral-600',
    muted: 'text-[var(--text-on-dark-muted)]',
    dark: 'text-russian',
  } as const;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 font-mono text-eyebrow font-medium uppercase',
        tones[tone],
        className,
      )}
    >
      <span aria-hidden="true" className="opacity-60">
        [
      </span>
      {children}
      <span aria-hidden="true" className="opacity-60">
        ]
      </span>
    </span>
  );
}
