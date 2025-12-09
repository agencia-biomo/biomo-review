import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { isFirebaseConfigured, mockCommentsApi } from '@/lib/mock-db';
import { Comment } from '@/types';

// POST /api/comments - Create new comment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { feedbackId, content, authorId, authorRole, mentions } = body;

    // Validate required fields
    if (!feedbackId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: feedbackId, content' },
        { status: 400 }
      );
    }

    // Extract mentions from content (@username)
    const extractedMentions = content.match(/@\w+/g)?.map((m: string) => m.slice(1)) || [];
    const allMentions = [...new Set([...(mentions || []), ...extractedMentions])];

    // Use mock if Firebase not configured
    if (!isFirebaseConfigured()) {
      const result = await mockCommentsApi.create({
        feedbackId,
        content,
        authorId: authorId || 'anonymous',
        authorRole: authorRole || 'client',
        mentions: allMentions,
        attachments: [],
      });

      return NextResponse.json(
        {
          success: true,
          commentId: result.id,
          message: 'Comentario adicionado com sucesso! (modo demo)',
        },
        { status: 201 }
      );
    }

    // Use Firebase
    const adminDb = getAdminDb();
    const now = new Date();
    const commentData: Omit<Comment, 'id'> = {
      feedbackId,
      content,
      authorId: authorId || 'anonymous',
      authorRole: authorRole || 'client',
      mentions: allMentions,
      attachments: [],
      createdAt: now,
    };

    const docRef = await adminDb.collection('comments').add(commentData);

    // Update feedback updatedAt
    await adminDb.collection('feedbacks').doc(feedbackId).update({
      updatedAt: now,
    });

    return NextResponse.json(
      {
        success: true,
        commentId: docRef.id,
        message: 'Comentario adicionado com sucesso!',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

// GET /api/comments?feedbackId=xxx - List comments for a feedback
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const feedbackId = searchParams.get('feedbackId');

    if (!feedbackId) {
      return NextResponse.json(
        { error: 'feedbackId is required' },
        { status: 400 }
      );
    }

    // Use mock if Firebase not configured
    if (!isFirebaseConfigured()) {
      const comments = await mockCommentsApi.getByFeedbackId(feedbackId);

      return NextResponse.json({
        success: true,
        comments,
        total: comments.length,
        mode: 'demo',
      });
    }

    // Use Firebase
    const adminDb = getAdminDb();
    const snapshot = await adminDb
      .collection('comments')
      .where('feedbackId', '==', feedbackId)
      .orderBy('createdAt', 'asc')
      .get();

    const comments = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      comments,
      total: comments.length,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
