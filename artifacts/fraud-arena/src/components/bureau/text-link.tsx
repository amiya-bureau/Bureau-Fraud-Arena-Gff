import { cn } from '@/lib/utils';

/**
 * TextLink — the underlined 70%-opacity "Read more" / "Learn more" link.
 * Hover takes it to 100%; there is no colour shift.
 */
export function TextLink({
  children,
  className,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      className={cn(
        'font-sans text-body-md underline decoration-1 underline-offset-4 opacity-70',
        'transition-opacity duration-[var(--dur-base)] ease-[var(--ease-standard)] hover:opacity-100',
        className,
      )}
      {...props}
    >
      {children}
    </a>
  );
}
