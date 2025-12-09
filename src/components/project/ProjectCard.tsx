"use client";

import { Project } from "@/types";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  Settings,
  Trash2,
  Link2,
  Globe,
  ArrowRight,
  MoreVertical,
  Calendar,
  MessageSquare,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatRelativeDate } from "@/lib/date-utils";

interface ProjectCardProps {
  project: Project & { id: string };
  viewMode?: "grid" | "list";
  feedbackStats?: {
    new: number;
    inProgress: number;
    completed: number;
  };
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCopyLink: () => void;
}

export function ProjectCard({
  project,
  viewMode = "grid",
  feedbackStats = { new: 0, inProgress: 0, completed: 0 },
  onOpen,
  onEdit,
  onDelete,
  onCopyLink,
}: ProjectCardProps) {
  // Extract domain from URL for display
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  const totalFeedbacks = feedbackStats.new + feedbackStats.inProgress + feedbackStats.completed;

  if (viewMode === "list") {
    return (
      <div
        className="group p-4 rounded-xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 hover:border-purple-500/30 transition-all cursor-pointer"
        onClick={onOpen}
      >
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
            <Globe className="w-6 h-6 text-purple-400" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate mb-1 group-hover:text-purple-300 transition-colors">
              {project.name}
            </h3>
            <div className="flex items-center gap-4 text-sm text-white/50">
              <span className="flex items-center gap-1 truncate">
                <ExternalLink className="w-3 h-3" />
                {getDomain(project.siteUrl)}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatRelativeDate(project.createdAt)}
              </span>
              {totalFeedbacks > 0 && (
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  {totalFeedbacks} feedbacks
                </span>
              )}
            </div>
          </div>

          {/* Stats Badges */}
          <div className="hidden md:flex items-center gap-2">
            {feedbackStats.new > 0 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                {feedbackStats.new} novos
              </span>
            )}
            {feedbackStats.inProgress > 0 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                {feedbackStats.inProgress} em andamento
              </span>
            )}
            {feedbackStats.completed > 0 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                {feedbackStats.completed} concluidos
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onCopyLink();
              }}
              variant="ghost"
              className="text-white/50 hover:text-white hover:bg-white/10"
            >
              <Link2 className="w-4 h-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white/50 hover:text-white hover:bg-white/10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-[#18181B] border-white/10 text-white"
              >
                <DropdownMenuItem
                  className="focus:bg-white/10 focus:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configuracoes
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  className="text-red-400 focus:bg-red-500/10 focus:text-red-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              size="sm"
              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
              onClick={(e) => {
                e.stopPropagation();
                onOpen();
              }}
            >
              Abrir
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Grid View
  return (
    <div className="group rounded-2xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 hover:border-purple-500/30 transition-all overflow-hidden">
      {/* Thumbnail */}
      <div
        className="relative h-36 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 flex items-center justify-center cursor-pointer overflow-hidden"
        onClick={onOpen}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23A855F7' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/30 to-indigo-500/30 border border-purple-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Globe className="w-8 h-8 text-purple-400" />
        </div>

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* View button on hover */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
          <Button
            size="sm"
            className="bg-white text-black hover:bg-white/90 shadow-lg"
          >
            Ver Projeto
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Quick actions */}
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="secondary"
            className="w-8 h-8 bg-white/90 hover:bg-white text-black"
            onClick={(e) => {
              e.stopPropagation();
              onCopyLink();
            }}
            title="Copiar link"
          >
            <Link2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Project Name */}
        <h3
          className="font-semibold text-white truncate mb-1.5 cursor-pointer hover:text-purple-300 transition-colors"
          onClick={onOpen}
        >
          {project.name}
        </h3>

        {/* Site URL */}
        <a
          href={project.siteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-white/50 truncate flex items-center gap-1.5 mb-3 hover:text-purple-400 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{getDomain(project.siteUrl)}</span>
        </a>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs mb-3 min-h-[20px]">
          {feedbackStats.new > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
              <span className="text-white/60">{feedbackStats.new} novos</span>
            </span>
          )}
          {feedbackStats.inProgress > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/50" />
              <span className="text-white/60">{feedbackStats.inProgress} em andamento</span>
            </span>
          )}
          {feedbackStats.completed > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-lg shadow-green-500/50" />
              <span className="text-white/60">{feedbackStats.completed}</span>
            </span>
          )}
          {totalFeedbacks === 0 && (
            <span className="text-white/40">Nenhum feedback ainda</span>
          )}
        </div>

        {/* Date */}
        <div className="flex items-center gap-1.5 text-xs text-white/40 mb-4">
          <Calendar className="w-3 h-3" />
          <span>Criado {formatRelativeDate(project.createdAt)}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-white/10">
          <Button
            size="sm"
            onClick={onOpen}
            className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
          >
            Abrir
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="text-white/50 hover:text-white hover:bg-white/10"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-[#18181B] border-white/10 text-white"
            >
              <DropdownMenuItem
                className="focus:bg-white/10 focus:text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onCopyLink();
                }}
              >
                <Link2 className="w-4 h-4 mr-2" />
                Copiar Link
              </DropdownMenuItem>
              <DropdownMenuItem
                className="focus:bg-white/10 focus:text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Settings className="w-4 h-4 mr-2" />
                Configuracoes
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                className="text-red-400 focus:bg-red-500/10 focus:text-red-400"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
