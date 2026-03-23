'use client';

import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';
import ColorPaletteSelect from '@/components/ui/ColorPaletteSelect';
import CustomizationPanel from '@/components/ui/CustomizationPanel';
import FiltersPanel from '@/components/ui/FiltersPanel';
import Step2RadarConfig from './Step2RadarConfig';
import { ChartType, Aggregation, ChartConfig, NotionFilter, NotionSort, HavingCondition } from '@/types';
import { useNotionProperties } from '@/hooks/useNotionProperties';

export interface FieldsConfig {
  name: string;
  type: ChartType;
  title: string;
  x_field: string;
  y_field: string;
  y_fields?: string[];
  aggregation: Aggregation;
  aggregations?: Aggregation[];
  filters?: NotionFilter[];
  filter_logic?: 'and' | 'or';
  sorts?: NotionSort[];
  having?: HavingCondition;
  colors: string;
  legend_position?: ChartConfig['legend_position'];
  background?: string;
  font_family?: ChartConfig['font_family'];
  show_grid?: boolean;
  border_radius?: number;
  bar_width?: number;
  radar_label_field?: string;
  radar_axes?: string[];
}

interface Props {
  databaseId: string;
  config: FieldsConfig;
  onChange: (config: FieldsConfig) => void;
}

const CHART_TYPE_OPTIONS = [
  { value: 'bar', label: '▊ Barras' },
  { value: 'bar_stacked', label: '▊ Barras apiladas' },
  { value: 'bar_horizontal', label: '▬ Barras horizontales' },
  { value: 'bar_horizontal_stacked', label: '▬ Barras horiz. apiladas' },
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
  { value: 'min', label: 'Mínimo' },
  { value: 'max', label: 'Máximo' },
  { value: 'median', label: 'Mediana' },
  { value: 'count_unique', label: 'Valores únicos' },
  { value: 'percent', label: 'Porcentaje' },
  { value: 'range', label: 'Rango (max-min)' },
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
      ) : config.type === 'radar' ? (
        <Step2RadarConfig
          fieldOptions={fieldOptions}
          labelField={config.radar_label_field ?? ''}
          axes={config.radar_axes ?? []}
          onLabelFieldChange={(v) => onChange({ ...config, radar_label_field: v })}
          onAxesChange={(v) => onChange({ ...config, radar_axes: v })}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <Select
            label="Campo X (eje / categoría)"
            value={config.x_field}
            onChange={set('x_field')}
            options={fieldOptions}
          />
          <div className="flex flex-col gap-2">
            <label className="text-xs text-text-muted uppercase tracking-wider font-mono">
              Campos Y (valores)
            </label>
            {(config.y_fields?.length ? config.y_fields : [config.y_field || '']).map((field, i) => {
              const currentAggs = config.aggregations?.length ? config.aggregations : [config.aggregation];
              const agg = currentAggs[i] ?? config.aggregation;
              return (
                <div key={i} className="flex items-center gap-2">
                  <select
                    value={field}
                    onChange={(e) => {
                      const current = config.y_fields?.length ? [...config.y_fields] : [config.y_field || ''];
                      current[i] = e.target.value;
                      onChange({ ...config, y_fields: current, y_field: current[0] || '' });
                    }}
                    className="flex-1 bg-surface-3 border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:border-accent transition-colors"
                  >
                    {fieldOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <select
                    value={agg}
                    onChange={(e) => {
                      const fields = config.y_fields?.length ? config.y_fields : [config.y_field || ''];
                      const aggs = config.aggregations?.length ? [...config.aggregations] : fields.map(() => config.aggregation);
                      aggs[i] = e.target.value as Aggregation;
                      onChange({ ...config, aggregations: aggs, aggregation: aggs[0] });
                    }}
                    className="w-36 bg-surface-3 border border-border rounded-md px-2 py-2 text-sm text-text focus:outline-none focus:border-accent transition-colors"
                  >
                    {AGGREGATION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {(config.y_fields?.length ?? 1) > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const currentFields = [...(config.y_fields || [config.y_field || ''])];
                        const currentAggs = [...(config.aggregations || currentFields.map(() => config.aggregation))];
                        currentFields.splice(i, 1);
                        currentAggs.splice(i, 1);
                        onChange({ ...config, y_fields: currentFields, y_field: currentFields[0] || '', aggregations: currentAggs, aggregation: currentAggs[0] });
                      }}
                      className="text-text-muted hover:text-red-400 transition-colors text-lg px-1"
                      title="Eliminar campo"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => {
                const currentFields = config.y_fields?.length ? [...config.y_fields] : [config.y_field || ''];
                const currentAggs = config.aggregations?.length ? [...config.aggregations] : currentFields.map(() => config.aggregation);
                onChange({ ...config, y_fields: [...currentFields, ''], y_field: currentFields[0] || '', aggregations: [...currentAggs, 'none'] });
              }}
              className="text-xs text-accent hover:text-accent/80 transition-colors self-start font-mono"
            >
              + Añadir campo
            </button>
          </div>
        </div>
      )}
      <ColorPaletteSelect
        value={config.colors}
        onChange={(v) => onChange({ ...config, colors: v })}
      />

      <div className="border-t border-border pt-4">
        <FiltersPanel
          databaseId={databaseId}
          properties={properties}
          filters={config.filters ?? []}
          filterLogic={config.filter_logic ?? 'and'}
          sorts={config.sorts ?? []}
          having={config.having}
          onFiltersChange={(f) => onChange({ ...config, filters: f })}
          onFilterLogicChange={(l) => onChange({ ...config, filter_logic: l })}
          onSortsChange={(s) => onChange({ ...config, sorts: s })}
          onHavingChange={(h) => onChange({ ...config, having: h })}
        />
      </div>

      <div className="border-t border-border pt-4">
        <CustomizationPanel
          type={config.type}
          config={{
            legend_position: config.legend_position,
            background: config.background,
            font_family: config.font_family,
            show_grid: config.show_grid,
            border_radius: config.border_radius,
            bar_width: config.bar_width,
          }}
          onChange={({ colors: _colors, database_id: _db, filters: _f, ...rest }) =>
            onChange({ ...config, ...rest })
          }
        />
      </div>
    </div>
  );
}
