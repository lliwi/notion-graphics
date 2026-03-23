'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { NotionFilter, NotionFilterOperator, NotionFilterPropertyType, NotionSort, HavingCondition, HavingOperator } from '@/types';

interface NotionProperty {
  name: string;
  type: string;
}

interface Props {
  databaseId: string;
  properties: NotionProperty[];
  filters: NotionFilter[];
  filterLogic: 'and' | 'or';
  sorts: NotionSort[];
  having?: HavingCondition;
  onFiltersChange: (filters: NotionFilter[]) => void;
  onFilterLogicChange: (logic: 'and' | 'or') => void;
  onSortsChange: (sorts: NotionSort[]) => void;
  onHavingChange: (having: HavingCondition | undefined) => void;
}

function toFilterType(notionType: string): NotionFilterPropertyType | null {
  const map: Record<string, NotionFilterPropertyType> = {
    title: 'title',
    rich_text: 'rich_text',
    number: 'number',
    select: 'select',
    multi_select: 'multi_select',
    date: 'date',
    checkbox: 'checkbox',
    formula: 'formula',
  };
  return map[notionType] ?? null;
}

function getOperators(propType: NotionFilterPropertyType): Array<{ value: NotionFilterOperator; label: string }> {
  const empty: Array<{ value: NotionFilterOperator; label: string }> = [
    { value: 'is_empty', label: 'Está vacío' },
    { value: 'is_not_empty', label: 'No está vacío' },
  ];

  switch (propType) {
    case 'text':
    case 'rich_text':
    case 'title':
      return [
        { value: 'equals', label: 'Es igual a' },
        { value: 'does_not_equal', label: 'No es igual a' },
        { value: 'contains', label: 'Contiene' },
        { value: 'does_not_contain', label: 'No contiene' },
        { value: 'starts_with', label: 'Empieza con' },
        { value: 'ends_with', label: 'Termina con' },
        ...empty,
      ];
    case 'number':
      return [
        { value: 'equals', label: '=' },
        { value: 'does_not_equal', label: '≠' },
        { value: 'greater_than', label: '>' },
        { value: 'less_than', label: '<' },
        { value: 'greater_than_or_equal_to', label: '≥' },
        { value: 'less_than_or_equal_to', label: '≤' },
        ...empty,
      ];
    case 'select':
    case 'multi_select':
      return [
        { value: 'equals', label: 'Es' },
        { value: 'does_not_equal', label: 'No es' },
        ...empty,
      ];
    case 'date':
      return [
        { value: 'equals', label: 'Es' },
        { value: 'before', label: 'Antes de' },
        { value: 'after', label: 'Después de' },
        { value: 'on_or_before', label: 'Igual o antes' },
        { value: 'on_or_after', label: 'Igual o después' },
        { value: 'past_week', label: 'Última semana' },
        { value: 'past_month', label: 'Último mes' },
        { value: 'past_year', label: 'Último año' },
        { value: 'next_week', label: 'Próxima semana' },
        { value: 'next_month', label: 'Próximo mes' },
        { value: 'next_year', label: 'Próximo año' },
        ...empty,
      ];
    case 'checkbox':
      return [{ value: 'equals', label: 'Es' }];
    case 'formula':
      return [
        { value: 'equals', label: 'Es igual a' },
        { value: 'does_not_equal', label: 'No es igual a' },
        { value: 'contains', label: 'Contiene' },
        { value: 'greater_than', label: '>' },
        { value: 'less_than', label: '<' },
        ...empty,
      ];
    default:
      return empty;
  }
}

function needsValue(operator: NotionFilterOperator): boolean {
  return !['is_empty', 'is_not_empty', 'past_week', 'past_month', 'past_year', 'next_week', 'next_month', 'next_year'].includes(operator);
}

const HAVING_OPERATORS: Array<{ value: HavingOperator; label: string }> = [
  { value: 'greater_than', label: '>' },
  { value: 'less_than', label: '<' },
  { value: 'greater_than_or_equal_to', label: '≥' },
  { value: 'less_than_or_equal_to', label: '≤' },
  { value: 'equals', label: '=' },
  { value: 'does_not_equal', label: '≠' },
];

const selectClasses = 'bg-surface-3 border border-border rounded-md px-2 py-1.5 text-xs text-text focus:outline-none focus:border-accent transition-colors';
const inputClasses = 'bg-surface-3 border border-border rounded-md px-2 py-1.5 text-xs text-text placeholder-text-muted focus:outline-none focus:border-accent transition-colors';
const toggleBtnBase = 'px-2 py-1 text-xs font-mono rounded-md transition-colors';

