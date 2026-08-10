import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlayerStanding } from '@workspace/api-client-react';
import { EyebrowTag } from '@/components/bureau/eyebrow-tag';

interface RulesScreenProps {
  gameName: string;
  premise: string;
  scoring: string;
  endsWhen: string;
  lifelines: string;
  standing?: PlayerStanding;
  gameKey: string;
  onStart: () => void;
  /** Optional extra bullets merged below the rules rows (e.g. "What you're looking for"). */
  insightTitle?: string;
  insightBullets?: string[];
  /** Override the CTA label. Defaults to "Start game". */
  startLabel?: string;
}

/**
 * The briefing that opens every game.
 *
 * Laid out as a phone screen: the masthead is fixed at the top, the rules take
 * whatever room is left in the middle, and the start action is pinned to the
 * bottom of the column where a thumb reaches it. Nothing scrolls.
 */
export function RulesScreen({
  gameName,
  premise,
  scoring,
  endsWhen,
  lifelines,
  standing,
  gameKey,
  onStart,
  insightTitle,
  insightBullets,
  startLabel,
}: RulesScreenProps) {
  const scoreBadge = standing?.scores.find((s) => s.game === gameKey);

  // Consume the one-shot welcome-back flag set by the registration form when
  // the API identifies a returning player. useState initialiser runs once so
  // the flag is read and cleared before the first render.
  const [welcomeName] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const name = window.sessionStorage.getItem('arena_welcome_back');
    if (name) window.sessionStorage.removeItem('arena_welcome_back');
    return name;
  });

  const rules = [
    { label: 'Scoring', body: scoring },
    { label: 'Game Over', body: endsWhen },
    ...(lifelines ? [{ label: 'Lifelines & Attempts', body: lifelines }] : []),
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col pt-4">
      <div className="shrink-0">
        <EyebrowTag>Briefing</EyebrowTag>
        <h1 className="mt-3 font-sans text-display-lg font-normal text-white">{gameName}</h1>
        <p className="mt-2 text-body-md text-[var(--text-on-dark-muted)]">{premise}</p>
      </div>

      {/* Hairline-separated rows. Scrollable so extra insight bullets fit without overflow. */}
      <div className="stagger-in mt-4 min-h-0 flex-1 overflow-y-auto border-t border-ink-800">
        {rules.map((rule, i) => (
          <div key={rule.label} className="flex items-start gap-3 border-b border-ink-800 py-3">
            <span className="mt-0.5 w-5 shrink-0 font-mono text-body-sm font-medium tabular-nums text-violet-500">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0">
              <h2 className="font-mono text-eyebrow-micro font-medium uppercase tracking-[0.03em] text-white">
                {rule.label}
              </h2>
              <p className="mt-1 text-body-sm text-[var(--text-on-dark-muted)]">{rule.body}</p>
            </div>
          </div>
        ))}

        {insightBullets && insightBullets.length > 0 && (
          <>
            <div className="pb-1 pt-3">
              <span className="font-mono text-eyebrow-micro font-medium uppercase tracking-[0.03em] text-violet-400">
                {insightTitle ?? 'What you\'re looking for'}
              </span>
            </div>
            {insightBullets.map((bullet, i) => (
              <div key={i} className="flex items-start gap-3 border-b border-ink-800 py-2.5">
                <span className="mt-0.5 w-5 shrink-0 font-mono text-eyebrow-micro font-medium tabular-nums text-violet-500/60">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p className="text-body-sm text-[var(--text-on-dark-muted)] leading-snug">{bullet}</p>
              </div>
            ))}
          </>
        )}
      </div>

      {welcomeName && (
        <div className="mt-3 shrink-0 border-l-2 border-violet-700 bg-ink-900 px-4 py-3">
          <p className="font-sans text-body-md font-medium text-white">
            Welcome back, {welcomeName}.
          </p>
          <p className="mt-0.5 text-body-sm text-[var(--text-on-dark-muted)]">
            We've attached this run to your existing profile.
          </p>
        </div>
      )}

      {scoreBadge && scoreBadge.played && (
        <div className="mt-3 flex shrink-0 items-baseline gap-3 border border-violet-700 px-4 py-3">
          <span className="font-mono text-eyebrow-micro font-medium uppercase tracking-[0.03em] text-violet-500">
            Your best
          </span>
          <span className="font-sans text-card-title font-medium tabular-nums text-white">
            {scoreBadge.points} pts
          </span>
          {standing?.rank ? (
            <span className="font-mono text-eyebrow-micro uppercase tracking-[0.03em] text-[var(--text-on-dark-muted)]">
              rank {standing.rank}
            </span>
          ) : null}
        </div>
      )}

      <div className="shrink-0 py-4">
        <Button variant="light" size="lg" chevron onClick={onStart} className="w-full">
          {startLabel ?? 'Start game'}
        </Button>
      </div>
    </div>
  );
}
