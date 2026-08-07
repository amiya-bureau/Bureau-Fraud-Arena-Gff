import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { usePlayerSession } from '@/lib/store';
import { Layout } from '@/components/layout';
import { RulesScreen } from '@/components/rules-screen';
import { QrPanel } from '@/components/qr-panel';
import { Button } from '@/components/ui/button';
import { LEVELS, QUESTIONS, BUREAU_QUESTIONS, Level, Question, BureauQuestion } from '@/data/quiz';
import { GameEndScreen } from '@/components/game-end-screen';
import { fetchQuizGamePack } from '@/lib/gamePack';
import { useSubmitRun, useSaveRunProgress, useGetPlayerStanding, RunInput } from '@workspace/api-client-react';
import { v4 as uuidv4 } from 'uuid';
import { ShieldAlert, ScanEye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EyebrowTag } from '@/components/bureau/eyebrow-tag';
import { StatReadout } from '@/components/bureau/stat-readout';
import { IconTile } from '@/components/bureau/icon-tile';


// We shuffle options but keep track of their original 1-based index
interface ShuffledOption {
  text: string;
  originalIndex: number;
  removed: boolean;
}

type GameState = 'rules' | 'playing' | 'bureau' | 'explain' | 'gameover' | 'error';

export default function SpotTheFraud() {
  const { session } = usePlayerSession();
  const [, setLocation] = useLocation();
  const { data: standing } = useGetPlayerStanding(session?.player.id || '', 'today');
  const submitRun = useSubmitRun();
  const saveProgress = useSaveRunProgress();

  const [gameState, setGameState] = useState<GameState>('rules');
  const [levelIndex, setLevelIndex] = useState(0);
  
  // Game session identifiers
  const runIdRef = useRef<string>('');
  useEffect(() => {
    if (!runIdRef.current) {
      runIdRef.current = uuidv4();
    }
  }, []);

  // Load a server-randomised question pack at game start.
  const [gamePack, setGamePack] = useState<Question[] | null>(null);
  useEffect(() => {
    fetchQuizGamePack().then(setGamePack);
  }, []);

  const [score, setScore] = useState(0);
  const [bureauSeen, setBureauSeen] = useState(false);
  const [fiftyFifty, setFiftyFifty] = useState<'locked' | 'available' | 'used'>('locked');
  
  // Current question data
  const currentLevel = LEVELS[levelIndex];
  
  // Use the server pack if available, otherwise fall back to local QUESTIONS.
  const questionPool = useMemo(() => {
    const source = gamePack ?? QUESTIONS;
    return source.filter(q => q.level === currentLevel?.level);
  }, [gamePack, currentLevel]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [shuffledOptions, setShuffledOptions] = useState<ShuffledOption[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const prevTimeLeftRef = useRef(0);
  
  const [bureauQuestion, setBureauQuestion] = useState<BureauQuestion | null>(null);

  // Explain screen state
  const [explainResult, setExplainResult] = useState<'correct' | 'nearMiss' | 'wrong' | 'skipped' | 'timeout' | null>(null);
  const [pointsEarned, setPointsEarned] = useState(0);

  // Stats for the run detail
  const [cleared, setCleared] = useState<number[]>([]);
  const [skipped, setSkipped] = useState<number[]>([]);
  const [perLevelData, setPerLevelData] = useState<any[]>([]);
  const [nearMissLevel, setNearMissLevel] = useState<number | null>(null);

  // Initialize level
  useEffect(() => {
    if (gameState === 'playing' && currentLevel) {
      const q = questionPool[Math.floor(Math.random() * questionPool.length)];
      setCurrentQuestion(q);
      
      const options = q.options.map((text, i) => ({ text, originalIndex: i + 1, removed: false }));
      // Shuffle options safely
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }
      setShuffledOptions(options);
      setSelectedIndices([]);
      setTimeLeft(currentLevel.timerSec);
    }
  }, [gameState, levelIndex, currentLevel, questionPool]);

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
    if (gameState === 'playing' && prev > 0 && timeLeft === 0) {
      handleTimeout();
    }
  }, [timeLeft, gameState]);

  // Persist progress periodically
  useEffect(() => {
    if (gameState === 'playing' && session) {
      saveProgress.mutate({
        data: {
          idempotencyKey: runIdRef.current,
          playerId: session.player.id,
          game: 'spot_the_fraud',
          state: { levelIndex, score, fiftyFifty, bureauSeen, cleared, skipped, perLevelData }
        }
      });
    }
    // `saveProgress` is deliberately omitted: it is a fresh object on every render,
    // so including it makes this effect re-run and re-POST in an unbounded loop.
  }, [levelIndex, score, fiftyFifty, bureauSeen, cleared, skipped, gameState]);

  const startGame = () => setGameState('playing');

  const handleTimeout = () => {
    setExplainResult('timeout');
    setPointsEarned(0);
    setPerLevelData(prev => [...prev, {
      level: currentLevel.level,
      questionId: currentQuestion?.id,
      correct: false,
      points: 0,
      outcome: 'timeout'
    }]);
    setGameState('explain');
  };

  const handleSkip = () => {
    setExplainResult('skipped');
    setPointsEarned(0);
    setSkipped(prev => [...prev, currentLevel.level]);
    setPerLevelData(prev => [...prev, {
      level: currentLevel.level,
      questionId: currentQuestion?.id,
      correct: false,
      points: 0,
      outcome: 'skipped'
    }]);
    setGameState('explain');
  };

  const handleFiftyFifty = () => {
    if (fiftyFifty !== 'available' || !currentQuestion) return;
    setFiftyFifty('used');
    
    // Remove `fiftyRemoves` wrong options
    const wrongOptions = shuffledOptions.filter(o => !currentQuestion.correct.includes(o.originalIndex) && !o.removed);
    const toRemove = wrongOptions.slice(0, currentLevel.fiftyRemoves);
    
    setShuffledOptions(prev => prev.map(o => 
      toRemove.find(r => r.originalIndex === o.originalIndex) ? { ...o, removed: true } : o
    ));
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
      let pts = currentLevel.points;
      if (fiftyFifty === 'used' && levelIndex >= 4) {
        pts = Math.max(1, pts - 3);
      }
      setScore(s => s + pts);
      setCleared(prev => [...prev, currentLevel.level]);
      setExplainResult('correct');
      setPointsEarned(pts);
      setPerLevelData(prev => [...prev, { level: currentLevel.level, questionId: currentQuestion.id, correct: true, points: pts, outcome: 'correct' }]);
    } else if (correctCount === currentQuestion.selectN - 1 && currentQuestion.selectN > 1) {
      // Exactly one swap
      setScore(s => s + currentLevel.nearMiss);
      setExplainResult('nearMiss');
      setPointsEarned(currentLevel.nearMiss);
      setNearMissLevel(currentLevel.level);
      setPerLevelData(prev => [...prev, { level: currentLevel.level, questionId: currentQuestion.id, correct: false, points: currentLevel.nearMiss, outcome: 'wrong' }]);
    } else {
      setExplainResult('wrong');
      setPointsEarned(0);
      setPerLevelData(prev => [...prev, { level: currentLevel.level, questionId: currentQuestion.id, correct: false, points: 0, outcome: 'wrong' }]);
    }
    
    setGameState('explain');
  };

  const nextLevel = () => {
    if (explainResult === 'wrong' || explainResult === 'timeout' || explainResult === 'nearMiss') {
      endRun();
    } else {
      const nextIdx = levelIndex + 1;
      if (nextIdx >= LEVELS.length) {
        endRun();
      } else if (nextIdx === 4 && !bureauSeen) {
        // After level 4, before level 5 show Bureau question
        setBureauQuestion(BUREAU_QUESTIONS[Math.floor(Math.random() * BUREAU_QUESTIONS.length)]);
        setGameState('bureau');
      } else {
        setLevelIndex(nextIdx);
        setGameState('playing');
      }
    }
  };

  const handleBureauAnswer = (originalIndex: number) => {
    // Answer is ALWAYS 'Bureau' (option index 1)
    if (originalIndex === 1) {
      setFiftyFifty('available');
      setBureauSeen(true);
      setLevelIndex(4); // Level 5
      setGameState('playing');
    }
    // If wrong, we just let them try again
  };

  const [finalResult, setFinalResult] = useState<any>(null);
  const lastPayloadRef = useRef<RunInput | null>(null);

  // `bureauResolved` is passed by the end-of-run sponsor question once the player
  // has answered it, so we fall through to submission instead of prompting again.
  // It cannot rely on the `bureauSeen` state, which has not applied yet at that point.
  const endRun = (bureauResolved = false) => {
    if (!bureauResolved && !bureauSeen && levelIndex < 4) {
      setBureauQuestion(BUREAU_QUESTIONS[Math.floor(Math.random() * BUREAU_QUESTIONS.length)]);
      setGameState('bureau');
      return;
    }

    // Submit run
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
          fiftyUsed: fiftyFifty === 'used',
          bureauSeen: bureauSeen || bureauResolved,
          tier,
          perLevel: perLevelData
        }
      };
      
      lastPayloadRef.current = payload;

      submitRun.mutate({ data: payload }, {
        onSuccess: (res) => {
          setFinalResult(res);
          setGameState('gameover');
        },
        onError: () => {
          setGameState('error');
        }
      });
    } else {
      setFinalResult({ pointsRecorded: score, isPersonalBest: false, standing: { rank: 0, behind: 0 } });
      setGameState('gameover');
    }
  };

  const handleRetrySubmit = () => {
    if (lastPayloadRef.current) {
      submitRun.mutate({ data: lastPayloadRef.current }, {
        onSuccess: (res) => {
          setFinalResult(res);
          setGameState('gameover');
        },
        onError: () => {
          setGameState('error');
        }
      });
    }
  };

  if (gameState === 'rules') {
    return (
      <Layout title="Spot the Fraud" back="/">
        <RulesScreen 
          gameName="Spot the Fraud"
          premise="A ten-level ladder of fraud rings, mule chains, and synthetic media. The higher you climb, the harder they get."
          scoring="Up to 100 points. Points banked are kept even if you fail later."
          endsWhen="One wrong answer or timeout ends your run. On multi-select questions, one swap is a near-miss (half points) and ends the run."
          lifelines="Skip is available on most levels. The 50:50 lifeline is locked until you find the sponsor."
          standing={standing}
          gameKey="spot_the_fraud"
          onStart={startGame}
        />
        <div className="absolute bottom-6 right-6 hidden md:block">
          <QrPanel game="spot-the-fraud" />
        </div>
      </Layout>
    );
  }

  if (gameState === 'bureau' && bureauQuestion) {
    const isConsolation = explainResult !== null && (explainResult === 'wrong' || explainResult === 'timeout' || explainResult === 'nearMiss');

    return (
      <Layout title="Spot the Fraud" back="/">
        <div className="flex min-h-0 flex-1 flex-col pt-4 pb-4">
          <div className="shrink-0">
            <EyebrowTag tone="violet">Sponsor Override</EyebrowTag>
            
            <h1 className="mt-3 font-sans text-display-lg font-normal text-white">
              The System Question.
            </h1>
            
            <p className="mt-2 text-body-sm text-[var(--text-on-dark-muted)]">
              Get this right to unlock the 50:50 lifeline {isConsolation ? 'for your next run.' : 'for the rest of this run.'}
            </p>
          </div>
          
          {/* Question stem */}
          <div className="mt-4 shrink-0 border border-ink-800 bg-ink-900 p-4">
            <p className="font-sans text-body-md leading-snug text-white">
              {bureauQuestion.stem}
            </p>
          </div>

          {/* Options — same compact-card pattern as the main quiz */}
          <div className="mt-3 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto stagger-in">
            {bureauQuestion.options.map((opt, idx) => (
              <button
                key={idx}
                className="tap flex w-full shrink-0 items-center gap-3 border border-ink-800 bg-ink-900 px-4 py-3.5 text-left transition-colors duration-[var(--dur-base)] hover:border-violet-700 active:bg-[rgba(71,21,255,0.05)]"
                onClick={() => {
                  if (idx + 1 === 1) {
                    if (isConsolation) {
                      setBureauSeen(true);
                      endRun(true);
                    } else {
                      handleBureauAnswer(idx + 1);
                    }
                  }
                }}
              >
                <span className="shrink-0 font-mono text-eyebrow-micro font-medium tabular-nums text-violet-500">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1 font-sans text-body-md leading-snug text-white">
                  {opt}
                </span>
              </button>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (gameState === 'explain' && currentQuestion) {
    const isCorrect = explainResult === 'correct';
    const isNearMiss = explainResult === 'nearMiss';
    const isWrong = explainResult === 'wrong' || explainResult === 'timeout';
    const isSkipped = explainResult === 'skipped';

    return (
      <Layout title="Spot the Fraud" back="/">
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
            <Button variant="light" size="lg" chevron onClick={nextLevel} className="w-full">
              {isWrong || isNearMiss ? 'End run' : 'Continue'}
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (gameState === 'error') {
    return (
      <Layout title="Spot the Fraud" back="/">
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

  if (gameState === 'gameover') {
    if (!finalResult) return null;
    return (
      <GameEndScreen
        currentGame="spot_the_fraud"
        points={finalResult.pointsRecorded}
        standing={finalResult.standing}
        isPersonalBest={finalResult.isPersonalBest}
        onPlayAgain={() => window.location.reload()}
      />
    );
  }

  // gameState === 'playing'
  return (
    <Layout 
      title="Spot the Fraud" 
      back="/"
    >
      <div className="flex min-h-0 flex-1 flex-col pt-3 pb-4">
        
        {/* Header HUD */}
        <div className="shrink-0 flex flex-col gap-2 border-b border-ink-800 pb-3">
          {/* Level + score row */}
          <div className="flex items-center justify-between">
            <EyebrowTag>{currentLevel.label}</EyebrowTag>
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
            <div className="flex shrink-0 border border-ink-800">
              {currentLevel.skip && (
                <button
                  className="tap px-3 py-1.5 font-mono text-eyebrow-micro font-medium uppercase tracking-[0.03em] text-[var(--text-on-dark-muted)] hover:bg-ink-900 hover:text-white"
                  onClick={handleSkip}
                >
                  Skip
                </button>
              )}
              <button
                className={cn(
                  "tap border-l border-ink-800 px-3 py-1.5 font-mono text-eyebrow-micro font-medium uppercase tracking-[0.03em]",
                  fiftyFifty === 'locked' && "text-[var(--text-on-dark-faint)]",
                  fiftyFifty === 'used'   && "text-[var(--text-on-dark-faint)]",
                  fiftyFifty === 'available' && "text-violet-500 hover:bg-ink-900 hover:text-white"
                )}
                disabled={fiftyFifty !== 'available' || !currentLevel.fiftyFifty}
                onClick={handleFiftyFifty}
              >
                50:50
              </button>
            </div>
          </div>
        </div>

        {/* Timer bar — full width, shrinks linearly to zero as time runs out */}
        <div className="shrink-0 h-1 w-full bg-ink-800 mt-3">
          <div
            className={cn(
              "h-full transition-[width] duration-1000 ease-linear",
              timeLeft <= 5 ? "bg-coral-600" : "bg-cyan-500"
            )}
            style={{ width: `${currentLevel ? (timeLeft / currentLevel.timerSec) * 100 : 0}%` }}
          />
        </div>

        {/* Question Area */}
        {currentQuestion && (
          <div className="flex min-h-0 flex-1 flex-col">
            {/* Stem */}
            <h2 className="shrink-0 pt-4 font-sans text-card-title font-medium leading-snug text-white">
              {currentQuestion.stem}
            </h2>

            {currentQuestion.selectN > 1 && (
              <p className="mt-2 shrink-0 font-mono text-eyebrow-micro font-medium uppercase tracking-[0.03em] text-violet-500">
                Select {currentQuestion.selectN}
              </p>
            )}

            {/* Options — naturally-sized cards, scrollable if they overflow */}
            <div className="mt-3 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-0.5 stagger-in">
              {shuffledOptions.map((opt, i) => {
                if (opt.removed) return null;
                const isSelected = selectedIndices.includes(opt.originalIndex);
                return (
                  <button
                    key={i}
                    onClick={() => toggleOption(opt.originalIndex)}
                    className={cn(
                      "tap group flex w-full shrink-0 items-center gap-3 border px-4 py-3.5 text-left transition-colors duration-[var(--dur-base)]",
                      isSelected
                        ? "border-violet-700 bg-[rgba(71,21,255,0.08)]"
                        : "border-ink-800 bg-ink-900 hover:border-violet-700"
                    )}
                  >
                    <span className={cn(
                      "shrink-0 font-mono text-eyebrow-micro font-medium tabular-nums",
                      isSelected ? "text-violet-500" : "text-[var(--text-on-dark-muted)]"
                    )}>
                      {String(opt.originalIndex).padStart(2, '0')}
                    </span>
                    <span className="min-w-0 flex-1 font-sans text-body-md leading-snug text-white">
                      {opt.text}
                    </span>
                    {currentQuestion.kind === 'image' && (
                      <ScanEye className={cn("size-4 shrink-0", isSelected ? "text-violet-500" : "text-ink-700")} strokeWidth={1.5} />
                    )}
                    <div className="shrink-0">
                      {isSelected
                        ? <div className="size-3 bg-violet-500" />
                        : <div className="size-3 border border-ink-700" />
                      }
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="shrink-0 pt-3">
              <Button
                variant="light"
                size="lg"
                chevron
                disabled={selectedIndices.length !== currentQuestion.selectN}
                onClick={handleSubmit}
                className="w-full"
              >
                Submit response
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
