import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { isFirebaseConfigured } from '@/lib/mock-db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/users/[id] - Get user by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Use mock if Firebase not configured
    if (!isFirebaseConfigured()) {
      return NextResponse.json({
        success: true,
        user: {
          id,
          email: 'demo@biomo.com.br',
          name: 'Usuário Demo',
          role: 'team',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        },
        mode: 'demo',
      });
    }

    // Use Firebase
    const adminDb = getAdminDb();
    const doc = await adminDb.collection('users').doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: { id: doc.id, ...doc.data() },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

// PATCH /api/users/[id] - Update user
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, role, teamId, avatar, email } = body;

    // Use mock if Firebase not configured
    if (!isFirebaseConfigured()) {
      return NextResponse.json({
        success: true,
        message: 'Usuário atualizado com sucesso! (modo demo)',
      });
    }

    // Use Firebase
    const adminDb = getAdminDb();
    const docRef = adminDb.collection('users').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (teamId !== undefined) updateData.teamId = teamId;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (email !== undefined) updateData.email = email;

    await docRef.update(updateData);

    return NextResponse.json({
      success: true,
      message: 'Usuário atualizado com sucesso!',
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Use mock if Firebase not configured
    if (!isFirebaseConfigured()) {
      return NextResponse.json({
        success: true,
        message: 'Usuário removido com sucesso! (modo demo)',
      });
    }

    // Use Firebase
    const adminDb = getAdminDb();
    const docRef = adminDb.collection('users').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    await docRef.delete();

    return NextResponse.json({
      success: true,
      message: 'Usuário removido com sucesso!',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
