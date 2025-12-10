'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/usePWA';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface OfflineIndicatorProps {
  className?: string;
  showOnlineNotification?: boolean;
}

export function OfflineIndicator({
  className,
  showOnlineNotification = true,
}: OfflineIndicatorProps) {
  const isOnline = useOnlineStatus();
  const prefersReducedMotion = useReducedMotion();
  const [showBackOnline, setShowBackOnline] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  // Track when we come back online
  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline && showOnlineNotification) {
      setShowBackOnline(true);
      const timer = setTimeout(() => setShowBackOnline(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline, showOnlineNotification]);

  const variants = prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: { opacity: 0, y: -50 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -50 },
      };

  return (
    <AnimatePresence>
      {/* Offline indicator */}
      {!isOnline && (
        <motion.div
          key="offline"
          {...variants}
          transition={{ duration: prefersReducedMotion ? 0.01 : 0.3 }}
          className={cn(
            'fixed top-0 left-0 right-0 z-[100] px-4 py-2',
            'bg-gradient-to-r from-red-600 to-red-500',
            'flex items-center justify-center gap-2 text-white text-sm',
            'shadow-lg shadow-red-500/30',
            className
          )}
        >
          <WifiOff className="w-4 h-4" />
          <span className="font-medium">Voce esta offline</span>
          <span className="text-white/80 hidden sm:inline">
            - Algumas funcionalidades podem estar indisponiveis
          </span>
        </motion.div>
      )}

      {/* Back online notification */}
      {showBackOnline && isOnline && (
        <motion.div
          key="online"
          {...variants}
          transition={{ duration: prefersReducedMotion ? 0.01 : 0.3 }}
          className={cn(
            'fixed top-0 left-0 right-0 z-[100] px-4 py-2',
            'bg-gradient-to-r from-green-600 to-emerald-500',
            'flex items-center justify-center gap-2 text-white text-sm',
            'shadow-lg shadow-green-500/30',
            className
          )}
        >
          <Wifi className="w-4 h-4" />
          <span className="font-medium">Conexao restaurada!</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Minimal offline dot indicator
 */
export function OfflineDot({ className }: { className?: string }) {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      className={cn(
        'w-2 h-2 rounded-full bg-red-500 animate-pulse',
        'shadow-lg shadow-red-500/50',
        className
      )}
      title="Voce esta offline"
    />
  );
}
