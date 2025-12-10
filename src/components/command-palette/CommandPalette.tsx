'use client';

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command as CommandIcon } from 'lucide-react';
import { useCommandPalette, useCommandPaletteStore } from '@/hooks/useCommandPalette';
import { Command, groupLabels } from '@/lib/commands';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';

interface CommandPaletteProps {
  onNewProject?: () => void;
  onSearch?: () => void;
  onShowShortcuts?: () => void;
}

export function CommandPalette({ onNewProject, onSearch, onShowShortcuts }: CommandPaletteProps) {
  const prefersReducedMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const {
    isOpen,
    close,
    query,
    setQuery,
    selectedIndex,
    setSelectedIndex,
    groupedCommands,
    flatCommands,
    executeCommand,
  } = useCommandPalette({ onNewProject, onSearch, onShowShortcuts });

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      selectedElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  // Animation variants
  const backdropVariants = prefersReducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      };

  const dialogVariants = prefersReducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, scale: 0.95, y: -20 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.95, y: -20 },
      };

  // Get flat index for an item
  const getFlatIndex = (command: Command) => {
    return flatCommands.findIndex(c => c.id === command.id);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            {...backdropVariants}
            transition={{ duration: prefersReducedMotion ? 0.01 : 0.2 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={close}
          />

          {/* Dialog */}
          <motion.div
            {...dialogVariants}
            transition={prefersReducedMotion ? { duration: 0.01 } : { type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed z-50 top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg mx-4"
          >
            <div className="bg-[#0A0A0A] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
                <Search className="w-5 h-5 text-white/40 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Digite um comando ou busque..."
                  className="flex-1 bg-transparent text-white placeholder:text-white/40 focus:outline-none text-sm"
                />
                <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-white/40">
                  <CommandIcon className="w-3 h-3" />
                  <span>K</span>
                </kbd>
              </div>

              {/* Commands List */}
              <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
                {flatCommands.length === 0 ? (
                  <div className="text-center py-8 text-white/40 text-sm">
                    Nenhum comando encontrado
                  </div>
                ) : (
                  Object.entries(groupedCommands).map(([groupId, commands]) => (
                    <div key={groupId} className="mb-2 last:mb-0">
                      {/* Group Label */}
                      <div className="px-3 py-2 text-xs font-medium text-white/40 uppercase tracking-wider">
                        {groupLabels[groupId] || groupId}
                      </div>

                      {/* Commands */}
                      {commands.map((command) => {
                        const flatIndex = getFlatIndex(command);
                        const isSelected = flatIndex === selectedIndex;

                        return (
                          <button
                            key={command.id}
                            data-index={flatIndex}
                            onClick={() => executeCommand(command)}
                            onMouseEnter={() => setSelectedIndex(flatIndex)}
                            className={cn(
                              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                              isSelected
                                ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/30'
                                : 'hover:bg-white/5'
                            )}
                          >
                            {/* Icon */}
                            {command.icon && (
                              <div className={cn(
                                'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                                isSelected
                                  ? 'bg-gradient-to-br from-purple-500 to-indigo-500 text-white'
                                  : 'bg-white/5 text-white/60'
                              )}>
                                <command.icon className="w-4 h-4" />
                              </div>
                            )}

                            {/* Label */}
                            <span className={cn(
                              'flex-1 text-sm',
                              isSelected ? 'text-white' : 'text-white/70'
                            )}>
                              {command.label}
                            </span>

                            {/* Shortcut */}
                            {command.shortcut && (
                              <kbd className={cn(
                                'px-2 py-0.5 rounded text-xs',
                                isSelected
                                  ? 'bg-white/10 text-white/70'
                                  : 'bg-white/5 text-white/40'
                              )}>
                                {command.shortcut}
                              </kbd>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-white/10 flex items-center justify-between text-xs text-white/40">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-white/5">↑↓</kbd>
                    navegar
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-white/5">↵</kbd>
                    selecionar
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-white/5">esc</kbd>
                    fechar
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Export the store hook for external use
export { useCommandPaletteStore };
