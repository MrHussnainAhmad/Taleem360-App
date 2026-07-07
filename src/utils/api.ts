import { clearAuthTokens, getAccessToken, getRefreshToken, setAuthTokens } from '@/utils/auth-storage';

export const BASE_URL = 'https://lms-two-iota-69.vercel.app';

let isRefreshing = false;
let failedQueue: { resolve: () => void, reject: (err: any) => void }[] = [];

const processQueue = (error: Error | null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve();
  });
  failedQueue = [];
};

export async function apiClient(endpoint: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const accessToken = await getAccessToken();
  
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (accessToken) {
    defaultHeaders.Authorization = `Bearer ${accessToken}`;
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include',
  };

  let response = await fetch(url, config);
  
  if (response.status === 401 && endpoint !== '/api/auth/refresh' && endpoint !== '/api/auth/login') {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) throw new Error('Session expired');

        const refreshRes = await fetch(`${BASE_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ refreshToken }),
        });
        if (!refreshRes.ok) throw new Error('Session expired');

        const refreshData = await refreshRes.json();
        if (!refreshData.accessToken || !refreshData.refreshToken) {
          throw new Error('Session expired');
        }
        await setAuthTokens(refreshData.accessToken, refreshData.refreshToken);
        
        processQueue(null);
      } catch (err: any) {
        await clearAuthTokens();
        processQueue(err);
        throw err;
      } finally {
        isRefreshing = false;
      }
    } else {
      await new Promise<void>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      });
    }

    const retryAccessToken = await getAccessToken();
    response = await fetch(url, {
      ...config,
      headers: {
        ...config.headers,
        ...(retryAccessToken ? { Authorization: `Bearer ${retryAccessToken}` } : {}),
      },
    });
  }

  if (!response.ok) {
    let errorMsg = 'An error occurred';
    try {
      const errData = await response.json();
      errorMsg = errData.message || errData.error || errorMsg;
    } catch {
      errorMsg = response.statusText;
    }
    throw new Error(errorMsg);
  }

  return response.json();
}
