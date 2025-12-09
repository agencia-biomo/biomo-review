"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Comment } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Send,
  Loader2,
  User,
  Paperclip,
  X,
  Image as ImageIcon,
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
  FileText,
  File,
  Volume2,
} from "lucide-react";
import { formatRelativeDate } from "@/lib/date-utils";

interface CommentThreadProps {
  feedbackId: string;
  authorRole?: "admin" | "team" | "client";
}

// Mock users for @mentions
const MOCK_USERS = [
  { id: "admin", name: "Administrador", role: "admin" },
  { id: "equipe1", name: "Joao Silva", role: "team" },
  { id: "equipe2", name: "Maria Santos", role: "team" },
  { id: "cliente", name: "Cliente", role: "client" },
];

// File size limit: 30MB
const MAX_FILE_SIZE = 30 * 1024 * 1024;
const MAX_FILES = 10;

// Accepted file types
const ACCEPTED_FILE_TYPES = [
  "image/*",
  "application/pdf",
  "video/*",
  "audio/*",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".zip",
  ".rar",
];

export function CommentThread({ feedbackId, authorRole = "client" }: CommentThreadProps) {
  const [comments, setComments] = useState<(Comment & { id: string })[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentPreviews, setAttachmentPreviews] = useState<{ url: string; type: string; name: string }[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // @mentions state
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Filtered users for mentions
  const filteredUsers = MOCK_USERS.filter(user =>
    user.name.toLowerCase().includes(mentionSearch.toLowerCase()) ||
    user.id.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  // Helper to safely parse JSON response
  const safeJsonParse = async (response: Response) => {
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Response is not JSON");
    }
    return response.json();
  };

  // Load comments
  const loadComments = useCallback(async () => {
    console.log("[CommentThread] loadComments called for feedbackId:", feedbackId);
    try {
      const response = await fetch(`/api/comments?feedbackId=${feedbackId}`);
      console.log("[CommentThread] loadComments response status:", response.status);
      const data = await safeJsonParse(response);
      console.log("[CommentThread] loadComments data:", data.success, "comments:", data.comments?.length);
      if (data.success) {
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error("[CommentThread] Error loading comments:", error);
    } finally {
      setIsLoading(false);
    }
  }, [feedbackId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Handle text change with @mention detection
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const position = e.target.selectionStart || 0;
    setNewComment(text);
    setCursorPosition(position);

    // Check for @ mention
    const textBeforeCursor = text.slice(0, position);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      if (!textAfterAt.includes(" ")) {
        setMentionSearch(textAfterAt);
        setShowMentions(true);
        setMentionIndex(0);
        return;
      }
    }
    setShowMentions(false);
  };

  // Handle keyboard navigation in mentions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showMentions) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setMentionIndex(prev => Math.min(prev + 1, filteredUsers.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setMentionIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && filteredUsers.length > 0) {
      e.preventDefault();
      selectMention(filteredUsers[mentionIndex]);
    } else if (e.key === "Escape") {
      setShowMentions(false);
    }
  };

  // Select a mention
  const selectMention = (user: typeof MOCK_USERS[0]) => {
    const textBeforeCursor = newComment.slice(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    const textAfterCursor = newComment.slice(cursorPosition);

    const newText = textBeforeCursor.slice(0, lastAtIndex) + `@${user.name} ` + textAfterCursor;
    setNewComment(newText);
    setShowMentions(false);

    setTimeout(() => {
      textareaRef.current?.focus();
      const newPos = lastAtIndex + user.name.length + 2;
      textareaRef.current?.setSelectionRange(newPos, newPos);
    }, 0);
  };

  // Handle file selection with 30MB limit
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    const validFiles: File[] = [];
    const newPreviews: { url: string; type: string; name: string }[] = [];

    files.forEach(file => {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        alert(`Arquivo "${file.name}" excede o limite de 30MB`);
        return;
      }

      // Check total files limit
      if (attachments.length + validFiles.length >= MAX_FILES) {
        alert(`Maximo de ${MAX_FILES} arquivos permitidos`);
        return;
      }

      validFiles.push(file);

      // Create preview based on file type
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setAttachmentPreviews(prev => [...prev, {
            url: e.target?.result as string,
            type: "image",
            name: file.name
          }]);
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith("video/")) {
        const url = URL.createObjectURL(file);
        newPreviews.push({ url, type: "video", name: file.name });
      } else if (file.type.startsWith("audio/")) {
        const url = URL.createObjectURL(file);
        newPreviews.push({ url, type: "audio", name: file.name });
      } else if (file.type === "application/pdf") {
        newPreviews.push({ url: "", type: "pdf", name: file.name });
      } else {
        newPreviews.push({ url: "", type: "file", name: file.name });
      }
    });

    if (validFiles.length > 0) {
      setAttachments(prev => [...prev, ...validFiles]);
      setAttachmentPreviews(prev => [...prev, ...newPreviews]);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
    setAttachmentPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Start audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Update recording time
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Nao foi possivel acessar o microfone. Verifique as permissoes.");
    }
  };

  // Stop audio recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  // Play/pause recorded audio
  const togglePlayAudio = () => {
    if (!audioRef.current && audioUrl) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    }

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Delete recorded audio
  const deleteAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setRecordingTime(0);
  };

  // Format recording time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Upload file to API
  const uploadFile = async (file: File): Promise<string> => {
    console.log("[CommentThread] uploadFile called:", file.name, file.type, file.size);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "comments");

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    console.log("[CommentThread] upload response status:", response.status);

    const data = await safeJsonParse(response);
    console.log("[CommentThread] upload response:", data.success ? "success" : data.error);

    if (data.success) {
      return data.url;
    }
    throw new Error(data.error || "Upload failed");
  };

  // Submit new comment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[CommentThread] handleSubmit called", { newComment, attachments: attachments.length, audioBlob: !!audioBlob, isSubmitting });

    if ((!newComment.trim() && attachments.length === 0 && !audioBlob) || isSubmitting) {
      console.log("[CommentThread] Submit blocked - no content or already submitting");
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      const uploadedUrls: string[] = [];

      // Upload attachments
      if (attachments.length > 0) {
        console.log("[CommentThread] Uploading", attachments.length, "attachments");
        for (let i = 0; i < attachments.length; i++) {
          const url = await uploadFile(attachments[i]);
          console.log("[CommentThread] Uploaded attachment", i + 1, url?.substring(0, 50));
          uploadedUrls.push(url);
          setUploadProgress(((i + 1) / attachments.length) * 100);
        }
      }

      // Upload audio if exists
      if (audioBlob) {
        console.log("[CommentThread] Uploading audio blob");
        // Create a File from the Blob
        const fileName = `audio-${Date.now()}.webm`;
        const audioFile = new window.File([audioBlob], fileName, { type: "audio/webm" });
        const audioFileUrl = await uploadFile(audioFile);
        console.log("[CommentThread] Audio uploaded:", audioFileUrl?.substring(0, 50));
        uploadedUrls.push(audioFileUrl);
      }

      console.log("[CommentThread] Sending comment to API", { feedbackId, contentLength: newComment.trim().length, attachments: uploadedUrls.length });

      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedbackId,
          content: newComment.trim(),
          authorRole,
          attachments: uploadedUrls,
        }),
      });

      console.log("[CommentThread] API response status:", response.status);
      const data = await safeJsonParse(response);
      console.log("[CommentThread] API response data:", data);

      if (data.success) {
        setNewComment("");
        setAttachments([]);
        setAttachmentPreviews([]);
        deleteAudio();
        await loadComments();
      } else {
        console.error("[CommentThread] API error:", data.error);
        alert(`Erro: ${data.error || "Falha ao enviar comentário"}`);
      }
    } catch (error) {
      console.error("[CommentThread] Error submitting comment:", error);
      alert("Erro ao enviar comentario. Tente novamente.");
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin": return "Admin";
      case "team": return "Equipe";
      case "client": return "Cliente";
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-purple-500/20 text-purple-300 border border-purple-500/30";
      case "team": return "bg-blue-500/20 text-blue-300 border border-blue-500/30";
      case "client": return "bg-green-500/20 text-green-300 border border-green-500/30";
      default: return "bg-gray-500/20 text-gray-300 border border-gray-500/30";
    }
  };

  // Render content with highlighted mentions
  const renderContent = (content: string) => {
    const parts = content.split(/(@\w+(?:\s\w+)?)/g);
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        return (
          <span key={i} className="text-purple-400 font-medium bg-purple-500/20 px-1 rounded">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // Get file icon
  const getFileIcon = (type: string) => {
    switch (type) {
      case "image": return <ImageIcon className="w-5 h-5 text-blue-400" />;
      case "video": return <Play className="w-5 h-5 text-purple-400" />;
      case "audio": return <Volume2 className="w-5 h-5 text-green-400" />;
      case "pdf": return <FileText className="w-5 h-5 text-red-400" />;
      default: return <File className="w-5 h-5 text-gray-400" />;
    }
  };

  // Check if URL is audio
  const isAudioUrl = (url: string) => {
    return url.includes("audio") || url.endsWith(".webm") || url.endsWith(".mp3") || url.endsWith(".wav");
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-sm text-white flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-xs">
          {comments.length}
        </span>
        Comentarios
      </h4>

      {/* Comments List */}
      <div className="space-y-3 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
              <User className="w-6 h-6 text-white/30" />
            </div>
            <p className="text-sm text-white/50">Nenhum comentario ainda</p>
            <p className="text-xs text-white/30 mt-1">Seja o primeiro a comentar!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-white/[0.03] rounded-xl p-3 text-sm border border-white/5 hover:border-white/10 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-white" />
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleColor(comment.authorRole)}`}>
                  {getRoleLabel(comment.authorRole)}
                </span>
                <span className="text-xs text-white/40 ml-auto">
                  {formatRelativeDate(comment.createdAt)}
                </span>
              </div>

              {comment.content && (
                <p className="text-white/80 whitespace-pre-wrap leading-relaxed pl-9">
                  {renderContent(comment.content)}
                </p>
              )}

              {/* Attachments */}
              {comment.attachments && comment.attachments.length > 0 && (
                <div className="flex gap-2 mt-2 pl-9 flex-wrap">
                  {comment.attachments.map((url, i) => (
                    isAudioUrl(url) ? (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                        <Volume2 className="w-4 h-4 text-green-400" />
                        <audio src={url} controls className="h-8 max-w-[200px]" />
                      </div>
                    ) : (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-16 h-16 rounded-lg bg-white/5 border border-white/10 overflow-hidden hover:border-purple-500/50 transition-colors"
                      >
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </a>
                    )
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* New Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={newComment}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Escreva um comentario... (use @ para mencionar)"
            rows={3}
            className="w-full resize-none text-sm bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20"
          />

          {/* @Mentions dropdown */}
          {showMentions && filteredUsers.length > 0 && (
            <div className="absolute bottom-full left-0 mb-1 w-full bg-[#1A1A1A] border border-white/10 rounded-xl shadow-xl overflow-hidden z-10">
              {filteredUsers.map((user, index) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => selectMention(user)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                    index === mentionIndex
                      ? "bg-purple-500/20 text-white"
                      : "text-white/70 hover:bg-white/5"
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-white/40">{getRoleLabel(user.role)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Audio Recording UI */}
        {(isRecording || audioUrl) && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30">
            {isRecording ? (
              <>
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm text-white font-mono">{formatTime(recordingTime)}</span>
                <span className="text-xs text-white/50">Gravando...</span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={stopRecording}
                  className="ml-auto bg-red-500/20 hover:bg-red-500/30 text-red-300"
                >
                  <Square className="w-4 h-4 mr-1" />
                  Parar
                </Button>
              </>
            ) : audioUrl && (
              <>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={togglePlayAudio}
                  className="w-8 h-8 bg-green-500/20 hover:bg-green-500/30 text-green-300"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <span className="text-sm text-white font-mono">{formatTime(recordingTime)}</span>
                <span className="text-xs text-white/50">Audio gravado</span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={deleteAudio}
                  className="ml-auto w-8 h-8 text-red-400 hover:bg-red-500/20"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        )}

        {/* Attachments Preview */}
        {attachmentPreviews.length > 0 && (
          <div className="flex gap-2 flex-wrap p-2 rounded-xl bg-white/[0.02] border border-white/10">
            {attachmentPreviews.map((preview, index) => (
              <div key={index} className="relative group">
                <div className="w-20 h-20 rounded-lg bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
                  {preview.type === "image" && preview.url ? (
                    <img src={preview.url} alt="" className="w-full h-full object-cover" />
                  ) : preview.type === "video" && preview.url ? (
                    <video src={preview.url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-2">
                      {getFileIcon(preview.type)}
                      <p className="text-[8px] text-white/50 mt-1 truncate max-w-[70px]">{preview.name}</p>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload Progress */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="h-1 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {/* File Upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_FILE_TYPES.join(",")}
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="w-9 h-9 text-white/50 hover:text-white hover:bg-white/10"
              title="Anexar arquivo (max 30MB)"
            >
              <Paperclip className="w-4 h-4" />
            </Button>

            {/* Audio Record Button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={!!audioUrl}
              className={`w-9 h-9 ${
                isRecording
                  ? "text-red-400 bg-red-500/20 hover:bg-red-500/30"
                  : "text-white/50 hover:text-white hover:bg-white/10"
              }`}
              title="Gravar audio"
            >
              <Mic className="w-4 h-4" />
            </Button>

            <span className="text-[10px] text-white/30 ml-2">
              Max {MAX_FILES} arquivos, 30MB cada
            </span>
          </div>

          <Button
            type="submit"
            size="sm"
            disabled={(!newComment.trim() && attachments.length === 0 && !audioBlob) || isSubmitting}
            className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4 mr-1" />
                Enviar
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
