import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { usePlayerSession } from '@/lib/store';
import { Layout, ScreenBody } from '@/components/layout';
import { RulesScreen } from '@/components/rules-screen';
import { Button } from '@/components/ui/button';
import { useGetPlayerStanding, useSubmitRun, type RunInput } from '@workspace/api-client-react';
import { v4 as uuidv4 } from 'uuid';
import { ScanEye, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EyebrowTag, IconTile, ScanFrame, StatReadout } from '@/components/bureau';
import { LifelineGate } from '@/components/lifeline-gate';
import { fetchLifelineQuestion, type LifelineQuestion } from '@/lib/gamePack';
import { drawImageQuizOptions, type ImageQuizOption } from '@/data/image-quiz-pool';

type GameState = 'rules' | 'playing' | 'reveal' | 'decision' | 'lifeline' | 'error';
type GameLevel = 1 | 2 | 3;

type QuizRound = {
  options: ImageQuizOption[];
  selectCount: number;
};

type RoundResult = {
  correct: boolean;
  attempts: Array<{
    level: GameLevel;
    correct: boolean;
    selectedImageIds: string[];
  }>;
};

const LEVEL_CONFIG: Record<GameLevel, { selectCount: number; points: number }> = {
  1: { selectCount: 1, points: 17 },
  2: { selectCount: 2, points: 50 },
  3: { selectCount: 2, points: 100 },
};

function bankedPoints(level: GameLevel): number {
  return level === 1 ? 0 : level === 2 ? 17 : 50;
}

