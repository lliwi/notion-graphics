import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface NotionProperty {
  name: string;
  type: string;
}

export function useNotionProperties(databaseId: string | null) {
  const [properties, setProperties] = useState<NotionProperty[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!databaseId) {
      setProperties([]);
      return;
    }
    setLoading(true);
    api
      .get<NotionProperty[]>(`/integrations/notion/databases/${databaseId}/properties`)
      .then(({ data }) => setProperties(data))
      .catch(() => setProperties([]))
      .finally(() => setLoading(false));
  }, [databaseId]);

  return { properties, loading };
}
