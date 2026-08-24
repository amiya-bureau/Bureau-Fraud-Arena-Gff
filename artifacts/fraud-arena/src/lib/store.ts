import { useCallback, useSyncExternalStore } from 'react';
import { PlayerSession } from '@workspace/api-client-react';

const PLAYER_STORAGE_KEY = 'bureau-player-session';

/**
 * The player session, held in one place.
 *
 * This was per-component `useState` hydrated from localStorage on mount, which
 * meant every component calling the hook kept its own copy of the session:
 * registering updated the form's copy but not the gate rendering it, and
 * ending a session left stale copies mounted elsewhere on the screen. There is
 * only ever one session on a device, so there is only one copy of it here and
 * every subscriber is told when it changes.
 *
 * Reading at module load rather than in an effect also means the very first
 * render already knows whether the player is registered, so guarded routes do
 * not flash through a logged-out state on the way in.
 */
let session: PlayerSession | null = readStoredSession();
const listeners = new Set<() => void>();

function readStoredSession(): PlayerSession | null {
  if (typeof window === 'undefined') return null;

  const stored = window.localStorage.getItem(PLAYER_STORAGE_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as PlayerSession;
  } catch {
    window.localStorage.removeItem(PLAYER_STORAGE_KEY);
    return null;
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): PlayerSession | null {
  return session;
}

function setSession(next: PlayerSession | null): void {
  session = next;
  listeners.forEach((listener) => listener());
}

/*
 * A second tab is the other way the session can change. Without this, ending a
 * session in one tab leaves the others still playing as the previous visitor —
 * which at a shared booth phone is the wrong person's name on the leaderboard.
 * A null key means localStorage was cleared wholesale.
 */
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== null && event.key !== PLAYER_STORAGE_KEY) return;
    setSession(readStoredSession());
  });
}

export function usePlayerSession() {
  const current = useSyncExternalStore(subscribe, getSnapshot, () => null);

  const saveSession = useCallback((next: PlayerSession) => {
    window.localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(next));
    // Mark this as a freshly-created session so ProtectedRoute can skip the
    // "Continue as / New Player" gate for the first navigation after register.
    // sessionStorage clears when the tab closes, so the next booth visitor
    // still sees the gate when they open the arena fresh.
    window.sessionStorage.setItem('arena_fresh_session', 'true');
    setSession(next);
  }, []);

  const clearSession = useCallback(() => {
    window.localStorage.removeItem(PLAYER_STORAGE_KEY);
    setSession(null);
  }, []);

  return { session: current, saveSession, clearSession };
}
