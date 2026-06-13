'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useRoomContext, useLocalParticipant } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  role: 'AGENT' | 'CUSTOMER';
  content: string;
  fileUrl?: string;
  fileType?: string;
  fileName?: string;
  createdAt: string;
}

export function useChatSocket(sessionId: string) {
  const { token } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();

  // Load initial chat history
  useEffect(() => {
    if (!token) return;
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/sessions/${sessionId}/messages`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessages(res.data);
      } catch (err) {
        console.error('[chat] Failed to fetch history', err);
      }
    };
    fetchHistory();
  }, [sessionId, token]);

  // Listen for LiveKit Room Data Channel events (incoming messages)
  useEffect(() => {
    if (!room) return;

    setIsConnected(room.state === 'connected');

    const handleDataReceived = (payload: Uint8Array, participant?: any) => {
      try {
        const strData = new TextDecoder().decode(payload);
        const data = JSON.parse(strData);
        if (data.type === 'CHAT_MESSAGE' && data.message) {
          setMessages((prev) => [...prev, data.message]);
        }
      } catch (err) {
        console.warn('[chat] Failed to parse incoming data message', err);
      }
    };

    const handleConnected = () => setIsConnected(true);
    const handleDisconnected = () => setIsConnected(false);

    room.on(RoomEvent.DataReceived, handleDataReceived);
    room.on(RoomEvent.Connected, handleConnected);
    room.on(RoomEvent.Disconnected, handleDisconnected);

    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
      room.off(RoomEvent.Connected, handleConnected);
      room.off(RoomEvent.Disconnected, handleDisconnected);
    };
  }, [room]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !token) return;

    try {
      // 1. Save to DB
      const res = await axios.post(
        `${API_BASE}/api/sessions/${sessionId}/messages`,
        { content: content.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const message = res.data;

      // 2. Optimistically update local state
      setMessages((prev) => [...prev, message]);

      // 3. Broadcast to other participants in the room via LiveKit DataChannel
      if (localParticipant) {
        const payload = JSON.stringify({ type: 'CHAT_MESSAGE', message });
        const encoded = new TextEncoder().encode(payload);
        localParticipant.publishData(encoded, { reliable: true });
      }

    } catch (err) {
      console.error('[chat] Failed to send message', err);
    }
  }, [sessionId, token, localParticipant]);

  const broadcastMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
    if (localParticipant) {
      const payload = JSON.stringify({ type: 'CHAT_MESSAGE', message });
      const encoded = new TextEncoder().encode(payload);
      localParticipant.publishData(encoded, { reliable: true });
    }
  }, [localParticipant]);

  return { messages, sendMessage, broadcastMessage, isConnected };
}
