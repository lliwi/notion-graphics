'use client';

import Link from 'next/link';
import AuthGuard from '@/components/auth/AuthGuard';
import ChartCard from '@/components/charts/ChartCard';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { useCharts } from '@/hooks/useCharts';
import { useNotionDatabases } from '@/hooks/useNotionDatabases';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

function DashboardContent() {
  const { charts, loading: chartsLoading } = useCharts();
  const { connected, loading: notionLoading } = useNotionDatabases();
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-text font-mono">Notion Graphics</h1>
        <div className="flex items-center gap-3">
          <Link href="/charts/new">
            <Button size="sm">+ Nuevo gráfico</Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Salir
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Notion connection banner */}
        {!notionLoading && !connected && (
          <div className="mb-6 bg-surface-2 border border-accent/30 rounded-lg p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-text">Conecta tu cuenta de Notion</p>
              <p className="text-xs text-text-muted mt-0.5">
                Necesitas conectar Notion para crear gráficos desde tus bases de datos.
              </p>
            </div>
            <a href="/api/notion-connect">
              <Button size="sm" variant="secondary">
                Conectar Notion
              </Button>
            </a>
          </div>
        )}

        {/* Charts grid */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm text-text-muted uppercase font-mono tracking-wider">
            Mis gráficos
          </h2>
          {connected && (
            <span className="text-xs text-teal font-mono">● Notion conectado</span>
          )}
        </div>

        {chartsLoading ? (
          <div className="flex justify-center py-20">
            <Spinner />
          </div>
        ) : charts.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-lg">
            <p className="text-text-muted text-sm">Aún no tienes gráficos</p>
            <Link href="/charts/new">
              <Button variant="secondary" size="sm" className="mt-4">
                Crear el primero
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {charts.map((chart) => (
              <ChartCard key={chart.id} chart={chart} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
