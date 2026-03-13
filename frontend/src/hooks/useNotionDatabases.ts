import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { NotionDatabase } from '@/types';

export function useNotionDatabases() {
  const [databases, setDatabases] = useState<NotionDatabase[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<NotionDatabase[]>('/integrations/notion/databases')
      .then(({ data }) => {
        setDatabases(data);
        setConnected(true);
      })
      .catch(() => {
        setConnected(false);
      })
      .finally(() => setLoading(false));
  }, []);

  return { databases, connected, loading };
}
