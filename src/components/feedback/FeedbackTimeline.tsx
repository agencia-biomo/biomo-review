"use client";

import { useState, useCallback, useEffect, DragEvent } from "react";
import { Feedback, STATUS_COLORS, STATUS_LABELS, PRIORITY_COLORS, PRIORITY_LABELS, FeedbackPriority } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  Circle,
  Loader2,
  Target,
  Sparkles,
  ArrowRight,
  Calendar,
  UserPlus,
  SortAsc,
  X,
  Hourglass,
  XCircle,
  Mic,
  Download,
  FileText,
  CalendarDays,
  GripVertical,
} from "lucide-react";
import { formatRelativeDate } from "@/lib/date-utils";

interface FeedbackTimelineProps {
  feedbacks: Feedback[];
  selectedFeedback: Feedback | null;
  onSelectFeedback: (feedback: Feedback) => void;
  onNewFeedback: () => void;
  onReorder?: (feedbacks: Feedback[]) => void;
  enableDragDrop?: boolean;
}

type FilterStatus = "all" | "new" | "in_review" | "in_progress" | "waiting_client" | "rejected" | "completed";
type FilterPriority = "all" | FeedbackPriority;
type SortBy = "newest" | "oldest" | "priority" | "deadline";
type DateRange = "all" | "today" | "week" | "month" | "custom";

const STATUS_ICONS = {
  new: Circle,
  in_review: AlertCircle,
  in_progress: Loader2,
  waiting_client: Hourglass,
  rejected: XCircle,
  completed: CheckCircle2,
};

