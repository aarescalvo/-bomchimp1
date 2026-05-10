let isRefreshing = false;
let refreshPromise: Promise<any> | null = null;

export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
    
    // If token expired, try to refresh
    if (response.status === 401 && error.code === 'TOKEN_EXPIRED') {
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = fetch('/api/auth/refresh', { method: 'POST' })
          .then(async (res) => {
            if (!res.ok) throw new Error('Refresh failed');
            return res.json();
          })
          .finally(() => {
            isRefreshing = false;
          });
      }

      try {
        await refreshPromise;
        // Retry the original request
        return apiFetch(endpoint, options);
      } catch (err) {
        // If refresh fails, go to login
        window.location.href = '/login';
        throw err;
      }
    }
    
    const err = new Error(error.error || 'Error en la petición');
    (err as any).code = error.code;
    (err as any).status = response.status;
    throw err;
  }

  // Handle No Content
  if (response.status === 204) return null;

  return response.json();
}
