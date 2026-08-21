import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useLocation } from 'wouter';
import { usePlayerSession } from '@/lib/store';
import { Layout, ScreenBody } from '@/components/layout';
import { RulesScreen } from '@/components/rules-screen';
import { Button } from '@/components/ui/button';
import {
  useDetectSpoof,
  useGetPlayerStanding,
  useSubmitRun,
  type DetectorVerdict,
  type RunInput,
} from '@workspace/api-client-react';
import { v4 as uuidv4 } from 'uuid';
import { ShieldAlert } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';
import {
  EyebrowTag,
  IconTile,
  LiveDot,
  ScanFrame,
  StatReadout,
} from '@/components/bureau';
import { GameEndScreen } from '@/components/game-end-screen';
import { LifelineGate } from '@/components/lifeline-gate';
import { fetchLifelineQuestion, type LifelineQuestion } from '@/lib/gamePack';

type GameLevel = 1 | 2 | 3;
type GameState = 'rules' | 'uploading' | 'detecting' | 'reveal' | 'decision' | 'lifeline' | 'highscore' | 'error';

type Attempt = {
  level: GameLevel;
  fooled: boolean;
  confidence: number;
};

/** Points added by clearing each level; the three clears total 100 points. */
const LEVEL_CLEAR_POINTS: Record<GameLevel, number> = { 1: 17, 2: 33, 3: 50 };
/** Cumulative leaderboard score after each successful level. */
const LEVEL_TOTAL_POINTS: Record<GameLevel, number> = { 1: 17, 2: 50, 3: 100 };
const DETECTING_MESSAGES = [
  'Extracting frequency vectors…',
  'Running noise-residual analysis…',
  'Checking compression history…',
  'Mapping facial-landmark geometry…',
  'Evaluating adversarial robustness…',
  'Scoring synthetic artefacts…',
  'Cross-referencing detector ensemble…',
];

const SIGNAL_DESCRIPTIONS: Record<string, string> = {
  'Frequency-domain artefacts': 'High-frequency noise patterns inconsistent with natural capture.',
  'Noise-residual consistency': 'The noise residual is too uniform to be camera output.',
  'Facial-landmark geometry': 'Micro-asymmetries in specular reflections were detected.',
  'Compression-history analysis': 'Expected camera compression traces are missing.',
  'Colour-channel correlation': 'Chroma correlations diverge at high-contrast edges.',
};

function pointsBeforeLevel(level: GameLevel) {
  return level === 1 ? 0 : level === 2 ? 17 : 50;
}

function pointsBankedAfter(level: GameLevel) {
  return LEVEL_TOTAL_POINTS[level];
}

function QrCodeBlock() {
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return <QRCodeSVG value={`${origin}${base}/spoof-the-system?src=qr`} size={180} level="M" />;
}

