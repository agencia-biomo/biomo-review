import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { isFirebaseConfigured, mockProjectsApi } from '@/lib/mock-db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/projects/[id] - Get single project
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Use mock if Firebase not configured
    if (!isFirebaseConfigured()) {
      const project = await mockProjectsApi.getById(id);
      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        project,
        mode: 'demo',
      });
    }

    // Use Firebase
    const adminDb = getAdminDb();
    const doc = await adminDb.collection('projects').doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      project: { id: doc.id, ...doc.data() },
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[id] - Update project
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { name, description, siteUrl, status, publicAccessEnabled } = body;

    // Use mock if Firebase not configured
    if (!isFirebaseConfigured()) {
      const updateData: Record<string, unknown> = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (siteUrl !== undefined) updateData.siteUrl = siteUrl;
      if (status !== undefined) updateData.status = status;
      if (publicAccessEnabled !== undefined) {
        updateData.publicAccessEnabled = publicAccessEnabled;
      }

      const success = await mockProjectsApi.update(id, updateData);
      if (!success) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Projeto atualizado com sucesso! (modo demo)',
      });
    }

    // Use Firebase
    const adminDb = getAdminDb();
    const docRef = adminDb.collection('projects').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (siteUrl !== undefined) updateData.siteUrl = siteUrl;
    if (status !== undefined) updateData.status = status;
    if (publicAccessEnabled !== undefined) {
      updateData.publicAccessEnabled = publicAccessEnabled;
    }

    await docRef.update(updateData);

    return NextResponse.json({
      success: true,
      message: 'Projeto atualizado com sucesso!',
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Use mock if Firebase not configured
    if (!isFirebaseConfigured()) {
      const success = await mockProjectsApi.delete(id);
      if (!success) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        message: 'Projeto removido com sucesso! (modo demo)',
      });
    }

    // Use Firebase
    const adminDb = getAdminDb();
    const docRef = adminDb.collection('projects').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Also delete all feedbacks for this project
    const feedbacksSnapshot = await adminDb
      .collection('feedbacks')
      .where('projectId', '==', id)
      .get();

    const batch = adminDb.batch();
    feedbacksSnapshot.docs.forEach((feedbackDoc) => {
      batch.delete(feedbackDoc.ref);
    });
    batch.delete(docRef);

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: 'Projeto e feedbacks removidos com sucesso!',
      deletedFeedbacks: feedbacksSnapshot.size,
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
