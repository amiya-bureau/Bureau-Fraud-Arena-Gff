import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { usePlayerSession } from '@/lib/store';
import { useEffect, useState } from 'react';
import { PlayerGate } from '@/components/player-gate';

import Home from '@/pages/home';
import Join from '@/pages/join';
import SpotTheFraud from '@/pages/spot-the-fraud';
import SpoofTheSystem from '@/pages/spoof-the-system';
import FraudDetective from '@/pages/fraud-detective';
import Leaderboard from '@/pages/leaderboard';
import Admin from '@/pages/admin';

const queryClient = new QueryClient();

const GAME_LABELS: Record<string, string> = {
  '/spot-the-fraud': 'Spot the Fraud',
  '/spoof-the-system': 'Spoof the System',
  '/fraud-detective': 'Fraud Detective',
};

/**
 * Route guard for the three games.
 *
 * Three states:
 * 1. No session → redirect to /join with a return path (registration gate).
 * 2. Session exists, not yet confirmed for this route → show PlayerGate
 *    ("Continue as [name] / New Player").
 * 3. Session confirmed → render the game component.
 *
 * The confirmation is per-navigation: if the player leaves the game and comes
 * back, they see the gate again. This is intentional — it keeps the handoff
 * between booth visitors explicit rather than silent.
 */
function ProtectedRoute({ component: Component, path }: { component: any; path: string }) {
  const { session, clearSession } = usePlayerSession();
  const [, setLocation] = useLocation();
  const [mounted, setMounted] = useState(false);
  // Auto-confirm when the player just registered in this tab session so they
  // go straight to the game without seeing the gate. The flag is cleared once
  // consumed so the gate still appears on the next navigation back.
  const [confirmed, setConfirmed] = useState(() => {
    if (typeof window === 'undefined') return false;
    const fresh = window.sessionStorage.getItem('arena_fresh_session') === 'true';
    if (fresh) window.sessionStorage.removeItem('arena_fresh_session');
    return fresh;
  });

  useEffect(() => { setMounted(true); }, []);

  // No session after mount → go to registration
  useEffect(() => {
    if (mounted && !session) {
      setConfirmed(false);
      setLocation(`/join?return=${encodeURIComponent(path)}`, { replace: true });
    }
  }, [session, setLocation, mounted, path]);

  if (!mounted) return null;
  if (!session) return null;

  // Session exists but not confirmed for this visit → show the gate
  if (!confirmed) {
    return (
      <PlayerGate
        firstName={session.player.firstName}
        company={session.player.company}
        gameName={GAME_LABELS[path] ?? 'the game'}
        onContinue={() => setConfirmed(true)}
        onNewPlayer={() => {
          clearSession();
          setLocation(`/join?return=${encodeURIComponent(path)}`, { replace: true });
        }}
      />
    );
  }

  return <Component />;
}

/**
 * The arena used to be served under /fraud-arena/ and is now the site root.
 * Any QR code, printed card or shared link made before the move still points
 * at the old prefix, and at a live booth a dead link is a lost visitor — so
 * forward the old paths instead of showing "Signal lost".
 */
function LegacyPrefixRedirect() {
  const [location, setLocation] = useLocation();
  useEffect(() => {
    const forwarded = location.replace(/^\/fraud-arena(?=\/|$)/, '') || '/';
    setLocation(forwarded, { replace: true });
  }, [location, setLocation]);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/fraud-arena/:rest*" component={LegacyPrefixRedirect} />
      <Route path="/fraud-arena" component={LegacyPrefixRedirect} />
      <Route path="/join" component={Join} />
      <Route path="/spot-the-fraud">
        {() => <ProtectedRoute component={SpotTheFraud} path="/spot-the-fraud" />}
      </Route>
      <Route path="/spoof-the-system">
        {() => <ProtectedRoute component={SpoofTheSystem} path="/spoof-the-system" />}
      </Route>
      <Route path="/fraud-detective">
        {() => <ProtectedRoute component={FraudDetective} path="/fraud-detective" />}
      </Route>
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
