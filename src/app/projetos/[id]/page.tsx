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
import { ArrowLeft, Link2, ExternalLink, Sparkles, CheckCircle2, Monitor, ListTodo, Keyboard } from "lucide-react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { KeyboardShortcutsHelp } from "@/components/ui/KeyboardShortcutsHelp";

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
  const [mobileActiveTab, setMobileActiveTab] = useState<"viewer" | "timeline">("viewer");

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

  // Keep selectedFeedback in sync with feedbacks list (e.g. after status update)
  useEffect(() => {
    if (selectedFeedback && feedbacks.length > 0) {
      const updated = feedbacks.find((f) => f.id === selectedFeedback.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedFeedback)) {
        setSelectedFeedback(updated);
      }
    }
  }, [feedbacks, selectedFeedback]);

  const handleCreateFeedback = (clickPosition: ClickPosition, screenshot: string) => {
    setPendingClickPosition(clickPosition);
    setPendingScreenshot(screenshot);
    setIsModalOpen(true);
  };

  const handleSubmitFeedback = async (data: FeedbackFormData) => {
    console.log("[ProjectPage] Submitting feedback with audioUrl:", data.audioUrl ? "present (" + data.audioUrl.length + " chars)" : "none");

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
    console.log("[ProjectPage] Feedback created:", result);

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

  // Keyboard shortcuts
  const shortcuts = [
    {
      key: "ArrowUp",
      description: "Feedback anterior",
      action: () => {
        if (feedbacks.length === 0) return;
        const currentIndex = selectedFeedback
          ? feedbacks.findIndex(f => f.id === selectedFeedback.id)
          : -1;
        const newIndex = currentIndex > 0 ? currentIndex - 1 : feedbacks.length - 1;
        setSelectedFeedback(feedbacks[newIndex]);
      },
    },
    {
      key: "ArrowDown",
      description: "Próximo feedback",
      action: () => {
        if (feedbacks.length === 0) return;
        const currentIndex = selectedFeedback
          ? feedbacks.findIndex(f => f.id === selectedFeedback.id)
          : -1;
        const newIndex = currentIndex < feedbacks.length - 1 ? currentIndex + 1 : 0;
        setSelectedFeedback(feedbacks[newIndex]);
      },
    },
    {
      key: "Enter",
      description: "Abrir feedback selecionado",
      action: () => {
        if (selectedFeedback) {
          setIsDetailModalOpen(true);
        }
      },
    },
    {
      key: "Escape",
      description: "Fechar modal",
      action: () => {
        if (isDetailModalOpen) {
          setIsDetailModalOpen(false);
          setSelectedFeedback(null);
        } else if (isModalOpen) {
          setIsModalOpen(false);
          setPendingClickPosition(null);
          setPendingScreenshot(null);
        }
      },
    },
    {
      key: "n",
      description: "Novo feedback",
      action: handleNewFeedback,
    },
    {
      key: "l",
      description: "Copiar link para cliente",
      action: handleCopyLink,
    },
  ];

  const { showHelp, setShowHelp } = useKeyboardShortcuts(shortcuts, {
    enabled: !isModalOpen,
  });

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
      {/* Header - Responsivo */}
      <header className="h-14 lg:h-16 bg-[#0A0A0A] border-b border-white/10 flex items-center px-3 lg:px-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/")}
          className="text-white/60 hover:text-white hover:bg-white/10 p-2 lg:px-3"
        >
          <ArrowLeft className="w-4 h-4 lg:mr-2" />
          <span className="hidden lg:inline">Voltar</span>
        </Button>

        <div className="ml-2 lg:ml-4 flex items-center gap-2 lg:gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/30 flex-shrink-0">
            <Image
              src="/logo-biomo.png"
              alt="Biomo"
              width={24}
              height={24}
              className="w-5 lg:w-6 h-auto"
            />
          </div>
          <div className="min-w-0">
            <h1 className="font-semibold text-white text-sm lg:text-base truncate">{project.name}</h1>
            <a
              href={project.siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] lg:text-xs text-white/50 hover:text-purple-400 flex items-center gap-1 transition-colors"
            >
              <ExternalLink className="w-2.5 lg:w-3 h-2.5 lg:h-3 flex-shrink-0" />
              <span className="truncate">{new URL(project.siteUrl).hostname}</span>
            </a>
          </div>
        </div>

        <div className="flex items-center gap-1.5 lg:gap-3">
          {/* Badge de alterações - oculto em mobile pequeno */}
          <div className="hidden sm:flex items-center gap-1.5 lg:gap-2 px-2 lg:px-3 py-1 lg:py-1.5 rounded-full bg-white/5 border border-white/10">
            <Sparkles className="w-3 lg:w-3.5 h-3 lg:h-3.5 text-purple-400" />
            <span className="text-xs lg:text-sm text-white/60">
              {feedbacks.length}
            </span>
          </div>
          {/* Botão de Atalhos - apenas desktop */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHelp(true)}
            className="hidden lg:flex text-white/50 hover:text-white hover:bg-white/10 p-2"
            title="Atalhos de teclado (?)"
          >
            <Keyboard className="w-4 h-4" />
          </Button>
          <NotificationDropdown userId="admin" />
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className={`border-white/10 transition-all p-2 lg:px-3 ${
              linkCopied
                ? "bg-green-500/20 border-green-500/30 text-green-400"
                : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            {linkCopied ? (
              <>
                <CheckCircle2 className="w-4 h-4 lg:mr-2" />
                <span className="hidden lg:inline">Copiado!</span>
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4 lg:mr-2" />
                <span className="hidden lg:inline">Link para Cliente</span>
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Main Content - Desktop: 70%/30% split | Mobile: Tabs */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Desktop: Side by Side Layout */}
        {/* Mobile: Tab Content */}

        {/* Iframe Viewer - Desktop: 70% | Mobile: Full when active */}
        <div className={`
          ${mobileActiveTab === "viewer" ? "flex-1" : "hidden"}
          lg:block lg:w-[70%] lg:min-w-0
        `}>
          <IframeViewer
            siteUrl={project.siteUrl}
            feedbacks={feedbacks}
            selectedFeedbackId={selectedFeedback?.id}
            onPinClick={handlePinClick}
            onCreateFeedback={handleCreateFeedback}
          />
        </div>

        {/* Timeline Sidebar - Desktop: 30% | Mobile: Full when active */}
        <div className={`
          ${mobileActiveTab === "timeline" ? "flex-1" : "hidden"}
          lg:block lg:w-[30%] lg:min-w-[320px] lg:max-w-[450px] lg:flex-shrink-0
        `}>
          <FeedbackTimeline
            feedbacks={feedbacks}
            selectedFeedback={selectedFeedback}
            onSelectFeedback={(feedback) => {
              // Sempre abre o modal direto ao clicar
              setSelectedFeedback(feedback);
              setIsDetailModalOpen(true);
            }}
            onNewFeedback={handleNewFeedback}
          />
        </div>

        {/* Mobile Tab Bar - Apenas em mobile */}
        <div className="lg:hidden h-14 bg-[#0A0A0A] border-t border-white/10 flex items-center justify-around px-4 flex-shrink-0">
          <button
            onClick={() => setMobileActiveTab("viewer")}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition-all ${
              mobileActiveTab === "viewer"
                ? "text-purple-400"
                : "text-white/50 hover:text-white/70"
            }`}
          >
            <Monitor className={`w-5 h-5 ${mobileActiveTab === "viewer" ? "text-purple-400" : ""}`} />
            <span className="text-[10px] font-medium">Visualizar</span>
            {mobileActiveTab === "viewer" && (
              <div className="absolute bottom-1 w-8 h-0.5 rounded-full bg-purple-500" />
            )}
          </button>

          <button
            onClick={() => setMobileActiveTab("timeline")}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition-all relative ${
              mobileActiveTab === "timeline"
                ? "text-purple-400"
                : "text-white/50 hover:text-white/70"
            }`}
          >
            <div className="relative">
              <ListTodo className={`w-5 h-5 ${mobileActiveTab === "timeline" ? "text-purple-400" : ""}`} />
              {feedbacks.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-500 text-[9px] font-bold text-white flex items-center justify-center">
                  {feedbacks.length > 9 ? "9+" : feedbacks.length}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">Alterações</span>
            {mobileActiveTab === "timeline" && (
              <div className="absolute bottom-1 w-8 h-0.5 rounded-full bg-purple-500" />
            )}
          </button>
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

      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsHelp
        shortcuts={shortcuts}
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
      />
    </div>
  );
}
