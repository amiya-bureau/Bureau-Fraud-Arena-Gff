/**
 * Development-only visual answer hints.
 *
 * Production Vite builds replace `import.meta.env.DEV` with false, so a URL
 * query parameter can never expose answer hints to booth visitors.
 */
export function isDevTestMode(): boolean {
  if (!import.meta.env.DEV || typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('testMode') === '1';
}