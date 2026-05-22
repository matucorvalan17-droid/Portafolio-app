'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password. Please try again.');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="glass-card rounded-2xl p-8 shadow-card border border-border">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary mb-2">Welcome back</h1>
          <p className="text-text-secondary text-sm">
            Sign in to access your portfolio dashboard
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-loss/10 border border-loss/30 text-loss text-sm px-4 py-3 rounded-lg mb-6">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="w-4 h-4" />}
            required
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="w-4 h-4" />}
            required
            autoComplete="current-password"
          />

          <Button
            type="submit"
            className="w-full mt-2"
            size="lg"
            loading={loading}
          >
            <LogIn className="w-4 h-4" />
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-border text-center">
          <p className="text-text-secondary text-sm">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="text-primary hover:text-primary-hover font-medium transition-colors"
            >
              Create one free
            </Link>
          </p>
        </div>

        {/* Demo hint */}
        <div className="mt-4 p-3 bg-surface rounded-lg border border-border/50">
          <p className="text-text-muted text-xs text-center">
            Register a new account to get started immediately
          </p>
        </div>
      </div>
    </div>
  );
}
