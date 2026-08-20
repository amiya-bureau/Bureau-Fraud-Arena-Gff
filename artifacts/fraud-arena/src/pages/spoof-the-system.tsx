import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useLocation } from 'wouter';
import { usePlayerSession } from '@/lib/store';
import { Layout, ScreenBody } from '@/components/layout';
import { RulesScreen } from '@/components/rules-screen';
import { Button } from '@/components/ui/button';
import {
  type DetectorVerdict,
  type RunInput,
  useDetectSpoof,
  useGetPlayerStanding,
  useSubmitRun,
} from '@workspace/api-client-react';
import { v4 as uuidv4 } from 'uuid';
import { QRCodeSVG } from 'qrcode.react';
import { ShieldAlert, UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EyebrowTag, IconTile, LiveDot, ScanFrame } from '@/components/bureau';
import { LifelineGate } from '@/components/lifeline-gate';
import { fetchLifelineQuestion, type LifelineQuestion } from '@/lib/gamePack';

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
  'Compression-history analysis': 'Expected JPEG compression history is missing.',
  'Colour-channel correlation': 'Chroma subsampling anomalies appear around high-contrast edges.',
};

type GameState = 'rules' | 'uploading' | 'detecting' | 'reveal' | 'decision' | 'lifeline' | 'error';
type GameLevel = 1 | 2 | 3;

const pointsForLevel = (level: GameLevel) => level === 1 ? 17 : level === 2 ? 50 : 100;
const bankedPoints = (level: GameLevel) => level === 1 ? 0 : level === 2 ? 17 : 50;

function QrCodeBlock() {
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return <QRCodeSVG value={`${origin}${base}/spoof-the-system?src=qr`} size={200} level="M" />;
}

