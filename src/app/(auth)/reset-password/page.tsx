'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function validatePassword(pw: string) {
  return {
    length:  pw.length >= 8,
    upper:   /[A-Z]/.test(pw),
    number:  /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };
}

export default function ResetPasswordPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get('token') ?? '';

  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwFocused,       setPwFocused]       = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState('');
  const [done,            setDone]            = useState(false);

  const pwChecks = validatePassword(password);
  const pwValid  = Object.values(pwChecks).every(Boolean);

  if (!token) {
    return (
      <div className="w-full max-w-md">
        <div className="glass-card rounded-2xl p-8 shadow-card border border-border text-center">
          <p className="text-loss text-sm mb-4">Enlace inválido o expirado.</p>
          <Link href="/forgot-password" className="text-primary hover:text-primary-hover text-sm font-medium">
            Pedí uno nuevo
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!pwValid) { setError('La contraseña no cumple los requisitos'); return; }
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al resetear'); return; }
      setDone(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch {
      setError('Error inesperado. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="glass-card rounded-2xl p-8 shadow-card border border-border">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary mb-2">Nueva contraseña</h1>
          <p className="text-text-secondary text-sm">Elegí una contraseña segura para tu cuenta.</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-loss/10 border border-loss/30 text-loss text-sm px-4 py-3 rounded-lg mb-6">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {done ? (
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="w-12 h-12 rounded-full bg-gain/10 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-gain" />
            </div>
            <div>
              <p className="font-semibold text-text-primary">¡Contraseña actualizada!</p>
              <p className="text-text-secondary text-sm mt-1">Redirigiendo al login…</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                label="Nueva contraseña"
                type="password"
                placeholder="Mín. 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPwFocused(true)}
                onBlur={() => setPwFocused(false)}
                icon={<Lock className="w-4 h-4" />}
                required
                autoFocus
              />
              {(pwFocused || password.length > 0) && (
                <div className="mt-2 grid grid-cols-2 gap-1">
                  {[
                    { ok: pwChecks.length,  label: '8 caracteres' },
                    { ok: pwChecks.upper,   label: '1 mayúscula'  },
                    { ok: pwChecks.number,  label: '1 número'     },
                    { ok: pwChecks.special, label: '1 símbolo (!@#…)' },
                  ].map(({ ok, label }) => (
                    <div key={label} className={`flex items-center gap-1.5 text-xs transition-colors ${ok ? 'text-gain' : 'text-text-muted'}`}>
                      {ok ? <CheckCircle className="w-3 h-3 shrink-0" /> : <X className="w-3 h-3 shrink-0" />}
                      {label}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Input
              label="Confirmar contraseña"
              type="password"
              placeholder="Repetí tu contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              required
              error={confirmPassword && password !== confirmPassword ? 'Las contraseñas no coinciden' : ''}
            />
            <Button type="submit" className="w-full mt-2" size="lg" loading={loading}>
              {loading ? 'Guardando…' : 'Cambiar contraseña'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
