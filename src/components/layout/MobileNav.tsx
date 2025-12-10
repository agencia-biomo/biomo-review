"use client";

import { useState, createContext, useContext, ReactNode } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  FolderKanban,
  LayoutDashboard,
  LogOut,
  User,
  Menu,
  X,
  Sparkles,
  ChevronRight,
  Users,
  BarChart3,
} from "lucide-react";

// Context for mobile nav state
interface MobileNavContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggle: () => void;
}

const MobileNavContext = createContext<MobileNavContextType | null>(null);

export function useMobileNav() {
  const context = useContext(MobileNavContext);
  if (!context) {
    throw new Error("useMobileNav must be used within MobileNavProvider");
  }
  return context;
}

export function MobileNavProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen((prev) => !prev);

  return (
    <MobileNavContext.Provider value={{ isOpen, setIsOpen, toggle }}>
      {children}
    </MobileNavContext.Provider>
  );
}

// Mobile Menu Button (hamburger)
export function MobileMenuButton() {
  const { toggle, isOpen } = useMobileNav();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className="lg:hidden text-white/60 hover:text-white hover:bg-white/10"
      aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
    >
      {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
    </Button>
  );
}

// Mobile Drawer Menu
export function MobileDrawer() {
  const { isOpen, setIsOpen } = useMobileNav();
  const { data: session } = useSession();

  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" });
  };

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
    {
      label: "Métricas",
      href: "/metricas",
      icon: BarChart3,
      description: "Relatórios e análises",
    },
    {
      label: "Administração",
      href: "/admin",
      icon: Users,
      description: "Equipe e clientes",
    },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-[280px] max-w-[85vw] bg-[#0A0A0A] z-50 lg:hidden shadow-2xl animate-slide-in-left">
        {/* Gradient backgrounds */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
        </div>

        {/* Header */}
        <div className="relative h-16 flex items-center justify-between px-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Image
              src="/logo-biomo.png"
              alt="Biomo"
              width={80}
              height={28}
              className="h-7 w-auto"
            />
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/30">
              <Sparkles className="w-2.5 h-2.5 text-purple-400" />
              <span className="text-[9px] font-medium text-purple-300">Review</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Menu Items */}
        <nav className="relative z-10 p-4">
          <div className="mb-3">
            <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider px-3">
              Menu
            </span>
          </div>
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href + item.label}>
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="group flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all text-white/60 hover:bg-white/5 hover:text-white active:bg-white/10"
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/5 text-white/60 group-hover:bg-white/10 group-hover:text-white transition-all">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium">{item.label}</span>
                      <p className="text-xs text-white/40">{item.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-[#0A0A0A]/80 backdrop-blur">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {session?.user?.name || "Usuario"}
              </p>
              <p className="text-xs text-white/50">
                {(session?.user as { role?: string })?.role === "admin"
                  ? "Administrador"
                  : "Equipe"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// Mobile Header (for pages that need it)
export function MobileHeader({ title, children }: { title?: string; children?: ReactNode }) {
  return (
    <header className="lg:hidden h-14 bg-[#0A0A0A] border-b border-white/10 flex items-center px-4 gap-3 sticky top-0 z-30">
      <MobileMenuButton />
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Image
          src="/logo-biomo.png"
          alt="Biomo"
          width={60}
          height={21}
          className="h-5 w-auto"
        />
        {title && (
          <>
            <span className="text-white/30">/</span>
            <span className="text-sm font-medium text-white truncate">{title}</span>
          </>
        )}
      </div>
      {children}
      <MobileDrawer />
    </header>
  );
}
