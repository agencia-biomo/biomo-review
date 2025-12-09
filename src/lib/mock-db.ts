// In-memory mock database for development/demo
import { Feedback, Project, Comment } from '@/types';

// Check if Firebase Admin is configured
export const isFirebaseConfigured = (): boolean => {
  return !!(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  );
};

// In-memory storage
const mockFeedbacks: Map<string, Feedback & { id: string }> = new Map();
const mockProjects: Map<string, Project & { id: string }> = new Map();
const mockComments: Map<string, Comment & { id: string }> = new Map();
let feedbackCounter = 0;

// Helper to generate IDs
const generateId = () => `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Mock Feedbacks API
export const mockFeedbacksApi = {
  async getByProject(projectId: string): Promise<(Feedback & { id: string })[]> {
    const feedbacks = Array.from(mockFeedbacks.values())
      .filter((f) => f.projectId === projectId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return feedbacks;
  },

  // Alias for getByProject
  async getByProjectId(projectId: string): Promise<(Feedback & { id: string })[]> {
    return this.getByProject(projectId);
  },

  async getById(id: string): Promise<(Feedback & { id: string }) | null> {
    return mockFeedbacks.get(id) || null;
  },

  async create(data: Omit<Feedback, 'id' | 'number' | 'createdAt' | 'updatedAt'>): Promise<{ id: string; number: number }> {
    feedbackCounter++;
    const id = generateId();
    const now = new Date();

    // Get next number for this project
    const projectFeedbacks = Array.from(mockFeedbacks.values())
      .filter((f) => f.projectId === data.projectId);
    const nextNumber = projectFeedbacks.length > 0
      ? Math.max(...projectFeedbacks.map((f) => f.number)) + 1
      : 1;

    const feedback: Feedback & { id: string } = {
      ...data,
      id,
      number: nextNumber,
      createdAt: now,
      updatedAt: now,
    };

    mockFeedbacks.set(id, feedback);
    return { id, number: nextNumber };
  },

  async update(id: string, data: Partial<Feedback>): Promise<boolean> {
    const existing = mockFeedbacks.get(id);
    if (!existing) return false;

    mockFeedbacks.set(id, {
      ...existing,
      ...data,
      updatedAt: new Date(),
    });
    return true;
  },

  async delete(id: string): Promise<boolean> {
    return mockFeedbacks.delete(id);
  },
};

// Mock Projects API
export const mockProjectsApi = {
  async getAll(): Promise<(Project & { id: string })[]> {
    return Array.from(mockProjects.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getById(id: string): Promise<(Project & { id: string }) | null> {
    return mockProjects.get(id) || null;
  },

  async getByToken(token: string): Promise<(Project & { id: string }) | null> {
    return Array.from(mockProjects.values())
      .find((p) => p.publicAccessToken === token && p.publicAccessEnabled) || null;
  },

  async create(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ id: string }> {
    const id = generateId();
    const now = new Date();

    const project: Project & { id: string } = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };

    mockProjects.set(id, project);
    return { id };
  },

  async update(id: string, data: Partial<Project>): Promise<boolean> {
    const existing = mockProjects.get(id);
    if (!existing) return false;

    mockProjects.set(id, {
      ...existing,
      ...data,
      updatedAt: new Date(),
    });
    return true;
  },

  async delete(id: string): Promise<boolean> {
    // Also delete all feedbacks for this project
    for (const [feedbackId, feedback] of mockFeedbacks) {
      if (feedback.projectId === id) {
        mockFeedbacks.delete(feedbackId);
      }
    }
    return mockProjects.delete(id);
  },
};

// Mock Comments API
export const mockCommentsApi = {
  async getByFeedbackId(feedbackId: string): Promise<(Comment & { id: string })[]> {
    const comments = Array.from(mockComments.values())
      .filter((c) => c.feedbackId === feedbackId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return comments;
  },

  async getById(id: string): Promise<(Comment & { id: string }) | null> {
    return mockComments.get(id) || null;
  },

  async create(data: Omit<Comment, 'id' | 'createdAt'>): Promise<{ id: string }> {
    const id = generateId();
    const now = new Date();

    const comment: Comment & { id: string } = {
      ...data,
      id,
      createdAt: now,
    };

    mockComments.set(id, comment);
    return { id };
  },

  async update(id: string, data: Partial<Comment>): Promise<boolean> {
    const existing = mockComments.get(id);
    if (!existing) return false;

    mockComments.set(id, {
      ...existing,
      ...data,
      editedAt: new Date(),
    });
    return true;
  },

  async delete(id: string): Promise<boolean> {
    return mockComments.delete(id);
  },
};
