import { useEffect, useRef } from 'react';

/**
 * Calls `refresh` when the page becomes visible again after being hidden for longer than `staleAfterMs`.
 * A home-screen web app is suspended in the background, so the hourly `setInterval` refresh never fires
 * there and there is no browser reload button — without this the app would show stale numbers on return.
 */
export function useRefreshOnResume(refresh: () => void, staleAfterMs = 10 * 60 * 1000) {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh; // always call the latest closure (e.g. current selectedYear)

  useEffect(() => {
    let hiddenAt: number | null = document.hidden ? Date.now() : null;

    const onVisibilityChange = () => {
      if (document.hidden) {
        hiddenAt = Date.now();
        return;
      }
      if (hiddenAt !== null && Date.now() - hiddenAt > staleAfterMs) {
        refreshRef.current();
      }
      hiddenAt = null;
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [staleAfterMs]);
}
