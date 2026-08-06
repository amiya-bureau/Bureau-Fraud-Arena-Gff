import { useState } from 'react';
import {
  useGetLeaderboard,
  LeaderboardScope,
  GameKey,
  getGetLeaderboardQueryKey,
} from '@workspace/api-client-react';
import { Layout } from '@/components/layout';
import { usePlayerSession } from '@/lib/store';
import { cn } from '@/lib/utils';
import { EyebrowTag } from '@/components/bureau/eyebrow-tag';
import { LiveDot } from '@/components/bureau/live-dot';

type Tab = 'combined' | GameKey;

const TABS: { key: Tab; label: string }[] = [
  { key: 'combined', label: 'Combined Total' },
  { key: 'spot_the_fraud', label: 'Spot the Fraud' },
  { key: 'spoof_the_system', label: 'Spoof the System' },
  { key: 'fraud_detective', label: 'Fraud Detective' },
];

export default function LeaderboardPage() {
  const { session } = usePlayerSession();
  const [scope, setScope] = useState<LeaderboardScope>('today');
  const [activeTab, setActiveTab] = useState<Tab>('combined');

  const leaderboardParams = {
    scope,
    game: activeTab === 'combined' ? undefined : activeTab,
    limit: 10,
    playerId: session?.player.id,
  };

  const { data: leaderboard } = useGetLeaderboard(leaderboardParams, {
    query: {
      refetchInterval: 10000,
      queryKey: getGetLeaderboardQueryKey(leaderboardParams),
    },
  });

  const rows = leaderboard?.rows ?? [];

  return (
    <Layout>
      <div className="mx-auto flex min-h-[80vh] w-full max-w-5xl flex-col py-8 md:py-12">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <EyebrowTag>Standings</EyebrowTag>
            <h1 className="mt-4 font-sans text-display-xl font-normal text-white">Leaderboard</h1>
          </div>

          {/* Square segmented control — hairlines, no pills, no shadows. */}
          <div className="flex border border-ink-800">
            {(['today', 'cumulative'] as LeaderboardScope[]).map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={cn(
                  'px-6 py-3 font-mono text-body-sm font-medium uppercase tracking-[0.03em] transition-colors duration-[var(--dur-base)] ease-[var(--ease-standard)]',
                  scope === s
                    ? 'bg-violet-700 text-white'
                    : 'text-[var(--text-on-dark-muted)] hover:text-white',
                )}
              >
                {s === 'today' ? 'Today' : 'Cumulative'}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 flex gap-px overflow-x-auto border-b border-ink-800">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={cn(
                'whitespace-nowrap border-b px-5 py-3 font-mono text-body-sm font-medium uppercase tracking-[0.03em] transition-colors duration-[var(--dur-base)] ease-[var(--ease-standard)]',
                activeTab === t.key
                  ? 'border-violet-700 text-white'
                  : 'border-transparent text-[var(--text-on-dark-muted)] hover:text-white',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* The board is a white field floating on near-black. */}
        <div className="mt-px flex flex-1 flex-col bg-white text-russian">
          <div className="grid grid-cols-12 items-center gap-4 border-b border-ice-300 px-6 py-4 font-mono text-body-sm font-medium uppercase tracking-[0.03em] text-[var(--text-muted)]">
            <div className="col-span-2 md:col-span-1">Rank</div>
            <div className="col-span-6 md:col-span-4">Player</div>
            <div className="hidden md:col-span-5 md:block">Scores</div>
            <div className="col-span-4 text-right md:col-span-2">Total</div>
          </div>

          <div className="flex flex-col">
            {rows.map((row) => (
              <LeaderboardRow
                key={row.playerId}
                row={row}
                isCurrentUser={row.playerId === session?.player.id}
              />
            ))}

            {rows.length === 0 && (
              <div className="py-section-0 flex flex-col items-center gap-3 py-20">
                <p className="font-mono text-body-sm uppercase tracking-[0.03em] text-[var(--text-faint)]">
                  No scores recorded
                </p>
                <p className="text-body-lg text-[var(--text-muted)]">Be the first on the board.</p>
              </div>
            )}

            {leaderboard?.pinned &&
              !rows.find((r) => r.playerId === leaderboard.pinned?.playerId) && (
                <>
                  <div className="flex items-center justify-center gap-1.5 py-3">
                    <span className="size-[3px] bg-[var(--text-faint)]" />
                    <span className="size-[3px] bg-[var(--text-faint)]" />
                    <span className="size-[3px] bg-[var(--text-faint)]" />
                  </div>
                  <LeaderboardRow row={leaderboard.pinned} isCurrentUser />
                </>
              )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <span className="font-mono text-body-sm uppercase tracking-[0.03em] text-[var(--text-on-dark-muted)]">
            {scope === 'today' ? 'Today' : 'All days'}
          </span>
          <LiveDot label="Updating" />
        </div>
      </div>
    </Layout>
  );
}

function LeaderboardRow({ row, isCurrentUser }: { row: any; isCurrentUser: boolean }) {
  return (
    <div
      className={cn(
        'grid grid-cols-12 items-center gap-4 border-b border-ice-300 px-6 py-5',
        isCurrentUser && 'bg-ice-100',
      )}
    >
      <div className="col-span-2 md:col-span-1">
        {row.rank === 1 ? (
          <span className="inline-flex size-8 items-center justify-center bg-violet-700 font-mono text-body-md font-medium tabular-nums text-white">
            1
          </span>
        ) : (
          <span className="inline-flex size-8 items-center justify-center font-mono text-body-md font-medium tabular-nums text-[var(--text-muted)]">
            {row.rank}
          </span>
        )}
      </div>

      <div className="col-span-6 flex flex-col overflow-hidden md:col-span-4">
        <div className="flex items-center gap-2">
          <span className="truncate font-sans text-body-lg font-medium text-russian">
            {row.displayName}
          </span>
          {isCurrentUser && (
            <span className="shrink-0 bg-violet-700 px-2 py-0.5 font-mono text-eyebrow-micro font-medium uppercase tracking-[0.03em] text-white">
              You
            </span>
          )}
        </div>
        <span className="truncate font-mono text-body-sm uppercase tracking-[0.03em] text-[var(--text-muted)]">
          {row.company}
        </span>
      </div>

      <div className="hidden items-center gap-2 md:col-span-5 md:flex">
        <ScoreChip label="STF" score={row.spotTheFraud} />
        <ScoreChip label="Spoof" score={row.spoofTheSystem} />
        <ScoreChip label="Detect" score={row.fraudDetective} />
        {row.bonus > 0 && (
          <span className="shrink-0 bg-coral-600 px-2 py-1 font-mono text-body-sm font-medium tabular-nums text-russian">
            +{row.bonus}
          </span>
        )}
      </div>

      <div className="col-span-4 flex flex-col items-end text-right md:col-span-2">
        <span
          className={cn(
            'font-sans text-card-title font-medium tabular-nums',
            row.rank <= 3 ? 'text-violet-700' : 'text-russian',
          )}
        >
          {row.total}
        </span>
        <span className="mt-0.5 font-mono text-eyebrow-micro uppercase tracking-[0.03em] text-[var(--text-faint)]">
          Points
        </span>
      </div>
    </div>
  );
}

function ScoreChip({ label, score }: { label: string; score?: number }) {
  if (score === undefined || score === 0) return null;
  return (
    <span className="flex shrink-0 items-baseline gap-2 border border-[rgba(0,2,36,0.1)] px-2 py-1">
      <span className="font-mono text-eyebrow-micro font-medium uppercase tracking-[0.03em] text-[var(--text-faint)]">
        {label}
      </span>
      <span className="font-mono text-body-sm tabular-nums text-russian">{score}</span>
    </span>
  );
}
