'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  GripVertical,
  MessageSquare,
  Clock,
  AlertCircle,
  Image as ImageIcon,
  MoreVertical,
  Eye,
  Trash2,
  Edit,
  CheckCircle2
} from 'lucide-react';
import {
  Feedback,
  FeedbackPriority,
  PRIORITY_COLORS,
  PRIORITY_LABELS
} from '@/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface KanbanCardProps {
  feedback: Feedback;
  isDragging?: boolean;
  onView?: (feedback: Feedback) => void;
  onEdit?: (feedback: Feedback) => void;
  onDelete?: (feedback: Feedback) => void;
  onStatusChange?: (feedback: Feedback, newStatus: Feedback['status']) => void;
}

const priorityBorderColors: Record<FeedbackPriority, string> = {
  low: 'border-l-gray-400',
  medium: 'border-l-yellow-400',
  high: 'border-l-orange-500',
  urgent: 'border-l-red-600',
};

export const KanbanCard = memo(function KanbanCard({
  feedback,
  isDragging = false,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
}: KanbanCardProps) {
  const prefersReducedMotion = useReducedMotion();

  const hasScreenshot = !!feedback.screenshot;
  const hasDeadline = !!feedback.deadline;
  const isOverdue = hasDeadline && new Date(feedback.deadline!) < new Date();
  const isUrgent = feedback.priority === 'urgent' || feedback.priority === 'high';

  const variants = {
    idle: { scale: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' },
    hover: prefersReducedMotion
      ? { scale: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }
      : { scale: 1.02, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' },
    dragging: prefersReducedMotion
      ? { scale: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }
      : { scale: 1.05, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', rotate: 2 },
  };

  return (
    <motion.div
      layout={!prefersReducedMotion}
      variants={variants}
      initial="idle"
      whileHover={!isDragging ? "hover" : undefined}
      animate={isDragging ? "dragging" : "idle"}
      className={cn(
        'bg-[#0A0A0A] rounded-lg border border-white/10 overflow-hidden',
        'cursor-grab active:cursor-grabbing',
        'border-l-4',
        priorityBorderColors[feedback.priority],
        isDragging && 'opacity-90 z-50'
      )}
    >
      {/* Header with grip and actions */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-white/30" />
          <span className="text-xs font-mono text-white/50">#{feedback.number}</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-1 rounded hover:bg-white/10 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-4 h-4 text-white/50" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#1A1A1A] border-white/10">
            <DropdownMenuItem
              onClick={() => onView?.(feedback)}
              className="text-white/80 hover:text-white focus:text-white"
            >
              <Eye className="w-4 h-4 mr-2" />
              Ver detalhes
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onEdit?.(feedback)}
              className="text-white/80 hover:text-white focus:text-white"
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              onClick={() => onStatusChange?.(feedback, 'completed')}
              className="text-green-400 hover:text-green-300 focus:text-green-300"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Marcar concluido
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              onClick={() => onDelete?.(feedback)}
              className="text-red-400 hover:text-red-300 focus:text-red-300"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      <div
        className="p-3 space-y-2"
        onClick={() => onView?.(feedback)}
      >
        {/* Title */}
        <h4 className="text-sm font-medium text-white line-clamp-2">
          {feedback.title}
        </h4>

        {/* Description preview */}
        {feedback.description && (
          <p className="text-xs text-white/50 line-clamp-2">
            {feedback.description}
          </p>
        )}

        {/* Meta info */}
        <div className="flex items-center gap-3 pt-1">
          {/* Priority badge */}
          <span
            className={cn(
              'px-1.5 py-0.5 rounded text-[10px] font-medium uppercase',
              PRIORITY_COLORS[feedback.priority],
              'text-white'
            )}
          >
            {PRIORITY_LABELS[feedback.priority]}
          </span>

          {/* Has screenshot indicator */}
          {hasScreenshot && (
            <ImageIcon className="w-3.5 h-3.5 text-white/40" />
          )}

          {/* Deadline */}
          {hasDeadline && (
            <div
              className={cn(
                'flex items-center gap-1 text-[10px]',
                isOverdue ? 'text-red-400' : 'text-white/40'
              )}
            >
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(feedback.deadline!), {
                addSuffix: true,
                locale: ptBR
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer - timestamp */}
      <div className="px-3 py-2 border-t border-white/5 flex items-center justify-between">
        <span className="text-[10px] text-white/30">
          {formatDistanceToNow(new Date(feedback.createdAt), {
            addSuffix: true,
            locale: ptBR
          })}
        </span>

        {isUrgent && (
          <AlertCircle className="w-3.5 h-3.5 text-red-400 animate-pulse" />
        )}
      </div>
    </motion.div>
  );
});
