'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Filter, SortAsc, RefreshCw, LayoutGrid, List } from 'lucide-react';
import {
  Feedback,
  FeedbackStatus,
  FeedbackPriority,
  PRIORITY_LABELS,
} from '@/types';
import { KanbanColumn } from './KanbanColumn';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/useToast';

// Column order for display
const COLUMN_ORDER: FeedbackStatus[] = [
  'new',
  'in_review',
  'in_progress',
  'waiting_client',
  'completed',
  'rejected',
];

interface KanbanBoardProps {
  feedbacks: Feedback[];
  onStatusChange: (feedbackId: string, newStatus: FeedbackStatus) => Promise<void>;
  onView?: (feedback: Feedback) => void;
  onEdit?: (feedback: Feedback) => void;
  onDelete?: (feedback: Feedback) => void;
  onAddNew?: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function KanbanBoard({
  feedbacks,
  onStatusChange,
  onView,
  onEdit,
  onDelete,
  onAddNew,
  onRefresh,
  isLoading = false,
}: KanbanBoardProps) {
  // Filter and sort state
  const [priorityFilter, setPriorityFilter] = useState<FeedbackPriority | 'all'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority'>('newest');
  const [collapsedColumns, setCollapsedColumns] = useState<Set<FeedbackStatus>>(new Set(['rejected']));
  const [draggedFeedbackId, setDraggedFeedbackId] = useState<string | null>(null);

  // Filter and sort feedbacks
  const filteredFeedbacks = useMemo(() => {
    let result = [...feedbacks];

    // Apply priority filter
    if (priorityFilter !== 'all') {
      result = result.filter(f => f.priority === priorityFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'priority': {
          const priorityOrder: Record<FeedbackPriority, number> = {
            urgent: 0,
            high: 1,
            medium: 2,
            low: 3,
          };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        default:
          return 0;
      }
    });

    return result;
  }, [feedbacks, priorityFilter, sortBy]);

  // Group feedbacks by status
  const feedbacksByStatus = useMemo(() => {
    const grouped: Record<FeedbackStatus, Feedback[]> = {
      new: [],
      in_review: [],
      in_progress: [],
      waiting_client: [],
      rejected: [],
      completed: [],
    };

    filteredFeedbacks.forEach(feedback => {
      grouped[feedback.status].push(feedback);
    });

    return grouped;
  }, [filteredFeedbacks]);

  // Toggle column collapse
  const toggleColumnCollapse = useCallback((status: FeedbackStatus) => {
    setCollapsedColumns(prev => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  }, []);

  // Handle drag and drop
  const handleDrop = useCallback(async (feedbackId: string, newStatus: FeedbackStatus) => {
    const feedback = feedbacks.find(f => f.id === feedbackId);
    if (!feedback || feedback.status === newStatus) return;

    setDraggedFeedbackId(null);

    try {
      await onStatusChange(feedbackId, newStatus);
      toast.success('Status atualizado', `Feedback movido para ${newStatus}`);
    } catch (error) {
      toast.error('Erro ao atualizar', 'Nao foi possivel mover o feedback');
    }
  }, [feedbacks, onStatusChange]);

  // Handle card status change from menu
  const handleCardStatusChange = useCallback(async (feedback: Feedback, newStatus: FeedbackStatus) => {
    if (feedback.status === newStatus) return;

    try {
      await onStatusChange(feedback.id, newStatus);
      toast.success('Status atualizado', `Feedback marcado como ${newStatus}`);
    } catch (error) {
      toast.error('Erro ao atualizar', 'Nao foi possivel atualizar o status');
    }
  }, [onStatusChange]);

  // Stats
  const stats = useMemo(() => ({
    total: feedbacks.length,
    pending: feedbacks.filter(f => f.status === 'new' || f.status === 'in_review').length,
    inProgress: feedbacks.filter(f => f.status === 'in_progress' || f.status === 'waiting_client').length,
    completed: feedbacks.filter(f => f.status === 'completed').length,
  }), [feedbacks]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          {/* Stats */}
          <div className="flex items-center gap-3 text-sm">
            <span className="text-white/50">Total: <span className="text-white font-medium">{stats.total}</span></span>
            <span className="text-red-400">Pendentes: <span className="font-medium">{stats.pending}</span></span>
            <span className="text-blue-400">Em andamento: <span className="font-medium">{stats.inProgress}</span></span>
            <span className="text-green-400">Concluidos: <span className="font-medium">{stats.completed}</span></span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Priority filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="bg-white/5 border-white/10">
                <Filter className="w-4 h-4 mr-2" />
                {priorityFilter === 'all' ? 'Todas prioridades' : PRIORITY_LABELS[priorityFilter]}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#1A1A1A] border-white/10">
              <DropdownMenuCheckboxItem
                checked={priorityFilter === 'all'}
                onCheckedChange={() => setPriorityFilter('all')}
                className="text-white/80"
              >
                Todas
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator className="bg-white/10" />
              {(Object.keys(PRIORITY_LABELS) as FeedbackPriority[]).map(priority => (
                <DropdownMenuCheckboxItem
                  key={priority}
                  checked={priorityFilter === priority}
                  onCheckedChange={() => setPriorityFilter(priority)}
                  className="text-white/80"
                >
                  {PRIORITY_LABELS[priority]}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="bg-white/5 border-white/10">
                <SortAsc className="w-4 h-4 mr-2" />
                Ordenar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#1A1A1A] border-white/10">
              <DropdownMenuCheckboxItem
                checked={sortBy === 'newest'}
                onCheckedChange={() => setSortBy('newest')}
                className="text-white/80"
              >
                Mais recentes
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortBy === 'oldest'}
                onCheckedChange={() => setSortBy('oldest')}
                className="text-white/80"
              >
                Mais antigos
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortBy === 'priority'}
                onCheckedChange={() => setSortBy('priority')}
                className="text-white/80"
              >
                Prioridade
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Refresh */}
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="bg-white/5 border-white/10"
            >
              <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            </Button>
          )}
        </div>
      </div>

      {/* Kanban columns */}
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 h-full min-h-[600px]">
          {COLUMN_ORDER.map(status => (
            <KanbanColumn
              key={status}
              status={status}
              feedbacks={feedbacksByStatus[status]}
              isCollapsed={collapsedColumns.has(status)}
              onToggleCollapse={() => toggleColumnCollapse(status)}
              onCardView={onView}
              onCardEdit={onEdit}
              onCardDelete={onDelete}
              onStatusChange={handleCardStatusChange}
              onDrop={handleDrop}
              onAddNew={status === 'new' ? onAddNew : undefined}
              draggedFeedbackId={draggedFeedbackId}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
