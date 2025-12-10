'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function MetricsCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white/[0.02] border border-white/10 rounded-xl p-5 animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="w-10 h-10 rounded-xl" />
          </div>
          <Skeleton className="h-9 w-20 rounded mb-2" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-12 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MetricsChartSkeleton() {
  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-5 w-40 rounded" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      </div>
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}

export function MetricsPageContentSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* KPI Cards */}
      <MetricsCardsSkeleton />

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <MetricsChartSkeleton />
        <MetricsChartSkeleton />
      </div>

      {/* Table Skeleton */}
      <div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden animate-pulse">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <Skeleton className="h-5 w-32 rounded" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
        <div className="divide-y divide-white/5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-3 w-48 rounded" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
