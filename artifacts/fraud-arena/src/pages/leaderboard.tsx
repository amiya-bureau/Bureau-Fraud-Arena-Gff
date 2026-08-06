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
import { LiveDot } from '@/components/bureau/live-dot';

type Tab = 'combined' | GameKey;

/* Short labels: four segments have to share 390px of phone. */
const TABS: { key: Tab; label: string }[] = [
  { key: 'combined', label: 'All' },
  { key: 'spot_the_fraud', label: 'Spot' },
  { key: 'spoof_the_system', label: 'Spoof' },
  { key: 'fraud_detective', label: 'Detect' },
];

/**
 * The standings.
 *
 * The board must fit the column exactly, so the rows share the leftover height
 * between them rather than stacking to a fixed size. Ten rows plus a pinned
 * self-row is the most the API returns, which lands comfortably above the 44px
 * floor on the shortest handset we target.
 */
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
  const showPinned =
    leaderboard?.pinned && !rows.find((r) => r.playerId === leaderboard.pinned?.playerId);

  return (
    <Layout
      title="Leaderboard"
      showTabs
      headerRight={<LiveDot label="Live" className="mr-1" />}
    >
      {/* Scope: a square segmented control, hairlines, no pills. */}
      <div className="mt-3 flex shrink-0 border border-ink-800">
        {(['today', 'cumulative'] as LeaderboardScope[]).map((s) => (
          <button
            key={s}
            onClick={() => setScope(s)}
            className={cn(
              'tap flex-1 py-2.5 font-mono text-eyebrow-micro font-medium uppercase tracking-[0.03em]',
              scope === s ? 'bg-violet-700 text-white' : 'text-[var(--text-on-dark-muted)]',
            )}
          >
            {s === 'today' ? 'Today' : 'All days'}
          </button>
        ))}
      </div>

      {/* Game filter: underline tabs, the technical register. */}
      <div className="flex shrink-0 border-b border-ink-800">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn(
              'tap flex-1 border-b-2 py-3 font-mono text-eyebrow-micro font-medium uppercase tracking-[0.03em]',
              activeTab === t.key
                ? 'border-violet-700 text-white'
                : 'border-transparent text-[var(--text-on-dark-muted)]',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* The board is a white field floating on near-black. */}
      <div className="stagger-in app-scroll flex min-h-0 flex-1 flex-col bg-white text-russian">
        {rows.map((row) => (
          <LeaderboardRow
            key={row.playerId}
            row={row}
            isCurrentUser={row.playerId === session?.player.id}
          />
        ))}

        {rows.length === 0 && (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2">
            <p className="font-mono text-eyebrow-micro uppercase tracking-[0.03em] text-[var(--text-faint)]">
              No scores recorded
            </p>
            <p className="text-body-md text-[var(--text-muted)]">Be the first on the board.</p>
          </div>
        )}

        {showPinned && leaderboard?.pinned && (
          <LeaderboardRow row={leaderboard.pinned} isCurrentUser />
        )}
      </div>

      <div className="shrink-0 py-2.5">
        <span className="font-mono text-eyebrow-micro uppercase tracking-[0.03em] text-[var(--text-on-dark-faint)]">
          {scope === 'today' ? 'Today at the booth' : 'All days'}
        </span>
      </div>
    </Layout>
  );
}

function LeaderboardRow({ row, isCurrentUser }: { row: any; isCurrentUser: boolean }) {
  return (
    <div
      className={cn(
        'flex min-h-[44px] min-w-0 flex-1 items-center gap-3 border-b border-ice-300 px-3',
        isCurrentUser && 'bg-ice-100',
      )}
    >
      <span
        className={cn(
          'inline-flex size-7 shrink-0 items-center justify-center font-mono text-body-sm font-medium tabular-nums',
          row.rank === 1 ? 'bg-violet-700 text-white' : 'text-[var(--text-muted)]',
        )}
      >
        {row.rank}
      </span>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate font-sans text-body-md font-medium text-russian">
            {row.displayName}
          </span>
          {isCurrentUser && (
            <span className="shrink-0 bg-violet-700 px-1.5 py-0.5 font-mono text-eyebrow-micro font-medium uppercase tracking-[0.03em] text-white">
              You
            </span>
          )}
        </div>
        <span className="truncate font-mono text-eyebrow-micro uppercase tracking-[0.03em] text-[var(--text-muted)]">
          {row.company}
        </span>
      </div>

      <span
        className={cn(
          'shrink-0 font-sans text-card-title font-medium tabular-nums',
          row.rank <= 3 ? 'text-violet-700' : 'text-russian',
        )}
      >
        {row.total}
      </span>
    </div>
  );
}
