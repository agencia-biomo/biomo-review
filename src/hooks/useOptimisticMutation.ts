'use client';

import { useState, useCallback, useRef } from 'react';

interface UseOptimisticMutationOptions<TData, TVariables, TContext> {
  /**
   * The async mutation function to execute
   */
  mutationFn: (variables: TVariables) => Promise<TData>;

  /**
   * Called before the mutation executes. Use to apply optimistic update.
   * Return context data for potential rollback.
   */
  onMutate?: (variables: TVariables) => TContext | Promise<TContext>;

  /**
   * Called if the mutation fails. Use to rollback optimistic update.
   */
  onError?: (error: Error, variables: TVariables, context: TContext | undefined) => void;

  /**
   * Called if the mutation succeeds. Use to confirm or adjust optimistic update.
   */
  onSuccess?: (data: TData, variables: TVariables, context: TContext | undefined) => void;

  /**
   * Called after mutation settles (success or error)
   */
  onSettled?: (
    data: TData | undefined,
    error: Error | null,
    variables: TVariables,
    context: TContext | undefined
  ) => void;
}

interface UseOptimisticMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => void;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  error: Error | null;
  data: TData | undefined;
  reset: () => void;
}

/**
 * Custom hook for optimistic mutations with automatic rollback
 *
 * @example
 * ```tsx
 * const { mutate, isLoading } = useOptimisticMutation({
 *   mutationFn: (newFeedback) => createFeedback(newFeedback),
 *   onMutate: (newFeedback) => {
 *     const previousFeedbacks = feedbacks;
 *     setFeedbacks([...feedbacks, { ...newFeedback, id: 'temp-' + Date.now() }]);
 *     return { previousFeedbacks };
 *   },
 *   onError: (error, variables, context) => {
 *     setFeedbacks(context.previousFeedbacks);
 *     toast.error('Erro ao criar feedback');
 *   },
 *   onSuccess: (data, variables, context) => {
 *     // Replace temp ID with real ID
 *     setFeedbacks(feedbacks.map(f =>
 *       f.id.startsWith('temp-') ? { ...f, id: data.id } : f
 *     ));
 *   }
 * });
 * ```
 */
export function useOptimisticMutation<TData = unknown, TVariables = void, TContext = unknown>(
  options: UseOptimisticMutationOptions<TData, TVariables, TContext>
): UseOptimisticMutationResult<TData, TVariables> {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TData | undefined>(undefined);

  // Store context for rollback
  const contextRef = useRef<TContext | undefined>(undefined);

  const reset = useCallback(() => {
    setIsLoading(false);
    setIsError(false);
    setIsSuccess(false);
    setError(null);
    setData(undefined);
    contextRef.current = undefined;
  }, []);

  const mutateAsync = useCallback(
    async (variables: TVariables): Promise<TData> => {
      setIsLoading(true);
      setIsError(false);
      setIsSuccess(false);
      setError(null);

      let context: TContext | undefined;

      try {
        // Step 1: Apply optimistic update
        if (options.onMutate) {
          context = await options.onMutate(variables);
          contextRef.current = context;
        }

        // Step 2: Execute the actual mutation
        const result = await options.mutationFn(variables);
        setData(result);
        setIsSuccess(true);

        // Step 3: Call success callback
        if (options.onSuccess) {
          options.onSuccess(result, variables, context);
        }

        // Step 4: Call settled callback
        if (options.onSettled) {
          options.onSettled(result, null, variables, context);
        }

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setIsError(true);

        // Step 4: Rollback on error
        if (options.onError) {
          options.onError(error, variables, context);
        }

        // Step 5: Call settled callback
        if (options.onSettled) {
          options.onSettled(undefined, error, variables, context);
        }

        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [options]
  );

  const mutate = useCallback(
    (variables: TVariables) => {
      mutateAsync(variables).catch(() => {
        // Error is already handled in mutateAsync
      });
    },
    [mutateAsync]
  );

  return {
    mutate,
    mutateAsync,
    isLoading,
    isError,
    isSuccess,
    error,
    data,
    reset,
  };
}

/**
 * Utility type for optimistic list operations
 */
export interface OptimisticListContext<T> {
  previousItems: T[];
}

/**
 * Helper to create optimistic add operation
 */
export function createOptimisticAdd<T extends { id: string }>(
  items: T[],
  setItems: (items: T[]) => void,
  generateTempId: () => string = () => `temp-${Date.now()}`
) {
  return {
    onMutate: (newItem: Omit<T, 'id'>) => {
      const previousItems = [...items];
      const optimisticItem = { ...newItem, id: generateTempId() } as T;
      setItems([...items, optimisticItem]);
      return { previousItems, tempId: optimisticItem.id };
    },
    onError: (_error: Error, _variables: unknown, context: { previousItems: T[] } | undefined) => {
      if (context) {
        setItems(context.previousItems);
      }
    },
    onSuccess: (result: T, _variables: unknown, context: { tempId: string } | undefined) => {
      if (context) {
        setItems(items.map((item) => (item.id === context.tempId ? result : item)));
      }
    },
  };
}

/**
 * Helper to create optimistic update operation
 */
export function createOptimisticUpdate<T extends { id: string }>(
  items: T[],
  setItems: (items: T[]) => void
) {
  return {
    onMutate: (update: Partial<T> & { id: string }) => {
      const previousItems = [...items];
      setItems(
        items.map((item) => (item.id === update.id ? { ...item, ...update } : item))
      );
      return { previousItems };
    },
    onError: (_error: Error, _variables: unknown, context: { previousItems: T[] } | undefined) => {
      if (context) {
        setItems(context.previousItems);
      }
    },
  };
}

/**
 * Helper to create optimistic delete operation
 */
export function createOptimisticDelete<T extends { id: string }>(
  items: T[],
  setItems: (items: T[]) => void
) {
  return {
    onMutate: (id: string) => {
      const previousItems = [...items];
      setItems(items.filter((item) => item.id !== id));
      return { previousItems };
    },
    onError: (_error: Error, _variables: unknown, context: { previousItems: T[] } | undefined) => {
      if (context) {
        setItems(context.previousItems);
      }
    },
  };
}
