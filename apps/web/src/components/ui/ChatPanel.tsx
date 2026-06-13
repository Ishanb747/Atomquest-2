'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { useChatSocket, type ChatMessage } from '@/hooks/useChatSocket';
import { useLocalParticipant } from '@livekit/components-react';
import { fadeUp } from '@/lib/motion';
import { ImageModal } from '@/components/ui/ImageModal';
import axios from 'axios';

interface ChatPanelProps {
  sessionId: string;
  onNewMessage?: () => void;
}

export function ChatPanel({ sessionId, onNewMessage }: ChatPanelProps) {
  const { role } = useAuthStore();
  const { messages, sendMessage, broadcastMessage, isConnected } = useChatSocket(sessionId);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      alert('File is too large (max 20MB)');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const token = useAuthStore.getState().token;
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await axios.post(`${API_BASE}/api/sessions/${sessionId}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        },
      });

      const message = res.data;
      broadcastMessage(message);

    } catch (err: any) {
      console.error('[chat] File upload failed:', err);
      alert(err.response?.data?.message || 'File upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (messages.length > prevCountRef.current) {
      onNewMessage?.();
      prevCountRef.current = messages.length;
    }
  }, [messages, onNewMessage]);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput('');
  }, [input, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-bg-border/60 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-secondary">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="text-sm font-semibold text-text-primary">Chat</span>
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-danger'}`} />
        </div>
        <span className="text-xs text-text-tertiary">{messages.length} msgs</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-0">
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <motion.div
              key="empty"
              variants={fadeUp}
              initial="initial"
              animate="animate"
              className="flex flex-col items-center justify-center h-full py-12 space-y-2 text-center"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-text-tertiary">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <p className="text-xs text-text-tertiary">No messages yet. Say hello!</p>
            </motion.div>
          ) : (
            messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.role === role}
                formatTime={formatTime}
              />
            ))
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-bg-border/60 flex-shrink-0">
        <div className="flex flex-col gap-1.5 bg-bg-overlay border border-bg-border rounded-xl px-3 py-2 focus-within:border-accent/50 transition-colors">
          <div className="flex items-end gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            />
            <button
              onClick={handleUploadClick}
              disabled={!isConnected || isUploading}
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-float disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0"
              aria-label="Upload file"
              type="button"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isConnected ? 'Message...' : 'Connecting...'}
              disabled={!isConnected || isUploading}
              rows={1}
              className="flex-1 bg-transparent text-text-primary text-sm placeholder:text-text-tertiary resize-none outline-none leading-relaxed max-h-24 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || !isConnected || isUploading}
              className="p-1.5 rounded-lg bg-accent text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-accent/80 active:scale-95 transition-all flex-shrink-0"
              aria-label="Send message"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
          {isUploading && (
            <div className="w-full bg-bg-border/30 rounded-full h-1 overflow-hidden">
              <div
                className="bg-accent h-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
        <p className="text-[10px] text-text-tertiary mt-1.5 px-1 select-none">
          Enter to send · Shift+Enter for newline
        </p>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  isOwn,
  formatTime,
}: {
  message: ChatMessage;
  isOwn: boolean;
  formatTime: (d: string) => string;
}) {
  const getFileUrl = (url: string) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    return `${API_BASE}${url}`;
  };

  const isImg = message.fileType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(message.fileUrl || '');
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <motion.div
      variants={fadeUp}
      initial="initial"
      animate="animate"
      className={`flex flex-col gap-0.5 ${isOwn ? 'items-end' : 'items-start'}`}
    >
      <div className="flex items-center gap-1.5 px-1">
        <span className={`text-[10px] font-semibold uppercase tracking-wider ${isOwn ? 'text-accent' : 'text-text-tertiary'}`}>
          {message.role === 'AGENT' ? 'Agent' : 'Customer'}
        </span>
        <span className="text-[10px] text-text-tertiary">{formatTime(message.createdAt)}</span>
      </div>
      <div
        className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
          isOwn
            ? 'bg-accent text-white rounded-br-sm'
            : 'bg-bg-float text-text-primary border border-bg-border rounded-bl-sm'
        }`}
      >
        {message.fileUrl ? (
          <div className="space-y-1">
            {isImg ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="block overflow-hidden rounded-lg hover:opacity-90 transition-opacity cursor-zoom-in"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getFileUrl(message.fileUrl)}
                    alt={message.fileName || message.content}
                    className="max-w-[200px] max-h-[150px] object-cover rounded-lg border border-bg-border/50"
                  />
                </button>
                <ImageModal
                  isOpen={isModalOpen}
                  onClose={() => setIsModalOpen(false)}
                  imageUrl={getFileUrl(message.fileUrl)}
                  altText={message.fileName || message.content}
                />
              </>
            ) : (
              <a
                href={getFileUrl(message.fileUrl)}
                target="_blank"
                rel="noopener noreferrer"
                download
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                  isOwn
                    ? 'bg-white/10 border-white/20 hover:bg-white/20 text-white'
                    : 'bg-bg-overlay border-bg-border hover:bg-bg-float text-text-primary'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <span className="truncate max-w-[150px]" title={message.fileName || message.content}>
                  {message.fileName || message.content}
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-60 flex-shrink-0">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </a>
            )}
          </div>
        ) : (
          message.content
        )}
      </div>
    </motion.div>
  );
}