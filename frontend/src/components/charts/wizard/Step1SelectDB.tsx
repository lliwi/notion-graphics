'use client';

import Spinner from '@/components/ui/Spinner';
import { NotionDatabase } from '@/types';

interface Props {
  databases: NotionDatabase[];
  loading: boolean;
  connected: boolean;
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function Step1SelectDB({ databases, loading, connected, selectedId, onSelect }: Props) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted mb-4">Necesitas conectar Notion primero.</p>
        <a href="/api/notion-connect" className="text-accent underline text-sm">
          Conectar Notion
        </a>
      </div>
    );
  }

  if (databases.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted text-sm">
          No se encontraron bases de datos. Comparte al menos una con la integración en Notion.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {databases.map((db) => (
        <button
          key={db.id}
          onClick={() => onSelect(db.id)}
          className={`text-left px-4 py-3 rounded-lg border transition-colors ${
            selectedId === db.id
              ? 'border-accent bg-accent/10 text-text'
              : 'border-border bg-surface-2 hover:border-accent/40 text-text'
          }`}
        >
          <p className="font-medium text-sm">{db.title}</p>
          <p className="text-xs text-text-muted font-mono mt-0.5">{db.id}</p>
        </button>
      ))}
    </div>
  );
}
