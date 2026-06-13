'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { Glass } from '@/components/ui/Glass';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { scaleIn } from '@/lib/motion';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuthStore();
  const { addToast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      addToast('Signed in successfully', 'success');
      router.push('/dashboard');
    } catch {
      addToast('Invalid credentials', 'error');
    }
  };

  return (
    <motion.div
      variants={scaleIn}
      initial="initial"
      animate="animate"
      className="min-h-screen flex items-center justify-center bg-bg-base px-4"
    >
      <Glass className="w-full max-w-sm p-8 space-y-6">
        {/* Logo / Wordmark */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            AtomQuest
          </h1>
          <p className="text-sm text-text-secondary">Agent Sign In</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm text-text-secondary block">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="agent"
              className="w-full bg-bg-overlay border border-bg-border rounded-xl px-4 py-2.5 text-text-primary text-sm placeholder:text-text-tertiary focus:ring-2 focus:ring-accent/50 focus:outline-none"
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm text-text-secondary block">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-bg-overlay border border-bg-border rounded-xl px-4 py-2.5 text-text-primary text-sm placeholder:text-text-tertiary focus:ring-2 focus:ring-accent/50 focus:outline-none"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-danger">{error}</p>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <p className="text-xs text-text-tertiary text-center">
          Demo: agent / atomquest2024
        </p>
      </Glass>
    </motion.div>
  );
}