export default function SpoofTheSystem() {
  const { session } = usePlayerSession();
  const [, setLocation] = useLocation();
  const { data: standing } = useGetPlayerStanding(session?.player.id ?? '', 'today');
  const submitRun = useSubmitRun();
  const detectSpoof = useDetectSpoof();

  const [gameState, setGameState] = useState<GameState>('rules');
  const [level, setLevel] = useState<GameLevel>(1);
  const [attempts, setAttempts] = useState<Array<{ level: GameLevel; fooled: boolean; confidence: number }>>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<DetectorVerdict | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detectMessageIndex, setDetectMessageIndex] = useState(0);
  const [detectProgress, setDetectProgress] = useState(0);
  const [finalResult, setFinalResult] = useState<any>(null);
  const [lifelineQuestion, setLifelineQuestion] = useState<LifelineQuestion | null>(null);
  const [lifelineContext, setLifelineContext] = useState<'gameover' | 'reentry'>('gameover');

  const runIdRef = useRef('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastPayloadRef = useRef<RunInput | null>(null);
  const reentryChecked = useRef(false);

  useEffect(() => {
    if (!runIdRef.current) runIdRef.current = uuidv4();
  }, []);

  useEffect(() => {
    fetchLifelineQuestion().then(setLifelineQuestion);
  }, []);

  useEffect(() => {
    if (gameState !== 'detecting') {
      setDetectMessageIndex(0);
      setDetectProgress(0);
      return;
    }

    const startedAt = Date.now();
    const progressTimer = window.setInterval(() => {
      setDetectProgress(Math.min(95, ((Date.now() - startedAt) / 20_000) * 100));
    }, 200);
    const messageTimer = window.setInterval(() => {
      setDetectMessageIndex((index) => (index + 1) % DETECTING_MESSAGES.length);
    }, 3_000);

    return () => {
      window.clearInterval(progressTimer);
      window.clearInterval(messageTimer);
    };
  }, [gameState]);

  useEffect(() => {
    if (!reentryChecked.current && standing && gameState === 'rules') {
      reentryChecked.current = true;
      const hasPlayed = (standing as any).scores?.find((score: any) => score.game === 'spoof_the_system')?.played;
      if (hasPlayed) {
        setLifelineContext('reentry');
        setGameState('lifeline');
      }
    }
  }, [standing, gameState]);

  const startGame = () => {
    setLevel(1);
    setAttempts([]);
    setImagePreview(null);
    setVerdict(null);
    setErrorMessage(null);
    setGameState('uploading');
  };

  const resetAttempt = (nextLevel: GameLevel) => {
    setLevel(nextLevel);
    setImagePreview(null);
    setVerdict(null);
    setErrorMessage(null);
    setGameState('uploading');
  };

  const endRun = (
    points: number,
    quitVoluntarily: boolean,
    finalAttempts: Array<{ level: GameLevel; fooled: boolean; confidence: number }>,
  ) => {
    const drawPool = finalAttempts.filter((attempt) => attempt.fooled).length >= 2 ? 'mystery_prize' : null;
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
        drawPool,
        tier: points >= 50 ? 'Achiever' : 'Participation',
      },
    };

    if (!session) {
      setFinalResult({ pointsRecorded: points, isPersonalBest: false, standing: { rank: 0, behind: 0 } });
      setLifelineContext('gameover');
      setGameState('lifeline');
      return;
    }

    lastPayloadRef.current = payload;
    submitRun.mutate({ data: payload }, {
      onSuccess: (result) => {
        setFinalResult(result);
        setLifelineContext('gameover');
        setGameState('lifeline');
      },
      onError: () => setGameState('error'),
    });
  };

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrorMessage('Only JPEG, PNG and WebP images are supported.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Image must be under 10MB.');
      return;
    }

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = () => {
      const imageData = reader.result as string;
      setImagePreview(imageData);
      setGameState('detecting');
      detectSpoof.mutate({
        data: {
          playerId: session?.player.id ?? '',
          level,
          image: imageData.split(',')[1],
          mimeType: file.type,
          fileName: file.name,
        },
      }, {
        onSuccess: (result) => {
          setDetectProgress(100);
          setVerdict(result);
          setGameState('reveal');
        },
        onError: (error: any) => {
          setErrorMessage(error?.response?.data?.error ?? 'Detector failed to run. Please try again.');
          setGameState('uploading');
        },
      });
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const resolveVerdict = () => {
    if (!verdict) return;
    const nextAttempts = [...attempts, { level, fooled: verdict.fooled, confidence: verdict.confidence }];
    setAttempts(nextAttempts);
    if (!verdict.fooled) {
      endRun(bankedPoints(level), false, nextAttempts);
    } else if (level === 3) {
      endRun(pointsForLevel(level), false, nextAttempts);
    } else {
      setGameState('decision');
    }
  };

  const retrySave = () => {
    if (!lastPayloadRef.current) return;
    submitRun.mutate({ data: lastPayloadRef.current }, {
      onSuccess: (result) => {
        setFinalResult(result);
        setLifelineContext('gameover');
        setGameState('lifeline');
      },
      onError: () => setGameState('error'),
    });
  };

  if (gameState === 'rules') {
    return (
      <Layout title="Spoof the System" back="/">
        <RulesScreen
          gameName="Spoof the System"
          premise="Generate a synthetic or AI face on your phone, upload it, and try to fool Bureau's detectors. Three attempts, getting stricter every time."
          scoring="Up to 100 points. Beat level 1: 17 pts. Beat level 2: 50 pts total. Beat level 3: 100 pts total."
          endsWhen="If the detector catches you, your run ends. Banked points are kept."
          lifelines="You can walk away with your banked points after level 1 or 2. Completing level 2 or level 3 enters you into the Mystery prize draw."
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
            <p className="mt-3 max-w-[32ch] text-body-lg text-[var(--text-on-dark-muted)]">We couldn't record your run. Your points are safe.</p>
          </div>
          <div className="mt-auto shrink-0 py-4">
            <Button size="lg" onClick={retrySave} disabled={submitRun.isPending} chevron className="w-full" variant="light">
              {submitRun.isPending ? 'Retrying' : 'Retry Submit'}
            </Button>
          </div>
        </ScreenBody>
      </Layout>
    );
  }

  if (gameState === 'lifeline') {
    if (!lifelineQuestion) return null;
    const points = finalResult?.pointsRecorded ?? 0;
    return (
      <LifelineGate
        question={lifelineQuestion}
        context={lifelineContext}
        gameTitle="Spoof the System"
        scoreDisplay={finalResult ? (
          <div className="relative flex max-w-[58%] flex-wrap items-baseline justify-end gap-x-2 gap-y-0.5 pr-3 text-right">
            <span className="font-sans text-display-md font-normal tabular-nums text-white">{points}</span>
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.03em] text-[var(--text-on-dark-muted)]">Points Secured</span>
            {points >= 50 && <span className="font-mono text-[10px] uppercase tracking-[0.03em] text-violet-400">Mystery prize draw</span>}
            <span aria-hidden className="absolute right-0 top-0 size-2 bg-violet-700" />
          </div>
        ) : undefined}
        compact
        onRetry={startGame}
        onExit={() => setLocation('/')}
      />
    );
  }

  const revealed = gameState === 'reveal' && verdict;
  const verdictTone = verdict?.fooled ? 'violet' : 'coral';

  return (
    <Layout
      title="Spoof the System"
      back="/"
      headerRight={<span className="font-mono text-eyebrow-micro font-medium uppercase tracking-[0.03em] text-[var(--text-on-dark-muted)]">Level {level}/3</span>}
    >
      {gameState === 'uploading' && (
        <ScreenBody>
          <div className="shrink-0 py-4">
            <EyebrowTag tone="violet">Level {level} upload</EyebrowTag>
            <h1 className="mt-2 font-sans text-display-lg text-white">Select Payload</h1>
            <p className="mt-1 text-body-sm text-[var(--text-on-dark-muted)]">Provide a synthetic face to test the detector.</p>
          </div>
          <div className="mt-2 flex min-h-0 flex-1 flex-col">
            <ScanFrame id={`ATTEMPT-L${level}`} tone="violet" className="flex min-h-0 flex-1 flex-col">
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 bg-ink-900 px-8 py-6 text-center">
                <div className="bg-white p-3"><QrCodeBlock /></div>
                <div>
                  <p className="font-mono text-eyebrow-micro font-medium uppercase tracking-[0.03em] text-[var(--text-on-dark-muted)]">Scan to upload from your phone</p>
                  {errorMessage && <p className="mt-3 font-mono text-eyebrow-micro uppercase tracking-[0.03em] text-coral-600">{errorMessage}</p>}
                </div>
              </div>
            </ScanFrame>
          </div>
          <div className="mt-auto shrink-0 py-4">
            <Button size="lg" chevron onClick={() => fileInputRef.current?.click()} className="w-full" variant="light">
              <UploadCloud className="size-4" strokeWidth={1.5} /> Select Image
            </Button>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileUpload} />
          </div>
        </ScreenBody>
      )}

      {gameState === 'detecting' && (
        <ScreenBody>
          <div className="shrink-0 py-4">
            <EyebrowTag tone="cyan">Analysis active</EyebrowTag>
            <h1 className="mt-2 font-sans text-display-lg text-white">Scanning Payload</h1>
          </div>
          <div className="mt-2 flex min-h-0 flex-1 flex-col">
            <ScanFrame id="ANALYSIS" tone="cyan" className="flex min-h-0 flex-1 flex-col">
              <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden bg-ink-900">
                {imagePreview && <img src={imagePreview} alt="Uploaded payload under analysis" className="absolute inset-0 size-full object-cover opacity-20 grayscale" />}
                <div className="relative z-10 flex flex-col items-center gap-4 px-6 text-center">
                  <LiveDot label="Analysis Active" />
                  <h2 className="font-mono text-body-sm font-medium text-cyan-400">{DETECTING_MESSAGES[detectMessageIndex]}</h2>
                </div>
              </div>
            </ScanFrame>
          </div>
          <div className="mt-auto shrink-0 space-y-2 py-4">
            <div className="h-1.5 overflow-hidden rounded-full bg-ink-800"><div className="h-full rounded-full bg-cyan-500 transition-[width] duration-200" style={{ width: `${detectProgress}%` }} /></div>
            <div className="flex justify-between font-mono text-eyebrow-micro uppercase text-[var(--text-on-dark-muted)]"><span>Bureau detector running</span><span className="text-cyan-500">{Math.round(detectProgress)}%</span></div>
          </div>
        </ScreenBody>
      )}

      {revealed && (
        <ScreenBody>
          <div className="shrink-0 py-4">
            <EyebrowTag tone={verdictTone}>Analysis complete</EyebrowTag>
            <h1 className="mt-2 font-sans text-display-lg text-white">Detector Verdict</h1>
          </div>
          <div className="mt-2 flex min-h-0 flex-1 flex-col">
            <ScanFrame id={`VERDICT-L${level}`} tone={verdictTone} className="flex min-h-0 flex-1 flex-col">
              <div className="relative h-[45%] min-h-[180px] overflow-hidden border-b border-ink-800">
                {imagePreview && <img src={imagePreview} alt="Analysed upload" className={cn('size-full object-cover', verdict.fooled ? 'opacity-75' : 'opacity-50 grayscale')} />}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink-900/35">
                  <span className={cn('border bg-russian/90 px-5 py-2 font-mono text-display-sm font-medium uppercase tracking-[0.05em]', verdict.fooled ? 'border-lime-300 text-lime-300' : 'border-coral-600 text-coral-600')}>
                    {verdict.fooled ? 'Fooled' : 'Detected'}
                  </span>
                  <span className={cn('font-mono text-body-sm uppercase', verdict.fooled ? 'text-lime-300' : 'text-coral-600')}>
                    {verdict.fooled ? `+${pointsForLevel(level)} pts` : 'No points awarded'}
                  </span>
                  <span className="font-mono text-eyebrow-micro uppercase text-white/70">Synthetic confidence {(verdict.confidence * 100).toFixed(1)}%</span>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto bg-russian">
                {verdict.signals.slice().sort((left, right) => right.score - left.score).slice(0, 4).map((signal) => {
                  const synthetic = signal.verdict === 'synthetic';
                  return (
                    <div key={signal.name} className="border-b border-ink-800 px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <span className={cn('font-mono text-eyebrow-micro uppercase tracking-[0.03em]', synthetic ? 'text-coral-600' : 'text-lime-300')}>{signal.name}</span>
                        <span className="font-mono text-eyebrow-micro text-[var(--text-on-dark-muted)]">{Math.round(signal.score * 100)}%</span>
                      </div>
                      {synthetic && SIGNAL_DESCRIPTIONS[signal.name] && <p className="mt-1.5 text-body-sm leading-snug text-[var(--text-on-dark-muted)]">{SIGNAL_DESCRIPTIONS[signal.name]}</p>}
                    </div>
                  );
                })}
              </div>
            </ScanFrame>
          </div>
          <div className="mt-auto shrink-0 py-4">
            <Button size="lg" chevron className="w-full" variant="light" onClick={resolveVerdict}>
              {verdict.fooled ? level === 3 ? 'Finish run' : 'Bank or risk' : `End with ${bankedPoints(level)} pts`}
            </Button>
          </div>
        </ScreenBody>
      )}

      {gameState === 'decision' && (
        <ScreenBody>
          <div className="shrink-0 py-4">
            <EyebrowTag tone="violet">Level {level} bypassed</EyebrowTag>
            <h1 className="mt-2 font-sans text-display-lg text-white">{pointsForLevel(level)} points banked.</h1>
            <p className="mt-1 text-body-sm text-[var(--text-on-dark-muted)]">Bank your score, or risk it against a stricter detector.</p>
          </div>
          <div className="flex min-h-0 flex-1 flex-col justify-center py-4">
            <div className="flex flex-col gap-px border border-ink-800 bg-ink-800 p-px">
              {[100, 50, 17, 0].map((points) => (
                <div key={points} className={cn('flex items-center justify-between px-4 py-3', points > 0 && points <= pointsForLevel(level) ? 'bg-violet-700 text-white' : 'bg-russian text-[var(--text-on-dark-muted)]')}>
                  <span className="font-mono text-body-sm uppercase tracking-[0.03em]">{points === 0 ? 'Caught' : `${points} point level`}</span>
                  <span className="font-mono text-body-sm tabular-nums">{points}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-auto flex shrink-0 flex-col gap-3 py-4">
            <Button size="lg" chevron onClick={() => resetAttempt((level + 1) as GameLevel)} className="w-full" variant="light">Risk Level {level + 1}</Button>
            <Button size="lg" variant="outline" onClick={() => endRun(pointsForLevel(level), true, attempts)} className="w-full">Take {pointsForLevel(level)} pts</Button>
          </div>
        </ScreenBody>
      )}
    </Layout>
  );
}