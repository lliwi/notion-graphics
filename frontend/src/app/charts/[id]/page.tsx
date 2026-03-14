'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthGuard from '@/components/auth/AuthGuard';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import ColorPaletteSelect from '@/components/ui/ColorPaletteSelect';
import CustomizationPanel from '@/components/ui/CustomizationPanel';
import ChartPreview from '@/components/charts/ChartPreview';
import EmbedCodeBox from '@/components/charts/EmbedCodeBox';
import { useChart } from '@/hooks/useChart';
import { useChartData } from '@/hooks/useChartData';
import { useNotionProperties } from '@/hooks/useNotionProperties';
import { api } from '@/lib/api';
import { Chart, ChartType, Aggregation } from '@/types';

const CHART_TYPE_OPTIONS = [
  { value: 'bar', label: '▊ Barras' },
  { value: 'bar_horizontal', label: '▬ Barras horizontales' },
  { value: 'line', label: '↗ Líneas' },
  { value: 'area', label: '◿ Área' },
  { value: 'pie', label: '◕ Tarta' },
  { value: 'donut', label: '◎ Donut' },
  { value: 'radar', label: '✦ Radar' },
  { value: 'table', label: '▤ Tabla' },
  { value: 'kpi', label: '# KPI' },
];

const AGGREGATION_OPTIONS = [
  { value: 'none', label: 'Sin agregación' },
  { value: 'sum', label: 'Suma' },
  { value: 'count', label: 'Conteo' },
  { value: 'avg', label: 'Media' },
];

const EMBED_BASE_URL = process.env.NEXT_PUBLIC_EMBED_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

function ChartDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const { chart, setChart, loading, error } = useChart(id);
  const { data: chartData, loading: dataLoading, error: dataError, refetch } = useChartData(id);
  const { properties } = useNotionProperties(chart?.config_json.database_id ?? null);

  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveError, setSaveError] = useState('');

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (error || !chart) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400">{error || 'Gráfico no encontrado'}</p>
        <Link href="/dashboard" className="text-accent underline text-sm mt-4 block">
          Volver al dashboard
        </Link>
      </div>
    );
  }

  const updateField = (key: string, value: unknown) => {
    setChart((prev) => prev ? { ...prev, [key]: value } : prev);
  };

  const updateConfig = (key: string, value: unknown) => {
    setChart((prev) =>
      prev ? { ...prev, config_json: { ...prev.config_json, [key]: value } } : prev
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      await api.put(`/charts/${id}`, {
        name: chart.name,
        type: chart.type,
        config_json: chart.config_json,
      });
      refetch();
    } catch {
      setSaveError('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const { data } = await api.post<Chart>(`/charts/${id}/publish`);
      setChart(data);
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar este gráfico?')) return;
    setDeleting(true);
    try {
      await api.delete(`/charts/${id}`);
      router.push('/dashboard');
    } finally {
      setDeleting(false);
    }
  };

  const colorsStr = chart.config_json.colors.join(', ');

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-text-muted hover:text-text transition-colors text-sm">
          ← Dashboard
        </Link>
        <h1 className="text-lg font-bold text-text font-mono truncate flex-1">{chart.name}</h1>
        <div className="flex items-center gap-2">
          {!chart.published && (
            <Button variant="secondary" size="sm" onClick={handlePublish} loading={publishing}>
              Publicar
            </Button>
          )}
          <Button size="sm" onClick={handleSave} loading={saving}>
            Guardar
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete} loading={deleting}>
            Eliminar
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Preview */}
        <div className="flex flex-col gap-4">
          <div className="bg-surface-2 border border-border rounded-lg p-4" style={{ height: 380 }}>
            {dataLoading ? (
              <div className="flex items-center justify-center h-full">
                <Spinner />
              </div>
            ) : dataError ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-red-400 text-sm">{dataError}</p>
              </div>
            ) : chartData ? (
              <ChartPreview type={chart.type} data={chartData} config={chart.config_json} />
            ) : null}
          </div>

          {chart.published && chart.embed_token && (
            <div className="bg-surface-2 border border-border rounded-lg p-4">
              <EmbedCodeBox embedToken={chart.embed_token} backendUrl={EMBED_BASE_URL} />
            </div>
          )}
        </div>

        {/* Edit form */}
        <div className="bg-surface-2 border border-border rounded-lg p-5 flex flex-col gap-4 h-fit">
          <h2 className="text-xs text-text-muted uppercase font-mono tracking-wider">Configuración</h2>

          <Input
            label="Nombre"
            value={chart.name}
            onChange={(e) => updateField('name', e.target.value)}
          />
          <Select
            label="Tipo"
            value={chart.type}
            onChange={(e) => updateField('type', e.target.value as ChartType)}
            options={CHART_TYPE_OPTIONS}
          />
          <Input
            label="Título visible"
            value={chart.config_json.title}
            onChange={(e) => updateConfig('title', e.target.value)}
          />
          <Select
            label="Campo X"
            value={chart.config_json.x_field}
            onChange={(e) => updateConfig('x_field', e.target.value)}
            options={[
              { value: '', label: '— Seleccionar campo —' },
              ...properties.map((p) => ({ value: p.name, label: `${p.name} (${p.type})` })),
            ]}
          />
          <Select
            label="Campo Y"
            value={chart.config_json.y_field}
            onChange={(e) => updateConfig('y_field', e.target.value)}
            options={[
              { value: '', label: '— Seleccionar campo —' },
              ...properties.map((p) => ({ value: p.name, label: `${p.name} (${p.type})` })),
            ]}
          />
          <Select
            label="Agregación"
            value={chart.config_json.aggregation}
            onChange={(e) => updateConfig('aggregation', e.target.value as Aggregation)}
            options={AGGREGATION_OPTIONS}
          />
          <ColorPaletteSelect
            value={colorsStr}
            onChange={(v) =>
              updateConfig('colors', v.split(',').map((c) => c.trim()).filter(Boolean))
            }
          />

          <div className="border-t border-border pt-4">
            <CustomizationPanel
              config={chart.config_json}
              onChange={(patch) => {
                Object.entries(patch).forEach(([k, v]) => updateConfig(k, v));
              }}
            />
          </div>

          {saveError && <p className="text-sm text-red-400">{saveError}</p>}
        </div>
      </main>
    </div>
  );
}

export default function ChartDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <AuthGuard>
      <ChartDetailContent id={id} />
    </AuthGuard>
  );
}
