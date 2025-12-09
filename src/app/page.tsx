"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Project } from "@/types";
import { ProjectCard } from "@/components/project/ProjectCard";
import { CreateProjectModal, CreateProjectData } from "@/components/project/CreateProjectModal";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  FolderOpen,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  List,
  ArrowUpRight,
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { data: session } = useSession();
  const [projects, setProjects] = useState<(Project & { id: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Load projects from API
  const loadProjects = useCallback(async () => {
    try {
      const response = await fetch("/api/projects");
      const data = await response.json();
      if (data.success) {
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error("Error loading projects:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Create project
  const handleCreateProject = async (data: CreateProjectData) => {
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        siteUrl: data.siteUrl,
        description: data.description,
        clientEmail: data.clientEmail,
        createdBy: session?.user?.name || "admin",
      }),
    });

    const result = await response.json();

    if (result.success) {
      await loadProjects();
    } else {
      throw new Error(result.error);
    }
  };

  // Open project viewer
  const handleOpenProject = (projectId: string) => {
    router.push(`/projetos/${projectId}`);
  };

  // Copy public link
  const handleCopyLink = async (project: Project & { id: string }) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/p/${project.publicAccessToken}`;
    try {
      await navigator.clipboard.writeText(link);
      alert("Link copiado para a area de transferencia!");
    } catch {
      prompt("Copie o link:", link);
    }
  };

  // Delete project
  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Tem certeza que deseja excluir este projeto? Esta acao nao pode ser desfeita.")) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        await loadProjects();
      }
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  // Filter projects by search
  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.siteUrl.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const totalProjects = projects.length;
  const recentProjects = projects.filter(p => {
    const created = new Date(p.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return created > weekAgo;
  }).length;

  return (
    <div className="min-h-screen bg-[#09090B] flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Hero Header */}
        <div className="relative overflow-hidden border-b border-white/10">
          {/* Background Effects */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
          </div>

          <div className="relative px-8 py-10">
            {/* Welcome Message */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/30">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-xs font-medium text-purple-300">Dashboard</span>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Bem-vindo, {session?.user?.name || "Usuario"}
              </h1>
              <p className="text-white/60">
                Gerencie seus projetos e acompanhe o feedback dos clientes
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="group p-5 rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 hover:border-purple-500/30 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <FolderOpen className="w-5 h-5 text-white" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-purple-400 transition-colors" />
                </div>
                <p className="text-2xl font-bold text-white mb-1">{totalProjects}</p>
                <p className="text-sm text-white/50">Total de Projetos</p>
              </div>

              <div className="group p-5 rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 hover:border-purple-500/30 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-green-400 transition-colors" />
                </div>
                <p className="text-2xl font-bold text-white mb-1">{recentProjects}</p>
                <p className="text-sm text-white/50">Novos esta semana</p>
              </div>

              <div className="group p-5 rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 hover:border-purple-500/30 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-yellow-400 transition-colors" />
                </div>
                <p className="text-2xl font-bold text-white mb-1">24</p>
                <p className="text-sm text-white/50">Feedbacks Pendentes</p>
              </div>

              <div className="group p-5 rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 hover:border-purple-500/30 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-blue-400 transition-colors" />
                </div>
                <p className="text-2xl font-bold text-white mb-1">156</p>
                <p className="text-sm text-white/50">Concluidos este mes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Projects Section */}
        <div className="p-8">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Meus Projetos</h2>
              <p className="text-sm text-white/50">
                {filteredProjects.length} projeto{filteredProjects.length !== 1 ? "s" : ""} encontrado{filteredProjects.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg shadow-purple-500/30"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Projeto
            </Button>
          </div>

          {/* Search & Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                placeholder="Buscar projetos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-11 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl"
              />
            </div>

            <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-all ${
                  viewMode === "grid"
                    ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white"
                    : "text-white/50 hover:text-white"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-all ${
                  viewMode === "list"
                    ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white"
                    : "text-white/50 hover:text-white"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Projects Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin mx-auto mb-4" />
                <p className="text-sm text-white/50">Carregando projetos...</p>
              </div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              {projects.length === 0 ? (
                <>
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center mb-6">
                    <FolderOpen className="w-10 h-10 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Nenhum projeto ainda</h3>
                  <p className="text-white/50 mb-6 max-w-md">
                    Crie seu primeiro projeto para comecar a receber feedback visual dos seus clientes
                  </p>
                  <Button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg shadow-purple-500/30"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeiro Projeto
                  </Button>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                    <Search className="w-10 h-10 text-white/30" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Nenhum resultado</h3>
                  <p className="text-white/50">
                    Nenhum projeto encontrado para &quot;{searchQuery}&quot;
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className={`
              ${viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                : "space-y-3"
              }
            `}>
              {filteredProjects.map((project, index) => (
                <div
                  key={project.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <ProjectCard
                    project={project}
                    viewMode={viewMode}
                    onOpen={() => handleOpenProject(project.id)}
                    onEdit={() => alert("Em breve: edicao de projeto")}
                    onDelete={() => handleDeleteProject(project.id)}
                    onCopyLink={() => handleCopyLink(project)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateProject}
      />
    </div>
  );
}
