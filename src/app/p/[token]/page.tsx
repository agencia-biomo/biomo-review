"use client";

import { useState, useEffect, useCallback, use } from "react";
import { IframeViewer } from "@/components/project/IframeViewer";
import { FeedbackTimeline } from "@/components/feedback/FeedbackTimeline";
import { FeedbackModal, FeedbackFormData } from "@/components/feedback/FeedbackModal";
import { FeedbackDetailModal } from "@/components/feedback/FeedbackDetailModal";
import { Feedback, ClickPosition, Project } from "@/types";
import { ExternalLink, AlertCircle } from "lucide-react";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default function PublicProjectPage({ params }: PageProps) {
  const { token } = use(params);

  const [project, setProject] = useState<(Project & { id: string }) | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingClickPosition, setPendingClickPosition] = useState<ClickPosition | null>(null);
  const [pendingScreenshot, setPendingScreenshot] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Helper to safely parse JSON response
  const safeJsonParse = async (response: Response) => {
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Response is not JSON");
    }
    return response.json();
  };

  // Load project by token
  const loadData = useCallback(async () => {
    try {
      // Load project by public token
      const projectRes = await fetch(`/api/projects/public/${token}`);

      // Check if response is JSON
      const projectData = await safeJsonParse(projectRes);

      if (!projectData.success) {
        setError(projectData.error || "Projeto nao encontrado ou link expirado");
        setIsLoading(false);
        return;
      }

      setProject(projectData.project);

      // Load feedbacks
      const feedbacksRes = await fetch(`/api/feedbacks?projectId=${projectData.project.id}`);
      const feedbacksData = await safeJsonParse(feedbacksRes);

      if (feedbacksData.success) {
        setFeedbacks(feedbacksData.feedbacks || []);
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Erro ao carregar projeto. Verifique se o link esta correto.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

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

  // Handle creating a new feedback
  const handleCreateFeedback = (clickPosition: ClickPosition, screenshot: string) => {
    setPendingClickPosition(clickPosition);
    setPendingScreenshot(screenshot);
    setIsModalOpen(true);
  };

  // Handle submitting the feedback form
  const handleSubmitFeedback = async (data: FeedbackFormData) => {
    if (!project) return;

    const response = await fetch("/api/feedbacks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: project.id,
        title: data.title,
        description: data.description,
        priority: data.priority,
        clickPosition: data.clickPosition,
        screenshot: data.screenshot,
        audioUrl: data.audioUrl,
        createdBy: "cliente", // Acesso publico = cliente
      }),
    });

    const result = await safeJsonParse(response);

    if (result.success) {
      await loadData();
    } else {
      throw new Error(result.error || "Erro ao criar feedback");
    }
  };

  // Handle clicking a pin
  const handlePinClick = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setIsDetailModalOpen(true);
  };

  // Handle clicking "New" button in timeline
  const handleNewFeedback = () => {
    alert('Clique em "Marcar Alteracao" e depois clique em qualquer ponto do site para criar uma solicitacao.');
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Carregando projeto...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Link Invalido ou Expirado</h1>
          <p className="text-muted-foreground mb-4">
            {error || "Este link de acesso nao e valido ou o projeto foi desativado."}
          </p>
          <p className="text-sm text-muted-foreground">
            Entre em contato com a equipe Biomo para obter um novo link de acesso.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header - Simplificado para cliente */}
      <header className="h-14 bg-card border-b border-border flex items-center px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">B</span>
          </div>
          <div>
            <h1 className="font-semibold text-sm">{project.name}</h1>
            <a
              href={project.siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              {new URL(project.siteUrl).hostname}
            </a>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {feedbacks.length} alteracoes
          </span>
          <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
            Acesso Cliente
          </span>
        </div>
      </header>

      {/* Instrucoes para primeira vez */}
      {feedbacks.length === 0 && (
        <div className="bg-primary/5 border-b border-primary/20 px-4 py-3 text-center">
          <p className="text-sm text-primary">
            <strong>Bem-vindo!</strong> Clique no botao &quot;Marcar Alteracao&quot; abaixo e depois clique em qualquer parte do site para solicitar uma mudanca.
          </p>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Iframe Viewer */}
        <div className="flex-1">
          <IframeViewer
            siteUrl={project.siteUrl}
            feedbacks={feedbacks}
            onPinClick={handlePinClick}
            onCreateFeedback={handleCreateFeedback}
          />
        </div>

        {/* Timeline Sidebar */}
        <div className="w-80 flex-shrink-0">
          <FeedbackTimeline
            feedbacks={feedbacks}
            selectedFeedback={selectedFeedback}
            onSelectFeedback={handlePinClick}
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

      {/* Feedback Detail Modal - Cliente nao pode mudar status */}
      {selectedFeedback && (
        <FeedbackDetailModal
          feedback={selectedFeedback as Feedback & { id: string }}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedFeedback(null);
          }}
          canChangeStatus={false}
        />
      )}
    </div>
  );
}
