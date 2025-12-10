'use client';

import { useCallback, useEffect, useRef } from 'react';

type Politeness = 'polite' | 'assertive' | 'off';

interface AnnounceOptions {
  /** Politeness level - 'polite' waits for idle, 'assertive' interrupts */
  politeness?: Politeness;
  /** Clear announcement after delay (ms) */
  clearAfter?: number;
}

/**
 * Hook to announce messages to screen readers using ARIA live regions.
 * Creates hidden live region elements for accessibility announcements.
 */
export function useAnnounce() {
  const politeRef = useRef<HTMLDivElement | null>(null);
  const assertiveRef = useRef<HTMLDivElement | null>(null);

  // Create live region elements on mount
  useEffect(() => {
    // Create polite live region
    if (!document.getElementById('aria-live-polite')) {
      const polite = document.createElement('div');
      polite.id = 'aria-live-polite';
      polite.setAttribute('aria-live', 'polite');
      polite.setAttribute('aria-atomic', 'true');
      polite.className = 'sr-only';
      document.body.appendChild(polite);
      politeRef.current = polite;
    } else {
      politeRef.current = document.getElementById('aria-live-polite') as HTMLDivElement;
    }

    // Create assertive live region
    if (!document.getElementById('aria-live-assertive')) {
      const assertive = document.createElement('div');
      assertive.id = 'aria-live-assertive';
      assertive.setAttribute('aria-live', 'assertive');
      assertive.setAttribute('aria-atomic', 'true');
      assertive.className = 'sr-only';
      document.body.appendChild(assertive);
      assertiveRef.current = assertive;
    } else {
      assertiveRef.current = document.getElementById('aria-live-assertive') as HTMLDivElement;
    }

    // Cleanup on unmount (optional - regions can persist)
    return () => {
      // Don't remove regions as they may be used by other components
    };
  }, []);

  /**
   * Announce a message to screen readers
   * @param message The message to announce
   * @param options Announcement options
   */
  const announce = useCallback(
    (message: string, options: AnnounceOptions = {}) => {
      const { politeness = 'polite', clearAfter = 1000 } = options;

      const region = politeness === 'assertive' ? assertiveRef.current : politeRef.current;

      if (!region) return;

      // Clear first to ensure announcement is made even if same message
      region.textContent = '';

      // Use requestAnimationFrame to ensure the clear is processed
      requestAnimationFrame(() => {
        if (region) {
          region.textContent = message;
        }

        // Clear after delay to allow re-announcement
        if (clearAfter > 0) {
          setTimeout(() => {
            if (region) {
              region.textContent = '';
            }
          }, clearAfter);
        }
      });
    },
    []
  );

  /**
   * Announce politely (waits for user idle)
   */
  const announcePolite = useCallback(
    (message: string, clearAfter?: number) => {
      announce(message, { politeness: 'polite', clearAfter });
    },
    [announce]
  );

  /**
   * Announce assertively (interrupts current speech)
   */
  const announceAssertive = useCallback(
    (message: string, clearAfter?: number) => {
      announce(message, { politeness: 'assertive', clearAfter });
    },
    [announce]
  );

  return {
    announce,
    announcePolite,
    announceAssertive,
  };
}

/**
 * Simpler hook that just returns the announce function
 */
export function useSimpleAnnounce() {
  const { announce } = useAnnounce();
  return announce;
}
