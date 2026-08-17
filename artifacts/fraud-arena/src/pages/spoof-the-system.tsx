import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { usePlayerSession } from '@/lib/store';
import { Layout, ScreenBody } from '@/components/layout';
import { RulesScreen } from '@/components/rules-screen';
import { Button } from '@/components/ui/button';
import {
  useSubmitRun,
  useGetPlayerStanding,
  RunInput,
  DetectorVerdict,
  useDetectSpoof,
} from '@workspace/api-client-react';
import { v4 as uuidv4 } from 'uuid';
import { UploadCloud, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  EyebrowTag,
  IconTile,
  LiveDot,
  StatReadout,
  ScanFrame,
} from '@/components/bureau';
import { LifelineGate } from '@/components/lifeline-gate';
import { fetchLifelineQuestion, type LifelineQuestion } from '@/lib/gamePack';

const SIGNAL_DESCRIPTIONS: Record<string, string> = {
  'Frequency-domain artefacts': 'High-frequency noise patterns inconsistent with natural capture.',
  'Noise-residual consistency':
    'The noise residual across your image is too uniform to be camera output.',
  'Facial-landmark geometry': 'Micro-asymmetries in specular reflections detected.',
  'Compression-history analysis':
    'Missing multiple JPEG compression generations expected for a photo.',
  'Colour-channel correlation': 'Chroma subsampling anomalies in high-contrast edge regions.',
};

type GameState =
  | 'rules'
  | 'uploading'
  | 'detecting'
  | 'reveal'
  | 'decision'
  | 'gameover'
  | 'lifeline'
  | 'error';


/**
 * An inline QR code that points at the Spoof the System game.
 * We render it with qrcode.react directly so the size tracks the container.
 */
import { QRCodeSVG } from 'qrcode.react';

function QrCodeBlock() {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const url = `${origin}${base}/spoof-the-system?src=qr`;
  return <QRCodeSVG value={url} size={200} level="M" />;
}

