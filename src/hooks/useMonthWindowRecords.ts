import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiClient } from '@/utils/api';
import {
  addMonths,
  buildRangeQuery,
  isSameMonth,
  monthKey,
  singleMonthRange,
  startOfMonth,
  windowRange,
} from '@/utils/month-window';

type FetchPage<T> = (query: string) => Promise<T[]>;

/**
 * Fixed initial window (current + monthsBack earlier), local month filter.
 * Earlier months load only when the user navigates to a month not yet fetched.
 */
export function useMonthWindowRecords<T extends { id: number }>(options: {
  /** How many months earlier than the view month to include on first load (1 = 2 months total). */
  monthsBack: number;
  fetchPage: FetchPage<T>;
  getItemMonth: (item: T) => Date;
  /** Records already fetched elsewhere (e.g. a dashboard payload) for the same window — skips the initial GET. */
  initialRecords?: T[];
}) {
  const { monthsBack, fetchPage, getItemMonth, initialRecords } = options;
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));
  const [records, setRecords] = useState<T[]>(() => initialRecords || []);
  const [oldestLoaded, setOldestLoaded] = useState(() => startOfMonth(addMonths(new Date(), -monthsBack)));
  const [newestLoaded, setNewestLoaded] = useState(() => startOfMonth(new Date()));
  const [loading, setLoading] = useState(() => !initialRecords);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const fetchedMonthsRef = useRef<Set<string>>(new Set());
  const prefetchInFlightRef = useRef<string | null>(null);
  const seededOnMountRef = useRef(initialRecords !== undefined);

  const mergeRecords = useCallback((incoming: T[]) => {
    setRecords((current) => {
      const byId = new Map(current.map((row) => [row.id, row]));
      incoming.forEach((row) => byId.set(row.id, row));
      return Array.from(byId.values());
    });
  }, []);

  const markMonthsFetched = useCallback((fromMonth: Date, toMonth: Date) => {
    let cursor = startOfMonth(fromMonth);
    const end = startOfMonth(toMonth);
    while (cursor <= end) {
      fetchedMonthsRef.current.add(monthKey(cursor));
      cursor = addMonths(cursor, 1);
    }
  }, []);

  const loadInitial = useCallback(async (force = false) => {
    if (force) {
      setRefreshing(true);
      fetchedMonthsRef.current.clear();
      prefetchInFlightRef.current = null;
    } else {
      setLoading(true);
    }

    const anchor = startOfMonth(new Date());
    const { from, to } = windowRange(anchor, monthsBack);

    try {
      const rows = await fetchPage(buildRangeQuery(from, to));
      setRecords(rows);
      setViewMonth(anchor);
      setOldestLoaded(startOfMonth(addMonths(anchor, -monthsBack)));
      setNewestLoaded(anchor);
      markMonthsFetched(addMonths(anchor, -monthsBack), anchor);
      setError('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load records');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchPage, markMonthsFetched, monthsBack]);

  useEffect(() => {
    if (seededOnMountRef.current) {
      // Already have this window's data from a shared payload — just mark it fetched.
      const anchor = startOfMonth(new Date());
      markMonthsFetched(addMonths(anchor, -monthsBack), anchor);
      setError('');
      return;
    }
    void loadInitial();
  }, [loadInitial, markMonthsFetched, monthsBack]);

  const prefetchMonth = useCallback(async (target: Date) => {
    const key = monthKey(target);
    if (fetchedMonthsRef.current.has(key)) return;
    if (prefetchInFlightRef.current === key) return;

    prefetchInFlightRef.current = key;
    const { from, to } = singleMonthRange(target);
    try {
      const rows = await fetchPage(buildRangeQuery(from, to));
      mergeRecords(rows);
      fetchedMonthsRef.current.add(key);
      setOldestLoaded((current) => (target < current ? startOfMonth(target) : current));
      setNewestLoaded((current) => (target > current ? startOfMonth(target) : current));
    } catch {
      // Silent: edge prefetch is best-effort; user can pull-to-refresh.
    } finally {
      if (prefetchInFlightRef.current === key) prefetchInFlightRef.current = null;
    }
  }, [fetchPage, mergeRecords]);

  const goPrevMonth = useCallback(() => {
    setViewMonth((current) => addMonths(current, -1));
  }, []);

  const goNextMonth = useCallback(() => {
    setViewMonth((current) => {
      const next = addMonths(current, 1);
      const now = startOfMonth(new Date());
      return next > now ? current : next;
    });
  }, []);

  // Fetch a month only when the user navigates onto one that is not loaded yet.
  useEffect(() => {
    if (loading) return;
    const key = monthKey(viewMonth);
    if (fetchedMonthsRef.current.has(key)) return;
    void prefetchMonth(viewMonth);
  }, [loading, viewMonth, prefetchMonth]);

  const filtered = useMemo(
    () => records.filter((item) => isSameMonth(getItemMonth(item), viewMonth)),
    [records, viewMonth, getItemMonth],
  );

  return {
    viewMonth,
    filtered,
    records,
    loading,
    refreshing,
    error,
    goPrevMonth,
    goNextMonth,
    refresh: () => loadInitial(true),
  };
}

export async function fetchStudentAttendancePage(query: string) {
  const data = await apiClient(`/api/student/attendance?${query}`);
  return (data.attendance || []) as Array<{
    id: number;
    date: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';
    sectionName: string;
  }>;
}

export async function fetchStudentMarksPage(query: string) {
  const data = await apiClient(`/api/student/marks?${query}`);
  return (data.marks || []) as Array<{
    id: number;
    testId?: number;
    marksObtained: number;
    totalMarks: number;
    testTitle: string;
    testDate: string;
    testType: string;
    subjectName: string;
    isOnline?: boolean;
    onlineTestId?: number;
  }>;
}
