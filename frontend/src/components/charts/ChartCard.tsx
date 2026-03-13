import Link from 'next/link';
import { Chart } from '@/types';

const CHART_ICONS: Record<string, string> = {
  bar: '▊',
  bar_horizontal: '▬',
  line: '↗',
  area: '◿',
  pie: '◕',
  donut: '◎',
  radar: '✦',
  table: '▤',
  kpi: '#',
};

export default function ChartCard({ chart }: { chart: Chart }) {
  return (
    <Link
      href={`/charts/${chart.id}`}
      className="block bg-surface-2 border border-border rounded-lg p-5 hover:border-accent/50 hover:bg-surface-3 transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl text-accent font-mono">{CHART_ICONS[chart.type] ?? '?'}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${chart.published ? 'bg-teal/10 text-teal border border-teal/30' : 'bg-surface-3 text-text-muted border border-border'}`}>
          {chart.published ? 'publicado' : 'borrador'}
        </span>
      </div>
      <h3 className="font-semibold text-text group-hover:text-accent transition-colors truncate">
        {chart.name}
      </h3>
      <p className="text-xs text-text-muted mt-1 uppercase font-mono tracking-wider">
        {chart.type} · {chart.config_json.aggregation}
      </p>
      <p className="text-xs text-text-muted mt-2">
        {new Date(chart.updated_at).toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}
      </p>
    </Link>
  );
}
