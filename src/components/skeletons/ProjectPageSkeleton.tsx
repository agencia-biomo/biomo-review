'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function ProjectPageSkeleton() {
  return (
    <div className="h-screen flex flex-col bg-[#09090B]">
      {/* Header Skeleton */}
      <header className="h-14 lg:h-16 bg-[#0A0A0A] border-b border-white/10 flex items-center px-3 lg:px-4">
        <Skeleton className="w-8 h-8 rounded-lg" />

        <div className="ml-2 lg:ml-4 flex items-center gap-2 lg:gap-3 flex-1 min-w-0">
          <Skeleton className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl flex-shrink-0" />
          <div className="min-w-0 space-y-1.5">
            <Skeleton className="h-4 lg:h-5 w-32 lg:w-48 rounded" />
            <Skeleton className="h-3 w-24 lg:w-32 rounded" />
          </div>
        </div>

        <div className="flex items-center gap-1.5 lg:gap-3">
          <Skeleton className="hidden sm:block w-20 h-8 rounded-full" />
          <Skeleton className="hidden lg:block w-9 h-9 rounded-lg" />
          <Skeleton className="w-9 h-9 rounded-lg" />
          <Skeleton className="w-9 lg:w-32 h-9 rounded-lg" />
        </div>
      </header>

      {/* Main Content Skeleton */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Iframe Viewer Skeleton - 70% */}
        <div className="flex-1 lg:w-[70%] bg-[#0A0A0A] p-4">
          {/* Toolbar skeleton */}
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="w-24 h-9 rounded-lg" />
            <Skeleton className="w-24 h-9 rounded-lg" />
            <div className="flex-1" />
            <Skeleton className="w-32 h-9 rounded-full" />
          </div>

          {/* Iframe placeholder */}
          <Skeleton className="w-full h-[calc(100%-60px)] rounded-xl" shimmer />
        </div>

        {/* Timeline Sidebar Skeleton - 30% */}
        <div className="hidden lg:block lg:w-[30%] lg:min-w-[320px] lg:max-w-[450px] border-l border-white/10">
          {/* Header */}
          <div className="px-4 py-5 border-b border-white/10">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-32 rounded" />
              <Skeleton className="h-9 w-24 rounded-xl" />
            </div>

            {/* Search bar */}
            <Skeleton className="h-10 w-full rounded-xl mb-4" />

            {/* Filter tabs */}
            <div className="flex gap-2">
              <Skeleton className="h-8 w-16 rounded-lg" />
              <Skeleton className="h-8 w-20 rounded-lg" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          </div>

          {/* Timeline items */}
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <FeedbackItemSkeletonCompact key={i} showImage={i === 0} />
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Tab Bar Skeleton */}
      <div className="lg:hidden h-14 bg-[#0A0A0A] border-t border-white/10 flex items-center justify-around px-4">
        <Skeleton className="w-16 h-10 rounded-lg" />
        <Skeleton className="w-16 h-10 rounded-lg" />
      </div>
    </div>
  );
}

function FeedbackItemSkeletonCompact({ showImage = false }: { showImage?: boolean }) {
  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 animate-pulse">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <Skeleton className="h-3 w-full rounded" />
          <Skeleton className="h-3 w-2/3 rounded" />
        </div>
      </div>

      {/* Screenshot preview */}
      {showImage && (
        <div className="mb-3">
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-10 rounded-full" />
        </div>
        <Skeleton className="h-3 w-20 rounded" />
      </div>
    </div>
  );
}
