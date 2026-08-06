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
}: RulesScreenProps) {
  const scoreBadge = standing?.scores.find((s) => s.game === gameKey);

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

      {/* Hairline-separated rows — no cards inside a card, no shadows. */}
      <div className="stagger-in mt-4 min-h-0 flex-1 border-t border-ink-800">
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
      </div>

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
          Start game
        </Button>
      </div>
    </div>
  );
}
