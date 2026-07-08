import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { apiClient } from '@/utils/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let registrationInFlight: Promise<string | null> | null = null;

export type PushRegistrationResult = {
  ok: boolean;
  token?: string;
  reason?: string;
};

export async function registerForPushNotificationsAsync() {
  if (registrationInFlight) {
    return registrationInFlight;
  }

  console.log('[push] registration started');
  registrationInFlight = registerDeviceForPushNotifications()
    .then((token) => {
      console.log('[push] registration finished', { registered: Boolean(token) });
      return token;
    })
    .catch((error) => {
      console.warn('Push notification registration failed:', error);
      return null;
    })
    .finally(() => {
      registrationInFlight = null;
    });

  return registrationInFlight;
}

export async function registerForPushNotificationsWithResult(): Promise<PushRegistrationResult> {
  try {
    const token = await registerDeviceForPushNotifications();
    return token
      ? { ok: true, token }
      : { ok: false, reason: 'Push registration returned no device token.' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Push registration failed.';
    console.warn('Push notification registration failed:', error);
    return { ok: false, reason: message };
  }
}

async function registerDeviceForPushNotifications() {
  if (!Device.isDevice) {
    console.log('[push] skipped: physical device required');
    throw new Error('Push notifications require a real physical device.');
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2F6FED',
    });
  }

  const currentPermission = await Notifications.getPermissionsAsync();
  const permission = currentPermission.status === 'granted'
    ? currentPermission
    : await Notifications.requestPermissionsAsync();

  console.log('[push] permission status', permission.status);
  if (permission.status !== 'granted') {
    throw new Error(
      permission.canAskAgain === false
        ? 'Notification permission is blocked. Enable notifications from phone settings.'
        : 'Notification permission was not granted.'
    );
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  const tokenResponse = projectId
    ? await Notifications.getExpoPushTokenAsync({ projectId })
    : await Notifications.getExpoPushTokenAsync();

  const token = tokenResponse.data;
  if (!token) {
    throw new Error('Expo did not return a push token for this device.');
  }
  console.log('[push] expo token generated');

  await apiClient('/api/me/push-token', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
  console.log('[push] token saved to backend');

  return token;
}
