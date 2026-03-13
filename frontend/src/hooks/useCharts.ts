import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Chart } from '@/types';

export function useCharts() {
  const [charts, setCharts] = useState<Chart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCharts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Chart[]>('/charts');
      setCharts(data);
    } catch {
      setError('Error al cargar los gráficos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharts();
  }, []);

  return { charts, loading, error, refetch: fetchCharts };
}
