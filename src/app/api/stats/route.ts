import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { isFirebaseConfigured, mockFeedbacksApi, mockProjectsApi } from '@/lib/mock-db';

// GET /api/stats - Get dashboard statistics
export async function GET() {
  try {
    // Use mock if Firebase not configured
    if (!isFirebaseConfigured()) {
      const projects = await mockProjectsApi.getAll();

      // Get all feedbacks from all projects
      let allFeedbacks: Array<{ status: string; priority: string; createdAt: Date; completedAt?: Date }> = [];
      for (const project of projects) {
        const feedbacks = await mockFeedbacksApi.getByProject(project.id);
        allFeedbacks = [...allFeedbacks, ...feedbacks];
      }

      const now = new Date();
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      // Calculate stats
      const totalProjects = projects.length;
      const totalFeedbacks = allFeedbacks.length;
      const newThisWeek = projects.filter(p => new Date(p.createdAt) > weekAgo).length;

      const feedbacksByStatus = {
        new: allFeedbacks.filter(f => f.status === 'new').length,
        in_review: allFeedbacks.filter(f => f.status === 'in_review').length,
        in_progress: allFeedbacks.filter(f => f.status === 'in_progress').length,
        waiting_client: allFeedbacks.filter(f => f.status === 'waiting_client').length,
        rejected: allFeedbacks.filter(f => f.status === 'rejected').length,
        completed: allFeedbacks.filter(f => f.status === 'completed').length,
      };

      const feedbacksByPriority = {
        low: allFeedbacks.filter(f => f.priority === 'low').length,
        medium: allFeedbacks.filter(f => f.priority === 'medium').length,
        high: allFeedbacks.filter(f => f.priority === 'high').length,
        urgent: allFeedbacks.filter(f => f.priority === 'urgent').length,
      };

      const pendingCount = feedbacksByStatus.new + feedbacksByStatus.in_review + feedbacksByStatus.in_progress;
      const completedThisMonth = allFeedbacks.filter(f =>
        f.status === 'completed' &&
        f.completedAt &&
        new Date(f.completedAt) > monthAgo
      ).length;

      // Calculate average resolution time (in days)
      const completedFeedbacks = allFeedbacks.filter(f => f.status === 'completed' && f.completedAt);
      let avgResolutionDays = 0;
      if (completedFeedbacks.length > 0) {
        const totalDays = completedFeedbacks.reduce((sum, f) => {
          const created = new Date(f.createdAt).getTime();
          const completed = new Date(f.completedAt!).getTime();
          return sum + (completed - created) / (1000 * 60 * 60 * 24);
        }, 0);
        avgResolutionDays = Math.round(totalDays / completedFeedbacks.length);
      }

      return NextResponse.json({
        success: true,
        stats: {
          totalProjects,
          totalFeedbacks,
          newThisWeek,
          pendingCount,
          completedThisMonth,
          avgResolutionDays,
          feedbacksByStatus,
          feedbacksByPriority,
        },
        mode: 'demo',
      });
    }

    // Use Firebase
    const adminDb = getAdminDb();

    // Get all projects
    const projectsSnapshot = await adminDb.collection('projects').get();
    const totalProjects = projectsSnapshot.size;

    // Get all feedbacks
    const feedbacksSnapshot = await adminDb.collection('feedbacks').get();
    const allFeedbacks = feedbacksSnapshot.docs.map(doc => doc.data());
    const totalFeedbacks = allFeedbacks.length;

    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    // Calculate stats
    const newThisWeek = projectsSnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.createdAt?.toDate() > weekAgo;
    }).length;

    const feedbacksByStatus = {
      new: allFeedbacks.filter(f => f.status === 'new').length,
      in_review: allFeedbacks.filter(f => f.status === 'in_review').length,
      in_progress: allFeedbacks.filter(f => f.status === 'in_progress').length,
      waiting_client: allFeedbacks.filter(f => f.status === 'waiting_client').length,
      rejected: allFeedbacks.filter(f => f.status === 'rejected').length,
      completed: allFeedbacks.filter(f => f.status === 'completed').length,
    };

    const feedbacksByPriority = {
      low: allFeedbacks.filter(f => f.priority === 'low').length,
      medium: allFeedbacks.filter(f => f.priority === 'medium').length,
      high: allFeedbacks.filter(f => f.priority === 'high').length,
      urgent: allFeedbacks.filter(f => f.priority === 'urgent').length,
    };

    const pendingCount = feedbacksByStatus.new + feedbacksByStatus.in_review + feedbacksByStatus.in_progress;

    const completedThisMonth = allFeedbacks.filter(f =>
      f.status === 'completed' &&
      f.completedAt?.toDate() > monthAgo
    ).length;

    // Calculate average resolution time
    const completedFeedbacks = allFeedbacks.filter(f => f.status === 'completed' && f.completedAt);
    let avgResolutionDays = 0;
    if (completedFeedbacks.length > 0) {
      const totalDays = completedFeedbacks.reduce((sum, f) => {
        const created = f.createdAt?.toDate?.() || new Date(f.createdAt);
        const completed = f.completedAt?.toDate?.() || new Date(f.completedAt);
        return sum + (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      }, 0);
      avgResolutionDays = Math.round(totalDays / completedFeedbacks.length);
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalProjects,
        totalFeedbacks,
        newThisWeek,
        pendingCount,
        completedThisMonth,
        avgResolutionDays,
        feedbacksByStatus,
        feedbacksByPriority,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
