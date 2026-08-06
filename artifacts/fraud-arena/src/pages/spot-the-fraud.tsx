import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'wouter';
import { usePlayerSession } from '@/lib/store';
import { Layout } from '@/components/layout';
import { RulesScreen } from '@/components/rules-screen';
import { QrPanel } from '@/components/qr-panel';
import { Button } from '@/components/ui/button';
import { LEVELS, QUESTIONS, BUREAU_QUESTIONS, Level, Question, BureauQuestion } from '@/data/quiz';
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

  const [score, setScore] = useState(0);
  const [bureauSeen, setBureauSeen] = useState(false);
  const [fiftyFifty, setFiftyFifty] = useState<'locked' | 'available' | 'used'>('locked');
  
  // Current question data
  const currentLevel = LEVELS[levelIndex];
  
  // Pick a random question for this level
  const questionPool = useMemo(() => QUESTIONS.filter(q => q.level === currentLevel?.level), [currentLevel]);
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
      <Layout>
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
      <Layout>
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center py-12">
          <EyebrowTag tone="violet">Sponsor Override</EyebrowTag>
          
          <h1 className="mt-6 font-sans text-display-xl font-normal text-white">
            The System Question.
          </h1>
          
          <p className="mt-4 max-w-[56ch] text-body-lede text-[var(--text-on-dark-muted)]">
            Get this right to unlock the 50:50 lifeline {isConsolation ? 'for your next run.' : 'for the rest of this run.'}
          </p>
          
          <div className="mt-8 border border-ink-800 bg-ink-900 p-6 md:p-8">
            <p className="font-sans text-body-lg text-white">
              {bureauQuestion.stem}
            </p>
          </div>
          
          <div className="mt-px flex flex-col gap-px border-b border-x border-ink-800 bg-ink-800">
            {bureauQuestion.options.map((opt, idx) => (
              <button 
                key={idx} 
                className="flex items-start gap-6 border border-transparent bg-ink-900 p-6 text-left transition-colors duration-[var(--dur-base)] hover:border-violet-700 hover:bg-[rgba(71,21,255,0.05)]"
                onClick={() => {
                  if (idx + 1 === 1) {
                    if (isConsolation) {
                      // Submit the run rather than jumping straight to 'gameover',
                      // which renders null until finalResult exists and would have
                      // discarded the run entirely.
                      setBureauSeen(true);
                      endRun(true);
                    } else {
                      handleBureauAnswer(idx + 1);
                    }
                  }
                }}
              >
                <span className="mt-1 font-mono text-body-md font-medium tabular-nums text-violet-500">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span className="font-sans text-body-lg text-white">{opt}</span>
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
      <Layout>
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center py-12">
          <div className="flex">
            <span className={cn(
              "font-mono text-eyebrow font-medium uppercase tracking-[0.03em]",
              isCorrect ? "text-lime-300" : isNearMiss ? "text-coral-400" : isSkipped ? "text-[var(--text-on-dark-muted)]" : "text-coral-600"
            )}>
              [{isCorrect ? 'Clear' : isNearMiss ? 'Near Miss' : isSkipped ? 'Skipped' : explainResult === 'timeout' ? 'Timeout' : 'Failed'}]
            </span>
          </div>
          
          <h1 className="mt-6 font-sans text-display-xl font-normal text-white">
            {isCorrect ? 'Correct.' : isNearMiss ? 'Partial Match.' : isSkipped ? 'Passed.' : explainResult === 'timeout' ? 'Time Expired.' : 'Incorrect.'}
          </h1>
          
          {(isCorrect || isNearMiss) && (
            <div className="mt-8">
              <StatReadout 
                value={`+${pointsEarned}`} 
                caption="Points Awarded" 
                tone="on-dark" 
                size="md" 
              />
            </div>
          )}

          <div className="mt-stack border-t border-ink-800 pt-8">
            <div className="flex flex-col gap-2">
              <span className="font-mono text-eyebrow font-medium uppercase tracking-[0.03em] text-white">
                Mechanism
              </span>
              <p className="mt-2 max-w-[64ch] text-body-lg text-[var(--text-on-dark-muted)]">
                {currentQuestion.why}
              </p>
            </div>
            
            <div className="mt-8 border-l border-violet-700 pl-4">
              <p className="font-mono text-body-sm uppercase tracking-[0.03em] text-[var(--text-on-dark-muted)]">
                {currentQuestion.hook}
              </p>
            </div>
          </div>

          <div className="mt-stack">
            <Button variant="light" size="lg" chevron onClick={nextLevel} className="w-full md:w-auto">
              {isWrong || isNearMiss ? 'End run' : 'Continue'}
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (gameState === 'error') {
    return (
      <Layout>
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center py-12 text-center">
          <div className="flex justify-center">
            <IconTile icon={ShieldAlert} size={60} />
          </div>
          <h1 className="mt-8 font-sans text-display-xl font-normal text-white">Save Failed.</h1>
          <p className="mt-4 text-body-lg text-[var(--text-on-dark-muted)]">
            We could not record your run due to a network error. Your points are safe.
          </p>
          <div className="mt-stack flex justify-center">
            <Button variant="light" size="lg" chevron onClick={handleRetrySubmit} disabled={submitRun.isPending}>
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
      <Layout>
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center py-12 text-center">
          <div className="flex justify-center">
            <EyebrowTag tone="cyan">Run Complete</EyebrowTag>
          </div>
          
          <div className="mt-8 flex justify-center">
            <StatReadout 
              value={finalResult.pointsRecorded.toString()} 
              caption="Total Points" 
              tone="on-dark" 
              size="lg" 
            />
          </div>

          <div className="mt-stack flex flex-col items-center border-t border-ink-800 pt-8">
            <div className="flex gap-12 text-left">
              <div className="flex flex-col gap-2">
                <span className="font-mono text-eyebrow font-medium uppercase tracking-[0.03em] text-[var(--text-on-dark-muted)]">
                  Levels Cleared
                </span>
                <span className="font-sans text-display-md text-white">
                  {cleared.length}
                </span>
              </div>
              
              {finalResult.standing && (
                <div className="flex flex-col gap-2 border-l border-ink-800 pl-12">
                  <span className="font-mono text-eyebrow font-medium uppercase tracking-[0.03em] text-[var(--text-on-dark-muted)]">
                    Global Rank
                  </span>
                  <span className="font-sans text-display-md text-white">
                    {finalResult.standing.rank}
                    {finalResult.isPersonalBest && (
                      <span className="ml-3 font-mono text-body-sm uppercase tracking-[0.03em] text-cyan-500">
                        PB
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-stack flex flex-col justify-center gap-4 sm:flex-row">
            <Button variant="light" size="lg" chevron onClick={() => window.location.reload()}>
              Play again
            </Button>
            <Button variant="outline" size="lg" onClick={() => setLocation('/')}>
              Return to booth
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // gameState === 'playing'
  return (
    <Layout showHeader={false}>
      <div className="mx-auto flex w-full max-w-4xl flex-col py-8">
        
        {/* Header HUD */}
        <div className="flex flex-col justify-between gap-6 border-b border-ink-800 pb-6 md:flex-row md:items-end">
          <div className="flex flex-col gap-4">
            <div>
              <EyebrowTag>{currentLevel.label}</EyebrowTag>
            </div>
            <div className="font-mono text-display-md tabular-nums text-white">
              Score <span className="text-violet-500">{score}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Lifelines */}
            <div className="flex border border-ink-800">
              {currentLevel.skip && (
                <button 
                  className="px-4 py-2 font-mono text-body-sm font-medium uppercase tracking-[0.03em] text-[var(--text-on-dark-muted)] transition-colors duration-[var(--dur-base)] hover:bg-ink-900 hover:text-white"
                  onClick={handleSkip}
                >
                  Skip
                </button>
              )}
              
              <button 
                className={cn(
                  "border-l border-ink-800 px-4 py-2 font-mono text-body-sm font-medium uppercase tracking-[0.03em] transition-colors duration-[var(--dur-base)]",
                  fiftyFifty === 'locked' && "cursor-not-allowed text-[var(--text-on-dark-faint)]",
                  fiftyFifty === 'used' && "cursor-not-allowed text-[var(--text-on-dark-faint)]",
                  fiftyFifty === 'available' && "text-violet-500 hover:bg-ink-900 hover:text-white"
                )}
                disabled={fiftyFifty !== 'available' || !currentLevel.fiftyFifty}
                onClick={handleFiftyFifty}
                title={fiftyFifty === 'locked' ? 'Unlocks at the Bureau question' : ''}
              >
                50:50
              </button>
            </div>

            {/* Timer */}
            <div className={cn(
              "flex w-20 items-center justify-center border border-ink-800 py-2 font-mono text-body-lg font-medium tabular-nums transition-colors duration-[var(--dur-base)]",
              timeLeft <= 5 ? "border-coral-600 bg-coral-600/10 text-coral-600" : "bg-ink-900 text-white"
            )}>
              {timeLeft}s
            </div>
          </div>
        </div>

        {/* Progress Bar - Discrete Cells */}
        <div className="mt-8 flex w-full gap-px bg-ink-800 p-px">
          {LEVELS.map((_, i) => {
            const isActive = i === levelIndex;
            const isPast = i < levelIndex;
            return (
              <div 
                key={i} 
                className={cn(
                  "h-2 flex-1 transition-colors duration-[var(--dur-base)]",
                  isActive ? "bg-violet-500" : isPast ? "bg-violet-700" : "bg-ink-900"
                )}
              />
            );
          })}
        </div>
        <div className="mt-2 flex justify-between font-mono text-eyebrow-micro uppercase tracking-[0.03em] text-[var(--text-on-dark-faint)]">
          <span>Lvl 01</span>
          <span>Lvl 10</span>
        </div>

        {/* Question Area */}
        {currentQuestion && (
          <div className="mt-12 flex flex-col">
            <div className="flex">
              <EyebrowTag tone="violet">{currentQuestion.scope}</EyebrowTag>
            </div>
            
            <h1 className="mt-6 font-sans text-display-xl font-normal leading-[1.1] text-white">
              {currentQuestion.stem}
            </h1>
            
            {currentQuestion.selectN > 1 && (
              <div className="mt-4 font-mono text-body-md font-medium text-violet-500">
                Select {currentQuestion.selectN} options
              </div>
            )}

            <div className={cn(
              "mt-12 grid gap-px border border-ink-800 bg-ink-800",
              currentQuestion.kind === 'image' && currentQuestion.options.length > 4 ? "grid-cols-2 md:grid-cols-4" : 
              currentQuestion.kind === 'image' ? "grid-cols-2" : "grid-cols-1"
            )}>
              {shuffledOptions.map((opt, i) => {
                if (opt.removed) return null;
                const isSelected = selectedIndices.includes(opt.originalIndex);
                
                if (currentQuestion.kind === 'image') {
                  return (
                    <button
                      key={i}
                      onClick={() => toggleOption(opt.originalIndex)}
                      className={cn(
                        "group relative flex aspect-square flex-col items-center justify-center border p-4 transition-colors duration-[var(--dur-base)]",
                        isSelected ? "border-violet-700 bg-[rgba(71,21,255,0.05)]" : "border-ink-800 bg-ink-900 hover:border-violet-700"
                      )}
                    >
                      <ScanEye className="size-8 text-[var(--text-on-dark-muted)] opacity-50" strokeWidth={1.5} />
                      <span className="mt-4 text-center font-sans text-body-md text-white">
                        {opt.text}
                      </span>
                      <div className={cn(
                        "absolute left-4 top-4 font-mono text-body-sm font-medium tabular-nums",
                        isSelected ? "text-violet-500" : "text-[var(--text-on-dark-muted)]"
                      )}>
                        {String(opt.originalIndex).padStart(2, '0')}
                      </div>
                      <div className="absolute right-4 top-4">
                        {isSelected ? (
                          <div className="size-3 bg-violet-500" />
                        ) : (
                          <div className="size-3 border border-ink-700" />
                        )}
                      </div>
                    </button>
                  );
                }

                return (
                  <button
                    key={i}
                    onClick={() => toggleOption(opt.originalIndex)}
                    className={cn(
                      "group flex items-start gap-6 border p-6 text-left transition-colors duration-[var(--dur-base)]",
                      isSelected ? "border-violet-700 bg-[rgba(71,21,255,0.05)]" : "border-transparent bg-ink-900 hover:border-violet-700"
                    )}
                  >
                    <div className={cn(
                      "mt-1 font-mono text-body-md font-medium tabular-nums",
                      isSelected ? "text-violet-500" : "text-[var(--text-on-dark-muted)]"
                    )}>
                      {String(opt.originalIndex).padStart(2, '0')}
                    </div>
                    <span className="font-sans text-body-lg text-white">
                      {opt.text}
                    </span>
                    <div className="ml-auto mt-1 shrink-0">
                      {isSelected ? (
                        <div className="size-3 bg-violet-500" />
                      ) : (
                        <div className="size-3 border border-ink-700" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            
            <div className="mt-12 flex justify-end">
              <Button 
                variant="light" 
                size="lg" 
                chevron 
                disabled={selectedIndices.length !== currentQuestion.selectN}
                onClick={handleSubmit}
                className="w-full md:w-auto"
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
