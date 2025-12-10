'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, FolderPlus, Link2, Moon, Sun, Keyboard, Command } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useCommandPaletteStore } from '@/hooks/useCommandPalette';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface FABAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: string;
}

interface FloatingActionButtonProps {
  onNewProject?: () => void;
  onCopyLink?: () => void;
  onShowShortcuts?: () => void;
  className?: string;
}

export function FloatingActionButton({
  onNewProject,
  onCopyLink,
  onShowShortcuts,
  className,
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { resolvedTheme, setTheme } = useTheme();
  const { open: openCommandPalette } = useCommandPaletteStore();
  const prefersReducedMotion = useReducedMotion();

  // Handle scroll visibility (show/hide on scroll)
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // On mobile, always show
      if (window.innerWidth < 768) {
        setIsVisible(true);
        return;
      }

      // Show when scrolling up or at top
      if (currentScrollY < lastScrollY || currentScrollY < 100) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
        setIsOpen(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    setIsOpen(false);
  }, [resolvedTheme, setTheme]);

  const handleNewProject = useCallback(() => {
    onNewProject?.();
    setIsOpen(false);
  }, [onNewProject]);

  const handleCopyLink = useCallback(() => {
    onCopyLink?.();
    setIsOpen(false);
  }, [onCopyLink]);

  const handleShowShortcuts = useCallback(() => {
    onShowShortcuts?.();
    setIsOpen(false);
  }, [onShowShortcuts]);

  const handleOpenCommandPalette = useCallback(() => {
    openCommandPalette();
    setIsOpen(false);
  }, [openCommandPalette]);

  const actions: FABAction[] = [
    {
      id: 'command-palette',
      label: 'Busca Rápida (⌘K)',
      icon: <Command className="w-5 h-5" />,
      onClick: handleOpenCommandPalette,
      color: 'from-violet-500 to-purple-500',
    },
    {
      id: 'new-project',
      label: 'Novo Projeto',
      icon: <FolderPlus className="w-5 h-5" />,
      onClick: handleNewProject,
      color: 'from-emerald-500 to-green-500',
    },
    {
      id: 'copy-link',
      label: 'Copiar Link',
      icon: <Link2 className="w-5 h-5" />,
      onClick: handleCopyLink,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'theme',
      label: resolvedTheme === 'dark' ? 'Modo Claro' : 'Modo Escuro',
      icon: resolvedTheme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />,
      onClick: toggleTheme,
      color: 'from-amber-500 to-orange-500',
    },
    {
      id: 'shortcuts',
      label: 'Atalhos',
      icon: <Keyboard className="w-5 h-5" />,
      onClick: handleShowShortcuts,
      color: 'from-pink-500 to-rose-500',
    },
  ];

  // Animation variants
  const containerVariants = prefersReducedMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
      }
    : {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      };

  const menuVariants = prefersReducedMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
      }
    : {
        hidden: { opacity: 0, scale: 0.8 },
        visible: {
          opacity: 1,
          scale: 1,
          transition: {
            type: 'spring' as const,
            stiffness: 400,
            damping: 25,
            staggerChildren: 0.05,
          },
        },
      };

  const itemVariants = prefersReducedMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
      }
    : {
        hidden: { opacity: 0, x: 20 },
        visible: { opacity: 1, x: 0 },
      };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={containerVariants}
          transition={{ duration: prefersReducedMotion ? 0.01 : 0.2 }}
          className={cn(
            'fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3',
            className
          )}
        >
          {/* Action Menu */}
          <AnimatePresence>
            {isOpen && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: prefersReducedMotion ? 0.01 : 0.2 }}
                  className="fixed inset-0 bg-black/30 backdrop-blur-sm -z-10"
                  onClick={() => setIsOpen(false)}
                />

                {/* Menu Items */}
                <motion.div
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={menuVariants}
                  className="flex flex-col items-end gap-2"
                >
                  {actions.map((action) => (
                    <motion.button
                      key={action.id}
                      variants={itemVariants}
                      onClick={action.onClick}
                      className="flex items-center gap-3 group"
                      whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
                      whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                    >
                      {/* Label */}
                      <span className="px-3 py-1.5 rounded-lg bg-[#0A0A0A] border border-white/10 text-sm text-white/90 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {action.label}
                      </span>

                      {/* Icon Button */}
                      <div
                        className={cn(
                          'w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg',
                          'bg-gradient-to-br',
                          action.color || 'from-purple-500 to-indigo-500',
                          'hover:shadow-xl transition-shadow'
                        )}
                      >
                        {action.icon}
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Main FAB Button */}
          <motion.button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              'w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg',
              'bg-gradient-to-br from-purple-500 to-indigo-600',
              'hover:from-purple-600 hover:to-indigo-700',
              'hover:shadow-xl hover:shadow-purple-500/25',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black'
            )}
            whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
            whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
            animate={prefersReducedMotion ? {} : { rotate: isOpen ? 45 : 0 }}
            transition={{ duration: prefersReducedMotion ? 0.01 : 0.2 }}
            aria-label={isOpen ? 'Fechar menu' : 'Abrir menu de ações rápidas'}
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
