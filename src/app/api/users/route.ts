import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { isFirebaseConfigured } from '@/lib/mock-db';
import { User, UserRole } from '@/types';

// Mock users for demo
const mockUsers: (User & { id: string })[] = [
  {
    id: 'admin-1',
    email: 'admin@biomo.com.br',
    name: 'Administrador',
    role: 'admin',
    createdAt: new Date('2024-01-01'),
    lastLoginAt: new Date(),
  },
  {
    id: 'team-1',
    email: 'joao@biomo.com.br',
    name: 'João Silva',
    role: 'team',
    teamId: 'team-dev',
    createdAt: new Date('2024-01-15'),
    lastLoginAt: new Date(),
  },
  {
    id: 'team-2',
    email: 'maria@biomo.com.br',
    name: 'Maria Santos',
    role: 'team',
    teamId: 'team-dev',
    createdAt: new Date('2024-02-01'),
    lastLoginAt: new Date(),
  },
];

// GET /api/users - List all users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') as UserRole | null;

    // Use mock if Firebase not configured
    if (!isFirebaseConfigured()) {
      let users = [...mockUsers];
      if (role) {
        users = users.filter(u => u.role === role);
      }
      return NextResponse.json({
        success: true,
        users,
        total: users.length,
        mode: 'demo',
      });
    }

    // Use Firebase
    const adminDb = getAdminDb();
    let query = adminDb.collection('users').orderBy('name', 'asc');

    if (role) {
      query = adminDb.collection('users')
        .where('role', '==', role)
        .orderBy('name', 'asc');
    }

    const snapshot = await query.get();
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      users,
      total: users.length,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, role, teamId, avatar } = body;

    // Validate required fields
    if (!email || !name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: email, name, role' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['admin', 'team', 'client'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be: admin, team, or client' },
        { status: 400 }
      );
    }

    // Use mock if Firebase not configured
    if (!isFirebaseConfigured()) {
      const newUser = {
        id: `user-${Date.now()}`,
        email,
        name,
        role,
        teamId,
        avatar,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };
      mockUsers.push(newUser);

      return NextResponse.json({
        success: true,
        userId: newUser.id,
        message: 'Usuário criado com sucesso! (modo demo)',
      }, { status: 201 });
    }

    // Use Firebase
    const adminDb = getAdminDb();

    // Check if email already exists
    const existingUser = await adminDb.collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!existingUser.empty) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 409 }
      );
    }

    const now = new Date();
    const userData: Omit<User, 'id'> = {
      email,
      name,
      role,
      avatar,
      createdAt: now,
      lastLoginAt: now,
    };

    if (teamId) {
      userData.teamId = teamId;
    }

    const docRef = await adminDb.collection('users').add(userData);

    return NextResponse.json({
      success: true,
      userId: docRef.id,
      message: 'Usuário criado com sucesso!',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
