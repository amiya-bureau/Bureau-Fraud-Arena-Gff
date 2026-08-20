/**
 * Shared end-of-game screen.
 *
 * Shown after any game completes. Presents the player's score and rank, then
 * offers a path into each of the other two games or an "Exit Arena" which
 * clears the session and shows a results card.
 *
 * When all three games have been played the "play other games" section is
 * replaced by a "All three games complete" banner.
 */
import { useLocation } from 'wouter';
import { Network, ScanFace, Fingerprint, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout';
import { EyebrowTag } from '@/components/bureau/eyebrow-tag';
import { StatReadout } from '@/components/bureau/stat-readout';
import { PixelChevron } from '@/components/bureau/pixel-chevron';
import { usePlayerSession } from '@/lib/store';
import { cn } from '@/lib/utils';

export type GameKey = 'spot_the_fraud' | 'spoof_the_system' | 'fraud_detective';

interface GameInfo {
  key: GameKey;
  label: string;
  sub: string;
  href: string;
  icon: LucideIcon;
  tone: 'violet' | 'coral' | 'lime';
}

const GAMES: GameInfo[] = [
  { key: 'spot_the_fraud',    label: 'Spot the Fraud',   sub: 'Prepared to test your knowledge?', href: '/spot-the-fraud',   icon: Network,      tone: 'violet' },
  { key: 'spoof_the_system',  label: 'Spoof the System', sub: 'Beat our synthetic image detector.', href: '/spoof-the-system', icon: ScanFace,     tone: 'coral'  },
  { key: 'fraud_detective',   label: 'Fraud Detective',  sub: 'Can you identify the mule rings?',  href: '/fraud-detective',  icon: Fingerprint,  tone: 'lime'   },
];

const TONE_FIELD: Record<string, string> = {
  violet: 'bg-violet-700',
  coral:  'bg-coral-600',
  lime:   'bg-lime-300',
};
const TONE_TITLE: Record<string, string> = {
  violet: 'text-white',
  coral:  'text-russian',
  lime:   'text-russian',
};
const TONE_BODY: Record<string, string> = {
  violet: 'text-white/80',
  coral:  'text-russian/70',
  lime:   'text-russian/70',
};
const TONE_MARK: Record<string, string> = {
  violet: 'text-white/80',
  coral:  'text-russian/60',
  lime:   'text-russian/60',
};

interface Props {
  /** The game that just finished. */
  currentGame: GameKey;
  /** Points scored in this run. */
  points: number;
  /** Server-returned standing (rank, total). May be null if offline. */
  standing?: { rank: number | null; total: number; playedAllThree?: boolean } | null;
  /** Whether this run is a personal best. */
  isPersonalBest?: boolean;
  /** A flawless run ends in a final celebration instead of a replay prompt. */
  highScore?: boolean;
  /** Callback to replay the current game for standard completion screens. */
  onPlayAgain?: () => void;
}

export function GameEndScreen({
  currentGame,
  points,
  standing,
  isPersonalBest,
  highScore = false,
  onPlayAgain,
}: Props) {
  const [, setLocation] = useLocation();
  const { session, clearSession } = usePlayerSession();

  const otherGames = GAMES.filter((g) => g.key !== currentGame);
  const allPlayed = standing?.playedAllThree ?? false;
  const showOtherGames = highScore || !allPlayed;

  const handleExitArena = () => {
    // Clear the session so the next visitor starts fresh, and go to a results
    // screen that shows the final leaderboard position without being guarded.
    clearSession();
    setLocation('/');
  };

  const handlePlayOther = (href: string) => {
    // The player has already registered so ProtectedRoute will offer "Continue
    // as [name] / New Player" — no need to clear the session here.
    setLocation(href);
  };

  return (
    <Layout title={GAMES.find((g) => g.key === currentGame)?.label ?? 'Game'}>
      {/* Result summary — white panel with corner-cluster dots for contrast relief. */}
      <div className="relative -mx-4 shrink-0 overflow-hidden bg-white px-4 pb-6 pt-6 text-center">
        <div aria-hidden className="bureau-dots-edge pointer-events-none absolute inset-0" />
        <EyebrowTag tone="dark">{highScore ? 'High Score Achieved' : 'Run Complete'}</EyebrowTag>

        <div className="mt-6 flex justify-center gap-8">
          <StatReadout value={points.toString()} caption="Points" tone="on-light" size="md" />
          {standing?.rank != null && (
            <StatReadout
              value={`#${standing.rank}`}
              caption={isPersonalBest ? 'Rank · PB' : 'Rank'}
              tone="on-light"
              size="md"
            />
          )}
        </div>

        {allPlayed && !highScore && (
          <div className="mt-4 border border-violet-700/30 bg-violet-700/8 px-4 py-2">
            <span className="font-mono text-eyebrow-micro uppercase tracking-[0.03em] text-violet-700">
              All three games complete
            </span>
          </div>
        )}
      </div>

      {/* Other games to try */}
      {showOtherGames && (
        <div className="mt-5 flex flex-col gap-2">
          <p className="font-mono text-eyebrow-micro uppercase tracking-[0.03em] text-[var(--text-on-dark-faint)]">
            Try another game
          </p>

          {otherGames.map((g) => {
            const tf = TONE_FIELD[g.tone];
            const tt = TONE_TITLE[g.tone];
            const tb = TONE_BODY[g.tone];
            const tm = TONE_MARK[g.tone];
            return (
              <button
                key={g.key}
                onClick={() => handlePlayOther(g.href)}
                className={cn(
                  'tap flex w-full items-center gap-4 px-4 py-4 text-left',
                  tf,
                )}
              >
                <g.icon className={cn('size-5 shrink-0', tm)} strokeWidth={1.5} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <h2 className={cn('truncate font-sans text-body-lg font-medium', tt)}>{g.label}</h2>
                  <p className={cn('mt-0.5 font-mono text-body-sm', tb)}>{g.sub}</p>
                </div>
                <PixelChevron className={cn('shrink-0', tm)} />
              </button>
            );
          })}
        </div>
      )}

      {/* Actions — pushed to the bottom of the flex column */}
      <div className="mt-auto flex shrink-0 flex-col gap-3 pt-5 pb-4">
        {!highScore && onPlayAgain && (
          <Button variant="light" size="lg" chevron onClick={onPlayAgain} className="w-full">
            Play again
          </Button>
        )}
        <Button variant="outline" size="lg" onClick={handleExitArena} className="w-full">
          Exit Arena
        </Button>
      </div>
    </Layout>
  );
}
