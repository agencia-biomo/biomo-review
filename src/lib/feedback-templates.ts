import {
  Bug,
  Type,
  Layout,
  Sparkles,
  Palette,
  Image,
  Link2,
  Smartphone,
  Edit3,
  LucideIcon,
} from 'lucide-react';
import { FeedbackPriority } from '@/types';

export interface FeedbackTemplate {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  titlePrefix: string;
  contentTemplate: string;
  priority: FeedbackPriority;
  color: string;
}

export const feedbackTemplates: FeedbackTemplate[] = [
  {
    id: 'bug',
    name: 'Bug / Erro',
    description: 'Reporte um problema ou comportamento inesperado',
    icon: Bug,
    titlePrefix: '[BUG] ',
    contentTemplate: `**O que aconteceu:**

**Comportamento esperado:**

**Passos para reproduzir:**
1.
2.
3.

**Navegador/Dispositivo:**`,
    priority: 'high',
    color: 'from-red-500 to-rose-500',
  },
  {
    id: 'text-change',
    name: 'Mudanca de Texto',
    description: 'Alterar texto, titulo ou conteudo',
    icon: Type,
    titlePrefix: '[TEXTO] ',
    contentTemplate: `**Texto atual:**


**Novo texto:**


**Observacoes:**`,
    priority: 'low',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'layout',
    name: 'Ajuste de Layout',
    description: 'Modificar posicionamento, espacamento ou estrutura',
    icon: Layout,
    titlePrefix: '[LAYOUT] ',
    contentTemplate: `**Elemento afetado:**


**Ajuste necessario:**


**Referencia visual:** (se houver)`,
    priority: 'medium',
    color: 'from-purple-500 to-indigo-500',
  },
  {
    id: 'feature',
    name: 'Nova Funcionalidade',
    description: 'Sugerir ou solicitar nova feature',
    icon: Sparkles,
    titlePrefix: '[FEATURE] ',
    contentTemplate: `**Descricao da funcionalidade:**


**Beneficio esperado:**


**Exemplos de uso:**`,
    priority: 'medium',
    color: 'from-amber-500 to-orange-500',
  },
  {
    id: 'style',
    name: 'Estilo / Design',
    description: 'Ajuste de cores, fontes ou visual',
    icon: Palette,
    titlePrefix: '[ESTILO] ',
    contentTemplate: `**O que mudar:**


**Como deve ficar:**


**Cores/Fontes:** (se aplicavel)`,
    priority: 'low',
    color: 'from-pink-500 to-fuchsia-500',
  },
  {
    id: 'image',
    name: 'Imagem / Midia',
    description: 'Trocar ou ajustar imagem, video ou arquivo',
    icon: Image,
    titlePrefix: '[IMAGEM] ',
    contentTemplate: `**Elemento:**


**Acao necessaria:**
[ ] Substituir
[ ] Redimensionar
[ ] Ajustar qualidade
[ ] Outro

**Arquivo/URL nova:** (se substituir)`,
    priority: 'low',
    color: 'from-emerald-500 to-green-500',
  },
  {
    id: 'link',
    name: 'Link / URL',
    description: 'Corrigir ou adicionar link',
    icon: Link2,
    titlePrefix: '[LINK] ',
    contentTemplate: `**Link atual:** (se houver)


**Novo link:**


**Onde aplicar:**`,
    priority: 'low',
    color: 'from-sky-500 to-blue-500',
  },
  {
    id: 'mobile',
    name: 'Responsividade',
    description: 'Problema em dispositivo movel ou tablet',
    icon: Smartphone,
    titlePrefix: '[MOBILE] ',
    contentTemplate: `**Dispositivo/Tamanho de tela:**


**Problema encontrado:**


**Como deveria aparecer:**`,
    priority: 'high',
    color: 'from-violet-500 to-purple-500',
  },
  {
    id: 'custom',
    name: 'Personalizado',
    description: 'Feedback livre sem template',
    icon: Edit3,
    titlePrefix: '',
    contentTemplate: '',
    priority: 'medium',
    color: 'from-gray-500 to-slate-500',
  },
];

export function getTemplateById(id: string): FeedbackTemplate | undefined {
  return feedbackTemplates.find((t) => t.id === id);
}

export function applyTemplate(
  template: FeedbackTemplate,
  currentTitle: string,
  currentContent: string
): { title: string; content: string; priority: FeedbackPriority } {
  // Only apply prefix if not already present and not custom
  const title =
    template.id === 'custom'
      ? currentTitle
      : currentTitle.startsWith(template.titlePrefix)
        ? currentTitle
        : template.titlePrefix + currentTitle.replace(/^\[.*?\]\s*/, '');

  // Only apply content template if current content is empty or just whitespace
  const content =
    template.contentTemplate && currentContent.trim() === ''
      ? template.contentTemplate
      : currentContent;

  return {
    title,
    content,
    priority: template.priority,
  };
}
