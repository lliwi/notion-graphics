'use client';

import { useState } from 'react';
import Input from './Input';

export const PALETTES: Array<{ name: string; colors: string[] }> = [
  { name: 'Notion Graphics', colors: ['#E8A835', '#2DD4BF', '#6366F1', '#F43F5E', '#22C55E', '#FB923C'] },
  { name: 'Oceano', colors: ['#0EA5E9', '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6'] },
  { name: 'Bosque', colors: ['#22C55E', '#84CC16', '#10B981', '#059669', '#16A34A', '#4ADE80'] },
  { name: 'Atardecer', colors: ['#F97316', '#EF4444', '#EC4899', '#A855F7', '#F59E0B', '#EAB308'] },
  { name: 'Monocromático', colors: ['#F0EBE1', '#C8C2B8', '#A09A90', '#787268', '#504A40', '#282218'] },
  { name: 'Frío', colors: ['#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#EC4899', '#14B8A6'] },
  { name: 'Custom', colors: [] },
];

function Swatches({ colors }: { colors: string[] }) {
  return (
    <span className="flex gap-0.5">
      {colors.slice(0, 6).map((c, i) => (
        <span key={i} className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: c }} />
      ))}
    </span>
  );
}

interface Props {
  value: string; // comma-separated hex string
  onChange: (value: string) => void;
}

export default function ColorPaletteSelect({ value, onChange }: Props) {
  const matchedPalette = PALETTES.find(
    (p) => p.name !== 'Custom' && p.colors.join(',') === value.split(',').map((c) => c.trim()).join(','),
  );
  const [selected, setSelected] = useState<string>(matchedPalette?.name ?? (value ? 'Custom' : 'Notion Graphics'));

  const handleSelect = (name: string) => {
    setSelected(name);
    if (name !== 'Custom') {
      const palette = PALETTES.find((p) => p.name === name);
      if (palette) onChange(palette.colors.join(', '));
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs text-text-muted uppercase tracking-wider font-mono">Paleta de colores</label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {PALETTES.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => handleSelect(p.name)}
            className={`flex flex-col gap-1.5 px-3 py-2 rounded-lg border text-left transition-colors ${
              selected === p.name
                ? 'border-accent bg-accent/10'
                : 'border-border bg-surface-3 hover:border-accent/40'
            }`}
          >
            <span className="text-xs text-text font-medium">{p.name}</span>
            {p.colors.length > 0 ? (
              <Swatches colors={p.colors} />
            ) : (
              <span className="text-xs text-text-muted italic">personalizado</span>
            )}
          </button>
        ))}
      </div>

      {selected === 'Custom' && (
        <Input
          placeholder="#E8A835, #2DD4BF, #6366F1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1"
        />
      )}
    </div>
  );
}
