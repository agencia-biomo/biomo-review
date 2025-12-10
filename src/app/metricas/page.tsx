"use client";

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNavProvider, MobileHeader } from "@/components/layout/MobileNav";
import {
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle,
  FolderKanban,
  RefreshCw,
  Download,
  Target,
} from "lucide-react";
import { FeedbackStatus, FeedbackPriority } from "@/types";
import { MetricsPageContentSkeleton } from "@/components/skeletons";
import {
  MetricsCard,
  FeedbackTrendChart,
  StatusDistributionChart,
  ResolutionTimeChart,
  PriorityDistributionChart,
} from "@/components/analytics";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/useToast";

interface AnalyticsData {
  summary: {
    totalFeedbacks: number;
    feedbacksThisPeriod: number;
    completionRate: number;
    avgResolutionHours: number;
    feedbacksTrend: number;
  };
  feedbacksByDay: Array<{ date: string; count: number; label: string }>;
  statusDistribution: Array<{ status: FeedbackStatus; count: number }>;
  priorityDistribution: Array<{ priority: FeedbackPriority; count: number }>;
  resolutionByStatus: Array<{ name: string; avgHours: number }>;
  totalProjects: number;
}

export default function MetricasPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<"7" | "30" | "90">("30");

  // Load data
  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const res = await fetch(`/api/analytics?days=${dateRange}`);
      const data = await res.json();

      if (data.success) {
        setAnalytics(data.analytics);
      } else {
        toast.error("Erro ao carregar", "Nao foi possivel carregar os dados");
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
      toast.error("Erro ao carregar", "Verifique sua conexao");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate pending count
  const pendingCount = analytics
    ? analytics.statusDistribution.reduce((sum, s) => {
        if (s.status === "new" || s.status === "in_review" || s.status === "in_progress") {
          return sum + s.count;
        }
        return sum;
      }, 0)
    : 0;

  // Calculate completed count
  const completedCount = analytics
    ? analytics.statusDistribution.find(s => s.status === "completed")?.count || 0
    : 0;

  // Format resolution time
  const formatResolutionTime = (hours: number) => {
    if (hours < 24) return `${Math.round(hours)}h`;
    const days = hours / 24;
    return `${days.toFixed(1)}d`;
  };

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
                    Analytics
                  </h1>
                  <p className="text-sm text-white/50 mt-1">
                    Acompanhe o desempenho dos projetos
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Date Range Filter */}
                  <div className="flex gap-1 bg-white/5 rounded-lg p-1">
                    {(["7", "30", "90"] as const).map((range) => (
                      <button
                        key={range}
                        onClick={() => setDateRange(range)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                          dateRange === range
                            ? "bg-purple-500/20 text-purple-300"
                            : "text-white/50 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        {range}d
                      </button>
                    ))}
                  </div>

                  {/* Refresh */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadData(true)}
                    disabled={isRefreshing}
                    className="bg-white/5 border-white/10"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {isLoading ? (
            <MetricsPageContentSkeleton />
          ) : analytics ? (
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
              {/* KPI Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricsCard
                  title="Total de Feedbacks"
                  value={analytics.summary.totalFeedbacks}
                  subtitle={`${analytics.summary.feedbacksThisPeriod} nos ultimos ${dateRange} dias`}
                  icon={FolderKanban}
                  trend={{
                    value: analytics.summary.feedbacksTrend,
                    label: "vs periodo anterior",
                  }}
                  gradient="from-purple-500 to-indigo-500"
                />

                <MetricsCard
                  title="Taxa de Conclusao"
                  value={`${analytics.summary.completionRate}%`}
                  subtitle={`${completedCount} concluidos`}
                  icon={Target}
                  gradient="from-green-500 to-emerald-500"
                />

                <MetricsCard
                  title="Tempo Medio"
                  value={formatResolutionTime(analytics.summary.avgResolutionHours)}
                  subtitle="Para resolucao"
                  icon={Clock}
                  gradient="from-blue-500 to-cyan-500"
                />

                <MetricsCard
                  title="Pendentes"
                  value={pendingCount}
                  subtitle="Aguardando acao"
                  icon={AlertCircle}
                  gradient="from-yellow-500 to-orange-500"
                />
              </div>

              {/* Charts Row 1 */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Feedback Trend */}
                <FeedbackTrendChart
                  data={analytics.feedbacksByDay}
                  title="Tendencia de Feedbacks"
                  subtitle={`Ultimos ${dateRange} dias`}
                />

                {/* Status Distribution */}
                <div className="relative">
                  <StatusDistributionChart
                    data={analytics.statusDistribution}
                    title="Distribuicao por Status"
                  />
                </div>
              </div>

              {/* Charts Row 2 */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Priority Distribution */}
                <PriorityDistributionChart
                  data={analytics.priorityDistribution}
                  title="Distribuicao por Prioridade"
                />

                {/* Resolution Time by Status */}
                <ResolutionTimeChart
                  data={analytics.resolutionByStatus}
                  title="Tempo Medio por Status"
                  subtitle="Em horas"
                />
              </div>

              {/* Summary */}
              <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Resumo do Periodo</h3>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-sm text-white/50">Projetos Ativos</p>
                    <p className="text-2xl font-bold text-white">{analytics.totalProjects}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/50">Feedbacks Novos</p>
                    <p className="text-2xl font-bold text-white">
                      {analytics.summary.feedbacksThisPeriod}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-white/50">Media por Dia</p>
                    <p className="text-2xl font-bold text-white">
                      {(analytics.summary.feedbacksThisPeriod / parseInt(dateRange)).toFixed(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-white/50">Urgentes Pendentes</p>
                    <p className="text-2xl font-bold text-red-400">
                      {analytics.priorityDistribution.find(p => p.priority === "urgent")?.count || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-20">
              <p className="text-white/50">Erro ao carregar metricas</p>
            </div>
          )}
        </main>
      </div>
    </MobileNavProvider>
  );
}
