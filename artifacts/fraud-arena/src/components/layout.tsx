import { usePlayerSession } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { ShieldAlert, LogOut } from 'lucide-react';
import { Link, useLocation } from 'wouter';

export function Layout({ children, showHeader = true }: { children: React.ReactNode, showHeader?: boolean }) {
  const { session, clearSession } = usePlayerSession();
  const [, setLocation] = useLocation();

  // Every screen has a way back to the booth home.
  // Kiosk unattended: we can add an idle timeout to redirect to '/' if we want, or do it per screen.
  
  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center relative overflow-hidden bg-background">
      {showHeader && (
        <header className="w-full max-w-[1080px] p-6 flex justify-between items-center z-10 relative">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <ShieldAlert className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-2xl tracking-tight">BUREAU FRAUD ARENA</span>
          </Link>

          <div className="flex items-center gap-4">
            {session && (
              <div className="flex items-center gap-4 bg-card px-4 py-2 rounded-full border border-border">
                <span className="text-sm font-medium text-foreground">
                  {session.player.firstName}
                </span>
                <span className="text-xs font-mono text-muted-foreground px-2 border-l border-border">
                  {session.player.company}
                </span>
                <button onClick={() => { clearSession(); setLocation('/'); }} className="text-muted-foreground hover:text-foreground">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
            <Link href="/leaderboard">
              <Button variant="secondary" className="font-mono text-sm h-10 px-6 rounded-full">
                LEADERBOARD
              </Button>
            </Link>
          </div>
        </header>
      )}

      <main className="flex-1 w-full max-w-[1080px] flex flex-col relative z-10 pb-6 px-4 md:px-6">
        {children}
      </main>
      
      {/* Subtle Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/5 blur-[120px] pointer-events-none" />
    </div>
  );
}
