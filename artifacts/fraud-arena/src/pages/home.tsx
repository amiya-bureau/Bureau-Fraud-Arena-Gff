import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Fingerprint, Network, ScanFace, ShieldAlert, type LucideIcon } from 'lucide-react';
import { Layout } from '@/components/layout';
import { EyebrowTag } from '@/components/bureau/eyebrow-tag';
import { IconTile } from '@/components/bureau/icon-tile';
import { LiveDot } from '@/components/bureau/live-dot';
import { PixelChevron } from '@/components/bureau/pixel-chevron';

/*
  Copy follows the guideline's voice: declarative, no hype, no exclamation
  marks. Full stops mid-headline are deliberate — the clauses land as separate
  signals.
*/
const SIGNALS = [
  "Rings vary identity data because it's cheap, and reuse devices because they aren't.",
  'Roughly 60% of identified mule accounts are more than a year old.',
  'Passing every KYC check is not evidence of legitimacy.',
  "A bust-out looks like your best cohort right up until the week it doesn't.",
];

const GAMES = [
  {
    title: 'Spot the Fraud',
    desc: 'Ten levels on rings and mules.',
    icon: Network,
    href: '/spot-the-fraud',
  },
  {
    title: 'Spoof the System',
    desc: 'Beat a liveness detector.',
    icon: ScanFace,
    href: '/spoof-the-system',
  },
  {
    title: 'Fraud Detective',
    desc: 'Follow the money through a graph.',
    icon: Fingerprint,
    href: '/fraud-detective',
  },
];

/**
 * The arena's front door.
 *
 * A handset home screen: a compact masthead, then the three games as full
 * width bands that divide whatever height is left, so each one is a large,
 * unmissable tap target rather than a card in a grid.
 */
export default function Home() {
  const [, setLocation] = useLocation();
  const [signalIndex, setSignalIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSignalIndex((i) => (i + 1) % SIGNALS.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Layout showHeader={false} showTabs>
      {/* Masthead */}
      <div className="shrink-0 pt-5">
        <div className="flex items-center gap-3">
          <IconTile icon={ShieldAlert} size={40} />
          <EyebrowTag tone="muted">Global Fintech Fest 2026</EyebrowTag>
        </div>

        <h1 className="mt-4 font-sans text-hero font-normal text-white">Bureau Fraud Arena.</h1>

        <p className="mt-2 text-body-md text-[var(--text-on-dark-muted)]">
          Three games on how coordinated fraud actually behaves.
        </p>
      </div>

      {/* The rotating signal, in the technical register. */}
      <div className="mt-4 flex h-[58px] shrink-0 items-start border-l border-violet-700 pl-3">
        <p
          key={signalIndex}
          className="animate-fade-in font-mono text-body-sm text-[var(--text-on-dark-muted)]"
        >
          {SIGNALS[signalIndex]}
        </p>
      </div>

      {/* The games divide the remaining column. */}
      <div className="stagger-in mt-4 flex min-h-0 flex-1 flex-col gap-px border-y border-ink-800 bg-ink-800">
        {GAMES.map((game, i) => (
          <GameBand key={game.href} index={i + 1} {...game} onClick={() => setLocation(game.href)} />
        ))}
      </div>

      <footer className="flex shrink-0 items-center justify-between py-3">
        <span className="font-mono text-eyebrow-micro uppercase tracking-[0.03em] text-[var(--text-on-dark-faint)]">
          Bureau
        </span>
        <LiveDot label="Booth Live" />
      </footer>
    </Layout>
  );
}

function GameBand({
  index,
  title,
  desc,
  icon: Icon,
  onClick,
}: {
  index: number;
  title: string;
  desc: string;
  icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="tap flex min-h-0 flex-1 items-center gap-4 bg-russian px-4 text-left hover:bg-ink-900"
    >
      <Icon className="size-6 shrink-0 text-violet-500" strokeWidth={1.5} aria-hidden="true" />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-eyebrow-micro font-medium tabular-nums text-violet-500">
            {String(index).padStart(2, '0')}
          </span>
          <h2 className="truncate font-sans text-card-title font-medium text-white">{title}</h2>
        </div>
        <p className="mt-1 font-mono text-body-sm text-[var(--text-on-dark-muted)]">{desc}</p>
      </div>

      <PixelChevron className="shrink-0 text-violet-500" />
    </button>
  );
}
