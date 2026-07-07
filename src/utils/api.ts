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
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    // Important for cookie-based auth in React Native Web and sometimes Native
    credentials: 'omit', // Wait, vercel backend probably needs 'include' if CORS allows it
  };

  // For cross-origin requests with cookies, credentials usually must be 'include'
  config.credentials = 'include';

  let response = await fetch(url, config);
  
  if (response.status === 401 && endpoint !== '/api/auth/refresh' && endpoint !== '/api/auth/login') {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshRes = await fetch(`${BASE_URL}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        if (!refreshRes.ok) throw new Error('Session expired');
        
        processQueue(null);
      } catch (err: any) {
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

    // Retry original request
    response = await fetch(url, config);
  }

  if (!response.ok) {
    let errorMsg = 'An error occurred';
    try {
      const errData = await response.json();
      errorMsg = errData.message || errorMsg;
    } catch (e) {
      errorMsg = response.statusText;
    }
    throw new Error(errorMsg);
  }

  return response.json();
}
