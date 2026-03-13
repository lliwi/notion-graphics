import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { ChartDataResult } from '@/types';

export function useChartData(id: string | null) {
  const [data, setData] = useState<ChartDataResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async (chartId: string) => {
    setLoading(true);
    setError('');
    try {
      const { data: result } = await api.get<ChartDataResult>(`/charts/${chartId}/data`);
      setData(result);
    } catch {
      setError('Error al obtener datos de Notion');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData(id);
  }, [id]);

  return { data, loading, error, refetch: () => id && fetchData(id) };
}
