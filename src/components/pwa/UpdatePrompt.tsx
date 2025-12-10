'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';

interface UpdatePromptProps {
  className?: string;
}

export function UpdatePrompt({ className }: UpdatePromptProps) {
  const { isUpdateAvailable, isInstallable, skipWaiting, install } = usePWA();
  const prefersReducedMotion = useReducedMotion();

  const showPrompt = isUpdateAvailable || isInstallable;

  if (!showPrompt) return null;

  const variants = prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: { opacity: 0, y: 100, scale: 0.9 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 100, scale: 0.9 },
      };

  return (
    <AnimatePresence>
      <motion.div
        {...variants}
        transition={{ duration: prefersReducedMotion ? 0.01 : 0.3, type: 'spring' }}
        className={cn(
          'fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50',
          className
        )}
      >
        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
          {/* Update Available */}
          {isUpdateAvailable && (
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                  <RefreshCw className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-sm">Nova versao disponivel!</h3>
                  <p className="text-xs text-white/60 mt-0.5">
                    Atualize para ter acesso as novidades e correções.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  onClick={skipWaiting}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-xs h-9"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Atualizar Agora
                </Button>
              </div>
            </div>
          )}

          {/* Install Prompt */}
          {!isUpdateAvailable && isInstallable && (
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                  <Download className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-sm">Instalar Biomo Review</h3>
                  <p className="text-xs text-white/60 mt-0.5">
                    Adicione o app a sua tela inicial para acesso rapido.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  onClick={install}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white text-xs h-9"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Instalar App
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
