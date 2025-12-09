"use client";

import { useState, useRef, useEffect } from "react";
import { ClickPosition, FeedbackPriority, PRIORITY_LABELS, PRIORITY_COLORS } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Loader2, Target, Sparkles, MapPin, ArrowRight, Mic, Square, Trash2, Play, Pause } from "lucide-react";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FeedbackFormData) => Promise<void>;
  clickPosition: ClickPosition | null;
  screenshot: string | null;
}

export interface FeedbackFormData {
  title: string;
  description: string;
  priority: FeedbackPriority;
  clickPosition: ClickPosition;
  screenshot: string;
  audioUrl?: string;
}

export function FeedbackModal({
  isOpen,
  onClose,
  onSubmit,
  clickPosition,
  screenshot,
}: FeedbackModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<FeedbackPriority>("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      stopRecording();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      setAudioBlob(null);
      setAudioUrl(null);
      setRecordingTime(0);
      setIsPlaying(false);
    }
  }, [isOpen]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Nao foi possivel acessar o microfone. Verifique as permissoes.");
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Delete recording
  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setIsPlaying(false);
  };

  // Play/Pause audio
  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Handle audio ended
  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  // Upload audio to server
  const uploadAudio = async (): Promise<string | undefined> => {
    if (!audioBlob) return undefined;

    setIsUploading(true);
    try {
      const formData = new FormData();
      const fileName = `audio-feedback-${Date.now()}.webm`;
      const audioFile = new window.File([audioBlob], fileName, { type: "audio/webm" });
      formData.append("file", audioFile);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Upload failed - server returned invalid response");
      }

      const result = await response.json();

      if (result.success) {
        return result.url;
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("Error uploading audio:", error);
      return undefined;
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen || !clickPosition || !screenshot) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    try {
      // Upload audio if exists
      let uploadedAudioUrl: string | undefined;
      if (audioBlob) {
        uploadedAudioUrl = await uploadAudio();
      }

      await onSubmit({
        title,
        description,
        priority,
        clickPosition,
        screenshot,
        audioUrl: uploadedAudioUrl,
      });

      // Reset form
      setTitle("");
      setDescription("");
      setPriority("medium");
      deleteRecording();
      onClose();
    } catch (error) {
      console.error("Error submitting feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-auto m-4 bg-[#0A0A0A] rounded-2xl border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white">Nova Solicitacao</h2>
              <p className="text-sm text-white/50">Descreva a alteracao desejada</p>
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Screenshot Preview */}
          <div>
            <Label className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Captura do Local
            </Label>
            <div className="relative rounded-xl overflow-hidden border border-white/10 bg-neutral-900">
              <img
                src={screenshot}
                alt="Screenshot"
                className="w-full h-auto max-h-48 object-contain"
              />
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <MapPin className="w-3 h-3" />
                  <span>Posicao: {clickPosition.x.toFixed(1)}% x {clickPosition.y.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-sm font-medium text-white mb-2 block">
              Titulo (resumo curto)
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Alterar cor do botao de comprar"
              required
              className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium text-white mb-2 block">
              Descricao (detalhes da alteracao)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva em detalhes o que precisa ser alterado..."
              required
              rows={4}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl resize-none"
            />
          </div>

          {/* Audio Recording */}
          <div>
            <Label className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <Mic className="w-4 h-4 text-purple-400" />
              Gravacao de Audio (opcional)
            </Label>
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              {!audioUrl ? (
                // Recording controls
                <div className="flex items-center gap-3">
                  {!isRecording ? (
                    <Button
                      type="button"
                      onClick={startRecording}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      <Mic className="w-4 h-4 mr-2" />
                      Gravar Audio
                    </Button>
                  ) : (
                    <>
                      <Button
                        type="button"
                        onClick={stopRecording}
                        className="bg-red-600 hover:bg-red-700 text-white animate-pulse"
                      >
                        <Square className="w-4 h-4 mr-2" />
                        Parar
                      </Button>
                      <div className="flex items-center gap-2 text-white">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="font-mono text-sm">{formatTime(recordingTime)}</span>
                      </div>
                    </>
                  )}
                  {!isRecording && (
                    <span className="text-xs text-white/50">
                      Clique para gravar uma explicacao em audio
                    </span>
                  )}
                </div>
              ) : (
                // Playback controls
                <div className="flex items-center gap-3">
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onEnded={handleAudioEnded}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    onClick={togglePlayback}
                    variant="outline"
                    size="icon"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Mic className="w-4 h-4 text-purple-400" />
                      <span className="text-sm text-white">Audio gravado</span>
                      <span className="text-xs text-white/50 font-mono">
                        {formatTime(recordingTime)}
                      </span>
                    </div>
                    <div className="h-1 mt-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 w-full" />
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={deleteRecording}
                    variant="ghost"
                    size="icon"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Priority */}
          <div>
            <Label className="text-sm font-medium text-white mb-3 block">Prioridade</Label>
            <div className="flex gap-2">
              {(Object.keys(PRIORITY_LABELS) as FeedbackPriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`
                    flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border
                    ${priority === p
                      ? `${PRIORITY_COLORS[p]} text-white border-transparent shadow-lg`
                      : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
                    }
                  `}
                >
                  {PRIORITY_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isUploading || !title.trim() || !description.trim()}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg shadow-purple-500/30 disabled:opacity-50"
            >
              {isSubmitting || isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isUploading ? "Enviando audio..." : "Enviando..."}
                </>
              ) : (
                <>
                  Enviar Solicitacao
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
