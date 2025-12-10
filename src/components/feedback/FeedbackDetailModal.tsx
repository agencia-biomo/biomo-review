"use client";

import { useState, useRef } from "react";
import { Feedback, FeedbackPriority } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CommentThread } from "./CommentThread";
import {
  X,
  MapPin,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  Circle,
  Loader2,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Calendar,
  UserPlus,
  Edit3,
  Save,
  Trash2,
  ArrowLeftRight,
  Hourglass,
  XCircle,
  Mic,
  Play,
  Pause,
} from "lucide-react";
import { BeforeAfterComparison } from "./BeforeAfterComparison";
import { StatusHistoryTimeline } from "./StatusHistoryTimeline";
import { formatRelativeDate } from "@/lib/date-utils";

interface FeedbackDetailModalProps {
  feedback: Feedback & { id: string };
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (feedbackId: string, newStatus: string) => void;
  onUpdate?: (feedbackId: string, data: Partial<Feedback>) => void;
  onDelete?: (feedbackId: string) => void;
  canChangeStatus?: boolean;
}

const statusOptions = [
  { value: "new", label: "Novo", color: "bg-red-500", icon: Circle, gradient: "from-red-500 to-orange-500" },
  { value: "in_review", label: "Em Analise", color: "bg-yellow-500", icon: AlertCircle, gradient: "from-yellow-500 to-amber-500" },
  { value: "in_progress", label: "Em Andamento", color: "bg-blue-500", icon: Loader2, gradient: "from-blue-500 to-cyan-500" },
  { value: "waiting_client", label: "Aguard. Cliente", color: "bg-purple-500", icon: Hourglass, gradient: "from-purple-500 to-violet-500" },
  { value: "rejected", label: "Rejeitado", color: "bg-gray-500", icon: XCircle, gradient: "from-gray-500 to-slate-500" },
  { value: "completed", label: "Concluido", color: "bg-green-500", icon: CheckCircle2, gradient: "from-green-500 to-emerald-500" },
];

const priorityOptions: { value: FeedbackPriority; label: string; color: string }[] = [
  { value: "low", label: "Baixa", color: "bg-gray-500" },
  { value: "medium", label: "Media", color: "bg-yellow-500" },
  { value: "high", label: "Alta", color: "bg-orange-500" },
  { value: "urgent", label: "Urgente", color: "bg-red-500" },
];

const priorityLabels: Record<string, { label: string; color: string; bg: string }> = {
  low: { label: "Baixa", color: "text-gray-300", bg: "bg-gray-500/20 border-gray-500/30" },
  medium: { label: "Media", color: "text-yellow-300", bg: "bg-yellow-500/20 border-yellow-500/30" },
  high: { label: "Alta", color: "text-orange-300", bg: "bg-orange-500/20 border-orange-500/30" },
  urgent: { label: "Urgente", color: "text-red-300", bg: "bg-red-500/20 border-red-500/30" },
};

// Mock team members
const TEAM_MEMBERS = [
  { id: "admin", name: "Administrador" },
  { id: "joao", name: "Joao Silva" },
  { id: "maria", name: "Maria Santos" },
  { id: "pedro", name: "Pedro Costa" },
];

