'use client';
// WealthTrack — App Providers
// Wraps the app with session management and toast notifications.
// You don't need to edit this file.

import { SessionProvider } from 'next-auth/react';
import { ToastProvider } from '@/components/ui/toast';
import type { Session } from 'next-auth';

export function Providers({ children, session }: { children: React.ReactNode; session?: Session | null }) {
  return (
    <SessionProvider session={session}>
      {children}
      <ToastProvider />
    </SessionProvider>
  );
}
