/**
 * The shared arena masthead: event badge, hero title, and rotating signal.
 *
 * Used by both the Arena (home) and Leaderboard screens so the top of the app
 * feels like one continuous surface as the player switches between tabs.
 */
import { useState, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';
import { IconTile } from '@/components/bureau/icon-tile';
import { EyebrowTag } from '@/components/bureau/eyebrow-tag';

const SIGNALS = [
  "Rings vary identity data because it's cheap, and reuse devices because they aren't.",
  'Roughly 60% of identified mule accounts are more than a year old.',
  'Passing every KYC check is not evidence of legitimacy.',
  "A bust-out looks like your best cohort right up until the week it doesn't.",
];

export function ArenaHeader() {
  const [signalIndex, setSignalIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSignalIndex((i) => (i + 1) % SIGNALS.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="shrink-0 pt-5">
      {/* Event badge row */}
      <div className="flex items-center gap-3">
        <IconTile icon={ShieldAlert} size={40} />
        <EyebrowTag tone="muted">Global Fintech Fest 2026</EyebrowTag>
      </div>

      {/* Hero title */}
      <h1 className="mt-4 font-sans text-hero font-normal text-white">Bureau Fraud Arena.</h1>

      {/* Rotating signal */}
      <div className="mt-4 flex h-[58px] items-start border-l border-violet-700 pl-3">
        <p
          key={signalIndex}
          className="animate-fade-in font-mono text-body-sm text-[var(--text-on-dark-muted)]"
        >
          {SIGNALS[signalIndex]}
        </p>
      </div>
    </div>
  );
}
