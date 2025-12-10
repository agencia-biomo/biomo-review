'use client';

import { Skeleton } from '@/components/ui/skeleton';

interface ProjectCardSkeletonProps {
  viewMode?: 'grid' | 'list';
}

export function ProjectCardSkeleton({ viewMode = 'grid' }: ProjectCardSkeletonProps) {
  if (viewMode === 'list') {
    return (
      <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 flex items-center gap-4 animate-pulse">
        {/* Icon */}
        <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton className="h-5 w-48 rounded" />
          <Skeleton className="h-4 w-64 rounded" />
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-4">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="w-8 h-8 rounded-lg" />
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] animate-pulse">
      {/* Background placeholder */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent" />

      {/* Header with favicon */}
      <div className="relative p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
        </div>
        <Skeleton className="w-8 h-8 rounded-lg" />
      </div>

      {/* Progress area */}
      <div className="relative px-5 pb-4">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-4 w-12 rounded" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      {/* Footer */}
      <div className="relative px-5 py-4 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-24 rounded" />
      </div>
    </div>
  );
}

export function ProjectCardSkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <ProjectCardSkeleton key={i} viewMode="grid" />
      ))}
    </div>
  );
}

export function ProjectCardSkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2 sm:space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <ProjectCardSkeleton key={i} viewMode="list" />
      ))}
    </div>
  );
}
