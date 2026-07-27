import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { apiClient } from '@/utils/api';

const DASHBOARD_CACHE_TTL_MS = 60_000;

type TimetableItem = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subjectName: string;
  teacherName: string;
};

type Assignment = {
  id: number;
  title: string;
  dueAt: string;
  submission: unknown;
};

type AnnouncementPreview = {
  id: number;
  title: string;
  content?: string;
  createdAt?: string;
  createdAtIso?: string;
  senderRole?: string;
};

export type StudentDashboardSnapshot = {
  timetable: TimetableItem[];
  assignments: Assignment[];
  latestScore: string;
  announcements: AnnouncementPreview[];
  hasExams: boolean;
  hasTests: boolean;
  hasTranscripts: boolean;
  hasFeeVouchers: boolean;
  firstName: string;
  unreadNotificationsCount: number;
  hasPushToken: boolean;
};

type StudentDashboardContextValue = {
  snapshot: StudentDashboardSnapshot | null;
  loading: boolean;
  error: string;
  refreshing: boolean;
  ensureDashboard: (options?: { force?: boolean }) => Promise<StudentDashboardSnapshot | null>;
  setHasPushToken: (value: boolean) => void;
  invalidate: () => void;
};

const StudentDashboardContext = createContext<StudentDashboardContextValue | undefined>(undefined);

export function StudentDashboardProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<StudentDashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const fetchedAtRef = useRef(0);
  const inFlightRef = useRef<Promise<StudentDashboardSnapshot | null> | null>(null);
  // Mirrors `snapshot` so the TTL short-circuit below can read the latest value
  // without needing `snapshot` in ensureDashboard's deps (keeps its identity stable).
  const snapshotRef = useRef<StudentDashboardSnapshot | null>(null);
  snapshotRef.current = snapshot;

  const invalidate = useCallback(() => {
    fetchedAtRef.current = 0;
  }, []);

  const setHasPushToken = useCallback((value: boolean) => {
    setSnapshot((current) => (current ? { ...current, hasPushToken: value } : current));
  }, []);

  const ensureDashboard = useCallback(async (options?: { force?: boolean }) => {
    const force = options?.force === true;
    const age = Date.now() - fetchedAtRef.current;
    const currentSnapshot = snapshotRef.current;
    if (!force && currentSnapshot && age < DASHBOARD_CACHE_TTL_MS) {
      return currentSnapshot;
    }

    if (inFlightRef.current) {
      return inFlightRef.current;
    }

    const request = (async () => {
      if (currentSnapshot && !force) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        // Single aggregate for visible home widgets only (timetable, score,
        // assignment preview, announcements). Detail screens load on navigate.
        const res = await apiClient('/api/student/dashboard');

        const next: StudentDashboardSnapshot = {
          timetable: res.timetable || [],
          assignments: res.assignments || [],
          latestScore: res.latestScore || 'N/A',
          announcements: res.announcements || [],
          unreadNotificationsCount: 0,
          hasPushToken: Boolean(res.hasPushToken),
          firstName: res.firstName || 'Student',
          // Static nav hints — section screens fetch their own data on open.
          hasExams: true,
          hasTests: true,
          hasTranscripts: true,
          hasFeeVouchers: true,
        };

        setSnapshot(next);
        snapshotRef.current = next;
        fetchedAtRef.current = Date.now();
        setError('');
        return next;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load dashboard data';
        setError(message);
        return snapshotRef.current;
      } finally {
        setLoading(false);
        setRefreshing(false);
        inFlightRef.current = null;
      }
    })();

    inFlightRef.current = request;
    return request;
  }, []);

  const value = useMemo(() => ({
    snapshot,
    loading,
    error,
    refreshing,
    ensureDashboard,
    setHasPushToken,
    invalidate,
  }), [snapshot, loading, error, refreshing, ensureDashboard, setHasPushToken, invalidate]);

  return (
    <StudentDashboardContext.Provider value={value}>
      {children}
    </StudentDashboardContext.Provider>
  );
}

export function useStudentDashboard() {
  const context = useContext(StudentDashboardContext);
  if (!context) {
    throw new Error('useStudentDashboard must be used within a StudentDashboardProvider');
  }
  return context;
}

export function useOptionalStudentDashboard() {
  return useContext(StudentDashboardContext);
}
