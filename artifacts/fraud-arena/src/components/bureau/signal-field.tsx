import { cn } from '@/lib/utils';

/**
 * SignalField / DotGrid — the dark or violet field carrying the matrix.
 *
 * Every dark field in the system sits on the 22.041px hairline grid or the 8px
 * dot field. `fade` applies the one protection gradient the guideline allows,
 * so the texture dies out under a headline instead of competing with it.
 */
export function SignalField({
  texture = 'matrix',
  tone = 'russian',
  fade = false,
  className,
  children,
}: {
  texture?: 'matrix' | 'dots' | 'none';
  tone?: 'russian' | 'ink' | 'violet';
  fade?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const tones = {
    russian: 'bg-russian',
    ink: 'bg-ink-900',
    violet: 'bg-violet-700',
  } as const;

  return (
    <div className={cn('relative isolate', tones[tone], className)}>
      {texture !== 'none' ? (
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-0 -z-10',
            texture === 'matrix' ? 'bureau-matrix' : 'bureau-dots',
            fade && 'field-fade',
          )}
        />
      ) : null}
      {children}
    </div>
  );
}
