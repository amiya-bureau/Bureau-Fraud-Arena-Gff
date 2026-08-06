import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { usePlayerSession } from '@/lib/store';
import { Layout } from '@/components/layout';
import { RulesScreen } from '@/components/rules-screen';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSubmitRun, useSaveRunProgress, useGetPlayerStanding, RunInput } from '@workspace/api-client-react';
import { CASES, PRIMER, BONUS, DetectiveCase } from '@/data/detective';
import { v4 as uuidv4 } from 'uuid';
import { MapPin, Maximize, AlertCircle, ArrowRight, BookOpen, Fingerprint, CheckCircle2, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as d3 from 'd3-force';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

type GameState = 'rules' | 'primer' | 'case' | 'bonus' | 'gameover' | 'error';

// Simple deterministic seeded random
function seededRandom(s: number) {
  return function() {
    s = Math.sin(s) * 10000; return s - Math.floor(s);
  };
}

export default function FraudDetective() {
  const { session } = usePlayerSession();
  const [, setLocation] = useLocation();
  const { data: standing } = useGetPlayerStanding(session?.player.id || '', 'today');
  const submitRun = useSubmitRun();
  const saveProgress = useSaveRunProgress();

  const [gameState, setGameState] = useState<GameState>('rules');
  const [caseIndex, setCaseIndex] = useState(0);
  
  const runIdRef = useRef<string>('');
  useEffect(() => {
    if (!runIdRef.current) runIdRef.current = uuidv4();
  }, []);

  const [caseScore, setCaseScore] = useState(0);
  const [bonusScore, setBonusScore] = useState(0);
  const [caseResults, setCaseResults] = useState<any[]>([]);

  // Current case state
  const currentCase = CASES[caseIndex];
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [solved, setSolved] = useState(false);

  // Bonus round state
  const [bonusIndex, setBonusIndex] = useState(0);
  const [bonusAnswers, setBonusAnswers] = useState<Record<number, number>>({}); // qIndex -> tapped ring

  // Network Graph Layout
  const [graphNodes, setGraphNodes] = useState<any[]>([]);
  const [graphEdges, setGraphEdges] = useState<any[]>([]);

  useEffect(() => {
    if (gameState === 'case' && currentCase) {
      // Calculate layout deterministically
      const rand = seededRandom(currentCase.order * 1337);
      
      const nodes = currentCase.nodes.map(id => {
        // Find cluster color
        let clusterName = "Control group";
        Object.entries(currentCase.clusters).forEach(([name, ids]) => {
          if (ids.includes(id)) clusterName = name;
        });
        
        return {
          id,
          clusterName,
          x: rand() * 400 - 200,
          y: rand() * 400 - 200,
        };
      });

      const links = currentCase.edges.map(e => ({ source: e[0], target: e[1] }));

      // Run D3 force directed layout statically
      const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id((d: any) => d.id).distance(60))
        .force("charge", d3.forceManyBody().strength(-300))
        .force("center", d3.forceCenter(0, 0))
        .stop();

      // Tick simulation to completion
      for (let i = 0; i < 300; ++i) simulation.tick();

      setGraphNodes(nodes);
      setGraphEdges(links.map(l => ({
        source: nodes.find(n => n.id === (l.source as any).id),
        target: nodes.find(n => n.id === (l.target as any).id)
      })));
      
      setSelectedNode(null);
      setWrongGuesses(0);
      setRevealed(false);
      setSolved(false);
    }
  }, [gameState, caseIndex, currentCase]);

  // Persist progress periodically
  useEffect(() => {
    if (session && (gameState === 'case' || gameState === 'bonus')) {
      saveProgress.mutate({
        data: {
          idempotencyKey: runIdRef.current,
          playerId: session.player.id,
          game: 'fraud_detective',
          state: { caseIndex, caseScore, bonusScore, caseResults }
        }
      });
    }
  }, [caseIndex, caseScore, bonusScore, gameState]);

  const startGame = () => setGameState('primer');

  const handleAccuse = () => {
    if (!selectedNode || solved || revealed) return;
    
    if (currentCase.answer.includes(selectedNode)) {
      setSolved(true);
      let pts = 16;
      if (wrongGuesses === 1) pts = 10;
      if (wrongGuesses === 2) pts = 6;
      if (wrongGuesses >= 3) pts = 2;
      setCaseScore(s => s + pts);
      
      setCaseResults(prev => [...prev, {
        id: currentCase.id,
        points: pts,
        wrongGuesses,
        revealed: false
      }]);
    } else {
      setWrongGuesses(g => g + 1);
      setSelectedNode(null); // deselect on wrong guess
    }
  };

  const handleReveal = () => {
    if (solved || revealed) return;
    setRevealed(true);
    setCaseResults(prev => [...prev, {
      id: currentCase.id,
      points: 0,
      wrongGuesses,
      revealed: true
    }]);
  };

  const handleNextCase = () => {
    if (caseIndex + 1 < CASES.length) {
      setCaseIndex(i => i + 1);
    } else {
      setGameState('bonus');
    }
  };

  const handleBonusTap = (ringDegree: number) => {
    if (bonusAnswers[bonusIndex] !== undefined) return; // already answered
    
    const q = BONUS.questions[bonusIndex];
    setBonusAnswers(prev => ({ ...prev, [bonusIndex]: ringDegree }));
    
    if (ringDegree === q.answer) {
      setBonusScore(s => s + 5);
    }

    setTimeout(() => {
      if (bonusIndex + 1 < BONUS.questions.length) {
        setBonusIndex(i => i + 1);
      } else {
        endRun();
      }
    }, 2000);
  };

  const [finalResult, setFinalResult] = useState<any>(null);
  const lastPayloadRef = useRef<RunInput | null>(null);

  const endRun = () => {
    if (session) {
      const total = caseScore + bonusScore;
      const bonusAnswersPayload = BONUS.questions.map((q, i) => ({
        n: q.n,
        correct: bonusAnswers[i] === q.answer
      })).filter((_, i) => bonusAnswers[i] !== undefined);

      const payload: RunInput = {
        playerId: session.player.id,
        game: 'fraud_detective',
        points: total,
        source: new URLSearchParams(window.location.search).get('src') === 'qr' ? 'phone' : 'kiosk',
        idempotencyKey: runIdRef.current,
        detail: {
          cases: caseResults,
          casePoints: caseScore,
          bonusPoints: bonusScore,
          tier: total >= 80 ? "Master" : (total >= 40 ? "Achiever" : "Participation"),
          bonus: {
            answers: bonusAnswersPayload
          }
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
      setFinalResult({ pointsRecorded: caseScore + bonusScore, isPersonalBest: false, standing: { rank: 0, behind: 0 } });
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
          gameName="Fraud Detective"
          premise="Five graph investigation cases plus a bonus trivia round. Find the hidden links that expose the rings."
          scoring="16 points per case (80 total) + 20 points in the bonus round. Maximum 100 points."
          endsWhen="There is no game over. Every case is attemptable. Points drop if you make wrong guesses."
          lifelines="You can reveal the answer at any time for 0 points."
          standing={standing}
          gameKey="fraud_detective"
          onStart={startGame}
        />
      </Layout>
    );
  }

  if (gameState === 'primer') {
    return (
      <Layout>
        <div className="flex-1 flex flex-col items-center justify-center py-12 w-full max-w-2xl mx-auto">
          <Card className="w-full p-8 md:p-12 shadow-2xl flex flex-col gap-6 relative overflow-hidden bg-card">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-2 shadow-lg">
              <BookOpen className="w-8 h-8 text-primary-foreground" />
            </div>
            
            <h2 className="text-3xl font-bold uppercase">{PRIMER.title}</h2>
            
            <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
              {PRIMER.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            <Button size="lg" className="w-full h-16 text-xl font-bold mt-8" onClick={() => setGameState('case')}>
              START INVESTIGATION
            </Button>
          </Card>
        </div>
      </Layout>
    );
  }

  if (gameState === 'case' && currentCase) {
    const isFinished = solved || revealed;

    return (
      <Layout showHeader={false}>
        <div className="w-full h-full flex flex-col md:flex-row gap-6 p-4 md:p-6 overflow-hidden max-h-[100dvh]">
          
          {/* Left Panel: Case File */}
          <div className="w-full md:w-[400px] flex flex-col gap-4 overflow-y-auto pb-6">
            
            <div className="flex items-center justify-between">
              <div className="inline-flex px-3 py-1 rounded-full bg-accent/10 text-accent font-mono text-xs font-bold uppercase border border-accent/20">
                {currentCase.sector}
              </div>
              <div className="font-mono text-sm text-muted-foreground">
                CASE {currentCase.order}/5
              </div>
            </div>

            <h2 className="text-3xl font-black uppercase text-foreground leading-tight tracking-tight">
              {currentCase.title}
            </h2>

            <div className="bg-background rounded-xl p-5 border border-border">
              <h3 className="font-mono text-sm font-bold text-muted-foreground mb-4 uppercase tracking-widest flex items-center gap-2">
                <MapPin className="w-4 h-4" /> CASE NOTES
              </h3>
              <div className="space-y-4">
                {currentCase.clues.map((clue, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-warning shrink-0 mt-2" />
                    <p className="text-muted-foreground leading-relaxed font-mono">{clue}</p>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-lg font-medium leading-snug">{currentCase.brief}</p>
            <p className="text-sm italic text-muted-foreground border-l-2 border-primary pl-4">{currentCase.instruction}</p>

            {isFinished && (
              <div className="mt-4 p-5 rounded-xl border border-success/20 bg-success/10 animate-in fade-in slide-in-from-bottom-4">
                <h4 className="font-bold text-success mb-2 text-lg">Case Closed</h4>
                <p className="text-muted-foreground leading-relaxed mb-4">{currentCase.explanation}</p>
                <div className="flex items-start gap-2 bg-background p-3 rounded-lg border border-border">
                  <Fingerprint className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">{currentCase.hook}</p>
                </div>
              </div>
            )}
            
            <div className="mt-auto pt-6 flex flex-col gap-3 sticky bottom-0 bg-background/80 backdrop-blur-md p-4 -mx-4 -mb-6 md:p-0 md:m-0 md:bg-transparent md:backdrop-blur-none">
              {!isFinished ? (
                <>
                  <div className="flex justify-between items-center px-2">
                    <span className="text-sm font-mono text-muted-foreground">WRONG GUESSES: {wrongGuesses}</span>
                    <Button variant="link" size="sm" className="text-muted-foreground h-auto p-0" onClick={handleReveal}>
                      Reveal Answer
                    </Button>
                  </div>
                  <Button 
                    size="lg" 
                    className="w-full h-14 text-lg font-bold"
                    disabled={!selectedNode}
                    onClick={handleAccuse}
                  >
                    SUBMIT ACCUSATION
                  </Button>
                </>
              ) : (
                <Button size="lg" className="w-full h-14 text-lg font-bold" onClick={handleNextCase}>
                  NEXT CASE <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              )}
            </div>
          </div>

          {/* Right Panel: Graph Canvas */}
          <div className="flex-1 bg-card rounded-2xl border border-border relative overflow-hidden shadow-inner flex flex-col">
            <TransformWrapper 
              initialScale={1}
              minScale={0.5}
              maxScale={3}
              centerOnInit
            >
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  <div className="absolute top-4 right-4 z-10 flex gap-2">
                    <Button variant="secondary" size="icon" onClick={() => resetTransform()}>
                      <Maximize className="w-4 h-4" />
                    </Button>
                  </div>

                  <TransformComponent wrapperClass="w-full h-full" contentClass="w-full h-full flex items-center justify-center">
                    <svg className="w-[800px] h-[800px] overflow-visible" viewBox="-400 -400 800 800">
                      
                      {/* Edges */}
                      {graphEdges.map((e, i) => {
                        const isAnswerEdge = isFinished && (currentCase.answer.includes(e.source.id) || currentCase.answer.includes(e.target.id));
                        return (
                          <g key={i}>
                            <line
                              x1={e.source.x} y1={e.source.y}
                              x2={e.target.x} y2={e.target.y}
                              stroke={isAnswerEdge ? 'hsl(var(--success))' : 'hsl(var(--muted))'}
                              strokeWidth={isAnswerEdge ? 3 : 2}
                              opacity={isFinished && !isAnswerEdge ? 0.2 : 0.6}
                            />
                            {currentCase.edgeLabels && currentCase.edgeLabels[`${e.source.id}|${e.target.id}`] && (
                              <text
                                x={(e.source.x + e.target.x) / 2}
                                y={(e.source.y + e.target.y) / 2 - 5}
                                textAnchor="middle"
                                className="fill-muted-foreground text-[10px] font-mono"
                                opacity={isFinished && !isAnswerEdge ? 0.2 : 1}
                              >
                                {currentCase.edgeLabels[`${e.source.id}|${e.target.id}`]}
                              </text>
                            )}
                          </g>
                        );
                      })}

                      {/* Nodes */}
                      {graphNodes.map((n, i) => {
                        const isSelected = selectedNode === n.id;
                        const isAnswerNode = isFinished && currentCase.answer.includes(n.id);
                        
                        // Generate color by cluster name deterministically
                        const hash = n.clusterName.split('').reduce((a:number,b:string)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
                        const hue = Math.abs(hash % 360);
                        const fill = `hsl(${hue}, 60%, 40%)`;

                        return (
                          <g 
                            key={n.id} 
                            transform={`translate(${n.x},${n.y})`}
                            onClick={() => !isFinished && setSelectedNode(n.id)}
                            className={cn(
                              "cursor-pointer transition-opacity duration-300",
                              isFinished && !isAnswerNode ? "opacity-30" : "opacity-100"
                            )}
                          >
                            {isSelected && (
                              <circle r={28} fill="none" stroke="hsl(var(--primary))" strokeWidth={3} className="animate-pulse" />
                            )}
                            
                            {isAnswerNode && (
                              <circle r={32} fill="hsl(var(--success)/0.2)" stroke="hsl(var(--success))" strokeWidth={3} className="animate-in zoom-in" />
                            )}
                            
                            <circle r={20} fill={fill} stroke="hsl(var(--card))" strokeWidth={3} />
                            
                            <text
                              y={35}
                              textAnchor="middle"
                              className={cn(
                                "text-[12px] font-mono font-bold select-none",
                                isAnswerNode ? "fill-success text-[14px]" : "fill-foreground"
                              )}
                            >
                              {n.id}
                            </text>
                            
                            {currentCase.nodeLabels && currentCase.nodeLabels[n.id] && (
                              <text
                                y={50}
                                textAnchor="middle"
                                className="fill-muted-foreground text-[10px] font-mono select-none"
                              >
                                {currentCase.nodeLabels[n.id]}
                              </text>
                            )}
                          </g>
                        );
                      })}

                    </svg>
                  </TransformComponent>
                </>
              )}
            </TransformWrapper>
          </div>

        </div>
      </Layout>
    );
  }

  if (gameState === 'bonus') {
    const q = BONUS.questions[bonusIndex];
    const answeredRing = bonusAnswers[bonusIndex];

    return (
      <Layout showHeader={false}>
        <div className="w-full h-full flex flex-col p-4 py-8 max-w-4xl mx-auto gap-8 overflow-hidden">
          
          <div className="text-center space-y-4">
            <div className="inline-flex px-3 py-1 rounded-full bg-accent/10 text-accent font-mono text-sm font-bold uppercase border border-accent/20">
              {BONUS.badge}
            </div>
            <h2 className="text-4xl font-black uppercase text-foreground">{BONUS.title}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{BONUS.brief}</p>
          </div>

          <div className="flex-1 relative flex items-center justify-center bg-card rounded-3xl border border-border overflow-hidden">
            
            <div className="absolute top-6 left-6 right-6 text-center z-20">
              <h3 className="text-3xl font-black text-primary bg-background/80 inline-block px-6 py-2 rounded-2xl border border-border shadow-lg backdrop-blur-md">
                {q.subject}
              </h3>
            </div>

            {/* Target Canvas */}
            <div className="relative w-[300px] h-[300px] md:w-[500px] md:h-[500px] flex items-center justify-center">
              {/* Bacon Center */}
              <div className="absolute w-20 h-20 rounded-full bg-primary flex items-center justify-center z-10 shadow-[0_0_30px_rgba(71,21,255,0.4)]">
                <span className="text-primary-foreground font-bold text-sm text-center leading-tight px-2">Kevin<br/>Bacon</span>
              </div>
              
              {/* Rings */}
              {[1, 2, 3].map(degree => {
                const size = 100 + (degree * 130);
                const isSelected = answeredRing === degree;
                const isCorrect = q.answer === degree;
                const showResult = answeredRing !== undefined;

                return (
                  <button
                    key={degree}
                    className="absolute rounded-full border-2 border-dashed transition-all flex items-start justify-center group"
                    style={{ 
                      width: `${size}px`, 
                      height: `${size}px`,
                      borderColor: showResult 
                        ? (isCorrect ? 'hsl(var(--success))' : (isSelected ? 'hsl(var(--destructive))' : 'hsl(var(--border))'))
                        : 'hsl(var(--muted))'
                    }}
                    onClick={() => handleBonusTap(degree)}
                    disabled={showResult}
                  >
                    {!showResult && (
                      <div className="absolute -top-3 bg-background px-2 text-xs font-mono text-muted-foreground group-hover:text-primary transition-colors">
                        {BONUS.rings.find(r => r.degree === degree)?.label}
                      </div>
                    )}
                    
                    {/* Character snaps here if answered */}
                    {showResult && isCorrect && (
                      <div className="absolute -top-6 bg-success text-success-foreground px-4 py-1 rounded-full font-bold animate-in zoom-in border border-background shadow-xl whitespace-nowrap z-20">
                        {q.subject}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explain panel */}
            {answeredRing !== undefined && (
              <div className="absolute bottom-6 left-6 right-6 bg-background/90 backdrop-blur-md p-6 rounded-2xl border border-border shadow-2xl animate-in slide-in-from-bottom-8 z-30">
                <div className="flex gap-4">
                  {answeredRing === q.answer ? (
                    <CheckCircle2 className="w-8 h-8 text-success shrink-0" />
                  ) : (
                    <AlertCircle className="w-8 h-8 text-destructive shrink-0" />
                  )}
                  <div>
                    <h4 className="font-bold text-lg mb-2">
                      {answeredRing === q.answer ? "Correct! +5 pts" : `Wrong. They are ${q.answer} degrees away.`}
                    </h4>
                    <p className="text-muted-foreground">{q.note}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
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

  // gameover
  if (!finalResult) return null;

  return (
    <Layout>
      <div className="flex-1 flex flex-col items-center justify-center py-12 w-full max-w-2xl mx-auto">
        <Card className="w-full p-8 md:p-12 shadow-2xl text-center flex flex-col items-center gap-6">
          <h1 className="text-4xl font-black uppercase text-foreground">Run Complete</h1>
          
          <div className="w-40 h-40 rounded-full border-8 border-primary flex flex-col items-center justify-center bg-card shadow-[0_0_40px_rgba(71,21,255,0.2)]">
            <span className="text-5xl font-black text-foreground">{finalResult.pointsRecorded}</span>
            <span className="text-muted-foreground font-mono uppercase tracking-wider">Points</span>
          </div>

          {finalResult.standing && (
            <p className="text-sm text-muted-foreground">
              Global Rank: <strong className="text-foreground">#{finalResult.standing.rank}</strong>
              {finalResult.isPersonalBest && <span className="ml-2 text-primary font-bold">(Personal Best!)</span>}
            </p>
          )}

          <div className="w-full bg-background p-6 rounded-2xl border border-border text-left mt-2 mb-2">
            <h4 className="font-bold text-lg mb-2">The Real Point</h4>
            <p className="text-muted-foreground leading-relaxed mb-4">{BONUS.payoff}</p>
            <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg text-primary">
              <Fingerprint className="w-5 h-5 shrink-0" />
              <span className="font-medium">{BONUS.hook}</span>
            </div>
          </div>

          <div className="flex flex-col gap-4 w-full">
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
