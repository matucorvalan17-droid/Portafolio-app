'use client';
// WealthTrack — Toast Notification Provider
// Wraps the `sonner` library for popup notifications.
// You don't need to edit this file.
// To show a toast anywhere: import { toast } from 'sonner' then call toast.success('Done!')

import { Toaster } from 'sonner';

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      theme="dark"
      toastOptions={{
        style: {
          background: '#13131e',
          border: '1px solid #2a2a3e',
          color: '#f8f8fc',
          fontSize: '14px',
        },
        classNames: {
          success: 'border-gain/30',
          error: 'border-loss/30',
        },
      }}
    />
  );
}
