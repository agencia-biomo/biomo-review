import { LucideIcon, Home, FolderOpen, Plus, BarChart3, Users, Search, Settings, Moon, Sun, Keyboard, HelpCircle, ExternalLink } from 'lucide-react';

export interface Command {
  id: string;
  label: string;
  shortcut?: string;
  icon?: LucideIcon;
  group?: 'navigation' | 'actions' | 'settings' | 'recent';
  action: () => void | Promise<void>;
  keywords?: string[]; // For fuzzy search
}

export interface CommandGroup {
  id: string;
  label: string;
  commands: Command[];
}

// Command factory helpers
export function createNavigationCommand(
  id: string,
  label: string,
  path: string,
  icon: LucideIcon,
  router: { push: (path: string) => void },
  shortcut?: string,
  keywords?: string[]
): Command {
  return {
    id,
    label,
    shortcut,
    icon,
    group: 'navigation',
    keywords: keywords || [label.toLowerCase()],
    action: () => router.push(path),
  };
}

export function createActionCommand(
  id: string,
  label: string,
  action: () => void | Promise<void>,
  icon: LucideIcon,
  shortcut?: string,
  keywords?: string[]
): Command {
  return {
    id,
    label,
    shortcut,
    icon,
    group: 'actions',
    keywords: keywords || [label.toLowerCase()],
    action,
  };
}

// Default commands (will be populated with router in useCommandPalette)
export const defaultCommands = {
  navigation: [
    { id: 'home', label: 'Ir para Home', path: '/', icon: Home, keywords: ['inicio', 'dashboard', 'principal'] },
    { id: 'admin', label: 'Administração', path: '/admin', icon: Users, keywords: ['usuarios', 'clientes', 'configuracoes'] },
    { id: 'metrics', label: 'Métricas', path: '/metricas', icon: BarChart3, keywords: ['analytics', 'estatisticas', 'relatorios'] },
  ],
  actions: [
    { id: 'new-project', label: 'Novo Projeto', shortcut: 'N', icon: Plus, keywords: ['criar', 'adicionar', 'novo'] },
    { id: 'search', label: 'Buscar projetos...', shortcut: '/', icon: Search, keywords: ['encontrar', 'pesquisar'] },
    { id: 'shortcuts', label: 'Atalhos de teclado', shortcut: '?', icon: Keyboard, keywords: ['teclas', 'hotkeys', 'comandos'] },
  ],
  settings: [
    { id: 'theme', label: 'Alternar tema', shortcut: 'T', icon: Moon, keywords: ['escuro', 'claro', 'dark', 'light'] },
  ],
};

// Group labels
export const groupLabels: Record<string, string> = {
  navigation: 'Navegação',
  actions: 'Ações',
  settings: 'Configurações',
  recent: 'Recentes',
};

// Fuzzy search implementation
export function searchCommands(commands: Command[], query: string): Command[] {
  if (!query.trim()) return commands;

  const normalizedQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  return commands.filter((command) => {
    const normalizedLabel = command.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const normalizedKeywords = command.keywords?.map(k => k.normalize('NFD').replace(/[\u0300-\u036f]/g, '')) || [];

    // Check if query matches label
    if (normalizedLabel.includes(normalizedQuery)) return true;

    // Check if query matches any keyword
    if (normalizedKeywords.some(k => k.includes(normalizedQuery))) return true;

    // Fuzzy match - check if all characters in query appear in order in label
    let labelIndex = 0;
    for (const char of normalizedQuery) {
      const foundIndex = normalizedLabel.indexOf(char, labelIndex);
      if (foundIndex === -1) return false;
      labelIndex = foundIndex + 1;
    }
    return true;
  });
}

// Recent commands storage
const RECENT_COMMANDS_KEY = 'biomo_recent_commands';
const MAX_RECENT_COMMANDS = 5;

export function getRecentCommands(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(RECENT_COMMANDS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addRecentCommand(commandId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const recent = getRecentCommands().filter(id => id !== commandId);
    recent.unshift(commandId);
    localStorage.setItem(RECENT_COMMANDS_KEY, JSON.stringify(recent.slice(0, MAX_RECENT_COMMANDS)));
  } catch {
    // Ignore localStorage errors
  }
}
