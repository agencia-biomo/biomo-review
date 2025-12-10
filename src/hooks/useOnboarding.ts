'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ONBOARDING_STEPS,
  OnboardingStep,
  isOnboardingCompleted,
  isOnboardingDismissed,
  markOnboardingCompleted,
  dismissOnboarding,
  resetOnboarding,
} from '@/lib/onboarding-steps';

interface UseOnboardingResult {
  isActive: boolean;
  currentStep: OnboardingStep | null;
  currentStepIndex: number;
  totalSteps: number;
  progress: number;
  start: () => void;
  next: () => void;
  prev: () => void;
  skip: () => void;
  complete: () => void;
  reset: () => void;
  goToStep: (index: number) => void;
}

export function useOnboarding(autoStart = false): UseOnboardingResult {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const totalSteps = ONBOARDING_STEPS.length;
  const currentStep = isActive ? ONBOARDING_STEPS[currentStepIndex] : null;
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

  // Auto-start on first visit
  useEffect(() => {
    if (autoStart && !isOnboardingCompleted() && !isOnboardingDismissed()) {
      // Delay start to ensure DOM is ready
      const timer = setTimeout(() => {
        setIsActive(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoStart]);

  const start = useCallback(() => {
    setCurrentStepIndex(0);
    setIsActive(true);
  }, []);

  const next = useCallback(() => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      // Complete tour
      markOnboardingCompleted();
      setIsActive(false);
    }
  }, [currentStepIndex, totalSteps]);

  const prev = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex]);

  const skip = useCallback(() => {
    dismissOnboarding();
    setIsActive(false);
  }, []);

  const complete = useCallback(() => {
    markOnboardingCompleted();
    setIsActive(false);
  }, []);

  const reset = useCallback(() => {
    resetOnboarding();
    setCurrentStepIndex(0);
  }, []);

  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < totalSteps) {
      setCurrentStepIndex(index);
    }
  }, [totalSteps]);

  return {
    isActive,
    currentStep,
    currentStepIndex,
    totalSteps,
    progress,
    start,
    next,
    prev,
    skip,
    complete,
    reset,
    goToStep,
  };
}
