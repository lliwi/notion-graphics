'use client';

import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';
import ColorPaletteSelect from '@/components/ui/ColorPaletteSelect';
import CustomizationPanel from '@/components/ui/CustomizationPanel';
import { ChartType, Aggregation, ChartConfig } from '@/types';
import { useNotionProperties } from '@/hooks/useNotionProperties';

export interface FieldsConfig {
  name: string;
  type: ChartType;
  title: string;
  x_field: string;
  y_field: string;
  aggregation: Aggregation;
  colors: string;
  legend_position?: ChartConfig['legend_position'];
  background?: string;
  font_family?: ChartConfig['font_family'];
  show_grid?: boolean;
  border_radius?: number;
}

interface Props {
  databaseId: string;
  config: FieldsConfig;
  onChange: (config: FieldsConfig) => void;
}

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

const TYPE_EMOJI: Record<string, string> = {
  title: '📝', rich_text: '📝', number: '🔢', select: '🔘',
  multi_select: '☰', date: '📅', checkbox: '✅', formula: 'ƒ',
  relation: '🔗', rollup: '📊', url: '🔗', email: '✉',
};

export default function Step2ConfigureFields({ databaseId, config, onChange }: Props) {
  const { properties, loading } = useNotionProperties(databaseId);

  const set = (key: keyof FieldsConfig) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      onChange({ ...config, [key]: e.target.value });

  const fieldOptions = [
    { value: '', label: '— Seleccionar campo —' },
    ...properties.map((p) => ({
      value: p.name,
      label: `${TYPE_EMOJI[p.type] ?? '•'} ${p.name} (${p.type})`,
    })),
  ];

  return (
    <div className="flex flex-col gap-4">
      <Input
        label="Nombre del gráfico"
        value={config.name}
        onChange={set('name')}
        placeholder="Ej: Ventas por mes"
        required
      />
      <Input
        label="Título visible"
        value={config.title}
        onChange={set('title')}
        placeholder="Ej: Ventas 2024"
      />
      <Select
        label="Tipo de gráfico"
        value={config.type}
        onChange={set('type')}
        options={CHART_TYPE_OPTIONS}
      />

      {loading ? (
        <div className="flex items-center gap-2 text-text-muted text-sm py-2">
          <Spinner className="w-4 h-4" />
          Cargando campos de Notion...
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Campo X (eje / categoría)"
            value={config.x_field}
            onChange={set('x_field')}
            options={fieldOptions}
          />
          <Select
            label="Campo Y (valor)"
            value={config.y_field}
            onChange={set('y_field')}
            options={fieldOptions}
          />
        </div>
      )}

      <Select
        label="Agregación"
        value={config.aggregation}
        onChange={set('aggregation')}
        options={AGGREGATION_OPTIONS}
      />
      <ColorPaletteSelect
        value={config.colors}
        onChange={(v) => onChange({ ...config, colors: v })}
      />

      <div className="border-t border-border pt-4">
        <CustomizationPanel
          config={config}
          onChange={(patch) => onChange({ ...config, ...patch })}
        />
      </div>
    </div>
  );
}
