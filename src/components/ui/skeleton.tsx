'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'circular' | 'text' | 'button' | 'card';
  width?: string | number;
  height?: string | number;
  shimmer?: boolean;
  style?: React.CSSProperties;
}

export function Skeleton({
  className,
  variant = 'default',
  width,
  height,
  shimmer = true,
  style,
}: SkeletonProps) {
  const baseStyles = 'bg-white/10 rounded';

  const variantStyles = {
    default: 'rounded-md',
    circular: 'rounded-full',
    text: 'rounded h-4 w-full',
    button: 'rounded-xl h-10',
    card: 'rounded-2xl',
  };

  const shimmerStyles = shimmer
    ? 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent'
    : 'animate-pulse';

  return (
    <div
      className={cn(baseStyles, variantStyles[variant], shimmerStyles, className)}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        ...style,
      }}
    />
  );
}

// Convenience components
export function SkeletonText({
  lines = 1,
  className,
  lastLineWidth = '60%'
}: {
  lines?: number;
  className?: string;
  lastLineWidth?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={i === lines - 1 ? '' : 'w-full'}
          style={{ width: i === lines - 1 ? lastLineWidth : '100%' }}
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({
  size = 40,
  className
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Skeleton
      variant="circular"
      width={size}
      height={size}
      className={className}
    />
  );
}

export function SkeletonButton({
  className,
  width = 100,
}: {
  className?: string;
  width?: number | string;
}) {
  return (
    <Skeleton
      variant="button"
      width={width}
      className={className}
    />
  );
}
