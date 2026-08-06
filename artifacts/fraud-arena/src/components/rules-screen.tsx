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
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center py-12">
      <EyebrowTag>Briefing</EyebrowTag>

      <h1 className="mt-6 font-sans text-display-xl font-normal text-white">{gameName}</h1>
      <p className="mt-4 max-w-[56ch] text-body-lede text-[var(--text-on-dark-muted)]">{premise}</p>

      {/* Hairline-separated rows — no cards inside a card, no shadows. */}
      <div className="mt-stack border-t border-ink-800">
        {rules.map((rule, i) => (
          <div key={rule.label} className="flex items-start gap-6 border-b border-ink-800 py-6">
            <span className="mt-1 w-6 shrink-0 font-mono text-body-md font-medium tabular-nums text-violet-500">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div>
              <h2 className="font-mono text-eyebrow font-medium uppercase tracking-[0.03em] text-white">
                {rule.label}
              </h2>
              <p className="mt-2 max-w-[64ch] text-body-lg text-[var(--text-on-dark-muted)]">
                {rule.body}
              </p>
            </div>
          </div>
        ))}
      </div>

      {scoreBadge && scoreBadge.played && (
        <div className="mt-8 flex items-baseline gap-4 border border-violet-700 px-6 py-5">
          <span className="font-mono text-body-sm font-medium uppercase tracking-[0.03em] text-violet-500">
            Your best
          </span>
          <span className="font-sans text-card-title font-medium tabular-nums text-white">
            {scoreBadge.points} pts
          </span>
          {standing?.rank ? (
            <span className="font-mono text-body-sm uppercase tracking-[0.03em] text-[var(--text-on-dark-muted)]">
              rank {standing.rank}
            </span>
          ) : null}
        </div>
      )}

      <div className="mt-stack">
        <Button variant="light" size="lg" chevron onClick={onStart} className="w-full">
          Start game
        </Button>
      </div>
    </div>
  );
}
