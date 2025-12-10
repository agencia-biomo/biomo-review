'use client';

import { create } from 'zustand';
import { Toast, ToastOptions, ToastType, TOAST_DURATIONS, generateToastId } from '@/lib/toast';

// Maximum number of toasts to show simultaneously
const MAX_TOASTS = 3;

interface ToastStore {
  toasts: Toast[];
  addToast: (options: ToastOptions) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  addToast: (options: ToastOptions) => {
    const id = generateToastId();
    const type = options.type || 'info';
    const duration = options.duration ?? TOAST_DURATIONS[type];

    const newToast: Toast = {
      id,
      type,
      title: options.title,
      description: options.description,
      duration,
      action: options.action,
    };

    set((state) => {
      // Limit to MAX_TOASTS, remove oldest if necessary
      const toasts = [...state.toasts, newToast];
      if (toasts.length > MAX_TOASTS) {
        return { toasts: toasts.slice(-MAX_TOASTS) };
      }
      return { toasts };
    });

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }

    return id;
  },

  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearAll: () => {
    set({ toasts: [] });
  },
}));

// Hook for easy toast creation
export function useToast() {
  const { addToast, removeToast, clearAll } = useToastStore();

  const toast = {
    // Generic toast
    show: (options: ToastOptions) => addToast(options),

    // Success toast
    success: (title: string, description?: string) =>
      addToast({ type: 'success', title, description }),

    // Error toast
    error: (title: string, description?: string) =>
      addToast({ type: 'error', title, description }),

    // Warning toast
    warning: (title: string, description?: string) =>
      addToast({ type: 'warning', title, description }),

    // Info toast
    info: (title: string, description?: string) =>
      addToast({ type: 'info', title, description }),

    // With action
    withAction: (options: ToastOptions & { action: { label: string; onClick: () => void } }) =>
      addToast(options),

    // Promise toast (for async operations)
    promise: async <T>(
      promise: Promise<T>,
      messages: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((err: unknown) => string);
      }
    ): Promise<T> => {
      const loadingId = addToast({ type: 'info', title: messages.loading, duration: 0 });

      try {
        const result = await promise;
        removeToast(loadingId);
        const successMessage = typeof messages.success === 'function'
          ? messages.success(result)
          : messages.success;
        addToast({ type: 'success', title: successMessage });
        return result;
      } catch (error) {
        removeToast(loadingId);
        const errorMessage = typeof messages.error === 'function'
          ? messages.error(error)
          : messages.error;
        addToast({ type: 'error', title: errorMessage });
        throw error;
      }
    },

    // Dismiss specific toast
    dismiss: removeToast,

    // Clear all toasts
    clearAll,
  };

  return toast;
}

// Standalone toast function (can be used outside React components)
export const toast = {
  success: (title: string, description?: string) =>
    useToastStore.getState().addToast({ type: 'success', title, description }),

  error: (title: string, description?: string) =>
    useToastStore.getState().addToast({ type: 'error', title, description }),

  warning: (title: string, description?: string) =>
    useToastStore.getState().addToast({ type: 'warning', title, description }),

  info: (title: string, description?: string) =>
    useToastStore.getState().addToast({ type: 'info', title, description }),

  show: (options: ToastOptions) =>
    useToastStore.getState().addToast(options),

  dismiss: (id: string) =>
    useToastStore.getState().removeToast(id),

  clearAll: () =>
    useToastStore.getState().clearAll(),
};
