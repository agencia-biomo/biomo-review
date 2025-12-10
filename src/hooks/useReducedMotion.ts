'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect if the user prefers reduced motion
 * Returns true if the user has enabled "reduce motion" in their OS settings
 *
 * Used for:
 * - Disabling parallax effects
 * - Replacing complex animations with simpler ones
 * - Disabling 3D transforms and perspective effects
 * - Reducing auto-playing animations
 *
 * WCAG 2.1 Success Criterion 2.3.3 (AAA)
 */
export function useReducedMotion(): boolean {
  // Default to false during SSR
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if window.matchMedia is available (not in SSR)
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Legacy browsers (Safari < 14)
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return prefersReducedMotion;
}

/**
 * Returns CSS class to disable motion when user preference is enabled
 */
export function useReducedMotionClass(): string {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? 'reduce-motion' : '';
}

/**
 * Utility to get animation properties based on reduced motion preference
 */
export function useMotionConfig() {
  const prefersReducedMotion = useReducedMotion();

  return {
    prefersReducedMotion,
    // Animation duration to use
    duration: prefersReducedMotion ? 0 : undefined,
    // Whether to use spring animations
    useSpring: !prefersReducedMotion,
    // Transition config for framer-motion
    transition: prefersReducedMotion
      ? { duration: 0 }
      : undefined,
    // Helper to conditionally return animations
    animate: <T>(normalValue: T, reducedValue?: T): T =>
      prefersReducedMotion ? (reducedValue ?? normalValue) : normalValue,
  };
}
