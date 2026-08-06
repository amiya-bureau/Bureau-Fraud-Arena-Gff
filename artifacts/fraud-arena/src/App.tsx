import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { usePlayerSession } from '@/lib/store';
import { useEffect, useState } from 'react';

import Home from '@/pages/home';
import Join from '@/pages/join';
import SpotTheFraud from '@/pages/spot-the-fraud';
import SpoofTheSystem from '@/pages/spoof-the-system';
import FraudDetective from '@/pages/fraud-detective';
import Leaderboard from '@/pages/leaderboard';
import Admin from '@/pages/admin';

const queryClient = new QueryClient();

// Auth guard wrapper for games
function ProtectedRoute({ component: Component, path }: { component: any, path: string }) {
  const { session } = usePlayerSession();
  const [, setLocation] = useLocation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !session) {
      setLocation(`/join?return=${path}`);
    }
  }, [session, setLocation, mounted, path]);

  if (!mounted || !session) return null;
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
