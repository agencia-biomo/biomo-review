"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Feedback, ClickPosition, STATUS_COLORS } from "@/types";
import { Button } from "@/components/ui/button";
import {
  MousePointer2,
  Smartphone,
  Monitor,
  MonitorSmartphone,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Target,
  Eye,
  EyeOff,
} from "lucide-react";

interface IframeViewerProps {
  siteUrl: string;
  feedbacks: Feedback[];
  selectedFeedbackId?: string | null;
  onPinClick: (feedback: Feedback) => void;
  onCreateFeedback: (clickPosition: ClickPosition, screenshot: string) => void;
}

// Encontra o feedback selecionado baseado no ID
function findSelectedFeedback(feedbacks: Feedback[], id: string | null | undefined): Feedback | null {
  if (!id) return null;
  return feedbacks.find(f => f.id === id) || null;
}

type ViewMode = "navigation" | "marking";
type ViewportSize = "mobile" | "tablet" | "desktop" | "responsive";

const VIEWPORT_SIZES = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 },
  responsive: { width: 0, height: 0 },
};

export function IframeViewer({
  siteUrl,
  feedbacks,
  selectedFeedbackId,
  onPinClick,
  onCreateFeedback,
}: IframeViewerProps) {
  const [mode, setMode] = useState<ViewMode>("navigation");
  const [viewport, setViewport] = useState<ViewportSize>("responsive");
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [showAllPins, setShowAllPins] = useState(false);
  const [highlightedPin, setHighlightedPin] = useState<string | null>(null);
  const [showScreenshotOverlay, setShowScreenshotOverlay] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Feedback selecionado (com screenshot)
  const selectedFeedback = findSelectedFeedback(feedbacks, selectedFeedbackId);

  // Quando um feedback é selecionado, apenas destacar o pin (sem mostrar preview automaticamente)
  useEffect(() => {
    if (selectedFeedbackId) {
      setHighlightedPin(selectedFeedbackId);
      // Não mostrar o overlay automaticamente - só quando clicar no pin
      // O overlay é mostrado apenas via handlePinClick

      if (!showAllPins) {
        // Auto-hide o highlight após 5 segundos se não estiver mostrando todos os pins
        const timer = setTimeout(() => {
          setHighlightedPin(null);
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [selectedFeedbackId, showAllPins]);

  useEffect(() => {
    const updateSize = () => {
      if (wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect();
        setContainerSize({
          width: rect.width - 32,
          height: rect.height - 32,
        });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const getIframeDimensions = useCallback(() => {
    if (viewport === "responsive") {
      return {
        width: containerSize.width,
        height: containerSize.height,
      };
    }
    return VIEWPORT_SIZES[viewport];
  }, [viewport, containerSize]);

  const iframeDimensions = getIframeDimensions();

  const captureScreenshot = useCallback(
    async (x: number, y: number, xPx: number, yPx: number, viewportWidth: number, viewportHeight: number): Promise<string> => {
      console.log(`[Screenshot] Capturando: ${viewportWidth}x${viewportHeight}`);
      console.log(`[Screenshot] Clique: ${xPx}px, ${yPx}px (${x.toFixed(2)}%, ${y.toFixed(2)}%)`);

      const response = await fetch("/api/screenshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: siteUrl,
          x,
          y,
          xPx: Math.round(xPx),  // Coordenadas em pixels para precisão
          yPx: Math.round(yPx),
          viewportWidth: Math.round(viewportWidth),
          viewportHeight: Math.round(viewportHeight),
          scrollX: 0,
          scrollY: 0,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Erro ao capturar screenshot");
      }

      return data.screenshot;
    },
    [siteUrl]
  );

  const handleOverlayClick = useCallback(
    async (e: React.MouseEvent<HTMLDivElement>) => {
      if (mode !== "marking" || isCapturing) return;

      const container = containerRef.current;
      const iframeElement = iframeRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();

      // Coordenadas em PIXELS (posição absoluta dentro do container)
      const xPx = e.clientX - rect.left;
      const yPx = e.clientY - rect.top;

      // Coordenadas em PERCENTUAL (para compatibilidade)
      const x = (xPx / rect.width) * 100;
      const y = (yPx / rect.height) * 100;

      // Dimensões EXATAS do container/iframe
      const viewportWidth = Math.round(rect.width);
      const viewportHeight = Math.round(rect.height);

      // Device pixel ratio para telas retina
      const devicePixelRatio = window.devicePixelRatio || 1;

      console.log(`[Click] Posição: ${xPx.toFixed(0)}px, ${yPx.toFixed(0)}px (${x.toFixed(2)}%, ${y.toFixed(2)}%)`);
      console.log(`[Click] Viewport: ${viewportWidth}x${viewportHeight}, DPR: ${devicePixelRatio}`);

      setIsCapturing(true);
      setCaptureError(null);

      try {
        const screenshot = await captureScreenshot(x, y, xPx, yPx, viewportWidth, viewportHeight);

        const clickPosition: ClickPosition = {
          x,
          y,
          xPx: Math.round(xPx),
          yPx: Math.round(yPx),
          pageUrl: siteUrl,
          scrollPosition: { x: 0, y: 0 },
          viewportSize: {
            width: viewportWidth,
            height: viewportHeight,
          },
          devicePixelRatio,
        };

        onCreateFeedback(clickPosition, screenshot);
        setMode("navigation");
      } catch (error) {
        console.error("Error capturing screenshot:", error);
        setCaptureError(
          error instanceof Error ? error.message : "Erro ao capturar screenshot"
        );
      } finally {
        setIsCapturing(false);
      }
    },
    [mode, isCapturing, siteUrl, iframeDimensions, onCreateFeedback, captureScreenshot]
  );

  const handleRefreshIframe = () => {
    if (iframeRef.current) {
      iframeRef.current.src = siteUrl;
    }
  };

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.1, 2));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.1, 0.5));
  const handleResetZoom = () => setScale(1);

  return (
    <div className="flex flex-col h-full bg-[#09090B]">
      {/* Toolbar - Responsiva */}
      <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 p-2 sm:p-3 bg-[#0A0A0A] border-b border-white/10 flex-wrap overflow-x-auto">
        {/* Mode buttons - Compactos em mobile */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant={mode === "navigation" ? "default" : "ghost"}
            size="sm"
            onClick={() => setMode("navigation")}
            className={`h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm ${mode === "navigation"
              ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white"
              : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            <MousePointer2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 sm:mr-2" />
            <span className="hidden sm:inline">Navegacao</span>
          </Button>
          <Button
            variant={mode === "marking" ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              setMode("marking");
              setCaptureError(null);
            }}
            className={`h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm ${mode === "marking"
              ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/30"
              : "text-white/60 hover:text-white hover:bg-white/10 border border-red-500/30"
            }`}
          >
            <Target className="w-3.5 sm:w-4 h-3.5 sm:h-4 sm:mr-2" />
            <span className="hidden sm:inline">Marcar</span>
          </Button>
        </div>

        <div className="hidden sm:block h-6 w-px bg-white/10" />

        {/* Viewport buttons - Ocultos em mobile muito pequeno */}
        <div className="hidden sm:flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewport("responsive")}
            title="Responsivo (100%)"
            className={`h-7 w-7 sm:h-8 sm:w-8 ${viewport === "responsive"
              ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white"
              : "text-white/50 hover:text-white hover:bg-white/10"
            }`}
          >
            <Maximize2 className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewport("mobile")}
            title="Mobile (375px)"
            className={`h-7 w-7 sm:h-8 sm:w-8 ${viewport === "mobile"
              ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white"
              : "text-white/50 hover:text-white hover:bg-white/10"
            }`}
          >
            <Smartphone className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewport("tablet")}
            title="Tablet (768px)"
            className={`h-7 w-7 sm:h-8 sm:w-8 ${viewport === "tablet"
              ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white"
              : "text-white/50 hover:text-white hover:bg-white/10"
            }`}
          >
            <MonitorSmartphone className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewport("desktop")}
            title="Desktop (1440px)"
            className={`hidden lg:flex h-7 w-7 sm:h-8 sm:w-8 ${viewport === "desktop"
              ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white"
              : "text-white/50 hover:text-white hover:bg-white/10"
            }`}
          >
            <Monitor className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
          </Button>
        </div>

        <div className="hidden lg:block h-6 w-px bg-white/10" />

        {/* Zoom controls - Ocultos em mobile */}
        <div className="hidden lg:flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            title="Diminuir zoom"
            disabled={scale <= 0.5}
            className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <button
            onClick={handleResetZoom}
            className="px-2 py-1 text-xs font-medium text-white/60 hover:text-white min-w-[40px] transition-colors"
            title="Resetar zoom"
          >
            {Math.round(scale * 100)}%
          </button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            title="Aumentar zoom"
            disabled={scale >= 2}
            className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefreshIframe}
          title="Recarregar site"
          className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10"
        >
          <RefreshCw className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
        </Button>

        <div className="hidden sm:block h-6 w-px bg-white/10" />

        {/* Toggle pins visibility - Compacto em mobile */}
        <Button
          variant={showAllPins ? "default" : "ghost"}
          size="sm"
          onClick={() => setShowAllPins(!showAllPins)}
          title={showAllPins ? "Ocultar marcacoes" : "Mostrar todas marcacoes"}
          className={`h-8 sm:h-9 px-2 sm:px-3 ${showAllPins
            ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white"
            : "text-white/50 hover:text-white hover:bg-white/10"
          }`}
        >
          {showAllPins ? (
            <>
              <Eye className="w-3.5 sm:w-4 h-3.5 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Pins</span>
            </>
          ) : (
            <>
              <EyeOff className="w-3.5 sm:w-4 h-3.5 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Pins</span>
            </>
          )}
        </Button>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <span className="hidden sm:inline text-xs sm:text-sm text-white/40 font-mono">
            {viewport === "responsive"
              ? `${Math.round(containerSize.width)}x${Math.round(containerSize.height)}`
              : `${VIEWPORT_SIZES[viewport].width}x${VIEWPORT_SIZES[viewport].height}`}
          </span>
          {feedbacks.length > 0 && (
            <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {feedbacks.length}
            </span>
          )}
        </div>
      </div>

      {/* Error message */}
      {captureError && (
        <div className="bg-red-500/10 border-b border-red-500/30 px-4 py-3 text-sm flex items-center justify-between">
          <span className="text-red-400">
            <strong>Erro:</strong> {captureError}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            onClick={() => setCaptureError(null)}
          >
            Fechar
          </Button>
        </div>
      )}

      {/* Iframe Container - Responsivo */}
      <div
        ref={wrapperRef}
        className="flex-1 overflow-auto p-2 sm:p-4"
        style={{
          background: "radial-gradient(circle at center, rgba(168, 85, 247, 0.03) 0%, transparent 70%)",
        }}
      >
        <div
          ref={containerRef}
          className="relative bg-white shadow-2xl shadow-black/50 transition-all duration-300 rounded-lg sm:rounded-xl overflow-hidden"
          style={{
            width: viewport === "responsive" ? "100%" : VIEWPORT_SIZES[viewport].width,
            height: viewport === "responsive" ? "100%" : VIEWPORT_SIZES[viewport].height,
            transform: viewport !== "responsive" ? `scale(${scale})` : undefined,
            transformOrigin: "top left",
            margin: viewport !== "responsive" ? "0 auto" : undefined,
          }}
        >
          {/* Iframe */}
          <iframe
            ref={iframeRef}
            src={siteUrl}
            className="w-full h-full border-0"
            title="Site Preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />

          {/* Screenshot Overlay - Mostra screenshot capturada com marcador ja desenhado */}
          {showScreenshotOverlay && selectedFeedback?.screenshot && (
            <div
              className="absolute inset-0 z-[60] animate-fade-in"
              onClick={() => setShowScreenshotOverlay(false)}
            >
              {/* Background overlay escurecido */}
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

              {/* Screenshot container */}
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="relative rounded-xl overflow-hidden shadow-2xl border-2 border-purple-500/50 animate-scale-in">
                  {/* Screenshot image - o marcador ja esta desenhado na imagem */}
                  <img
                    src={selectedFeedback.screenshot}
                    alt="Screenshot da marcacao"
                    className="max-w-full max-h-[calc(100vh-200px)] w-auto h-auto"
                    style={{ display: "block" }}
                  />

                  {/* Info card no topo */}
                  <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-4">
                    <div className="bg-[#18181B]/95 backdrop-blur text-white px-4 py-3 rounded-xl shadow-xl border border-purple-500/30 max-w-[80%]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-purple-400 font-bold text-lg">#{selectedFeedback.number}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[selectedFeedback.status]} text-white`}>
                          {selectedFeedback.status === "new" ? "Novo" :
                           selectedFeedback.status === "in_review" ? "Analise" :
                           selectedFeedback.status === "in_progress" ? "Andamento" : "Concluido"}
                        </span>
                      </div>
                      <p className="text-white font-medium">{selectedFeedback.title}</p>
                      {selectedFeedback.description && (
                        <p className="text-white/60 text-sm mt-1 line-clamp-2">{selectedFeedback.description}</p>
                      )}
                    </div>

                    {/* Botao fechar */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowScreenshotOverlay(false);
                      }}
                      className="flex-shrink-0 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors border border-white/20"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Hint na parte inferior */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                    <div className="bg-black/70 text-white/80 text-xs px-4 py-2 rounded-full backdrop-blur">
                      Clique em qualquer lugar para fechar
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Feedback Pins - Só aparecem quando showAllPins OU quando estão highlighted */}
          {feedbacks.map((feedback) => {
            const isHighlighted = highlightedPin === feedback.id;
            const isVisible = showAllPins || isHighlighted;

            if (!isVisible) return null;

            return (
              <div
                key={feedback.id}
                className={`
                  absolute z-40 cursor-pointer transition-all duration-300
                  ${isHighlighted ? "z-50" : ""}
                  ${isHighlighted ? "animate-bounce-in" : "animate-fade-in"}
                `}
                style={{
                  left: `${feedback.clickPosition.x}%`,
                  top: `${feedback.clickPosition.y}%`,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onPinClick(feedback);
                }}
              >
                <div className="relative -ml-5 -mt-5">
                  {/* Pulse ring animado quando destacado */}
                  {isHighlighted && (
                    <>
                      <div
                        className={`absolute inset-0 w-10 h-10 rounded-full animate-ping ${STATUS_COLORS[feedback.status]}`}
                        style={{ animationDuration: "1s" }}
                      />
                      <div
                        className={`absolute -inset-2 w-14 h-14 rounded-full animate-pulse ${STATUS_COLORS[feedback.status]} opacity-30`}
                      />
                    </>
                  )}

                  {/* Pin principal */}
                  <div
                    className={`
                      relative w-10 h-10 rounded-full flex items-center justify-center
                      text-white text-sm font-bold shadow-xl border-3 border-white
                      transition-all duration-300 hover:scale-110
                      ${STATUS_COLORS[feedback.status]}
                      ${isHighlighted ? "scale-125 ring-4 ring-white/60 shadow-2xl" : ""}
                    `}
                    title={`#${feedback.number}: ${feedback.title}`}
                  >
                    {feedback.number}
                  </div>

                  {/* Tooltip sempre visível quando destacado */}
                  <div
                    className={`
                      absolute left-12 top-0 transition-all duration-300 z-50
                      ${isHighlighted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0"}
                    `}
                  >
                    <div className="bg-[#18181B] text-white text-xs px-4 py-3 rounded-xl whitespace-nowrap shadow-2xl border border-purple-500/30">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-purple-400 font-bold">#{feedback.number}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${STATUS_COLORS[feedback.status]} text-white`}>
                          {feedback.status === "new" ? "Novo" :
                           feedback.status === "in_review" ? "Análise" :
                           feedback.status === "in_progress" ? "Andamento" : "Concluído"}
                        </span>
                      </div>
                      <p className="text-white/80 max-w-[200px] truncate">
                        {feedback.title}
                      </p>
                    </div>
                    {/* Arrow */}
                    <div className="absolute left-0 top-3 -translate-x-1 w-2 h-2 bg-[#18181B] rotate-45 border-l border-b border-purple-500/30" />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Click Overlay for marking mode */}
          {mode === "marking" && (
            <div
              className="absolute inset-0 z-30 cursor-crosshair transition-colors"
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.05)",
                backgroundImage: `
                  linear-gradient(to right, rgba(239, 68, 68, 0.08) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(239, 68, 68, 0.08) 1px, transparent 1px)
                `,
                backgroundSize: "50px 50px",
              }}
              onClick={handleOverlayClick}
            >
              {/* Capturing indicator */}
              {isCapturing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
                  <div className="bg-[#18181B] px-8 py-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4 border border-white/10">
                    <div className="w-12 h-12 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
                    <span className="font-medium text-white">Capturando screenshot...</span>
                    <span className="text-sm text-white/50">Aguarde alguns segundos</span>
                  </div>
                </div>
              )}

              {/* Instructions */}
              {!isCapturing && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
                  <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-5 py-2.5 rounded-full text-sm font-medium shadow-lg shadow-red-500/30 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Clique no ponto que deseja marcar
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
