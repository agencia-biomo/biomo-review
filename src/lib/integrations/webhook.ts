/**
 * Generic Webhook Integration for Biomo Review
 * Sends notifications to custom webhook URLs.
 *
 * Configuration:
 * Set WEBHOOK_URL environment variable for custom webhook notifications.
 * Or use the API to configure webhooks per project (future feature).
 */

import { Feedback, Project, FeedbackStatus, FeedbackPriority } from '@/types';

const WEBHOOK_URL = process.env.WEBHOOK_URL;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

export type WebhookEventType =
  | 'feedback.created'
  | 'feedback.updated'
  | 'feedback.status_changed'
  | 'feedback.deleted'
  | 'comment.created'
  | 'project.created'
  | 'project.updated';

interface WebhookPayload {
  event: WebhookEventType;
  timestamp: string;
  data: {
    feedback?: Partial<Feedback> & { id?: string };
    project?: Partial<Project> & { id?: string };
    comment?: {
      id: string;
      content: string;
      authorName: string;
      createdAt: string;
    };
    changes?: {
      field: string;
      oldValue: string | number | boolean | null;
      newValue: string | number | boolean | null;
    }[];
  };
  metadata?: {
    triggeredBy?: string;
    projectId?: string;
    feedbackId?: string;
  };
}

/**
 * Check if webhook integration is configured
 */
export function isWebhookConfigured(): boolean {
  return !!WEBHOOK_URL;
}

/**
 * Send a webhook notification
 */
export async function sendWebhook(
  eventType: WebhookEventType,
  data: WebhookPayload['data'],
  metadata?: WebhookPayload['metadata']
): Promise<boolean> {
  if (!isWebhookConfigured()) {
    console.log('[Webhook] Integration not configured, skipping notification');
    return false;
  }

  const payload: WebhookPayload = {
    event: eventType,
    timestamp: new Date().toISOString(),
    data,
    metadata,
  };

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add signature if secret is configured
    if (WEBHOOK_SECRET) {
      const signature = await generateSignature(JSON.stringify(payload), WEBHOOK_SECRET);
      headers['X-Webhook-Signature'] = signature;
    }

    const response = await fetch(WEBHOOK_URL!, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('[Webhook] Failed to send:', response.status, response.statusText);
      return false;
    }

    console.log('[Webhook] Notification sent successfully');
    return true;
  } catch (error) {
    console.error('[Webhook] Error sending notification:', error);
    return false;
  }
}

/**
 * Generate HMAC-SHA256 signature for webhook payload
 */
async function generateSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const payloadData = encoder.encode(payload);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, payloadData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Notify about a new feedback
 */
export async function notifyFeedbackCreated(
  feedback: Feedback & { id: string },
  project: Project & { id: string }
): Promise<boolean> {
  return sendWebhook(
    'feedback.created',
    {
      feedback: {
        id: feedback.id,
        title: feedback.title,
        description: feedback.description,
        priority: feedback.priority,
        status: feedback.status,
        createdAt: feedback.createdAt,
      },
      project: {
        id: project.id,
        name: project.name,
        siteUrl: project.siteUrl,
      },
    },
    {
      projectId: project.id,
      feedbackId: feedback.id,
    }
  );
}

/**
 * Notify about a feedback status change
 */
export async function notifyStatusChanged(
  feedback: Feedback & { id: string },
  project: Project & { id: string },
  oldStatus: FeedbackStatus,
  newStatus: FeedbackStatus,
  triggeredBy?: string
): Promise<boolean> {
  return sendWebhook(
    'feedback.status_changed',
    {
      feedback: {
        id: feedback.id,
        title: feedback.title,
        status: newStatus,
      },
      changes: [
        {
          field: 'status',
          oldValue: oldStatus,
          newValue: newStatus,
        },
      ],
    },
    {
      projectId: project.id,
      feedbackId: feedback.id,
      triggeredBy,
    }
  );
}

/**
 * Notify about a new comment
 */
export async function notifyCommentCreated(
  feedbackId: string,
  projectId: string,
  comment: {
    id: string;
    content: string;
    authorName: string;
    createdAt: string;
  }
): Promise<boolean> {
  return sendWebhook(
    'comment.created',
    {
      comment,
    },
    {
      projectId,
      feedbackId,
    }
  );
}
