"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { IframeViewer } from "@/components/project/IframeViewer";
import { FeedbackTimeline } from "@/components/feedback/FeedbackTimeline";
import { FeedbackModal, FeedbackFormData } from "@/components/feedback/FeedbackModal";
import { FeedbackDetailModal } from "@/components/feedback/FeedbackDetailModal";
import { Feedback, ClickPosition, Project } from "@/types";
import { Button } from "@/components/ui/button";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { ArrowLeft, Link2, ExternalLink, Sparkles, CheckCircle2 } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectViewerPage({ params }: PageProps) {
  const { id: projectId } = use(params);
  const router = useRouter();

  const [project, setProject] = useState<(Project & { id: string }) | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingClickPosition, setPendingClickPosition] = useState<ClickPosition | null>(null);
  const [pendingScreenshot, setPendingScreenshot] = useState<string | null>(null);
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

  const handleCreateFeedback = (clickPosition: ClickPosition, screenshot: string) => {
    setPendingClickPosition(clickPosition);
    setPendingScreenshot(screenshot);
    setIsModalOpen(true);
  };

  const handleSubmitFeedback = async (data: FeedbackFormData) => {
    const response = await fetch("/api/feedbacks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        title: data.title,
        description: data.description,
        priority: data.priority,
        clickPosition: data.clickPosition,
        screenshot: data.screenshot,
        audioUrl: data.audioUrl,
        createdBy: "admin",
      }),
    });

    const result = await response.json();

    if (result.success) {
      await loadData();
    } else {
      throw new Error(result.error);
    }
  };

  const handlePinClick = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setIsDetailModalOpen(true);
  };

  const handleStatusChange = async (feedbackId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/feedbacks/${feedbackId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          changedBy: "admin", // Logged-in user role
        }),
      });

      const result = await response.json();
      if (result.success) {
        await loadData();
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleUpdateFeedback = async (feedbackId: string, data: Partial<Feedback>) => {
    try {
      const response = await fetch(`/api/feedbacks/${feedbackId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (result.success) {
        await loadData();
      }
    } catch (error) {
      console.error("Error updating feedback:", error);
    }
  };

  const handleDeleteFeedback = async (feedbackId: string) => {
    try {
      const response = await fetch(`/api/feedbacks/${feedbackId}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (result.success) {
        await loadData();
      }
    } catch (error) {
      console.error("Error deleting feedback:", error);
    }
  };

  const handleNewFeedback = () => {
    alert('Clique em "Marcar Alteracao" e depois clique em qualquer ponto do site para criar uma solicitacao.');
  };

  const handleCopyLink = async () => {
    if (!project) return;
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/p/${project.publicAccessToken}`;
    try {
      await navigator.clipboard.writeText(link);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      prompt("Copie o link:", link);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-[#09090B] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-sm text-white/50">Carregando projeto...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="h-screen bg-[#09090B] flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">!</span>
          </div>
          <p className="text-lg font-medium text-white mb-2">{error || "Projeto nao encontrado"}</p>
          <Button
            onClick={() => router.push("/")}
            className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
          >
            Voltar para Projetos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#09090B]">
      {/* Header */}
      <header className="h-16 bg-[#0A0A0A] border-b border-white/10 flex items-center px-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/")}
          className="text-white/60 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <div className="ml-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Image
              src="/logo-biomo.png"
              alt="Biomo"
              width={24}
              height={24}
              className="w-6 h-auto"
            />
          </div>
          <div>
            <h1 className="font-semibold text-white">{project.name}</h1>
            <a
              href={project.siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-white/50 hover:text-purple-400 flex items-center gap-1 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              {new URL(project.siteUrl).hostname}
            </a>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-sm text-white/60">
              {feedbacks.length} alteracoes
            </span>
          </div>
          <NotificationDropdown userId="admin" />
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className={`border-white/10 transition-all ${
              linkCopied
                ? "bg-green-500/20 border-green-500/30 text-green-400"
                : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            {linkCopied ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Copiado!
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4 mr-2" />
                Link para Cliente
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Main Content - 70% Viewer / 30% Timeline */}
      <div className="flex-1 flex overflow-hidden">
        {/* Iframe Viewer - 70% */}
        <div className="w-[70%] min-w-0">
          <IframeViewer
            siteUrl={project.siteUrl}
            feedbacks={feedbacks}
            selectedFeedbackId={selectedFeedback?.id}
            onPinClick={handlePinClick}
            onCreateFeedback={handleCreateFeedback}
          />
        </div>

        {/* Timeline Sidebar - 30% */}
        <div className="w-[30%] min-w-[320px] max-w-[450px] flex-shrink-0">
          <FeedbackTimeline
            feedbacks={feedbacks}
            selectedFeedback={selectedFeedback}
            onSelectFeedback={(feedback) => {
              // Se já está selecionado, abre o modal de detalhes
              if (selectedFeedback?.id === feedback.id) {
                setIsDetailModalOpen(true);
              } else {
                // Primeiro clique: seleciona e destaca o pin no iframe
                setSelectedFeedback(feedback);
              }
            }}
            onNewFeedback={handleNewFeedback}
          />
        </div>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setPendingClickPosition(null);
          setPendingScreenshot(null);
        }}
        onSubmit={handleSubmitFeedback}
        clickPosition={pendingClickPosition}
        screenshot={pendingScreenshot}
      />

      {/* Feedback Detail Modal */}
      {selectedFeedback && (
        <FeedbackDetailModal
          feedback={selectedFeedback as Feedback & { id: string }}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedFeedback(null);
          }}
          onStatusChange={handleStatusChange}
          onUpdate={handleUpdateFeedback}
          onDelete={handleDeleteFeedback}
          canChangeStatus={true}
        />
      )}
    </div>
  );
}
