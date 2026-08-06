import { usePlayerSession } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { ShieldAlert, LogOut } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { IconTile } from '@/components/bureau/icon-tile';

/**
 * The booth chrome.
 *
 * The background is the 22.041px matrix rather than the blurred colour glows
 * this app used to carry — blur is not part of the Bureau language, and depth
 * comes from the grid and from hairlines instead.
 */
export function Layout({
  children,
  showHeader = true,
}: {
  children: React.ReactNode;
  showHeader?: boolean;
}) {
  const { session, clearSession } = usePlayerSession();
  const [, setLocation] = useLocation();

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col items-center overflow-hidden bg-russian">
      {/* The matrix sits behind every dark field, fading out under the content. */}
      <div
        aria-hidden="true"
        className="bureau-matrix field-fade pointer-events-none absolute inset-x-0 top-0 h-[70vh]"
      />

      {showHeader && (
        <header className="relative z-10 w-full max-w-[1080px] px-4 py-6 md:px-6">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="group flex items-center gap-4 transition-opacity duration-[var(--dur-base)] ease-[var(--ease-standard)] hover:opacity-[0.82]"
            >
              <IconTile icon={ShieldAlert} size={44} />
              <span className="font-sans text-card-title font-medium text-white">
                Bureau Fraud Arena
              </span>
            </Link>

            <div className="flex items-center gap-4">
              {session && (
                <div className="flex items-center gap-4 border border-ink-800 bg-ink-900 px-4 py-3">
                  <span className="font-sans text-body-md font-medium text-white">
                    {session.player.firstName}
                  </span>
                  <span className="border-l border-ink-800 pl-4 font-mono text-body-sm uppercase tracking-[0.03em] text-[var(--text-on-dark-muted)]">
                    {session.player.company}
                  </span>
                  <button
                    onClick={() => {
                      clearSession();
                      setLocation('/');
                    }}
                    aria-label="End session"
                    className="text-[var(--text-on-dark-muted)] transition-opacity duration-[var(--dur-base)] ease-[var(--ease-standard)] hover:opacity-100"
                  >
                    <LogOut className="size-4" strokeWidth={1.5} />
                  </button>
                </div>
              )}
              <Link href="/leaderboard">
                <Button variant="outline" size="sm" className="font-mono uppercase tracking-[0.03em]">
                  Leaderboard
                </Button>
              </Link>
            </div>
          </div>
          <hr className="mt-6 h-px w-full border-0 bg-ink-800" />
        </header>
      )}

      <main className="relative z-10 flex w-full max-w-[1080px] flex-1 flex-col px-4 pb-6 md:px-6">
        {children}
      </main>
    </div>
  );
}
