'use client';

import { useState, useCallback } from 'react';
import { Feedback, FeedbackStatus, FeedbackPriority, ClickPosition } from '@/types';
import { toast } from './useToast';

interface CreateFeedbackData {
  projectId: string;
  title: string;
  description: string;
  priority: FeedbackPriority;
  clickPosition: ClickPosition;
  screenshot: string;
  audioUrl?: string;
  createdBy: string;
}

interface UpdateFeedbackData {
  status?: FeedbackStatus;
  title?: string;
  description?: string;
  priority?: FeedbackPriority;
  assignedTo?: string;
  deadline?: Date;
  changedBy?: string;
}

interface UseFeedbacksOptions {
  projectId: string;
  onFeedbackCreated?: (feedback: Feedback) => void;
  onFeedbackUpdated?: (feedback: Feedback) => void;
  onFeedbackDeleted?: (feedbackId: string) => void;
}

interface UseFeedbacksResult {
  feedbacks: Feedback[];
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: string | null;
  isDeleting: string | null;
  error: Error | null;
  loadFeedbacks: () => Promise<void>;
  createFeedback: (data: CreateFeedbackData) => Promise<Feedback | null>;
  updateFeedback: (id: string, data: UpdateFeedbackData) => Promise<boolean>;
  deleteFeedback: (id: string) => Promise<boolean>;
  setFeedbacks: React.Dispatch<React.SetStateAction<Feedback[]>>;
}

/**
 * Hook for managing feedbacks with optimistic updates
 */
export function useFeedbacks(options: UseFeedbacksOptions): UseFeedbacksResult {
  const { projectId, onFeedbackCreated, onFeedbackUpdated, onFeedbackDeleted } = options;

  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Load all feedbacks from the server
   */
  const loadFeedbacks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/feedbacks?projectId=${projectId}`);
      const data = await response.json();

      if (data.success) {
        setFeedbacks(data.feedbacks || []);
      } else {
        throw new Error(data.error || 'Failed to load feedbacks');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error('Error loading feedbacks:', error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  /**
   * Create a new feedback with optimistic update
   */
  const createFeedback = useCallback(
    async (data: CreateFeedbackData): Promise<Feedback | null> => {
      setIsCreating(true);
      setError(null);

      // Generate optimistic feedback
      const optimisticId = `optimistic-${Date.now()}`;
      const optimisticFeedback: Feedback = {
        id: optimisticId,
        projectId: data.projectId,
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: 'new',
        clickPosition: data.clickPosition,
        screenshot: data.screenshot,
        audioUrl: data.audioUrl,
        attachments: [],
        createdBy: data.createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
        number: feedbacks.length + 1,
      };

      // Apply optimistic update
      const previousFeedbacks = [...feedbacks];
      setFeedbacks((prev) => [optimisticFeedback, ...prev]);

      try {
        const response = await fetch('/api/feedbacks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (result.success && result.feedback) {
          // Replace optimistic feedback with real one
          setFeedbacks((prev) =>
            prev.map((f) => (f.id === optimisticId ? result.feedback : f))
          );
          onFeedbackCreated?.(result.feedback);
          toast.success('Feedback criado!', 'Sua solicitacao foi registrada');
          return result.feedback;
        } else {
          throw new Error(result.error || 'Failed to create feedback');
        }
      } catch (err) {
        // Rollback on error
        setFeedbacks(previousFeedbacks);
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        toast.error('Erro ao criar feedback', error.message);
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [feedbacks, onFeedbackCreated]
  );

  /**
   * Update a feedback with optimistic update
   */
  const updateFeedback = useCallback(
    async (id: string, data: UpdateFeedbackData): Promise<boolean> => {
      setIsUpdating(id);
      setError(null);

      // Find current feedback
      const currentFeedback = feedbacks.find((f) => f.id === id);
      if (!currentFeedback) {
        toast.error('Feedback nao encontrado');
        setIsUpdating(null);
        return false;
      }

      // Apply optimistic update
      const previousFeedbacks = [...feedbacks];
      const optimisticFeedback: Feedback = {
        ...currentFeedback,
        ...data,
        updatedAt: new Date(),
      };
      setFeedbacks((prev) =>
        prev.map((f) => (f.id === id ? optimisticFeedback : f))
      );

      try {
        const response = await fetch(`/api/feedbacks/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (result.success) {
          // Update with server response if available
          if (result.feedback) {
            setFeedbacks((prev) =>
              prev.map((f) => (f.id === id ? result.feedback : f))
            );
            onFeedbackUpdated?.(result.feedback);
          } else {
            onFeedbackUpdated?.(optimisticFeedback);
          }
          return true;
        } else {
          throw new Error(result.error || 'Failed to update feedback');
        }
      } catch (err) {
        // Rollback on error
        setFeedbacks(previousFeedbacks);
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        toast.error('Erro ao atualizar', error.message);
        return false;
      } finally {
        setIsUpdating(null);
      }
    },
    [feedbacks, onFeedbackUpdated]
  );

  /**
   * Delete a feedback with optimistic update
   */
  const deleteFeedback = useCallback(
    async (id: string): Promise<boolean> => {
      setIsDeleting(id);
      setError(null);

      // Apply optimistic delete
      const previousFeedbacks = [...feedbacks];
      setFeedbacks((prev) => prev.filter((f) => f.id !== id));

      try {
        const response = await fetch(`/api/feedbacks/${id}`, {
          method: 'DELETE',
        });

        const result = await response.json();

        if (result.success) {
          onFeedbackDeleted?.(id);
          toast.success('Feedback removido');
          return true;
        } else {
          throw new Error(result.error || 'Failed to delete feedback');
        }
      } catch (err) {
        // Rollback on error
        setFeedbacks(previousFeedbacks);
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        toast.error('Erro ao remover', error.message);
        return false;
      } finally {
        setIsDeleting(null);
      }
    },
    [feedbacks, onFeedbackDeleted]
  );

  return {
    feedbacks,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    loadFeedbacks,
    createFeedback,
    updateFeedback,
    deleteFeedback,
    setFeedbacks,
  };
}
