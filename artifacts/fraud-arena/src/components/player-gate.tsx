/**
 * Player selection gate.
 *
 * Shown instead of the registration form when the device already has a session.
 * Lets a returning player confirm they want to continue or hand the phone to
 * the next visitor.
 *
 * "Continue as [name]" → proceeds into the game with the existing session.
 * "New Player" → clears the session and shows the registration form.
 */
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout';
import { EyebrowTag } from '@/components/bureau/eyebrow-tag';
import { cn } from '@/lib/utils';

interface Props {
  firstName: string;
  company: string;
  gameName: string;
  onContinue: () => void;
  onNewPlayer: () => void;
}

export function PlayerGate({ firstName, company, gameName, onContinue, onNewPlayer }: Props) {
  return (
    <Layout title="Who's playing?" back="/">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 pt-6">
          <EyebrowTag>Entering {gameName}</EyebrowTag>
          <h1 className="mt-3 font-sans text-display-lg font-normal text-white">
            Who is playing?
          </h1>
          <p className="mt-2 font-mono text-body-sm text-[var(--text-on-dark-muted)]">
            The previous session is still active.
          </p>
        </div>

        {/* The two choices: returning player card or hand off */}
        <div className="mt-6 flex min-h-0 flex-1 flex-col gap-3">
          {/* Returning player option — highlighted */}
          <button
            onClick={onContinue}
            className={cn(
              'tap flex items-center gap-4 border border-violet-700 bg-violet-700/10 px-4 py-4 text-left',
            )}
          >
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="font-mono text-eyebrow-micro uppercase tracking-[0.03em] text-[var(--text-on-dark-muted)]">
                Continue as
              </span>
              <span className="truncate font-sans text-card-title font-medium text-white">
                {firstName}
              </span>
              <span className="font-mono text-eyebrow-micro uppercase tracking-[0.03em] text-[var(--text-on-dark-faint)]">
                {company}
              </span>
            </div>
            <div className="shrink-0 bg-violet-700 px-3 py-1.5 font-mono text-eyebrow-micro font-medium uppercase tracking-[0.03em] text-white">
              Continue
            </div>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 shrink-0">
            <hr className="flex-1 border-0 border-t border-ink-800" />
            <span className="font-mono text-eyebrow-micro uppercase tracking-[0.03em] text-[var(--text-on-dark-faint)]">
              or
            </span>
            <hr className="flex-1 border-0 border-t border-ink-800" />
          </div>

          {/* New player option */}
          <button
            onClick={onNewPlayer}
            className="tap flex items-center gap-4 border border-ink-800 bg-ink-900 px-4 py-4 text-left"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="font-mono text-eyebrow-micro uppercase tracking-[0.03em] text-[var(--text-on-dark-muted)]">
                New player
              </span>
              <span className="font-sans text-card-title font-medium text-white">
                Register as someone new
              </span>
            </div>
            <div className="shrink-0 border border-ink-700 px-3 py-1.5 font-mono text-eyebrow-micro font-medium uppercase tracking-[0.03em] text-[var(--text-on-dark-muted)]">
              Switch
            </div>
          </button>
        </div>
      </div>
    </Layout>
  );
}
