'use client';

import { useState, useEffect, useCallback } from 'react';

interface UsePWAResult {
  isOnline: boolean;
  isInstallable: boolean;
  isInstalled: boolean;
  isUpdateAvailable: boolean;
  registration: ServiceWorkerRegistration | null;
  install: () => Promise<boolean>;
  update: () => Promise<void>;
  skipWaiting: () => void;
  clearCache: () => Promise<void>;
}

// Store the install prompt globally
let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Hook for PWA functionality
 */
export function usePWA(): UsePWAResult {
  const [isOnline, setIsOnline] = useState(true);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Check online status
  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check if installed as PWA
  useEffect(() => {
    // Check if running in standalone mode (installed PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-expect-error - Safari specific
      window.navigator.standalone === true;

    setIsInstalled(isStandalone);

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsInstalled(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Listen for install prompt
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredInstallPrompt = e as BeforeInstallPromptEvent;
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // Register service worker and check for updates
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Register service worker
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        setRegistration(reg);

        // Check for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content available
                setIsUpdateAvailable(true);
              }
            });
          }
        });

        // Check for waiting worker (already updated)
        if (reg.waiting) {
          setIsUpdateAvailable(true);
        }
      });

      // Handle controller change (after update)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  // Install app
  const install = useCallback(async (): Promise<boolean> => {
    if (!deferredInstallPrompt) {
      console.log('[PWA] No install prompt available');
      return false;
    }

    try {
      await deferredInstallPrompt.prompt();
      const choiceResult = await deferredInstallPrompt.userChoice;

      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User accepted install');
        setIsInstallable(false);
        deferredInstallPrompt = null;
        return true;
      } else {
        console.log('[PWA] User dismissed install');
        return false;
      }
    } catch (error) {
      console.error('[PWA] Install error:', error);
      return false;
    }
  }, []);

  // Check for updates
  const update = useCallback(async () => {
    if (registration) {
      try {
        await registration.update();
      } catch (error) {
        console.error('[PWA] Update check failed:', error);
      }
    }
  }, [registration]);

  // Skip waiting and activate new service worker
  const skipWaiting = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }, [registration]);

  // Clear all caches
  const clearCache = useCallback(async () => {
    if (registration?.active) {
      registration.active.postMessage({ type: 'CLEAR_CACHE' });
    }

    // Also clear caches directly
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(
        names.filter((name) => name.startsWith('biomo-')).map((name) => caches.delete(name))
      );
    }
  }, [registration]);

  return {
    isOnline,
    isInstallable,
    isInstalled,
    isUpdateAvailable,
    registration,
    install,
    update,
    skipWaiting,
    clearCache,
  };
}

/**
 * Hook for just online/offline status
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
