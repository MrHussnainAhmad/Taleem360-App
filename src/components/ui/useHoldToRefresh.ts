import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useEffect, useRef, useState } from 'react';

const HOLD_DURATION_MS = 2000;

/** Arms pull-to-refresh only after a two-second hold at the top of a list. */
export function useHoldToRefresh(onRefresh: () => void) {
  const scrollOffset = useRef(0);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const disarmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const armedRef = useRef(false);
  const [armed, setArmed] = useState(false);

  const clearHold = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  const clearDisarm = () => {
    if (disarmTimer.current) {
      clearTimeout(disarmTimer.current);
      disarmTimer.current = null;
    }
  };

  const disarm = () => {
    armedRef.current = false;
    setArmed(false);
  };

  const onTouchStart = () => {
    if (scrollOffset.current > 0 || armedRef.current) return;
    clearHold();
    clearDisarm();
    holdTimer.current = setTimeout(() => {
      armedRef.current = true;
      setArmed(true);
    }, HOLD_DURATION_MS);
  };

  const onTouchEnd = () => {
    clearHold();
    clearDisarm();
    disarmTimer.current = setTimeout(disarm, 150);
  };

  useEffect(() => () => {
    clearHold();
    clearDisarm();
  }, []);

  return {
    refreshControlProps: {
      enabled: armed,
      onRefresh: () => {
        if (armedRef.current) onRefresh();
      },
    },
    scrollProps: {
      scrollEventThrottle: 16,
      onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        scrollOffset.current = event.nativeEvent.contentOffset.y;
      },
      onTouchStart,
      onTouchEnd,
      onTouchCancel: onTouchEnd,
    },
  };
}