const PRIORITY_ORDER: Record<FeedbackPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function FeedbackTimeline({
  feedbacks,
  selectedFeedback,
  onSelectFeedback,
  onNewFeedback,
  onReorder,
  enableDragDrop = false,
}: FeedbackTimelineProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterPriority, setFilterPriority] = useState<FilterPriority>("all");
  const [filterAssigned, setFilterAssigned] = useState<string>("all");
  const [filterHasDeadline, setFilterHasDeadline] = useState<boolean | null>(null);
  const [filterDateRange, setFilterDateRange] = useState<DateRange>("all");
  const [customDateFrom, setCustomDateFrom] = useState<string>("");
  const [customDateTo, setCustomDateTo] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Detect touch device on mount
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Disable drag and drop on touch devices (HTML5 drag and drop doesn't work well on mobile)
  const canDragDrop = enableDragDrop && !isTouchDevice;

  // Drag and drop state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<"before" | "after" | null>(null);

  // Drag and drop handlers
  const handleDragStart = useCallback((e: DragEvent<HTMLDivElement>, feedback: Feedback) => {
    if (!canDragDrop) return;
    setDraggedId(feedback.id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", feedback.id);
  }, [canDragDrop]);

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDragOverId(null);
    setDragPosition(null);
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>, feedback: Feedback) => {
    if (!canDragDrop) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    if (feedback.id === draggedId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const position = e.clientY < midY ? "before" : "after";

    setDragOverId(feedback.id);
    setDragPosition(position);
  }, [canDragDrop, draggedId]);

  const handleDragLeave = useCallback(() => {
    setDragOverId(null);
    setDragPosition(null);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>, targetFeedback: Feedback) => {
    if (!canDragDrop || !onReorder) return;
    e.preventDefault();

    const draggedItemId = e.dataTransfer.getData("text/plain");
    if (draggedItemId === targetFeedback.id) return;

    const newFeedbacks = [...feedbacks];
    const draggedIndex = newFeedbacks.findIndex(f => f.id === draggedItemId);
    const targetIndex = newFeedbacks.findIndex(f => f.id === targetFeedback.id);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const [removed] = newFeedbacks.splice(draggedIndex, 1);

    let insertIndex = targetIndex;
    if (dragPosition === "after") {
      insertIndex = draggedIndex < targetIndex ? targetIndex : targetIndex + 1;
    } else {
      insertIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
    }

    newFeedbacks.splice(insertIndex, 0, removed);
    onReorder(newFeedbacks);

    setDraggedId(null);
    setDragOverId(null);
    setDragPosition(null);
  }, [canDragDrop, feedbacks, onReorder, dragPosition]);

  // Get unique assignees
  const assignees = [...new Set(feedbacks.filter(f => f.assignedTo).map(f => f.assignedTo!))];

  // Check if any advanced filter is active
  const hasAdvancedFilters = filterPriority !== "all" || filterAssigned !== "all" || filterHasDeadline !== null || filterDateRange !== "all";

  // Export functions
  const exportToCSV = () => {
    const headers = ["#", "Título", "Status", "Prioridade", "Responsável", "Prazo", "Criado em"];
    const rows = filteredFeedbacks.map(f => [
      f.number,
      f.title.replace(/"/g, '""'),
      STATUS_LABELS[f.status],
      PRIORITY_LABELS[f.priority],
      f.assignedTo || "Não atribuído",
      f.deadline ? new Date(f.deadline).toLocaleDateString("pt-BR") : "-",
      formatRelativeDate(f.createdAt)
    ]);

    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `feedbacks-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const exportToPDF = () => {
    // Create printable HTML
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório de Feedbacks</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          th { background-color: #7c3aed; color: white; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .date { color: #666; font-size: 14px; }
          .summary { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 8px; }
          .summary span { margin-right: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Relatório de Feedbacks</h1>
          <span class="date">Gerado em: ${new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
        </div>
        <div class="summary">
          <strong>Resumo:</strong>
          <span>Total: ${filteredFeedbacks.length}</span>
          <span>Novos: ${filteredFeedbacks.filter(f => f.status === "new").length}</span>
          <span>Em Progresso: ${filteredFeedbacks.filter(f => f.status === "in_progress").length}</span>
          <span>Concluídos: ${filteredFeedbacks.filter(f => f.status === "completed").length}</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Título</th>
              <th>Status</th>
              <th>Prioridade</th>
              <th>Responsável</th>
              <th>Prazo</th>
              <th>Criado</th>
            </tr>
          </thead>
          <tbody>
            ${filteredFeedbacks.map(f => `
              <tr>
                <td>${f.number}</td>
                <td>${f.title}</td>
                <td>${STATUS_LABELS[f.status]}</td>
                <td>${PRIORITY_LABELS[f.priority]}</td>
                <td>${f.assignedTo || "Não atribuído"}</td>
                <td>${f.deadline ? new Date(f.deadline).toLocaleDateString("pt-BR") : "-"}</td>
                <td>${formatRelativeDate(f.createdAt)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
    setShowExportMenu(false);
  };

  // Parse date helper
  const parseDate = (date: Date | string | { seconds?: number; _seconds?: number } | undefined): Date => {
    if (!date) return new Date(0);
    if (date instanceof Date) return date;
    if (typeof date === "string") return new Date(date);
    if (typeof date === "object") {
      const seconds = "seconds" in date ? date.seconds : "_seconds" in date ? date._seconds : 0;
      return new Date((seconds || 0) * 1000);
    }
    return new Date(0);
  };

  // Get date range boundaries
  const getDateRangeBoundaries = (): { from: Date; to: Date } | null => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filterDateRange) {
      case "today":
        return { from: today, to: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
      case "week":
        return { from: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000), to: now };
      case "month":
        return { from: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000), to: now };
      case "custom":
        if (customDateFrom && customDateTo) {
          return { from: new Date(customDateFrom), to: new Date(customDateTo + "T23:59:59") };
        }
        return null;
      default:
        return null;
    }
  };

  // Filter feedbacks
  const filteredFeedbacks = feedbacks
    .filter((feedback) => {
      const matchesSearch =
        searchQuery === "" ||
        feedback.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        feedback.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `#${feedback.number}`.includes(searchQuery);

      const matchesStatus =
        filterStatus === "all" || feedback.status === filterStatus;

      const matchesPriority =
        filterPriority === "all" || feedback.priority === filterPriority;

      const matchesAssigned =
        filterAssigned === "all" ||
        (filterAssigned === "unassigned" ? !feedback.assignedTo : feedback.assignedTo === filterAssigned);

      const matchesDeadline =
        filterHasDeadline === null ||
        (filterHasDeadline ? !!feedback.deadline : !feedback.deadline);

      // Date range filter
      const dateRange = getDateRangeBoundaries();
      const feedbackDate = parseDate(feedback.createdAt);
      const matchesDateRange = !dateRange || (feedbackDate >= dateRange.from && feedbackDate <= dateRange.to);

      return matchesSearch && matchesStatus && matchesPriority && matchesAssigned && matchesDeadline && matchesDateRange;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "priority":
          return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        case "deadline":
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        case "newest":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  const clearAllFilters = () => {
    setFilterStatus("all");
    setFilterPriority("all");
    setFilterAssigned("all");
    setFilterHasDeadline(null);
    setFilterDateRange("all");
    setCustomDateFrom("");
    setCustomDateTo("");
    setSearchQuery("");
    setSortBy("newest");
  };

  const statusCounts = {
    all: feedbacks.length,
    new: feedbacks.filter(f => f.status === "new").length,
    in_review: feedbacks.filter(f => f.status === "in_review").length,
    in_progress: feedbacks.filter(f => f.status === "in_progress").length,
    waiting_client: feedbacks.filter(f => f.status === "waiting_client").length,
    rejected: feedbacks.filter(f => f.status === "rejected").length,
    completed: feedbacks.filter(f => f.status === "completed").length,
  };

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] border-l-0 lg:border-l border-white/10">
      {/* Header - Responsivo */}
      <div className="p-3 sm:p-4 lg:p-5 border-b border-white/10">
        <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-purple-400" />
              <h2 className="font-bold text-base sm:text-lg text-white">Alterações</h2>
            </div>
            <p className="text-xs sm:text-sm text-white/50">
              {filteredFeedbacks.length} de {feedbacks.length}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Export Menu */}
            <div className="relative">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="text-white/50 hover:text-white hover:bg-white/10 text-xs sm:text-sm px-2.5 sm:px-3 h-8 sm:h-9"
                title="Exportar"
              >
                <Download className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
              </Button>
              {showExportMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowExportMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-40 bg-[#18181B] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden animate-fade-in">
                    <button
                      onClick={exportToCSV}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Exportar CSV
                    </button>
                    <button
                      onClick={exportToPDF}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Exportar PDF
                    </button>
                  </div>
                </>
              )}
            </div>

            <Button
              size="sm"
              onClick={onNewFeedback}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg shadow-purple-500/30 text-xs sm:text-sm px-2.5 sm:px-3 h-8 sm:h-9"
            >
              <Plus className="w-3.5 sm:w-4 h-3.5 sm:h-4 sm:mr-1" />
              <span className="hidden sm:inline">Nova</span>
            </Button>
          </div>
        </div>

        {/* Search - Responsivo */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 sm:w-4 h-3.5 sm:h-4 text-white/40" />
            <Input
              placeholder="Buscar..."
              className="pl-8 sm:pl-9 h-9 sm:h-10 text-xs sm:text-sm bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-purple-500/50 focus:ring-purple-500/20 rounded-lg sm:rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant={showFilters ? "default" : "ghost"}
            size="icon"
            className={`h-9 sm:h-10 w-9 sm:w-10 ${showFilters
              ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white"
              : "text-white/50 hover:text-white hover:bg-white/10"
            }`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
          </Button>
        </div>

        {/* Filter Pills */}
        {showFilters && (
          <div className="space-y-3 mt-4 animate-fade-in">
            {/* Status filters */}
            <div className="flex flex-wrap gap-2">
              {(["all", "new", "in_review", "in_progress", "waiting_client", "rejected", "completed"] as FilterStatus[]).map((status) => {
                const isActive = filterStatus === status;
                const count = statusCounts[status];
                const label = status === "all" ? "Todos" : STATUS_LABELS[status as keyof typeof STATUS_LABELS];

                return (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`
                      px-3 py-1.5 rounded-full text-xs font-medium transition-all border
                      ${isActive
                        ? status === "all"
                          ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-purple-500/50 shadow-lg shadow-purple-500/30"
                          : `${STATUS_COLORS[status as keyof typeof STATUS_COLORS]} text-white border-transparent`
                        : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
                      }
                    `}
                  >
                    {label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Advanced filters toggle */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all ${
                showAdvancedFilters || hasAdvancedFilters
                  ? "bg-purple-500/20 border border-purple-500/30 text-purple-300"
                  : "bg-white/5 border border-white/10 text-white/50 hover:bg-white/10"
              }`}
            >
              <span className="flex items-center gap-2">
                <Filter className="w-3 h-3" />
                Filtros Avancados
                {hasAdvancedFilters && (
                  <span className="px-1.5 py-0.5 rounded-full bg-purple-500 text-white text-[10px]">
                    Ativos
                  </span>
                )}
              </span>
              <span>{showAdvancedFilters ? "−" : "+"}</span>
            </button>

            {/* Advanced filters panel */}
            {showAdvancedFilters && (
              <div className="space-y-3 p-3 rounded-xl bg-white/[0.03] border border-white/10">
                {/* Priority filter */}
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1.5 block">
                    Prioridade
                  </label>
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={() => setFilterPriority("all")}
                      className={`px-2 py-1 rounded text-[10px] transition-all ${
                        filterPriority === "all"
                          ? "bg-white/20 text-white"
                          : "bg-white/5 text-white/50 hover:bg-white/10"
                      }`}
                    >
                      Todas
                    </button>
                    {(["urgent", "high", "medium", "low"] as FeedbackPriority[]).map((p) => (
                      <button
                        key={p}
                        onClick={() => setFilterPriority(p)}
                        className={`px-2 py-1 rounded text-[10px] transition-all ${
                          filterPriority === p
                            ? `${PRIORITY_COLORS[p]} text-white`
                            : "bg-white/5 text-white/50 hover:bg-white/10"
                        }`}
                      >
                        {PRIORITY_LABELS[p]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Assigned filter */}
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <UserPlus className="w-3 h-3" />
                    Responsavel
                  </label>
                  <select
                    value={filterAssigned}
                    onChange={(e) => setFilterAssigned(e.target.value)}
                    className="w-full h-8 px-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500/50"
                  >
                    <option value="all">Todos</option>
                    <option value="unassigned">Nao atribuido</option>
                    {assignees.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>

                {/* Deadline filter */}
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Prazo
                  </label>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setFilterHasDeadline(null)}
                      className={`flex-1 px-2 py-1 rounded text-[10px] transition-all ${
                        filterHasDeadline === null
                          ? "bg-white/20 text-white"
                          : "bg-white/5 text-white/50 hover:bg-white/10"
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => setFilterHasDeadline(true)}
                      className={`flex-1 px-2 py-1 rounded text-[10px] transition-all ${
                        filterHasDeadline === true
                          ? "bg-orange-500 text-white"
                          : "bg-white/5 text-white/50 hover:bg-white/10"
                      }`}
                    >
                      Com prazo
                    </button>
                    <button
                      onClick={() => setFilterHasDeadline(false)}
                      className={`flex-1 px-2 py-1 rounded text-[10px] transition-all ${
                        filterHasDeadline === false
                          ? "bg-gray-500 text-white"
                          : "bg-white/5 text-white/50 hover:bg-white/10"
                      }`}
                    >
                      Sem prazo
                    </button>
                  </div>
                </div>

                {/* Date Range filter */}
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" />
                    Período
                  </label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {([
                      { value: "all", label: "Todo período" },
                      { value: "today", label: "Hoje" },
                      { value: "week", label: "7 dias" },
                      { value: "month", label: "30 dias" },
                      { value: "custom", label: "Personalizado" },
                    ] as { value: DateRange; label: string }[]).map((d) => (
                      <button
                        key={d.value}
                        onClick={() => setFilterDateRange(d.value)}
                        className={`px-2 py-1 rounded text-[10px] transition-all ${
                          filterDateRange === d.value
                            ? "bg-indigo-500 text-white"
                            : "bg-white/5 text-white/50 hover:bg-white/10"
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                  {filterDateRange === "custom" && (
                    <div className="flex gap-2 mt-2">
                      <div className="flex-1">
                        <label className="text-[9px] text-white/30 block mb-1">De</label>
                        <input
                          type="date"
                          value={customDateFrom}
                          onChange={(e) => setCustomDateFrom(e.target.value)}
                          className="w-full h-7 px-2 rounded bg-white/5 border border-white/10 text-white text-[10px] focus:outline-none focus:border-purple-500/50"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[9px] text-white/30 block mb-1">Até</label>
                        <input
                          type="date"
                          value={customDateTo}
                          onChange={(e) => setCustomDateTo(e.target.value)}
                          className="w-full h-7 px-2 rounded bg-white/5 border border-white/10 text-white text-[10px] focus:outline-none focus:border-purple-500/50"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Sort */}
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <SortAsc className="w-3 h-3" />
                    Ordenar por
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {([
                      { value: "newest", label: "Mais recente" },
                      { value: "oldest", label: "Mais antigo" },
                      { value: "priority", label: "Prioridade" },
                      { value: "deadline", label: "Prazo" },
                    ] as { value: SortBy; label: string }[]).map((s) => (
                      <button
                        key={s.value}
                        onClick={() => setSortBy(s.value)}
                        className={`px-2 py-1 rounded text-[10px] transition-all ${
                          sortBy === s.value
                            ? "bg-purple-500 text-white"
                            : "bg-white/5 text-white/50 hover:bg-white/10"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clear filters */}
                {hasAdvancedFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="w-full flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-xs hover:bg-red-500/30 transition-all"
                  >
                    <X className="w-3 h-3" />
                    Limpar todos os filtros
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats Bar - Responsivo */}
      <div className="px-3 sm:px-4 lg:px-5 py-2 sm:py-3 border-b border-white/10 flex items-center justify-between sm:justify-start gap-2 sm:gap-3 text-[10px] sm:text-xs bg-white/[0.02]">
        <div className="flex items-center gap-1 sm:gap-1.5">
          <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
          <span className="text-white/60">{statusCounts.new}</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5">
          <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/50" />
          <span className="text-white/60">{statusCounts.in_review}</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5">
          <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50" />
          <span className="text-white/60">{statusCounts.in_progress}</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5">
          <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50" />
          <span className="text-white/60">{statusCounts.waiting_client}</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5">
          <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-gray-500 shadow-lg shadow-gray-500/50" />
          <span className="text-white/60">{statusCounts.rejected}</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5">
          <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-green-500 shadow-lg shadow-green-500/50" />
          <span className="text-white/60">{statusCounts.completed}</span>
        </div>
      </div>

      {/* Feedback List - Responsivo */}
      <div className="flex-1 overflow-auto">
        {filteredFeedbacks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4 sm:p-6">
            {feedbacks.length === 0 ? (
              <>
                <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center mb-4 sm:mb-6">
                  <Target className="w-8 sm:w-10 h-8 sm:h-10 text-purple-400" />
                </div>
                <p className="font-semibold text-white mb-2 text-sm sm:text-base">
                  Nenhuma alteracao ainda
                </p>
                <p className="text-xs sm:text-sm text-white/50 max-w-[220px] sm:max-w-[250px]">
                  Clique em &quot;Marcar Alteracao&quot; e depois clique em qualquer ponto do site
                </p>
              </>
            ) : (
              <>
                <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 sm:mb-6">
                  <Search className="w-8 sm:w-10 h-8 sm:h-10 text-white/30" />
                </div>
                <p className="font-semibold text-white mb-2 text-sm sm:text-base">
                  Nenhum resultado encontrado
                </p>
                <p className="text-xs sm:text-sm text-white/50">
                  Tente ajustar os filtros ou busca
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="p-2 sm:p-3 space-y-2">
            {filteredFeedbacks.map((feedback, index) => {
              const StatusIcon = STATUS_ICONS[feedback.status as keyof typeof STATUS_ICONS] || Circle;
              const isSelected = selectedFeedback?.id === feedback.id;
              const isDragging = draggedId === feedback.id;
              const isDragOver = dragOverId === feedback.id;

              return (
                <div
                  key={feedback.id}
                  draggable={canDragDrop}
                  onDragStart={(e) => handleDragStart(e, feedback)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, feedback)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, feedback)}
                  data-dragging={isDragging}
                  data-drag-over={isDragOver}
                  data-drag-position={isDragOver ? dragPosition : null}
                  className={`
                    group cursor-pointer transition-all duration-200 overflow-hidden rounded-lg sm:rounded-xl active:scale-[0.98]
                    ${canDragDrop ? "draggable-item" : ""}
                    ${isSelected
                      ? "bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border-2 border-purple-500/50 shadow-lg shadow-purple-500/20"
                      : "bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-purple-500/30"
                    }
                  `}
                  onClick={() => onSelectFeedback(feedback)}
                  style={{ animationDelay: `${index * 0.03}s` }}
                >
                  {/* Screenshot Preview - Responsivo */}
                  {feedback.screenshot && (
                    <div className="relative h-24 sm:h-28 bg-neutral-900 overflow-hidden">
                      <img
                        src={feedback.screenshot}
                        alt="Screenshot"
                        className="w-full h-full object-cover object-top transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                      {/* Number Badge */}
                      <div
                        className={`absolute top-1.5 sm:top-2 left-1.5 sm:left-2 w-6 sm:w-7 h-6 sm:h-7 rounded-full flex items-center justify-center text-white text-[10px] sm:text-xs font-bold shadow-lg ${STATUS_COLORS[feedback.status]}`}
                      >
                        {feedback.number}
                      </div>

                      {/* Priority badge and audio indicator */}
                      <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 flex items-center gap-1">
                        {feedback.audioUrl && (
                          <div className="w-5 sm:w-6 h-5 sm:h-6 rounded-full bg-purple-500/90 flex items-center justify-center shadow-lg" title="Audio anexado">
                            <Mic className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-white" />
                          </div>
                        )}
                        <span
                          className={`text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full text-white font-medium shadow ${PRIORITY_COLORS[feedback.priority]}`}
                        >
                          {PRIORITY_LABELS[feedback.priority]}
                        </span>
                      </div>

                      {/* View indicator on hover/selected */}
                      <div className={`absolute bottom-1.5 sm:bottom-2 right-1.5 sm:right-2 transition-all duration-200 ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                        <div className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                          isSelected
                            ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg"
                            : "bg-white/90 text-black"
                        }`}>
                          {isSelected ? "Detalhes" : "Ver"}
                          <ArrowRight className="w-2.5 sm:w-3 h-2.5 sm:h-3" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Content - Responsivo */}
                  <div className="p-2.5 sm:p-3 relative">
                    {/* Drag handle - hidden on touch devices */}
                    {canDragDrop && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                        <GripVertical className="w-4 h-4 text-white/30" />
                      </div>
                    )}
                    {/* No screenshot placeholder */}
                    {!feedback.screenshot && (
                      <div className="flex items-start gap-2 sm:gap-3 mb-2">
                        <div
                          className={`w-7 sm:w-8 h-7 sm:h-8 rounded-full flex items-center justify-center text-white text-[10px] sm:text-xs font-bold flex-shrink-0 ${STATUS_COLORS[feedback.status]}`}
                        >
                          {feedback.number}
                        </div>
                        <span
                          className={`text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full text-white ${PRIORITY_COLORS[feedback.priority]}`}
                        >
                          {PRIORITY_LABELS[feedback.priority]}
                        </span>
                      </div>
                    )}

                    {/* Title */}
                    <h3 className="font-semibold text-xs sm:text-sm text-white line-clamp-2 mb-1 group-hover:text-purple-300 transition-colors">
                      {feedback.title}
                    </h3>

                    {/* Description Preview - Oculto em mobile muito pequeno */}
                    {feedback.description && (
                      <p className="hidden sm:block text-xs text-white/50 line-clamp-2 mb-2">
                        {feedback.description}
                      </p>
                    )}

                    {/* Footer - Responsivo */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      {/* Status */}
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <StatusIcon className={`w-2.5 sm:w-3 h-2.5 sm:h-3 ${
                          feedback.status === "in_progress" ? "animate-spin" : ""
                        } ${STATUS_COLORS[feedback.status].replace("bg-", "text-")}`} />
                        <span className="text-[10px] sm:text-xs text-white/50">
                          {STATUS_LABELS[feedback.status]}
                        </span>
                      </div>

                      {/* Time */}
                      <div className="flex items-center gap-1 text-[10px] sm:text-xs text-white/40">
                        <Clock className="w-2.5 sm:w-3 h-2.5 sm:h-3" />
                        <span>{formatRelativeDate(feedback.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
