'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [sent,    setSent]    = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al enviar el correo'); return; }
      setSent(true);
    } catch {
      setError('Error inesperado. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="glass-card rounded-2xl p-8 shadow-card border border-border">
        <Link href="/login" className="flex items-center gap-1.5 text-text-muted hover:text-text-primary text-sm mb-6 transition-colors w-fit">
          <ArrowLeft className="w-3.5 h-3.5" /> Volver al login
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary mb-2">¿Olvidaste tu contraseña?</h1>
          <p className="text-text-secondary text-sm">
            Ingresá tu email y te mandamos un enlace para resetearla.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-loss/10 border border-loss/30 text-loss text-sm px-4 py-3 rounded-lg mb-6">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {sent ? (
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="w-12 h-12 rounded-full bg-gain/10 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-gain" />
            </div>
            <div>
              <p className="font-semibold text-text-primary">Revisá tu email</p>
              <p className="text-text-secondary text-sm mt-1">
                Si {email} tiene una cuenta, le llegará un enlace en los próximos minutos.
              </p>
            </div>
            <Link href="/login" className="text-primary hover:text-primary-hover text-sm font-medium transition-colors">
              Volver al login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="vos@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              required
              autoComplete="email"
              autoFocus
            />
            <Button type="submit" className="w-full" size="lg" loading={loading}>
              {loading ? 'Enviando…' : 'Enviar enlace'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
