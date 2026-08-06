import { useState, useEffect } from 'react';
import { PlayerSession } from '@workspace/api-client-react';

const PLAYER_STORAGE_KEY = 'bureau-player-session';

export function usePlayerSession() {
  const [session, setSession] = useState<PlayerSession | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(PLAYER_STORAGE_KEY);
    if (stored) {
      try {
        setSession(JSON.parse(stored));
      } catch (e) {
        localStorage.removeItem(PLAYER_STORAGE_KEY);
      }
    }
  }, []);

  const saveSession = (newSession: PlayerSession) => {
    localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(newSession));
    setSession(newSession);
  };

  const clearSession = () => {
    localStorage.removeItem(PLAYER_STORAGE_KEY);
    setSession(null);
  };

  return { session, saveSession, clearSession };
}
