import { cn } from '@/lib/utils';

/**
 * SignalField / DotGrid — the dark or violet field carrying the matrix.
 *
 * Every dark field in the system sits on the 22.041px hairline grid or the 8px
 * dot field. `fade` applies the one protection gradient the guideline allows,
 * so the texture dies out under a headline instead of competing with it.
 */
export function SignalField({
  texture,
  tone = 'russian',
  fade = false,
  className,
  children,
}: {
  texture?: 'matrix' | 'dots' | 'dots-light' | 'dots-edge' | 'none';
  tone?: 'russian' | 'ink' | 'violet' | 'light';
  fade?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const tones = {
    russian: 'bg-russian',
    ink: 'bg-ink-900',
    violet: 'bg-violet-700',
    light: 'bg-white',
  } as const;

  // Default texture per tone when not specified explicitly.
  const defaultTexture: typeof texture =
    tone === 'light' ? 'dots-edge' : 'matrix';
  const resolvedTexture = texture ?? defaultTexture;

  const textureClass = {
    matrix: 'bureau-matrix',
    dots: 'bureau-dots',
    'dots-light': 'bureau-dots-light',
    'dots-edge': 'bureau-dots-edge',
    none: '',
  }[resolvedTexture];

  return (
    <div className={cn('relative isolate', tones[tone], className)}>
      {resolvedTexture !== 'none' ? (
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-0 -z-10',
            textureClass,
            fade && 'field-fade',
          )}
        />
      ) : null}
      {children}
    </div>
  );
}
