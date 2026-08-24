import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { clearActiveRun, readActiveRun, saveActiveRun, usePlayerSession } from '@/lib/store';
import { Layout } from '@/components/layout';
import { RulesScreen } from '@/components/rules-screen';
import { Button } from '@/components/ui/button';
import { RetryOptions } from '@/components/retry-options';
import { GameEndScreen } from '@/components/game-end-screen';
import { LEVELS, QUESTIONS, Level, Question } from '@/data/quiz';
import { LifelineGate } from '@/components/lifeline-gate';
import { fetchQuizGamePack, fetchLifelineQuestion, type LifelineQuestion } from '@/lib/gamePack';
import { useSubmitRun, useSaveRunProgress, useGetPlayerStanding, RunInput } from '@workspace/api-client-react';
import { v4 as uuidv4 } from 'uuid';
import { ShieldAlert, ScanEye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EyebrowTag } from '@/components/bureau/eyebrow-tag';
import { StatReadout } from '@/components/bureau/stat-readout';
import { IconTile } from '@/components/bureau/icon-tile';
import { drawImageQuizOptions, type ImageQuizOption } from '@/data/image-quiz-pool';
import { isDevTestMode } from '@/lib/dev-test-mode';


// We shuffle options but keep track of their original 1-based index
interface ShuffledOption {
  text: string;
  originalIndex: number;
}

type GameState = 'rules' | 'playing' | 'explain' | 'lifeline' | 'highscore' | 'error';
const SPOT_RECOVERY_SKIP_COUNT = 3;
const EXPLAIN_FAIL_SECONDS = 10;
const RECOVERY_AUTO_CONTINUE_SECONDS = 5;
const DEV_TEST_TIMER_SECONDS = 180;

interface SpotRunSnapshot {
  version: 1;
  gameState: GameState;
  runId: string;
  levelIndex: number;
  gamePack: Question[] | null;
  score: number;
  recoverySkipsRemaining: number;
  failureCanAdvance: boolean;
  currentQuestion: Question | null;
  shuffledOptions: ShuffledOption[];
  imageOptions: ImageQuizOption[];
  selectedIndices: number[];
  timeLeft: number;
  explainFailSec: number;
  correctExplainSec: number;
  explainResult: 'correct' | 'nearMiss' | 'wrong' | 'skipped' | 'timeout' | null;
  pointsEarned: number;
  cleared: number[];
  skipped: number[];
  perLevelData: any[];
  nearMissLevel: number | null;
  finalResult: any;
  lifelineQuestion: LifelineQuestion | null;
  lifelineContext: 'gameover' | 'reentry';
}

