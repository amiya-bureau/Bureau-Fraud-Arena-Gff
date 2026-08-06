import { Link, useLocation } from 'wouter';
import { LayoutGrid, Trophy, UserRound, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The bottom tab bar.
 *
 * This is the one place the app departs from the guideline's page-oriented
 * navigation: on a handset, a persistent bar is how people expect to move
 * between top-level destinations, and hunting for a link in a header is not
 * something anyone does at a booth with a phone in one hand.
 *
 * It stays inside the language otherwise — square, flat, hairline-separated,
 * mono labels in the technical register. The active tab is marked by a violet
 * rule drawn along its top edge rather than by a pill or a filled shape.
 */
interface Tab {
  href: string;
  label: string;
  icon: LucideIcon;
}

const TABS: Tab[] = [
  { href: '/', label: 'Arena', icon: LayoutGrid },
  { href: '/leaderboard', label: 'Ranks', icon: Trophy },
  { href: '/join', label: 'You', icon: UserRound },
];

export function TabBar() {
  const [location] = useLocation();

  return (
    <nav
      aria-label="Primary"
      className="pb-safe relative z-20 w-full shrink-0 border-t border-ink-800 bg-russian"
    >
      <ul className="flex w-full items-stretch">
        {TABS.map((tab) => {
          const active = tab.href === '/' ? location === '/' : location.startsWith(tab.href);
          const Icon = tab.icon;

          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'tap relative flex h-[58px] w-full flex-col items-center justify-center gap-1.5',
                  active ? 'text-white' : 'text-[var(--text-on-dark-faint)]',
                )}
              >
                {/* The active marker: a drawn rule, not a highlight. */}
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute inset-x-0 top-0 h-0.5 transition-opacity duration-[var(--dur-base)] ease-[var(--ease-standard)]',
                    active ? 'bg-violet-700 opacity-100' : 'opacity-0',
                  )}
                />
                <Icon
                  className={cn('size-5', active && 'text-violet-500')}
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <span className="font-mono text-eyebrow-micro font-medium uppercase tracking-[0.03em]">
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
