import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { isFirebaseConfigured, mockFeedbacksApi } from '@/lib/mock-db';
import { FeedbackStatus, StatusHistoryEntry } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/feedbacks/[id] - Get single feedback
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Use mock if Firebase not configured
    if (!isFirebaseConfigured()) {
      const feedback = await mockFeedbacksApi.getById(id);
      if (!feedback) {
        return NextResponse.json(
          { error: 'Feedback not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        feedback,
        mode: 'demo',
      });
    }

    // Use Firebase
    const adminDb = getAdminDb();
    const doc = await adminDb.collection('feedbacks').doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      feedback: { id: doc.id, ...doc.data() },
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

// PATCH /api/feedbacks/[id] - Update feedback
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    console.log('[API/feedbacks PATCH] Updating feedback:', id);
    console.log('[API/feedbacks PATCH] Firebase configured:', isFirebaseConfigured());

    const { status, priority, assignedTo, deadline, title, description, afterImage, changedBy, statusNote } = body;

    // Use mock if Firebase not configured
    if (!isFirebaseConfigured()) {
      // Get current feedback to check for status change
      const currentFeedback = await mockFeedbacksApi.getById(id);
      if (!currentFeedback) {
        return NextResponse.json(
          { error: 'Feedback not found' },
          { status: 404 }
        );
      }

      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      // Status update with history tracking
      if (status && status !== currentFeedback.status) {
        updateData.status = status as FeedbackStatus;
        if (status === 'completed') {
          updateData.completedAt = new Date();
        }

        // Add to status history (exclude undefined note)
        const newHistoryEntry: StatusHistoryEntry = {
          fromStatus: currentFeedback.status as FeedbackStatus,
          toStatus: status as FeedbackStatus,
          changedBy: changedBy || 'sistema',
          changedAt: new Date(),
        };
        // Only add note if it has a value (Firestore doesn't accept undefined)
        if (statusNote) {
          newHistoryEntry.note = statusNote;
        }

        const existingHistory = (currentFeedback.statusHistory as StatusHistoryEntry[]) || [];
        updateData.statusHistory = [...existingHistory, newHistoryEntry];
      }

      // Basic fields - only set if defined (avoid undefined in Firestore)
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (priority !== undefined) updateData.priority = priority;
      if (assignedTo !== undefined) updateData.assignedTo = assignedTo || null;
      if (afterImage !== undefined) updateData.afterImage = afterImage;

      // Deadline
      if (deadline !== undefined) {
        updateData.deadline = deadline ? new Date(deadline) : null;
      }

      const success = await mockFeedbacksApi.update(id, updateData);
      if (!success) {
        return NextResponse.json(
          { error: 'Feedback not found' },
          { status: 404 }
        );
      }

      // Return updated feedback
      const updatedFeedback = await mockFeedbacksApi.getById(id);
      return NextResponse.json({
        success: true,
        message: 'Feedback atualizado com sucesso!',
        feedback: updatedFeedback,
        mode: 'demo',
      });
    }

    // Helper function to build update data
    const buildUpdateData = (currentFeedback: { status?: string; statusHistory?: StatusHistoryEntry[] }) => {
      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      // Status update with history tracking
      if (status && status !== currentFeedback?.status) {
        updateData.status = status as FeedbackStatus;
        if (status === 'completed') {
          updateData.completedAt = new Date();
        }

        // Add to status history (exclude undefined note - Firestore doesn't accept undefined)
        const newHistoryEntry: StatusHistoryEntry = {
          fromStatus: currentFeedback?.status as FeedbackStatus,
          toStatus: status as FeedbackStatus,
          changedBy: changedBy || 'sistema',
          changedAt: new Date(),
        };
        // Only add note if it has a value
        if (statusNote) {
          newHistoryEntry.note = statusNote;
        }

        const existingHistory = (currentFeedback?.statusHistory as StatusHistoryEntry[]) || [];
        updateData.statusHistory = [...existingHistory, newHistoryEntry];
      }

      // Basic fields - only set if defined
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (priority !== undefined) updateData.priority = priority;
      if (assignedTo !== undefined) updateData.assignedTo = assignedTo || null;
      if (afterImage !== undefined) updateData.afterImage = afterImage;

      // Deadline
      if (deadline !== undefined) {
        updateData.deadline = deadline ? new Date(deadline) : null;
      }

      return updateData;
    };

    // Try to use Firebase
    try {
      const adminDb = getAdminDb();
      const docRef = adminDb.collection('feedbacks').doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        return NextResponse.json(
          { error: 'Feedback not found' },
          { status: 404 }
        );
      }

      const currentData = doc.data();
      const updateData = buildUpdateData(currentData as { status?: string; statusHistory?: StatusHistoryEntry[] });

      await docRef.update(updateData);

      // Get updated doc
      const updatedDoc = await docRef.get();

      return NextResponse.json({
        success: true,
        message: 'Feedback atualizado com sucesso!',
        feedback: { id: updatedDoc.id, ...updatedDoc.data() },
      });
    } catch (firebaseError) {
      // Firebase failed - return the actual error instead of trying mock fallback
      // (mock is empty so it would always return 404 for real Firebase data)
      console.error('[API/feedbacks PATCH] Firebase failed:', firebaseError);

      const errorMessage = firebaseError instanceof Error ? firebaseError.message : String(firebaseError);

      return NextResponse.json(
        {
          error: 'Firebase connection error',
          details: errorMessage,
          suggestion: 'Check Firebase Admin credentials and permissions'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/feedbacks/[id] - Delete feedback
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Use mock if Firebase not configured
    if (!isFirebaseConfigured()) {
      const success = await mockFeedbacksApi.delete(id);
      if (!success) {
        return NextResponse.json(
          { error: 'Feedback not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        message: 'Feedback removido com sucesso! (modo demo)',
      });
    }

    // Use Firebase
    const adminDb = getAdminDb();
    const docRef = adminDb.collection('feedbacks').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      );
    }

    await docRef.delete();

    return NextResponse.json({
      success: true,
      message: 'Feedback removido com sucesso!',
    });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
