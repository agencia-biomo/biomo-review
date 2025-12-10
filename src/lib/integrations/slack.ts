/**
 * Slack Integration for Biomo Review
 * Sends notifications to Slack channels when feedbacks are created/updated.
 *
 * Configuration:
 * Set SLACK_WEBHOOK_URL environment variable to enable Slack notifications.
 */

import { Feedback, Project, FeedbackPriority } from '@/types';

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

interface SlackMessage {
  blocks: SlackBlock[];
  text?: string;
}

interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
    emoji?: boolean;
  };
  fields?: Array<{
    type: string;
    text: string;
  }>;
  elements?: Array<{
    type: string;
    text?: string | {
      type: string;
      text: string;
      emoji?: boolean;
    };
    url?: string;
    style?: string;
  }>;
  accessory?: {
    type: string;
    text: {
      type: string;
      text: string;
      emoji?: boolean;
    };
    url: string;
    style?: string;
  };
}

// Priority to emoji mapping
const PRIORITY_EMOJI: Record<FeedbackPriority, string> = {
  low: '🟢',
  medium: '🟡',
  high: '🟠',
  urgent: '🔴',
};

// Priority to label mapping
const PRIORITY_LABEL: Record<FeedbackPriority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
};

/**
 * Check if Slack integration is configured
 */
export function isSlackConfigured(): boolean {
  return !!SLACK_WEBHOOK_URL;
}

/**
 * Send a notification to Slack about a new feedback
 */
export async function notifyNewFeedback(
  feedback: Feedback,
  project: Project,
  baseUrl: string
): Promise<boolean> {
  if (!isSlackConfigured()) {
    console.log('[Slack] Integration not configured, skipping notification');
    return false;
  }

  const feedbackUrl = `${baseUrl}/projetos/${project.id || (project as Project & { id: string }).id}`;
  const priorityEmoji = PRIORITY_EMOJI[feedback.priority];
  const priorityLabel = PRIORITY_LABEL[feedback.priority];

  const message: SlackMessage = {
    text: `Novo feedback: ${feedback.title}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${priorityEmoji} Novo Feedback`,
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${feedback.title}*\n${feedback.description?.substring(0, 200) || 'Sem descrição'}${(feedback.description?.length || 0) > 200 ? '...' : ''}`,
        },
        accessory: {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Ver Feedback',
            emoji: true,
          },
          url: feedbackUrl,
          style: 'primary',
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Projeto:*\n${project.name}`,
          },
          {
            type: 'mrkdwn',
            text: `*Prioridade:*\n${priorityEmoji} ${priorityLabel}`,
          },
        ],
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `📍 *Site:* <${project.siteUrl}|${new URL(project.siteUrl).hostname}>`,
          },
        ],
      },
    ],
  };

  return sendSlackMessage(message);
}

/**
 * Send a notification to Slack about a feedback status change
 */
export async function notifyStatusChange(
  feedback: Feedback,
  project: Project,
  oldStatus: string,
  newStatus: string,
  baseUrl: string
): Promise<boolean> {
  if (!isSlackConfigured()) {
    return false;
  }

  const feedbackUrl = `${baseUrl}/projetos/${project.id || (project as Project & { id: string }).id}`;
  const statusLabels: Record<string, string> = {
    new: 'Novo',
    in_review: 'Em Análise',
    in_progress: 'Em Andamento',
    waiting_client: 'Aguardando Cliente',
    completed: 'Concluído',
    rejected: 'Rejeitado',
  };

  const message: SlackMessage = {
    text: `Status atualizado: ${feedback.title}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Status Atualizado*\n${feedback.title}`,
        },
        accessory: {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Ver',
            emoji: true,
          },
          url: feedbackUrl,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*De:*\n${statusLabels[oldStatus] || oldStatus}`,
          },
          {
            type: 'mrkdwn',
            text: `*Para:*\n${statusLabels[newStatus] || newStatus}`,
          },
        ],
      },
    ],
  };

  return sendSlackMessage(message);
}

/**
 * Send a raw message to Slack
 */
async function sendSlackMessage(message: SlackMessage): Promise<boolean> {
  if (!SLACK_WEBHOOK_URL) {
    return false;
  }

  try {
    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error('[Slack] Failed to send message:', response.status, response.statusText);
      return false;
    }

    console.log('[Slack] Message sent successfully');
    return true;
  } catch (error) {
    console.error('[Slack] Error sending message:', error);
    return false;
  }
}
