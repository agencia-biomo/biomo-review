import { LucideIcon, Sparkles, FolderPlus, MousePointer, History, Share2, Keyboard } from 'lucide-react';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  target?: string; // CSS selector for spotlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao Biomo Review!',
    description: 'Esta ferramenta ajuda voce a gerenciar feedbacks de clientes de forma eficiente. Vamos fazer um tour rapido?',
    icon: Sparkles,
    position: 'center',
  },
  {
    id: 'projects',
    title: 'Seus Projetos',
    description: 'Aqui voce ve todos os seus projetos. Cada card mostra informacoes importantes como status, quantidade de feedbacks e data de criacao.',
    icon: FolderPlus,
    target: '[data-tour="projects-grid"]',
    position: 'bottom',
  },
  {
    id: 'create-feedback',
    title: 'Marcar Alteracoes',
    description: 'Clique em qualquer lugar do site para marcar uma alteracao. Uma captura de tela sera feita automaticamente.',
    icon: MousePointer,
    target: '[data-tour="iframe-viewer"]',
    position: 'left',
  },
  {
    id: 'timeline',
    title: 'Timeline de Feedbacks',
    description: 'Todos os feedbacks aparecem aqui em uma timeline organizada por prioridade e status.',
    icon: History,
    target: '[data-tour="feedback-timeline"]',
    position: 'right',
  },
  {
    id: 'share',
    title: 'Compartilhar com Cliente',
    description: 'Use o botao de link para copiar uma URL publica que o cliente pode acessar para ver e comentar os feedbacks.',
    icon: Share2,
    target: '[data-tour="share-button"]',
    position: 'bottom',
  },
  {
    id: 'shortcuts',
    title: 'Atalhos de Teclado',
    description: 'Use Ctrl/Cmd + K para abrir a paleta de comandos. Pressione ? para ver todos os atalhos disponiveis.',
    icon: Keyboard,
    position: 'center',
    action: {
      label: 'Ver atalhos',
    },
  },
];

export const STORAGE_KEY = 'biomo_onboarding_completed';
export const STORAGE_KEY_DISMISSED = 'biomo_onboarding_dismissed';

export function isOnboardingCompleted(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

export function markOnboardingCompleted(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, 'true');
}

export function isOnboardingDismissed(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(STORAGE_KEY_DISMISSED) === 'true';
}

export function dismissOnboarding(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_DISMISSED, 'true');
}

export function resetOnboarding(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_KEY_DISMISSED);
}
