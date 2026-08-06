import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { usePlayerSession } from '@/lib/store';
import { Layout } from '@/components/layout';
import { RulesScreen } from '@/components/rules-screen';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSubmitRun, useGetPlayerStanding, RunInput, DetectorVerdict, useDetectSpoof } from '@workspace/api-client-react';
import { v4 as uuidv4 } from 'uuid';
import { UploadCloud, ShieldCheck, Activity, CheckCircle2, AlertTriangle, AlertCircle, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

const SIGNAL_DESCRIPTIONS: Record<string, string> = {
  "Frequency-domain artefacts": "High-frequency noise patterns inconsistent with natural capture.",
  "Noise-residual consistency": "The noise residual across your image is too uniform to be camera output.",
  "Facial-landmark geometry": "Micro-asymmetries in specular reflections detected.",
  "Compression-history analysis": "Missing multiple JPEG compression generations expected for a photo.",
  "Colour-channel correlation": "Chroma subsampling anomalies in high-contrast edge regions."
};

type GameState = 'rules' | 'uploading' | 'detecting' | 'reveal' | 'decision' | 'gameover' | 'error';

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
      setErrorMsg("Image must be under 10MB");
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg("Only JPEG, PNG and WebP are supported.");
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
      
      detectSpoof.mutate({
        data: {
          playerId: session?.player.id || '',
          level,
          image: base64,
          mimeType: file.type,
          fileName: file.name
        }
      }, {
        onSuccess: (res) => {
          setVerdict(res);
          setGameState('reveal');
          setRevealStep(0);
        },
        onError: (err: any) => {
          console.error(err);
          setErrorMsg(err?.response?.data?.error || "Detector failed to run. Please try again.");
          setGameState('uploading');
        }
      });
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (gameState === 'reveal' && verdict) {
      const totalSignals = verdict.signals.length;
      if (revealStep <= totalSignals) {
        const timer = setTimeout(() => {
          setRevealStep(s => s + 1);
        }, 600); // short stagger
        return () => clearTimeout(timer);
      }
    }
    return undefined;
  }, [gameState, revealStep, verdict]);

  const failPoints = level === 1 ? 15 : (level === 2 ? 40 : 60);
  const winPoints = level === 1 ? 40 : (level === 2 ? 60 : 75);

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
    let tier = "Participation";
    let drawPool = null;
    
    const foolsCount = finalAttempts.filter(a => a.fooled).length;
    if (foolsCount === 2) drawPool = "airpods";
    if (foolsCount === 3) drawPool = "ipad";

    if (pts >= 40) tier = "Achiever";

    if (session) {
      const payload: RunInput = {
        playerId: session.player.id,
        game: 'spoof_the_system',
        points: pts,
        source: new URLSearchParams(window.location.search).get('src') === 'qr' ? 'phone' : 'kiosk',
        idempotencyKey: runIdRef.current,
        detail: {
          attempts: finalAttempts,
          ladderReached: level,
          quitVoluntarily,
          drawPool,
          tier
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
      setFinalResult({ pointsRecorded: pts, isPersonalBest: false, standing: { rank: 0, behind: 0 } });
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

  useEffect(() => {
    if (gameState === 'reveal' && verdict && revealStep > verdict.signals.length) {
      let finalAttempts = attemptsData;
      setAttemptsData(prev => {
        const newData = [...prev];
        // avoid duplicates if effect re-runs
        if (!newData.some(a => a.level === level)) {
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
      <Layout>
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

  if (gameState === 'uploading') {
    return (
      <Layout>
        <div className="flex-1 flex flex-col items-center justify-center py-12 w-full max-w-lg mx-auto">
          <Card className="w-full p-8 md:p-12 shadow-2xl flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-6">
              <UploadCloud className="w-8 h-8 text-primary" />
            </div>
            
            <h2 className="text-3xl font-bold uppercase mb-2">Upload Spoof</h2>
            <p className="text-muted-foreground mb-8">
              Attempt {level} of 3. Detector Level {level} Strictness.
            </p>

            <input 
              type="file" 
              accept="image/jpeg, image/png, image/webp" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />

            <Button size="lg" className="w-full h-16 text-xl font-bold mb-4" onClick={() => fileInputRef.current?.click()}>
              SELECT IMAGE
            </Button>
            
            {errorMsg && (
              <p className="text-destructive font-medium mb-4">{errorMsg}</p>
            )}

            <p className="text-xs text-muted-foreground font-mono">
              Max 10MB (JPEG, PNG, WebP).<br/>
              Images are deleted within 24 hours.
            </p>
          </Card>
        </div>
      </Layout>
    );
  }

  if (gameState === 'detecting') {
    return (
      <Layout>
        <div className="flex-1 flex flex-col items-center justify-center py-12 w-full max-w-lg mx-auto">
          <div className="w-full relative aspect-[3/4] rounded-2xl overflow-hidden border border-border bg-card shadow-2xl">
            {imagePreview && (
              <img src={imagePreview} alt="Upload" className="w-full h-full object-cover opacity-50 grayscale" />
            )}
            
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
              <div className="w-20 h-20 rounded-full border-4 border-primary border-t-transparent animate-spin mb-6" />
              <h2 className="text-2xl font-bold font-mono text-primary tracking-widest uppercase">ANALYSING</h2>
              <p className="text-muted-foreground mt-2 font-mono">Extracting feature vectors...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (gameState === 'reveal' && verdict) {
    const isFinished = revealStep > verdict.signals.length;
    
    // Find strongest signal
    let strongestSignal = null;
    if (isFinished && !verdict.fooled && verdict.signals.length > 0) {
      strongestSignal = verdict.signals.reduce((max, sig) => sig.score > max.score ? sig : max, verdict.signals[0]);
    }

    return (
      <Layout>
        <div className="flex-1 flex flex-col items-center justify-center py-6 w-full max-w-4xl mx-auto">
          <div className="w-full grid md:grid-cols-2 gap-8">
            
            {/* Left: Image & Heatmap */}
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-border bg-card shadow-xl">
              {imagePreview && (
                <img src={imagePreview} alt="Upload" className="w-full h-full object-cover" />
              )}
              
              {/* Heatmap overlay when revealed */}
              {isFinished && verdict.heatmapRegions.map((box, i) => (
                <div 
                  key={i}
                  className="absolute bg-destructive border-2 border-destructive animate-in zoom-in"
                  style={{
                    left: `${box.x * 100}%`,
                    top: `${box.y * 100}%`,
                    width: `${box.w * 100}%`,
                    height: `${box.h * 100}%`,
                    opacity: box.intensity * 0.5 + 0.2 // map 0-1 to 0.2-0.7 opacity
                  }}
                />
              ))}

              {isFinished && (
                <div className={cn(
                  "absolute inset-0 flex items-center justify-center bg-black/60 animate-in fade-in duration-500",
                  verdict.fooled ? "bg-success/20" : "bg-destructive/20"
                )}>
                  <div className={cn(
                    "px-8 py-4 rounded-2xl border-4 transform -rotate-12 shadow-2xl",
                    verdict.fooled ? "border-success text-success bg-background" : "border-destructive text-destructive bg-background"
                  )}>
                    <h2 className="text-5xl font-black uppercase tracking-widest">
                      {verdict.fooled ? "FOOLED US" : "DETECTED"}
                    </h2>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Signals Panel */}
            <div className="flex flex-col gap-4">
              <div className="p-4 bg-card rounded-xl border border-border shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">{verdict.detectorName || `Detector Level ${level}`}</h3>
                  <p className="text-sm text-muted-foreground font-mono">Confidence: {(verdict.confidence * 100).toFixed(1)}%</p>
                </div>
                <Activity className="w-8 h-8 text-primary" />
              </div>

              <div className="flex-1 flex flex-col gap-3">
                {verdict.signals.map((sig, i) => {
                  const visible = revealStep > i;
                  const isHit = sig.verdict === 'synthetic';
                  const isPass = sig.verdict === 'authentic';
                  const isInconclusive = sig.verdict === 'inconclusive';
                  
                  return (
                    <div 
                      key={i} 
                      className={cn(
                        "p-4 rounded-xl border transition-all duration-300 flex items-start gap-3",
                        !visible ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0",
                        isHit ? "bg-destructive/10 border-destructive/30" : 
                        isPass ? "bg-success/5 border-success/20" :
                        "bg-muted/10 border-border"
                      )}
                    >
                      <div className="shrink-0 mt-0.5">
                        {isHit ? <AlertTriangle className="w-5 h-5 text-destructive" /> : 
                         isPass ? <CheckCircle2 className="w-5 h-5 text-success" /> :
                         <AlertCircle className="w-5 h-5 text-muted-foreground" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className={cn("font-bold text-sm", 
                            isHit ? "text-destructive" : 
                            isPass ? "text-success" : 
                            "text-muted-foreground")}>
                            {sig.name}
                          </h4>
                          <span className="font-mono text-xs text-muted-foreground">{(sig.score * 100).toFixed(0)}%</span>
                        </div>
                        {isFinished && isHit && SIGNAL_DESCRIPTIONS[sig.name] && (
                          <p className="text-sm text-muted-foreground mt-1 leading-snug">
                            {SIGNAL_DESCRIPTIONS[sig.name]}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {isFinished && strongestSignal && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl mt-4 animate-in fade-in">
                  <p className="text-destructive font-medium">
                    The strongest signal: {SIGNAL_DESCRIPTIONS[strongestSignal.name] || strongestSignal.name}
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </Layout>
    );
  }

  if (gameState === 'decision') {
    return (
      <Layout>
        <div className="flex-1 flex flex-col items-center justify-center py-12 w-full max-w-lg mx-auto">
          <Card className="w-full p-8 md:p-12 shadow-2xl text-center flex flex-col items-center gap-6 border-success">
            <ShieldCheck className="w-20 h-20 text-success mb-2" />
            <h1 className="text-4xl font-black uppercase text-foreground">YOU BEAT LEVEL {level}</h1>
            
            <p className="text-xl text-muted-foreground">
              You have banked <strong className="text-foreground">{winPoints} points</strong>.
            </p>

            <div className="flex flex-col gap-4 w-full mt-6">
              <Button size="lg" className="h-16 text-xl font-bold bg-primary hover:bg-primary/90" onClick={handleContinue}>
                RISK IT: LEVEL {level + 1}
              </Button>
              <Button size="lg" variant="outline" className="h-16 text-xl font-bold" onClick={handleQuit}>
                QUIT & KEEP {winPoints} PTS
              </Button>
            </div>
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

  // gameover
  let finalTier = "Participation";
  let finalDraw = "None";
  if (!finalResult) return null;
  
  if (finalResult.pointsRecorded >= 40) finalTier = "Achiever";
  if (finalResult.pointsRecorded === 60) finalDraw = "AirPods Draw";
  if (finalResult.pointsRecorded === 75) finalDraw = "iPad MEGA Draw";

  return (
    <Layout>
      <div className="flex-1 flex flex-col items-center justify-center py-12 w-full max-w-md mx-auto">
        <Card className="w-full p-8 md:p-12 shadow-2xl text-center flex flex-col items-center gap-6">
          <h1 className="text-4xl font-black uppercase text-foreground">Run Complete</h1>
          
          <div className="w-40 h-40 rounded-full border-8 border-primary flex flex-col items-center justify-center bg-card shadow-[0_0_40px_rgba(71,21,255,0.2)]">
            <span className="text-5xl font-black text-foreground">{finalResult.pointsRecorded}</span>
            <span className="text-muted-foreground font-mono uppercase tracking-wider">Points</span>
          </div>

          <div className="space-y-1">
            <p className="text-lg text-muted-foreground">
              Tier: <strong className="text-foreground">{finalTier}</strong>
            </p>
            {finalDraw !== "None" && (
              <p className="text-lg text-accent font-bold">
                Qualified for {finalDraw}!
              </p>
            )}
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
