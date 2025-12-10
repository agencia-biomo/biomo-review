/**
 * API Route for Slack Integration
 * GET: Check if Slack is configured
 * POST: Test Slack notification
 */

import { NextRequest, NextResponse } from 'next/server';
import { isSlackConfigured } from '@/lib/integrations/slack';

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

/**
 * GET /api/integrations/slack
 * Check if Slack integration is configured
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    configured: isSlackConfigured(),
    message: isSlackConfigured()
      ? 'Slack integration is configured'
      : 'Set SLACK_WEBHOOK_URL environment variable to enable Slack notifications',
  });
}

/**
 * POST /api/integrations/slack
 * Send a test notification to Slack
 */
export async function POST(request: NextRequest) {
  if (!isSlackConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: 'Slack integration not configured. Set SLACK_WEBHOOK_URL environment variable.',
      },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const message = body.message || 'Teste de integração do Biomo Review! 🎉';

    const response = await fetch(SLACK_WEBHOOK_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: message,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🧪 Teste de Integração',
              emoji: true,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: message,
            },
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `Enviado em: ${new Date().toLocaleString('pt-BR')}`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          success: false,
          error: `Slack API error: ${response.status} - ${errorText}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Test notification sent successfully',
    });
  } catch (error) {
    console.error('[Slack API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send test notification',
      },
      { status: 500 }
    );
  }
}
