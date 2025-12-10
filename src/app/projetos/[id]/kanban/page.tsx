"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Feedback, FeedbackStatus, Project } from "@/types";
import { KanbanBoard } from "@/components/kanban";
import { FeedbackDetailModal } from "@/components/feedback/FeedbackDetailModal";
import { Button } from "@/components/ui/button";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import {
  ArrowLeft,
  Link2,
  ExternalLink,
  LayoutGrid,
  ListTodo,
  Keyboard,
} from "lucide-react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { KeyboardShortcutsHelp } from "@/components/ui/KeyboardShortcutsHelp";
import { toast } from "@/hooks/useToast";
import { KanbanPageSkeleton } from "@/components/skeletons";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectKanbanPage({ params }: PageProps) {
  const { id: projectId } = use(params);
  const router = useRouter();

  const [project, setProject] = useState<(Project & { id: string }) | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const projectRes = await fetch(`/api/projects/${projectId}`);
      const projectData = await projectRes.json();

      if (!projectData.success) {
        setError("Projeto nao encontrado");
        setIsLoading(false);
        return;
      }

      setProject(projectData.project);

      const feedbacksRes = await fetch(`/api/feedbacks?projectId=${projectId}`);
      const feedbacksData = await feedbacksRes.json();

      if (feedbacksData.success) {
        setFeedbacks(feedbacksData.feedbacks || []);
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Erro ao carregar projeto");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Keep selectedFeedback in sync with feedbacks list
  useEffect(() => {
    if (selectedFeedback && feedbacks.length > 0) {
      const updated = feedbacks.find((f) => f.id === selectedFeedback.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedFeedback)) {
        setSelectedFeedback(updated);
      }
    }
  }, [feedbacks, selectedFeedback]);

  const handleStatusChange = useCallback(async (feedbackId: string, newStatus: FeedbackStatus) => {
    // Optimistic update
    setFeedbacks(prev =>
      prev.map(f =>
        f.id === feedbackId ? { ...f, status: newStatus, updatedAt: new Date() } : f
      )
    );

    try {
      const response = await fetch(`/api/feedbacks/${feedbackId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!data.success) {
        // Rollback on error
        await loadData();
        throw new Error(data.error || "Erro ao atualizar status");
      }

      // Update with server response
      if (data.feedback) {
        setFeedbacks(prev =>
          prev.map(f => (f.id === feedbackId ? data.feedback : f))
        );
      }
    } catch (error) {
      console.error("Error updating status:", error);
      throw error;
    }
  }, [loadData]);

  const handleViewFeedback = useCallback((feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setIsDetailModalOpen(true);
  }, []);

  const handleDeleteFeedback = useCallback(async (feedback: Feedback) => {
    if (!confirm(`Excluir feedback #${feedback.number}?`)) return;

    try {
      const response = await fetch(`/api/feedbacks/${feedback.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setFeedbacks(prev => prev.filter(f => f.id !== feedback.id));
        toast.success("Feedback excluido", `#${feedback.number} foi removido`);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error deleting feedback:", error);
      toast.error("Erro ao excluir", "Nao foi possivel excluir o feedback");
    }
  }, []);

  const handleCopyLink = async () => {
    if (!project?.publicAccessToken) return;

    const publicUrl = `${window.location.origin}/p/${project.publicAccessToken}`;
    await navigator.clipboard.writeText(publicUrl);
    setLinkCopied(true);
    toast.success("Link copiado!", "O link publico foi copiado");
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleFeedbackUpdated = useCallback(
    (updatedFeedback: Feedback) => {
      setFeedbacks((prev) =>
        prev.map((f) => (f.id === updatedFeedback.id ? updatedFeedback : f))
      );
    },
    []
  );

  // Keyboard shortcuts
  const shortcuts = [
    { key: "Escape", description: "Fechar modal", action: () => setIsDetailModalOpen(false) },
    { key: "r", description: "Recarregar", action: loadData },
    { key: "b", description: "Voltar", action: () => router.push("/") },
  ];

  const { showHelp, setShowHelp } = useKeyboardShortcuts(shortcuts, {
    enabled: !isDetailModalOpen,
  });

  if (isLoading) {
    return <KanbanPageSkeleton />;
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            {error || "Projeto nao encontrado"}
          </h1>
          <Button onClick={() => router.push("/")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/")}
              className="text-white/70 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <div>
              <h1 className="font-semibold text-white text-sm">
                {project.name}
              </h1>
              <p className="text-xs text-white/50">
                Kanban - {feedbacks.length} feedbacks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle view */}
            <div className="flex items-center bg-white/5 rounded-lg p-0.5">
              <Link href={`/projetos/${projectId}`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-white/50 hover:text-white"
                >
                  <ListTodo className="w-4 h-4" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 bg-white/10 text-white"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>

            {/* Copy link */}
            {project.publicAccessEnabled && project.publicAccessToken && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyLink}
                className="text-white/70 hover:text-white text-xs"
              >
                <Link2 className="w-4 h-4 mr-1" />
                {linkCopied ? "Copiado!" : "Link"}
              </Button>
            )}

            {/* Open site */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.open(project.siteUrl, "_blank")}
              className="text-white/70 hover:text-white"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>

            {/* Shortcuts */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowHelp(true)}
              className="text-white/70 hover:text-white"
            >
              <Keyboard className="w-4 h-4" />
            </Button>

            {/* Notifications */}
            <NotificationDropdown userId="admin" />
          </div>
        </div>
      </header>

      {/* Kanban Board */}
      <main className="flex-1">
        <KanbanBoard
          feedbacks={feedbacks}
          onStatusChange={handleStatusChange}
          onView={handleViewFeedback}
          onDelete={handleDeleteFeedback}
          onRefresh={loadData}
          onAddNew={() => router.push(`/projetos/${projectId}`)}
          isLoading={isLoading}
        />
      </main>

      {/* Feedback Detail Modal */}
      {selectedFeedback && (
        <FeedbackDetailModal
          feedback={selectedFeedback}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedFeedback(null);
          }}
          onUpdate={(feedbackId, data) => {
            handleFeedbackUpdated({ ...selectedFeedback, ...data } as Feedback);
          }}
        />
      )}

      {/* Keyboard shortcuts help */}
      <KeyboardShortcutsHelp
        shortcuts={shortcuts}
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
      />
    </div>
  );
}
