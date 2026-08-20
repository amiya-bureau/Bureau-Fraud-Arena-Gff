import { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { usePlayerSession } from '@/lib/store';
import { Layout, ScreenBody } from '@/components/layout';
import { RulesScreen } from '@/components/rules-screen';
import { Button } from '@/components/ui/button';
import { RetryOptions } from '@/components/retry-options';
import { GameEndScreen } from '@/components/game-end-screen';
import { useSubmitRun, useSaveRunProgress, useGetPlayerStanding, RunInput } from '@workspace/api-client-react';
import { CASES, PRIMER, BONUS, type DetectiveCase } from '@/data/detective';
import { LifelineGate } from '@/components/lifeline-gate';
import { fetchDetectiveCasePack, fetchLifelineQuestion, type LifelineQuestion } from '@/lib/gamePack';
import { v4 as uuidv4 } from 'uuid';
import { Maximize, AlertCircle, Fingerprint, CheckCircle2, ShieldAlert, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as d3 from 'd3-force';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import {
  EyebrowTag,
  SignalField,
  ScanFrame,
  StatReadout,
} from '@/components/bureau';
import { isDevTestMode } from '@/lib/dev-test-mode';

type GameState = 'rules' | 'primer' | 'case' | 'casefail' | 'bonus' | 'lifeline' | 'highscore' | 'error';
const CASE_TIMER_SECONDS = 45;

// Simple deterministic seeded random
function seededRandom(s: number) {
  return function() {
    s = Math.sin(s) * 10000; return s - Math.floor(s);
  };
}

export default function FraudDetective() {
  const { session } = usePlayerSession();
  const [, setLocation] = useLocation();
  const devTestMode = isDevTestMode();
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
  const orderCasePack = (cases: DetectiveCase[]) => cases.map((c, i) => ({ ...c, order: i + 1 }));
  useEffect(() => {
    fetchDetectiveCasePack().then(cases => {
      // Re-number cases 1–5 so the progress counter stays consistent.
      setCasePack(orderCasePack(cases));
    });
  }, []);

  const activeCases = casePack ?? CASES;

  const [caseScore, setCaseScore] = useState(0);
  const [bonusScore, setBonusScore] = useState(0);
  const [caseResults, setCaseResults] = useState<any[]>([]);
  const [caseTimeLeft, setCaseTimeLeft] = useState(CASE_TIMER_SECONDS);
  const [caseTimerStartedAt, setCaseTimerStartedAt] = useState<number | null>(null);
  const [caseFailSec, setCaseFailSec] = useState(10);
  const [caseClosedSec, setCaseClosedSec] = useState(5);
  const [caseFailTab, setCaseFailTab] = useState<'graph' | 'why'>('graph');

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

  const resetCaseTimer = () => {
    setCaseTimeLeft(CASE_TIMER_SECONDS);
    setCaseTimerStartedAt(Date.now());
  };

  // Every investigation case gets its own 45-second clock.
  useEffect(() => {
    if (gameState !== 'case') return;
    resetCaseTimer();
  }, [gameState, caseIndex]);

  useEffect(() => {
    if (gameState !== 'case' || solved || revealed || caseTimerStartedAt === null) return;

    const deadline = caseTimerStartedAt + CASE_TIMER_SECONDS * 1000;
    const syncTimeLeft = () => {
      const millisecondsLeft = Math.max(0, deadline - Date.now());
      setCaseTimeLeft(Math.ceil(millisecondsLeft / 1000));
    };

    syncTimeLeft();
    const timer = window.setInterval(syncTimeLeft, 250);
    return () => window.clearInterval(timer);
  }, [gameState, solved, revealed, caseTimerStartedAt]);

  useEffect(() => {
    if (gameState !== 'case' || solved || revealed || caseTimeLeft > 0) return;

    setRevealed(true);
    setCaseResults(prev => [...prev, {
      id: currentCase?.id,
      points: 0,
      wrongGuesses,
      revealed: true,
      timedOut: true,
    }]);
    setGameState('casefail');
  }, [caseTimeLeft, gameState, solved, revealed, currentCase, wrongGuesses]);

  /**
   * Fit the SVG coordinate system to the settled layout.
   *
   * Scaling the viewBox rather than the node positions is the whole trick: the
   * viewBox scales the 48px node boxes and the gaps between them by the same
   * factor, so the separation the collide force guaranteed survives the fit.
   * Compressing positions alone (the obvious move) leaves the boxes at 48px and
   * packs them into each other.
   */
  const graphData = useMemo(() => {
    if (!graphNodes.length) return { viewBox: '-200 -200 400 400', width: 400, height: 400 };
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
    const width = maxX - minX;
    const height = maxY - minY;
    return { viewBox: `${minX} ${minY} ${width} ${height}`, width, height };
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

  const startGame = async () => {
    // Do not let an eager Start tap use the pre-v5 fallback while the reviewed
    // pack is still decoding.
    const pack = casePack ?? orderCasePack(await fetchDetectiveCasePack());
    setCasePack(pack);
    resetCaseTimer();
    setGameState('case');
  };

  const handleAccuse = () => {
    if (!selectedNode || solved || revealed) return;
    
    if (currentCase.answer.includes(selectedNode)) {
      setSolved(true);
      const pts = 15;
      const milestoneBonus = currentCase.order === 3 ? 10 : currentCase.order === 5 ? 15 : 0;
      setCaseScore(s => s + pts);
      if (milestoneBonus) setBonusScore(s => s + milestoneBonus);
      
      setCaseResults(prev => [...prev, {
        id: currentCase.id,
        points: pts,
        milestoneBonus,
        wrongGuesses,
        revealed: false
      }]);
    } else {
      // First wrong accusation — immediately reveal the answer and fail this case.
      setRevealed(true);
      setCaseResults(prev => [...prev, {
        id: currentCase.id,
        points: 0,
        wrongGuesses: 1,
        revealed: true,
      }]);
      setGameState('casefail');
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
      resetCaseTimer();
      setCaseIndex(i => i + 1);
    } else {
      endRun();
    }
  };

  // A solved case stays on screen long enough for its explanation to land,
  // then the investigation moves forward without a second tap.
  useEffect(() => {
    if (gameState !== 'case' || !solved) return;

    setCaseClosedSec(5);
    const advance = window.setTimeout(handleNextCase, 5_000);
    const countdown = window.setInterval(() => {
      setCaseClosedSec((seconds) => Math.max(0, seconds - 1));
    }, 1_000);

    return () => {
      window.clearTimeout(advance);
      window.clearInterval(countdown);
    };
  }, [gameState, solved, caseIndex]);

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
    const completedPerfectly =
      caseResults.length === activeCases.length &&
      caseResults.every((result) => result.points > 0 && !result.revealed);

    if (session) {
      const total = caseScore + bonusScore;

      const payload: RunInput = {
        playerId: session.player.id,
        game: 'fraud_detective',
        points: total,
        source: new URLSearchParams(window.location.search).get('src') === 'qr' ? 'phone' : 'kiosk',
        idempotencyKey: runIdRef.current,
        detail: {
          cases: caseResults,
          casePoints: caseScore,
          milestonePoints: bonusScore,
          tier: total >= 80 ? "Master" : (total >= 40 ? "Achiever" : "Participation"),
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
      setFinalResult({ pointsRecorded: caseScore + bonusScore, isPersonalBest: false, standing: { rank: 0, behind: 0 } });
      setGameState(completedPerfectly ? 'highscore' : 'lifeline');
    }
  };

  const handleRetrySubmit = () => {
    if (lastPayloadRef.current) {
      submitRun.mutate({ data: lastPayloadRef.current }, {
        onSuccess: (res) => {
          setFinalResult(res);
          const completedPerfectly =
            caseResults.length === activeCases.length &&
            caseResults.every((result) => result.points > 0 && !result.revealed);
          setGameState(completedPerfectly ? 'highscore' : 'lifeline');
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

  // Case-fail auto-exit timer.
  useEffect(() => {
    if (gameState === 'casefail') setCaseFailSec(10);
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'casefail') return;
    if (caseFailSec <= 0) { endRun(); return; }
    const t = setTimeout(() => setCaseFailSec(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [caseFailSec, gameState]);

  if (gameState === 'rules') {
    return (
      <Layout title="Fraud Detective" back="/">
        <RulesScreen 
          gameName="Fraud Detective"
          premise="Five graph investigation cases. Find the hidden links that expose the rings."
          scoring="15 points per case (75 total), plus 10 points for clearing case 3 and 15 points for clearing case 5. Maximum 100 points."
          endsWhen="Five cases. One wrong accusation ends that case — banked points carry forward."
          lifelines="Choose carefully. One wrong tap reveals the answer and fails the case."
          standing={standing}
          gameKey="fraud_detective"
          onStart={startGame}
          startLabel="Begin investigation"
          insightTitle={PRIMER.title}
          insightBullets={PRIMER.body}
        />
      </Layout>
    );
  }

  if (gameState === 'case' && currentCase) {
    const isFinished = solved || revealed;
    const showAnswerHints = isFinished || devTestMode;
    const visibleCaseTitle = isFinished ? currentCase.title : `Case ${currentCase.order}`;

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
             <h2 className="font-sans text-display-md font-normal text-white leading-tight">
               {visibleCaseTitle}
            </h2>
          </div>

           {/* Case timer — resets for each investigation and fails the case at zero. */}
           <div className="shrink-0 mb-2">
             {devTestMode && (
               <span className="mb-1 block font-mono text-[10px] font-medium uppercase tracking-[0.03em] text-lime-300">
                 Dev test mode · correct nodes highlighted
               </span>
             )}
             <div className="mb-1 flex items-center justify-between">
               <span className="font-mono text-eyebrow-micro uppercase tracking-[0.03em] text-[var(--text-on-dark-muted)]">
                 Case timer
               </span>
               <span className={cn(
                 "font-mono text-eyebrow-micro tabular-nums",
                 caseTimeLeft <= 10 ? "text-coral-600 animate-pulse" : "text-[var(--text-on-dark-muted)]"
               )}>
                 {caseTimeLeft}s
               </span>
             </div>
             <div
               className="h-1 w-full bg-ink-800"
               role="progressbar"
               aria-label="Case time remaining"
               aria-valuemin={0}
               aria-valuemax={CASE_TIMER_SECONDS}
               aria-valuenow={caseTimeLeft}
             >
               <div
                 className={cn(
                   "h-full transition-[width] duration-1000 ease-linear",
                   caseTimeLeft <= 10 ? "bg-coral-600" : "bg-cyan-500"
                 )}
                 style={{ width: `${(caseTimeLeft / CASE_TIMER_SECONDS) * 100}%` }}
               />
             </div>
           </div>

          {/* Canvas View — bleeds edge-to-edge to avoid the px-4 main padding creating a jarring clip boundary */}
           <div className="-mx-4 relative min-h-0 flex-1 border-y border-ink-800 bg-russian overflow-hidden z-0" style={{ touchAction: 'none' }}>
            <SignalField texture="dots" tone="russian" fade={false} />
            {/* Gesture hint */}
            <div aria-hidden className="pointer-events-none absolute bottom-2 left-2 z-10 flex items-center gap-1.5 rounded bg-ink-900/70 px-2 py-1">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-on-dark-faint)]">drag · pinch · scroll</span>
            </div>
            <TransformWrapper 
              initialScale={1}
              minScale={0.3}
              maxScale={4}
              centerOnInit
              limitToBounds={false}
              panning={{ velocityDisabled: false }}
              doubleClick={{ disabled: true }}
            >
              {({ resetTransform }) => (
                <>
                  <div className="absolute right-2 top-2 z-10">
                    <Button variant="secondary" size="icon" className="size-9 tap" onClick={() => resetTransform()}>
                      <Maximize className="size-4" strokeWidth={1.5} />
                    </Button>
                  </div>

                  <TransformComponent wrapperClass="w-full h-full" contentClass="flex items-center justify-center">
                    <svg width={graphData.width} height={graphData.height} viewBox={graphData.viewBox}>
                      {/* Arrow markers for directed edges */}
                      <defs>
                        <marker id="arrow-normal" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                          <path d="M0,0 L0,6 L6,3 z" fill="rgba(139,92,246,0.7)" />
                        </marker>
                        <marker id="arrow-answer" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                          <path d="M0,0 L0,6 L6,3 z" fill="var(--coral-600)" />
                        </marker>
                      </defs>

                      {/* Edges */}
                      {graphEdges.map((e, i) => {
                        const isAnswerEdge = showAnswerHints && (currentCase.answer.includes(e.source.id) || currentCase.answer.includes(e.target.id));
                        // Shorten endpoints so arrowheads don't disappear behind node boxes (48 px centred on x,y)
                        const dx = e.target.x - e.source.x;
                        const dy = e.target.y - e.source.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        const pad = 30;
                        const safe = dist > pad * 2;
                        const x1a = safe ? e.source.x + (dx / dist) * pad : e.source.x;
                        const y1a = safe ? e.source.y + (dy / dist) * pad : e.source.y;
                        const x2a = safe ? e.target.x - (dx / dist) * pad : e.target.x;
                        const y2a = safe ? e.target.y - (dy / dist) * pad : e.target.y;
                        return (
                          <g key={i}>
                            <line
                              x1={x1a} y1={y1a}
                              x2={x2a} y2={y2a}
                              stroke={isAnswerEdge ? 'var(--coral-600)' : 'rgba(139,92,246,0.45)'}
                              strokeWidth={isAnswerEdge ? 2 : 1.5}
                              opacity={isFinished && !isAnswerEdge ? 0.15 : 1}
                              strokeDasharray={isAnswerEdge ? "none" : "4 4"}
                              markerEnd={isAnswerEdge ? 'url(#arrow-answer)' : 'url(#arrow-normal)'}
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
                        const isAnswerNode = showAnswerHints && currentCase.answer.includes(n.id);

                        return (
                          <g 
                            key={n.id} 
                            transform={`translate(${n.x},${n.y})`}
                            onClick={() => !isFinished && setSelectedNode(n.id)}
                            data-dev-correct={(devTestMode && isAnswerNode) || undefined}
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
                                   {isFinished ? (currentCase.nodeLabels?.[n.id] || n.id) : n.id}
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

           <div className="shrink-0 mt-2 space-y-1.5">
            {!isFinished && (
              <>
                {/* Objective */}
                <div className="border border-violet-700/40 bg-violet-700/5">
                   <div className="flex items-center gap-2 border-b border-violet-700/30 px-3 py-1.5">
                     <Target className="size-3 shrink-0 text-violet-400" strokeWidth={1.5} />
                     <span className="font-mono text-[12px] font-semibold uppercase tracking-[0.12em] text-violet-400">
                      Objective
                    </span>
                  </div>
                   <div className="px-3 py-2">
                     <p className="font-mono text-[13px] text-[var(--text-on-dark)] leading-snug">
                      {currentCase.instruction}
                    </p>
                  </div>
                </div>
                {/* Clues */}
                <div className="border border-amber-500/30 bg-[rgba(245,158,11,0.04)]">
                  {/* Header */}
                   <div className="flex items-center gap-2 border-b border-amber-500/20 px-3 py-1.5">
                     <Fingerprint className="size-3 shrink-0 text-amber-400" strokeWidth={1.5} />
                     <span className="font-mono text-[12px] font-semibold uppercase tracking-[0.12em] text-amber-400">
                      Clues
                    </span>
                     <span className="ml-auto font-mono text-[11px] text-[var(--text-on-dark-faint)] uppercase tracking-widest">
                      {currentCase.id.replace(/_/g, '-').substring(0, 10).toUpperCase()}
                    </span>
                  </div>
                  {/* Evidence items */}
                  <div className="divide-y divide-amber-500/10">
                    {currentCase.clues.map((clue, i) => (
                       <div key={i} className="flex items-start gap-2 px-3 py-1.5">
                         <span className="shrink-0 font-mono text-[12px] font-bold tabular-nums text-amber-400 leading-snug pt-px">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                         <p className="font-mono text-[13px] text-[var(--text-on-dark)] leading-snug">
                          {clue}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {solved && (
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
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between font-mono text-eyebrow-micro uppercase tracking-[0.03em] text-[var(--text-on-dark-muted)]">
                      <span>Next case loading</span>
                      <span className="tabular-nums">{caseClosedSec}s</span>
                    </div>
                    <div className="h-0.5 bg-ink-800">
                      <div
                        key={`case-closed-${caseIndex}`}
                        className="correct-countdown-drain h-full w-full bg-violet-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

           <div className="shrink-0 mt-2 pt-2 border-t border-ink-800">
            {!isFinished ? (
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
            ) : solved ? (
              <div className="py-3 text-center font-mono text-eyebrow-micro uppercase tracking-[0.03em] text-violet-300">
                Advancing to the next case…
              </div>
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

  if (gameState === 'casefail' && currentCase) {
    return (
      <Layout title={currentCase.sector} back="/">
        <ScreenBody className="pt-3 pb-safe">

          {/* Header */}
          <div className="flex shrink-0 items-center justify-between gap-3">
            <EyebrowTag tone="coral">Case Failed</EyebrowTag>
            <div className="relative flex items-baseline gap-1.5 pr-3">
              <span className="font-sans text-display-md font-normal tabular-nums text-white">
                {caseScore + bonusScore}
              </span>
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.03em] text-[var(--text-on-dark-muted)]">
                Points Banked
              </span>
              <span aria-hidden className="absolute right-0 top-0 size-2 bg-violet-700" />
            </div>
          </div>

          {/* Auto-exit countdown */}
          <div className="mt-2 shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono text-eyebrow-micro uppercase tracking-[0.03em] text-[var(--text-on-dark-muted)]">
                Auto-exit
              </span>
              <span className={cn(
                "font-mono text-eyebrow-micro tabular-nums",
                caseFailSec <= 3 ? "text-coral-600 animate-pulse" : "text-[var(--text-on-dark-muted)]"
              )}>
                {caseFailSec}s
              </span>
            </div>
            <div className="h-0.5 w-full bg-ink-800">
              <div
                className={cn(
                  "h-full bg-coral-600",
                  caseFailSec < 10 && "transition-[width] duration-1000 ease-linear"
                )}
                style={{ width: `${(caseFailSec / 10) * 100}%` }}
              />
            </div>
          </div>

          {/* Tab bar */}
          <div className="-mx-4 mt-3 shrink-0 flex border-b border-ink-800">
            {(['graph', 'why'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setCaseFailTab(tab)}
                className={cn(
                  "flex-1 py-2 font-mono text-[12px] uppercase tracking-[0.1em] transition-colors tap",
                  caseFailTab === tab
                    ? "text-coral-500 border-b-2 border-coral-500 -mb-px"
                    : "text-[var(--text-on-dark-muted)] hover:text-[var(--text-on-dark)]"
                )}
              >
                {tab === 'graph' ? 'Answer' : 'Why?'}
              </button>
            ))}
          </div>

          {/* Tab content expands to use the space between the tabs and actions. */}
          <div className="min-h-0 flex-1">
            {caseFailTab === 'graph' ? (
              <div
                className="-mx-4 h-full border-b border-ink-800 bg-russian overflow-hidden relative"
                style={{ touchAction: 'none' }}
              >
                <SignalField texture="dots" tone="russian" fade={false} />
                <TransformWrapper
                  initialScale={1}
                  minScale={0.3}
                  maxScale={4}
                  centerOnInit
                  limitToBounds={false}
                  panning={{ velocityDisabled: false }}
                  doubleClick={{ disabled: true }}
                >
                  {({ resetTransform }) => (
                    <>
                      <div className="absolute right-2 top-2 z-10">
                        <Button variant="secondary" size="icon" className="size-9 tap" onClick={() => resetTransform()}>
                          <Maximize className="size-4" strokeWidth={1.5} />
                        </Button>
                      </div>
                      <TransformComponent wrapperClass="w-full h-full" contentClass="flex items-center justify-center">
                        <svg width={graphData.width} height={graphData.height} viewBox={graphData.viewBox}>
                          <defs>
                            <marker id="cf-arrow-normal" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                              <path d="M0,0 L0,6 L6,3 z" fill="rgba(139,92,246,0.7)" />
                            </marker>
                            <marker id="cf-arrow-answer" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                              <path d="M0,0 L0,6 L6,3 z" fill="var(--coral-600)" />
                            </marker>
                          </defs>

                          {graphEdges.map((e, i) => {
                            const isAnswerEdge = currentCase.answer.includes(e.source.id) || currentCase.answer.includes(e.target.id);
                            const dx = e.target.x - e.source.x;
                            const dy = e.target.y - e.source.y;
                            const dist = Math.sqrt(dx * dx + dy * dy);
                            const pad = 30;
                            const safe = dist > pad * 2;
                            const x1a = safe ? e.source.x + (dx / dist) * pad : e.source.x;
                            const y1a = safe ? e.source.y + (dy / dist) * pad : e.source.y;
                            const x2a = safe ? e.target.x - (dx / dist) * pad : e.target.x;
                            const y2a = safe ? e.target.y - (dy / dist) * pad : e.target.y;
                            return (
                              <g key={i}>
                                <line
                                  x1={x1a} y1={y1a} x2={x2a} y2={y2a}
                                  stroke={isAnswerEdge ? 'var(--coral-600)' : 'rgba(139,92,246,0.45)'}
                                  strokeWidth={isAnswerEdge ? 2 : 1.5}
                                  opacity={isAnswerEdge ? 1 : 0.15}
                                  strokeDasharray={isAnswerEdge ? "none" : "4 4"}
                                  markerEnd={isAnswerEdge ? 'url(#cf-arrow-answer)' : 'url(#cf-arrow-normal)'}
                                />
                                {currentCase.edgeLabels?.[`${e.source.id}|${e.target.id}`] && (
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

                          {graphNodes.map((n) => {
                            const isAnswerNode = currentCase.answer.includes(n.id);
                            return (
                              <g
                                key={n.id}
                                transform={`translate(${n.x},${n.y})`}
                                className={cn(
                                  "transition-opacity duration-[var(--dur-base)] ease-[var(--ease-standard)]",
                                  isAnswerNode ? "opacity-100" : "opacity-30"
                                )}
                              >
                                <foreignObject x={-60} y={-60} width={120} height={120} className="overflow-visible">
                                  <div className="flex h-full w-full flex-col items-center justify-center">
                                    {isAnswerNode ? (
                                      <ScanFrame id={n.id.substring(0, 4)} tone="coral">
                                        <div className="flex size-12 items-center justify-center border border-coral-600 bg-coral-600 text-russian">
                                          <span className="font-mono text-body-md uppercase">{n.id.substring(0, 2)}</span>
                                        </div>
                                      </ScanFrame>
                                    ) : (
                                      <div className="flex size-12 items-center justify-center border border-ink-700 bg-ink-800 text-white">
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
            ) : (
              <div className="h-full overflow-y-auto py-4 border-b border-ink-800">
                <div className="border-l-2 border-coral-600/50 pl-3">
                  <p className="font-mono text-body-sm text-[var(--text-on-dark-muted)] leading-snug">
                    {currentCase.explanation}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* The shared action stack keeps every retry screen in the same place. */}
          <div className="mt-auto pt-3">
            <RetryOptions currentGame="fraud_detective" onRetry={endRun} />
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
            {devTestMode && (
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.03em] text-lime-300">
                Dev test mode · correct ring highlighted
              </span>
            )}
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
                const showResult = answeredRing !== undefined || devTestMode;

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
                    data-dev-correct={(devTestMode && isCorrect) || undefined}
                    onClick={() => handleBonusTap(degree)}
                    disabled={answeredRing !== undefined}
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

  if (gameState === 'highscore') {
    return (
      <GameEndScreen
        currentGame="fraud_detective"
        points={finalResult?.pointsRecorded ?? (caseScore + bonusScore)}
        standing={finalResult?.standing}
        isPersonalBest={finalResult?.isPersonalBest}
        highScore
      />
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
          <div className="relative flex items-baseline gap-1.5 pr-3">
            <span className="font-sans text-display-md font-normal tabular-nums text-white">{total}</span>
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.03em] text-[var(--text-on-dark-muted)]">
              Points Secured
            </span>
            <span aria-hidden className="absolute right-0 top-0 size-2 bg-violet-700" />
          </div>
        ) : undefined}
        compact
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
