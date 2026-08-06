import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'wouter';
import { usePlayerSession } from '@/lib/store';
import { Layout } from '@/components/layout';
import { RulesScreen } from '@/components/rules-screen';
import { QrPanel } from '@/components/qr-panel';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { LEVELS, QUESTIONS, BUREAU_QUESTIONS, Level, Question, BureauQuestion } from '@/data/quiz';
import { useSubmitRun, useSaveRunProgress, useGetPlayerStanding, RunInput } from '@workspace/api-client-react';
import { v4 as uuidv4 } from 'uuid';
import { Clock, ShieldAlert, SkipForward, ScanEye, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    if (gameState === 'playing' && timeLeft === 0) {
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
    // If wrong, we just let them try again (no action, maybe shake animation)
  };

  const [finalResult, setFinalResult] = useState<any>(null);
  const lastPayloadRef = useRef<RunInput | null>(null);

  const endRun = () => {
    if (!bureauSeen && levelIndex < 4) {
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
          bureauSeen,
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
    // Determine if it's the mid-game unlock or end-game consolation
    const isConsolation = explainResult !== null && (explainResult === 'wrong' || explainResult === 'timeout' || explainResult === 'nearMiss');

    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center py-12">
          <Card className="w-full max-w-2xl bg-primary border-primary p-8 md:p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="text-center mb-8 relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-1.5 rounded-full font-bold uppercase tracking-widest text-sm mb-4">
                <ShieldAlert className="w-4 h-4" />
                Bonus - Unlock your 50:50
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">The Sponsor Question</h2>
              <p className="text-white/80">Get this right to unlock the 50:50 lifeline {isConsolation ? 'for your next run!' : 'for the rest of this run!'}</p>
            </div>
            
            <p className="text-xl md:text-2xl font-medium text-white mb-8 text-center relative z-10">
              {bureauQuestion.stem}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
              {bureauQuestion.options.map((opt, idx) => (
                <Button 
                  key={idx} 
                  variant="secondary" 
                  className="h-auto p-4 text-left justify-start text-lg whitespace-normal font-sans hover:bg-white active:bg-white/90 text-primary hover:text-primary active-elevate-2 transition-all active:scale-95"
                  onClick={() => {
                    if (idx + 1 === 1) {
                      if (isConsolation) {
                        setBureauSeen(true);
                        setGameState('gameover');
                      } else {
                        handleBureauAnswer(idx + 1);
                      }
                    } else {
                      // Shake effect could be added here
                    }
                  }}
                >
                  {opt}
                </Button>
              ))}
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  if (gameState === 'explain' && currentQuestion) {
    return (
      <Layout>
        <div className="flex-1 flex flex-col items-center justify-center py-12 w-full max-w-3xl mx-auto">
          <Card className={cn(
            "w-full p-8 md:p-12 shadow-2xl border-t-4",
            explainResult === 'correct' ? "border-t-success" : 
            explainResult === 'wrong' || explainResult === 'timeout' ? "border-t-destructive" :
            "border-t-warning"
          )}>
            <div className="flex items-center justify-center mb-6">
              {explainResult === 'correct' && (
                <div className="flex flex-col items-center text-success animate-in zoom-in">
                  <CheckCircle2 className="w-16 h-16 mb-2" />
                  <span className="text-2xl font-bold">CORRECT</span>
                  <span className="text-muted-foreground">+{pointsEarned} pts</span>
                </div>
              )}
              {explainResult === 'wrong' && (
                <div className="flex flex-col items-center text-destructive animate-in zoom-in">
                  <XCircle className="w-16 h-16 mb-2" />
                  <span className="text-2xl font-bold">WRONG</span>
                  <span className="text-muted-foreground">Run Ended</span>
                </div>
              )}
              {explainResult === 'timeout' && (
                <div className="flex flex-col items-center text-destructive animate-in zoom-in">
                  <Clock className="w-16 h-16 mb-2" />
                  <span className="text-2xl font-bold">TIMEOUT</span>
                  <span className="text-muted-foreground">Run Ended</span>
                </div>
              )}
              {explainResult === 'nearMiss' && (
                <div className="flex flex-col items-center text-warning animate-in zoom-in">
                  <ShieldAlert className="w-16 h-16 mb-2" />
                  <span className="text-2xl font-bold">NEAR MISS</span>
                  <span className="text-muted-foreground">+{pointsEarned} pts (Run Ended)</span>
                </div>
              )}
              {explainResult === 'skipped' && (
                <div className="flex flex-col items-center text-muted-foreground animate-in zoom-in">
                  <SkipForward className="w-16 h-16 mb-2" />
                  <span className="text-2xl font-bold">SKIPPED</span>
                  <span className="text-sm">Moved to next level</span>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-background rounded-xl border border-border">
                <h4 className="font-bold text-lg mb-2">Why?</h4>
                <p className="text-muted-foreground text-lg leading-relaxed">{currentQuestion.why}</p>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-xl text-primary-foreground border border-primary/20">
                <ScanEye className="w-6 h-6 text-primary shrink-0" />
                <p className="font-medium">{currentQuestion.hook}</p>
              </div>
            </div>

            <Button size="lg" className="w-full h-16 text-xl font-bold mt-8" onClick={nextLevel}>
              {explainResult === 'wrong' || explainResult === 'timeout' || explainResult === 'nearMiss' 
                ? 'FINISH RUN' 
                : 'NEXT LEVEL'}
            </Button>
          </Card>
        </div>
      </Layout>
    );
  }

  if (gameState === 'error') {
    return (
      <Layout>
        <div className="flex-1 flex flex-col items-center justify-center py-12 w-full max-w-md mx-auto">
          <Card className="w-full p-8 md:p-12 shadow-2xl text-center flex flex-col items-center gap-6 border-destructive">
            <ShieldAlert className="w-20 h-20 text-destructive mb-2" />
            <h1 className="text-3xl font-black uppercase text-foreground">Save Failed</h1>
            <p className="text-lg text-muted-foreground">
              We couldn't record your run due to a network error. Your points are safe.
            </p>
            <div className="flex flex-col gap-4 w-full mt-4">
              <Button size="lg" className="h-14 text-lg font-bold bg-primary hover:bg-primary/90" onClick={handleRetrySubmit} disabled={submitRun.isPending}>
                {submitRun.isPending ? 'RETRYING...' : 'RETRY SUBMIT'}
              </Button>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  if (gameState === 'gameover') {
    if (!finalResult) return null;
    
    return (
      <Layout>
        <div className="flex-1 flex flex-col items-center justify-center py-12 w-full max-w-md mx-auto">
          <Card className="w-full p-8 md:p-12 shadow-2xl text-center flex flex-col items-center gap-6">
            <h1 className="text-4xl font-black uppercase text-foreground">Run Complete</h1>
            
            <div className="w-40 h-40 rounded-full border-8 border-primary flex flex-col items-center justify-center bg-card shadow-[0_0_40px_rgba(71,21,255,0.2)]">
              <span className="text-5xl font-black text-foreground">{finalResult.pointsRecorded}</span>
              <span className="text-muted-foreground font-mono uppercase tracking-wider">Points</span>
            </div>

            <div className="space-y-2">
              <p className="text-lg text-muted-foreground">
                You cleared {cleared.length} level{cleared.length !== 1 && 's'}.
              </p>
              
              {finalResult.standing && (
                <p className="text-sm text-muted-foreground mt-4">
                  Global Rank: <strong className="text-foreground">#{finalResult.standing.rank}</strong>
                  {finalResult.isPersonalBest && <span className="ml-2 text-primary font-bold">(Personal Best!)</span>}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-4 w-full mt-4">
              <Button size="lg" className="h-14 text-lg font-bold" onClick={() => window.location.reload()}>
                PLAY AGAIN
              </Button>
              <Button size="lg" variant="secondary" className="h-14 text-lg font-bold" onClick={() => setLocation('/')}>
                BACK TO BOOTH
              </Button>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  // gameState === 'playing'
  return (
    <Layout showHeader={false}>
      <div className="flex flex-col h-full w-full max-w-4xl mx-auto py-6 gap-6">
        
        {/* Header HUD */}
        <div className="flex items-center justify-between bg-card p-4 rounded-2xl border border-border shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-xl shadow-lg">
              {currentLevel.level}
            </div>
            <div>
              <div className="text-sm font-mono text-muted-foreground uppercase">{currentLevel.label}</div>
              <div className="font-bold text-lg text-foreground">Score: <span className="text-primary">{score}</span></div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Lifelines */}
            <div className="flex gap-2">
              {currentLevel.skip && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="font-mono h-10"
                  onClick={handleSkip}
                >
                  <SkipForward className="w-4 h-4 mr-2" /> SKIP
                </Button>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                className={cn(
                  "font-mono h-10 transition-colors",
                  fiftyFifty === 'locked' && "opacity-50 grayscale",
                  fiftyFifty === 'used' && "opacity-20 cursor-not-allowed",
                  fiftyFifty === 'available' && "border-primary text-primary hover:bg-primary/10"
                )}
                disabled={fiftyFifty !== 'available' || !currentLevel.fiftyFifty}
                onClick={handleFiftyFifty}
                title={fiftyFifty === 'locked' ? 'Unlocks at the Bureau question' : ''}
              >
                50:50
              </Button>
            </div>

            {/* Timer */}
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xl font-bold min-w-[100px] justify-center transition-colors",
              timeLeft <= 5 ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-secondary text-secondary-foreground"
            )}>
              <Clock className="w-5 h-5" />
              {timeLeft}s
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <Progress value={(currentLevel.level / 10) * 100} className="h-2" />

        {/* Question Area */}
        {currentQuestion && (
          <div className="flex-1 flex flex-col gap-6 mt-4">
            <div className="space-y-3">
              <div className="inline-flex px-3 py-1 rounded-full bg-accent/10 text-accent font-mono text-sm font-bold uppercase">
                {currentQuestion.scope}
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-snug">
                {currentQuestion.stem}
              </h2>
              {currentQuestion.selectN > 1 && (
                <p className="text-lg text-primary font-bold">
                  Select {currentQuestion.selectN} of {currentQuestion.options.length}
                </p>
              )}
            </div>

            <div className={cn(
              "grid gap-4 flex-1 content-start",
              currentQuestion.kind === 'image' 
                ? (currentQuestion.options.length > 4 ? "grid-cols-2 md:grid-cols-4" : "grid-cols-1 md:grid-cols-2")
                : "grid-cols-1"
            )}>
              {shuffledOptions.map((opt, i) => {
                if (opt.removed) return <div key={i} className="hidden" />;
                const isSelected = selectedIndices.includes(opt.originalIndex);
                
                if (currentQuestion.kind === 'image') {
                  return (
                    <button
                      key={i}
                      onClick={() => toggleOption(opt.originalIndex)}
                      className={cn(
                        "relative aspect-square rounded-xl border-2 transition-all overflow-hidden bg-muted flex flex-col items-center justify-center p-4 gap-2",
                        isSelected ? "border-primary shadow-[0_0_0_4px_rgba(71,21,255,0.2)]" : "border-border hover:border-primary/50"
                      )}
                    >
                      <ScanEye className="w-8 h-8 text-muted-foreground opacity-50" />
                      <span className="text-sm font-medium text-center">{opt.text}</span>
                      <div className="absolute top-2 left-2 w-6 h-6 rounded-md bg-background/80 flex items-center justify-center font-mono text-xs font-bold border border-border">
                        {opt.originalIndex}
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
                    </button>
                  );
                }

                return (
                  <button
                    key={i}
                    onClick={() => toggleOption(opt.originalIndex)}
                    className={cn(
                      "text-left p-5 rounded-xl border-2 transition-all flex items-start gap-4 active:scale-[0.99]",
                      isSelected 
                        ? "bg-primary/5 border-primary shadow-[0_0_0_2px_rgba(71,21,255,0.2)]" 
                        : "bg-card border-card-border hover:border-primary/50"
                    )}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                      currentQuestion.selectN > 1 ? "rounded-md" : "rounded-full",
                      isSelected ? "bg-primary border-primary text-primary-foreground" : "bg-background border-border"
                    )}>
                      {isSelected && <CheckCircle2 className="w-4 h-4" />}
                    </div>
                    <span className="text-lg md:text-xl font-medium leading-tight">
                      {opt.text}
                    </span>
                  </button>
                );
              })}
            </div>
            
            <div className="pt-4 sticky bottom-6 z-20">
              <Button 
                size="lg" 
                className="w-full h-16 text-xl font-bold shadow-xl"
                disabled={selectedIndices.length !== currentQuestion.selectN}
                onClick={handleSubmit}
              >
                SUBMIT {currentQuestion.selectN > 1 ? `(${selectedIndices.length}/${currentQuestion.selectN})` : ''}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