export default function SpoofTheSystem() {
  const { session } = usePlayerSession();
  const [, setLocation] = useLocation();
  const { data: standing } = useGetPlayerStanding(session?.player.id || '', 'today');
  const submitRun = useSubmitRun();
  const detectSpoof = useDetectSpoof();

  const [gameState, setGameState] = useState<GameState>('rules');
  const [level, setLevel] = useState<GameLevel>(1);
  const [attemptsData, setAttemptsData] = useState<Attempt[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<DetectorVerdict | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [detectMsgIndex, setDetectMsgIndex] = useState(0);
  const [detectProgress, setDetectProgress] = useState(0);
  const [revealStep, setRevealStep] = useState(0);
  const [revealCountdown, setRevealCountdown] = useState(5);
  const [finalResult, setFinalResult] = useState<any>(null);
  const [lifelineQuestion, setLifelineQuestion] = useState<LifelineQuestion | null>(null);
  const [lifelineContext, setLifelineContext] = useState<'gameover' | 'reentry'>('gameover');

  const runIdRef = useRef('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const signalsScrollRef = useRef<HTMLDivElement>(null);
  const lastPayloadRef = useRef<RunInput | null>(null);
  const lastRunWasHighScoreRef = useRef(false);
  const revealTransitionRef = useRef(false);
  const reentryChecked = useRef(false);

  useEffect(() => {
    if (!runIdRef.current) runIdRef.current = uuidv4();
  }, []);

  useEffect(() => {
    fetchLifelineQuestion().then(setLifelineQuestion);
  }, []);

  useEffect(() => {
    if (!reentryChecked.current && standing && gameState === 'rules') {
      reentryChecked.current = true;
      const hasPlayed = (standing as any).scores?.find(
        (score: any) => score.game === 'spoof_the_system',
      )?.played;
      if (hasPlayed) {
        setLifelineContext('reentry');
        setGameState('lifeline');
      }
    }
  }, [standing, gameState]);

  useEffect(() => {
    if (gameState !== 'detecting') {
      setDetectMsgIndex(0);
      setDetectProgress(0);
      return;
    }

    const startedAt = Date.now();
    const progressTimer = window.setInterval(() => {
      setDetectProgress(Math.min(95, ((Date.now() - startedAt) / 20_000) * 100));
    }, 200);
    const messageTimer = window.setInterval(() => {
      setDetectMsgIndex((index) => (index + 1) % DETECTING_MESSAGES.length);
    }, 3_000);

    return () => {
      window.clearInterval(progressTimer);
      window.clearInterval(messageTimer);
    };
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'reveal' || !verdict || revealStep > verdict.signals.length) return;
    const timer = window.setTimeout(() => setRevealStep((step) => step + 1), 600);
    return () => window.clearTimeout(timer);
  }, [gameState, verdict, revealStep]);

  const showPostRun = (result: any, highScore = false) => {
    setFinalResult(result);
    setLifelineContext('gameover');
    setGameState(highScore ? 'highscore' : 'lifeline');
  };

  const endRun = (points: number, quitVoluntarily: boolean, finalAttempts: Attempt[]) => {
    const fooledCount = finalAttempts.filter((attempt) => attempt.fooled).length;
    const completedPerfectly =
      finalAttempts.length === 3 &&
      finalAttempts.every((attempt) => attempt.fooled);
    lastRunWasHighScoreRef.current = completedPerfectly;
    const payload: RunInput = {
      playerId: session?.player.id ?? '',
      game: 'spoof_the_system',
      points,
      source: new URLSearchParams(window.location.search).get('src') === 'qr' ? 'phone' : 'kiosk',
      idempotencyKey: runIdRef.current,
      detail: {
        attempts: finalAttempts,
        ladderReached: level,
        quitVoluntarily,
        drawPool: fooledCount >= 2 ? 'mystery_prize' : null,
        tier: points >= 50 ? 'Achiever' : 'Participation',
      },
    };

    if (!session) {
      showPostRun(
        { pointsRecorded: points, isPersonalBest: false, standing: { rank: 0, behind: 0 } },
        completedPerfectly,
      );
      return;
    }

    lastPayloadRef.current = payload;
    submitRun.mutate(
      { data: payload },
      {
        onSuccess: (result) => showPostRun(result, completedPerfectly),
        onError: () => setGameState('error'),
      },
    );
  };

  function advanceAfterReveal() {
    if (!verdict || revealTransitionRef.current) return;
    revealTransitionRef.current = true;

    const recorded = attemptsData.some((attempt) => attempt.level === level);
    const finalAttempts = recorded
      ? attemptsData
      : [...attemptsData, { level, fooled: verdict.fooled, confidence: verdict.confidence }];

    if (!recorded) setAttemptsData(finalAttempts);

    if (!verdict.fooled) {
      endRun(pointsBeforeLevel(level), false, finalAttempts);
    } else if (level === 3) {
      endRun(LEVEL_TOTAL_POINTS[3], false, finalAttempts);
    } else {
      setGameState('decision');
    }
  }

  useEffect(() => {
    if (gameState !== 'reveal' || !verdict || revealStep <= verdict.signals.length) return;

    setRevealCountdown(5);
    const timer = window.setTimeout(advanceAfterReveal, 5_000);
    const countdown = window.setInterval(() => {
      setRevealCountdown((seconds) => Math.max(0, seconds - 1));
    }, 1_000);

    return () => {
      window.clearTimeout(timer);
      window.clearInterval(countdown);
    };
  }, [gameState, verdict, revealStep]);

  useEffect(() => {
    if (gameState !== 'reveal' || !signalsScrollRef.current) return;

    const frame = window.requestAnimationFrame(() => {
      const log = signalsScrollRef.current;
      if (log) log.scrollTo({ top: log.scrollHeight, behavior: 'smooth' });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [gameState, revealStep]);

  const startGame = () => {
    // A submitted run keeps its idempotency key so a network retry cannot
    // duplicate it. A deliberately new attempt must get a new key instead.
    runIdRef.current = uuidv4();
    setLevel(1);
    setAttemptsData([]);
    setImagePreview(null);
    setVerdict(null);
    setErrorMsg(null);
    setFinalResult(null);
    lastPayloadRef.current = null;
    lastRunWasHighScoreRef.current = false;
    setGameState('uploading');
  };

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Image must be under 10 MB.');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrorMsg('Only JPEG, PNG and WebP images are supported.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const image = dataUrl.split(',')[1];
      if (!image) {
        setErrorMsg('That image could not be read. Please choose another.');
        return;
      }

      setErrorMsg(null);
      setImagePreview(dataUrl);
      setVerdict(null);
      setRevealStep(0);
       setRevealCountdown(5);
       revealTransitionRef.current = false;
      setGameState('detecting');
      detectSpoof.mutate(
        {
          data: {
            playerId: session?.player.id ?? '',
            level,
            image,
            mimeType: file.type,
            fileName: file.name,
          },
        },
        {
          onSuccess: (result) => {
            setDetectProgress(100);
            setVerdict(result);
            setRevealStep(0);
            setGameState('reveal');
          },
          onError: (error: any) => {
            setErrorMsg(error?.response?.data?.error ?? 'Detector failed to run. Please try again.');
            setGameState('uploading');
          },
        },
      );
    };
    reader.readAsDataURL(file);
  };

  const handleContinue = () => {
    setLevel((current) => (current + 1) as GameLevel);
    setImagePreview(null);
    setVerdict(null);
    setErrorMsg(null);
    setGameState('uploading');
  };

  const handleQuit = () => endRun(pointsBankedAfter(level), true, attemptsData);

  const handleRetrySubmit = () => {
    if (!lastPayloadRef.current) return;
    submitRun.mutate(
      { data: lastPayloadRef.current },
      {
        onSuccess: (result) => showPostRun(result, lastRunWasHighScoreRef.current),
        onError: () => setGameState('error'),
      },
    );
  };

  const resetRun = () => {
    setLevel(1);
    setAttemptsData([]);
    setImagePreview(null);
    setVerdict(null);
    setErrorMsg(null);
    setDetectMsgIndex(0);
    setDetectProgress(0);
    setRevealStep(0);
    setFinalResult(null);
    lastPayloadRef.current = null;
    lastRunWasHighScoreRef.current = false;
    fetchLifelineQuestion().then(setLifelineQuestion);
    setGameState('rules');
  };

  if (gameState === 'rules') {
    return (
      <Layout title="Spoof the System" back="/">
        <RulesScreen
          gameName="Spoof the System"
          premise="Upload a synthetic or AI face and try to fool Bureau's detectors. Each of the three levels gets stricter."
          scoring="Up to 100 points. Clear level 1: 17 pts. Clear level 2: 33 pts. Clear level 3: 50 pts."
          endsWhen="If the detector catches your image, the run ends. Points from earlier levels remain banked."
          lifelines="Bank your score after level 1 or 2, or risk it against a stricter detector. Clearing level 2 or level 3 enters the Mystery prize draw."
          standing={standing}
          gameKey="spoof_the_system"
          onStart={startGame}
        />
      </Layout>
    );
  }

  if (gameState === 'error') {
    return (
      <Layout title="Spoof the System" back="/">
        <ScreenBody>
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 text-center">
            <IconTile icon={ShieldAlert} size={60} />
            <h1 className="mt-6 font-sans text-display-xl font-normal text-white">Save Failed</h1>
            <p className="mt-3 max-w-[32ch] text-body-lg text-[var(--text-on-dark-muted)]">
              We could not record your run due to a network error. Your points are safe.
            </p>
          </div>
          <div className="mt-auto shrink-0 py-4">
            <Button size="lg" onClick={handleRetrySubmit} disabled={submitRun.isPending} chevron className="w-full" variant="light">
              {submitRun.isPending ? 'Retrying' : 'Retry submit'}
            </Button>
          </div>
        </ScreenBody>
      </Layout>
    );
  }

  if (gameState === 'highscore') {
    return (
      <GameEndScreen
        currentGame="spoof_the_system"
        points={finalResult?.pointsRecorded ?? 100}
        standing={finalResult?.standing}
        isPersonalBest={finalResult?.isPersonalBest}
        highScore
      />
    );
  }

  if (gameState === 'lifeline') {
    if (!lifelineQuestion) return null;
    const pointsRecorded = finalResult?.pointsRecorded ?? 0;
    return (
      <LifelineGate
        question={lifelineQuestion}
        context={lifelineContext}
        gameTitle="Spoof the System"
        compact
        scoreDisplay={finalResult ? (
          <div className="relative flex max-w-[58%] flex-wrap items-baseline justify-end gap-x-2 gap-y-0.5 pr-3 text-right">
            <span className="font-sans text-display-md font-normal tabular-nums text-white">{pointsRecorded}</span>
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.03em] text-[var(--text-on-dark-muted)]">
              Points secured
            </span>
            {pointsRecorded >= 50 && (
              <span className="font-mono text-[10px] uppercase tracking-[0.03em] text-violet-400">
                Mystery prize draw
              </span>
            )}
            <span aria-hidden className="absolute right-0 top-0 size-2 bg-violet-700" />
          </div>
        ) : undefined}
        onRetry={resetRun}
        onExit={() => setLocation('/')}
      />
    );
  }

  const isRevealFinished = gameState === 'reveal' && verdict && revealStep > verdict.signals.length;
  const revealTone = isRevealFinished ? (verdict?.fooled ? 'violet' : 'coral') : 'cyan';

  return (
    <Layout
      title="Spoof the System"
      back="/"
      headerRight={
        <span className="font-mono text-eyebrow-micro font-medium uppercase tracking-[0.03em] text-[var(--text-on-dark-muted)]">
          Level {level}/3
        </span>
      }
    >
      {gameState === 'uploading' && (
        <ScreenBody>
          <div className="shrink-0 py-4">
            <EyebrowTag tone="violet">Level {level} upload</EyebrowTag>
            <h1 className="mt-2 font-sans text-display-lg text-white">Select payload</h1>
            <p className="mt-1 text-body-sm text-[var(--text-on-dark-muted)]">
              Choose a JPEG, PNG or WebP image to test the detector.
            </p>
          </div>
          <div className="mt-2 flex min-h-0 flex-1 flex-col">
            <ScanFrame id={`ATTEMPT-L${level}`} tone="violet" className="flex min-h-0 flex-1 flex-col">
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 bg-ink-900 px-8 py-6 text-center">
                <div className="bg-white p-3"><QrCodeBlock /></div>
                <div>
                  <p className="font-mono text-eyebrow-micro font-medium uppercase tracking-[0.03em] text-[var(--text-on-dark-muted)]">
                    Scan to upload from your phone
                  </p>
                  {errorMsg && <p role="alert" className="mt-3 font-mono text-eyebrow-micro uppercase tracking-[0.03em] text-coral-600">{errorMsg}</p>}
                </div>
              </div>
            </ScanFrame>
          </div>
          <div className="mt-auto shrink-0 py-4">
            <Button size="lg" chevron onClick={() => fileInputRef.current?.click()} className="w-full" variant="light">
              Select image
            </Button>
            <input
              ref={fileInputRef}
              className="hidden"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileUpload}
            />
          </div>
        </ScreenBody>
      )}

      {gameState === 'detecting' && (
        <ScreenBody>
          <div className="shrink-0 py-4">
            <EyebrowTag tone="cyan">Analysis active</EyebrowTag>
            <h1 className="mt-2 font-sans text-display-lg text-white">Scanning payload</h1>
          </div>
          <div className="mt-2 flex min-h-0 flex-1 flex-col">
            <ScanFrame id={`ANALYSIS-${runIdRef.current.slice(0, 8).toUpperCase()}`} tone="cyan" className="flex min-h-[18rem] flex-1 flex-col">
              <div className="relative flex min-h-[18rem] flex-1 items-center justify-center overflow-hidden bg-ink-950">
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Uploaded image being scanned"
                    className="absolute inset-0 size-full object-contain p-3 opacity-90 saturate-[0.75]"
                  />
                )}
                <div aria-hidden="true" className="absolute inset-0 bg-ink-950/60" />
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/25 to-ink-950/45" />
                <div className="relative z-10 flex flex-col items-center gap-4 border border-cyan-500/40 bg-ink-950/75 px-5 py-4 text-center shadow-[0_0_28px_rgba(34,211,238,0.12)]">
                  <LiveDot label="Analysis active" />
                  <p key={detectMsgIndex} className="font-mono text-body-sm font-medium text-center text-cyan-400">{DETECTING_MESSAGES[detectMsgIndex]}</p>
                </div>
              </div>
            </ScanFrame>
          </div>
          <div className="mt-auto shrink-0 space-y-2 py-4">
            <div className="h-1.5 overflow-hidden rounded-full bg-ink-800">
              <div className="h-full rounded-full bg-cyan-500 transition-[width] duration-200" style={{ width: `${detectProgress}%` }} />
            </div>
            <div className="flex justify-between font-mono text-eyebrow-micro uppercase">
              <span className="text-[var(--text-on-dark-muted)]">Bureau detector running</span>
              <span className="text-cyan-500">{Math.round(detectProgress)}%</span>
            </div>
          </div>
        </ScreenBody>
      )}

      {gameState === 'reveal' && verdict && (
        <ScreenBody>
          <div className="shrink-0 py-4">
            <EyebrowTag tone={revealTone}>Analysis complete</EyebrowTag>
            <h1 className="mt-2 font-sans text-display-lg text-white">Detector Verdict</h1>
          </div>
          <div className="mt-2 flex min-h-0 flex-1 flex-col">
            <ScanFrame id={`VERDICT-${runIdRef.current.slice(0, 8).toUpperCase()}`} tone={revealTone} className="flex min-h-0 flex-1 flex-col">
              <div className="flex min-h-0 flex-1 flex-col bg-ink-900">
                <div className="relative h-[45%] min-h-[150px] shrink-0 overflow-hidden border-b border-ink-800">
                  {imagePreview && <img src={imagePreview} alt="Analyzed upload" className={cn('size-full object-cover transition-[filter,opacity] duration-500', isRevealFinished ? (verdict.fooled ? 'opacity-80' : 'opacity-50 grayscale') : 'opacity-30 grayscale')} />}
                  {isRevealFinished && !verdict.fooled && verdict.heatmapRegions.map((region, index) => (
                    <div key={index} className="absolute border border-coral-600" style={{ left: `${region.x * 100}%`, top: `${region.y * 100}%`, width: `${region.w * 100}%`, height: `${region.h * 100}%`, backgroundColor: `rgba(253,118,58,${region.intensity * .35})` }} />
                  ))}
                   <div aria-hidden="true" className="absolute inset-0 bg-ink-950/35" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-t from-ink-900/80 to-transparent">
                    {isRevealFinished ? (
                      <>
                         <span className={cn('border px-5 py-2 font-mono text-display-sm font-medium uppercase tracking-[0.05em]', verdict.fooled ? 'border-lime-300 bg-russian/80 text-lime-300' : 'border-coral-600 bg-russian/80 text-coral-600')}>
                           {verdict.fooled ? 'Real Image' : 'Fake Image'}
                        </span>
                        <span className={cn('font-mono text-body-sm uppercase tracking-widest', verdict.fooled ? 'text-lime-300' : 'text-coral-600')}>
                          {verdict.fooled ? `+${LEVEL_CLEAR_POINTS[level]} points` : 'No points awarded'}
                        </span>
                      </>
                    ) : <span className="animate-pulse font-mono text-eyebrow-micro uppercase tracking-[0.03em] text-cyan-500">Reviewing traces…</span>}
                  </div>
                </div>
                <div ref={signalsScrollRef} className="min-h-0 flex-1 overflow-y-auto app-scroll bg-russian">
                  {[...verdict.signals].sort((left, right) => right.score - left.score).slice(0, 3).map((signal, index) => {
                    const visible = revealStep > index;
                     const hit = signal.score > 0.5;
                     const scoreLabel = hit ? 'Synthetic' : 'Real';
                    return (
                      <div key={signal.name} className={cn('border-b border-ink-800 px-4 py-3 transition-opacity duration-300', visible ? 'opacity-100' : 'opacity-0')}>
                        <div className="flex justify-between gap-3 font-mono text-eyebrow-micro uppercase tracking-[0.03em]">
                           <span className={hit ? 'text-coral-600' : 'text-lime-300'}>{signal.name}</span>
                           <span className={cn('flex shrink-0 items-center gap-2', hit ? 'text-coral-600' : 'text-lime-300')}>
                             <span>{scoreLabel}</span>
                             <span>{(signal.score * 100).toFixed(0)}%</span>
                           </span>
                        </div>
                        {isRevealFinished && hit && SIGNAL_DESCRIPTIONS[signal.name] && <p className="mt-1.5 text-body-sm leading-snug text-[var(--text-on-dark-muted)]">{SIGNAL_DESCRIPTIONS[signal.name]}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </ScanFrame>
          </div>
          <div className="mt-auto shrink-0 space-y-2 py-3 text-center font-mono text-eyebrow-micro uppercase tracking-[0.03em]">
            <span className={isRevealFinished ? (verdict.fooled ? 'text-lime-300' : 'text-coral-600') : 'animate-pulse text-[var(--text-on-dark-muted)]'}>
              {isRevealFinished ? (verdict.fooled ? `Real Image · +${LEVEL_CLEAR_POINTS[level]} points` : 'Fake Image · run ends') : 'Reviewing traces…'}
            </span>
            {isRevealFinished && (
              <>
                <p className="text-[var(--text-on-dark-muted)]">Auto continuing in {revealCountdown}s</p>
                <Button size="lg" variant="light" chevron onClick={advanceAfterReveal} className="w-full">
                  Continue
                </Button>
              </>
            )}
          </div>
        </ScreenBody>
      )}

      {gameState === 'decision' && (
        <ScreenBody>
          <div className="shrink-0 py-4">
            <EyebrowTag tone="violet">Level {level} bypassed</EyebrowTag>
            <h1 className="mt-2 font-sans text-display-lg text-white">{pointsBankedAfter(level)} total points banked.</h1>
            <p className="mt-1 text-body-sm text-[var(--text-on-dark-muted)]">
              Level {level} added {LEVEL_CLEAR_POINTS[level]} points. Bank your score, or risk it against a stricter detector.
            </p>
          </div>
          <div className="flex min-h-0 flex-1 flex-col justify-center py-4">
            <div className="flex flex-col gap-px border border-ink-800 bg-ink-800 p-px">
              {[100, 50, 17, 0].map((points) => {
                const achieved = points > 0 && pointsBankedAfter(level) >= points;
                const target = points === LEVEL_TOTAL_POINTS[(level + 1) as GameLevel];
                return (
                  <div key={points} className={cn('flex items-center justify-between px-4 py-3', achieved ? 'bg-violet-700 text-white' : target ? 'border-l-[3px] border-violet-700 bg-ink-900 text-white' : 'bg-russian text-[var(--text-on-dark-muted)]')}>
                    <span className="font-mono text-body-sm font-medium uppercase tracking-[0.03em]">{points === 0 ? 'Detected' : `${points} point level`}</span>
                    <span className="font-mono text-body-sm tabular-nums">{points}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-auto flex shrink-0 flex-col gap-3 py-4">
            <Button size="lg" chevron onClick={handleContinue} className="w-full" variant="light">Risk level {level + 1}</Button>
            <Button size="lg" variant="outline" onClick={handleQuit} className="w-full">Take {pointsBankedAfter(level)} pts</Button>
          </div>
        </ScreenBody>
      )}
    </Layout>
  );
}