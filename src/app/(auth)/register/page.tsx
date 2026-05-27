'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, AlertCircle, CheckCircle, X } from 'lucide-react';
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

export default function RegisterPage() {
  const router = useRouter();
  const [name,            setName]            = useState('');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error,           setError]           = useState('');
  const [success,         setSuccess]         = useState('');
  const [loading,         setLoading]         = useState(false);
  const [pwFocused,       setPwFocused]       = useState(false);

  const pwChecks = validatePassword(password);
  const pwValid  = Object.values(pwChecks).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!pwValid) {
      setError('La contraseña no cumple los requisitos');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed. Please try again.');
        return;
      }

      setSuccess('¡Cuenta creada! Redirigiendo…');
      setTimeout(() => {
        router.push('/login');
      }, 1500);
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
          <h1 className="text-2xl font-bold text-text-primary mb-2">Crear cuenta</h1>
          <p className="text-text-secondary text-sm">
            Empezá a trackear tu patrimonio en minutos
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-loss/10 border border-loss/30 text-loss text-sm px-4 py-3 rounded-lg mb-6">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 bg-gain/10 border border-gain/30 text-gain text-sm px-4 py-3 rounded-lg mb-6">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre completo"
            type="text"
            placeholder="Juan García"
            value={name}
            onChange={(e) => setName(e.target.value)}
            icon={<User className="w-4 h-4" />}
            required
            autoComplete="name"
          />
          <Input
            label="Email"
            type="email"
            placeholder="vos@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="w-4 h-4" />}
            required
            autoComplete="email"
          />
          <div>
            <Input
              label="Contraseña"
              type="password"
              placeholder="Mín. 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPwFocused(true)}
              onBlur={() => setPwFocused(false)}
              icon={<Lock className="w-4 h-4" />}
              required
              autoComplete="new-password"
            />
            {/* Password strength checklist */}
            {(pwFocused || password.length > 0) && (
              <div className="mt-2 grid grid-cols-2 gap-1">
                {[
                  { ok: pwChecks.length,  label: '8 caracteres' },
                  { ok: pwChecks.upper,   label: '1 mayúscula'  },
                  { ok: pwChecks.number,  label: '1 número'     },
                  { ok: pwChecks.special, label: '1 símbolo (!@#…)' },
                ].map(({ ok, label }) => (
                  <div key={label} className={`flex items-center gap-1.5 text-xs transition-colors ${ok ? 'text-gain' : 'text-text-muted'}`}>
                    {ok
                      ? <CheckCircle className="w-3 h-3 shrink-0" />
                      : <X className="w-3 h-3 shrink-0" />}
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
            autoComplete="new-password"
            error={confirmPassword && password !== confirmPassword ? 'Las contraseñas no coinciden' : ''}
          />

          <Button
            type="submit"
            className="w-full mt-2"
            size="lg"
            loading={loading}
            disabled={!!success}
          >
            {loading ? 'Creando cuenta…' : 'Crear cuenta'}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-border text-center">
          <p className="text-text-secondary text-sm">
            ¿Ya tenés cuenta?{' '}
            <Link
              href="/login"
              className="text-primary hover:text-primary-hover font-medium transition-colors"
            >
              Iniciá sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
