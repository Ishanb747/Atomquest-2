'use client';

import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState, ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'AGENT' | 'CUSTOMER';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { token, role } = useAuthStore();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!token) {
      // Not authenticated — redirect to appropriate entry point
      if (requiredRole === 'CUSTOMER') {
        router.replace('/');
      } else {
        router.replace('/login');
      }
      return;
    }

    if (requiredRole && role !== requiredRole) {
      // Wrong role
      if (role === 'AGENT') {
        router.replace('/dashboard');
      } else {
        // Customer trying to access agent page → home
        router.replace('/');
      }
      return;
    }

    // All good
    setReady(true);
  }, [token, role, requiredRole, router]);

  if (!ready) {
    return (
      <div className="fixed inset-0 bg-bg-base flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}