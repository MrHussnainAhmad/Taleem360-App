import { useContext, useEffect, useState } from 'react';
import { Animated, AppState } from 'react-native';
import { NavigationContext } from '@react-navigation/native';
import { useReducedMotion } from './use-reduced-motion';

const opacity = new Animated.Value(0.65);
let users = 0;
let animation: Animated.CompositeAnimation | undefined;

function stop() {
  animation?.stop();
  animation = undefined;
  opacity.setValue(0.65);
}

function start() {
  if (animation || !users || (AppState.currentState && AppState.currentState !== 'active')) return;
  animation = Animated.loop(Animated.sequence([
    Animated.timing(opacity, { toValue: 0.85, duration: 800, useNativeDriver: true, isInteraction: false }),
    Animated.timing(opacity, { toValue: 0.5, duration: 800, useNativeDriver: true, isInteraction: false }),
  ]));
  animation.start();
}

let appSubscription: ReturnType<typeof AppState.addEventListener> | undefined;
function retainPulse() {
  users += 1;
  if (users === 1) {
    appSubscription = AppState.addEventListener('change', (state) => state === 'active' ? start() : stop());
    start();
  }
  return () => {
    users -= 1;
    if (!users) {
      stop();
      appSubscription?.remove();
      appSubscription = undefined;
    }
  };
}

/** All visible placeholders share one native animation, paused off screen. */
export function useLoadingPulse() {
  const reduced = useReducedMotion();
  const navigation = useContext(NavigationContext);
  const [focused, setFocused] = useState(() => navigation?.isFocused() ?? true);
  useEffect(() => {
    if (!navigation) return;
    const focus = navigation.addListener('focus', () => setFocused(true));
    const blur = navigation.addListener('blur', () => setFocused(false));
    return () => { focus(); blur(); };
  }, [navigation]);
  useEffect(() => {
    if (!reduced && focused) return retainPulse();
  }, [reduced, focused]);
  return reduced || !focused ? 0.65 : opacity;
}
