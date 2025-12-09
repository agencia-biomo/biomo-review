import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { isFirebaseConfigured } from '@/lib/mock-db';
import { Notification, NotificationType } from '@/types';

// In-memory notifications for demo mode
const mockNotifications: Map<string, Notification & { id: string }> = new Map();

// POST /api/notifications - Create notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type, title, message, feedbackId, projectId } = body;

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, type, title, message' },
        { status: 400 }
      );
    }

    const now = new Date();
    const notificationData: Omit<Notification, 'id'> = {
      userId,
      type: type as NotificationType,
      title,
      message,
      feedbackId,
      projectId,
      read: false,
      createdAt: now,
    };

    // Use mock if Firebase not configured
    if (!isFirebaseConfigured()) {
      const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      mockNotifications.set(id, { ...notificationData, id });

      return NextResponse.json({
        success: true,
        notificationId: id,
        mode: 'demo',
      });
    }

    // Use Firebase
    const adminDb = getAdminDb();
    const docRef = await adminDb.collection('notifications').add(notificationData);

    return NextResponse.json({
      success: true,
      notificationId: docRef.id,
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

// GET /api/notifications?userId=xxx - Get user notifications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Use mock if Firebase not configured
    if (!isFirebaseConfigured()) {
      let notifications = Array.from(mockNotifications.values())
        .filter(n => n.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      if (unreadOnly) {
        notifications = notifications.filter(n => !n.read);
      }

      notifications = notifications.slice(0, limit);

      return NextResponse.json({
        success: true,
        notifications,
        unreadCount: notifications.filter(n => !n.read).length,
        mode: 'demo',
      });
    }

    // Use Firebase
    const adminDb = getAdminDb();
    let query = adminDb
      .collection('notifications')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (unreadOnly) {
      query = query.where('read', '==', false);
    }

    const snapshot = await query.get();
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Count unread
    const unreadSnapshot = await adminDb
      .collection('notifications')
      .where('userId', '==', userId)
      .where('read', '==', false)
      .count()
      .get();

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount: unreadSnapshot.data().count,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationIds, markAllRead, userId } = body;

    // Use mock if Firebase not configured
    if (!isFirebaseConfigured()) {
      if (markAllRead && userId) {
        mockNotifications.forEach((notif, id) => {
          if (notif.userId === userId) {
            mockNotifications.set(id, { ...notif, read: true, readAt: new Date() });
          }
        });
      } else if (notificationIds) {
        notificationIds.forEach((id: string) => {
          const notif = mockNotifications.get(id);
          if (notif) {
            mockNotifications.set(id, { ...notif, read: true, readAt: new Date() });
          }
        });
      }

      return NextResponse.json({
        success: true,
        mode: 'demo',
      });
    }

    // Use Firebase
    const adminDb = getAdminDb();
    const batch = adminDb.batch();
    const now = new Date();

    if (markAllRead && userId) {
      const snapshot = await adminDb
        .collection('notifications')
        .where('userId', '==', userId)
        .where('read', '==', false)
        .get();

      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { read: true, readAt: now });
      });
    } else if (notificationIds) {
      for (const id of notificationIds) {
        const ref = adminDb.collection('notifications').doc(id);
        batch.update(ref, { read: true, readAt: now });
      }
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
