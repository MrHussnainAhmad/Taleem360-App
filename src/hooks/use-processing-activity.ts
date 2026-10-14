import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';

export function useProcessingActivity() {
  const focused = useRef(false);
  const controller = useRef(new AbortController());
  const waiters = useRef(new Set<() => void>());
  const wake = useCallback(() => { waiters.current.forEach(callback => callback()); }, []);
  useEffect(() => {
    controller.current = new AbortController();
    const subscription = AppState.addEventListener('change', wake);
    return () => { controller.current.abort(); wake(); subscription.remove(); };
  }, [wake]);
  useFocusEffect(useCallback(() => {
    focused.current = true;
    wake();
    return () => { focused.current = false; };
  }, [wake]));
  const waitUntilActive = useCallback((signal: AbortSignal): Promise<void> => new Promise((resolve, reject) => {
    const check = () => {
      if (!signal.aborted && (!focused.current || AppState.currentState === 'background' || AppState.currentState === 'inactive')) return;
      waiters.current.delete(check);
      signal.removeEventListener('abort', check);
      if (signal.aborted) reject(new Error('Processing cancelled'));
      else resolve();
    };
    waiters.current.add(check);
    signal.addEventListener('abort', check, { once: true });
    check();
  }), []);
  return { getSignal: () => controller.current.signal, waitUntilActive };
}
