'use client';

import { cn } from '@/lib/utils';
import { ElementType, ReactNode, ComponentPropsWithoutRef } from 'react';

type VisuallyHiddenProps<T extends ElementType = 'span'> = {
  children: ReactNode;
  as?: T;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, 'children' | 'className'>;

/**
 * Visually hidden content for screen readers.
 * Content is hidden visually but remains accessible to assistive technologies.
 */
export function VisuallyHidden<T extends ElementType = 'span'>({
  children,
  as,
  className,
  ...props
}: VisuallyHiddenProps<T>) {
  const Component = as || 'span';
  return (
    <Component
      className={cn('sr-only', className)}
      {...props}
    >
      {children}
    </Component>
  );
}

/**
 * Content that should only be visible to screen readers,
 * but can be made visible when focused (useful for skip links).
 */
export function VisuallyHiddenFocusable<T extends ElementType = 'span'>({
  children,
  as,
  className,
  ...props
}: VisuallyHiddenProps<T>) {
  const Component = as || 'span';
  return (
    <Component
      className={cn(
        'sr-only focus:not-sr-only focus:absolute focus:z-50',
        'focus:bg-purple-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg',
        className
      )}
      tabIndex={0}
      {...props}
    >
      {children}
    </Component>
  );
}
