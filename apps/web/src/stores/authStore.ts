import { create } from 'zustand';
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface AuthState {
  token: string | null;
  agentId: string | null;
  role: 'AGENT' | 'CUSTOMER' | null;
  sessionId: string | null;
  participantId: string | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  setCustomerAuth: (token: string, sessionId: string, participantId: string) => void;
  setAgentAuth: (token: string, agentId: string, sessionId: string, participantId: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  agentId: null,
  role: null,
  sessionId: null,
  participantId: null,
  isLoading: false,
  error: null,

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.post(`${API_BASE}/api/auth/agent-login`, { username, password });
      const { token, agentId } = res.data;
      set({ token, agentId, role: 'AGENT', isLoading: false });
    } catch (err: any) {
      const message = err.response?.data?.message || 'Login failed';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  setCustomerAuth: (token: string, sessionId: string, participantId: string) => {
    set({ token, role: 'CUSTOMER', sessionId, participantId, agentId: null });
  },

  setAgentAuth: (token: string, agentId: string, sessionId: string, participantId: string) => {
    set({ token, role: 'AGENT', agentId, sessionId, participantId });
  },

  logout: () => {
    set({ token: null, agentId: null, role: null, sessionId: null, participantId: null, error: null });
  },

  isAuthenticated: () => {
    const { token } = get();
    return !!token;
  },
}));

// Global axios 401 interceptor — redirect to home on expired/invalid tokens
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const { role } = useAuthStore.getState();
      useAuthStore.getState().logout();
      // Only redirect if we're not already on the login/join page
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/join')) {
        if (role === 'AGENT') {
          window.location.href = '/login';
        } else {
          window.location.href = '/';
        }
      }
    }
    return Promise.reject(error);
  }
);

export function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}