'use client';

import { Bar, Line, Pie, Doughnut, Radar } from 'react-chartjs-2';
import '@/lib/chartjs';
import { ChartType, ChartDataResult, ChartConfig } from '@/types';

const DEFAULT_COLORS = [
  '#E8A835', '#2DD4BF', '#6366F1', '#F43F5E', '#22C55E', '#FB923C',
];

interface Props {
  type: ChartType;
  data: ChartDataResult;
  config: ChartConfig;
}

function buildDataset(data: ChartDataResult, config: ChartConfig, type: ChartType) {
  const colors = config.colors.length > 0 ? config.colors : DEFAULT_COLORS;
  const isPolar = type === 'pie' || type === 'donut';
  const isRadar = type === 'radar';
  const isArea = type === 'area';

  return {
    labels: data.labels,
    datasets: data.datasets.map((ds, i) => ({
      label: ds.label,
      data: ds.data,
      backgroundColor: isPolar || isRadar
        ? colors
        : colors.map((c) => c + '33'),
      borderColor: isPolar ? '#ffffff44' : colors[i % colors.length],
      borderWidth: 2,
      tension: 0.3,
      fill: isArea,
      pointBackgroundColor: isRadar ? colors[i % colors.length] : undefined,
    })),
  };
}

const LEGEND_OPTS = { labels: { color: '#F0EBE1', font: { size: 11 } } };

export default function ChartPreview({ type, data, config }: Props) {
  const gridColor = config.show_grid !== false ? '#2A3040' : 'transparent';
  const legendPos = config.legend_position ?? 'bottom';
  const showLegend = legendPos !== 'none';

  const DARK_SCALES = {
    x: { ticks: { color: '#8A8F9A' }, grid: { color: gridColor } },
    y: { ticks: { color: '#8A8F9A' }, grid: { color: gridColor }, beginAtZero: true },
  };

  const DARK_SCALES_HBAR = {
    x: { ticks: { color: '#8A8F9A' }, grid: { color: gridColor }, beginAtZero: true },
    y: { ticks: { color: '#8A8F9A' }, grid: { color: gridColor } },
  };

  const OPTIONS_BASE = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        ...LEGEND_OPTS,
        display: showLegend,
        position: (showLegend ? legendPos : 'bottom') as 'top' | 'bottom' | 'left' | 'right',
      },
      title: { display: false },
    },
  };

  if (type === 'kpi') {
    const value = data.datasets[0]?.data[0] ?? 0;
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="font-bold text-accent font-mono" style={{ fontSize: 'clamp(32px, 8vw, 64px)' }}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {data.labels[0] && <p className="text-text-muted text-sm mt-2">{data.labels[0]}</p>}
        </div>
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="overflow-auto h-full">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-left px-3 py-2 border-b border-border text-text-muted font-mono text-xs">{config.x_field}</th>
              <th className="text-right px-3 py-2 border-b border-border text-text-muted font-mono text-xs">{config.y_field || 'Valor'}</th>
            </tr>
          </thead>
          <tbody>
            {data.labels.map((label, i) => (
              <tr key={i} className="border-b border-border/40 hover:bg-surface-3">
                <td className="px-3 py-2 text-text">{label}</td>
                <td className="px-3 py-2 text-right text-accent font-mono">{data.datasets[0]?.data[i] ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const chartData = buildDataset(data, config, type);

  const withScales = { ...OPTIONS_BASE, scales: DARK_SCALES };
  const withHBarScales = { ...OPTIONS_BASE, scales: DARK_SCALES_HBAR };

  return (
    <div className="relative h-full w-full">
      {type === 'bar' && <Bar data={chartData} options={withScales} />}
      {type === 'bar_horizontal' && <Bar data={chartData} options={{ ...withHBarScales, indexAxis: 'y' as const }} />}
      {type === 'line' && <Line data={chartData} options={withScales} />}
      {type === 'area' && <Line data={chartData} options={withScales} />}
      {type === 'pie' && <Pie data={chartData} options={OPTIONS_BASE} />}
      {type === 'donut' && <Doughnut data={chartData} options={OPTIONS_BASE} />}
      {type === 'radar' && <Radar data={chartData} options={OPTIONS_BASE} />}
    </div>
  );
}
