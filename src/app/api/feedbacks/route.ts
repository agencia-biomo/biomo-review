import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { isFirebaseConfigured, mockFeedbacksApi } from '@/lib/mock-db';
import { Feedback, ClickPosition, StatusHistoryEntry } from '@/types';

// POST /api/feedbacks - Create new feedback
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      projectId,
      title,
      description,
      screenshot,
      audioUrl,
      attachments = [],
      clickPosition,
      priority = 'medium',
      deadline,
      createdBy,
    } = body;

    console.log('[API/feedbacks] Creating feedback with audioUrl:', audioUrl ? audioUrl.substring(0, 100) + '...' : 'none');

    // Validate required fields
    if (!projectId || !title || !description || !clickPosition) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, title, description, clickPosition' },
        { status: 400 }
      );
    }

    // Create initial status history entry
    const now = new Date();
    const initialStatusHistory: StatusHistoryEntry[] = [{
      fromStatus: null,
      toStatus: 'new',
      changedBy: createdBy || 'anonymous',
      changedAt: now,
    }];

    // Use mock if Firebase not configured
    if (!isFirebaseConfigured()) {
      const result = await mockFeedbacksApi.create({
        projectId,
        title,
        description,
        screenshot: screenshot || undefined,
        audioUrl: audioUrl || undefined,
        attachments,
        clickPosition: clickPosition as ClickPosition,
        status: 'new',
        statusHistory: initialStatusHistory,
        priority,
        deadline: deadline ? new Date(deadline) : undefined,
        createdBy: createdBy || 'anonymous',
      });

      return NextResponse.json(
        {
          success: true,
          feedbackId: result.id,
          number: result.number,
          message: `Feedback #${result.number} criado com sucesso! (modo demo)`,
        },
        { status: 201 }
      );
    }

    // Use Firebase
    const adminDb = getAdminDb();
    const feedbacksRef = adminDb.collection('feedbacks');
    const existingFeedbacks = await feedbacksRef
      .where('projectId', '==', projectId)
      .orderBy('number', 'desc')
      .limit(1)
      .get();

    const nextNumber = existingFeedbacks.empty
      ? 1
      : (existingFeedbacks.docs[0].data().number || 0) + 1;

    const firebaseNow = new Date();

    // Build feedback data, excluding undefined values (Firestore doesn't accept undefined)
    const feedbackData: Record<string, unknown> = {
      projectId,
      number: nextNumber,
      title,
      description,
      attachments,
      clickPosition: clickPosition as ClickPosition,
      status: 'new',
      statusHistory: [{
        fromStatus: null,
        toStatus: 'new',
        changedBy: createdBy || 'anonymous',
        changedAt: firebaseNow,
      }],
      priority,
      createdBy: createdBy || 'anonymous',
      createdAt: firebaseNow,
      updatedAt: firebaseNow,
    };

    // Only add optional fields if they have values (Firestore rejects undefined)
    if (screenshot) feedbackData.screenshot = screenshot;
    if (audioUrl) feedbackData.audioUrl = audioUrl;
    if (deadline) feedbackData.deadline = new Date(deadline);

    const docRef = await feedbacksRef.add(feedbackData);

    await adminDb.collection('activity_log').add({
      projectId,
      feedbackId: docRef.id,
      action: 'feedback_created',
      details: { title, priority },
      performedBy: createdBy || 'anonymous',
      createdAt: now,
    });

    return NextResponse.json(
      {
        success: true,
        feedbackId: docRef.id,
        number: nextNumber,
        message: `Feedback #${nextNumber} criado com sucesso!`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

// GET /api/feedbacks?projectId=xxx - List feedbacks for a project
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    // Use mock if Firebase not configured
    if (!isFirebaseConfigured()) {
      let feedbacks = await mockFeedbacksApi.getByProject(projectId);
      if (status) {
        feedbacks = feedbacks.filter((f) => f.status === status);
      }
      feedbacks = feedbacks.slice(0, limit);

      return NextResponse.json({
        success: true,
        feedbacks,
        total: feedbacks.length,
        mode: 'demo',
      });
    }

    // Try to use Firebase
    try {
      const adminDb = getAdminDb();
      let query = adminDb
        .collection('feedbacks')
        .where('projectId', '==', projectId)
        .orderBy('createdAt', 'desc')
        .limit(limit);

      if (status) {
        query = query.where('status', '==', status);
      }

      const snapshot = await query.get();

      const feedbacks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return NextResponse.json({
        success: true,
        feedbacks,
        total: feedbacks.length,
      });
    } catch (firebaseError) {
      // Firebase failed, fall back to mock
      console.error('[API/feedbacks GET] Firebase failed, using mock:', firebaseError);
      let feedbacks = await mockFeedbacksApi.getByProject(projectId);
      if (status) {
        feedbacks = feedbacks.filter((f) => f.status === status);
      }
      feedbacks = feedbacks.slice(0, limit);

      return NextResponse.json({
        success: true,
        feedbacks,
        total: feedbacks.length,
        mode: 'fallback',
      });
    }
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
