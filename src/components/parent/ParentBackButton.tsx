import { useCallback } from 'react';
import { BackHandler, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Radius } from '@/constants/theme';

type ParentTarget = '/(parent)/academics' | '/(parent)/account';

export function useParentHardwareBack(target: ParentTarget | null) {
  const router = useRouter();
  const navigate = useCallback(() => {
    if (target) router.replace(target as never);
  }, [router, target]);

  useFocusEffect(useCallback(() => {
    if (!target) return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      navigate();
      return true;
    });
    return () => subscription.remove();
  }, [navigate, target]));

  return navigate;
}

export function ParentBackButton({ target }: { target: ParentTarget }) {
  const navigate = useParentHardwareBack(target);
  return (
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" activeOpacity={0.72} onPress={navigate} style={styles.button}>
      <Ionicons name="arrow-back" size={20} color="#FFF" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { width: 40, height: 40, borderRadius: Radius.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.32)', backgroundColor: 'rgba(15,23,42,0.28)', alignItems: 'center', justifyContent: 'center' },
});
