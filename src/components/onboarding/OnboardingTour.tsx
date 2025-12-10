'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';
import { OnboardingStep } from '@/lib/onboarding-steps';

interface OnboardingTourProps {
  autoStart?: boolean;
  onComplete?: () => void;
}

interface SpotlightPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function OnboardingTour({ autoStart = true, onComplete }: OnboardingTourProps) {
  const {
    isActive,
    currentStep,
    currentStepIndex,
    totalSteps,
    progress,
    next,
    prev,
    skip,
    complete,
  } = useOnboarding(autoStart);

  const prefersReducedMotion = useReducedMotion();
  const [spotlightPosition, setSpotlightPosition] = useState<SpotlightPosition | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  // Calculate spotlight and tooltip position
  useEffect(() => {
    if (!currentStep?.target) {
      setSpotlightPosition(null);
      // Center tooltip for steps without target
      setTooltipPosition({
        top: window.innerHeight / 2 - 150,
        left: window.innerWidth / 2 - 200,
      });
      return;
    }

    const element = document.querySelector(currentStep.target);
    if (!element) {
      setSpotlightPosition(null);
      return;
    }

    const rect = element.getBoundingClientRect();
    const padding = 8;

    setSpotlightPosition({
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    });

    // Calculate tooltip position based on step.position
    const tooltipWidth = 400;
    const tooltipHeight = 200;
    const gap = 16;

    let top = 0;
    let left = 0;

    switch (currentStep.position) {
      case 'top':
        top = rect.top - tooltipHeight - gap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - gap;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + gap;
        break;
      default:
        top = window.innerHeight / 2 - tooltipHeight / 2;
        left = window.innerWidth / 2 - tooltipWidth / 2;
    }

    // Keep within viewport
    top = Math.max(16, Math.min(window.innerHeight - tooltipHeight - 16, top));
    left = Math.max(16, Math.min(window.innerWidth - tooltipWidth - 16, left));

    setTooltipPosition({ top, left });
  }, [currentStep]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActive) return;

      if (e.key === 'Escape') {
        skip();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        next();
      } else if (e.key === 'ArrowLeft') {
        prev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, next, prev, skip]);

  // Handle complete callback
  useEffect(() => {
    if (!isActive && currentStepIndex === totalSteps - 1) {
      onComplete?.();
    }
  }, [isActive, currentStepIndex, totalSteps, onComplete]);

  if (!isActive || !currentStep) return null;

  const Icon = currentStep.icon;
  const isLastStep = currentStepIndex === totalSteps - 1;
  const isFirstStep = currentStepIndex === 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200]">
        {/* Overlay with spotlight cutout */}
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          style={{
            clipPath: spotlightPosition
              ? `polygon(
                  0% 0%,
                  0% 100%,
                  ${spotlightPosition.left}px 100%,
                  ${spotlightPosition.left}px ${spotlightPosition.top}px,
                  ${spotlightPosition.left + spotlightPosition.width}px ${spotlightPosition.top}px,
                  ${spotlightPosition.left + spotlightPosition.width}px ${spotlightPosition.top + spotlightPosition.height}px,
                  ${spotlightPosition.left}px ${spotlightPosition.top + spotlightPosition.height}px,
                  ${spotlightPosition.left}px 100%,
                  100% 100%,
                  100% 0%
                )`
              : undefined,
          }}
          onClick={skip}
        />

        {/* Spotlight border */}
        {spotlightPosition && (
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute border-2 border-purple-500 rounded-lg pointer-events-none"
            style={{
              top: spotlightPosition.top,
              left: spotlightPosition.left,
              width: spotlightPosition.width,
              height: spotlightPosition.height,
              boxShadow: '0 0 0 4px rgba(139, 92, 246, 0.3)',
            }}
          />
        )}

        {/* Tooltip */}
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: prefersReducedMotion ? 0.01 : 0.3 }}
          className="absolute w-[400px] max-w-[calc(100vw-32px)]"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
          }}
        >
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">{currentStep.title}</h3>
                  <span className="text-xs text-white/40">
                    Passo {currentStepIndex + 1} de {totalSteps}
                  </span>
                </div>
              </div>
              <button
                onClick={skip}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-white/50" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              <p className="text-sm text-white/70 leading-relaxed">
                {currentStep.description}
              </p>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-white/5">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: prefersReducedMotion ? 0.01 : 0.3 }}
              />
            </div>

            {/* Footer */}
            <div className="p-4 flex items-center justify-between bg-white/[0.02]">
              <button
                onClick={skip}
                className="text-xs text-white/40 hover:text-white transition-colors"
              >
                Pular tour
              </button>

              <div className="flex items-center gap-2">
                {!isFirstStep && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={prev}
                    className="text-white/60 hover:text-white h-8 px-3"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Anterior
                  </Button>
                )}

                <Button
                  size="sm"
                  onClick={isLastStep ? complete : next}
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white h-8 px-4"
                >
                  {isLastStep ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Concluir
                    </>
                  ) : (
                    <>
                      Proximo
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Step dots */}
          <div className="flex items-center justify-center gap-1.5 mt-4">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-1.5 h-1.5 rounded-full transition-all',
                  i === currentStepIndex
                    ? 'w-4 bg-purple-500'
                    : i < currentStepIndex
                      ? 'bg-purple-500/50'
                      : 'bg-white/20'
                )}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
