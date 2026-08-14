import { usePlayerSession } from '@/lib/store';
import { ChevronLeft, LogOut } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';

/**
 * The phone shell.
 *
 * The arena is played on a handset at a booth, so the whole app is a fixed
 * 9:16 column that never scrolls: the shell owns the viewport height and each
 * screen fits into whatever is left after the app bar has taken its share.
 * Navigation is placed by the screens themselves, inline in the content. Screens that genuinely cannot fit — only the host's admin
 * panel — opt into scrolling explicitly with `scrollable`.
 *
 * On a display wider than a handset the column is centred and the surrounding
 * field is darkened, so the app reads as a device rather than as a narrow
 * website. The column is also the CSS container that the clamped type and
 * spacing scales in index.css resolve against.
 */
export function Layout({
  children,
  showHeader = true,
  title,
  back,
  headerRight,
  scrollable = false,
}: {
  children: React.ReactNode;
  /** The compact app bar. Off for screens that open with their own masthead. */
  showHeader?: boolean;
  /** Mono, uppercase. The screen's name in the technical register. */
  title?: string;
  /** A route to return to, or a handler. Presence of this shows the chevron. */
  back?: string | (() => void);
  /** Trailing app-bar slot — a timer, a counter, a step readout. */
  headerRight?: React.ReactNode;
  /** Escape hatch from the no-scroll rule. The admin panel is the only user. */
  scrollable?: boolean;
}) {
  const { session, clearSession } = usePlayerSession();
  const [location, setLocation] = useLocation();

  const handleBack = () => {
    if (typeof back === 'function') back();
    else if (typeof back === 'string') setLocation(back);
  };

  return (
    <div className="flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-[#00010f]">
      <div className="app-shell relative flex w-full max-w-[430px] aspect-[3/5] max-h-[100dvh] flex-col border-ink-800 bg-russian sm:border-x">
        {/* The matrix sits behind every dark field, fading out under content. */}
        <div
          aria-hidden="true"
          className="bureau-matrix field-fade pointer-events-none absolute inset-x-0 top-0 h-[45%]"
        />
        {/* Dots rise from the bottom — the dark field stays textured all the way down. */}
        <div
          aria-hidden="true"
          className="bureau-dots field-fade-up pointer-events-none absolute inset-x-0 bottom-0 h-[40%]"
        />

        {showHeader && (
          <header className="pt-safe relative z-10 w-full shrink-0">
            <div className="flex h-14 items-center gap-2 px-3">
              {back ? (
                <button
                  onClick={handleBack}
                  aria-label="Go back"
                  className="tap -ml-1 flex size-11 shrink-0 items-center justify-center text-white"
                >
                  <ChevronLeft className="size-6" strokeWidth={1.5} />
                </button>
              ) : (
                <span className="w-1 shrink-0" />
              )}

              {title ? (
                <h1 className="min-w-0 flex-1 truncate font-mono text-eyebrow font-medium uppercase tracking-[0.03em] text-white">
                  {title}
                </h1>
              ) : (
                <span className="min-w-0 flex-1" />
              )}

              {headerRight ?? null}

              {!headerRight && session ? (
                <button
                  onClick={() => {
                    clearSession();
                    setLocation('/');
                  }}
                  aria-label="End session"
                  className="tap flex size-11 shrink-0 items-center justify-center text-[var(--text-on-dark-muted)]"
                >
                  <LogOut className="size-[18px]" strokeWidth={1.5} />
                </button>
              ) : null}
            </div>
            <hr className="h-px w-full border-0 bg-ink-800" />
          </header>
        )}

        {/* Keyed on the route so each screen resolves in rather than snapping. */}
        <main
          key={location}
          className={cn(
            'screen-in app-screen pb-safe relative z-10 w-full px-4',
            scrollable && 'app-scroll',
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

/**
 * A convenience for the many screens that want their content pinned to the
 * bottom of the column with the headline riding above it.
 */
export function ScreenBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('flex min-h-0 flex-1 flex-col', className)}>{children}</div>;
}

export { Link };
