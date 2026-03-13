'use client';

import Spinner from '@/components/ui/Spinner';
import ChartPreview from '@/components/charts/ChartPreview';
import { ChartType, ChartDataResult, ChartConfig } from '@/types';

interface Props {
  chartType: ChartType;
  config: ChartConfig;
  data: ChartDataResult | null;
  loading: boolean;
  error: string;
}

export default function Step3Preview({ chartType, config, data, loading, error }: Props) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Spinner />
        <p className="text-text-muted text-sm">Consultando Notion...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 text-sm">{error}</p>
        <p className="text-text-muted text-xs mt-2">
          Verifica que los nombres de campo sean correctos y que Notion esté conectado.
        </p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-surface-2 border border-border rounded-lg p-4" style={{ height: 320 }}>
        <ChartPreview type={chartType} data={data} config={config} />
      </div>
      <p className="text-xs text-text-muted text-center font-mono">
        {data.labels.length} registros · vista previa
      </p>
    </div>
  );
}
