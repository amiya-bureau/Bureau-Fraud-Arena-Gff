import { cn } from '@/lib/utils';

/**
 * Card — flat fill plus a hairline inset, or flat fill on a darker field.
 *
 * There are no drop shadows in this system, so `hairline` is the only depth
 * cue. Interactive cards lift their hairline to violet on hover and shift
 * nothing else: no scale, no shadow, no colour change.
 */
export function Card({
  surface = 'ink',
  interactive = false,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  /** white and ice cards float on near-black fields; ink is a darker field. */
  surface?: 'ink' | 'white' | 'ice' | 'violet' | 'transparent';
  interactive?: boolean;
}) {
  return (
    <div
      className={cn(surfaceClass(surface), interactive && interactiveClass(surface), className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function surfaceClass(surface: 'ink' | 'white' | 'ice' | 'violet' | 'transparent') {
  switch (surface) {
    case 'white':
      return 'bg-white text-russian border border-[var(--border-hairline)]';
    case 'ice':
      return 'bg-ice-300 text-russian border border-[rgba(0,2,36,0.1)]';
    case 'violet':
      return 'bg-violet-700 text-white border border-violet-700';
    case 'transparent':
      return 'border border-[var(--border-hairline-on-dark)] text-white';
    case 'ink':
    default:
      return 'bg-ink-900 text-white border border-ink-800';
  }
}

function interactiveClass(surface: string) {
  return cn(
    'cursor-pointer text-left transition-colors duration-[var(--dur-base)] ease-[var(--ease-standard)]',
    surface === 'white' || surface === 'ice'
      ? 'hover:border-violet-700'
      : 'hover:border-violet-700',
  );
}
