'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { getAuthHeaders } from '@/stores/authStore';
import { Glass } from '@/components/ui/Glass';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '@/lib/motion';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Session {
  id: string;
  status: 'ACTIVE' | 'ENDED';
  createdAt: string;
  endedAt: string | null;
  participants: { id: string; role: string; joinedAt: string; leftAt: string | null }[];
  _count: { messages: number };
  recording?: { status: string; fileUrl: string | null }[];
}

function AdminDashboardContent() {
  const { addToast } = useToast();
  const [liveSessions, setLiveSessions] = useState<Session[]>([]);
  const [historySessions, setHistorySessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLiveSessions = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/sessions?status=ACTIVE`, {
        headers: getAuthHeaders(),
      });
      setLiveSessions(res.data);
    } catch (err: any) {
      console.error('Failed to fetch live sessions:', err.message);
    }
  };

  const fetchHistorySessions = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/sessions?status=ENDED`, {
        headers: getAuthHeaders(),
      });
      setHistorySessions(res.data);
    } catch (err: any) {
      console.error('Failed to fetch history sessions:', err.message);
    }
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchLiveSessions(), fetchHistorySessions()]);
      setIsLoading(false);
    };
    init();

    const interval = setInterval(() => {
      fetchLiveSessions();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const forceEndSession = async (id: string) => {
    if (!window.confirm('Are you sure you want to forcibly end this session?')) return;
    try {
      await axios.post(`${API_BASE}/api/admin/sessions/${id}/force-end`, {}, {
        headers: getAuthHeaders(),
      });
      addToast('Session ended successfully', 'success');
      fetchLiveSessions();
      fetchHistorySessions();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to end session', 'error');
    }
  };

  const formatDurationLive = (createdAt: string) => {
    const now = new Date().getTime();
    const start = new Date(createdAt).getTime();
    const diff = Math.floor((now - start) / 1000);
    const m = Math.floor(diff / 60).toString().padStart(2, '0');
    const s = (diff % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const formatDurationPast = (createdAt: string, endedAt: string | null) => {
    if (!endedAt) return '-';
    const end = new Date(endedAt).getTime();
    const start = new Date(createdAt).getTime();
    const diff = Math.floor((end - start) / 1000);
    const m = Math.floor(diff / 60).toString().padStart(2, '0');
    const s = (diff % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen bg-bg-base p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-text-primary">Admin Dashboard</h1>
        </header>

        {isLoading ? (
          <div className="text-center py-20 text-text-secondary">Loading dashboard...</div>
        ) : (
          <div className="space-y-12">
            {/* Live Sessions Panel */}
            <section className="space-y-4">
              <h2 className="text-lg font-medium text-text-primary flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
                Live Sessions ({liveSessions.length})
              </h2>
              {liveSessions.length === 0 ? (
                <Glass className="p-8 text-center text-text-secondary">
                  No active sessions right now.
                </Glass>
              ) : (
                <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {liveSessions.map(session => {
                    const customer = session.participants.find(p => p.role === 'CUSTOMER');
                    const isConnected = customer && !customer.leftAt;
                    return (
                      <motion.div key={session.id} variants={fadeUp}>
                        <Glass className="p-5 space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs font-mono text-text-tertiary">ID: {session.id.slice(0, 8)}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-text-primary font-medium">Duration: {formatDurationLive(session.createdAt)}</span>
                              </div>
                            </div>
                            <span className="px-2 py-1 bg-success/10 text-success text-xs font-semibold rounded-md">ACTIVE</span>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-text-secondary">Customer:</span>
                            <span className={isConnected ? "text-success" : "text-warning"}>
                              {isConnected ? 'Connected' : 'Waiting/Disconnected'}
                            </span>
                          </div>

                          <Button variant="danger" className="w-full text-sm py-2" onClick={() => forceEndSession(session.id)}>
                            Force End
                          </Button>
                        </Glass>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </section>

            {/* History Panel */}
            <section className="space-y-4">
              <h2 className="text-lg font-medium text-text-primary">Session History</h2>
              <Glass className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-bg-raised text-text-secondary border-b border-bg-border text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4 font-medium">ID</th>
                        <th className="px-6 py-4 font-medium">Date</th>
                        <th className="px-6 py-4 font-medium">Duration</th>
                        <th className="px-6 py-4 font-medium">Participants</th>
                        <th className="px-6 py-4 font-medium">Messages</th>
                        <th className="px-6 py-4 font-medium">Recording</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-bg-border text-text-primary">
                      {historySessions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-text-secondary">
                            No past sessions found.
                          </td>
                        </tr>
                      ) : (
                        historySessions.map(session => {
                          const date = new Date(session.createdAt).toLocaleDateString(undefined, {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          });
                          const rec = session.recording?.[0];
                          
                          return (
                            <tr key={session.id} className="hover:bg-bg-raised/50 transition-colors group">
                              <td className="px-6 py-4 font-mono text-xs text-text-secondary">{session.id.slice(0, 8)}</td>
                              <td className="px-6 py-4">{date}</td>
                              <td className="px-6 py-4">{formatDurationPast(session.createdAt, session.endedAt)}</td>
                              <td className="px-6 py-4">{session.participants.length}</td>
                              <td className="px-6 py-4">{session._count.messages}</td>
                              <td className="px-6 py-4">
                                {rec?.fileUrl ? (
                                  <a href={rec.fileUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                                    Download
                                  </a>
                                ) : (
                                  <span className="text-text-tertiary">None</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </Glass>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute requiredRole="AGENT">
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}