export default function SpotTheFraud() {
  const { session } = usePlayerSession();
  const [, setLocation] = useLocation();
  const devTestMode = isDevTestMode();
  const { data: standing } = useGetPlayerStanding(session?.player.id || '', 'today');
  const submitRun = useSubmitRun();
  const saveProgress = useSaveRunProgress();
  const restoredRunRef = useRef<SpotRunSnapshot | null>(
    session ? readActiveRun<SpotRunSnapshot>('spot_the_fraud', session.player.id) : null,
  );
  const restoredRun = restoredRunRef.current;

  const [gameState, setGameState] = useState<GameState>(() => restoredRun?.gameState ?? 'rules');
  const [levelIndex, setLevelIndex] = useState(() => restoredRun?.levelIndex ?? 0);
  
  // Game session identifiers
  const runIdRef = useRef<string>(restoredRun?.runId ?? '');
  useEffect(() => {
    if (!runIdRef.current) {
      runIdRef.current = uuidv4();
    }
  }, []);

  // Load a server-randomised question pack at game start.
  const [gamePack, setGamePack] = useState<Question[] | null>(() => restoredRun?.gamePack ?? null);
  useEffect(() => {
    if (restoredRun?.gamePack?.length) return;
    fetchQuizGamePack().then(setGamePack);
  }, []);

  const [score, setScore] = useState(() => restoredRun?.score ?? 0);
  const [recoverySkipsRemaining, setRecoverySkipsRemaining] = useState(
    () => restoredRun?.recoverySkipsRemaining ?? SPOT_RECOVERY_SKIP_COUNT,
  );
  const [failureCanAdvance, setFailureCanAdvance] = useState(
    () => restoredRun?.failureCanAdvance ?? false,
  );
  
  // Current question data
  const currentLevel = LEVELS[levelIndex];
  const questionTimerSec = currentLevel
    ? (devTestMode ? DEV_TEST_TIMER_SECONDS : currentLevel.timerSec)
    : 0;
  
  // Use the server pack if available, otherwise fall back to local QUESTIONS.
  const questionPool = useMemo(() => {
    const source = gamePack ?? QUESTIONS;
    return source.filter(q => q.level === currentLevel?.level);
  }, [gamePack, currentLevel]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(
    () => restoredRun?.currentQuestion ?? null,
  );
  const [shuffledOptions, setShuffledOptions] = useState<ShuffledOption[]>(
    () => restoredRun?.shuffledOptions ?? [],
  );
  const [imageOptions, setImageOptions] = useState<ImageQuizOption[]>(
    () => restoredRun?.imageOptions ?? [],
  );
  const [selectedIndices, setSelectedIndices] = useState<number[]>(
    () => restoredRun?.selectedIndices ?? [],
  );
  const [timeLeft, setTimeLeft] = useState(() => restoredRun?.timeLeft ?? 0);
  const prevTimeLeftRef = useRef(restoredRun?.timeLeft ?? 0);
<<<<<<< HEAD
=======
  const restoredExpiredPlayingRef = useRef(
    restoredRun?.gameState === 'playing' &&
    restoredRun.timeLeft <= 0 &&
    restoredRun.currentQuestion !== null,
  );
>>>>>>> fc6016e (Preserve Spot and Detective runs across recovery reloads)
  // Failure uses 10 seconds for auto-exit, while a recovered failure
  // auto-continues after five seconds.
  const [explainFailSec, setExplainFailSec] = useState(
    () => restoredRun?.explainFailSec ?? EXPLAIN_FAIL_SECONDS,
  );
  // Visible countdown for the five-second Correct-screen auto-advance.
  const [correctExplainSec, setCorrectExplainSec] = useState(
    () => restoredRun?.correctExplainSec ?? 5,
  );
  const restoredExplainRef = useRef(restoredRun?.gameState === 'explain');
  const restoredCorrectExplainRef = useRef(
    restoredRun?.gameState === 'explain' && restoredRun.explainResult === 'correct',
  );
  const restoredExplainRequiresContinueRef = useRef(restoredRun?.gameState === 'explain');
  
  // Explain screen state
  const [explainResult, setExplainResult] = useState<
    'correct' | 'nearMiss' | 'wrong' | 'skipped' | 'timeout' | null
  >(() => restoredRun?.explainResult ?? null);
  const [pointsEarned, setPointsEarned] = useState(() => restoredRun?.pointsEarned ?? 0);

  // Stats for the run detail
  const [cleared, setCleared] = useState<number[]>(() => restoredRun?.cleared ?? []);
  const [skipped, setSkipped] = useState<number[]>(() => restoredRun?.skipped ?? []);
  const [perLevelData, setPerLevelData] = useState<any[]>(
    () => restoredRun?.perLevelData ?? [],
  );
  const [nearMissLevel, setNearMissLevel] = useState<number | null>(
    () => restoredRun?.nearMissLevel ?? null,
  );

  // Initialize level
  useEffect(() => {
    if (
      gameState === 'playing' &&
      currentLevel &&
      (!currentQuestion || currentQuestion.level !== currentLevel.level)
    ) {
      const q = questionPool[Math.floor(Math.random() * questionPool.length)];
      setCurrentQuestion(q);
      
      const options = q.options.map((text, i) => ({ text, originalIndex: i + 1 }));
      // Shuffle options safely
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }
      setShuffledOptions(options);
      setImageOptions(
        q.kind === 'image'
          ? drawImageQuizOptions(q.options.length, q.correct)
          : [],
      );
      setSelectedIndices([]);
      setTimeLeft(questionTimerSec);
    }
  }, [gameState, levelIndex, currentLevel, questionPool, currentQuestion, questionTimerSec]);

  // Timer logic
  useEffect(() => {
    if (gameState !== 'playing' || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  useEffect(() => {
    // timeLeft starts at 0 and the effect that seeds it from the level runs in
    // the same commit as the switch to 'playing', so a bare `timeLeft === 0`
    // check fires the timeout before the first question is ever rendered.
    // A real timeout is a transition from a running clock down to zero.
    const prev = prevTimeLeftRef.current;
    prevTimeLeftRef.current = timeLeft;
    const restoredExpiredRun =
      restoredExpiredPlayingRef.current &&
      gameState === 'playing' &&
      timeLeft === 0 &&
      currentQuestion !== null;
    if (gameState === 'playing' && timeLeft === 0 && (prev > 0 || restoredExpiredRun)) {
      restoredExpiredPlayingRef.current = false;
      handleTimeout();
    }
  }, [timeLeft, gameState, currentQuestion]);

  // Persist progress periodically
  useEffect(() => {
    if (gameState === 'playing' && session) {
      saveProgress.mutate({
        data: {
          idempotencyKey: runIdRef.current,
          playerId: session.player.id,
          game: 'spot_the_fraud',
          state: {
            levelIndex,
            score,
            cleared,
            skipped,
            perLevelData,
            recoverySkipsRemaining,
          }
        }
      });
    }
    // `saveProgress` is deliberately omitted: it is a fresh object on every render,
    // so including it makes this effect re-run and re-POST in an unbounded loop.
  }, [levelIndex, score, cleared, skipped, recoverySkipsRemaining, gameState]);

  // Eager-fetch a lifeline question so it is ready when the gate opens.
  useEffect(() => {
    if (restoredRun?.lifelineQuestion) return;
    fetchLifelineQuestion().then(setLifelineQuestion);
  }, []);

  // Reentry gate: if this player has already completed this game today, gate
  // them with the lifeline before they can start a new run. The ref prevents
  // the check from firing twice when the standing query re-resolves.
  useEffect(() => {
    if (!reentryChecked.current && standing && gameState === 'rules') {
      reentryChecked.current = true;
      const hasPlayed = (standing as any).scores?.find((s: any) => s.game === 'spot_the_fraud')?.played;
      if (hasPlayed) {
        setLifelineContext('reentry');
        setGameState('lifeline');
      }
    }
  }, [standing, gameState]);

  // Reset the explain-fail countdown each time we enter the explain screen.
  useEffect(() => {
    if (gameState === 'explain') {
      if (restoredExplainRef.current) {
        restoredExplainRef.current = false;
        return;
      }
      setExplainFailSec(
        failureCanAdvance
          ? RECOVERY_AUTO_CONTINUE_SECONDS
          : EXPLAIN_FAIL_SECONDS,
      );
    }
  }, [gameState, failureCanAdvance]);

  // Count down and auto-exit on wrong/timeout/nearMiss explain screen.
  useEffect(() => {
    const isFailExplain =
      gameState === 'explain' &&
      (explainResult === 'wrong' || explainResult === 'timeout' || explainResult === 'nearMiss');
    if (!isFailExplain) return;
    if (devTestMode) return;
    if (restoredExplainRequiresContinueRef.current) return;
    if (explainFailSec <= 0) {
      if (failureCanAdvance) nextLevel();
      else endRun();
      return;
    }
    const t = setTimeout(() => setExplainFailSec(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [explainFailSec, gameState, explainResult, failureCanAdvance]);

  // Correct answers advance automatically after the explanation has been
  // visible for five seconds. The same countdown is shown above Continue.
  useEffect(() => {
    if (gameState !== 'explain' || explainResult !== 'correct') return;
    if (devTestMode) return;
    if (restoredExplainRequiresContinueRef.current) return;
    const seconds = restoredCorrectExplainRef.current ? correctExplainSec : 5;
    restoredCorrectExplainRef.current = false;
    setCorrectExplainSec(seconds);
    const timer = setTimeout(() => nextLevel(), seconds * 1000);
    const countdown = setInterval(() => {
      setCorrectExplainSec(seconds => Math.max(0, seconds - 1));
    }, 1000);
    return () => {
      clearTimeout(timer);
      clearInterval(countdown);
    };
  }, [gameState, explainResult, levelIndex]);

  const startGame = async () => {
    // A visitor can press Start before the eager content preload completes.
    // Resolve the reviewed v5 pack before showing a level in that case.
    const pack = gamePack ?? await fetchQuizGamePack();
    setGamePack(pack);
    runIdRef.current = uuidv4();
    setRecoverySkipsRemaining(SPOT_RECOVERY_SKIP_COUNT);
    setFailureCanAdvance(false);
    setGameState('playing');
  };

  const consumeRecoverySkip = () => {
    const canAdvance = recoverySkipsRemaining > 0;
    if (canAdvance) {
      setRecoverySkipsRemaining((remaining) => Math.max(0, remaining - 1));
    }
    setFailureCanAdvance(canAdvance);
    return canAdvance;
  };

  const handleTimeout = () => {
    const canAdvance = consumeRecoverySkip();
    setExplainResult('timeout');
    setPointsEarned(0);
    setPerLevelData(prev => [...prev, {
      level: currentLevel.level,
      questionId: currentQuestion?.id,
      correct: false,
      points: 0,
      outcome: 'timeout',
      recoverySkipUsed: canAdvance,
    }]);
    setGameState('explain');
  };

  const handleSkip = () => {
    if (!currentLevel.skip || recoverySkipsRemaining <= 0) return;
    consumeRecoverySkip();
    setExplainResult('skipped');
    setPointsEarned(0);
    setSkipped(prev => [...prev, currentLevel.level]);
    setPerLevelData(prev => [...prev, {
      level: currentLevel.level,
      questionId: currentQuestion?.id,
      correct: false,
      points: 0,
       outcome: 'skipped',
       recoverySkipUsed: true,
    }]);
    setGameState('explain');
  };


  const toggleOption = (originalIndex: number) => {
    setSelectedIndices(prev => {
      if (prev.includes(originalIndex)) return prev.filter(i => i !== originalIndex);
      if (prev.length < currentQuestion!.selectN) return [...prev, originalIndex];
      return prev;
    });
  };

  const handleSubmit = () => {
    if (!currentQuestion) return;
    
    const correctAnswers = currentQuestion.correct;
    let correctCount = 0;
    selectedIndices.forEach(idx => {
      if (correctAnswers.includes(idx)) correctCount++;
    });

    if (correctCount === currentQuestion.selectN) {
      // Exact match
      setFailureCanAdvance(false);
      const pts = currentLevel.points;
      setScore(s => s + pts);
      setCleared(prev => [...prev, currentLevel.level]);
      setExplainResult('correct');
      setPointsEarned(pts);
      setPerLevelData(prev => [...prev, { level: currentLevel.level, questionId: currentQuestion.id, correct: true, points: pts, outcome: 'correct' }]);
    } else if (correctCount === currentQuestion.selectN - 1 && currentQuestion.selectN > 1) {
      // Exactly one swap
      const canAdvance = consumeRecoverySkip();
      setScore(s => s + currentLevel.nearMiss);
      setExplainResult('nearMiss');
      setPointsEarned(currentLevel.nearMiss);
      setNearMissLevel(currentLevel.level);
       setPerLevelData(prev => [...prev, {
         level: currentLevel.level,
         questionId: currentQuestion.id,
         correct: false,
         points: currentLevel.nearMiss,
         outcome: 'wrong',
         recoverySkipUsed: canAdvance,
       }]);
    } else {
      const canAdvance = consumeRecoverySkip();
      setExplainResult('wrong');
      setPointsEarned(0);
      setPerLevelData(prev => [...prev, {
        level: currentLevel.level,
        questionId: currentQuestion.id,
        correct: false,
        points: 0,
        outcome: 'wrong',
        recoverySkipUsed: canAdvance,
      }]);
    }
    
    setGameState('explain');
  };

  const nextLevel = () => {
    restoredExplainRequiresContinueRef.current = false;
    const isFailure = explainResult === 'wrong' || explainResult === 'timeout' || explainResult === 'nearMiss';
    if (isFailure && !failureCanAdvance) {
      endRun();
    } else {
      setFailureCanAdvance(false);
      const nextIdx = levelIndex + 1;
      if (nextIdx >= LEVELS.length) {
        endRun();
      } else {
        setLevelIndex(nextIdx);
        setGameState('playing');
      }
    }
  };


  const [finalResult, setFinalResult] = useState<any>(() => restoredRun?.finalResult ?? null);
  const lastPayloadRef = useRef<RunInput | null>(null);
  const [lifelineQuestion, setLifelineQuestion] = useState<LifelineQuestion | null>(
    () => restoredRun?.lifelineQuestion ?? null,
  );
  const [lifelineContext, setLifelineContext] = useState<'gameover' | 'reentry'>(
    () => restoredRun?.lifelineContext ?? 'gameover',
  );
  const reentryChecked = useRef(false);

  useEffect(() => {
    if (!session || gameState === 'rules') return;
    saveActiveRun('spot_the_fraud', session.player.id, {
      version: 1,
      gameState,
      runId: runIdRef.current,
      levelIndex,
      gamePack,
      score,
      recoverySkipsRemaining,
      failureCanAdvance,
      currentQuestion,
      shuffledOptions,
      imageOptions,
      selectedIndices,
      timeLeft,
      explainFailSec,
      correctExplainSec,
      explainResult,
      pointsEarned,
      cleared,
      skipped,
      perLevelData,
      nearMissLevel,
      finalResult,
      lifelineQuestion,
      lifelineContext,
    });
  }, [
    session,
    gameState,
    levelIndex,
    gamePack,
    score,
    recoverySkipsRemaining,
    failureCanAdvance,
    currentQuestion,
    shuffledOptions,
    imageOptions,
    selectedIndices,
    timeLeft,
    explainFailSec,
    correctExplainSec,
    explainResult,
    pointsEarned,
    cleared,
    skipped,
    perLevelData,
    nearMissLevel,
    finalResult,
    lifelineQuestion,
    lifelineContext,
  ]);

  const exitToHome = useCallback(() => {
    if (session) clearActiveRun('spot_the_fraud', session.player.id);
    setLocation('/');
  }, [session, setLocation]);

  const endRun = () => {
    const completedPerfectly = cleared.length === LEVELS.length;
    if (session) {
      let tier = "Participation";
      if (cleared.includes(10)) tier = "Master";
      else if (cleared.includes(5)) tier = "Achiever";

      const payload: RunInput = {
        playerId: session.player.id,
        game: 'spot_the_fraud',
        points: score,
        source: new URLSearchParams(window.location.search).get('src') === 'qr' ? 'phone' : 'kiosk',
        idempotencyKey: runIdRef.current,
        detail: {
          levelReached: levelIndex + 1,
          cleared,
          nearMiss: nearMissLevel,
           skipped,
           recoverySkipsUsed: SPOT_RECOVERY_SKIP_COUNT - recoverySkipsRemaining,
          tier,
          perLevel: perLevelData
        }
      };
      
      lastPayloadRef.current = payload;

      submitRun.mutate({ data: payload }, {
        onSuccess: (res) => {
          setFinalResult(res);
          setGameState(completedPerfectly ? 'highscore' : 'lifeline');
        },
        onError: () => {
          setGameState('error');
        }
      });
    } else {
      setFinalResult({ pointsRecorded: score, isPersonalBest: false, standing: { rank: 0, behind: 0 } });
      setGameState(completedPerfectly ? 'highscore' : 'lifeline');
    }
  };

  const handleRetrySubmit = () => {
    if (lastPayloadRef.current) {
      submitRun.mutate({ data: lastPayloadRef.current }, {
        onSuccess: (res) => {
          setFinalResult(res);
      setGameState(cleared.length === LEVELS.length ? 'highscore' : 'lifeline');
        },
        onError: () => {
          setGameState('error');
        }
      });
    }
  };

  if (gameState === 'rules') {
    return (
      <Layout title="Spot the Fraud" back={exitToHome}>
        <RulesScreen 
          gameName="Spot the Fraud"
          premise="Ten levels of fraud rings, mule chains, and synthetic media. Four options each - harder levels need two answers."
          scoring="Up to 100 points - Banked points stay yours, even if you fail later."
          endsWhen="A wrong answer ends your run once all 3 skips are used."
          lifelines="After game over answer the Lifeline question to retry."
          standing={standing}
          gameKey="spot_the_fraud"
          onStart={startGame}
        />
      </Layout>
    );
  }


  if (gameState === 'explain' && currentQuestion) {
    const isCorrect = explainResult === 'correct';
    const isNearMiss = explainResult === 'nearMiss';
    const isWrong = explainResult === 'wrong' || explainResult === 'timeout';
    const isSkipped = explainResult === 'skipped';

    return (
      <Layout title="Spot the Fraud" back={exitToHome}>
        <div className="flex min-h-0 flex-1 flex-col pt-4 pb-4">
          <div className="shrink-0">
            <div className="flex">
              <span className={cn(
                "font-mono text-eyebrow-micro font-medium uppercase tracking-[0.03em]",
                isCorrect ? "text-lime-300" : isNearMiss ? "text-coral-400" : isSkipped ? "text-[var(--text-on-dark-muted)]" : "text-coral-600"
              )}>
                [{isCorrect ? 'Clear' : isNearMiss ? 'Near Miss' : isSkipped ? 'Skipped' : explainResult === 'timeout' ? 'Timeout' : 'Failed'}]
              </span>
            </div>
            
            <h1 className="mt-2 font-sans text-display-lg font-normal text-white">
              {isCorrect ? 'Correct.' : isNearMiss ? 'Partial Match.' : isSkipped ? 'Passed.' : explainResult === 'timeout' ? 'Time Expired.' : 'Incorrect.'}
            </h1>
          </div>
          
          <div className="mt-4 flex min-h-0 flex-1 flex-col">
            {(isCorrect || isNearMiss) && (
              <div className="mb-4 shrink-0">
                <StatReadout 
                  value={`+${pointsEarned}`} 
                  caption="Points Awarded" 
                  tone="on-dark" 
                  size="sm" 
                />
              </div>
            )}

            <div className="flex-1 min-h-0 app-scroll">
              <div className="flex flex-col gap-2 border-t border-ink-800 pt-4">
                <span className="font-mono text-eyebrow-micro font-medium uppercase tracking-[0.03em] text-white">
                  Mechanism
                </span>
                <p className="text-body-sm text-[var(--text-on-dark-muted)]">
                  {currentQuestion.why}
                </p>
              </div>
              
              <div className="mt-4 border-l border-violet-700 pl-3 py-1">
                <p className="font-mono text-eyebrow-micro uppercase tracking-[0.03em] text-[var(--text-on-dark-muted)]">
                  {currentQuestion.hook}
                </p>
              </div>
            </div>
          </div>

          <div className="shrink-0 pt-4">
            {(isWrong || isNearMiss) ? (
              <>
                {/* Points banked so far */}
                {score > 0 && (
                  <div className="mb-4">
                    <StatReadout value={score} caption="Points Banked" tone="on-dark" size="sm" />
                  </div>
                )}

                {/* Recovery auto-continues in 5 seconds; an exhausted run auto-exits in 10. */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-eyebrow-micro uppercase tracking-[0.03em] text-[var(--text-on-dark-muted)]">
                      {failureCanAdvance ? 'Auto-continue' : 'Auto-exit'}
                  </span>
                  <span className={cn(
                    "font-mono text-eyebrow-micro tabular-nums",
                    explainFailSec <= 3 ? "text-coral-600 animate-pulse" : "text-[var(--text-on-dark-muted)]"
                  )}>
                    {explainFailSec}s
                  </span>
                </div>
                <div className="h-0.5 w-full bg-ink-800 mb-4">
                  <div
                    className="h-full bg-coral-600 transition-[width] duration-1000 ease-linear"
                    style={{
                      width: `${Math.min(
                        100,
                        (explainFailSec /
                          (failureCanAdvance
                            ? RECOVERY_AUTO_CONTINUE_SECONDS
                            : EXPLAIN_FAIL_SECONDS)) *
                          100,
                      )}%`,
                    }}
                  />
                </div>

                {failureCanAdvance ? (
                  <>
                    <p className="mb-3 font-mono text-eyebrow-micro uppercase tracking-[0.03em] text-violet-400">
                      Skip Used
                    </p>
                    <Button variant="light" size="lg" chevron onClick={nextLevel} className="w-full">
                      Continue
                    </Button>
                  </>
                ) : (
                  <RetryOptions currentGame="spot_the_fraud" onRetry={endRun} />
                )}
              </>
            ) : (
              <>
                {isCorrect && (
                  <div className="mb-2.5">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="font-mono text-eyebrow-micro uppercase tracking-[0.03em] text-[var(--text-on-dark-muted)]">
                        Auto-continue
                      </span>
                      <span className="font-mono text-eyebrow-micro tabular-nums text-[var(--text-on-dark-muted)]">
                        {correctExplainSec}s
                      </span>
                    </div>
                    <div className="h-0.5 w-full bg-ink-800">
                      <div
                        key={`correct-countdown-${levelIndex}`}
                        className="correct-countdown-drain h-full w-full bg-violet-500"
                      />
                    </div>
                  </div>
                )}
                <Button variant="light" size="lg" chevron onClick={nextLevel} className="w-full">
                  Continue
                </Button>
              </>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  if (gameState === 'error') {
    return (
      <Layout title="Spot the Fraud" back={exitToHome}>
        <div className="flex min-h-0 flex-1 flex-col justify-center items-center text-center pb-4 pt-4">
          <IconTile icon={ShieldAlert} size={48} />
          <h1 className="mt-6 font-sans text-display-lg font-normal text-white">Save Failed.</h1>
          <p className="mt-2 text-body-sm text-[var(--text-on-dark-muted)]">
            We could not record your run due to a network error. Your points are safe.
          </p>
          <div className="mt-8 w-full">
            <Button variant="light" size="lg" chevron onClick={handleRetrySubmit} disabled={submitRun.isPending} className="w-full">
              {submitRun.isPending ? 'Retrying' : 'Retry submit'}
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (gameState === 'highscore') {
    return (
      <GameEndScreen
        currentGame="spot_the_fraud"
        points={finalResult?.pointsRecorded ?? score}
        standing={finalResult?.standing}
        isPersonalBest={finalResult?.isPersonalBest}
        highScore
      />
    );
  }

  if (gameState === 'lifeline') {
    if (!lifelineQuestion) return null;
    return (
      <LifelineGate
        question={lifelineQuestion}
        context={lifelineContext}
        gameTitle="Spot the Fraud"
        scoreDisplay={score > 0 ? (
          <div className="relative flex items-baseline gap-1.5 pr-3">
            <span className="font-sans text-display-md font-normal tabular-nums text-white">{score}</span>
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.03em] text-[var(--text-on-dark-muted)]">
              Points Banked
            </span>
            <span aria-hidden className="absolute right-0 top-0 size-2 bg-violet-700" />
          </div>
        ) : undefined}
        compact
        onRetry={() => {
          if (session) clearActiveRun('spot_the_fraud', session.player.id);
          setScore(0);
          setLevelIndex(0);
          setCurrentQuestion(null);
          setShuffledOptions([]);
          setImageOptions([]);
          setSelectedIndices([]);
          setExplainResult(null);
          setCleared([]);
          setSkipped([]);
           setRecoverySkipsRemaining(SPOT_RECOVERY_SKIP_COUNT);
           setFailureCanAdvance(false);
          setPerLevelData([]);
          setNearMissLevel(null);
          setFinalResult(null);
          fetchLifelineQuestion().then(setLifelineQuestion);
          setGameState('rules');
        }}
        onExit={exitToHome}
      />
    );
  }

  // gameState === 'playing'
  const isImageQuestion = currentQuestion?.kind === 'image';
  const imageQuestionInstruction = currentQuestion?.selectN === 1 ? 'Only One Correct' : 'Two Correct';

  return (
    <Layout 
      title="Spot the Fraud" 
      back={exitToHome}
    >
      <div className="flex min-h-0 flex-1 flex-col pt-3 pb-4">
        
        {/* Header HUD */}
        <div className="shrink-0 flex flex-col gap-2 border-b border-ink-800 pb-3">
          {/* Level + score row */}
          <div className="flex items-center justify-between">
             <EyebrowTag>
               {currentLevel.kind === 'image'
                 ? `Find the AI generated image · ${currentLevel.correctCount === 1 ? 'Only One Correct' : 'Two Correct'}`
                 : currentLevel.label}
             </EyebrowTag>
            <span className="font-mono text-eyebrow-micro tabular-nums text-white uppercase tracking-[0.03em]">
              Score <span className="text-violet-500">{score}</span>
            </span>
          </div>

          {/* Progress + lifelines row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex h-2 flex-1 gap-px bg-ink-800 p-px">
              {LEVELS.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-full flex-1 transition-colors duration-[var(--dur-base)]",
                    i === levelIndex ? "bg-cyan-500" : i < levelIndex ? "bg-violet-700" : "bg-ink-900"
                  )}
                />
              ))}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className={cn(
                "font-mono text-eyebrow-micro uppercase tracking-[0.03em]",
                recoverySkipsRemaining > 0 ? "text-violet-400" : "text-[var(--text-on-dark-faint)]"
              )}>
                Skips {recoverySkipsRemaining}/{SPOT_RECOVERY_SKIP_COUNT}
              </span>
            </div>
          </div>
        </div>

        {/* Timer bar — starts at 100% and drains to zero.
            Suppress the CSS transition on the first frame so the bar snaps
            to full rather than animating up from 0% when the question mounts. */}
        <div className="shrink-0 h-1 w-full bg-ink-800 mt-3">
          <div
            className={cn(
              "h-full",
              // Only drain-animate once the clock has started ticking; on the
              // first render timeLeft === timerSec so we skip the transition.
               questionTimerSec > 0 && timeLeft < questionTimerSec && "transition-[width] duration-1000 ease-linear",
              timeLeft <= 5 ? "bg-coral-600" : "bg-cyan-500"
            )}
            style={{ width: `${questionTimerSec ? (timeLeft / questionTimerSec) * 100 : 0}%` }}
          />
        </div>

        {/* Question Area */}
        {currentQuestion && (
          <div className="flex min-h-0 flex-1 flex-col">
            {/* Stem */}
            <h2 className="shrink-0 pt-4 font-sans text-card-title font-medium leading-snug text-white">
              {isImageQuestion ? 'Find the AI generated image.' : currentQuestion.stem}
            </h2>

            {isImageQuestion ? (
              <p className="mt-2 shrink-0 font-mono text-eyebrow-micro font-medium uppercase tracking-[0.03em] text-violet-500">
                {imageQuestionInstruction}
              </p>
            ) : currentQuestion.selectN > 1 && (
              <p className="mt-2 shrink-0 font-mono text-eyebrow-micro font-medium uppercase tracking-[0.03em] text-violet-500">
                Select {currentQuestion.selectN}
              </p>
            )}

            {/* Image questions use a four-card visual grid. Text questions keep
                the larger, naturally-sized answer rows. */}
            <div className={cn(
              "mt-3 min-h-0 flex-1 pr-0.5 stagger-in",
              currentQuestion.kind === 'image'
                ? "grid min-h-0 grid-cols-2 grid-rows-2 gap-2 overflow-hidden"
                : "flex flex-col gap-2 overflow-y-auto"
            )}>
              {shuffledOptions.map((opt, i) => {
                const isSelected = selectedIndices.includes(opt.originalIndex);
                const isDevCorrect = devTestMode && currentQuestion.correct.includes(opt.originalIndex);
                const quizImage = currentQuestion.kind === 'image'
                  ? imageOptions[opt.originalIndex - 1]
                  : null;
                return (
                  <button
                    key={i}
                    onClick={() => toggleOption(opt.originalIndex)}
                    data-dev-correct={isDevCorrect || undefined}
                    className={cn(
                      "tap group relative shrink-0 overflow-hidden border text-left transition-colors duration-[var(--dur-base)]",
                      currentQuestion.kind === 'image'
                        ? "h-full min-h-0 w-full"
                        : "flex w-full items-center gap-3 px-4 py-3.5",
                      isDevCorrect
                        ? "border-lime-300 bg-[rgba(190,242,100,0.10)] hover:border-lime-300"
                        : isSelected
                        ? "border-violet-700 bg-[rgba(71,21,255,0.08)]"
                        : "border-ink-800 bg-ink-900 hover:border-violet-700"
                    )}
                  >
                    {currentQuestion.kind === 'image' && (
                      <>
                        <img
                          src={quizImage!.src}
                          alt={`${quizImage!.label} visual quiz card`}
                          className={cn(
                            "absolute inset-0 size-full bg-ink-950 object-contain px-2 pt-2 pb-10 transition-opacity duration-[var(--dur-base)] sm:px-3 sm:pt-3",
                            isSelected && "opacity-60"
                          )}
                        />
                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-[rgba(0,2,36,0.82)] px-2 py-1.5">
                          <span className="font-mono text-eyebrow-micro font-medium tabular-nums text-white">
                            {quizImage!.label}
                          </span>
                          <ScanEye className={cn("size-4", isSelected ? "text-violet-500" : "text-white/70")} strokeWidth={1.5} />
                        </div>
                      </>
                    )}
                    {currentQuestion.kind !== 'image' && (
                      <>
                        <span className={cn(
                          "shrink-0 font-mono text-eyebrow-micro font-medium tabular-nums",
                          isSelected ? "text-violet-500" : "text-[var(--text-on-dark-muted)]"
                        )}>
                          {String(opt.originalIndex).padStart(2, '0')}
                        </span>
                        <span className="min-w-0 flex-1 font-sans text-body-md leading-snug text-white">
                          {opt.text}
                        </span>
                      </>
                    )}
                    {isDevCorrect && (
                      <span className={cn(
                        "pointer-events-none absolute z-10 bg-lime-300 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.03em] text-ink-950",
                        currentQuestion.kind === 'image' ? "left-2 top-2" : "right-8 top-2"
                      )}>
                        Dev correct
                      </span>
                    )}
                    <div className={cn(
                      "shrink-0",
                      currentQuestion.kind === 'image' && "absolute right-2 top-2"
                    )}>
                      {isSelected
                        ? <div className="size-3 bg-violet-500" />
                        : <div className={cn("size-3 border", currentQuestion.kind === 'image' ? "border-white/80 bg-[rgba(0,2,36,0.5)]" : "border-ink-700")} />
                      }
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex shrink-0 items-center gap-2 pt-3">
              <Button
                variant="light"
                size="lg"
                chevron
                disabled={selectedIndices.length !== currentQuestion.selectN}
                onClick={handleSubmit}
                className="min-w-0 flex-1"
              >
                Submit response
              </Button>
              {currentLevel.skip && recoverySkipsRemaining > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={handleSkip}
                >
                  Skip
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
