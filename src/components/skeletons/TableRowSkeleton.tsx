'use client';

import { Skeleton } from '@/components/ui/skeleton';

interface TableRowSkeletonProps {
  columns?: number;
  showAvatar?: boolean;
}

export function TableRowSkeleton({ columns = 4, showAvatar = true }: TableRowSkeletonProps) {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-white/5 animate-pulse">
      {showAvatar && (
        <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
      )}
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} className={`flex-1 ${i === 0 ? 'min-w-[150px]' : ''}`}>
          <Skeleton
            className={`h-4 rounded ${
              i === 0 ? 'w-full' : i === columns - 1 ? 'w-1/2' : 'w-3/4'
            }`}
          />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 bg-white/[0.02] border-b border-white/10">
        <div className="w-10" /> {/* Avatar spacer */}
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className={`h-4 flex-1 rounded ${i === 0 ? 'w-24' : 'w-16'}`} />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} columns={columns} />
      ))}
    </div>
  );
}

// Admin-specific card skeleton (for user/client cards)
export function AdminCardSkeleton() {
  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32 rounded" />
            <Skeleton className="h-4 w-48 rounded" />
          </div>
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
        <Skeleton className="h-4 w-24 rounded" />
        <div className="flex gap-1">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="w-8 h-8 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function AdminCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <AdminCardSkeleton key={i} />
      ))}
    </div>
  );
}
