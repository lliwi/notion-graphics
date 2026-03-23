'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/auth/AuthGuard';
import Button from '@/components/ui/Button';
import Step1SelectDB from '@/components/charts/wizard/Step1SelectDB';
import Step2ConfigureFields, { FieldsConfig } from '@/components/charts/wizard/Step2ConfigureFields';
import Step3Preview from '@/components/charts/wizard/Step3Preview';
import { useNotionDatabases } from '@/hooks/useNotionDatabases';
import { api } from '@/lib/api';
import { Chart, ChartConfig, ChartDataResult } from '@/types';
import Link from 'next/link';

const DEFAULT_FIELDS: FieldsConfig = {
  name: '',
  type: 'bar',
  title: '',
  x_field: '',
  y_field: '',
  aggregation: 'none',
  colors: '',
};

const STEP_LABELS = ['Base de datos', 'Configuración', 'Vista previa'];

function NewChartContent() {
  const router = useRouter();
  const { databases, connected, loading: dbLoading } = useNotionDatabases();
  const [step, setStep] = useState(1);
  const [databaseId, setDatabaseId] = useState('');
  const [fields, setFields] = useState<FieldsConfig>(DEFAULT_FIELDS);
  const [previewData, setPreviewData] = useState<ChartDataResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [chartId, setChartId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const goToStep2 = () => {
    if (!databaseId) return;
    setStep(2);
  };

  const goToStep3 = async () => {
    const isRadar = fields.type === 'radar';
    if (isRadar) {
      if (!fields.name || !fields.radar_label_field || (fields.radar_axes?.length ?? 0) < 3) return;
    } else {
      if (!fields.name || !fields.x_field) return;
    }
    setStep(3);
    setPreviewLoading(true);
    setPreviewError('');
    try {
      const colors = fields.colors
        ? fields.colors.split(',').map((c) => c.trim()).filter(Boolean)
        : [];
      const { data: chart } = await api.post<Chart>('/charts', {
        name: fields.name,
        type: fields.type,
        config_json: {
          database_id: databaseId,
          title: fields.title || fields.name,
          x_field: fields.x_field ?? '',
          y_field: fields.y_field ?? '',
          y_fields: fields.y_fields?.filter(Boolean) ?? (fields.y_field ? [fields.y_field] : []),
          aggregation: fields.aggregation,
          aggregations: fields.aggregations ?? [fields.aggregation],
          filters: fields.filters ?? [],
          filter_logic: fields.filter_logic ?? 'and',
          sorts: fields.sorts ?? [],
          having: fields.having,
          colors,
          legend_position: fields.legend_position,
          background: fields.background,
          font_family: fields.font_family,
          show_grid: fields.show_grid,
          border_radius: fields.border_radius,
          radar_label_field: fields.radar_label_field,
          radar_axes: fields.radar_axes,
        } satisfies ChartConfig,
      });
      setChartId(chart.id);
      const { data: result } = await api.get<ChartDataResult>(`/charts/${chart.id}/data`);
      setPreviewData(result);
    } catch {
      setPreviewError('Error al obtener datos. Verifica los nombres de campo.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSave = async () => {
    if (!chartId) return;
    setSaving(true);
    router.push(`/charts/${chartId}`);
  };

  const currentConfig: ChartConfig = {
    database_id: databaseId,
    title: fields.title || fields.name,
    x_field: fields.x_field ?? '',
    y_field: fields.y_field ?? '',
    y_fields: fields.y_fields?.filter(Boolean) ?? (fields.y_field ? [fields.y_field] : []),
    aggregation: fields.aggregation,
    aggregations: fields.aggregations ?? [fields.aggregation],
    filters: fields.filters ?? [],
    filter_logic: fields.filter_logic ?? 'and',
    sorts: fields.sorts ?? [],
    having: fields.having,
    colors: fields.colors ? fields.colors.split(',').map((c) => c.trim()).filter(Boolean) : [],
    legend_position: fields.legend_position,
    background: fields.background,
    font_family: fields.font_family,
    show_grid: fields.show_grid,
    border_radius: fields.border_radius,
    radar_label_field: fields.radar_label_field,
    radar_axes: fields.radar_axes,
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-text-muted hover:text-text transition-colors text-sm">
          ← Dashboard
        </Link>
        <h1 className="text-lg font-bold text-text font-mono">Nuevo gráfico</h1>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEP_LABELS.map((label, i) => {
            const n = i + 1;
            const active = step === n;
            const done = step > n;
            return (
              <div key={n} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${active ? 'bg-accent text-surface' : done ? 'bg-teal text-surface' : 'bg-surface-3 text-text-muted border border-border'}`}>
                  {done ? '✓' : n}
                </div>
                <span className={`text-sm hidden sm:inline ${active ? 'text-text' : 'text-text-muted'}`}>{label}</span>
                {i < STEP_LABELS.length - 1 && <span className="text-border mx-1">—</span>}
              </div>
            );
          })}
        </div>

        <div className="bg-surface-2 border border-border rounded-lg p-6">
          {step === 1 && (
            <>
              <h2 className="text-sm font-semibold text-text-muted uppercase font-mono tracking-wider mb-4">
                Selecciona una base de datos
              </h2>
              <Step1SelectDB
                databases={databases}
                loading={dbLoading}
                connected={connected}
                selectedId={databaseId}
                onSelect={setDatabaseId}
              />
              <div className="mt-6 flex justify-end">
                <Button onClick={goToStep2} disabled={!databaseId}>
                  Siguiente →
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-sm font-semibold text-text-muted uppercase font-mono tracking-wider mb-4">
                Configura el gráfico
              </h2>
              <Step2ConfigureFields databaseId={databaseId} config={fields} onChange={setFields} />
              <div className="mt-6 flex justify-between">
                <Button variant="secondary" onClick={() => setStep(1)}>
                  ← Atrás
                </Button>
                <Button onClick={goToStep3} disabled={
                  fields.type === 'radar'
                    ? !fields.name || !fields.radar_label_field || (fields.radar_axes?.length ?? 0) < 3
                    : !fields.name || !fields.x_field
                }>
                  Vista previa →
                </Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-sm font-semibold text-text-muted uppercase font-mono tracking-wider mb-4">
                Vista previa
              </h2>
              <Step3Preview
                chartType={fields.type}
                config={currentConfig}
                data={previewData}
                loading={previewLoading}
                error={previewError}
              />
              <div className="mt-6 flex justify-between">
                <Button variant="secondary" onClick={() => setStep(2)}>
                  ← Atrás
                </Button>
                <Button onClick={handleSave} loading={saving} disabled={!chartId || !!previewError}>
                  Guardar gráfico
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function NewChartPage() {
  return (
    <AuthGuard>
      <NewChartContent />
    </AuthGuard>
  );
}