export function FeedbackDetailModal({
  feedback,
  isOpen,
  onClose,
  onStatusChange,
  onUpdate,
  onDelete,
  canChangeStatus = false,
}: FeedbackDetailModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(feedback.title);
  const [editDescription, setEditDescription] = useState(feedback.description || "");
  const [editPriority, setEditPriority] = useState(feedback.priority);
  const [editAssignedTo, setEditAssignedTo] = useState(feedback.assignedTo || "");
  const [editDeadline, setEditDeadline] = useState(
    feedback.deadline ? new Date(feedback.deadline).toISOString().split("T")[0] : ""
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (!isOpen) return null;

  const currentStatus = statusOptions.find((s) => s.value === feedback.status) || statusOptions[0];
  const priority = priorityLabels[feedback.priority] || priorityLabels.medium;

  const handleStatusChange = async (newStatus: string) => {
    if (!onStatusChange || isUpdating) return;

    setIsUpdating(true);
    try {
      await onStatusChange(feedback.id, newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!onUpdate || isUpdating) return;

    setIsUpdating(true);
    try {
      await onUpdate(feedback.id, {
        title: editTitle,
        description: editDescription,
        priority: editPriority,
        assignedTo: editAssignedTo || undefined,
        deadline: editDeadline ? new Date(editDeadline) : undefined,
      });
      setIsEditing(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || isUpdating) return;

    setIsUpdating(true);
    try {
      await onDelete(feedback.id);
      onClose();
    } finally {
      setIsUpdating(false);
    }
  };

  const assignedMember = TEAM_MEMBERS.find(m => m.id === feedback.assignedTo);

  const handleSaveAfterImage = async (afterImageUrl: string) => {
    if (!onUpdate) return;
    await onUpdate(feedback.id, {
      afterImage: afterImageUrl,
    });
  };

  const toggleAudioPlayback = () => {
    if (!audioRef.current) return;
    if (isAudioPlaying) {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    } else {
      audioRef.current.play();
      setIsAudioPlaying(true);
    }
  };

  const handleAudioEnded = () => {
    setIsAudioPlaying(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden sm:m-4 bg-[#0A0A0A] rounded-t-2xl sm:rounded-2xl border border-white/10 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-5 border-b border-white/10 sticky top-0 bg-[#0A0A0A] z-10">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                #{feedback.number}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${priority.bg} ${priority.color}`}>
                {priority.label}
              </span>
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r ${currentStatus.gradient} text-white`}>
                <currentStatus.icon className={`w-3 h-3 ${currentStatus.value === "in_progress" ? "animate-spin" : ""}`} />
                {currentStatus.label}
              </div>
              {assignedMember && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                  <UserPlus className="w-3 h-3" />
                  {assignedMember.name}
                </span>
              )}
              {feedback.deadline && (
                <span className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${
                  new Date(feedback.deadline) < new Date()
                    ? "bg-red-500/20 text-red-300 border border-red-500/30"
                    : "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                }`}>
                  <Calendar className="w-3 h-3" />
                  {new Date(feedback.deadline).toLocaleDateString("pt-BR")}
                </span>
              )}
            </div>
            {isEditing ? (
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="bg-white/5 border-white/20 text-white font-bold text-lg"
              />
            ) : (
              <h2 className="font-bold text-lg text-white pr-8">{feedback.title}</h2>
            )}
          </div>
          <div className="flex items-center gap-1">
            {canChangeStatus && !isEditing && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(true)}
                className="text-white/50 hover:text-white hover:bg-white/10 rounded-xl"
              >
                <Edit3 className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white/50 hover:text-white hover:bg-white/10 rounded-xl flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5">
          {/* Screenshot */}
          {feedback.screenshot && (
            <div className="relative group rounded-xl overflow-hidden border border-white/10">
              <img
                src={feedback.screenshot}
                alt="Screenshot do feedback"
                className="w-full h-auto"
              />
              {/* Comparison Button Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Button
                  onClick={() => setShowComparison(true)}
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg"
                >
                  <ArrowLeftRight className="w-4 h-4 mr-2" />
                  Comparar Antes/Depois
                </Button>
              </div>
              {/* After image indicator */}
              {feedback.afterImage && (
                <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-green-500/90 text-white text-xs font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Imagem &quot;Depois&quot; disponivel
                </div>
              )}
            </div>
          )}

          {/* Audio Player */}
          {feedback.audioUrl && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20">
              <div className="flex items-center gap-3">
                <audio
                  ref={audioRef}
                  src={feedback.audioUrl}
                  onEnded={handleAudioEnded}
                  className="hidden"
                />
                <Button
                  type="button"
                  onClick={toggleAudioPlayback}
                  size="icon"
                  className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg"
                >
                  {isAudioPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4 ml-0.5" />
                  )}
                </Button>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Mic className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium text-white">Audio do Cliente</span>
                  </div>
                  <p className="text-xs text-white/50">
                    {isAudioPlaying ? "Reproduzindo..." : "Clique para ouvir a explicacao em audio"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
              <div className="flex items-center gap-2 text-white/50 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs">Criado</span>
              </div>
              <p className="text-sm text-white font-medium">
                {formatRelativeDate(feedback.createdAt)}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
              <div className="flex items-center gap-2 text-white/50 mb-1">
                <User className="w-4 h-4" />
                <span className="text-xs">Autor</span>
              </div>
              <p className="text-sm text-white font-medium">
                {feedback.createdBy}
              </p>
            </div>
            {feedback.clickPosition && (
              <div className="col-span-2 p-4 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="flex items-center gap-2 text-white/50 mb-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-xs">Localizacao</span>
                </div>
                <a
                  href={feedback.clickPosition.pageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1 truncate"
                >
                  {feedback.clickPosition.pageUrl}
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
              </div>
            )}
          </div>

          {/* Status Buttons */}
          <div>
            <label className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Status
            </label>
            {canChangeStatus ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {statusOptions.map((status) => {
                  const Icon = status.icon;
                  const isActive = feedback.status === status.value;
                  return (
                    <button
                      key={status.value}
                      onClick={() => handleStatusChange(status.value)}
                      disabled={isUpdating}
                      className={`
                        flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-medium transition-all border
                        ${isActive
                          ? `bg-gradient-to-r ${status.gradient} text-white border-transparent shadow-lg`
                          : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
                        }
                        ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}
                      `}
                    >
                      <Icon className={`w-4 h-4 ${status.value === "in_progress" && isActive ? "animate-spin" : ""}`} />
                      {status.label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r ${currentStatus.gradient} text-white`}>
                <currentStatus.icon className={`w-4 h-4 ${currentStatus.value === "in_progress" ? "animate-spin" : ""}`} />
                {currentStatus.label}
              </div>
            )}
          </div>

          {/* Status History Timeline */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
            <StatusHistoryTimeline
              statusHistory={feedback.statusHistory}
              currentStatus={feedback.status}
              createdAt={feedback.createdAt}
              createdBy={feedback.createdBy}
            />
          </div>

          {/* Edit Mode - Assignment & Deadline */}
          {isEditing && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
              <div>
                <label className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-purple-400" />
                  Responsavel
                </label>
                <select
                  value={editAssignedTo}
                  onChange={(e) => setEditAssignedTo(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/20 text-white text-sm focus:outline-none focus:border-purple-500/50"
                >
                  <option value="">Nao atribuido</option>
                  {TEAM_MEMBERS.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  Prazo
                </label>
                <Input
                  type="date"
                  value={editDeadline}
                  onChange={(e) => setEditDeadline(e.target.value)}
                  className="bg-white/5 border-white/20 text-white"
                />
              </div>
              <div className="col-span-1 sm:col-span-2">
                <label className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-purple-400" />
                  Prioridade
                </label>
                <div className="grid grid-cols-2 sm:flex gap-2">
                  {priorityOptions.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setEditPriority(p.value)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        editPriority === p.value
                          ? `${p.color} text-white shadow-lg`
                          : "bg-white/5 text-white/60 hover:bg-white/10"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              Descricao
            </label>
            {isEditing ? (
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={4}
                className="w-full p-4 rounded-xl bg-white/5 border border-white/20 text-white text-sm resize-none focus:outline-none focus:border-purple-500/50"
                placeholder="Descreva a alteracao..."
              />
            ) : (
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                <p className="text-sm text-white/70 whitespace-pre-wrap leading-relaxed">
                  {feedback.description || "Sem descricao adicional."}
                </p>
              </div>
            )}
          </div>

          {/* Edit Actions */}
          {isEditing && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    setEditTitle(feedback.title);
                    setEditDescription(feedback.description || "");
                    setEditPriority(feedback.priority);
                    setEditAssignedTo(feedback.assignedTo || "");
                    setEditDeadline(feedback.deadline ? new Date(feedback.deadline).toISOString().split("T")[0] : "");
                  }}
                  className="text-white/50 hover:text-white"
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={isUpdating || !editTitle.trim()}
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
                >
                  {isUpdating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
              <p className="text-sm text-white mb-3">
                Tem certeza que deseja excluir este feedback? Esta acao nao pode ser desfeita.
              </p>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-white/50 hover:text-white"
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleDelete}
                  disabled={isUpdating}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  {isUpdating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Confirmar Exclusao"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="pt-4 border-t border-white/10">
            <CommentThread
              feedbackId={feedback.id}
              authorRole={canChangeStatus ? "team" : "client"}
            />
          </div>
        </div>
      </div>

      {/* Before/After Comparison Modal */}
      {feedback.screenshot && (
        <BeforeAfterComparison
          beforeImage={feedback.screenshot}
          afterImage={feedback.afterImage}
          isOpen={showComparison}
          onClose={() => setShowComparison(false)}
          onSaveAfterImage={canChangeStatus ? handleSaveAfterImage : undefined}
          canEdit={canChangeStatus}
        />
      )}
    </div>
  );
}
