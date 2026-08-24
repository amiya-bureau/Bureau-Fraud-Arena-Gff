import { useState } from 'react';
import { useLocation } from 'wouter';
import { Fingerprint, LogOut, Network, ScanFace, type LucideIcon } from 'lucide-react';
import { Layout } from '@/components/layout';
import { LiveDot } from '@/components/bureau/live-dot';
import { PixelChevron } from '@/components/bureau/pixel-chevron';
import { usePlayerSession } from '@/lib/store';
import { PrimaryNav } from '@/components/bureau/primary-nav';
import { ArenaHeader } from '@/components/bureau/arena-header';
import { QrPanel } from '@/components/qr-panel';
import { cn } from '@/lib/utils';

/*
  Copy follows the guideline's voice: declarative, no hype, no exclamation
  marks. Full stops mid-headline are deliberate — the clauses land as separate
  signals.
*/
/*
  Each game gets its own field from the supporting palette so the three read as
  three things rather than one list. Cyan is deliberately not among them: it is
  reserved for live state, and a card is not a state. Type colour flips to
  near-black on the two light fields to hold contrast.
*/
const TONES = {
  violet: {
    field: 'bg-violet-700',
    dots: 'bureau-dots-white-muted',
    title: 'text-white',
    body: 'text-white/85',
    mark: 'text-white/90',
  },
  coral: {
    field: 'bg-[#FE978C]',
    dots: 'bureau-dots-white',
    title: 'text-russian',
    body: 'text-russian/75',
    mark: 'text-russian/70',
  },
  lime: {
    field: 'bg-lime-300',
    dots: 'bureau-dots-white',
    title: 'text-russian',
    body: 'text-russian/75',
    mark: 'text-russian/70',
  },
} as const;

type Tone = keyof typeof TONES;

const GAMES: {
  title: string;
  desc: string;
  icon: LucideIcon;
  href: string;
  tone: Tone;
}[] = [
  {
    title: 'Spot the Fraud',
    desc: 'Prepared to test your knowledge?',
    icon: Network,
    href: '/spot-the-fraud',
    tone: 'violet',
  },
  {
    title: 'Spoof the System',
    desc: 'Beat our synthetic image detector.',
    icon: ScanFace,
    href: '/spoof-the-system',
    tone: 'coral',
  },
  {
    title: 'Fraud Detective',
    desc: 'Can you identify the mule rings?',
    icon: Fingerprint,
    href: '/fraud-detective',
    tone: 'lime',
  },
];

/**
 * The arena's front door.
 *
 * A handset home screen: a compact masthead, the three games as full-width
 * cards each carrying its own colour, and the code to carry the arena onto
 * your own phone. Everything is sized to the column, so the screen never
 * scrolls no matter which handset it is opened on.
 */
export default function Home() {
  const [, setLocation] = useLocation();
  const { session, clearSession } = usePlayerSession();

  return (
    <Layout showHeader={false}>
      <ArenaHeader />

      <PrimaryNav className="mt-4" />

      {/* The games take the remaining column, three coloured fields deep. */}
      <div className="stagger-in mt-3 flex min-h-0 flex-1 flex-col gap-2">
        {GAMES.map((game, i) => (
          <GameBand key={game.href} index={i + 1} {...game} onClick={() => setLocation(game.href)} />
        ))}
      </div>

      {/*
        * The booth phone is one device and the queue is longer than it. This is
        * how a visitor carries the arena away on their own handset — a white
        * field, since all three cards above are already carrying colour.
        */}
      {/*
        * This is the arena's front door. The QR intentionally lands on the
        * game-selection screen; each game's own QR handles deep linking.
        */}
      <QrPanel
        tone="light"
        size={92}
        note="Scan to Enter the Fraud Arena on your phone."
        className="mt-3 shrink-0"
      />

      {/*
        * The booth runs on one phone passed between visitors, so ending a
        * session has to be reachable from the hub. The games expose it in
        * their header, but home has no header and the screens that carry a
        * live counter give up that slot — this is the one dependable place.
        */}
      <footer className="flex shrink-0 items-center justify-between gap-3 py-2">
        {session ? (
          <button
            onClick={clearSession}
            className="tap -ml-1 flex min-h-[44px] min-w-0 items-center gap-2 px-1 text-left font-mono text-eyebrow-micro uppercase tracking-[0.03em] text-[var(--text-on-dark-muted)]"
          >
            <LogOut className="size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            <span className="truncate">End session, {session.player.firstName}</span>
          </button>
        ) : (
          <span className="font-mono text-eyebrow-micro uppercase tracking-[0.03em] text-[var(--text-on-dark-faint)]">
            Bureau
          </span>
        )}
        <LiveDot label="Booth Live" className="shrink-0" />
      </footer>
    </Layout>
  );
}

function GameBand({
  index: _index,
  title,
  desc,
  icon: Icon,
  tone,
  onClick,
}: {
  index: number;
  title: string;
  desc: string;
  icon: LucideIcon;
  tone: Tone;
  onClick: () => void;
}) {
  const t = TONES[tone];

  return (
    <button
      onClick={onClick}
      className={cn(
        'tap relative flex max-h-[132px] min-h-[64px] flex-1 items-center gap-4 overflow-hidden px-4 text-left',
        t.field,
      )}
    >
      {/* Tone-specific dot overlay; Spot's violet field uses a quieter texture. */}
      <div aria-hidden className={cn(t.dots, 'pointer-events-none absolute inset-0')} />
      <Icon className={cn('relative size-6 shrink-0', t.mark)} strokeWidth={1.5} aria-hidden="true" />
      <div className="relative min-w-0 flex-1">
        <h2 className={cn('truncate font-sans text-card-title font-medium', t.title)}>{title}</h2>
        <p className={cn('mt-1 text-body-sm', t.body)}>{desc}</p>
      </div>
      <PixelChevron className={cn('relative shrink-0', t.mark)} />
    </button>
  );
}
