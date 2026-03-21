'use client';

import { ChartConfig, ChartType } from '@/types';

interface Props {
  config: Partial<ChartConfig>;
  onChange: (patch: Partial<ChartConfig>) => void;
  type?: ChartType;
}

const LEGEND_OPTIONS = [
  { value: 'bottom', label: 'Abajo' },
  { value: 'top', label: 'Arriba' },
  { value: 'left', label: 'Izquierda' },
  { value: 'right', label: 'Derecha' },
  { value: 'none', label: 'Oculta' },
];

const FONT_OPTIONS = [
  { value: 'system-ui', label: 'Sistema' },
  { value: 'serif', label: 'Serif' },
  { value: 'monospace', label: 'Monospace' },
];

const BG_PRESETS = [
  { value: 'transparent', label: 'Transparente' },
  { value: '#ffffff', label: 'Blanco' },
  { value: '#f9fafb', label: 'Gris claro' },
  { value: '#111827', label: 'Oscuro' },
  { value: 'custom', label: 'Personalizado' },
];

export default function CustomizationPanel({ config, onChange, type }: Props) {
  const isBar = type === 'bar' || type === 'bar_horizontal';
  const bg = config.background ?? 'transparent';
  const isCustomBg = !BG_PRESETS.slice(0, -1).some((p) => p.value === bg);

  const selectBg = (value: string) => {
    if (value === 'custom') return;
    onChange({ background: value });
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-text-muted uppercase tracking-wider font-mono font-semibold">
        Personalización
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-8 gap-y-4">

      {/* Background */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-text-muted uppercase tracking-wider font-mono">Fondo</label>
        <div className="flex gap-2 flex-wrap">
          {BG_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              title={preset.label}
              onClick={() => selectBg(preset.value)}
              className={`px-2 py-1 text-xs rounded border transition-colors ${
                (preset.value === 'custom' ? isCustomBg : bg === preset.value)
                  ? 'border-accent text-accent'
                  : 'border-border text-text-muted hover:border-accent/50'
              }`}
            >
              {preset.value !== 'transparent' && preset.value !== 'custom' && (
                <span
                  className="inline-block w-3 h-3 rounded-sm border border-border mr-1 align-middle"
                  style={{ background: preset.value }}
                />
              )}
              {preset.label}
            </button>
          ))}
        </div>
        {isCustomBg && (
          <input
            type="color"
            value={bg === 'transparent' ? '#ffffff' : bg}
            onChange={(e) => onChange({ background: e.target.value })}
            className="mt-1 h-8 w-16 cursor-pointer rounded border border-border bg-surface-2"
          />
        )}
      </div>

      {/* Font family */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-text-muted uppercase tracking-wider font-mono">Tipografía</label>
        <div className="flex gap-2">
          {FONT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ font_family: opt.value as ChartConfig['font_family'] })}
              className={`px-3 py-1 text-xs rounded border transition-colors ${
                (config.font_family ?? 'system-ui') === opt.value
                  ? 'border-accent text-accent'
                  : 'border-border text-text-muted hover:border-accent/50'
              }`}
              style={{ fontFamily: opt.value }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Legend position */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-text-muted uppercase tracking-wider font-mono">Leyenda</label>
        <div className="flex gap-2 flex-wrap">
          {LEGEND_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ legend_position: opt.value as ChartConfig['legend_position'] })}
              className={`px-3 py-1 text-xs rounded border transition-colors ${
                (config.legend_position ?? 'bottom') === opt.value
                  ? 'border-accent text-accent'
                  : 'border-border text-text-muted hover:border-accent/50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Show grid */}
      <div className="flex items-center gap-3">
        <label className="text-xs text-text-muted uppercase tracking-wider font-mono">Cuadrícula</label>
        <button
          type="button"
          role="switch"
          aria-checked={config.show_grid !== false}
          onClick={() => onChange({ show_grid: !(config.show_grid !== false) })}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            config.show_grid !== false ? 'bg-accent' : 'bg-surface-3 border border-border'
          }`}
        >
          <span
            className={`inline-block h-3 w-3 rounded-full bg-white transition-transform ${
              config.show_grid !== false ? 'translate-x-5' : 'translate-x-1'
            }`}
          />
        </button>
        <span className="text-xs text-text-muted">
          {config.show_grid !== false ? 'Visible' : 'Oculta'}
        </span>
      </div>

      {/* Border radius */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-text-muted uppercase tracking-wider font-mono">
          Radio de borde: {config.border_radius ?? 4}px
        </label>
        <input
          type="range"
          min={0}
          max={20}
          value={config.border_radius ?? 4}
          onChange={(e) => onChange({ border_radius: Number(e.target.value) })}
          className="w-full accent-accent"
        />
      </div>

      {/* Font size */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-text-muted uppercase tracking-wider font-mono">
          Tamaño de fuente: {config.font_size ?? 11}px
        </label>
        <input
          type="range"
          min={8}
          max={24}
          value={config.font_size ?? 11}
          onChange={(e) => onChange({ font_size: Number(e.target.value) })}
          className="w-full accent-accent"
        />
      </div>

      {/* Bar width */}
      {isBar && (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-text-muted uppercase tracking-wider font-mono">
              Ancho de barras: {config.bar_width ?? 80}%
            </label>
            <input
              type="range"
              min={10}
              max={100}
              value={config.bar_width ?? 80}
              onChange={(e) => onChange({ bar_width: Number(e.target.value) })}
              className="w-full accent-accent"
            />
          </div>
        </>
      )}

      {/* Chart height */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-text-muted uppercase tracking-wider font-mono">
          Altura del gráfico: {config.chart_height ?? 300}px
        </label>
        <input
          type="range"
          min={150}
          max={800}
          step={10}
          value={config.chart_height ?? 300}
          onChange={(e) => onChange({ chart_height: Number(e.target.value) })}
          className="w-full accent-accent"
        />
      </div>
      </div>
    </div>
  );
}
