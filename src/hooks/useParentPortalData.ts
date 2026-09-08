import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { apiClient } from '@/utils/api';
import { useParentPortal } from '@/context/ParentPortalContext';

type CacheEntry = { data: unknown; storedAt: number };
const CACHE_TTL_MS = 2 * 60 * 1000;
const responseCache = new Map<string, CacheEntry>();
const pendingRequests = new Map<string, Promise<unknown>>();

export function clearParentPortalDataCache() {
  responseCache.clear();
  pendingRequests.clear();
}

async function requestOnce<T>(key: string, url: string, force: boolean): Promise<T> {
  if (!force) {
    const pending = pendingRequests.get(key);
    if (pending) return pending as Promise<T>;
  }
  const request = apiClient(url).then((result) => {
    responseCache.set(key, { data: result, storedAt: Date.now() });
    return result;
  }).finally(() => {
    if (pendingRequests.get(key) === request) pendingRequests.delete(key);
  });
  pendingRequests.set(key, request);
  return request as Promise<T>;
}

export function useParentPortalData<T>(section: string, extraQuery = '') {
  const { selectedStudentId, period, periodAnchor } = useParentPortal();
  const periodQuery = `&period=${period}&anchor=${periodAnchor}`;
  const key = selectedStudentId ? `${selectedStudentId}:${period}:${periodAnchor}:${section}:${extraQuery}` : '';
  const url = selectedStudentId ? `/api/parent/portal?section=${encodeURIComponent(section)}&student=${selectedStudentId}${periodQuery}${extraQuery}` : '';
  const initial = key ? responseCache.get(key) : undefined;
  const [data, setData] = useState<T | null>(() => (initial?.data as T) ?? null);
  const [loading, setLoading] = useState(!initial);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const versionRef = useRef(0);

  const load = useCallback(async (force = false) => {
    const version = ++versionRef.current;
    if (!key || !url) { setData(null); setLoading(false); setRefreshing(false); return; }
    const cached = responseCache.get(key);
    if (cached) setData(cached.data as T); else setData(null);
    setError('');
    if (cached && Date.now() - cached.storedAt < CACHE_TTL_MS && !force) { setLoading(false); setRefreshing(false); return; }
    if (force) setRefreshing(true); else if (!cached) setLoading(true);
    try {
      const result = await requestOnce<T>(key, url, force);
      if (version === versionRef.current) setData(result);
    } catch (requestError) {
      if (version === versionRef.current && !cached) setError(requestError instanceof Error ? requestError.message : 'Could not load data.');
    } finally {
      if (version === versionRef.current) { setLoading(false); setRefreshing(false); }
    }
  }, [key, url]);

  useFocusEffect(useCallback(() => {
    void load(false);
    return () => { versionRef.current += 1; };
  }, [load]));
  const reload = useCallback(() => load(true), [load]);
  return { data, loading, refreshing, error, reload };
}
