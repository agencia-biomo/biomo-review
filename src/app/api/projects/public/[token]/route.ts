import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { isFirebaseConfigured, mockProjectsApi, mockFeedbacksApi } from '@/lib/mock-db';

interface RouteParams {
  params: Promise<{ token: string }>;
}

// GET /api/projects/public/[token] - Get project by public token
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;

    // Use mock if Firebase not configured
    if (!isFirebaseConfigured()) {
      const project = await mockProjectsApi.getByToken(token);

      if (!project) {
        return NextResponse.json(
          { error: 'Project not found or access disabled' },
          { status: 404 }
        );
      }

      const feedbacks = await mockFeedbacksApi.getByProjectId(project.id);

      return NextResponse.json({
        success: true,
        project,
        feedbacks,
        mode: 'demo',
      });
    }

    // Use Firebase
    const adminDb = getAdminDb();

    // Find project by public access token
    const snapshot = await adminDb
      .collection('projects')
      .where('publicAccessToken', '==', token)
      .where('publicAccessEnabled', '==', true)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json(
        { error: 'Project not found or access disabled' },
        { status: 404 }
      );
    }

    const doc = snapshot.docs[0];
    const project = { id: doc.id, ...doc.data() };

    // Get feedbacks for this project
    const feedbacksSnapshot = await adminDb
      .collection('feedbacks')
      .where('projectId', '==', doc.id)
      .orderBy('createdAt', 'desc')
      .get();

    const feedbacks = feedbacksSnapshot.docs.map((feedbackDoc) => ({
      id: feedbackDoc.id,
      ...feedbackDoc.data(),
    }));

    return NextResponse.json({
      success: true,
      project,
      feedbacks,
    });
  } catch (error) {
    console.error('Error fetching project by token:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
