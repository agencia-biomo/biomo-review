'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Toast as ToastType, TOAST_COLORS } from '@/lib/toast';
import { useToastStore } from '@/hooks/useToast';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

interface ToastProps {
  toast: ToastType;
  onDismiss: () => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const [progress, setProgress] = useState(100);
  const colors = TOAST_COLORS[toast.type];
  const Icon = icons[toast.type];
  const prefersReducedMotion = useReducedMotion();

  // Progress bar animation
  useEffect(() => {
    if (!toast.duration || toast.duration <= 0) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / toast.duration!) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [toast.duration]);

  return (
    <motion.div
      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 50, scale: 0.9 }}
      animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 100, scale: 0.9 }}
      transition={prefersReducedMotion
        ? { duration: 0.01 }
        : { type: 'spring' as const, stiffness: 400, damping: 30 }
      }
      className={`
        relative overflow-hidden
        w-full max-w-sm
        rounded-lg border
        backdrop-blur-xl
        shadow-2xl shadow-black/20
        ${colors.bg} ${colors.border}
      `}
    >
      {/* Glow effect */}
      <div className={`absolute inset-0 opacity-20 blur-xl ${colors.bg}`} />

      {/* Content */}
      <div className="relative p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`flex-shrink-0 ${colors.icon}`}>
            <Icon className="h-5 w-5" />
          </div>

          {/* Text content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">
              {toast.title}
            </p>
            {toast.description && (
              <p className="mt-1 text-sm text-white/70">
                {toast.description}
              </p>
            )}
            {toast.action && (
              <button
                onClick={() => {
                  toast.action?.onClick();
                  onDismiss();
                }}
                className={`
                  mt-2 text-sm font-medium
                  ${colors.text} hover:underline
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent
                  transition-colors
                `}
              >
                {toast.action.label}
              </button>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={onDismiss}
            className="
              flex-shrink-0 p-1 rounded-md
              text-white/50 hover:text-white
              hover:bg-white/10
              focus:outline-none focus:ring-2 focus:ring-white/30
              transition-colors
            "
            aria-label="Fechar notificação"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {toast.duration && toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.05 }}
            className={`h-full ${colors.icon.replace('text-', 'bg-')} opacity-50`}
          />
        </div>
      )}
    </motion.div>
  );
}
