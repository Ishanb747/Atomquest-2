import { create } from 'zustand';
import axios from 'axios';
import { getAuthHeaders } from './authStore';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Session {
  id: string;
  agentId: string;
  status: string;
  inviteToken: string;
  createdAt: string;
  endedAt: string | null;
  participants: any[];
}

interface SessionState {
  sessions: Session[];
  currentSession: Session | null;
  inviteUrl: string | null;
  isLoading: boolean;
  error: string | null;
  createSession: () => Promise<{ sessionId: string; inviteToken: string; inviteUrl: string }>;
  fetchSessions: () => Promise<void>;
  fetchSession: (id: string) => Promise<void>;
  endSession: (id: string) => Promise<void>;
  joinSession: (sessionId: string, inviteToken: string) => Promise<{ token: string; sessionId: string }>;
  setInviteUrl: (_url: string) => void;
  clearCurrent: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  sessions: [],
  currentSession: null,
  inviteUrl: null,
  isLoading: false,
  error: null,

  createSession: async () => {
    set({ isLoading: true, error: null });
    try {
      const headers = getAuthHeaders();
      const res = await axios.post(`${API_BASE}/api/sessions`, {}, { headers });
      const { sessionId, inviteToken, inviteUrl } = res.data;
      set({ isLoading: false, inviteUrl });
      return { sessionId, inviteToken, inviteUrl };
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to create session';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  fetchSessions: async () => {
    try {
      const headers = getAuthHeaders();
      const res = await axios.get(`${API_BASE}/api/sessions`, { headers });
      set({ sessions: res.data, isLoading: false });
    } catch {
      // silently fail
    }
  },

  fetchSession: async (id: string) => {
    set({ isLoading: true });
    try {
      const headers = getAuthHeaders();
      const res = await axios.get(`${API_BASE}/api/sessions/${id}`, { headers });
      set({ currentSession: res.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to fetch session', isLoading: false });
    }
  },

  endSession: async (id: string) => {
    set({ isLoading: true });
    try {
      const headers = getAuthHeaders();
      await axios.post(`${API_BASE}/api/sessions/${id}/end`, {}, { headers });
      set({ isLoading: false, currentSession: null });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to end session', isLoading: false });
      throw new Error(err.response?.data?.message || 'Failed to end session');
    }
  },

  joinSession: async (sessionId: string, inviteToken: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.post(`${API_BASE}/api/sessions/${sessionId}/join`, { inviteToken });
      const { token, sessionId: sid } = res.data;
      set({ isLoading: false });
      return { token, sessionId: sid };
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to join session';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  setInviteUrl: (url: string) => {
    set({ inviteUrl: url });
  },

  clearCurrent: () => {
    set({ currentSession: null, inviteUrl: null, error: null });
  },
}));