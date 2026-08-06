import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { usePlayerSession } from '@/lib/store';
import { Layout } from '@/components/layout';
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
import { UploadCloud, ShieldAlert, Activity, Check, AlertTriangle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  EyebrowTag,
  IconTile,
  LiveDot,
  StatReadout,
  ScanFrame,
  SectionHeader,
  Card,
} from '@/components/bureau';

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
  | 'error';

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

  const failPoints = level === 1 ? 15 : level === 2 ? 40 : 60;
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
            setGameState('gameover');
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
      setGameState('gameover');
    }
  };

  const handleRetrySubmit = () => {
    if (lastPayloadRef.current) {
      submitRun.mutate(
        { data: lastPayloadRef.current },
        {
          onSuccess: (res) => {
            setFinalResult(res);
            setGameState('gameover');
          },
          onError: () => {
            setGameState('error');
          },
        }
      );
    }
  };

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

      const timer = setTimeout(() => {
        if (!verdict.fooled) {
          endRun(failPoints, false, finalAttempts);
        } else if (level === 3) {
          endRun(75, false, finalAttempts);
        } else {
          setGameState('decision');
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [gameState, verdict, revealStep]);

  if (gameState === 'rules') {
    return (
      <Layout>
        <RulesScreen
          gameName="Spoof the System"
          premise="Generate a synthetic or AI face on your phone, upload it, and try to fool Bureau's detectors. Three attempts, getting stricter every time."
          scoring="Up to 75 points. Fail attempt 1: 15 pts. Beat level 1: 40 pts. Beat level 2: 60 pts. Beat level 3: 75 pts."
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
      <Layout>
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center pt-12 md:pt-20">
          <Card surface="ink" className="flex w-full flex-col items-center border-coral-600 p-12 text-center">
            <IconTile icon={ShieldAlert} size={60} />
            <h1 className="mt-8 font-sans text-display-xl font-normal text-white">Save Failed</h1>
            <p className="mt-4 max-w-[32ch] text-body-lg text-[var(--text-on-dark-muted)]">
              We couldn't record your run due to a network error. Your points are safe.
            </p>
            <div className="mt-12 flex w-full justify-center">
              <Button size="lg" onClick={handleRetrySubmit} disabled={submitRun.isPending} chevron>
                {submitRun.isPending ? 'Retrying' : 'Retry Submit'}
              </Button>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  if (gameState === 'gameover') {
    let finalTier = 'Participation';
    let finalDraw = 'None';
    if (!finalResult) return null;

    if (finalResult.pointsRecorded >= 40) finalTier = 'Achiever';
    if (finalResult.pointsRecorded === 60) finalDraw = 'AirPods Draw';
    if (finalResult.pointsRecorded === 75) finalDraw = 'iPad MEGA Draw';

    return (
      <Layout>
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center pt-12 md:pt-20">
          <Card surface="ink" className="flex w-full flex-col items-center p-12 text-center">
            <EyebrowTag tone="violet">Run Complete</EyebrowTag>

            <div className="mb-12 mt-12">
              <StatReadout
                value={finalResult.pointsRecorded}
                caption="Points Secured"
                size="lg"
                tone="on-dark"
              />
            </div>

            <div className="flex max-w-[40ch] flex-col items-center gap-3 text-center">
              <p className="font-mono text-body-sm font-medium uppercase tracking-[0.03em] text-[var(--text-on-dark-muted)]">
                Tier <span className="ml-2 text-white">{finalTier}</span>
              </p>

              {finalDraw !== 'None' && (
                <p className="mt-2 font-mono text-body-sm font-medium uppercase tracking-[0.03em] text-violet-400">
                  Qualified for {finalDraw}
                </p>
              )}

              {finalResult.standing && (
                <p className="mt-4 font-mono text-body-sm font-medium uppercase tracking-[0.03em] text-[var(--text-on-dark-faint)]">
                  Global Rank #{finalResult.standing.rank}
                  {finalResult.isPersonalBest && (
                    <span className="ml-2 text-violet-400">(PB)</span>
                  )}
                </p>
              )}
            </div>

            <div className="mt-12 flex w-full flex-col justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                variant="light"
                chevron
                onClick={() => window.location.reload()}
              >
                New Run
              </Button>
              <Button size="lg" variant="outline" onClick={() => setLocation('/')}>
                Exit
              </Button>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  // --- Main game flow (uploading, detecting, reveal, decision) ---

  const isRevealFinished = gameState === 'reveal' && verdict && revealStep > verdict.signals.length;
  let revealTone: 'violet' | 'coral' | 'cyan' = 'cyan';
  if (gameState === 'reveal' && isRevealFinished && verdict) {
    revealTone = verdict.fooled ? 'violet' : 'coral';
  }

  return (
    <Layout>
      <div className="flex w-full flex-col gap-stack pt-12 md:flex-row md:items-start md:pt-20">
        <div className="flex flex-1 flex-col">
          {gameState === 'uploading' && (
            <div className="flex flex-col gap-6">
              <SectionHeader
                eyebrow="Spoof the System"
                title={`Level ${level} Upload`}
                clause="Provide a synthetic face to test the detector."
              />
              <ScanFrame id={`ATTEMPT-L${level}`} tone="violet">
                <div className="flex min-h-[460px] flex-col items-center justify-center bg-ink-900 p-12 text-center">
                  <IconTile icon={UploadCloud} size={60} />

                  <h2 className="mt-8 font-sans text-card-title font-medium text-white">
                    Select Payload
                  </h2>
                  <p className="mt-2 max-w-[32ch] text-body-md text-[var(--text-on-dark-muted)]">
                    Max 10MB (JPEG, PNG, WebP). Image data is discarded after analysis.
                  </p>

                  <div className="mt-8 w-full max-w-[240px]">
                    <Button
                      size="lg"
                      chevron
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
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

                  {errorMsg && (
                    <p className="mt-6 font-mono text-body-sm uppercase tracking-[0.03em] text-coral-600">
                      {errorMsg}
                    </p>
                  )}
                </div>
              </ScanFrame>
            </div>
          )}

          {gameState === 'detecting' && (
            <div className="flex flex-col gap-6">
              <SectionHeader
                eyebrow="Analysis in Progress"
                title="Scanning Payload"
                clause="Extracting feature vectors and running heuristics."
              />
              <ScanFrame id={`ANALYSIS-${runIdRef.current.substring(0, 8).toUpperCase()}`} tone="cyan">
                <div className="relative flex min-h-[460px] flex-col items-center justify-center overflow-hidden bg-ink-900 p-12 text-center">
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Upload"
                      className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-luminosity grayscale"
                    />
                  )}

                  <div className="relative z-10 flex flex-col items-center gap-6">
                    <LiveDot label="Analysis Active" />
                    <h2 className="font-mono text-display-md font-medium uppercase tracking-[0.03em] text-cyan-500">
                      Extracting Feature Vectors
                    </h2>
                  </div>
                </div>
              </ScanFrame>
            </div>
          )}

          {gameState === 'reveal' && verdict && (
            <div className="flex flex-col gap-6">
              <SectionHeader
                eyebrow="Analysis Complete"
                title="Detector Verdict"
                clause="Reviewing signal trace and confidence score."
              />
              <ScanFrame id={`VERDICT-${runIdRef.current.substring(0, 8).toUpperCase()}`} tone={revealTone}>
                <div className="flex min-h-[460px] flex-col bg-ink-900 md:flex-row">
                  <div className="relative min-h-[300px] w-full overflow-hidden border-b border-ink-800 md:w-1/2 md:border-b-0 md:border-r">
                    {imagePreview && (
                      <img src={imagePreview} alt="Upload" className="h-full w-full object-cover opacity-60" />
                    )}

                    {isRevealFinished &&
                      verdict.heatmapRegions.map((box, i) => (
                        <div
                          key={i}
                          className="absolute animate-resolve-in border border-coral-600"
                          style={{
                            left: `${box.x * 100}%`,
                            top: `${box.y * 100}%`,
                            width: `${box.w * 100}%`,
                            height: `${box.h * 100}%`,
                            backgroundColor: `rgba(253, 118, 58, ${box.intensity * 0.4})`,
                          }}
                        />
                      ))}

                    {isRevealFinished && (
                      <div
                        className={cn(
                          'absolute inset-0 flex items-center justify-center animate-fade-in',
                          verdict.fooled ? 'bg-[rgba(193,240,170,0.15)]' : 'bg-[rgba(253,118,58,0.15)]'
                        )}
                      >
                        <div
                          className={cn(
                            'border bg-russian px-6 py-4 font-mono text-display-lg font-medium uppercase tracking-[0.03em]',
                            verdict.fooled ? 'border-lime-300 text-lime-300' : 'border-coral-600 text-coral-600'
                          )}
                        >
                          {verdict.fooled ? 'FOOLED' : 'DETECTED'}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex w-full flex-col md:w-1/2">
                    <div className="flex items-center justify-between border-b border-ink-800 p-5">
                      <h3 className="font-mono text-body-sm font-medium uppercase tracking-[0.03em] text-white">
                        {verdict.detectorName || `Detector Level ${level}`}
                      </h3>
                      <span className="font-mono text-eyebrow-micro uppercase tracking-[0.03em] text-[var(--text-on-dark-muted)]">
                        CONF: {(verdict.confidence * 100).toFixed(1)}%
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col gap-3 p-5">
                      {verdict.signals.map((sig, i) => {
                        const visible = revealStep > i;
                        const isHit = sig.verdict === 'synthetic';
                        const isPass = sig.verdict === 'authentic';

                        return (
                          <div
                            key={i}
                            className={cn(
                              // Fade only: the guideline allows fades and draws,
                              // never a positional entrance.
                              'flex flex-col border p-4 transition-[opacity,border-color,background-color] duration-[var(--dur-base)] ease-[var(--ease-standard)]',
                              !visible
                                ? 'border-transparent opacity-0'
                                : 'opacity-100',
                              visible && isHit
                                ? 'border-coral-600 bg-[rgba(253,118,58,0.05)]'
                                : visible && isPass
                                  ? 'border-ink-800'
                                  : 'border-ink-800 bg-russian'
                            )}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <h4
                                className={cn(
                                  'font-mono text-body-sm uppercase tracking-[0.03em]',
                                  isHit
                                    ? 'text-coral-600'
                                    : isPass
                                      ? 'text-lime-300'
                                      : 'text-[var(--text-on-dark-muted)]'
                                )}
                              >
                                {sig.name}
                              </h4>
                              <span
                                className={cn(
                                  'font-mono text-eyebrow-micro uppercase tracking-[0.03em]',
                                  isHit ? 'text-coral-600' : 'text-[var(--text-on-dark-faint)]'
                                )}
                              >
                                {(sig.score * 100).toFixed(0)}%
                              </span>
                            </div>
                            {isRevealFinished && isHit && SIGNAL_DESCRIPTIONS[sig.name] && (
                              <p className="mt-2 text-body-sm text-[var(--text-on-dark-muted)]">
                                {SIGNAL_DESCRIPTIONS[sig.name]}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </ScanFrame>
            </div>
          )}

          {gameState === 'decision' && (
            <div className="flex flex-col gap-6">
              <SectionHeader
                eyebrow="Analysis Complete"
                title={`Level ${level} Bypassed`}
                clause={`${winPoints} points secured.`}
              />

              <Card surface="ink" className="p-8 md:p-12">
                <h2 className="font-mono text-body-lg uppercase tracking-[0.03em] text-white">
                  Next Step
                </h2>
                <p className="mt-3 max-w-[46ch] text-body-md text-[var(--text-on-dark-muted)]">
                  You can walk away with your secured points, or risk them against a stricter
                  detector. If caught, you drop to the lowest baseline.
                </p>

                <div className="mt-12 flex flex-col gap-4 sm:flex-row">
                  <Button size="lg" chevron onClick={handleContinue}>
                    Risk Level {level + 1}
                  </Button>
                  <Button size="lg" variant="secondary" onClick={handleQuit}>
                    Take {winPoints} Pts
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>

        <div className="flex w-full flex-col md:w-[280px]">
          <GameSidebar level={level} state={gameState} />
        </div>
      </div>
    </Layout>
  );
}

function GameSidebar({ level, state }: { level: number; state: GameState }) {
  const rungs = [
    { pts: 75, label: 'Level 3 Clear' },
    { pts: 60, label: 'Level 2 Clear' },
    { pts: 40, label: 'Level 1 Clear' },
    { pts: 15, label: 'Caught (No Bank)' },
  ];

  let achievedPts = 0;
  let targetPts = 0;

  if (state === 'uploading' || state === 'detecting') {
    achievedPts = level === 1 ? 0 : level === 2 ? 40 : 60;
    targetPts = level === 1 ? 40 : level === 2 ? 60 : 75;
  } else if (state === 'reveal') {
    achievedPts = level === 1 ? 0 : level === 2 ? 40 : 60;
    targetPts = level === 1 ? 40 : level === 2 ? 60 : 75;
  } else if (state === 'decision') {
    achievedPts = level === 1 ? 40 : level === 2 ? 60 : 75;
  }

  return (
    <div className="flex w-full flex-col">
      <EyebrowTag tone="muted">Prize Ladder</EyebrowTag>
      <div className="mt-4 flex flex-col gap-px border border-ink-800 bg-ink-800 p-px">
        {rungs.map((rung) => {
          const isAchieved = achievedPts >= rung.pts;
          const isTarget = targetPts === rung.pts;

          return (
            <div
              key={rung.pts}
              className={cn(
                'flex items-center justify-between px-5 py-4 transition-colors duration-[var(--dur-base)] ease-[var(--ease-standard)]',
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
              <span className="font-mono text-body-sm tabular-nums">{rung.pts}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
