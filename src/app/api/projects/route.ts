import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { isFirebaseConfigured, mockProjectsApi } from '@/lib/mock-db';
import { Project } from '@/types';
import crypto from 'crypto';

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name,
      description,
      siteUrl,
      clientId,
      teamId,
      createdBy,
    } = body;

    // Validate required fields
    if (!name || !siteUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: name, siteUrl' },
        { status: 400 }
      );
    }

    // Generate public access token
    const publicAccessToken = crypto.randomBytes(16).toString('hex');

    // Use mock if Firebase not configured
    if (!isFirebaseConfigured()) {
      const result = await mockProjectsApi.create({
        name,
        description: description || '',
        siteUrl,
        clientId: clientId || '',
        teamId: teamId || '',
        status: 'active',
        publicAccessEnabled: true,
        publicAccessToken,
        createdBy: createdBy || 'system',
      });

      return NextResponse.json(
        {
          success: true,
          projectId: result.id,
          publicAccessToken,
          message: `Projeto "${name}" criado com sucesso! (modo demo)`,
        },
        { status: 201 }
      );
    }

    // Use Firebase
    const adminDb = getAdminDb();
    const now = new Date();
    const projectData: Omit<Project, 'id'> = {
      name,
      description: description || '',
      siteUrl,
      clientId: clientId || '',
      teamId: teamId || '',
      status: 'active',
      publicAccessEnabled: true,
      publicAccessToken,
      createdAt: now,
      updatedAt: now,
      createdBy: createdBy || 'system',
    };

    const docRef = await adminDb.collection('projects').add(projectData);

    return NextResponse.json(
      {
        success: true,
        projectId: docRef.id,
        publicAccessToken,
        message: `Projeto "${name}" criado com sucesso!`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

// GET /api/projects - List all projects
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');
    const teamId = searchParams.get('teamId');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Use mock if Firebase not configured
    if (!isFirebaseConfigured()) {
      let projects = await mockProjectsApi.getAll();

      // Apply filters
      if (status) {
        projects = projects.filter((p) => p.status === status);
      }
      if (clientId) {
        projects = projects.filter((p) => p.clientId === clientId);
      }
      if (teamId) {
        projects = projects.filter((p) => p.teamId === teamId);
      }
      projects = projects.slice(0, limit);

      return NextResponse.json({
        success: true,
        projects,
        total: projects.length,
        mode: 'demo',
      });
    }

    // Use Firebase
    const adminDb = getAdminDb();
    const query = adminDb
      .collection('projects')
      .orderBy('createdAt', 'desc')
      .limit(limit);

    const snapshot = await query.get();

    let projects = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as (Project & { id: string })[];

    // Apply filters in memory
    if (status) {
      projects = projects.filter((p) => p.status === status);
    }
    if (clientId) {
      projects = projects.filter((p) => p.clientId === clientId);
    }
    if (teamId) {
      projects = projects.filter((p) => p.teamId === teamId);
    }

    return NextResponse.json({
      success: true,
      projects,
      total: projects.length,
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
