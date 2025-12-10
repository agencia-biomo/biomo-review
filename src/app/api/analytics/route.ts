import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { isFirebaseConfigured, mockFeedbacksApi, mockProjectsApi } from '@/lib/mock-db';
import { FeedbackStatus, FeedbackPriority } from '@/types';

interface AnalyticsParams {
  days?: number;
  projectId?: string;
}

// GET /api/analytics - Get comprehensive analytics data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const projectId = searchParams.get('projectId') || undefined;

    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    // Status and priority arrays for type safety
    const statuses: FeedbackStatus[] = ['new', 'in_review', 'in_progress', 'waiting_client', 'rejected', 'completed'];
    const priorities: FeedbackPriority[] = ['low', 'medium', 'high', 'urgent'];

    // Use mock if Firebase not configured
    if (!isFirebaseConfigured()) {
      const projects = await mockProjectsApi.getAll();

      // Get all feedbacks
      let allFeedbacks: Array<{
        id: string;
        status: string;
        priority: string;
        createdAt: Date;
        updatedAt: Date;
        completedAt?: Date;
        projectId: string;
      }> = [];

      for (const project of projects) {
        if (projectId && project.id !== projectId) continue;
        const feedbacks = await mockFeedbacksApi.getByProject(project.id);
        allFeedbacks = [...allFeedbacks, ...feedbacks.map(f => ({
          id: f.id,
          status: f.status,
          priority: f.priority,
          createdAt: new Date(f.createdAt),
          updatedAt: new Date(f.updatedAt),
          completedAt: f.completedAt ? new Date(f.completedAt) : undefined,
          projectId: f.projectId,
        }))];
      }

      // Generate time series data (feedbacks per day)
      const feedbacksByDay: Array<{ date: string; count: number; label: string }> = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const count = allFeedbacks.filter(f => {
          const feedbackDate = new Date(f.createdAt).toISOString().split('T')[0];
          return feedbackDate === dateStr;
        }).length;
        feedbacksByDay.push({
          date: dateStr,
          count,
          label: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        });
      }

      // Status distribution
      const statusDistribution = statuses.map(status => ({
        status,
        count: allFeedbacks.filter(f => f.status === status).length,
      }));

      // Priority distribution
      const priorityDistribution = priorities.map(priority => ({
        priority,
        count: allFeedbacks.filter(f => f.priority === priority).length,
      }));

      // Average resolution time by status
      const resolutionByStatus = statuses
        .filter(s => s !== 'rejected')
        .map(status => {
          const statusFeedbacks = allFeedbacks.filter(f => f.status === status);
          let avgHours = 0;
          if (statusFeedbacks.length > 0) {
            const totalHours = statusFeedbacks.reduce((sum, f) => {
              const created = new Date(f.createdAt).getTime();
              const updated = new Date(f.updatedAt).getTime();
              return sum + (updated - created) / (1000 * 60 * 60);
            }, 0);
            avgHours = totalHours / statusFeedbacks.length;
          }
          const statusLabels: Record<string, string> = {
            new: 'Novo',
            in_review: 'Em Analise',
            in_progress: 'Em Andamento',
            waiting_client: 'Aguard. Cliente',
            completed: 'Concluido',
          };
          return { name: statusLabels[status] || status, avgHours };
        });

      // Summary metrics
      const totalFeedbacks = allFeedbacks.length;
      const completedFeedbacks = allFeedbacks.filter(f => f.status === 'completed');
      const completionRate = totalFeedbacks > 0
        ? Math.round((completedFeedbacks.length / totalFeedbacks) * 100)
        : 0;

      // Average resolution time for completed
      let avgResolutionHours = 0;
      if (completedFeedbacks.length > 0) {
        const totalHours = completedFeedbacks.reduce((sum, f) => {
          const created = new Date(f.createdAt).getTime();
          const completed = f.completedAt ? new Date(f.completedAt).getTime() : new Date(f.updatedAt).getTime();
          return sum + (completed - created) / (1000 * 60 * 60);
        }, 0);
        avgResolutionHours = Math.round(totalHours / completedFeedbacks.length);
      }

      // This period vs previous period comparison
      const prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - days);

      const thisMonthFeedbacks = allFeedbacks.filter(f => new Date(f.createdAt) >= startDate);
      const prevMonthFeedbacks = allFeedbacks.filter(f => {
        const date = new Date(f.createdAt);
        return date >= prevStartDate && date < startDate;
      });

      const feedbacksTrend = prevMonthFeedbacks.length > 0
        ? Math.round(((thisMonthFeedbacks.length - prevMonthFeedbacks.length) / prevMonthFeedbacks.length) * 100)
        : thisMonthFeedbacks.length > 0 ? 100 : 0;

      return NextResponse.json({
        success: true,
        analytics: {
          summary: {
            totalFeedbacks,
            feedbacksThisPeriod: thisMonthFeedbacks.length,
            completionRate,
            avgResolutionHours,
            feedbacksTrend,
          },
          feedbacksByDay,
          statusDistribution,
          priorityDistribution,
          resolutionByStatus,
          totalProjects: projects.length,
        },
        mode: 'demo',
        period: { days, startDate: startDate.toISOString(), endDate: now.toISOString() },
      });
    }

    // Use Firebase
    const adminDb = getAdminDb();

    // Query feedbacks
    let feedbacksQuery = adminDb.collection('feedbacks');
    if (projectId) {
      feedbacksQuery = feedbacksQuery.where('projectId', '==', projectId) as FirebaseFirestore.CollectionReference;
    }

    const feedbacksSnapshot = await feedbacksQuery.get();
    const allFeedbacks = feedbacksSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        status: data.status,
        priority: data.priority,
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
        completedAt: data.completedAt ? (data.completedAt?.toDate?.() || new Date(data.completedAt)) : undefined,
        projectId: data.projectId,
      };
    });

    // Generate time series data
    const feedbacksByDay: Array<{ date: string; count: number; label: string }> = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const count = allFeedbacks.filter(f => {
        const feedbackDate = f.createdAt.toISOString().split('T')[0];
        return feedbackDate === dateStr;
      }).length;
      feedbacksByDay.push({
        date: dateStr,
        count,
        label: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      });
    }

    // Status distribution
    const statusDistribution = statuses.map(status => ({
      status,
      count: allFeedbacks.filter(f => f.status === status).length,
    }));

    // Priority distribution
    const priorityDistribution = priorities.map(priority => ({
      priority,
      count: allFeedbacks.filter(f => f.priority === priority).length,
    }));

    // Resolution by status
    const resolutionByStatus = statuses
      .filter(s => s !== 'rejected')
      .map(status => {
        const statusFeedbacks = allFeedbacks.filter(f => f.status === status);
        let avgHours = 0;
        if (statusFeedbacks.length > 0) {
          const totalHours = statusFeedbacks.reduce((sum, f) => {
            const created = f.createdAt.getTime();
            const updated = f.updatedAt.getTime();
            return sum + (updated - created) / (1000 * 60 * 60);
          }, 0);
          avgHours = totalHours / statusFeedbacks.length;
        }
        const statusLabels: Record<string, string> = {
          new: 'Novo',
          in_review: 'Em Analise',
          in_progress: 'Em Andamento',
          waiting_client: 'Aguard. Cliente',
          completed: 'Concluido',
        };
        return { name: statusLabels[status] || status, avgHours };
      });

    // Summary
    const totalFeedbacks = allFeedbacks.length;
    const completedFeedbacks = allFeedbacks.filter(f => f.status === 'completed');
    const completionRate = totalFeedbacks > 0
      ? Math.round((completedFeedbacks.length / totalFeedbacks) * 100)
      : 0;

    let avgResolutionHours = 0;
    if (completedFeedbacks.length > 0) {
      const totalHours = completedFeedbacks.reduce((sum, f) => {
        const created = f.createdAt.getTime();
        const completed = f.completedAt ? f.completedAt.getTime() : f.updatedAt.getTime();
        return sum + (completed - created) / (1000 * 60 * 60);
      }, 0);
      avgResolutionHours = Math.round(totalHours / completedFeedbacks.length);
    }

    // Trend calculation
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - days);

    const thisMonthFeedbacks = allFeedbacks.filter(f => f.createdAt >= startDate);
    const prevMonthFeedbacks = allFeedbacks.filter(f => f.createdAt >= prevStartDate && f.createdAt < startDate);

    const feedbacksTrend = prevMonthFeedbacks.length > 0
      ? Math.round(((thisMonthFeedbacks.length - prevMonthFeedbacks.length) / prevMonthFeedbacks.length) * 100)
      : thisMonthFeedbacks.length > 0 ? 100 : 0;

    // Get projects count
    const projectsSnapshot = await adminDb.collection('projects').get();

    return NextResponse.json({
      success: true,
      analytics: {
        summary: {
          totalFeedbacks,
          feedbacksThisPeriod: thisMonthFeedbacks.length,
          completionRate,
          avgResolutionHours,
          feedbacksTrend,
        },
        feedbacksByDay,
        statusDistribution,
        priorityDistribution,
        resolutionByStatus,
        totalProjects: projectsSnapshot.size,
      },
      period: { days, startDate: startDate.toISOString(), endDate: now.toISOString() },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
