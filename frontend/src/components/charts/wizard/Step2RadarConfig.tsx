'use client';

import Select from '@/components/ui/Select';

interface FieldOption {
  value: string;
  label: string;
}

interface Props {
  fieldOptions: FieldOption[];
  labelField: string;
  axes: string[];
  onLabelFieldChange: (field: string) => void;
  onAxesChange: (axes: string[]) => void;
}

const NUMERIC_TYPES = new Set(['number', 'formula', 'checkbox', 'rollup']);

function getType(label: string): string {
  return label.match(/\((\w+)\)$/)?.[1] ?? '';
}

export default function Step2RadarConfig({
  fieldOptions,
  labelField,
  axes,
  onLabelFieldChange,
  onAxesChange,
}: Props) {
  const numericOptions = fieldOptions.filter(
    (o) => o.value !== '' && NUMERIC_TYPES.has(getType(o.label)),
  );

  const toggleAxis = (fieldName: string) => {
    if (axes.includes(fieldName)) {
      onAxesChange(axes.filter((a) => a !== fieldName));
    } else {
      onAxesChange([...axes, fieldName]);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Select
        label="Campo de etiqueta (nombre de la serie)"
        value={labelField}
        onChange={(e) => onLabelFieldChange(e.target.value)}
        options={fieldOptions}
      />

      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider font-mono">
          Ejes del radar
          <span className="ml-1 text-text-muted/60 normal-case font-normal">
            (mín. 3 campos numéricos)
          </span>
        </p>

        {numericOptions.length === 0 ? (
          <p className="text-sm text-text-muted italic py-2">
            No se encontraron campos numéricos en esta base de datos.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {numericOptions.map((opt) => {
              const checked = axes.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleAxis(opt.value)}
                  className={`px-3 py-2 text-sm rounded border text-left transition-colors truncate ${
                    checked
                      ? 'border-accent text-accent bg-accent/10'
                      : 'border-border text-text-muted hover:border-accent/50 hover:text-text'
                  }`}
                >
                  {checked && <span className="mr-1">✓</span>}
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}

        {axes.length > 0 && axes.length < 3 && (
          <p className="text-xs text-amber-400">
            Selecciona al menos 3 ejes ({axes.length}/3)
          </p>
        )}
        {axes.length >= 3 && (
          <p className="text-xs text-teal">
            {axes.length} ejes seleccionados
          </p>
        )}
      </div>
    </div>
  );
}
