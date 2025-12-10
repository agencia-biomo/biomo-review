'use client';

import { Skeleton } from '@/components/ui/skeleton';

function KanbanColumnSkeleton() {
  return (
    <div className="flex flex-col min-w-[280px] max-w-[320px] rounded-xl bg-white/[0.02] border border-white/5">
      {/* Header */}
      <div className="p-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Skeleton className="w-2 h-2 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-6 rounded" />
        </div>
      </div>

      {/* Cards */}
      <div className="p-2 space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-[#0A0A0A] rounded-lg border border-white/10 p-3 space-y-2"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-8" />
              <Skeleton className="h-4 w-4 rounded" />
            </div>

            {/* Title */}
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />

            {/* Meta */}
            <div className="flex items-center gap-2 pt-1">
              <Skeleton className="h-4 w-12 rounded" />
              <Skeleton className="h-3 w-3" />
              <Skeleton className="h-3 w-16" />
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-white/5">
              <Skeleton className="h-2 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function KanbanPageSkeleton() {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/95 sticky top-0 z-50">
        <div className="px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="w-8 h-8 rounded" />
            <div>
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-16 rounded-lg" />
            <Skeleton className="h-7 w-20 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-32 rounded" />
          <Skeleton className="h-8 w-24 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>

      {/* Kanban columns */}
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 h-full">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <KanbanColumnSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
