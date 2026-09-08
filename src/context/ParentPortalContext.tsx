import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '@/utils/api';

export type ParentChild = { id: number; name: string; className: string; sectionName: string; campusName?: string | null };
export type ParentPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY';
type ParentPortalContextValue = { children: ParentChild[]; selectedStudentId: number | null; selectedChild: ParentChild | null; period: ParentPeriod; periodAnchor: string; loading: boolean; error: string; setSelectedStudentId: (id: number) => void; setPeriod: (period: ParentPeriod) => void; shiftPeriod: (direction: -1 | 1) => void; refreshChildren: () => Promise<void> };
const ParentPortalContext = createContext<ParentPortalContextValue | null>(null);
const STORAGE_KEY = 'parent_selected_student';
const localDateKey = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export function ParentPortalProvider({ children: content }: { children: React.ReactNode }) {
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [selectedStudentId, setSelectedState] = useState<number | null>(null);
  const [period, setPeriod] = useState<ParentPeriod>('MONTHLY');
  const [periodAnchor, setPeriodAnchor] = useState(localDateKey);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const childrenRequest = useRef<Promise<{ children?: ParentChild[] }> | null>(null);
  const refreshChildren = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      childrenRequest.current ??= apiClient('/api/parent/portal?section=children') as Promise<{ children?: ParentChild[] }>;
      const data = await childrenRequest.current;
      const list = data.children || [];
      setChildren(list);
      const stored = Number(await AsyncStorage.getItem(STORAGE_KEY));
      setSelectedState((current) => list.some((item) => item.id === current) ? current : list.some((item) => item.id === stored) ? stored : list[0]?.id || null);
    } catch (requestError) {
      setChildren([]);
      setSelectedState(null);
      setError(requestError instanceof Error ? requestError.message : 'Could not load linked children.');
    } finally { childrenRequest.current = null; setLoading(false); }
  }, []);
  useEffect(() => { void refreshChildren(); }, [refreshChildren]);
  const setSelectedStudentId = useCallback((id: number) => { if (!children.some((item) => item.id === id)) return; setSelectedState(id); void AsyncStorage.setItem(STORAGE_KEY, String(id)); }, [children]);
  const shiftPeriod = useCallback((direction: -1 | 1) => {
    setPeriodAnchor((current) => {
      const date = new Date(`${current}T12:00:00Z`);
      if (period === 'DAILY') date.setUTCDate(date.getUTCDate() + direction);
      else if (period === 'WEEKLY') date.setUTCDate(date.getUTCDate() + direction * 7);
      else { date.setUTCDate(1); date.setUTCMonth(date.getUTCMonth() + direction); }
      return date.toISOString().slice(0, 10);
    });
  }, [period]);
  const selectedChild = children.find((item) => item.id === selectedStudentId) || null;
  const value = useMemo(() => ({ children, selectedStudentId, selectedChild, period, periodAnchor, loading, error, setSelectedStudentId, setPeriod, shiftPeriod, refreshChildren }), [children, selectedStudentId, selectedChild, period, periodAnchor, loading, error, setSelectedStudentId, shiftPeriod, refreshChildren]);
  return <ParentPortalContext.Provider value={value}>{content}</ParentPortalContext.Provider>;
}

export function useParentPortal() { const value = useContext(ParentPortalContext); if (!value) throw new Error('useParentPortal must be used inside ParentPortalProvider'); return value; }
