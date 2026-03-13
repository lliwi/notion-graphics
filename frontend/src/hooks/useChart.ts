import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Chart } from '@/types';

export function useChart(id: string) {
  const [chart, setChart] = useState<Chart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchChart = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Chart>(`/charts/${id}`);
      setChart(data);
    } catch {
      setError('Gráfico no encontrado');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchChart();
  }, [id]);

  return { chart, setChart, loading, error, refetch: fetchChart };
}
