"use client";

import { useState } from "react";
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
  SortDesc,
  X,
  Hourglass,
  XCircle,
  Mic,
} from "lucide-react";
import { formatRelativeDate } from "@/lib/date-utils";

interface FeedbackTimelineProps {
  feedbacks: Feedback[];
  selectedFeedback: Feedback | null;
  onSelectFeedback: (feedback: Feedback) => void;
  onNewFeedback: () => void;
}

type FilterStatus = "all" | "new" | "in_review" | "in_progress" | "waiting_client" | "rejected" | "completed";
type FilterPriority = "all" | FeedbackPriority;
type SortBy = "newest" | "oldest" | "priority" | "deadline";

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
}: FeedbackTimelineProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterPriority, setFilterPriority] = useState<FilterPriority>("all");
  const [filterAssigned, setFilterAssigned] = useState<string>("all");
  const [filterHasDeadline, setFilterHasDeadline] = useState<boolean | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Get unique assignees
  const assignees = [...new Set(feedbacks.filter(f => f.assignedTo).map(f => f.assignedTo!))];

  // Check if any advanced filter is active
  const hasAdvancedFilters = filterPriority !== "all" || filterAssigned !== "all" || filterHasDeadline !== null;

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

      return matchesSearch && matchesStatus && matchesPriority && matchesAssigned && matchesDeadline;
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
    <div className="flex flex-col h-full bg-[#0A0A0A] border-l border-white/10">
      {/* Header */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h2 className="font-bold text-lg text-white">Timeline</h2>
            </div>
            <p className="text-sm text-white/50">
              {filteredFeedbacks.length} de {feedbacks.length} alteracoes
            </p>
          </div>
          <Button
            size="sm"
            onClick={onNewFeedback}
            className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg shadow-purple-500/30"
          >
            <Plus className="w-4 h-4 mr-1" />
            Nova
          </Button>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              placeholder="Buscar por titulo ou #numero..."
              className="pl-9 h-10 text-sm bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant={showFilters ? "default" : "ghost"}
            size="icon"
            className={showFilters
              ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white"
              : "text-white/50 hover:text-white hover:bg-white/10"
            }
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
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

      {/* Stats Bar */}
      <div className="px-5 py-3 border-b border-white/10 flex items-center gap-3 text-xs bg-white/[0.02] flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
          <span className="text-white/60">{statusCounts.new}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/50" />
          <span className="text-white/60">{statusCounts.in_review}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50" />
          <span className="text-white/60">{statusCounts.in_progress}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50" />
          <span className="text-white/60">{statusCounts.waiting_client}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-gray-500 shadow-lg shadow-gray-500/50" />
          <span className="text-white/60">{statusCounts.rejected}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-lg shadow-green-500/50" />
          <span className="text-white/60">{statusCounts.completed}</span>
        </div>
      </div>

      {/* Feedback List */}
      <div className="flex-1 overflow-auto">
        {filteredFeedbacks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            {feedbacks.length === 0 ? (
              <>
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center mb-6">
                  <Target className="w-10 h-10 text-purple-400" />
                </div>
                <p className="font-semibold text-white mb-2">
                  Nenhuma alteracao ainda
                </p>
                <p className="text-sm text-white/50 max-w-[250px]">
                  Clique em &quot;Marcar Alteracao&quot; e depois clique em qualquer ponto do site
                </p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                  <Search className="w-10 h-10 text-white/30" />
                </div>
                <p className="font-semibold text-white mb-2">
                  Nenhum resultado encontrado
                </p>
                <p className="text-sm text-white/50">
                  Tente ajustar os filtros ou busca
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {filteredFeedbacks.map((feedback, index) => {
              const StatusIcon = STATUS_ICONS[feedback.status as keyof typeof STATUS_ICONS] || Circle;
              const isSelected = selectedFeedback?.id === feedback.id;

              return (
                <div
                  key={feedback.id}
                  className={`
                    group cursor-pointer transition-all duration-200 overflow-hidden rounded-xl
                    ${isSelected
                      ? "bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border-2 border-purple-500/50 shadow-lg shadow-purple-500/20"
                      : "bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-purple-500/30"
                    }
                  `}
                  onClick={() => onSelectFeedback(feedback)}
                  style={{ animationDelay: `${index * 0.03}s` }}
                >
                  {/* Screenshot Preview */}
                  {feedback.screenshot && (
                    <div className="relative h-28 bg-neutral-900 overflow-hidden">
                      <img
                        src={feedback.screenshot}
                        alt="Screenshot"
                        className="w-full h-full object-cover object-top transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                      {/* Number Badge */}
                      <div
                        className={`absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg ${STATUS_COLORS[feedback.status]}`}
                      >
                        {feedback.number}
                      </div>

                      {/* Priority badge and audio indicator */}
                      <div className="absolute top-2 right-2 flex items-center gap-1">
                        {feedback.audioUrl && (
                          <div className="w-6 h-6 rounded-full bg-purple-500/90 flex items-center justify-center shadow-lg" title="Audio anexado">
                            <Mic className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full text-white font-medium shadow ${PRIORITY_COLORS[feedback.priority]}`}
                        >
                          {PRIORITY_LABELS[feedback.priority]}
                        </span>
                      </div>

                      {/* View indicator on hover */}
                      <div className={`absolute bottom-2 right-2 transition-all duration-200 ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          isSelected
                            ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg"
                            : "bg-white/90 text-black"
                        }`}>
                          {isSelected ? "Ver detalhes" : "Ver"}
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-3">
                    {/* No screenshot placeholder */}
                    {!feedback.screenshot && (
                      <div className="flex items-start gap-3 mb-2">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${STATUS_COLORS[feedback.status]}`}
                        >
                          {feedback.number}
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full text-white ${PRIORITY_COLORS[feedback.priority]}`}
                        >
                          {PRIORITY_LABELS[feedback.priority]}
                        </span>
                      </div>
                    )}

                    {/* Title */}
                    <h3 className="font-semibold text-sm text-white line-clamp-2 mb-1 group-hover:text-purple-300 transition-colors">
                      {feedback.title}
                    </h3>

                    {/* Description Preview */}
                    {feedback.description && (
                      <p className="text-xs text-white/50 line-clamp-2 mb-2">
                        {feedback.description}
                      </p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      {/* Status */}
                      <div className="flex items-center gap-1.5">
                        <StatusIcon className={`w-3 h-3 ${
                          feedback.status === "in_progress" ? "animate-spin" : ""
                        } ${STATUS_COLORS[feedback.status].replace("bg-", "text-")}`} />
                        <span className="text-xs text-white/50">
                          {STATUS_LABELS[feedback.status]}
                        </span>
                      </div>

                      {/* Time */}
                      <div className="flex items-center gap-1 text-xs text-white/40">
                        <Clock className="w-3 h-3" />
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
