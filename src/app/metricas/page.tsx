"use client";

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNavProvider, MobileHeader } from "@/components/layout/MobileNav";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  FolderKanban,
  Loader2,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Feedback, Project, FeedbackStatus, STATUS_LABELS, STATUS_COLORS } from "@/types";

interface Stats {
  totalFeedbacks: number;
  byStatus: Record<FeedbackStatus, number>;
  byPriority: Record<string, number>;
  byProject: Record<string, { name: string; count: number }>;
  completedThisWeek: number;
  avgResolutionTime: number; // in hours
  trendsComparedToLastWeek: {
    newFeedbacks: number; // percentage change
    completed: number;
  };
}

export default function MetricasPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [projects, setProjects] = useState<(Project & { id: string })[]>([]);
  const [feedbacks, setFeedbacks] = useState<(Feedback & { id: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("30d");

  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [projectsRes, feedbacksRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/stats"),
      ]);

      const projectsData = await projectsRes.json();
      const feedbacksData = await feedbacksRes.json();

      if (projectsData.success) {
        setProjects(projectsData.projects || []);
      }

      // Get all feedbacks from all projects
      const allFeedbacks: (Feedback & { id: string })[] = [];
      for (const project of projectsData.projects || []) {
        const res = await fetch(`/api/feedbacks?projectId=${project.id}`);
        const data = await res.json();
        if (data.success) {
          allFeedbacks.push(...(data.feedbacks || []));
        }
      }
      setFeedbacks(allFeedbacks);

      // Calculate stats
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      const byStatus: Record<FeedbackStatus, number> = {
        new: 0,
        in_review: 0,
        in_progress: 0,
        waiting_client: 0,
        rejected: 0,
        completed: 0,
      };

      const byPriority: Record<string, number> = {
        low: 0,
        medium: 0,
        high: 0,
        urgent: 0,
      };

      const byProject: Record<string, { name: string; count: number }> = {};
      let completedThisWeek = 0;
      let completedLastWeek = 0;
      let newThisWeek = 0;
      let newLastWeek = 0;
      let totalResolutionTime = 0;
      let completedCount = 0;

      for (const feedback of allFeedbacks) {
        // By status
        byStatus[feedback.status] = (byStatus[feedback.status] || 0) + 1;

        // By priority
        byPriority[feedback.priority] = (byPriority[feedback.priority] || 0) + 1;

        // By project
        const project = (projectsData.projects || []).find((p: Project & { id: string }) => p.id === feedback.projectId);
        if (project) {
          if (!byProject[project.id]) {
            byProject[project.id] = { name: project.name, count: 0 };
          }
          byProject[project.id].count++;
        }

        // Completed this week
        const createdAt = parseDate(feedback.createdAt);
        const completedAt = feedback.completedAt ? parseDate(feedback.completedAt) : null;

        if (completedAt && completedAt >= weekAgo) {
          completedThisWeek++;
        }
        if (completedAt && completedAt >= twoWeeksAgo && completedAt < weekAgo) {
          completedLastWeek++;
        }

        // New this week
        if (createdAt >= weekAgo) {
          newThisWeek++;
        }
        if (createdAt >= twoWeeksAgo && createdAt < weekAgo) {
          newLastWeek++;
        }

        // Resolution time
        if (completedAt && createdAt) {
          const resolutionTime = completedAt.getTime() - createdAt.getTime();
          totalResolutionTime += resolutionTime;
          completedCount++;
        }
      }

      const avgResolutionTime = completedCount > 0
        ? totalResolutionTime / completedCount / (1000 * 60 * 60) // Convert to hours
        : 0;

      const newTrend = newLastWeek > 0 ? ((newThisWeek - newLastWeek) / newLastWeek) * 100 : 0;
      const completedTrend = completedLastWeek > 0 ? ((completedThisWeek - completedLastWeek) / completedLastWeek) * 100 : 0;

      setStats({
        totalFeedbacks: allFeedbacks.length,
        byStatus,
        byPriority,
        byProject,
        completedThisWeek,
        avgResolutionTime,
        trendsComparedToLastWeek: {
          newFeedbacks: newTrend,
          completed: completedTrend,
        },
      });
    } catch (error) {
      console.error("Error loading metrics:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Parse date helper
  function parseDate(date: Date | string | { seconds?: number; _seconds?: number } | undefined): Date {
    if (!date) return new Date(0);
    if (date instanceof Date) return date;
    if (typeof date === "string") return new Date(date);
    if (typeof date === "object") {
      const seconds = "seconds" in date ? date.seconds : "_seconds" in date ? date._seconds : 0;
      return new Date((seconds || 0) * 1000);
    }
    return new Date(0);
  }

  // Status bar chart
  const maxStatusCount = stats ? Math.max(...Object.values(stats.byStatus)) : 0;

  return (
    <MobileNavProvider>
      <div className="min-h-screen bg-[#09090B] flex flex-col lg:flex-row">
        <MobileHeader />
        <Sidebar />

        <main className="flex-1 overflow-auto">
          {/* Header */}
          <div className="border-b border-white/10 bg-[#0A0A0A]/80 backdrop-blur-xl sticky top-0 z-10">
            <div className="px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-purple-400" />
                    Métricas
                  </h1>
                  <p className="text-sm text-white/50 mt-1">Acompanhe o desempenho dos projetos</p>
                </div>

                {/* Date Range Filter */}
                <div className="flex gap-2">
                  {(["7d", "30d", "90d"] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => setDateRange(range)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        dateRange === range
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          : "text-white/50 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {range === "7d" ? "7 dias" : range === "30d" ? "30 dias" : "90 dias"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
            </div>
          ) : stats ? (
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
              {/* KPI Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Total Feedbacks */}
                <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-white/50">Total de Feedbacks</span>
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <FolderKanban className="w-5 h-5 text-purple-400" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-white">{stats.totalFeedbacks}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {stats.trendsComparedToLastWeek.newFeedbacks >= 0 ? (
                      <ArrowUpRight className="w-4 h-4 text-green-400" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-red-400" />
                    )}
                    <span className={`text-sm ${stats.trendsComparedToLastWeek.newFeedbacks >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {Math.abs(stats.trendsComparedToLastWeek.newFeedbacks).toFixed(0)}%
                    </span>
                    <span className="text-xs text-white/40">vs semana anterior</span>
                  </div>
                </div>

                {/* Completed This Week */}
                <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-white/50">Concluídos esta semana</span>
                    <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-white">{stats.completedThisWeek}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {stats.trendsComparedToLastWeek.completed >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    )}
                    <span className={`text-sm ${stats.trendsComparedToLastWeek.completed >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {Math.abs(stats.trendsComparedToLastWeek.completed).toFixed(0)}%
                    </span>
                    <span className="text-xs text-white/40">vs semana anterior</span>
                  </div>
                </div>

                {/* Avg Resolution Time */}
                <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-white/50">Tempo médio resolução</span>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-blue-400" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-white">
                    {stats.avgResolutionTime < 24
                      ? `${stats.avgResolutionTime.toFixed(0)}h`
                      : `${(stats.avgResolutionTime / 24).toFixed(1)}d`}
                  </p>
                  <p className="text-xs text-white/40 mt-2">Média de todos os feedbacks</p>
                </div>

                {/* Pending */}
                <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-white/50">Pendentes</span>
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-yellow-400" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-white">
                    {stats.byStatus.new + stats.byStatus.in_review + stats.byStatus.in_progress}
                  </p>
                  <p className="text-xs text-white/40 mt-2">
                    {stats.byStatus.new} novos, {stats.byStatus.in_progress} em andamento
                  </p>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Status Distribution */}
                <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                  <h3 className="text-lg font-semibold text-white mb-4">Por Status</h3>
                  <div className="space-y-3">
                    {(Object.keys(stats.byStatus) as FeedbackStatus[]).map((status) => {
                      const count = stats.byStatus[status];
                      const percentage = maxStatusCount > 0 ? (count / maxStatusCount) * 100 : 0;
                      const colorClass = STATUS_COLORS[status].replace("bg-", "");

                      return (
                        <div key={status}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-white/70">{STATUS_LABELS[status]}</span>
                            <span className="text-sm font-medium text-white">{count}</span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-${colorClass} rounded-full transition-all duration-500`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* By Project */}
                <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                  <h3 className="text-lg font-semibold text-white mb-4">Por Projeto</h3>
                  {Object.keys(stats.byProject).length === 0 ? (
                    <p className="text-white/50 text-sm">Nenhum projeto com feedbacks</p>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(stats.byProject)
                        .sort(([, a], [, b]) => b.count - a.count)
                        .slice(0, 5)
                        .map(([projectId, { name, count }]) => {
                          const maxCount = Math.max(...Object.values(stats.byProject).map((p) => p.count));
                          const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

                          return (
                            <div key={projectId}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-white/70 truncate max-w-[200px]">{name}</span>
                                <span className="text-sm font-medium text-white">{count}</span>
                              </div>
                              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>

              {/* Priority Distribution */}
              <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-white mb-4">Por Prioridade</h3>
                <div className="grid gap-4 sm:grid-cols-4">
                  {[
                    { key: "urgent", label: "Urgente", color: "red" },
                    { key: "high", label: "Alta", color: "orange" },
                    { key: "medium", label: "Média", color: "yellow" },
                    { key: "low", label: "Baixa", color: "gray" },
                  ].map(({ key, label, color }) => (
                    <div
                      key={key}
                      className={`p-4 rounded-xl bg-${color}-500/10 border border-${color}-500/20`}
                    >
                      <p className={`text-2xl font-bold text-${color}-400`}>
                        {stats.byPriority[key] || 0}
                      </p>
                      <p className="text-sm text-white/50">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Resumo</h3>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-sm text-white/50">Taxa de conclusão</p>
                    <p className="text-xl font-bold text-white">
                      {stats.totalFeedbacks > 0
                        ? ((stats.byStatus.completed / stats.totalFeedbacks) * 100).toFixed(0)
                        : 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-white/50">Projetos ativos</p>
                    <p className="text-xl font-bold text-white">{projects.filter(p => p.status === "active").length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/50">Feedbacks urgentes</p>
                    <p className="text-xl font-bold text-red-400">{stats.byPriority.urgent || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-20">
              <p className="text-white/50">Erro ao carregar métricas</p>
            </div>
          )}
        </main>
      </div>
    </MobileNavProvider>
  );
}
