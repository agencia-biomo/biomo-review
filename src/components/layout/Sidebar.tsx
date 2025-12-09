"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  FolderKanban,
  LayoutDashboard,
  Settings,
  LogOut,
  User,
  ChevronDown,
  Sparkles,
  Bell,
  HelpCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const menuItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    description: "Visao geral",
  },
  {
    label: "Projetos",
    href: "/",
    icon: FolderKanban,
    description: "Gerenciar projetos",
  },
];

export function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <aside className="hidden lg:flex w-72 h-screen bg-[#0A0A0A] flex-col relative overflow-hidden">
      {/* Background Gradient Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      {/* Logo */}
      <div className="relative h-20 flex items-center px-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Image
            src="/logo-biomo.png"
            alt="Biomo"
            width={100}
            height={35}
            className="h-8 w-auto"
          />
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/30">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span className="text-[10px] font-medium text-purple-300">Review</span>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 relative z-10">
        <div className="mb-4">
          <span className="text-xs font-medium text-white/40 uppercase tracking-wider px-3">
            Menu
          </span>
        </div>
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <li key={item.href + item.label}>
                <Link
                  href={item.href}
                  className={`
                    group flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-200
                    ${isActive
                      ? "bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/30 text-white"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                    }
                  `}
                >
                  <div className={`
                    w-9 h-9 rounded-lg flex items-center justify-center transition-all
                    ${isActive
                      ? "bg-gradient-to-br from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/30"
                      : "bg-white/5 text-white/60 group-hover:bg-white/10 group-hover:text-white"
                    }
                  `}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium">{item.label}</span>
                    <p className={`text-xs ${isActive ? "text-white/60" : "text-white/40"}`}>
                      {item.description}
                    </p>
                  </div>
                  {isActive && (
                    <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-purple-500 to-indigo-500" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Quick Stats */}
        <div className="mt-8 p-4 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-white/60">Atividade Recente</span>
            <span className="text-[10px] text-purple-400">Hoje</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40">Feedbacks novos</span>
              <span className="text-sm font-semibold text-white">12</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40">Em andamento</span>
              <span className="text-sm font-semibold text-white">5</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40">Concluidos hoje</span>
              <span className="text-sm font-semibold text-green-400">8</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-white/10 relative z-10">
        {/* Help & Notifications */}
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 justify-start gap-2 text-white/60 hover:text-white hover:bg-white/5"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="text-sm">Ajuda</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="relative text-white/60 hover:text-white hover:bg-white/5"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-purple-500" />
          </Button>
        </div>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-3 py-3 h-auto hover:bg-white/5 rounded-xl"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-white">
                  {session?.user?.name || "Usuario"}
                </p>
                <p className="text-xs text-white/50">
                  {(session?.user as { role?: string })?.role === "admin"
                    ? "Administrador"
                    : "Equipe"}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-white/40" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 bg-[#18181B] border-white/10 text-white"
          >
            <DropdownMenuItem className="focus:bg-white/10 focus:text-white">
              <User className="w-4 h-4 mr-2" />
              Meu Perfil
            </DropdownMenuItem>
            <DropdownMenuItem className="focus:bg-white/10 focus:text-white">
              <Settings className="w-4 h-4 mr-2" />
              Configuracoes
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-red-400 focus:bg-red-500/10 focus:text-red-400"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