export default function FiltersPanel({
  databaseId, properties, filters, filterLogic, sorts, having,
  onFiltersChange, onFilterLogicChange, onSortsChange, onHavingChange,
}: Props) {
  const [selectOptions, setSelectOptions] = useState<Record<string, Array<{ name: string; color?: string }>>>({});

  const filterableProps = properties.filter((p) => toFilterType(p.type) !== null);

  useEffect(() => {
    const selectProps = filters
      .filter((f) => (f.property_type === 'select' || f.property_type === 'multi_select') && f.property)
      .map((f) => f.property);

    const uniqueProps = [...new Set(selectProps)].filter((p) => !selectOptions[p]);
    if (!uniqueProps.length || !databaseId) return;

    uniqueProps.forEach((propName) => {
      api
        .get<{ options: Array<{ name: string; color?: string }> }>(
          `/integrations/notion/databases/${databaseId}/properties/${encodeURIComponent(propName)}/options`,
        )
        .then(({ data }) => {
          setSelectOptions((prev) => ({ ...prev, [propName]: data.options }));
        })
        .catch(() => {});
    });
  }, [databaseId, filters, selectOptions]);

  const addFilter = () => {
    const firstProp = filterableProps[0];
    if (!firstProp) return;
    const filterType = toFilterType(firstProp.type)!;
    const ops = getOperators(filterType);
    onFiltersChange([
      ...filters,
      { property: firstProp.name, property_type: filterType, operator: ops[0].value },
    ]);
  };

  const updateFilter = (index: number, patch: Partial<NotionFilter>) => {
    const updated = filters.map((f, i) => (i === index ? { ...f, ...patch } : f));
    onFiltersChange(updated);
  };

  const removeFilter = (index: number) => {
    onFiltersChange(filters.filter((_, i) => i !== index));
  };

  const addSort = () => {
    const firstProp = properties[0];
    if (!firstProp) return;
    onSortsChange([...sorts, { property: firstProp.name, direction: 'ascending' }]);
  };

  const updateSort = (index: number, patch: Partial<NotionSort>) => {
    const updated = sorts.map((s, i) => (i === index ? { ...s, ...patch } : s));
    onSortsChange(updated);
  };

  const removeSort = (index: number) => {
    onSortsChange(sorts.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-3">
      {/* ── Filters ── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted uppercase tracking-wider font-mono">Filtros</span>
          <button
            type="button"
            onClick={addFilter}
            disabled={!filterableProps.length}
            className="text-xs text-accent hover:text-accent/80 transition-colors font-mono disabled:opacity-40"
          >
            + Añadir
          </button>
        </div>

        {/* AND / OR toggle — only show when 2+ filters */}
        {filters.length >= 2 && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-text-muted mr-1">Lógica:</span>
            <button
              type="button"
              onClick={() => onFilterLogicChange('and')}
              className={`${toggleBtnBase} ${filterLogic === 'and' ? 'bg-accent text-surface' : 'bg-surface-3 text-text-muted border border-border'}`}
            >
              AND
            </button>
            <button
              type="button"
              onClick={() => onFilterLogicChange('or')}
              className={`${toggleBtnBase} ${filterLogic === 'or' ? 'bg-accent text-surface' : 'bg-surface-3 text-text-muted border border-border'}`}
            >
              OR
            </button>
          </div>
        )}

        {filters.map((filter, i) => {
          const operators = getOperators(filter.property_type);
          const showValue = needsValue(filter.operator);

          return (
            <div key={i} className="flex flex-wrap items-center gap-1 bg-surface-3/50 rounded-md p-2">
              {/* Connector label between filters */}
              {i > 0 && (
                <span className="text-[10px] text-accent font-mono w-full -mt-1 -mb-0.5">{filterLogic.toUpperCase()}</span>
              )}

              <select
                value={filter.property}
                onChange={(e) => {
                  const prop = filterableProps.find((p) => p.name === e.target.value);
                  if (!prop) return;
                  const newType = toFilterType(prop.type)!;
                  const newOps = getOperators(newType);
                  updateFilter(i, {
                    property: prop.name,
                    property_type: newType,
                    operator: newOps[0].value,
                    value: undefined,
                  });
                }}
                className={`${selectClasses} flex-1 min-w-[100px]`}
              >
                {filterableProps.map((p) => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>

              <select
                value={filter.operator}
                onChange={(e) => updateFilter(i, { operator: e.target.value as NotionFilterOperator, value: undefined })}
                className={`${selectClasses} min-w-[90px]`}
              >
                {operators.map((op) => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>

              {showValue && (
                filter.property_type === 'checkbox' ? (
                  <select
                    value={filter.value === true || filter.value === 'true' ? 'true' : 'false'}
                    onChange={(e) => updateFilter(i, { value: e.target.value === 'true' })}
                    className={`${selectClasses} w-16`}
                  >
                    <option value="true">Sí</option>
                    <option value="false">No</option>
                  </select>
                ) : (filter.property_type === 'select' || filter.property_type === 'multi_select') && selectOptions[filter.property] ? (
                  <select
                    value={String(filter.value ?? '')}
                    onChange={(e) => updateFilter(i, { value: e.target.value })}
                    className={`${selectClasses} flex-1 min-w-[80px]`}
                  >
                    <option value="">— Seleccionar —</option>
                    {selectOptions[filter.property].map((opt) => (
                      <option key={opt.name} value={opt.name}>{opt.name}</option>
                    ))}
                  </select>
                ) : filter.property_type === 'number' ? (
                  <input
                    type="number"
                    value={filter.value !== undefined ? String(filter.value) : ''}
                    onChange={(e) => updateFilter(i, { value: e.target.value === '' ? undefined : Number(e.target.value) })}
                    placeholder="Valor"
                    className={`${inputClasses} w-20`}
                  />
                ) : filter.property_type === 'date' ? (
                  <input
                    type="date"
                    value={String(filter.value ?? '')}
                    onChange={(e) => updateFilter(i, { value: e.target.value || undefined })}
                    className={`${inputClasses} flex-1 min-w-[120px]`}
                  />
                ) : (
                  <input
                    type="text"
                    value={String(filter.value ?? '')}
                    onChange={(e) => updateFilter(i, { value: e.target.value || undefined })}
                    placeholder="Valor"
                    className={`${inputClasses} flex-1 min-w-[80px]`}
                  />
                )
              )}

              <button
                type="button"
                onClick={() => removeFilter(i)}
                className="text-text-muted hover:text-red-400 transition-colors text-sm px-1"
                title="Eliminar filtro"
              >
                ×
              </button>
            </div>
          );
        })}

        {!filters.length && (
          <p className="text-xs text-text-muted/60 italic">Sin filtros — se muestran todos los datos</p>
        )}
      </div>

      {/* ── Having (post-aggregation) ── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted uppercase tracking-wider font-mono">Filtro de valor</span>
          {!having ? (
            <button
              type="button"
              onClick={() => onHavingChange({ operator: 'greater_than', value: 0 })}
              className="text-xs text-accent hover:text-accent/80 transition-colors font-mono"
            >
              + Añadir
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onHavingChange(undefined)}
              className="text-xs text-red-400 hover:text-red-300 transition-colors font-mono"
            >
              Quitar
            </button>
          )}
        </div>
        {having && (
          <div className="flex items-center gap-1 bg-surface-3/50 rounded-md p-2">
            <span className="text-xs text-text-muted shrink-0">Valor agregado</span>
            <select
              value={having.operator}
              onChange={(e) => onHavingChange({ ...having, operator: e.target.value as HavingOperator })}
              className={`${selectClasses} w-14`}
            >
              {HAVING_OPERATORS.map((op) => (
                <option key={op.value} value={op.value}>{op.label}</option>
              ))}
            </select>
            <input
              type="number"
              value={having.value}
              onChange={(e) => onHavingChange({ ...having, value: e.target.value === '' ? 0 : Number(e.target.value) })}
              className={`${inputClasses} w-20`}
              placeholder="0"
            />
          </div>
        )}
        {!having && (
          <p className="text-xs text-text-muted/60 italic">Filtra por el resultado (ej: conteo {'>'} 5)</p>
        )}
      </div>

      {/* ── Sorts ── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted uppercase tracking-wider font-mono">Ordenar</span>
          <button
            type="button"
            onClick={addSort}
            disabled={!properties.length}
            className="text-xs text-accent hover:text-accent/80 transition-colors font-mono disabled:opacity-40"
          >
            + Añadir
          </button>
        </div>

        {sorts.map((sort, i) => (
          <div key={i} className="flex items-center gap-1">
            <select
              value={sort.property}
              onChange={(e) => updateSort(i, { property: e.target.value })}
              className={`${selectClasses} flex-1 min-w-0`}
            >
              {properties.map((p) => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
            </select>
            <select
              value={sort.direction}
              onChange={(e) => updateSort(i, { direction: e.target.value as 'ascending' | 'descending' })}
              className={`${selectClasses} w-28 shrink-0`}
            >
              <option value="ascending">↑ Ascendente</option>
              <option value="descending">↓ Descendente</option>
            </select>
            <button
              type="button"
              onClick={() => removeSort(i)}
              className="text-text-muted hover:text-red-400 transition-colors text-sm px-1"
              title="Eliminar orden"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
