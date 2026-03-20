'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { api } from '@/lib/api';

function AuthorizeContent() {
  const { isAuthenticated, token } = useAuth();
  const params = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const redirectUri = params.get('redirect_uri') ?? '';
  const state = params.get('state') ?? '';

  // If not authenticated, redirect to login and come back
  useEffect(() => {
    if (!isAuthenticated) {
      const returnTo = encodeURIComponent(window.location.href);
      router.replace(`/login?returnTo=${returnTo}`);
    }
  }, [isAuthenticated, router]);

  const handleAuthorize = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post<{ redirect_url: string }>('/notion-lp/code', {
        token,
        redirect_uri: redirectUri,
        state,
      });
      window.location.href = data.redirect_url;
    } catch {
      setError('No se pudo completar la autorización. Inténtalo de nuevo.');
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        <div className="bg-surface-2 border border-border rounded-lg p-8 flex flex-col gap-6">
          <div className="text-center">
            <div className="text-3xl mb-3">🔗</div>
            <h1 className="text-lg font-bold text-text">Conectar con Notion</h1>
            <p className="text-sm text-text-muted mt-2">
              Notion quiere acceder a tus gráficos para mostrar vistas previas en tus páginas.
            </p>
          </div>

          <div className="bg-surface-3 rounded-md p-3 text-xs text-text-muted font-mono">
            <p className="text-text font-semibold mb-1">Permisos solicitados:</p>
            <p>• Ver tus gráficos publicados</p>
            <p>• Mostrar vistas previas en Notion</p>
          </div>

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          <div className="flex flex-col gap-2">
            <Button onClick={handleAuthorize} loading={loading} className="w-full">
              Autorizar acceso
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => router.push('/dashboard')}
              disabled={loading}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NotionLPAuthorizePage() {
  return <AuthorizeContent />;
}
