import { cn } from '@/lib/utils';
import { EyebrowTag } from './eyebrow-tag';

/**
 * SectionHeader — eyebrow, then headline, then muted clause.
 *
 * The guideline's sentence shape: a short assertive headline, then a muted
 * second clause that lets the sentence trail off. Supporting copy sits at 60%
 * so opacity does the emphasis rather than a second colour.
 */
export function SectionHeader({
  eyebrow,
  title,
  clause,
  size = 'lg',
  align = 'left',
  className,
  children,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  clause?: React.ReactNode;
  size?: 'md' | 'lg' | 'xl';
  align?: 'left' | 'center';
  className?: string;
  /** The one CTA per module. */
  children?: React.ReactNode;
}) {
  const sizes = {
    md: 'text-display-lg',
    lg: 'text-display-xl',
    xl: 'text-display-2xl',
  } as const;

  return (
    <header
      className={cn(
        'flex flex-col gap-4',
        align === 'center' && 'items-center text-center',
        className,
      )}
    >
      {eyebrow ? <EyebrowTag>{eyebrow}</EyebrowTag> : null}
      <h2 className={cn(sizes[size], 'font-sans font-normal text-white')}>{title}</h2>
      {clause ? (
        <p className="max-w-[60ch] text-body-lg text-[var(--text-on-dark-muted)]">{clause}</p>
      ) : null}
      {children ? <div className="mt-2">{children}</div> : null}
    </header>
  );
}
