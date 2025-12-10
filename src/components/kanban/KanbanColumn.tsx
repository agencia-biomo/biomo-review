'use client';

import { memo, useState, DragEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { Feedback, FeedbackStatus, STATUS_LABELS, STATUS_COLORS } from '@/types';
import { KanbanCard } from './KanbanCard';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface KanbanColumnProps {
  status: FeedbackStatus;
  feedbacks: Feedback[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onCardView?: (feedback: Feedback) => void;
  onCardEdit?: (feedback: Feedback) => void;
  onCardDelete?: (feedback: Feedback) => void;
  onStatusChange?: (feedback: Feedback, newStatus: FeedbackStatus) => void;
  onDrop?: (feedbackId: string, newStatus: FeedbackStatus) => void;
  onAddNew?: () => void;
  draggedFeedbackId?: string | null;
}

const columnHeaderColors: Record<FeedbackStatus, string> = {
  new: 'from-red-500/20 to-red-500/5',
  in_review: 'from-yellow-500/20 to-yellow-500/5',
  in_progress: 'from-blue-500/20 to-blue-500/5',
  waiting_client: 'from-purple-500/20 to-purple-500/5',
  rejected: 'from-gray-500/20 to-gray-500/5',
  completed: 'from-green-500/20 to-green-500/5',
};

const columnAccentColors: Record<FeedbackStatus, string> = {
  new: 'bg-red-500',
  in_review: 'bg-yellow-500',
  in_progress: 'bg-blue-500',
  waiting_client: 'bg-purple-500',
  rejected: 'bg-gray-500',
  completed: 'bg-green-500',
};

export const KanbanColumn = memo(function KanbanColumn({
  status,
  feedbacks,
  isCollapsed = false,
  onToggleCollapse,
  onCardView,
  onCardEdit,
  onCardDelete,
  onStatusChange,
  onDrop,
  onAddNew,
  draggedFeedbackId,
}: KanbanColumnProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isDragOver, setIsDragOver] = useState(false);
  const [localDraggedId, setLocalDraggedId] = useState<string | null>(null);

  const count = feedbacks.length;

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    // Only trigger if leaving the column entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const feedbackId = e.dataTransfer.getData('text/plain');
    if (feedbackId && onDrop) {
      onDrop(feedbackId, status);
    }
  };

  const handleCardDragStart = (e: DragEvent<HTMLDivElement>, feedback: Feedback) => {
    setLocalDraggedId(feedback.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', feedback.id);
  };

  const handleCardDragEnd = () => {
    setLocalDraggedId(null);
  };

  return (
    <div
      className={cn(
        'flex flex-col min-w-[280px] max-w-[320px] rounded-xl',
        'bg-white/[0.02] border border-white/5',
        'transition-all duration-200',
        isDragOver && 'ring-2 ring-blue-500/50 bg-blue-500/5',
        isCollapsed && 'max-w-[60px] min-w-[60px]'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div
        className={cn(
          'p-3 rounded-t-xl bg-gradient-to-b',
          columnHeaderColors[status],
          'border-b border-white/5'
        )}
      >
        <div
          className={cn(
            'flex items-center gap-2',
            isCollapsed && 'flex-col'
          )}
        >
          {/* Status indicator */}
          <div className={cn('w-2 h-2 rounded-full', columnAccentColors[status])} />

          {/* Title and count */}
          {!isCollapsed && (
            <div className="flex-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-sm text-white">
                  {STATUS_LABELS[status]}
                </h3>
                <span className="px-1.5 py-0.5 bg-white/10 rounded text-xs text-white/60">
                  {count}
                </span>
              </div>

              <div className="flex items-center gap-1">
                {status === 'new' && onAddNew && (
                  <button
                    onClick={onAddNew}
                    className="p-1 rounded hover:bg-white/10 transition-colors"
                    title="Novo feedback"
                  >
                    <Plus className="w-4 h-4 text-white/50" />
                  </button>
                )}

                {onToggleCollapse && (
                  <button
                    onClick={onToggleCollapse}
                    className="p-1 rounded hover:bg-white/10 transition-colors"
                    title={isCollapsed ? "Expandir" : "Recolher"}
                  >
                    {isCollapsed ? (
                      <ChevronDown className="w-4 h-4 text-white/50" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-white/50" />
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Collapsed state */}
          {isCollapsed && (
            <>
              <span className="text-xs font-medium text-white/60 writing-vertical-rl rotate-180">
                {STATUS_LABELS[status]}
              </span>
              <span className="px-1.5 py-0.5 bg-white/10 rounded text-xs text-white/60">
                {count}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Cards container */}
      {!isCollapsed && (
        <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-200px)]">
          <AnimatePresence mode="popLayout">
            {feedbacks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn(
                  'p-4 text-center text-xs text-white/30 rounded-lg border border-dashed border-white/10',
                  isDragOver && 'border-blue-500/50 bg-blue-500/10'
                )}
              >
                {isDragOver ? 'Solte aqui' : 'Nenhum item'}
              </motion.div>
            ) : (
              feedbacks.map((feedback) => (
                <motion.div
                  key={feedback.id}
                  layout={!prefersReducedMotion}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: prefersReducedMotion ? 0.01 : 0.2 }}
                  draggable
                  onDragStart={(e) => handleCardDragStart(e as unknown as DragEvent<HTMLDivElement>, feedback)}
                  onDragEnd={handleCardDragEnd}
                >
                  <KanbanCard
                    feedback={feedback}
                    isDragging={localDraggedId === feedback.id || draggedFeedbackId === feedback.id}
                    onView={onCardView}
                    onEdit={onCardEdit}
                    onDelete={onCardDelete}
                    onStatusChange={onStatusChange}
                  />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
});
