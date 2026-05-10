import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../components/AuthProvider';

export interface NotificationCounts {
  alertas: number;
  guardia: number;
  mantenimiento: number;
}

export function useNotifications() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<NotificationCounts>({
    alertas: 0,
    guardia: 0,
    mantenimiento: 0
  });

  const fetchCounts = async () => {
    if (!user) return;
    try {
      const data = await apiFetch('/api/notifications/counts');
      setCounts(data);
    } catch (error) {
      console.error("Error fetching notification counts:", error);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchCounts();
    const interval = setInterval(fetchCounts, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, [user]);

  return { counts, refresh: fetchCounts };
}
