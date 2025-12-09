// User types
export type UserRole = 'admin' | 'team' | 'client';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  teamId?: string; // if role = team
  clientId?: string; // if role = client
  createdAt: Date;
  lastLoginAt: Date;
}

// Team types
export interface Team {
  id: string;
  name: string;
  members: string[]; // userIds
  createdAt: Date;
  createdBy: string; // userId
}

// Client types
export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  logo?: string; // Storage URL
  assignedTeamId: string;
  accessToken: string; // for public links
  createdAt: Date;
  createdBy: string; // userId
}

// Project types
export type ProjectStatus = 'active' | 'paused' | 'completed' | 'archived';

export interface Project {
  id: string;
  name: string;
  description?: string;
  siteUrl: string; // URL for iframe
  clientId: string;
  teamId: string;
  status: ProjectStatus;
  publicAccessEnabled: boolean;
  publicAccessToken?: string;
  thumbnail?: string; // Storage URL
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // userId
}

// Feedback types
export type FeedbackStatus =
  | 'new'
  | 'in_review'
  | 'in_progress'
  | 'waiting_client'
  | 'rejected'
  | 'completed';

export type FeedbackPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ClickPosition {
  x: number; // percentage of viewport (0-100)
  y: number; // percentage of viewport (0-100)
  xPx: number; // absolute X in pixels
  yPx: number; // absolute Y in pixels
  pageUrl: string; // URL of page in iframe
  scrollPosition: { x: number; y: number };
  viewportSize: { width: number; height: number };
  devicePixelRatio: number; // for retina displays
  elementSelector?: string; // CSS selector of clicked element
  elementHTML?: string; // HTML of clicked element
}

// Status History - tracks all status changes
export interface StatusHistoryEntry {
  fromStatus: FeedbackStatus | null; // null for initial status
  toStatus: FeedbackStatus;
  changedBy: string; // userId or role (admin/cliente)
  changedAt: Date;
  note?: string; // optional note explaining the change
}

export interface Feedback {
  id: string;
  projectId: string;
  number: number; // auto-increment per project: #1, #2, #3
  title: string; // short summary
  description: string; // detailed description
  screenshot?: string; // Storage URL - automatic print (before)
  afterImage?: string; // Storage URL - after implementation screenshot
  audioUrl?: string; // Storage URL - audio recording
  attachments: string[]; // Storage URLs - client uploads
  clickPosition: ClickPosition;
  status: FeedbackStatus;
  statusHistory?: StatusHistoryEntry[]; // history of all status changes
  priority: FeedbackPriority;
  deadline?: Date;
  assignedTo?: string; // team userId
  createdBy: string; // client userId
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// Comment types
export interface Comment {
  id: string;
  feedbackId: string;
  content: string; // supports @mentions
  attachments: string[]; // Storage URLs
  mentions: string[]; // mentioned userIds
  authorId: string;
  authorRole: UserRole;
  createdAt: Date;
  editedAt?: Date;
}

// Notification types
export type NotificationType =
  | 'mention'
  | 'status_change'
  | 'new_comment'
  | 'deadline_approaching'
  | 'new_feedback';

export interface Notification {
  id: string;
  userId: string; // recipient
  type: NotificationType;
  title: string;
  message: string;
  feedbackId?: string;
  projectId?: string;
  read: boolean;
  createdAt: Date;
  readAt?: Date;
}

// Activity Log types
export interface ActivityLog {
  id: string;
  projectId: string;
  feedbackId?: string;
  action: string;
  details: Record<string, unknown>;
  performedBy: string; // userId
  createdAt: Date;
}

// Status colors mapping
export const STATUS_COLORS: Record<FeedbackStatus, string> = {
  new: 'bg-red-500',
  in_review: 'bg-yellow-500',
  in_progress: 'bg-blue-500',
  waiting_client: 'bg-purple-500',
  rejected: 'bg-gray-500',
  completed: 'bg-green-500',
};

export const STATUS_LABELS: Record<FeedbackStatus, string> = {
  new: 'Novo',
  in_review: 'Em Análise',
  in_progress: 'Em Andamento',
  waiting_client: 'Aguardando Cliente',
  rejected: 'Rejeitado',
  completed: 'Concluído',
};

export const PRIORITY_COLORS: Record<FeedbackPriority, string> = {
  low: 'bg-gray-400',
  medium: 'bg-yellow-400',
  high: 'bg-orange-500',
  urgent: 'bg-red-600',
};

export const PRIORITY_LABELS: Record<FeedbackPriority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
};
