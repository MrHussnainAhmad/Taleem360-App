type Entry = { expiresAt: number; value?: unknown; pending?: Promise<unknown> };

// Small, in-memory cache for explicitly selected reads only. Nothing is saved
// to disk; tokens are used only to isolate sessions, never as persistent keys.
export function createRequestCache() {
  let session: string | null = null;
  const entries = new Map<string, Entry>();
  return {
    clear() { entries.clear(); session = null; },
    async read<T>(key: string, scope: string | null, ttl: number, fetcher: () => Promise<T>, force = false): Promise<T> {
      if (scope !== session) { entries.clear(); session = scope; }
      if (!scope) return fetcher();
      const previous = entries.get(key);
      if (!force && previous?.pending) return previous.pending as Promise<T>;
      if (!force && previous && previous.expiresAt > Date.now()) return previous.value as T;
      const entry: Entry = { expiresAt: 0 };
      entries.set(key, entry);
      // A failed read is never cached. A write/session change removes the entry,
      // so a slow older read cannot repopulate the cache after invalidation.
      const pending = Promise.resolve().then(fetcher).then(value => {
        if (entries.get(key) === entry) { entry.value = value; entry.expiresAt = Date.now() + ttl; }
        return value;
      }).catch(error => {
        if (entries.get(key) === entry) entries.delete(key);
        throw error;
      }).finally(() => { entry.pending = undefined; });
      entry.pending = pending;
      return pending;
    },
  };
}

export const requestCache = createRequestCache();
export function invalidateRequestCache() { requestCache.clear(); }

export function requestCacheTtl(endpoint: string): number {
  if (endpoint === '/api/student/profile' || endpoint === '/api/staff/profile') return 60_000;
  if (endpoint === '/api/student/promotion-result') return 120_000;
  if (endpoint === '/api/staff/assignments?view=metadata' || endpoint === '/api/staff/marks?view=metadata') return 120_000;
  return 0;
}
