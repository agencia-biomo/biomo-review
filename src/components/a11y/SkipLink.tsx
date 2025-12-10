'use client';

import { cn } from '@/lib/utils';

interface SkipLinkProps {
  href?: string;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Skip navigation link for keyboard users.
 * Allows users to skip directly to main content.
 * Only visible when focused.
 */
export function SkipLink({
  href = '#main-content',
  children = 'Pular para o conteudo principal',
  className,
}: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        // Hidden by default, visible on focus
        'sr-only focus:not-sr-only',
        // Positioning
        'fixed top-4 left-4 z-[9999]',
        // Styling
        'bg-purple-600 text-white px-4 py-2 rounded-lg',
        'font-medium text-sm',
        // Focus styles
        'focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-black',
        // Animation
        'transition-all duration-200',
        className
      )}
    >
      {children}
    </a>
  );
}

/**
 * Target element for skip link.
 * Add this component where you want the skip link to jump to.
 */
export function SkipLinkTarget({ id = 'main-content' }: { id?: string }) {
  return (
    <div
      id={id}
      tabIndex={-1}
      className="outline-none"
      aria-hidden="true"
    />
  );
}
