import { Link, useLocation } from 'wouter';
import { LayoutGrid, Trophy, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The primary navigation.
 *
 * It sits inline in the page, directly above the content it switches between,
 * rather than pinned to the bottom of the screen: on a booth phone the thumb
 * is already on the content, and a fixed bar spent 58px of a screen that is
 * not allowed to scroll.
 *
 * It reads as the same underline control the leaderboard uses for its filters
 * — square, hairline-separated, mono labels in the technical register, the
 * active destination marked by a drawn violet rule rather than a filled shape.
 */
interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const ITEMS: NavItem[] = [
  { href: '/', label: 'Arena', icon: LayoutGrid },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
];

export function PrimaryNav({ className }: { className?: string }) {
  const [location] = useLocation();

  return (
    <nav
      aria-label="Primary"
      className={cn('flex w-full shrink-0 border-b border-ink-800', className)}
    >
      {ITEMS.map((item) => {
        const active = item.href === '/' ? location === '/' : location.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'tap flex min-h-[44px] flex-1 items-center justify-center gap-2 border-b-2 py-2.5 font-mono text-eyebrow-micro font-medium uppercase tracking-[0.03em]',
              active
                ? 'border-violet-700 text-white'
                : 'border-transparent text-[var(--text-on-dark-faint)]',
            )}
          >
            <Icon
              className={cn('size-4 shrink-0', active && 'text-violet-500')}
              strokeWidth={1.5}
              aria-hidden="true"
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
