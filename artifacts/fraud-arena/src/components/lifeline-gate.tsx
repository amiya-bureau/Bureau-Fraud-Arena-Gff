/**
 * LifelineGate — the end-of-run Bureau knowledge question.
 *
 * Shown in two contexts:
 *   'gameover'  — after a game ends; "Run Over. Answer to retry."
 *   'reentry'   — when a player who has already played tries again from home;
 *                 "Attempt Over. Answer to unlock a retry."
 *
 * The question is drawn from the lifeline bank (always Bureau-focused, very
 * low difficulty). A 10-second countdown runs from the moment the gate opens;
 * if the player does not answer correctly before it expires, `onExit` fires
 * and they are returned to the home screen.
 *
 * Correct answer → Retry button unlocks, timer stops.
 * Wrong answer   → Red feedback; player has one attempt (timer continues).
 * Timeout        → `onExit` is called.
 */

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { EyebrowTag } from '@/components/bureau/eyebrow-tag';
import { cn } from '@/lib/utils';
import type { LifelineQuestion } from '@/data/lifeline';

const TIMER_SEC = 10;

interface LifelineGateProps {
  question: LifelineQuestion;
  /** Visual context that titles the screen. */
  context: 'gameover' | 'reentry';
  /** The game name shown in the app bar. */
  gameTitle: string;
  /**
   * Optional score / result display rendered above the question card.
   * Each game passes its own summary JSX here — score stat, tier, image,
   * etc. — so the gate is generic but the display is game-specific.
   */
  scoreDisplay?: ReactNode;
  /** Compact end-of-run treatment for dense graph-game screens. */
  compact?: boolean;
  /** Called when the retry button is tapped (only after a correct answer). */
  onRetry: () => void;
  /** Called when Exit Run is tapped, or when the 10-second timer expires. */
  onExit: () => void;
}

