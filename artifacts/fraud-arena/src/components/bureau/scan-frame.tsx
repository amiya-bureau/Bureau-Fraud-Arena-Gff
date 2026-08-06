import { cn } from '@/lib/utils';

/**
 * ScanFrame — the bracketed frame with a mono ID chip.
 *
 * The guideline's detection overlay: scan brackets marking where the system is
 * looking, with an uppercase mono identifier. Brackets are drawn as four
 * corner rules rather than a full border so the frame reads as an instrument
 * rather than a card.
 */
export function ScanFrame({
  id,
  tone = 'violet',
  children,
  className,
}: {
  id?: string;
  tone?: 'violet' | 'coral' | 'cyan';
  children: React.ReactNode;
  className?: string;
}) {
  const tones = {
    violet: 'border-violet-700',
    coral: 'border-coral-600',
    cyan: 'border-cyan-500',
  } as const;

  const chips = {
    violet: 'bg-violet-700 text-white',
    coral: 'bg-coral-600 text-russian',
    cyan: 'bg-cyan-500 text-russian',
  } as const;

  const corner = cn('pointer-events-none absolute size-4', tones[tone]);

  return (
    <div className={cn('relative', className)}>
      {children}
      <span aria-hidden="true" className={cn(corner, 'left-0 top-0 border-l border-t')} />
      <span aria-hidden="true" className={cn(corner, 'right-0 top-0 border-r border-t')} />
      <span aria-hidden="true" className={cn(corner, 'bottom-0 left-0 border-b border-l')} />
      <span aria-hidden="true" className={cn(corner, 'bottom-0 right-0 border-b border-r')} />
      {id ? (
        <span
          className={cn(
            'absolute -bottom-px left-0 px-2 py-1 font-mono text-eyebrow-micro font-medium uppercase tracking-[0.03em]',
            chips[tone],
          )}
        >
          {id}
        </span>
      ) : null}
    </div>
  );
}
