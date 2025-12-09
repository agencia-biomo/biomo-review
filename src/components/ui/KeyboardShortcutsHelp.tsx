"use client";

import { X, Keyboard } from "lucide-react";
import { Button } from "./button";

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
}

interface KeyboardShortcutsHelpProps {
  shortcuts: Shortcut[];
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsHelp({ shortcuts, isOpen, onClose }: KeyboardShortcutsHelpProps) {
  if (!isOpen) return null;

  const formatKey = (shortcut: Shortcut) => {
    const parts: string[] = [];
    if (shortcut.ctrl) parts.push("⌘/Ctrl");
    if (shortcut.shift) parts.push("⇧");
    if (shortcut.alt) parts.push("⌥/Alt");
    parts.push(shortcut.key.toUpperCase());
    return parts;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg m-4 bg-[#0A0A0A] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
              <Keyboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white">Atalhos de Teclado</h2>
              <p className="text-xs text-white/50">Pressione ? para abrir/fechar</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white/50 hover:text-white hover:bg-white/10 rounded-xl"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Shortcuts List */}
        <div className="p-5 max-h-96 overflow-y-auto">
          <div className="space-y-3">
            {shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors"
              >
                <span className="text-sm text-white/70">{shortcut.description}</span>
                <div className="flex items-center gap-1">
                  {formatKey(shortcut).map((k, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 rounded-md text-xs font-mono bg-white/10 text-white border border-white/20"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/[0.02]">
          <p className="text-xs text-white/40 text-center">
            Dica: Atalhos nao funcionam quando voce esta digitando em um campo de texto
          </p>
        </div>
      </div>
    </div>
  );
}
