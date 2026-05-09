export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
    
    if (response.status === 401 && error.code === 'TOKEN_EXPIRED') {
       window.location.href = '/login';
    }
    
    const err = new Error(error.error || 'Error en la petición');
    (err as any).code = error.code;
    throw err;
  }

  return response.json();
}
