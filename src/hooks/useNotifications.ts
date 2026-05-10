import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

export interface NotificationCounts {
  alertas: number;
  guardia: number;
  mantenimiento: number;
}

export function useNotifications() {
  const [counts, setCounts] = useState<NotificationCounts>({
    alertas: 0,
    guardia: 0,
    mantenimiento: 0
  });

  const fetchCounts = async () => {
    try {
      const data = await apiFetch('/api/alerts/counts');
      setCounts(data);
    } catch (error) {
      console.error("Error fetching notification counts:", error);
    }
  };

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  return { counts, refresh: fetchCounts };
}
