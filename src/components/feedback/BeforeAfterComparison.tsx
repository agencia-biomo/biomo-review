"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  X,
  Upload,
  Eye,
  Image as ImageIcon,
  ArrowLeftRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Check,
  Loader2,
} from "lucide-react";

interface BeforeAfterComparisonProps {
  beforeImage: string; // Original screenshot from feedback
  afterImage?: string; // User uploaded "after" image
  isOpen: boolean;
  onClose: () => void;
  onSaveAfterImage?: (imageUrl: string) => void;
  canEdit?: boolean;
}

type ViewMode = "slider" | "side-by-side" | "toggle";

export function BeforeAfterComparison({
  beforeImage,
  afterImage: initialAfterImage,
  isOpen,
  onClose,
  onSaveAfterImage,
  canEdit = true,
}: BeforeAfterComparisonProps) {
  const [afterImage, setAfterImage] = useState<string | undefined>(initialAfterImage);
  const [viewMode, setViewMode] = useState<ViewMode>("slider");
  const [sliderPosition, setSliderPosition] = useState(50);
  const [showBefore, setShowBefore] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle slider drag
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setSliderPosition((x / rect.width) * 100);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging]);

  // Handle file upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecione uma imagem");
      return;
    }

    setIsUploading(true);

    try {
      // For demo, use local file reader
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setAfterImage(dataUrl);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);

      // TODO: Upload to Firebase Storage
      // const formData = new FormData();
      // formData.append('file', file);
      // formData.append('folder', 'comparisons');
      // const response = await fetch('/api/upload', { method: 'POST', body: formData });
      // const data = await response.json();
      // if (data.success) setAfterImage(data.url);
    } catch (error) {
      console.error("Error uploading file:", error);
      setIsUploading(false);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Save comparison
  const handleSave = () => {
    if (afterImage && onSaveAfterImage) {
      onSaveAfterImage(afterImage);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-5xl max-h-[95vh] overflow-hidden m-4 bg-[#0A0A0A] rounded-2xl border border-white/10 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
              <ArrowLeftRight className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white">Comparacao Antes/Depois</h2>
              <p className="text-xs text-white/50">Compare o estado original com a implementacao</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
              {([
                { mode: "slider" as ViewMode, label: "Slider" },
                { mode: "side-by-side" as ViewMode, label: "Lado a lado" },
                { mode: "toggle" as ViewMode, label: "Alternar" },
              ]).map(({ mode, label }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    viewMode === mode
                      ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
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
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            {/* Zoom controls */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoom(Math.max(50, zoom - 10))}
                className="w-7 h-7 text-white/50 hover:text-white"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-xs text-white/50 w-10 text-center">{zoom}%</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoom(Math.min(200, zoom + 10))}
                className="w-7 h-7 text-white/50 hover:text-white"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoom(100)}
                className="w-7 h-7 text-white/50 hover:text-white"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            {viewMode === "toggle" && (
              <button
                onClick={() => setShowBefore(!showBefore)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                  showBefore
                    ? "bg-red-500/20 border border-red-500/30 text-red-300"
                    : "bg-green-500/20 border border-green-500/30 text-green-300"
                }`}
              >
                <Eye className="w-4 h-4" />
                {showBefore ? "Vendo: Antes" : "Vendo: Depois"}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {canEdit && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Upload &quot;Depois&quot;
                </Button>
              </>
            )}

            {afterImage && onSaveAfterImage && (
              <Button
                size="sm"
                onClick={handleSave}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
              >
                <Check className="w-4 h-4 mr-2" />
                Salvar Comparacao
              </Button>
            )}
          </div>
        </div>

        {/* Comparison Area */}
        <div className="flex-1 overflow-auto p-4">
          <div
            ref={containerRef}
            className="relative w-full h-full min-h-[400px] rounded-xl overflow-hidden bg-black"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top left" }}
          >
            {/* Slider Mode */}
            {viewMode === "slider" && (
              <>
                {/* Before Image (full) */}
                <img
                  src={beforeImage}
                  alt="Antes"
                  className="absolute inset-0 w-full h-full object-contain"
                />

                {/* After Image (clipped) */}
                {afterImage && (
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
                  >
                    <img
                      src={afterImage}
                      alt="Depois"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                {/* Slider Handle */}
                {afterImage && (
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-10"
                    style={{ left: `${sliderPosition}%` }}
                    onMouseDown={() => setIsDragging(true)}
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center">
                      <ArrowLeftRight className="w-5 h-5 text-black" />
                    </div>
                    {/* Labels */}
                    <div className="absolute top-4 right-2 px-2 py-1 rounded bg-red-500 text-white text-xs font-medium">
                      Antes
                    </div>
                    <div className="absolute top-4 left-2 px-2 py-1 rounded bg-green-500 text-white text-xs font-medium">
                      Depois
                    </div>
                  </div>
                )}

                {/* No after image placeholder */}
                {!afterImage && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-4">
                        <ImageIcon className="w-10 h-10 text-white/30" />
                      </div>
                      <p className="text-white/50 mb-2">Imagem &quot;Depois&quot; nao adicionada</p>
                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="border-white/20 text-white/70"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Fazer Upload
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Side by Side Mode */}
            {viewMode === "side-by-side" && (
              <div className="flex h-full gap-4">
                <div className="flex-1 relative">
                  <div className="absolute top-4 left-4 px-2 py-1 rounded bg-red-500 text-white text-xs font-medium z-10">
                    Antes
                  </div>
                  <img
                    src={beforeImage}
                    alt="Antes"
                    className="w-full h-full object-contain rounded-lg border border-white/10"
                  />
                </div>
                <div className="flex-1 relative">
                  <div className="absolute top-4 left-4 px-2 py-1 rounded bg-green-500 text-white text-xs font-medium z-10">
                    Depois
                  </div>
                  {afterImage ? (
                    <img
                      src={afterImage}
                      alt="Depois"
                      className="w-full h-full object-contain rounded-lg border border-white/10"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center rounded-lg border border-dashed border-white/20 bg-white/5">
                      <div className="text-center">
                        <ImageIcon className="w-12 h-12 text-white/20 mx-auto mb-2" />
                        <p className="text-white/40 text-sm">Sem imagem</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Toggle Mode */}
            {viewMode === "toggle" && (
              <div className="relative w-full h-full">
                <div className="absolute top-4 left-4 px-2 py-1 rounded text-white text-xs font-medium z-10"
                  style={{ backgroundColor: showBefore ? "#ef4444" : "#22c55e" }}>
                  {showBefore ? "Antes" : "Depois"}
                </div>
                <img
                  src={showBefore ? beforeImage : (afterImage || beforeImage)}
                  alt={showBefore ? "Antes" : "Depois"}
                  className="w-full h-full object-contain transition-opacity duration-300"
                />
                {!showBefore && !afterImage && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <p className="text-white/50">Sem imagem &quot;Depois&quot;</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/[0.02]">
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/40">
              Use o slider para comparar as versoes ou alterne entre elas
            </p>
            <div className="flex items-center gap-3 text-xs text-white/40">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-500" />
                Antes (Original)
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-500" />
                Depois (Implementado)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
