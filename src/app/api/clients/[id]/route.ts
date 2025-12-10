import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { isFirebaseConfigured } from '@/lib/mock-db';
import crypto from 'crypto';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Generate secure access token
function generateAccessToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// GET /api/clients/[id] - Get client by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Use mock if Firebase not configured
    if (!isFirebaseConfigured()) {
      return NextResponse.json({
        success: true,
        client: {
          id,
          name: 'Cliente Demo',
          email: 'demo@cliente.com',
          company: 'Empresa Demo',
          accessToken: 'demo-token',
          createdAt: new Date(),
          createdBy: 'admin',
        },
        mode: 'demo',
      });
    }

    // Use Firebase
    const adminDb = getAdminDb();
    const doc = await adminDb.collection('clients').doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      client: { id: doc.id, ...doc.data() },
    });
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

// PATCH /api/clients/[id] - Update client
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, email, phone, company, logo, assignedTeamId, regenerateToken } = body;

    // Use mock if Firebase not configured
    if (!isFirebaseConfigured()) {
      const response: Record<string, unknown> = {
        success: true,
        message: 'Cliente atualizado com sucesso! (modo demo)',
      };
      if (regenerateToken) {
        response.newAccessToken = generateAccessToken();
      }
      return NextResponse.json(response);
    }

    // Use Firebase
    const adminDb = getAdminDb();
    const docRef = adminDb.collection('clients').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (company !== undefined) updateData.company = company;
    if (logo !== undefined) updateData.logo = logo;
    if (assignedTeamId !== undefined) updateData.assignedTeamId = assignedTeamId;

    let newAccessToken: string | undefined;
    if (regenerateToken) {
      newAccessToken = generateAccessToken();
      updateData.accessToken = newAccessToken;
    }

    await docRef.update(updateData);

    const response: Record<string, unknown> = {
      success: true,
      message: 'Cliente atualizado com sucesso!',
    };
    if (newAccessToken) {
      response.newAccessToken = newAccessToken;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[id] - Delete client
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Use mock if Firebase not configured
    if (!isFirebaseConfigured()) {
      return NextResponse.json({
        success: true,
        message: 'Cliente removido com sucesso! (modo demo)',
      });
    }

    // Use Firebase
    const adminDb = getAdminDb();
    const docRef = adminDb.collection('clients').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    // Check if client has projects
    const projectsSnapshot = await adminDb.collection('projects')
      .where('clientId', '==', id)
      .limit(1)
      .get();

    if (!projectsSnapshot.empty) {
      return NextResponse.json(
        { error: 'Não é possível remover cliente com projetos associados' },
        { status: 400 }
      );
    }

    await docRef.delete();

    return NextResponse.json({
      success: true,
      message: 'Cliente removido com sucesso!',
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