export default function SpoofTheSystem() {
  const { session } = usePlayerSession();
  const [, setLocation] = useLocation();
  const { data: standing } = useGetPlayerStanding(session?.player.id || '', 'today');
  const submitRun = useSubmitRun();

  const [gameState, setGameState] = useState<GameState>('rules');
  const [level, setLevel] = useState<GameLevel>(1);
  const [round, setRound] = useState<QuizRound | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [attemptsData, setAttemptsData] = useState<RoundResult['attempts']>([]);

  const runIdRef = useRef<string>('');
  useEffect(() => {
    if (!runIdRef.current) runIdRef.current = uuidv4();
  }, []);

  const [finalResult, setFinalResult] = useState<any>(null);
  const lastPayloadRef = useRef<RunInput | null>(null);
  const [lifelineQuestion, setLifelineQuestion] = useState<LifelineQuestion | null>(null);
  const [lifelineContext, setLifelineContext] = useState<'gameover' | 'reentry'>('gameover');
  const reentryChecked = useRef(false);

  const startLevel = (nextLevel: GameLevel) => {
    const config = LEVEL_CONFIG[nextLevel];
    setLevel(nextLevel);
    setRound({
      selectCount: config.selectCount,
      options: drawImageQuizOptions(config.selectCount),
    });
    setSelectedIndices([]);
    setRoundResult(null);
    setGameState('playing');
  };

  const startGame = () => startLevel(1);

  const toggleOption = (index: number) => {
    if (!round) return;
    setSelectedIndices((previous) => {
      if (previous.includes(index)) return previous.filter((value) => value !== index);
      if (previous.length < round.selectCount) return [...previous, index];
      return previous;
    });
  };

  const handleSubmit = () => {
    if (!round || selectedIndices.length !== round.selectCount) return;

    const correct =
      selectedIndices.length === round.selectCount &&
      selectedIndices.every((index) => round.options[index]?.isSpoofed);
    const attempts = [
      ...attemptsData,
      {
        level,
        correct,
        selectedImageIds: selectedIndices.map((index) => round.options[index].id),
      },
    ];

    setAttemptsData(attempts);
    setRoundResult({ correct, attempts });
    setGameState('reveal');
  };

  // A quick reveal lets people see the answer before either banking points,
  // moving up a level, or ending a failed run.
  useEffect(() => {
    if (gameState !== 'reveal' || !roundResult) return;
    const isFinal = !roundResult.correct || level === 3;
    const timer = window.setTimeout(() => {
      if (!roundResult.correct) {
        endRun(bankedPoints(level), false, roundResult.attempts);
      } else if (level === 3) {
        endRun(LEVEL_CONFIG[3].points, false, roundResult.attempts);
      } else {
        setGameState('decision');
      }
    }, isFinal ? 8_000 : 3_500);
    return () => window.clearTimeout(timer);
  }, [gameState, level, roundResult]);

  const handleContinue = () => {
    startLevel((level + 1) as GameLevel);
  };

  const handleQuit = () => {
    endRun(LEVEL_CONFIG[level].points, true, attemptsData);
  };

  const endRun = (
    points: number,
    quitVoluntarily: boolean,
    finalAttempts: RoundResult['attempts'],
  ) => {
    let tier = 'Participation';
    let drawPool: string | null = null;

    if (finalAttempts.filter((attempt) => attempt.correct).length >= 2) {
      drawPool = 'mystery_prize';
    }
    if (points >= 50) tier = 'Achiever';

    if (session) {
      const payload: RunInput = {
        playerId: session.player.id,
        game: 'spoof_the_system',
        points,
        source: new URLSearchParams(window.location.search).get('src') === 'qr' ? 'phone' : 'kiosk',
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
          onSuccess: (result) => {
            setFinalResult(result);
            setLifelineContext('gameover');
            setGameState('lifeline');
          },
          onError: () => setGameState('error'),
        },
      );
      return;
    }

    setFinalResult({
      pointsRecorded: points,
      isPersonalBest: false,
      standing: { rank: 0, behind: 0 },
    });
    setLifelineContext('gameover');
    setGameState('lifeline');
  };

  const handleRetrySubmit = () => {
    if (!lastPayloadRef.current) return;
    submitRun.mutate(
      { data: lastPayloadRef.current },
      {
        onSuccess: (result) => {
          setFinalResult(result);
          setLifelineContext('gameover');
          setGameState('lifeline');
        },
        onError: () => setGameState('error'),
      },
    );
  };

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

  if (gameState === 'rules') {
    return (
      <Layout title="Spoof the System" back="/">
        <RulesScreen
          gameName="Spoof the System"
          premise="Review randomized real and AI-generated images. Find the spoofed images in three escalating rounds."
          scoring="Up to 100 points. Clear level 1: 17 pts. Clear level 2: 50 pts total. Clear level 3: 100 pts total."
          endsWhen="A wrong selection ends your run. Any points banked from earlier levels are kept."
          lifelines="You can walk away with banked points after level 1 or 2. Clearing level 2 or level 3 enters you into the Mystery prize draw."
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
              We couldn't record your run due to a network error. Your points are safe.
            </p>
          </div>
          <div className="mt-auto shrink-0 py-4">
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
    const pointsRecorded = finalResult?.pointsRecorded ?? 0;
    const inMysteryDraw = pointsRecorded >= 50;

    return (
      <LifelineGate
        question={lifelineQuestion}
        context={lifelineContext}
        gameTitle="Spoof the System"
        scoreDisplay={finalResult ? (
          <div className="relative flex max-w-[58%] flex-wrap items-baseline justify-end gap-x-2 gap-y-0.5 pr-3 text-right">
            <span className="font-sans text-display-md font-normal tabular-nums text-white">{pointsRecorded}</span>
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.03em] text-[var(--text-on-dark-muted)]">
              Points Secured
            </span>
            {inMysteryDraw && (
              <span className="font-mono text-[10px] uppercase tracking-[0.03em] text-violet-400">
                Mystery prize draw
              </span>
            )}
            <span aria-hidden className="absolute right-0 top-0 size-2 bg-violet-700" />
          </div>
        ) : undefined}
        compact
        onRetry={() => {
          setLevel(1);
          setRound(null);
          setSelectedIndices([]);
          setRoundResult(null);
          setAttemptsData([]);
          setFinalResult(null);
          lastPayloadRef.current = null;
          fetchLifelineQuestion().then(setLifelineQuestion);
          setGameState('rules');
        }}
        onExit={() => setLocation('/')}
      />
    );
  }

  const config = LEVEL_CONFIG[level];
  const isCorrect = roundResult?.correct ?? false;

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
      {gameState === 'playing' && round && (
        <ScreenBody>
          <div className="shrink-0 py-4">
            <EyebrowTag tone="violet">Level {level} / {config.points} pts</EyebrowTag>
            <h1 className="mt-2 font-sans text-display-lg text-white">
              {round.selectCount === 1 ? 'Find the spoofed image' : `Find ${round.selectCount} spoofed images`}
            </h1>
            <p className="mt-1 text-body-sm text-[var(--text-on-dark-muted)]">
              Which {round.selectCount === 1 ? 'image is' : `${round.selectCount} images are`} spoofed or AI-generated?
            </p>
            {round.selectCount > 1 && (
              <p className="mt-2 font-mono text-eyebrow-micro font-medium uppercase tracking-[0.03em] text-violet-500">
                Select {round.selectCount}
              </p>
            )}
          </div>

          <div className="mt-1 grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-2 overflow-hidden">
            {round.options.map((option, index) => {
              const selected = selectedIndices.includes(index);
              return (
                <button
                  key={option.id}
                  onClick={() => toggleOption(index)}
                  className={cn(
                    'tap group relative min-h-0 overflow-hidden border text-left transition-colors duration-[var(--dur-base)]',
                    selected ? 'border-violet-500 bg-[rgba(71,21,255,0.08)]' : 'border-ink-800 bg-ink-900 hover:border-violet-700',
                  )}
                >
                  <img
                    src={option.src}
                    alt={`Quiz option ${index + 1}`}
                    className={cn(
                      'absolute inset-0 size-full object-cover object-center transition-opacity duration-[var(--dur-base)]',
                      selected && 'opacity-60',
                    )}
                  />
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-[rgba(0,2,36,0.82)] px-2 py-1.5">
                    <span className="font-mono text-eyebrow-micro font-medium tabular-nums text-white">
                      Image {index + 1}
                    </span>
                    <ScanEye className={cn('size-4', selected ? 'text-violet-500' : 'text-white/70')} strokeWidth={1.5} />
                  </div>
                  <div className="absolute right-2 top-2">
                    {selected
                      ? <div className="size-3 bg-violet-500" />
                      : <div className="size-3 border border-white/80 bg-[rgba(0,2,36,0.5)]" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-auto shrink-0 py-4">
            <Button
              size="lg"
              chevron
              disabled={selectedIndices.length !== round.selectCount}
              onClick={handleSubmit}
              className="w-full"
              variant="light"
            >
              Submit answer
            </Button>
          </div>
        </ScreenBody>
      )}

      {gameState === 'reveal' && round && roundResult && (
        <ScreenBody>
          <div className="shrink-0 py-4">
            <EyebrowTag tone={isCorrect ? 'violet' : 'coral'}>
              {isCorrect ? 'Correct selection' : 'Answer revealed'}
            </EyebrowTag>
            <h1 className="mt-2 font-sans text-display-lg text-white">
              {isCorrect ? 'You found it.' : 'Not quite.'}
            </h1>
            <p className="mt-1 text-body-sm text-[var(--text-on-dark-muted)]">
              {isCorrect
                ? `Level ${level} cleared — ${config.points} points banked.`
                : 'The highlighted images were spoofed or AI-generated.'}
            </p>
          </div>

          <ScanFrame id={`ANSWER-L${level}`} tone={isCorrect ? 'violet' : 'coral'} className="mt-1 min-h-0 flex-1">
            <div className="grid size-full min-h-0 grid-cols-2 grid-rows-2 gap-2 bg-ink-900 p-2">
              {round.options.map((option, index) => {
                const wasSelected = selectedIndices.includes(index);
                return (
                  <div key={option.id} className="relative min-h-0 overflow-hidden border border-ink-800">
                    <img
                      src={option.src}
                      alt={`Revealed option ${index + 1}`}
                      className="absolute inset-0 size-full object-cover object-center opacity-70"
                    />
                    <div className={cn(
                      'absolute inset-x-0 bottom-0 px-2 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.03em]',
                      option.isSpoofed ? 'bg-lime-300 text-ink-950' : 'bg-[rgba(0,2,36,0.84)] text-white',
                    )}>
                      {option.isSpoofed ? 'Spoofed / AI-generated' : 'Real image'}
                    </div>
                    {wasSelected && (
                      <span className="absolute right-2 top-2 bg-violet-500 px-1.5 py-0.5 font-mono text-[9px] uppercase text-white">
                        Your pick
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </ScanFrame>

          <div className="mt-auto shrink-0 py-4">
            {isCorrect ? (
              <StatReadout value={`+${config.points}`} caption="Points Banked" tone="on-dark" size="sm" />
            ) : (
              <p className="font-mono text-eyebrow-micro uppercase tracking-[0.03em] text-coral-600">
                Ending run with {bankedPoints(level)} points
              </p>
            )}
          </div>
        </ScreenBody>
      )}

      {gameState === 'decision' && (
        <ScreenBody>
          <div className="shrink-0 py-4">
            <EyebrowTag tone="violet">Level {level} cleared</EyebrowTag>
            <h1 className="mt-2 font-sans text-display-lg text-white">{config.points} points banked.</h1>
            <p className="mt-1 text-body-sm text-[var(--text-on-dark-muted)]">
              Bank your score, or risk it in the next image round.
            </p>
          </div>

          <div className="flex min-h-0 flex-1 flex-col justify-center py-4">
            <div className="stagger-in flex flex-col gap-px border border-ink-800 bg-ink-800 p-px">
              {[100, 50, 17, 0].map((points) => {
                const achieved = config.points >= points && points > 0;
                const target = points === LEVEL_CONFIG[(level + 1) as GameLevel]?.points;
                return (
                  <div
                    key={points}
                    className={cn(
                      'flex items-center justify-between px-4 py-3',
                      achieved ? 'bg-violet-700 text-white' : target ? 'border-l-[3px] border-violet-700 bg-ink-900 text-white' : 'bg-russian text-[var(--text-on-dark-muted)]',
                    )}
                  >
                    <span className="font-mono text-body-sm font-medium uppercase tracking-[0.03em]">
                      {points === 0 ? 'Wrong answer' : `${points} point level`}
                    </span>
                    <span className="font-mono text-body-sm tabular-nums">{points}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-auto flex shrink-0 flex-col gap-3 py-4">
            <Button size="lg" chevron onClick={handleContinue} className="w-full" variant="light">
              Risk Level {level + 1}
            </Button>
            <Button size="lg" variant="outline" onClick={handleQuit} className="w-full">
              Take {config.points} Pts
            </Button>
          </div>
        </ScreenBody>
      )}
    </Layout>
  );
}