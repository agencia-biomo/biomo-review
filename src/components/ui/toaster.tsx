'use client';

import { AnimatePresence } from 'framer-motion';
import { useToastStore } from '@/hooks/useToast';
import { Toast } from './toast';

export function Toaster() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="
        fixed z-[100]
        bottom-0 right-0
        p-4 sm:p-6
        flex flex-col-reverse gap-3
        pointer-events-none
        w-full sm:w-auto
      "
    >
      <AnimatePresence mode="sync">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto w-full sm:w-auto">
            <Toast
              toast={toast}
              onDismiss={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
