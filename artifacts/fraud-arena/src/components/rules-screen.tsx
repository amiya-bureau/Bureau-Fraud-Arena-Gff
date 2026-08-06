import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PlayerStanding } from '@workspace/api-client-react';

interface RulesScreenProps {
  gameName: string;
  premise: string;
  scoring: string;
  endsWhen: string;
  lifelines: string;
  standing?: PlayerStanding;
  gameKey: string;
  onStart: () => void;
}

export function RulesScreen({
  gameName,
  premise,
  scoring,
  endsWhen,
  lifelines,
  standing,
  gameKey,
  onStart
}: RulesScreenProps) {
  
  const scoreBadge = standing?.scores.find(s => s.game === gameKey);

  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl mx-auto py-12">
      <Card className="w-full p-8 md:p-12 flex flex-col gap-8 bg-card border-card-border shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary" />
        
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground uppercase">{gameName}</h1>
          <p className="text-xl text-muted-foreground">{premise}</p>
        </div>

        <div className="space-y-6 text-lg">
          <div className="flex items-start gap-4 p-4 rounded-xl bg-background/50 border border-border">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-primary font-bold">1</span>
            </div>
            <div>
              <strong className="block text-foreground mb-1">Scoring</strong>
              <span className="text-muted-foreground">{scoring}</span>
            </div>
          </div>
          
          <div className="flex items-start gap-4 p-4 rounded-xl bg-background/50 border border-border">
            <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-destructive font-bold">2</span>
            </div>
            <div>
              <strong className="block text-foreground mb-1">Game Over</strong>
              <span className="text-muted-foreground">{endsWhen}</span>
            </div>
          </div>

          {lifelines && (
            <div className="flex items-start gap-4 p-4 rounded-xl bg-background/50 border border-border">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-accent font-bold">3</span>
              </div>
              <div>
                <strong className="block text-foreground mb-1">Lifelines & Attempts</strong>
                <span className="text-muted-foreground">{lifelines}</span>
              </div>
            </div>
          )}
        </div>

        {scoreBadge && scoreBadge.played && (
          <div className="text-center p-4 rounded-xl bg-primary/10 border border-primary/20">
            <p className="text-primary-foreground font-mono">
              Your best so far: <strong className="text-xl">{scoreBadge.points} pts</strong>
              {standing?.rank && <>, rank {standing.rank}</>}
            </p>
          </div>
        )}

        <div className="pt-4 flex flex-col gap-4">
          <Button size="lg" className="w-full h-16 text-xl font-bold tracking-wider" onClick={onStart}>
            START GAME
          </Button>
          {/* Example placeholder */}
          <p className="text-center text-sm text-muted-foreground underline decoration-muted-foreground/30 underline-offset-4 cursor-not-allowed opacity-50">
            Show me an example
          </p>
        </div>
      </Card>
    </div>
  );
}
