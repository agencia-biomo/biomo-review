'use client';

import { useEffect, useRef, useCallback } from 'react';

const FOCUSABLE_ELEMENTS = [
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ');

interface UseFocusTrapOptions {
  /** Whether the focus trap is active */
  enabled?: boolean;
  /** Whether to focus the first element when enabled */
  autoFocus?: boolean;
  /** Whether to return focus to the trigger element when disabled */
  returnFocus?: boolean;
  /** Element to focus initially (overrides autoFocus) */
  initialFocusRef?: React.RefObject<HTMLElement>;
  /** Element to return focus to (overrides default trigger detection) */
  finalFocusRef?: React.RefObject<HTMLElement>;
}

/**
 * Hook to trap focus within a container element.
 * Essential for modal dialogs to meet WCAG 2.1 requirements.
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>({
  enabled = true,
  autoFocus = true,
  returnFocus = true,
  initialFocusRef,
  finalFocusRef,
}: UseFocusTrapOptions = {}) {
  const containerRef = useRef<T>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Get all focusable elements within container
  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS)
    ).filter((el) => {
      // Filter out hidden elements
      return el.offsetParent !== null;
    });
  }, []);

  // Focus first element
  const focusFirst = useCallback(() => {
    const elements = getFocusableElements();
    if (elements.length > 0) {
      elements[0].focus();
    }
  }, [getFocusableElements]);

  // Focus last element
  const focusLast = useCallback(() => {
    const elements = getFocusableElements();
    if (elements.length > 0) {
      elements[elements.length - 1].focus();
    }
  }, [getFocusableElements]);

  // Handle keydown events for tab trapping
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Shift + Tab
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      }
      // Tab
      else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, getFocusableElements]);

  // Store trigger element and handle initial focus
  useEffect(() => {
    if (!enabled) return;

    // Store the currently focused element as trigger
    triggerRef.current = document.activeElement as HTMLElement;

    // Focus initial element
    if (initialFocusRef?.current) {
      initialFocusRef.current.focus();
    } else if (autoFocus) {
      // Small delay to ensure DOM is ready
      requestAnimationFrame(() => {
        focusFirst();
      });
    }
  }, [enabled, autoFocus, initialFocusRef, focusFirst]);

  // Return focus when disabled
  useEffect(() => {
    if (enabled) return;

    if (returnFocus) {
      const elementToFocus = finalFocusRef?.current || triggerRef.current;
      if (elementToFocus) {
        elementToFocus.focus();
      }
    }
  }, [enabled, returnFocus, finalFocusRef]);

  return {
    containerRef,
    focusFirst,
    focusLast,
    getFocusableElements,
  };
}

/**
 * Simple version that just returns the ref.
 * For cases where you only need the focus trap without extra utilities.
 */
export function useSimpleFocusTrap(enabled: boolean = true) {
  const { containerRef } = useFocusTrap({ enabled });
  return containerRef;
}
