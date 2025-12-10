import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { isFirebaseConfigured } from '@/lib/mock-db';
import { Client } from '@/types';
import crypto from 'crypto';

// Generate secure access token
function generateAccessToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Mock clients for demo
const mockClients: (Client & { id: string })[] = [
  {
    id: 'client-1',
    name: 'Empresa ABC',
    email: 'contato@empresaabc.com',
    phone: '(11) 99999-9999',
    company: 'Empresa ABC Ltda',
    assignedTeamId: 'team-dev',
    accessToken: 'demo-token-abc',
    createdAt: new Date('2024-01-01'),
    createdBy: 'admin-1',
  },
  {
    id: 'client-2',
    name: 'Cliente XYZ',
    email: 'contato@xyz.com',
    company: 'XYZ Serviços',
    assignedTeamId: 'team-dev',
    accessToken: 'demo-token-xyz',
    createdAt: new Date('2024-02-01'),
    createdBy: 'admin-1',
  },
];

// GET /api/clients - List all clients
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    // Use mock if Firebase not configured
    if (!isFirebaseConfigured()) {
      let clients = [...mockClients];
      if (teamId) {
        clients = clients.filter(c => c.assignedTeamId === teamId);
      }
      return NextResponse.json({
        success: true,
        clients,
        total: clients.length,
        mode: 'demo',
      });
    }

    // Use Firebase
    const adminDb = getAdminDb();
    let query = adminDb.collection('clients').orderBy('name', 'asc');

    if (teamId) {
      query = adminDb.collection('clients')
        .where('assignedTeamId', '==', teamId)
        .orderBy('name', 'asc');
    }

    const snapshot = await query.get();
    const clients = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      clients,
      total: clients.length,
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/clients - Create new client
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, company, logo, assignedTeamId, createdBy } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email' },
        { status: 400 }
      );
    }

    const accessToken = generateAccessToken();

    // Use mock if Firebase not configured
    if (!isFirebaseConfigured()) {
      const newClient = {
        id: `client-${Date.now()}`,
        name,
        email,
        phone,
        company,
        logo,
        assignedTeamId: assignedTeamId || 'team-dev',
        accessToken,
        createdAt: new Date(),
        createdBy: createdBy || 'admin',
      };
      mockClients.push(newClient);

      return NextResponse.json({
        success: true,
        clientId: newClient.id,
        accessToken,
        message: 'Cliente criado com sucesso! (modo demo)',
      }, { status: 201 });
    }

    // Use Firebase
    const adminDb = getAdminDb();

    // Check if email already exists
    const existingClient = await adminDb.collection('clients')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!existingClient.empty) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 409 }
      );
    }

    const now = new Date();
    const clientData: Record<string, unknown> = {
      name,
      email,
      accessToken,
      createdAt: now,
      createdBy: createdBy || 'admin',
    };

    // Only add optional fields if they have values
    if (phone) clientData.phone = phone;
    if (company) clientData.company = company;
    if (logo) clientData.logo = logo;
    if (assignedTeamId) clientData.assignedTeamId = assignedTeamId;

    const docRef = await adminDb.collection('clients').add(clientData);

    return NextResponse.json({
      success: true,
      clientId: docRef.id,
      accessToken,
      message: 'Cliente criado com sucesso!',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
