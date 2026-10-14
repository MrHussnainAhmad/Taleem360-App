import { useSyncExternalStore } from 'react';
import { AccessibilityInfo } from 'react-native';

// One native listener, shared by every animated control. Default to no motion
// until the OS preference is known, including during static web rendering.
let reduced = true;
let generation = 0;
const listeners = new Set<() => void>();
let subscription: ReturnType<typeof AccessibilityInfo.addEventListener> | undefined;

function update(value: boolean) {
  if (reduced === value) return;
  reduced = value;
  listeners.forEach((notify) => notify());
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  if (listeners.size === 1) {
    const version = ++generation;
    subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
      generation += 1;
      update(value);
    });
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (version === generation) update(value);
    }).catch(() => { if (version === generation) update(true); });
  }
  return () => {
    listeners.delete(notify);
    if (!listeners.size) {
      generation += 1;
      subscription?.remove();
      subscription = undefined;
    }
  };
}

export function useReducedMotion() {
  return useSyncExternalStore(subscribe, () => reduced, () => true);
}
