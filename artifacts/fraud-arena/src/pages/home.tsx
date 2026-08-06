import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { useGetLeaderboard } from '@workspace/api-client-react';
import { QrPanel } from '@/components/qr-panel';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Fingerprint, Network, ScanFace, ChevronRight } from 'lucide-react';
import { Layout } from '@/components/layout';

const STATS = [
  "Rings vary identity data because it's cheap, and reuse devices because they aren't.",
  "Roughly 60% of identified mule accounts are more than a year old.",
  "Passing every KYC check is not evidence of legitimacy — rings are designed to pass them.",
  "A bust-out looks like your best cohort right up until the week it doesn't."
];

export default function Home() {
  const [, setLocation] = useLocation();
  const [statIndex, setStatIndex] = useState(0);
  
  const { data: leaderboardData } = useGetLeaderboard({ limit: 5 });

  useEffect(() => {
    const timer = setInterval(() => {
      setStatIndex(i => (i + 1) % STATS.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Layout showHeader={false}>
      <div className="w-full h-full flex flex-col md:flex-row gap-8 items-stretch pt-12 md:pt-20">
        
        {/* Left Column: Hero & Games */}
        <div className="flex-1 flex flex-col gap-12">
          <div>
            <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(71,21,255,0.4)]">
              <ShieldAlert className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-[0.9] text-foreground mb-6">
              BUREAU<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">FRAUD ARENA</span>
            </h1>
            
            <div className="h-24 flex items-center">
              <p className="text-xl md:text-2xl text-muted-foreground font-mono animate-fade-in" key={statIndex}>
                "{STATS[statIndex]}"
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-auto">
            <GameCard 
              title="SPOT THE FRAUD"
              desc="10-level ladder on rings and mules."
              icon={Network}
              onClick={() => setLocation('/spot-the-fraud')}
            />
            <GameCard 
              title="SPOOF THE SYSTEM"
              desc="Can you beat a liveness detector?"
              icon={ScanFace}
              onClick={() => setLocation('/spoof-the-system')}
            />
            <GameCard 
              title="FRAUD DETECTIVE"
              desc="Follow the money through graph cases."
              icon={Fingerprint}
              onClick={() => setLocation('/fraud-detective')}
            />
            <GameCard 
              title="LEADERBOARD"
              desc="See who's winning."
              icon={null}
              onClick={() => setLocation('/leaderboard')}
              secondary
            />
          </div>
        </div>

        {/* Right Column: Leaderboard Top 5 & QR */}
        <div className="w-full md:w-[400px] flex flex-col gap-6">
          <div className="bg-card border border-border rounded-3xl p-6 flex flex-col flex-1 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary" />
            <h2 className="text-2xl font-bold tracking-tight mb-6">TOP 5 TODAY</h2>
            
            <div className="flex flex-col gap-3 flex-1">
              {leaderboardData?.rows.map((row, i) => (
                <div key={row.playerId} className="flex items-center gap-4 bg-background/50 p-3 rounded-xl border border-border">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="font-bold text-primary">{row.rank}</span>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="font-bold truncate">{row.displayName}</div>
                    <div className="text-xs text-muted-foreground font-mono truncate">{row.company}</div>
                  </div>
                  <div className="font-mono text-xl font-bold text-accent">
                    {row.total}
                  </div>
                </div>
              ))}
              {(!leaderboardData || leaderboardData.rows.length === 0) && (
                <div className="flex-1 flex items-center justify-center text-muted-foreground font-mono text-sm opacity-50">
                  Awaiting challengers...
                </div>
              )}
            </div>
          </div>

          <QrPanel game="" size={160} className="bg-primary border-none text-primary-foreground shadow-xl shadow-primary/20" />
        </div>

      </div>
    </Layout>
  );
}

function GameCard({ title, desc, icon: Icon, onClick, secondary }: any) {
  return (
    <button 
      onClick={onClick}
      className={`text-left flex flex-col p-6 rounded-2xl border transition-transform hover:scale-[1.02] active:scale-[0.98] ${
        secondary 
          ? 'bg-secondary border-secondary-border hover:border-primary/50' 
          : 'bg-card border-card-border hover:border-primary'
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        {Icon ? <Icon className="w-8 h-8 text-primary" /> : <div className="w-8 h-8" />}
        <ChevronRight className={`w-6 h-6 ${secondary ? 'text-muted-foreground' : 'text-primary'}`} />
      </div>
      <h3 className="text-xl font-bold tracking-tight mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground font-mono">{desc}</p>
    </button>
  );
}