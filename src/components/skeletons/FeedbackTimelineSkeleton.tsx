'use client';

import { Skeleton } from '@/components/ui/skeleton';

interface FeedbackItemSkeletonProps {
  showImage?: boolean;
}

function FeedbackItemSkeleton({ showImage = true }: FeedbackItemSkeletonProps) {
  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 animate-pulse">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32 rounded" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-3/4 rounded" />
        </div>
      </div>

      {/* Screenshot preview */}
      {showImage && (
        <div className="mb-3">
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-12 rounded-full" />
        </div>
        <Skeleton className="h-4 w-24 rounded" />
      </div>
    </div>
  );
}

export function FeedbackTimelineSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="h-full flex flex-col bg-[#0A0A0A] border-l border-white/10">
      {/* Header */}
      <div className="px-4 py-5 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-32 rounded" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>

        {/* Search bar */}
        <Skeleton className="h-10 w-full rounded-xl" />

        {/* Filter tabs */}
        <div className="flex gap-2 mt-4">
          <Skeleton className="h-8 w-16 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>

      {/* Timeline items */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <FeedbackItemSkeleton key={i} showImage={i === 0} />
        ))}
      </div>
    </div>
  );
}

export function FeedbackCardSkeleton() {
  return <FeedbackItemSkeleton />;
}
