import { useCallback, useState } from 'react';
import { Text } from 'react-native';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, BASE_URL } from '@/utils/api';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useThemeColors } from '@/context/ThemePreferencesContext';
type Promotion = { id: number; status: 'PROMOTED' | 'RETAINED' | 'GRADUATED' };
export function PromotionResult() {
  const colors = useThemeColors();
  const [promotion, setPromotion] = useState<Promotion | null>(null),
    [error, setError] = useState('');
  useFocusEffect(
    useCallback(() => {
      let active = true;
      apiClient('/api/student/promotion-result')
        .then(async (data) => {
          if (
            data.promotion &&
            !(await AsyncStorage.getItem(`promotion-result:${BASE_URL}:${data.promotion.id}`)) &&
            active
          )
            setPromotion(data.promotion);
        })
        .catch(() => {});
      return () => {
        active = false;
      };
    }, []),
  );
  async function acknowledge() {
    if (!promotion) return;
    try {
      await AsyncStorage.setItem(`promotion-result:${BASE_URL}:${promotion.id}`, '1');
      setPromotion(null);
    } catch {
      setError('Could not save acknowledgment. Please retry.');
    }
  }
  return (
    <Modal
      visible={Boolean(promotion)}
      title={
        promotion?.status === 'GRADUATED'
          ? 'Congratulations, you graduated'
          : promotion?.status === 'PROMOTED'
            ? 'Congratulations, you are promoted'
            : 'Your promotion result is ready'
      }
      onClose={() => void acknowledge()}
      footer={<Button title="Continue" onPress={() => void acknowledge()} />}
    >
      <Text style={{ color: colors.text }}>
        {promotion?.status === 'RETAINED'
          ? 'You will continue in your current class. Review your subjects with your teachers and keep working toward your next step.'
          : promotion?.status === 'GRADUATED'
            ? 'Your hard work has brought you to this milestone. Your official results are available in Transcripts.'
            : 'Your hard work has paid off. Your new class and official results are available in your student portal.'}
      </Text>
      {error ? <Text style={{ color: colors.error }}>{error}</Text> : null}
    </Modal>
  );
}
