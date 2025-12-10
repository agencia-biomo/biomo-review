"use client";

import { useState, useRef, useEffect } from "react";
import { Project } from "@/types";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/useReducedMotion";
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

// Animated Orb component for background
function AnimatedOrb({ delay = 0, size = 100, color = "purple" }: { delay?: number; size?: number; color?: string }) {
  const colors: Record<string, string> = {
    purple: "from-purple-500/30 to-purple-600/10",
    indigo: "from-indigo-500/30 to-indigo-600/10",
    blue: "from-blue-500/30 to-blue-600/10",
    pink: "from-pink-500/20 to-pink-600/10",
  };

  return (
    <div
      className={`absolute rounded-full bg-gradient-to-br ${colors[color]} blur-2xl animate-float`}
      style={{
        width: size,
        height: size,
        animationDelay: `${delay}s`,
        animationDuration: `${6 + Math.random() * 4}s`,
      }}
    />
  );
}

// Progress Ring component
function ProgressRing({ progress, size = 44, strokeWidth = 3 }: { progress: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-white/10"
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#progressGradient)"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700 ease-out"
      />
      <defs>
        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Favicon component with loading state
function SiteFavicon({ url, className = "" }: { url: string; className?: string }) {
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const domain = new URL(url).hostname;
      // Using Google's favicon service for reliability
      const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
      setFaviconUrl(favicon);
    } catch {
      setError(true);
      setLoading(false);
    }
  }, [url]);

  if (error || !faviconUrl) {
    return <Globe className={className} />;
  }

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
        </div>
      )}
      <img
        src={faviconUrl}
        alt=""
        aria-hidden="true"
        className={`${className} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
      />
    </div>
  );
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
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Extract domain from URL for display
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  const totalFeedbacks = feedbackStats.new + feedbackStats.inProgress + feedbackStats.completed;
  const completedPercentage = totalFeedbacks > 0
    ? Math.round((feedbackStats.completed / totalFeedbacks) * 100)
    : 0;

  // 3D Tilt effect handler (disabled when reduced motion is preferred)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || prefersReducedMotion) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePosition({ x, y });
  };

  // Disable 3D tilt effect when user prefers reduced motion (accessibility)
  const tiltStyle = prefersReducedMotion
    ? {} // No 3D transforms when reduced motion is enabled
    : isHovered
      ? {
          transform: `perspective(1000px) rotateX(${(mousePosition.y - 0.5) * -8}deg) rotateY(${(mousePosition.x - 0.5) * 8}deg) scale3d(1.02, 1.02, 1.02)`,
          transition: "transform 0.1s ease-out",
        }
      : {
          transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
          transition: "transform 0.4s ease-out",
        };

  if (viewMode === "list") {
    return (
      <article
        className="group p-4 rounded-xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 hover:border-purple-500/30 transition-all cursor-pointer relative overflow-hidden"
        onClick={onOpen}
        onKeyDown={(e) => e.key === 'Enter' && onOpen()}
        tabIndex={0}
        role="button"
        aria-label={`Projeto ${project.name}, ${totalFeedbacks} feedbacks`}
      >
        {/* Glow effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-purple-500/20 blur-xl" />
        </div>

        <div className="relative flex items-center gap-4">
          {/* Icon with favicon */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0 group-hover:border-purple-500/50 transition-all group-hover:shadow-lg group-hover:shadow-purple-500/20">
            <SiteFavicon url={project.siteUrl} className="w-6 h-6 text-purple-400" />
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
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
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
              <ArrowRight className="w-4 h-4 ml-1" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </article>
    );
  }

  // Grid View - Premium
  return (
    <article
      ref={cardRef}
      className="group rounded-2xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 hover:border-purple-500/40 transition-all overflow-hidden relative"
      style={tiltStyle}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={`Projeto ${project.name}`}
    >
      {/* Animated border glow */}
      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-purple-500/0 via-purple-500/50 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm pointer-events-none animate-border-flow" />

      {/* Card inner wrapper */}
      <div className="relative bg-gradient-to-br from-[#0A0A0A] to-[#0F0F11] rounded-2xl overflow-hidden">
        {/* Thumbnail with animated background */}
        <div
          className="relative h-40 flex items-center justify-center cursor-pointer overflow-hidden"
          onClick={onOpen}
        >
          {/* Animated mesh gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-indigo-900/30 to-black">
            {/* Floating orbs */}
            <div className="absolute inset-0 overflow-hidden">
              <AnimatedOrb delay={0} size={120} color="purple" />
              <AnimatedOrb delay={1.5} size={80} color="indigo" />
              <AnimatedOrb delay={3} size={100} color="pink" />
            </div>

            {/* Animated grid pattern */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(168, 85, 247, 0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(168, 85, 247, 0.1) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px',
                animation: 'grid-move 20s linear infinite',
              }}
            />

            {/* Noise texture overlay */}
            <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }} />
          </div>

          {/* Center icon container with favicon */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Progress ring around icon */}
            <div className="relative">
              {totalFeedbacks > 0 && (
                <div className="absolute -inset-2">
                  <ProgressRing progress={completedPercentage} size={88} strokeWidth={3} />
                </div>
              )}

              {/* Icon container */}
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 flex items-center justify-center group-hover:scale-110 group-hover:border-purple-500/50 transition-all duration-300 shadow-2xl shadow-purple-500/20">
                <SiteFavicon url={project.siteUrl} className="w-10 h-10 text-purple-400" />
              </div>
            </div>

            {/* Progress percentage */}
            {totalFeedbacks > 0 && (
              <div className="mt-3 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/10">
                <span className="text-xs font-medium text-white/80">
                  {completedPercentage}% concluido
                </span>
              </div>
            )}
          </div>

          {/* Spotlight effect following mouse (disabled when reduced motion is preferred) */}
          {!prefersReducedMotion && (
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{
                background: `radial-gradient(circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, rgba(168, 85, 247, 0.15) 0%, transparent 50%)`,
              }}
            />
          )}

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* View button on hover */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
            <Button
              size="sm"
              className="bg-white text-black hover:bg-white/90 shadow-lg shadow-black/50 font-medium"
            >
              Ver Projeto
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>

          {/* Quick actions */}
          <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
            <Button
              size="icon"
              className="w-9 h-9 bg-white/90 hover:bg-white text-black shadow-lg backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                onCopyLink();
              }}
              title="Copiar link"
            >
              <Link2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Status indicator */}
          {feedbackStats.new > 0 && (
            <div className="absolute top-3 left-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/90 backdrop-blur-sm shadow-lg shadow-red-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-xs font-medium text-white">{feedbackStats.new} novo{feedbackStats.new > 1 ? 's' : ''}</span>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Project Name */}
          <h3
            className="font-semibold text-white truncate mb-1.5 cursor-pointer hover:text-purple-300 transition-colors text-lg"
            onClick={onOpen}
          >
            {project.name}
          </h3>

          {/* Site URL */}
          <a
            href={project.siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-white/50 truncate flex items-center gap-1.5 mb-4 hover:text-purple-400 transition-colors group/link"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 group-hover/link:rotate-12 transition-transform" />
            <span className="truncate">{getDomain(project.siteUrl)}</span>
          </a>

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs mb-4 min-h-[20px]">
            {feedbackStats.inProgress > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/50 animate-pulse" />
                <span className="text-white/60">{feedbackStats.inProgress} em andamento</span>
              </span>
            )}
            {feedbackStats.completed > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 shadow-lg shadow-green-500/50" />
                <span className="text-white/60">{feedbackStats.completed} concluido{feedbackStats.completed > 1 ? 's' : ''}</span>
              </span>
            )}
            {totalFeedbacks === 0 && (
              <span className="text-white/40 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                Nenhum feedback ainda
              </span>
            )}
          </div>

          {/* Date */}
          <div className="flex items-center gap-1.5 text-xs text-white/40 mb-5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Criado {formatRelativeDate(project.createdAt)}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-4 border-t border-white/10">
            <Button
              size="sm"
              onClick={onOpen}
              className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all h-10"
            >
              Abrir
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white/50 hover:text-white hover:bg-white/10 h-10 w-10"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-[#18181B]/95 backdrop-blur-xl border-white/10 text-white shadow-xl"
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
    </article>
  );
}
