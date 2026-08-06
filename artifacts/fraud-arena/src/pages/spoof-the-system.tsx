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
      <Layout title="Spoof the System" back="/">
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

  if (gameState === 'gameover') {
    let finalTier = 'Participation';
    let finalDraw = 'None';
    if (!finalResult) return null;

    if (finalResult.pointsRecorded >= 40) finalTier = 'Achiever';
    if (finalResult.pointsRecorded === 60) finalDraw = 'AirPods Draw';
    if (finalResult.pointsRecorded === 75) finalDraw = 'iPad MEGA Draw';

    return (
      <Layout title="Spoof the System" back="/">
        <ScreenBody>
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-center">
            <EyebrowTag tone="violet">Run Complete</EyebrowTag>
            
            <div className="mt-8 mb-8">
              <StatReadout
                value={finalResult.pointsRecorded}
                caption="Points Secured"
                size="lg"
                tone="on-dark"
              />
            </div>

            <div className="flex flex-col items-center gap-2 stagger-in">
              <p className="font-mono text-body-sm font-medium uppercase tracking-[0.03em] text-[var(--text-on-dark-muted)]">
                Tier <span className="ml-2 text-white">{finalTier}</span>
              </p>

              {finalDraw !== 'None' && (
                <p className="mt-1 font-mono text-body-sm font-medium uppercase tracking-[0.03em] text-violet-400">
                  Qualified for {finalDraw}
                </p>
              )}

              {finalResult.standing && (
                <p className="mt-3 font-mono text-body-sm font-medium uppercase tracking-[0.03em] text-[var(--text-on-dark-faint)]">
                  Global Rank #{finalResult.standing.rank}
                  {finalResult.isPersonalBest && (
                    <span className="ml-2 text-violet-400">(PB)</span>
                  )}
                </p>
              )}
            </div>
          </div>
          
          <div className="shrink-0 py-4 flex flex-col gap-3 mt-auto">
            <Button size="lg" variant="light" chevron onClick={() => window.location.reload()} className="w-full">
              New Run
            </Button>
            <Button size="lg" variant="outline" onClick={() => setLocation('/')} className="w-full">
              Exit
            </Button>
          </div>
        </ScreenBody>
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
    <Layout
      title="Spoof the System"
      back="/"
      headerRight={
        <span className="font-mono text-eyebrow-micro font-medium uppercase tracking-[0.03em] text-[var(--text-on-dark-muted)]">
          Level {level}/3
        </span>
      }
      showTabs={false}
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
              <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-6 text-center bg-ink-900">
                <IconTile icon={UploadCloud} size={48} />
                <h2 className="mt-6 font-sans text-card-title font-medium text-white">
                  Ready for Image
                </h2>
                <p className="mt-2 text-body-sm text-[var(--text-on-dark-muted)]">
                  Max 10MB (JPEG, PNG, WebP).
                </p>
                
                {errorMsg && (
                  <p className="mt-4 font-mono text-eyebrow-micro uppercase tracking-[0.03em] text-coral-600">
                    {errorMsg}
                  </p>
                )}
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
                <div className="relative z-10 flex flex-col items-center gap-4">
                  <LiveDot label="Analysis Active" />
                  <h2 className="font-mono text-body-sm font-medium uppercase tracking-[0.03em] text-cyan-500">
                    Extracting Vectors
                  </h2>
                </div>
              </div>
            </ScanFrame>
          </div>
          
          <div className="shrink-0 py-4 mt-auto">
            <div className="h-[60px] flex items-center justify-center border border-ink-800 bg-ink-900/50">
              <span className="font-mono text-eyebrow-micro uppercase text-[var(--text-on-dark-muted)] animate-pulse">
                Processing...
              </span>
            </div>
          </div>
        </ScreenBody>
      )}

      {gameState === 'reveal' && verdict && (
        <ScreenBody>
          <div className="shrink-0 py-4 flex items-end justify-between">
            <div>
              <EyebrowTag tone={revealTone}>Analysis Complete</EyebrowTag>
              <h1 className="mt-2 font-sans text-display-lg text-white">Detector Verdict</h1>
            </div>
            <div className="font-mono text-eyebrow-micro text-[var(--text-on-dark-muted)] text-right pb-1">
              CONF: {(verdict.confidence * 100).toFixed(1)}%
            </div>
          </div>
          
          <div className="flex-1 min-h-0 flex flex-col relative mt-2">
            <ScanFrame id={`VERDICT-${runIdRef.current.substring(0, 8).toUpperCase()}`} tone={revealTone}>
              <div className="flex-1 min-h-0 flex flex-col bg-ink-900">
                <div className="relative shrink-0 h-[35%] min-h-[140px] border-b border-ink-800 overflow-hidden">
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
                          'border bg-russian px-6 py-3 font-mono text-display-md font-medium uppercase tracking-[0.03em]',
                          verdict.fooled ? 'border-lime-300 text-lime-300' : 'border-coral-600 text-coral-600'
                        )}
                      >
                        {verdict.fooled ? 'FOOLED' : 'DETECTED'}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-h-0 app-scroll bg-russian">
                  <div className="flex flex-col">
                    {verdict.signals.map((sig, i) => {
                      const visible = revealStep > i;
                      const isHit = sig.verdict === 'synthetic';
                      const isPass = sig.verdict === 'authentic';

                      return (
                        <div
                          key={i}
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
                  </div>
                </div>
              </div>
            </ScanFrame>
          </div>
          
          <div className="shrink-0 py-4 mt-auto">
            <div className="h-[60px] flex items-center justify-center border border-ink-800 bg-ink-900/50">
              <span className={cn('font-mono text-eyebrow-micro uppercase tracking-[0.03em]', isRevealFinished ? (verdict.fooled ? 'text-lime-300' : 'text-coral-600') : 'text-[var(--text-on-dark-muted)] animate-pulse')}>
                {isRevealFinished ? (verdict.fooled ? 'System Bypassed' : 'Threat Blocked') : 'Reviewing Traces...'}
              </span>
            </div>
          </div>
        </ScreenBody>
      )}

      {gameState === 'decision' && (
        <ScreenBody>
          <div className="shrink-0 pt-4">
            <EyebrowTag tone="violet">Level {level} Bypassed</EyebrowTag>
            <h1 className="mt-2 font-sans text-display-lg text-white">Next Step</h1>
            <p className="mt-1 text-body-sm text-[var(--text-on-dark-muted)]">
              Take your {winPoints} points, or risk them against a stricter detector. If caught, you drop to the lowest baseline.
            </p>
          </div>

          <div className="flex-1 min-h-0 flex flex-col justify-center py-6">
            <div className="stagger-in flex flex-col gap-px border border-ink-800 bg-ink-800 p-px">
              {[
                { pts: 75, label: 'Level 3 Clear' },
                { pts: 60, label: 'Level 2 Clear' },
                { pts: 40, label: 'Level 1 Clear' },
                { pts: 15, label: 'Caught (No Bank)' },
              ].map((rung) => {
                const isAchieved = winPoints >= rung.pts;
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
