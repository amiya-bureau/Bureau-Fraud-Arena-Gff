import { cn } from '@/lib/utils';

/** Divider — the 1px hairline rule used throughout the guideline and modules. */
export function Divider({
  on = 'dark',
  className,
}: {
  on?: 'dark' | 'light';
  className?: string;
}) {
  return (
    <hr
      className={cn(
        'h-px w-full border-0',
        on === 'dark' ? 'bg-ink-800' : 'bg-ice-300',
        className,
      )}
    />
  );
}
