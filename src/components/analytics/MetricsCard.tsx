'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface MetricsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label?: string;
    isPositive?: boolean;
  };
  gradient?: string;
  className?: string;
  children?: ReactNode;
}

export function MetricsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  gradient = 'from-purple-500 to-indigo-500',
  className,
  children,
}: MetricsCardProps) {
  const prefersReducedMotion = useReducedMotion();

  const TrendIcon = trend
    ? trend.value > 0
      ? TrendingUp
      : trend.value < 0
        ? TrendingDown
        : Minus
    : null;

  return (
    <motion.div
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0.01 : 0.3 }}
      className={cn(
        'relative overflow-hidden rounded-xl bg-[#0A0A0A] border border-white/10',
        'p-5',
        className
      )}
    >
      {/* Gradient background accent */}
      <div
        className={cn(
          'absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 blur-3xl -translate-y-1/2 translate-x-1/2',
          `bg-gradient-to-br ${gradient}`
        )}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-white/50 font-medium">{title}</span>
          {Icon && (
            <div
              className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center',
                `bg-gradient-to-br ${gradient}`
              )}
            >
              <Icon className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        {/* Value */}
        <div className="mb-1">
          <span className="text-3xl font-bold text-white">{value}</span>
        </div>

        {/* Subtitle and trend */}
        <div className="flex items-center justify-between">
          {subtitle && (
            <span className="text-xs text-white/40">{subtitle}</span>
          )}

          {trend && TrendIcon && (
            <div
              className={cn(
                'flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
                trend.value > 0
                  ? trend.isPositive !== false
                    ? 'bg-green-500/10 text-green-400'
                    : 'bg-red-500/10 text-red-400'
                  : trend.value < 0
                    ? trend.isPositive !== false
                      ? 'bg-red-500/10 text-red-400'
                      : 'bg-green-500/10 text-green-400'
                    : 'bg-white/5 text-white/40'
              )}
            >
              <TrendIcon className="w-3 h-3" />
              <span>{Math.abs(trend.value)}%</span>
              {trend.label && (
                <span className="text-white/40 ml-1">{trend.label}</span>
              )}
            </div>
          )}
        </div>

        {/* Optional children for charts or extra content */}
        {children && <div className="mt-4">{children}</div>}
      </div>
    </motion.div>
  );
}
