import { useState, useEffect } from 'react';
import { useGetLeaderboard, LeaderboardScope, GameKey, getGetLeaderboardQueryKey } from '@workspace/api-client-react';
import { Layout } from '@/components/layout';
import { usePlayerSession } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Trophy, Medal, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'combined' | GameKey;

export default function LeaderboardPage() {
  const { session } = usePlayerSession();
  const [scope, setScope] = useState<LeaderboardScope>('today');
  const [activeTab, setActiveTab] = useState<Tab>('combined');

  const leaderboardParams = {
    scope,
    game: activeTab === 'combined' ? undefined : activeTab,
    limit: 10,
    playerId: session?.player.id,
  };

  const { data: leaderboard } = useGetLeaderboard(leaderboardParams, {
    query: {
      refetchInterval: 10000,
      queryKey: getGetLeaderboardQueryKey(leaderboardParams)
    }
  });

  return (
    <Layout>
      <div className="w-full max-w-5xl mx-auto py-8 md:py-12 flex flex-col h-full min-h-[80vh]">
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight flex items-center gap-4">
            <Trophy className="w-10 h-10 text-primary" /> 
            Leaderboard
          </h1>

          <div className="flex p-1 bg-card border border-border rounded-full shadow-sm">
            <button
              onClick={() => setScope('today')}
              className={cn("px-6 py-2 rounded-full font-bold text-sm transition-all", scope === 'today' ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground")}
            >
              TODAY
            </button>
            <button
              onClick={() => setScope('cumulative')}
              className={cn("px-6 py-2 rounded-full font-bold text-sm transition-all", scope === 'cumulative' ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground")}
            >
              CUMULATIVE
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
          <TabButton active={activeTab === 'combined'} onClick={() => setActiveTab('combined')}>Combined Total</TabButton>
          <TabButton active={activeTab === 'spot_the_fraud'} onClick={() => setActiveTab('spot_the_fraud')}>Spot The Fraud</TabButton>
          <TabButton active={activeTab === 'spoof_the_system'} onClick={() => setActiveTab('spoof_the_system')}>Spoof The System</TabButton>
          <TabButton active={activeTab === 'fraud_detective'} onClick={() => setActiveTab('fraud_detective')}>Fraud Detective</TabButton>
        </div>

        <Card className="flex-1 bg-card/50 backdrop-blur-sm border-border p-2 md:p-6 overflow-hidden rounded-3xl shadow-xl flex flex-col gap-2">
          
          <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-mono font-bold text-muted-foreground uppercase border-b border-border/50">
            <div className="col-span-1 text-center">Rank</div>
            <div className="col-span-5 md:col-span-4">Player</div>
            <div className="hidden md:block col-span-5">Scores</div>
            <div className="col-span-6 md:col-span-2 text-right">Total</div>
          </div>

          <div className="flex flex-col gap-2 overflow-y-auto">
            {leaderboard?.rows.map(row => (
              <LeaderboardRow key={row.playerId} row={row} isCurrentUser={row.playerId === session?.player.id} />
            ))}
            
            {leaderboard?.rows.length === 0 && (
              <div className="py-20 text-center text-muted-foreground font-mono">
                No scores recorded yet. Be the first!
              </div>
            )}
            
            {leaderboard?.pinned && !leaderboard.rows.find(r => r.playerId === leaderboard.pinned?.playerId) && (
              <>
                <div className="py-2 flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-border" />
                  <div className="w-1 h-1 rounded-full bg-border mx-2" />
                  <div className="w-1 h-1 rounded-full bg-border" />
                </div>
                <LeaderboardRow row={leaderboard.pinned} isCurrentUser={true} />
              </>
            )}
          </div>
        </Card>

      </div>
    </Layout>
  );
}

function TabButton({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-5 py-3 rounded-xl font-bold whitespace-nowrap transition-all active:scale-95 border",
        active ? "bg-card text-primary border-primary shadow-sm" : "bg-transparent border-transparent text-muted-foreground hover:bg-card/50"
      )}
    >
      {children}
    </button>
  );
}

function LeaderboardRow({ row, isCurrentUser }: { row: any, isCurrentUser: boolean }) {
  const isTop3 = row.rank <= 3;
  
  return (
    <div className={cn(
      "grid grid-cols-12 gap-4 px-4 py-4 md:px-6 rounded-2xl items-center transition-all",
      isCurrentUser ? "bg-primary/10 border border-primary/30" : "bg-background border border-border/50 hover:border-border",
      isTop3 && !isCurrentUser && "bg-card border-border shadow-sm"
    )}>
      
      <div className="col-span-1 flex justify-center">
        {row.rank === 1 ? <Trophy className="w-6 h-6 text-warning" /> :
         row.rank === 2 ? <Medal className="w-6 h-6 text-zinc-400" /> :
         row.rank === 3 ? <Medal className="w-6 h-6 text-amber-700" /> :
         <span className="font-mono font-bold text-muted-foreground">{row.rank}</span>}
      </div>

      <div className="col-span-5 md:col-span-4 flex flex-col justify-center overflow-hidden">
        <div className="font-bold text-lg truncate flex items-center gap-2">
          {row.displayName}
          {isCurrentUser && <span className="text-[10px] uppercase tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded-full">You</span>}
        </div>
        <div className="text-xs text-muted-foreground font-mono truncate">{row.company}</div>
      </div>

      <div className="hidden md:flex col-span-5 gap-2 items-center">
        {row.spotTheFraud !== undefined && (
          <Badge label="STF" score={row.spotTheFraud} max={100} />
        )}
        {row.spoofTheSystem !== undefined && (
          <Badge label="SPOOF" score={row.spoofTheSystem} max={75} />
        )}
        {row.fraudDetective !== undefined && (
          <Badge label="DETECT" score={row.fraudDetective} max={100} />
        )}
        {row.bonus > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 bg-accent/10 border border-accent/20 rounded-md text-accent text-[10px] font-bold uppercase shrink-0">
            <Star className="w-3 h-3" /> +{row.bonus}
          </div>
        )}
      </div>

      <div className="col-span-6 md:col-span-2 text-right flex flex-col justify-center items-end">
        <div className={cn("text-2xl font-black font-mono leading-none", isTop3 ? "text-primary" : "")}>
          {row.total}
        </div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Points</div>
      </div>
      
    </div>
  );
}

function Badge({ label, score, max }: { label: string, score: number, max: number }) {
  if (score === 0) return null;
  return (
    <div className="flex flex-col bg-background border border-border px-2 py-1 rounded-md min-w-[50px] shrink-0">
      <span className="text-[9px] text-muted-foreground font-bold">{label}</span>
      <span className="font-mono text-sm leading-none mt-0.5">{score}</span>
    </div>
  );
}
