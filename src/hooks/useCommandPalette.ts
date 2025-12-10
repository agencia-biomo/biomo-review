'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { create } from 'zustand';
import { Home, FolderOpen, Plus, BarChart3, Users, Search, Keyboard, Moon, Sun, ExternalLink } from 'lucide-react';
import {
  Command,
  searchCommands,
  getRecentCommands,
  addRecentCommand,
  defaultCommands,
  groupLabels,
} from '@/lib/commands';
import { useTheme } from '@/components/providers/ThemeProvider';

// Global store for command palette state
interface CommandPaletteStore {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export const useCommandPaletteStore = create<CommandPaletteStore>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}));

interface UseCommandPaletteOptions {
  onNewProject?: () => void;
  onSearch?: () => void;
  onShowShortcuts?: () => void;
  additionalCommands?: Command[];
}

export function useCommandPalette(options: UseCommandPaletteOptions = {}) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { isOpen, open, close, toggle } = useCommandPaletteStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Build commands list
  const commands = useMemo<Command[]>(() => {
    const cmds: Command[] = [];

    // Navigation commands
    for (const nav of defaultCommands.navigation) {
      cmds.push({
        id: nav.id,
        label: nav.label,
        icon: nav.icon,
        group: 'navigation',
        keywords: nav.keywords,
        action: () => {
          router.push(nav.path);
          close();
        },
      });
    }

    // Action commands
    cmds.push({
      id: 'new-project',
      label: 'Novo Projeto',
      shortcut: 'N',
      icon: Plus,
      group: 'actions',
      keywords: ['criar', 'adicionar', 'novo', 'projeto'],
      action: () => {
        options.onNewProject?.();
        close();
      },
    });

    cmds.push({
      id: 'search',
      label: 'Buscar projetos...',
      shortcut: '/',
      icon: Search,
      group: 'actions',
      keywords: ['encontrar', 'pesquisar', 'buscar'],
      action: () => {
        options.onSearch?.();
        close();
      },
    });

    cmds.push({
      id: 'shortcuts',
      label: 'Atalhos de teclado',
      shortcut: '?',
      icon: Keyboard,
      group: 'actions',
      keywords: ['teclas', 'hotkeys', 'comandos', 'atalhos'],
      action: () => {
        options.onShowShortcuts?.();
        close();
      },
    });

    // Theme toggle
    cmds.push({
      id: 'theme',
      label: resolvedTheme === 'dark' ? 'Modo claro' : 'Modo escuro',
      shortcut: 'T',
      icon: resolvedTheme === 'dark' ? Sun : Moon,
      group: 'settings',
      keywords: ['tema', 'escuro', 'claro', 'dark', 'light'],
      action: () => {
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
        close();
      },
    });

    // Additional commands from options
    if (options.additionalCommands) {
      cmds.push(...options.additionalCommands);
    }

    return cmds;
  }, [router, resolvedTheme, setTheme, close, options]);

  // Filter commands based on search query
  const filteredCommands = useMemo(() => {
    return searchCommands(commands, query);
  }, [commands, query]);

  // Group filtered commands
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {};

    // First, add recent commands if no query
    if (!query) {
      const recentIds = getRecentCommands();
      const recentCmds = recentIds
        .map(id => commands.find(c => c.id === id))
        .filter((c): c is Command => !!c);

      if (recentCmds.length > 0) {
        groups['recent'] = recentCmds;
      }
    }

    // Group remaining commands
    for (const cmd of filteredCommands) {
      const group = cmd.group || 'actions';
      // Skip if already in recent
      if (!query && groups['recent']?.some(c => c.id === cmd.id)) {
        continue;
      }
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(cmd);
    }

    return groups;
  }, [filteredCommands, commands, query]);

  // Flat list for navigation
  const flatCommands = useMemo(() => {
    const result: Command[] = [];
    const order = ['recent', 'navigation', 'actions', 'settings'];

    for (const groupId of order) {
      if (groupedCommands[groupId]) {
        result.push(...groupedCommands[groupId]);
      }
    }

    return result;
  }, [groupedCommands]);

  // Execute selected command
  const executeCommand = useCallback((command: Command) => {
    addRecentCommand(command.id);
    command.action();
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) {
      // Global shortcut to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        open();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, flatCommands.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (flatCommands[selectedIndex]) {
          executeCommand(flatCommands[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
    }
  }, [isOpen, open, close, flatCommands, selectedIndex, executeCommand]);

  // Set up global keyboard listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  return {
    isOpen,
    open,
    close,
    toggle,
    query,
    setQuery,
    selectedIndex,
    setSelectedIndex,
    groupedCommands,
    flatCommands,
    groupLabels,
    executeCommand,
  };
}