export default function SpoofTheSystem() {
  const { session } = usePlayerSession();
  const [, setLocation] = useLocation();
  const { data: standing } = useGetPlayerStanding(session?.player.id || '', 'today');
  const submitRun = useSubmitRun();
  const detectSpoof = useDetectSpoof();

  const [gameState, setGameState] = useState<GameState>('rules');
  const [level, setLevel] = useState<1 | 2 | 3>(1);
  const [attemptsData, setAttemptsData] = useState<any[]>([]);

  const runIdRef = useRef<string>('');
  useEffect(() => {
    if (!runIdRef.current) {
      runIdRef.current = uuidv4();
    }
  }, []);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<DetectorVerdict | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Detecting screen — cycling status messages + progress bar
  const DETECTING_MESSAGES = [
    'Extracting frequency vectors…',
    'Running noise-residual analysis…',
    'Checking compression history…',
    'Mapping facial-landmark geometry…',
    'Evaluating adversarial robustness…',
    'Scoring synthetic artefacts…',
    'Cross-referencing detector ensemble…',
    'Reviewing traces…',
  ];
  const DETECTING_DURATION_MS = 20_000; // bar fills over this window
  const [detectMsgIdx, setDetectMsgIdx] = useState(0);
  const [detectProgress, setDetectProgress] = useState(0); // 0–100

  useEffect(() => {
    if (gameState !== 'detecting') {
      setDetectMsgIdx(0);
      setDetectProgress(0);
      return;
    }
    const start = Date.now();
    // Progress bar: tick every 200 ms, cap at 95 so it never completes before API returns
    const progressTimer = setInterval(() => {
      const elapsed = Date.now() - start;
      setDetectProgress(Math.min(95, (elapsed / DETECTING_DURATION_MS) * 100));
    }, 200);
    // Message cycle: advance every 3 s
    const msgTimer = setInterval(() => {
      setDetectMsgIdx((i) => (i + 1) % DETECTING_MESSAGES.length);
    }, 3_000);
    return () => {
      clearInterval(progressTimer);
      clearInterval(msgTimer);
    };
  }, [gameState]);

  // Reveal animation states
  const [revealStep, setRevealStep] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const startGame = () => setGameState('uploading');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Image must be under 10MB');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg('Only JPEG, PNG and WebP are supported.');
      return;
    }

    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setImagePreview(result);
      setGameState('detecting');

      // Strip data URL prefix for the API
      const base64 = result.split(',')[1];

      detectSpoof.mutate(
        {
          data: {
            playerId: session?.player.id || '',
            level,
            image: base64,
            mimeType: file.type,
            fileName: file.name,
          },
        },
        {
          onSuccess: (res) => {
            setVerdict(res);
            setGameState('reveal');
            setRevealStep(0);
          },
          onError: (err: any) => {
            console.error(err);
            setErrorMsg(err?.response?.data?.error || 'Detector failed to run. Please try again.');
            setGameState('uploading');
          },
        }
      );
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (gameState === 'reveal' && verdict) {
      const totalSignals = verdict.signals.length;
      if (revealStep <= totalSignals) {
        const timer = setTimeout(() => {
          setRevealStep((s) => s + 1);
        }, 600); // short stagger
        return () => clearTimeout(timer);
      }
    }
    return undefined;
  }, [gameState, revealStep, verdict]);

  // No consolation points for a failed attempt — only previously banked wins carry forward.
  const failPoints = level === 1 ? 0 : level === 2 ? 40 : 60;
  const winPoints = level === 1 ? 40 : level === 2 ? 60 : 75;

  const handleContinue = () => {
    setLevel((l) => (l + 1) as 1 | 2 | 3);
    setImagePreview(null);
    setVerdict(null);
    setGameState('uploading');
  };

  const handleQuit = () => {
    endRun(winPoints, true, attemptsData);
  };

  const [finalResult, setFinalResult] = useState<any>(null);
  const lastPayloadRef = useRef<RunInput | null>(null);
  const [lifelineQuestion, setLifelineQuestion] = useState<LifelineQuestion | null>(null);
  const [lifelineContext, setLifelineContext] = useState<'gameover' | 'reentry'>('gameover');
  const reentryChecked = useRef(false);

  const endRun = (pts: number, quitVoluntarily: boolean, finalAttempts: any[]) => {
    let tier = 'Participation';
    let drawPool = null;

    const foolsCount = finalAttempts.filter((a) => a.fooled).length;
    if (foolsCount === 2) drawPool = 'airpods';
    if (foolsCount === 3) drawPool = 'ipad';

    if (pts >= 40) tier = 'Achiever';

    if (session) {
      const payload: RunInput = {
        playerId: session.player.id,
        game: 'spoof_the_system',
        points: pts,
        source:
          new URLSearchParams(window.location.search).get('src') === 'qr' ? 'phone' : 'kiosk',
        idempotencyKey: runIdRef.current,
        detail: {
          attempts: finalAttempts,
          ladderReached: level,
          quitVoluntarily,
          drawPool,
          tier,
        },
      };

      lastPayloadRef.current = payload;

      submitRun.mutate(
        { data: payload },
        {
          onSuccess: (res) => {
            setFinalResult(res);
            setLifelineContext('gameover');
            setGameState('lifeline');
          },
          onError: () => {
            setGameState('error');
          },
        }
      );
    } else {
      setFinalResult({
        pointsRecorded: pts,
        isPersonalBest: false,
        standing: { rank: 0, behind: 0 },
      });
      setLifelineContext('gameover');
      setGameState('lifeline');
    }
  };

  const handleRetrySubmit = () => {
    if (lastPayloadRef.current) {
      submitRun.mutate(
        { data: lastPayloadRef.current },
        {
          onSuccess: (res) => {
            setFinalResult(res);
            setLifelineContext('gameover');
            setGameState('lifeline');
          },
          onError: () => {
            setGameState('error');
          },
        }
      );
    }
  };

  // Eager-fetch a lifeline question so it is ready when the gate opens.
  useEffect(() => {
    fetchLifelineQuestion().then(setLifelineQuestion);
  }, []);

  // Reentry gate: if this player has already completed this game today, gate
  // them with the lifeline before they can start a new run. The ref prevents
  // the check from firing twice when the standing query re-resolves.
  useEffect(() => {
    if (!reentryChecked.current && standing && gameState === 'rules') {
      reentryChecked.current = true;
      const hasPlayed = (standing as any).scores?.find((s: any) => s.game === 'spoof_the_system')?.played;
      if (hasPlayed) {
        setLifelineContext('reentry');
        setGameState('lifeline');
      }
    }
  }, [standing, gameState]);

  useEffect(() => {
    if (gameState === 'reveal' && verdict && revealStep > verdict.signals.length) {
      let finalAttempts = attemptsData;
      setAttemptsData((prev) => {
        const newData = [...prev];
        // avoid duplicates if effect re-runs
        if (!newData.some((a) => a.level === level)) {
          newData.push({ level, fooled: verdict.fooled, confidence: verdict.confidence });
        }
        finalAttempts = newData;
        return newData;
      });

      // Game-over transitions get 10 s so the player can read the verdict.
      // Moving to the decision screen (continue) stays at 3 s.
      const isGameOver = !verdict.fooled || level === 3;
      const timer = setTimeout(() => {
        if (!verdict.fooled) {
          endRun(failPoints, false, finalAttempts);
        } else if (level === 3) {
          endRun(75, false, finalAttempts);
        } else {
          setGameState('decision');
        }
      }, isGameOver ? 10000 : 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [gameState, verdict, revealStep]);

  if (gameState === 'rules') {
    return (
      <Layout title="Spoof the System" back="/">
        <RulesScreen
          gameName="Spoof the System"
          premise="Generate a synthetic or AI face on your phone, upload it, and try to fool Bureau's detectors. Three attempts, getting stricter every time."
          scoring="Up to 75 points. Beat level 1: 40 pts. Beat level 2: 60 pts. Beat level 3: 75 pts. Caught with nothing banked: 0 pts."
          endsWhen="If the detector catches you, your run ends. Banked points are kept."
          lifelines="You can walk away with your banked points after beating level 1 or 2. AirPods finale entry for level 2, iPad entry for level 3."
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
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-center px-4">
            <IconTile icon={ShieldAlert} size={60} />
            <h1 className="mt-6 font-sans text-display-xl font-normal text-white">Save Failed</h1>
            <p className="mt-3 max-w-[32ch] text-body-lg text-[var(--text-on-dark-muted)]">
              We couldn't record your run due to a network error. Your points are safe.
            </p>
          </div>
          
          <div className="shrink-0 py-4 mt-auto">
            <Button size="lg" onClick={handleRetrySubmit} disabled={submitRun.isPending} chevron className="w-full" variant="light">
              {submitRun.isPending ? 'Retrying' : 'Retry Submit'}
            </Button>
          </div>
        </ScreenBody>
      </Layout>
    );
  }

  if (gameState === 'lifeline') {
    if (!lifelineQuestion) return null;
    let finalTier = 'Participation';
    let finalDraw = 'None';
    if (finalResult) {
      if (finalResult.pointsRecorded >= 40) finalTier = 'Achiever';
      if (finalResult.pointsRecorded === 60) finalDraw = 'AirPods Draw';
      if (finalResult.pointsRecorded === 75) finalDraw = 'iPad MEGA Draw';
    }
    return (
      <LifelineGate
        question={lifelineQuestion}
        context={lifelineContext}
        gameTitle="Spoof the System"
        scoreDisplay={finalResult ? (
          <div className="flex flex-col items-center gap-2 text-center py-2">
            <StatReadout value={finalResult.pointsRecorded} caption="Points Secured" size="sm" tone="on-dark" />
            <p className="font-mono text-eyebrow-micro uppercase tracking-[0.03em] text-[var(--text-on-dark-muted)]">
              Tier <span className="ml-2 text-white">{finalTier}</span>
            </p>
            {finalDraw !== 'None' && (
              <p className="font-mono text-eyebrow-micro uppercase tracking-[0.03em] text-violet-400">
                Qualified for {finalDraw}
              </p>
            )}
          </div>
        ) : undefined}
        onRetry={() => {
          setLevel(1);
          setAttemptsData([]);
          setImagePreview(null);
          setVerdict(null);
          setErrorMsg(null);
          setDetectMsgIdx(0);
          setDetectProgress(0);
          setRevealStep(0);
          setFinalResult(null);
          lastPayloadRef.current = null;
          fetchLifelineQuestion().then(setLifelineQuestion);
          setGameState('rules');
        }}
        onExit={() => setLocation('/')}
      />
    );
  }

  // --- Main game flow (uploading, detecting, reveal, decision) ---

  const isRevealFinished = gameState === 'reveal' && verdict && revealStep > verdict.signals.length;
  let revealTone: 'violet' | 'coral' | 'cyan' = 'cyan';
  if (gameState === 'reveal' && isRevealFinished && verdict) {
    revealTone = verdict.fooled ? 'violet' : 'coral';
  }

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
            <EyebrowTag tone="violet">Level {level} Upload</EyebrowTag>
            <h1 className="mt-2 font-sans text-display-lg text-white">Select Payload</h1>
            <p className="mt-1 text-body-sm text-[var(--text-on-dark-muted)]">
              Provide a synthetic face to test the detector.
            </p>
          </div>
          
          <div className="flex-1 min-h-0 flex flex-col relative mt-2">
            {/* The frame takes the whole free column: a dropzone that stops
                short of the CTA reads as a stray box rather than a target. */}
            <ScanFrame id={`ATTEMPT-L${level}`} tone="violet" className="flex-1 min-h-0 flex flex-col">
              {/*
               * The frame IS the QR: scanning it opens this screen on the
               * visitor's own phone so they can pick from their camera roll.
               * We size the code to fill the available height so it is
               * readable from arm's length at the booth.
               */}
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 bg-ink-900 px-8 py-6 text-center">
                <div className="bg-white p-3">
                  <QrCodeBlock />
                </div>
                <div>
                  <p className="font-mono text-eyebrow-micro font-medium uppercase tracking-[0.03em] text-[var(--text-on-dark-muted)]">
                    Scan to upload from your phone
                  </p>
                  <p className="mt-1 text-body-sm text-[var(--text-on-dark-faint)]">
                    Use your camera to pick a synthetic face.
                  </p>
                  {errorMsg && (
                    <p className="mt-3 font-mono text-eyebrow-micro uppercase tracking-[0.03em] text-coral-600">
                      {errorMsg}
                    </p>
                  )}
                </div>
              </div>
            </ScanFrame>
          </div>
          
          <div className="shrink-0 py-4 mt-auto">
            <Button
              size="lg"
              chevron
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
              variant="light"
            >
              Select Image
            </Button>
            <input
              type="file"
              accept="image/jpeg, image/png, image/webp"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
          </div>
        </ScreenBody>
      )}

      {gameState === 'detecting' && (
        <ScreenBody>
          <div className="shrink-0 py-4">
            <EyebrowTag tone="cyan">Analysis Active</EyebrowTag>
            <h1 className="mt-2 font-sans text-display-lg text-white">Scanning Payload</h1>
          </div>

          <div className="flex-1 min-h-0 flex flex-col relative mt-2">
            <ScanFrame id={`ANALYSIS-${runIdRef.current.substring(0, 8).toUpperCase()}`} tone="cyan">
              <div className="flex-1 min-h-0 relative flex flex-col items-center justify-center overflow-hidden bg-ink-900">
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Upload"
                    className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-luminosity grayscale"
                  />
                )}
                <div className="relative z-10 flex flex-col items-center gap-4 px-6 w-full">
                  <LiveDot label="Analysis Active" />
                  {/* Cycling status message */}
                  <h2
                    key={detectMsgIdx}
                    className="font-mono text-body-sm font-medium text-center text-cyan-400 animate-fade-in"
                  >
                    {DETECTING_MESSAGES[detectMsgIdx]}
                  </h2>
                </div>
              </div>
            </ScanFrame>
          </div>

          {/* Progress bar */}
          <div className="shrink-0 pt-4 pb-2 mt-auto space-y-2">
            <div className="w-full h-1.5 bg-ink-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full transition-[width] duration-200 ease-linear"
                style={{ width: `${detectProgress}%` }}
              />
            </div>
            <div className="flex justify-between">
              <span className="font-mono text-eyebrow-micro uppercase text-[var(--text-on-dark-muted)]">
                Bureau Detector Running
              </span>
              <span className="font-mono text-eyebrow-micro text-cyan-600">
                {Math.round(detectProgress)}%
              </span>
            </div>
          </div>
        </ScreenBody>
      )}

      {gameState === 'reveal' && verdict && (
        <ScreenBody>
          <div className="shrink-0 py-4">
            <EyebrowTag tone={revealTone}>Analysis Complete</EyebrowTag>
            <h1 className="mt-2 font-sans text-display-lg text-white">Detector Verdict</h1>
          </div>

          <div className="flex-1 min-h-0 flex flex-col relative mt-2">
            <ScanFrame id={`VERDICT-${runIdRef.current.substring(0, 8).toUpperCase()}`} tone={revealTone}>
              <div className="flex-1 min-h-0 flex flex-col bg-ink-900">

                {/* ── Hero image + verdict overlay ── */}
                <div className="relative shrink-0 h-[48%] min-h-[160px] border-b border-ink-800 overflow-hidden">
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Upload"
                      className={cn(
                        'h-full w-full object-cover transition-[opacity,filter] duration-500',
                        isRevealFinished
                          ? verdict.fooled ? 'opacity-80' : 'opacity-50 grayscale'
                          : 'opacity-30 grayscale'
                      )}
                    />
                  )}

                  {/* Heatmap boxes (caught only) */}
                  {isRevealFinished && !verdict.fooled &&
                    verdict.heatmapRegions.map((box, i) => (
                      <div
                        key={i}
                        className="absolute animate-resolve-in border border-coral-600"
                        style={{
                          left: `${box.x * 100}%`,
                          top: `${box.y * 100}%`,
                          width: `${box.w * 100}%`,
                          height: `${box.h * 100}%`,
                          backgroundColor: `rgba(253, 118, 58, ${box.intensity * 0.35})`,
                        }}
                      />
                    ))}

                  {/* Verdict stamp */}
                  {isRevealFinished && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 animate-fade-in bg-gradient-to-t from-ink-900/80 to-transparent">
                      <div
                        className={cn(
                          'border px-5 py-2 font-mono text-display-sm font-medium uppercase tracking-[0.05em]',
                          verdict.fooled
                            ? 'border-lime-300 bg-russian/80 text-lime-300'
                            : 'border-coral-600 bg-russian/80 text-coral-600'
                        )}
                      >
                        {verdict.fooled ? 'FOOLED' : 'DETECTED'}
                      </div>

                      {/* Points outcome — the key new element */}
                      <div
                        className={cn(
                          'flex items-baseline gap-2 font-mono',
                          verdict.fooled ? 'text-lime-300' : 'text-coral-600'
                        )}
                      >
                        {verdict.fooled ? (
                          <>
                            <span className="text-display-lg font-semibold tabular-nums">+{winPoints}</span>
                            <span className="text-body-sm uppercase tracking-widest">pts</span>
                          </>
                        ) : (
                          <span className="text-body-md uppercase tracking-wider">No points awarded</span>
                        )}
                      </div>

                      {/* Confidence badge */}
                      <div className="font-mono text-eyebrow-micro uppercase tracking-widest text-[var(--text-on-dark-muted)]">
                        Synthetic confidence&nbsp;
                        <span className={verdict.fooled ? 'text-lime-400' : 'text-coral-500'}>
                          {(verdict.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Scanning pulse before reveal is done */}
                  {!isRevealFinished && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-mono text-eyebrow-micro uppercase tracking-[0.03em] text-cyan-500 animate-pulse">
                        Reviewing Traces…
                      </span>
                    </div>
                  )}
                </div>

                {/* ── Detector signal list ── */}
                <div className="flex-1 min-h-0 app-scroll bg-russian">
                  <div className="flex flex-col">
                    {(() => {
                      const SHOW = 3;
                      const sorted = [...verdict.signals].sort((a, b) => b.score - a.score);
                      const shown = sorted.slice(0, SHOW);
                      const hidden = sorted.length - SHOW;

                      return (
                        <>
                          {shown.map((sig, i) => {
                            const visible = revealStep > i;
                            const isHit = sig.verdict === 'synthetic';
                            const isPass = sig.verdict === 'authentic';
                            return (
                              <div
                                key={sig.name}
                                className={cn(
                                  'flex flex-col border-b border-ink-800 px-4 py-3 transition-[opacity,background-color] duration-[var(--dur-base)] ease-[var(--ease-standard)]',
                                  !visible ? 'opacity-0' : 'opacity-100',
                                  visible && isHit ? 'bg-[rgba(253,118,58,0.05)]' : ''
                                )}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <span
                                    className={cn(
                                      'font-mono text-eyebrow-micro uppercase tracking-[0.03em]',
                                      isHit ? 'text-coral-600' : isPass ? 'text-lime-300' : 'text-[var(--text-on-dark-muted)]'
                                    )}
                                  >
                                    {sig.name}
                                  </span>
                                  <span
                                    className={cn(
                                      'font-mono text-eyebrow-micro uppercase tracking-[0.03em] shrink-0',
                                      isHit ? 'text-coral-600' : 'text-[var(--text-on-dark-faint)]'
                                    )}
                                  >
                                    {(sig.score * 100).toFixed(0)}%
                                  </span>
                                </div>
                                {isRevealFinished && isHit && SIGNAL_DESCRIPTIONS[sig.name] && (
                                  <p className="mt-1.5 text-body-sm leading-snug text-[var(--text-on-dark-muted)]">
                                    {SIGNAL_DESCRIPTIONS[sig.name]}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                          {hidden > 0 && revealStep >= SHOW && (
                            <div className="px-4 py-3 border-b border-ink-800">
                              <span className="font-mono text-eyebrow-micro uppercase tracking-[0.03em] text-[var(--text-on-dark-faint)]">
                                + {hidden} more detector{hidden !== 1 ? 's' : ''} ran
                              </span>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </ScanFrame>
          </div>

          <div className="shrink-0 py-3 mt-auto">
            <div
              className={cn(
                'h-[52px] flex items-center justify-center border bg-ink-900/50',
                isRevealFinished
                  ? verdict.fooled ? 'border-lime-300/30' : 'border-coral-600/30'
                  : 'border-ink-800'
              )}
            >
              <span
                className={cn(
                  'font-mono text-eyebrow-micro uppercase tracking-[0.03em]',
                  isRevealFinished
                    ? verdict.fooled ? 'text-lime-300' : 'text-coral-600'
                    : 'text-[var(--text-on-dark-muted)] animate-pulse'
                )}
              >
                {isRevealFinished
                  ? verdict.fooled
                    ? `Level ${level} bypassed — points banked`
                    : 'Image identified as synthetic — run ends'
                  : 'Reviewing traces…'}
              </span>
            </div>
          </div>
        </ScreenBody>
      )}

      {gameState === 'decision' && (
        <ScreenBody>
          {/* ── Last-attempt image with FOOLED overlay ── */}
          {imagePreview && verdict && (
            <div className="shrink-0 relative h-[38%] min-h-[160px] mt-2 overflow-hidden border border-lime-300/20">
              <img
                src={imagePreview}
                alt="Last attempt"
                className="h-full w-full object-cover opacity-75"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-t from-ink-900/90 via-ink-900/20 to-transparent">
                <div className="border border-lime-300 bg-russian/80 px-5 py-1.5 font-mono text-body-lg font-semibold uppercase tracking-[0.05em] text-lime-300">
                  FOOLED
                </div>
                <span className="font-mono text-eyebrow-micro uppercase tracking-widest text-[var(--text-on-dark-muted)]">
                  Synthetic confidence&nbsp;
                  <span className="text-lime-400">
                    {(verdict.confidence * 100).toFixed(1)}%
                  </span>
                </span>
              </div>
            </div>
          )}

          {/* ── Header ── */}
          <div className="shrink-0 pt-3">
            <EyebrowTag tone="violet">Level {level} Bypassed</EyebrowTag>
            <p className="mt-1 text-body-sm text-[var(--text-on-dark-muted)]">
              Bank your {winPoints} pts, or risk them against a stricter detector.
            </p>
          </div>

          {/* ── Scoring ladder ── */}
          <div className="flex-1 min-h-0 flex flex-col justify-center py-4">
            <div className="stagger-in flex flex-col gap-px border border-ink-800 bg-ink-800 p-px">
              {[
                { pts: 75, label: 'Level 3 Clear' },
                { pts: 60, label: 'Level 2 Clear' },
                { pts: 40, label: 'Level 1 Clear' },
                { pts: 0,  label: 'Caught (No Bank)' },
              ].map((rung) => {
                const isAchieved = rung.pts > 0 && winPoints >= rung.pts;
                const isTarget = (level === 1 ? 60 : 75) === rung.pts;

                return (
                  <div
                    key={rung.pts}
                    className={cn(
                      'flex items-center justify-between px-4 py-3 transition-colors duration-[var(--dur-base)] ease-[var(--ease-standard)]',
                      isAchieved
                        ? 'bg-violet-700 text-white'
                        : isTarget
                          ? 'border-l-[3px] border-violet-700 bg-ink-900 text-white'
                          : 'bg-russian text-[var(--text-on-dark-muted)]'
                    )}
                  >
                    <span className="font-mono text-body-sm font-medium uppercase tracking-[0.03em]">
                      {rung.label}
                    </span>
                    <span className="font-mono text-body-sm tabular-nums">
                      {rung.pts}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="shrink-0 py-4 flex flex-col gap-3 mt-auto">
            <Button size="lg" chevron onClick={handleContinue} className="w-full" variant="light">
              Risk Level {level + 1}
            </Button>
            <Button size="lg" variant="outline" onClick={handleQuit} className="w-full">
              Take {winPoints} Pts
            </Button>
          </div>
        </ScreenBody>
      )}
    </Layout>
  );
}
