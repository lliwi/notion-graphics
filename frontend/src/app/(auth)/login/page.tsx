'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { AuthResponse } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
      login(data.access_token);
      router.push('/dashboard');
    } catch {
      setError('Email o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-text">Notion Graphics</h1>
          <p className="text-text-muted text-sm mt-1">Inicia sesión para continuar</p>
        </div>

        <a
          href={`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'}/integrations/notion/login`}
          className="flex items-center justify-center gap-2 w-full bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-sm text-text hover:bg-surface-3 transition-colors mb-3"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="16" height="16" rx="3" fill="white"/>
            <path d="M3.5 3h5.6l3.9 5.3V13h-1.4V8.7L7.8 4.4H4.9V13H3.5V3z" fill="black"/>
          </svg>
          Continuar con Notion
        </a>

        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-text-muted">o</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="bg-surface-2 border border-border rounded-lg p-6 flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
            autoFocus
          />
          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button type="submit" loading={loading} className="w-full mt-2">
            Entrar
          </Button>
        </form>

        <p className="text-center text-sm text-text-muted mt-4">
          ¿No tienes cuenta?{' '}
          <Link href="/register" className="text-accent hover:underline">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}
