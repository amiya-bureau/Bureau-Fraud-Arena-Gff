import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useGetLeaderboard } from '@workspace/api-client-react';
import { QrPanel } from '@/components/qr-panel';
import { ShieldAlert, Fingerprint, Network, ScanFace, type LucideIcon } from 'lucide-react';
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
  'Passing every KYC check is not evidence of legitimacy — rings are designed to pass them.',
  "A bust-out looks like your best cohort right up until the week it doesn't.",
];

export default function Home() {
  const [, setLocation] = useLocation();
  const [signalIndex, setSignalIndex] = useState(0);

  const { data: leaderboardData } = useGetLeaderboard({ limit: 5 });

  useEffect(() => {
    const timer = setInterval(() => {
      setSignalIndex((i) => (i + 1) % SIGNALS.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const rows = leaderboardData?.rows ?? [];

  return (
    <Layout showHeader={false}>
      <div className="flex w-full flex-1 flex-col items-stretch gap-stack pt-12 md:flex-row md:gap-card md:pt-20">
        {/* Left: the statement, then the games. */}
        <div className="flex flex-1 flex-col">
          <IconTile icon={ShieldAlert} size={60} />

          <h1 className="mt-6 font-sans text-[13vw] font-normal leading-[100%] tracking-[-0.02em] text-white md:text-display-3xl lg:text-hero lg:leading-[100%]">
            Bureau Fraud Arena.
          </h1>

          <p className="mt-6 max-w-[46ch] text-body-lede text-[var(--text-on-dark-muted)]">
            Three games on how coordinated fraud actually behaves.
          </p>

          {/* The rotating signal, in the technical register. */}
          <div className="mt-8 flex min-h-[76px] items-start border-l border-violet-700 pl-5">
            <p
              key={signalIndex}
              className="max-w-[58ch] animate-fade-in font-mono text-body-md text-[var(--text-on-dark-muted)]"
            >
              {SIGNALS[signalIndex]}
            </p>
          </div>

          <div className="mt-auto grid grid-cols-1 gap-px border border-ink-800 bg-ink-800 pt-0 md:grid-cols-2">
            <GameCard
              title="Spot the Fraud"
              desc="10-level ladder on rings and mules."
              icon={Network}
              onClick={() => setLocation('/spot-the-fraud')}
            />
            <GameCard
              title="Spoof the System"
              desc="Can you beat a liveness detector?"
              icon={ScanFace}
              onClick={() => setLocation('/spoof-the-system')}
            />
            <GameCard
              title="Fraud Detective"
              desc="Follow the money through graph cases."
              icon={Fingerprint}
              onClick={() => setLocation('/fraud-detective')}
            />
            <GameCard
              title="Leaderboard"
              desc="See who is winning."
              onClick={() => setLocation('/leaderboard')}
            />
          </div>
        </div>

        {/* Right: a white board floating on the near-black field, then the QR block. */}
        <div className="flex w-full flex-col gap-px md:w-[380px]">
          <div className="flex flex-1 flex-col bg-white p-8 text-russian">
            <div className="flex items-baseline justify-between">
              <h2 className="font-mono text-eyebrow font-medium uppercase tracking-[0.03em] text-russian">
                Top 5 Today
              </h2>
              {rows.length > 0 ? (
                <span className="inline-flex items-center gap-2">
                  <span
                    className="size-1.5 shrink-0 animate-live-pulse bg-violet-700"
                    aria-hidden="true"
                  />
                  <span className="font-mono text-body-sm font-medium uppercase tracking-[0.03em] text-[var(--text-muted)]">
                    Live
                  </span>
                </span>
              ) : null}
            </div>

            <hr className="mt-6 h-px w-full border-0 bg-ice-300" />

            <div className="flex flex-1 flex-col">
              {rows.map((row) => (
                <div
                  key={row.playerId}
                  className="flex items-center gap-4 border-b border-ice-300 py-4"
                >
                  <span className="w-6 shrink-0 font-mono text-body-md font-medium tabular-nums text-violet-700">
                    {row.rank}
                  </span>
                  <div className="flex-1 overflow-hidden">
                    <div className="truncate font-sans text-body-lg font-medium text-russian">
                      {row.displayName}
                    </div>
                    <div className="truncate font-mono text-body-sm uppercase tracking-[0.03em] text-[var(--text-muted)]">
                      {row.company}
                    </div>
                  </div>
                  <span className="font-sans text-card-title font-medium tabular-nums text-russian">
                    {row.total}
                  </span>
                </div>
              ))}

              {rows.length === 0 && (
                <div className="flex flex-1 items-center justify-center py-12">
                  <p className="font-mono text-body-sm uppercase tracking-[0.03em] text-[var(--text-faint)]">
                    Awaiting challengers
                  </p>
                </div>
              )}
            </div>
          </div>

          <QrPanel game="" size={150} />
        </div>
      </div>

      <footer className="mt-stack flex flex-wrap items-center justify-between gap-4 border-t border-ink-800 pt-6">
        <EyebrowTag tone="muted">Global Fintech Fest 2026</EyebrowTag>
        <LiveDot label="Booth Live" />
      </footer>
    </Layout>
  );
}

function GameCard({
  title,
  desc,
  icon: Icon,
  onClick,
}: {
  title: string;
  desc: string;
  icon?: LucideIcon;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-start bg-russian p-8 text-left transition-colors duration-[var(--dur-base)] ease-[var(--ease-standard)] hover:bg-ink-900"
    >
      <div className="flex w-full items-start justify-between">
        {Icon ? (
          <Icon className="size-7 text-violet-500" strokeWidth={1.5} aria-hidden="true" />
        ) : (
          <span className="size-7" />
        )}
        <PixelChevron className="mt-1 text-violet-500" />
      </div>
      <h3 className="mt-8 font-sans text-card-title font-medium text-white">{title}</h3>
      <p className="mt-2 font-mono text-body-sm text-[var(--text-on-dark-muted)]">{desc}</p>
    </button>
  );
}
