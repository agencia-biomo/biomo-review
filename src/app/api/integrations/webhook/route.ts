/**
 * API Route for Custom Webhook Integration
 * GET: Check if webhook is configured
 * POST: Test webhook notification
 */

import { NextRequest, NextResponse } from 'next/server';
import { isWebhookConfigured, sendWebhook } from '@/lib/integrations/webhook';

/**
 * GET /api/integrations/webhook
 * Check if webhook integration is configured
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    configured: isWebhookConfigured(),
    message: isWebhookConfigured()
      ? 'Webhook integration is configured'
      : 'Set WEBHOOK_URL environment variable to enable webhook notifications',
    features: {
      signature: !!process.env.WEBHOOK_SECRET,
      url: process.env.WEBHOOK_URL ? '[configured]' : null,
    },
  });
}

/**
 * POST /api/integrations/webhook
 * Send a test webhook notification
 */
export async function POST(request: NextRequest) {
  if (!isWebhookConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: 'Webhook integration not configured. Set WEBHOOK_URL environment variable.',
      },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();

    const success = await sendWebhook(
      'feedback.created',
      {
        feedback: {
          id: 'test-feedback-id',
          title: body.title || 'Teste de Webhook',
          description: body.description || 'Esta é uma notificação de teste do Biomo Review.',
          priority: 'medium',
          status: 'new',
          createdAt: new Date(),
        },
        project: {
          id: 'test-project-id',
          name: 'Projeto de Teste',
          siteUrl: 'https://example.com',
        },
      },
      {
        triggeredBy: 'API Test',
      }
    );

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to send webhook notification. Check server logs.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Test webhook notification sent successfully',
    });
  } catch (error) {
    console.error('[Webhook API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send test notification',
      },
      { status: 500 }
    );
  }
}