export function LifelineGate({
  question,
  context,
  gameTitle,
  scoreDisplay,
  compact = false,
  onRetry,
  onExit,
}: LifelineGateProps) {
  // Shuffle options once on mount so the correct position varies between
  // question draws. `correctShuffledIdx` tracks where the right answer lands.
  const [{ shuffled, correctShuffledIdx }] = useState(() => {
    const opts = question.options.map((text, i) => ({ text, origIdx: i }));
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    return {
      shuffled: opts,
      correctShuffledIdx: opts.findIndex(o => o.origIdx === question.correctIndex),
    };
  });

  const [timeLeft, setTimeLeft] = useState(TIMER_SEC);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [retryUnlocked, setRetryUnlocked] = useState(false);

  // Countdown — suppressed once the correct answer is given.
  useEffect(() => {
    if (retryUnlocked) return;
    if (timeLeft <= 0) {
      onExit();
      return;
    }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, retryUnlocked, onExit]);

  const handleSelect = (idx: number) => {
    if (selectedIdx !== null) return; // one attempt per question
    setSelectedIdx(idx);
    if (idx === correctShuffledIdx) setRetryUnlocked(true);
  };

  const isCorrect = selectedIdx !== null && selectedIdx === correctShuffledIdx;
  const isWrong   = selectedIdx !== null && selectedIdx !== correctShuffledIdx;

  return (
    <Layout title={gameTitle}>
      <div className="flex min-h-0 flex-1 flex-col pb-4">

        {/* ── Header ── */}
        <div className={cn("shrink-0", compact ? "pt-3" : "pt-4")}>
          <EyebrowTag tone="coral">Lifeline</EyebrowTag>
          <div className={cn(
            "mt-3",
            compact && "flex items-baseline justify-between gap-3"
          )}>
            <h1 className={cn(
              "font-sans font-normal text-white",
              compact ? "text-display-md" : "text-display-lg"
            )}>
              {context === 'reentry' ? 'Attempt Over.' : 'Run Over.'}
            </h1>
            {compact && scoreDisplay ? (
              <div className="shrink-0">{scoreDisplay}</div>
            ) : null}
          </div>
          <p className={cn(
            "text-body-sm text-[var(--text-on-dark-muted)]",
            compact ? "mt-1" : "mt-2"
          )}>
            {context === 'reentry'
              ? 'You have already played this game. Answer the lifeline question to unlock a retry.'
              : 'Answer the lifeline question to unlock a retry.'}
          </p>
        </div>

        {/* ── Game-specific score / result display ── */}
        {scoreDisplay && !compact && (
          <div className="mt-4 shrink-0">
            {scoreDisplay}
          </div>
        )}

        {/* ── Lifeline question card ── */}
        <div className={cn(
          "border border-amber-500/40 bg-[rgba(245,158,11,0.04)]",
          compact
            ? "mt-3 min-h-0 flex-1 overflow-y-auto"
            : "mt-4 shrink-0"
        )}>

          {/* Card header: label + status */}
          <div className={cn(
            "flex items-center justify-between gap-3 border-b border-amber-500/20",
            compact ? "px-3 py-2" : "px-4 py-2.5"
          )}>
            <span className={cn(
              "font-mono font-medium uppercase tracking-[0.03em] text-amber-500",
              compact ? "text-[12px]" : "text-eyebrow-micro"
            )}>
              {question.type === 'logo' ? 'Find the Logo' : 'Lifeline Question'}
            </span>
            <span className={cn(
              "font-mono font-medium tabular-nums transition-colors duration-300",
              compact ? "text-[12px]" : "text-eyebrow-micro",
              isCorrect ? "text-lime-400"
                : isWrong ? "text-coral-600"
                : timeLeft <= 3 ? "text-coral-600 animate-pulse"
                : "text-[var(--text-on-dark-muted)]"
            )}>
              {isCorrect ? '✓ Retry unlocked' : isWrong ? 'Incorrect' : `${timeLeft}s`}
            </span>
          </div>

          {/* Countdown bar — fills amber → drains; goes lime on correct */}
          <div className="h-0.5 w-full bg-ink-800">
            <div
              className={cn(
                "h-full",
                !retryUnlocked && timeLeft < TIMER_SEC && "transition-[width] duration-1000 ease-linear",
                isCorrect ? "bg-lime-400" : timeLeft <= 3 ? "bg-coral-600" : "bg-amber-500"
              )}
              style={{ width: retryUnlocked ? '100%' : `${(timeLeft / TIMER_SEC) * 100}%` }}
            />
          </div>

          {/* Question stem */}
          <div className={cn(
            compact ? "px-4 pb-3 pt-4" : "px-4 pb-3 pt-4"
          )}>
            <p className={cn(
              "font-sans leading-snug text-white",
              compact ? "text-card-title font-medium" : "text-body-md"
            )}>
              {question.stem}
            </p>
          </div>

          {/* Options */}
          <div className={cn(
            "flex flex-col stagger-in",
            compact ? "gap-2 px-4 pb-4" : "gap-2 px-4 pb-4"
          )}>
            {shuffled.map((opt, idx) => {
              const isThisCorrect = idx === correctShuffledIdx;
              const isSelected    = selectedIdx === idx;
              const showResult    = selectedIdx !== null;

              return (
                <button
                  key={idx}
                  disabled={selectedIdx !== null}
                  onClick={() => handleSelect(idx)}
                  className={cn(
                    "tap flex w-full items-center border text-left transition-colors duration-[var(--dur-base)]",
                    compact ? "gap-3 px-4 py-3.5" : "gap-3 px-4 py-3",
                    !showResult && "border-ink-700 bg-ink-900 hover:border-amber-500/60",
                    showResult && isThisCorrect && "border-lime-400/60 bg-lime-400/8",
                    showResult && isSelected && !isThisCorrect && "border-coral-600/60 bg-coral-600/8",
                    showResult && !isSelected && !isThisCorrect && "border-ink-800 bg-ink-900 opacity-30",
                  )}
                >
                  <span className={cn(
                    "shrink-0 font-mono font-medium tabular-nums",
                    "text-eyebrow-micro",
                    showResult && isThisCorrect ? "text-lime-400" : "text-amber-500",
                  )}>
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className={cn(
                    "min-w-0 flex-1 font-sans leading-snug text-body-md",
                    showResult && isThisCorrect ? "text-lime-300" : "text-white",
                  )}>
                    {opt.text}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Actions ── */}
        <div className={cn(
          "mt-auto flex shrink-0 flex-col",
          compact ? "gap-2 pt-3" : "gap-3 pt-5"
        )}>
          <Button
            size={compact ? 'sm' : 'lg'}
            variant="light"
            chevron
            disabled={!retryUnlocked}
            onClick={retryUnlocked ? onRetry : undefined}
            className={cn("w-full", compact && "min-h-[64px] py-5")}
          >
            Retry
          </Button>
          <Button size={compact ? 'sm' : 'lg'} variant="outline" onClick={onExit} className={cn("w-full", compact && "min-h-[64px] py-5")}>
            Exit Run
          </Button>
        </div>
      </div>
    </Layout>
  );
}
