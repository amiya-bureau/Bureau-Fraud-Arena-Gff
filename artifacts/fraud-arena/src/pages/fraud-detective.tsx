import { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { usePlayerSession } from '@/lib/store';
import { Layout, ScreenBody } from '@/components/layout';
import { RulesScreen } from '@/components/rules-screen';
import { Button } from '@/components/ui/button';
import { useSubmitRun, useSaveRunProgress, useGetPlayerStanding, RunInput } from '@workspace/api-client-react';
import { CASES, PRIMER, BONUS, type DetectiveCase } from '@/data/detective';
import { LifelineGate } from '@/components/lifeline-gate';
import { fetchDetectiveCasePack, fetchLifelineQuestion, type LifelineQuestion } from '@/lib/gamePack';
import { v4 as uuidv4 } from 'uuid';
import { Maximize, AlertCircle, MapPin, Fingerprint, CheckCircle2, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as d3 from 'd3-force';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import {
  EyebrowTag,
  SignalField,
  ScanFrame,
  StatReadout,
} from '@/components/bureau';

type GameState = 'rules' | 'primer' | 'case' | 'bonus' | 'lifeline' | 'error';

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

  // Load a server-randomised case pack at game start.
  const [casePack, setCasePack] = useState<DetectiveCase[] | null>(null);
  useEffect(() => {
    fetchDetectiveCasePack().then(cases => {
      // Re-number cases 1–5 so the progress counter stays consistent.
      const reordered = cases.map((c, i) => ({ ...c, order: i + 1 }));
      setCasePack(reordered);
    });
  }, []);

  const activeCases = casePack ?? CASES;

  const [caseScore, setCaseScore] = useState(0);
  const [bonusScore, setBonusScore] = useState(0);
  const [caseResults, setCaseResults] = useState<any[]>([]);

  // Current case state
  const currentCase = activeCases[caseIndex];
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
          x: rand() * 200 - 100, // Tighter start for mobile column
          y: rand() * 200 - 100,
        };
      });

      const links = currentCase.edges.map(e => ({ source: e[0], target: e[1] }));

      // Run D3 force directed layout statically with tightened parameters for mobile
      // Collision radius is what keeps the account labels legible: without it
      // the force layout happily parks two 48px nodes close enough that their
      // captions sit on top of each other at phone scale.
      const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-140))
        .force("collide", d3.forceCollide(42))
        .force("center", d3.forceCenter(0, 0))
        // Several cases are made of disconnected clusters. Without a gentle pull
        // back to the origin the charge force flings those clusters apart, which
        // inflates the fitted viewBox and shrinks every node and caption to
        // compensate - the clusters end up tiny and crowded with empty space
        // between them.
        .force("x", d3.forceX(0).strength(0.08))
        .force("y", d3.forceY(0).strength(0.08))
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

  /**
   * Fit the SVG coordinate system to the settled layout.
   *
   * Scaling the viewBox rather than the node positions is the whole trick: the
   * viewBox scales the 48px node boxes and the gaps between them by the same
   * factor, so the separation the collide force guaranteed survives the fit.
   * Compressing positions alone (the obvious move) leaves the boxes at 48px and
   * packs them into each other.
   */
  const graphViewBox = useMemo(() => {
    if (!graphNodes.length) return '-200 -200 400 400';
    const PAD_X = 90;   // foreignObject extends 60px from centre + label text overhang
    const PAD_TOP = 50;
    const PAD_BOTTOM = 75; // account caption + label text hang below the node box
    const MIN_SPAN = 280; // stops a two-node case zooming to absurd size
    const xs = graphNodes.map((n: any) => n.x);
    const ys = graphNodes.map((n: any) => n.y);
    let minX = Math.min(...xs) - PAD_X;
    let maxX = Math.max(...xs) + PAD_X;
    let minY = Math.min(...ys) - PAD_TOP;
    let maxY = Math.max(...ys) + PAD_BOTTOM;
    if (maxX - minX < MIN_SPAN) {
      const mid = (minX + maxX) / 2;
      minX = mid - MIN_SPAN / 2;
      maxX = mid + MIN_SPAN / 2;
    }
    if (maxY - minY < MIN_SPAN) {
      const mid = (minY + maxY) / 2;
      minY = mid - MIN_SPAN / 2;
      maxY = mid + MIN_SPAN / 2;
    }
    return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
  }, [graphNodes]);

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
    if (caseIndex + 1 < activeCases.length) {
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
  const [lifelineQuestion, setLifelineQuestion] = useState<LifelineQuestion | null>(null);
  const [lifelineContext, setLifelineContext] = useState<'gameover' | 'reentry'>('gameover');
  const reentryChecked = useRef(false);

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
          setLifelineContext('gameover');
          setGameState('lifeline');
        },
        onError: () => {
          setGameState('error');
        }
      });
    } else {
      setFinalResult({ pointsRecorded: caseScore + bonusScore, isPersonalBest: false, standing: { rank: 0, behind: 0 } });
      setLifelineContext('gameover');
      setGameState('lifeline');
    }
  };

  const handleRetrySubmit = () => {
    if (lastPayloadRef.current) {
      submitRun.mutate({ data: lastPayloadRef.current }, {
        onSuccess: (res) => {
          setFinalResult(res);
          setLifelineContext('gameover');
          setGameState('lifeline');
        },
        onError: () => {
          setGameState('error');
        }
      });
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
      const hasPlayed = (standing as any).scores?.find((s: any) => s.game === 'fraud_detective')?.played;
      if (hasPlayed) {
        setLifelineContext('reentry');
        setGameState('lifeline');
      }
    }
  }, [standing, gameState]);

  if (gameState === 'rules') {
    return (
      <Layout title="Fraud Detective" back="/">
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
      <Layout title="Training" back={() => setGameState('rules')}>
        <ScreenBody className="pt-3 pb-safe">
          <div className="shrink-0 mb-4">
            <h1 className="font-sans text-display-lg font-normal text-white leading-tight">{PRIMER.title}</h1>
          </div>
          
          <div className="stagger-in min-h-0 flex-1 app-scroll border-t border-ink-800">
            {PRIMER.body.map((p, i) => (
              <div key={i} className="flex items-start gap-3 border-b border-ink-800 py-3">
                <span className="mt-0.5 w-5 shrink-0 font-mono text-eyebrow-micro font-medium tabular-nums text-violet-500">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p className="text-body-sm text-[var(--text-on-dark-muted)] leading-snug">
                  {p}
                </p>
              </div>
            ))}
          </div>

          <div className="shrink-0 pt-4 mt-auto">
            <Button variant="light" size="lg" chevron onClick={() => setGameState('case')} className="w-full">
              Start investigation
            </Button>
          </div>
        </ScreenBody>
      </Layout>
    );
  }

  if (gameState === 'case' && currentCase) {
    const isFinished = solved || revealed;

    return (
      <Layout 
        title={currentCase.sector}
        back="/"
        headerRight={
          <div className="font-mono text-eyebrow-micro text-[var(--text-on-dark-muted)] uppercase tracking-[0.03em] px-1">
            {currentCase.order}/5
          </div>
        }
      >
        <ScreenBody className="pt-3 pb-safe">
          <div className="shrink-0 mb-3">
            <h2 className="font-sans text-display-lg font-normal text-white leading-tight">
              {currentCase.title}
            </h2>
            <p className="mt-2 font-mono text-body-sm text-[var(--text-on-dark-muted)] border-l-2 border-violet-700 pl-3 leading-snug">
              {currentCase.instruction}
            </p>
          </div>

          {/* Canvas View */}
          <div className="relative flex-1 min-h-[200px] border border-ink-800 bg-russian overflow-hidden z-0">
            <SignalField texture="dots" tone="russian" fade={false} />
            <TransformWrapper 
              initialScale={1}
              minScale={0.4}
              maxScale={2.5}
              centerOnInit
            >
              {({ resetTransform }) => (
                <>
                  <div className="absolute right-2 top-2 z-10">
                    <Button variant="secondary" size="icon" className="size-9 tap" onClick={() => resetTransform()}>
                      <Maximize className="size-4" strokeWidth={1.5} />
                    </Button>
                  </div>

                  <TransformComponent wrapperClass="w-full h-full" contentClass="w-full h-full flex items-center justify-center">
                    <svg className="h-full w-full" viewBox={graphViewBox}>
                      
                      {/* Edges */}
                      {graphEdges.map((e, i) => {
                        const isAnswerEdge = isFinished && (currentCase.answer.includes(e.source.id) || currentCase.answer.includes(e.target.id));
                        return (
                          <g key={i}>
                            <line
                              x1={e.source.x} y1={e.source.y}
                              x2={e.target.x} y2={e.target.y}
                              stroke={isAnswerEdge ? 'var(--coral-600)' : 'rgba(139,92,246,0.45)'}
                              strokeWidth={isAnswerEdge ? 2 : 1.5}
                              opacity={isFinished && !isAnswerEdge ? 0.15 : 1}
                              strokeDasharray={isAnswerEdge ? "none" : "4 4"}
                            />
                            {/* Edge labels are shown for the tapped account only.
                                Drawn all at once they collide with each other and
                                with the account captions on a phone, and in most
                                cases every edge carries the same word, so the set
                                is noise until you are asking about one account. */}
                            {/* Edge labels only after the case resolves — showing them
                                during play causes collision storms when a hub node with
                                many connections is selected. The Field Briefing text
                                communicates the pattern during active play. */}
                            {isFinished && currentCase.edgeLabels?.[`${e.source.id}|${e.target.id}`] && (
                              <text
                                x={(e.source.x + e.target.x) / 2}
                                y={(e.source.y + e.target.y) / 2 - 6}
                                textAnchor="middle"
                                stroke="var(--russian)"
                                strokeWidth={5}
                                style={{ paintOrder: 'stroke' }}
                                className="fill-[var(--text-on-dark-muted)] font-mono text-eyebrow-micro uppercase tracking-[0.03em]"
                                opacity={isAnswerEdge ? 0.9 : 0.25}
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

                        return (
                          <g 
                            key={n.id} 
                            transform={`translate(${n.x},${n.y})`}
                            onClick={() => !isFinished && setSelectedNode(n.id)}
                            className={cn(
                              "cursor-pointer transition-opacity duration-[var(--dur-base)] ease-[var(--ease-standard)]",
                              isFinished && !isAnswerNode ? "opacity-30" : "opacity-100"
                            )}
                          >
                            <foreignObject x={-60} y={-60} width={120} height={120} className="overflow-visible">
                              <div className="flex h-full w-full flex-col items-center justify-center">
                                {isSelected || isAnswerNode ? (
                                  <ScanFrame id={n.id.substring(0, 4)} tone={isAnswerNode ? 'coral' : 'violet'}>
                                    <div className={cn(
                                      "flex size-12 items-center justify-center border",
                                      isAnswerNode ? "border-coral-600 bg-coral-600 text-russian" : "border-violet-500 bg-violet-700 text-white"
                                    )}>
                                      <span className="font-mono text-body-md uppercase">{n.id.substring(0, 2)}</span>
                                    </div>
                                  </ScanFrame>
                                ) : (
                                  <div className="group tap flex size-12 items-center justify-center border border-ink-700 bg-ink-800 text-white transition-colors hover:border-violet-700">
                                    <span className="font-mono text-body-md uppercase">{n.id.substring(0, 2)}</span>
                                  </div>
                                )}
                                <span className={cn(
                                  "mt-1.5 text-center font-mono text-eyebrow-micro uppercase tracking-[0.03em] leading-none",
                                  isAnswerNode ? "text-coral-600" : "text-[var(--text-on-dark-muted)]"
                                )}>
                                  {currentCase.nodeLabels?.[n.id] || n.id}
                                </span>
                              </div>
                            </foreignObject>
                          </g>
                        );
                      })}

                    </svg>
                  </TransformComponent>
                </>
              )}
            </TransformWrapper>
          </div>

          <div className="shrink-0 mt-3">
            {!isFinished && (
              <div className="border border-amber-500/30 bg-[rgba(245,158,11,0.04)]">
                {/* Header */}
                <div className="flex items-center gap-2 border-b border-amber-500/20 px-3 py-2">
                  <Fingerprint className="size-3.5 shrink-0 text-amber-400" strokeWidth={1.5} />
                  <span className="font-mono text-eyebrow-micro font-semibold uppercase tracking-[0.12em] text-amber-400">
                    Field Briefing
                  </span>
                  <span className="ml-auto font-mono text-eyebrow-micro text-[var(--text-on-dark-faint)] uppercase tracking-widest">
                    {currentCase.id.replace(/_/g, '-').substring(0, 10).toUpperCase()}
                  </span>
                </div>
                {/* Evidence items */}
                <div className="divide-y divide-amber-500/10">
                  {currentCase.clues.map((clue, i) => (
                    <div key={i} className="flex items-start gap-3 px-3 py-2.5">
                      <span className="shrink-0 font-mono text-eyebrow-micro font-bold tabular-nums text-amber-400 leading-snug pt-px">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <p className="font-mono text-body-sm text-[var(--text-on-dark)] leading-snug">
                        {clue}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isFinished && (
              <div className="animate-resolve-in border border-violet-500/60 bg-violet-700/10">
                {/* Header */}
                <div className="flex items-center gap-2 border-b border-violet-500/30 px-3 py-2">
                  <CheckCircle2 className="size-3.5 shrink-0 text-violet-400" strokeWidth={1.5} />
                  <span className="font-mono text-eyebrow-micro font-semibold uppercase tracking-[0.12em] text-violet-300">
                    Case Closed
                  </span>
                </div>
                {/* Explanation */}
                <div className="px-3 py-2.5">
                  <p className="font-mono text-body-sm text-[var(--text-on-dark-muted)] leading-snug">
                    {currentCase.explanation}
                  </p>
                </div>
                {/* Hook — the bureau insight */}
                <div className="flex items-start gap-3 border-t border-violet-500/20 px-3 py-2.5 bg-violet-700/10">
                  <MapPin className="size-3.5 shrink-0 text-violet-400 mt-px" strokeWidth={1.5} />
                  <p className="font-mono text-body-sm text-white leading-snug">
                    {currentCase.hook}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="shrink-0 mt-3 pt-3 border-t border-ink-800">
            {!isFinished ? (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-mono text-eyebrow-micro text-[var(--text-on-dark-muted)] uppercase tracking-[0.03em]">
                    Wrong: {wrongGuesses}
                  </span>
                  <button 
                    className="tap font-mono text-eyebrow-micro text-violet-500 uppercase tracking-[0.03em]"
                    onClick={handleReveal}
                  >
                    Reveal answer
                  </button>
                </div>
                <Button 
                  variant={selectedNode ? 'default' : 'secondary'} 
                  size="lg" 
                  className="w-full"
                  disabled={!selectedNode}
                  onClick={handleAccuse}
                  chevron
                >
                  Submit accusation
                </Button>
              </>
            ) : (
              <Button variant="light" size="lg" className="w-full" onClick={handleNextCase} chevron>
                Next case
              </Button>
            )}
          </div>
        </ScreenBody>
      </Layout>
    );
  }

  if (gameState === 'bonus') {
    const q = BONUS.questions[bonusIndex];
    const answeredRing = bonusAnswers[bonusIndex];

    return (
      <Layout 
        title="Bonus Round" 
        back="/"
        headerRight={
          <div className="font-mono text-eyebrow-micro text-[var(--text-on-dark-muted)] uppercase tracking-[0.03em] pr-1">
            {bonusIndex + 1}/{BONUS.questions.length}
          </div>
        }
      >
        <ScreenBody className="pt-3 pb-safe">
          <div className="shrink-0 mb-4 space-y-1">
            <h2 className="font-sans text-display-lg font-normal text-white leading-tight">{BONUS.title}</h2>
            <p className="text-body-sm text-[var(--text-on-dark-muted)] leading-snug">{BONUS.brief}</p>
          </div>

          <div className="relative flex min-h-[360px] flex-1 items-center justify-center border border-ink-800 bg-ink-900 overflow-hidden shrink-0">
            <SignalField texture="matrix" tone="ink" />
            
            <div className="absolute top-3 left-3 z-20">
              <ScanFrame id="TARGET" tone="cyan">
                <div className="bg-russian border border-cyan-500 px-3 py-2">
                  <h3 className="font-mono text-eyebrow-micro font-medium text-cyan-500 uppercase tracking-[0.03em]">
                    {q.subject}
                  </h3>
                </div>
              </ScanFrame>
            </div>

            {/* Target Canvas */}
            <div className="relative flex size-[280px] items-center justify-center">
              {/* Bacon Center */}
              <div className="absolute flex size-[70px] items-center justify-center bg-violet-700 z-10 border border-violet-500">
                <span className="font-mono text-eyebrow-micro font-medium text-white text-center uppercase tracking-[0.03em] leading-tight">
                  Kevin<br/>Bacon
                </span>
              </div>
              
              {/* Rings as nested squares */}
              {[1, 2, 3].map(degree => {
                const size = 70 + (degree * 70);
                const isSelected = answeredRing === degree;
                const isCorrect = q.answer === degree;
                const showResult = answeredRing !== undefined;

                const borderColor = !showResult 
                  ? 'var(--ink-700)' 
                  : isCorrect 
                    ? 'var(--lime-300)' 
                    : isSelected 
                      ? 'var(--coral-600)' 
                      : 'var(--ink-800)';

                return (
                  <button
                    key={degree}
                    className="tap absolute flex items-start justify-center group transition-colors duration-[var(--dur-base)]"
                    style={{ 
                      width: `${size}px`, 
                      height: `${size}px`,
                      border: `1px solid ${borderColor}`,
                    }}
                    onClick={() => handleBonusTap(degree)}
                    disabled={showResult}
                  >
                    {!showResult && (
                      <div className="absolute -top-[9px] bg-ink-900 px-1 font-mono text-eyebrow-micro leading-none uppercase tracking-[0.03em] text-[var(--text-on-dark-muted)] group-hover:text-violet-500 transition-colors">
                        {BONUS.rings.find(r => r.degree === degree)?.label}
                      </div>
                    )}
                    
                    {showResult && isCorrect && (
                      <div className="absolute -top-[9px] bg-lime-300 text-russian px-1.5 py-0.5 font-mono text-eyebrow-micro uppercase tracking-[0.03em] animate-resolve-in border border-lime-300 whitespace-nowrap z-20 leading-none">
                        {q.subject}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explain panel */}
            {answeredRing !== undefined && (
              <div className="absolute bottom-3 left-3 right-3 z-30 animate-resolve-in border border-ink-700 bg-russian p-3">
                <div className="flex gap-3">
                  {answeredRing === q.answer ? (
                    <CheckCircle2 className="size-5 text-lime-300 shrink-0" strokeWidth={1.5} />
                  ) : (
                    <AlertCircle className="size-5 text-coral-600 shrink-0" strokeWidth={1.5} />
                  )}
                  <div className="min-w-0">
                    <h4 className="font-mono text-eyebrow-micro font-medium uppercase tracking-[0.03em] text-white mb-0.5">
                      {answeredRing === q.answer ? "Correct" : "Wrong"}
                    </h4>
                    <p className="font-sans text-body-sm text-[var(--text-on-dark-muted)] leading-snug">{q.note}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScreenBody>
      </Layout>
    );
  }

  if (gameState === 'error') {
    return (
      <Layout title="Error" back="/">
        <ScreenBody className="pt-3 pb-safe">
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center border border-coral-600 bg-russian p-6 text-center">
            <div className="flex size-12 items-center justify-center bg-coral-600 text-russian">
              <ShieldAlert className="size-6" strokeWidth={1.5} />
            </div>
            <h1 className="mt-5 font-sans text-display-md font-normal text-white">Save Failed</h1>
            <p className="mt-2 text-body-sm text-[var(--text-on-dark-muted)] leading-snug">
              We couldn't record your run due to a network error. Your points are safe.
            </p>
          </div>
          <div className="shrink-0 pt-4 mt-auto">
            <Button size="lg" className="w-full" onClick={handleRetrySubmit} disabled={submitRun.isPending} chevron>
              {submitRun.isPending ? 'Retrying' : 'Retry submit'}
            </Button>
          </div>
        </ScreenBody>
      </Layout>
    );
  }

  if (gameState === 'lifeline') {
    if (!lifelineQuestion) return null;
    const total = finalResult?.pointsRecorded ?? (caseScore + bonusScore);
    return (
      <LifelineGate
        question={lifelineQuestion}
        context={lifelineContext}
        gameTitle="Fraud Detective"
        scoreDisplay={total > 0 ? (
          <StatReadout value={total} caption="Points Secured" size="sm" tone="on-dark" />
        ) : undefined}
        onRetry={() => {
          setCaseIndex(0);
          setCaseScore(0);
          setBonusScore(0);
          setCaseResults([]);
          setSelectedNode(null);
          setWrongGuesses(0);
          setRevealed(false);
          setSolved(false);
          setBonusIndex(0);
          setBonusAnswers({});
          setGraphNodes([]);
          setGraphEdges([]);
          setFinalResult(null);
          lastPayloadRef.current = null;
          fetchLifelineQuestion().then(setLifelineQuestion);
          setGameState('rules');
        }}
        onExit={() => setLocation('/')}
      />
    );
  }

  return null;
}
