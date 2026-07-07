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
let lastRegisteredToken: string | null = null;

export async function registerForPushNotificationsAsync() {
  if (registrationInFlight) {
    return registrationInFlight;
  }

  registrationInFlight = registerDeviceForPushNotifications()
    .catch((error) => {
      console.warn('Push notification registration failed:', error);
      return null;
    })
    .finally(() => {
      registrationInFlight = null;
    });

  return registrationInFlight;
}

async function registerDeviceForPushNotifications() {
  if (!Device.isDevice) {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2F6FED',
    });
  }

  const permission = await Notifications.requestPermissionsAsync();
  if (permission.status !== 'granted') {
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  const tokenResponse = projectId
    ? await Notifications.getExpoPushTokenAsync({ projectId })
    : await Notifications.getExpoPushTokenAsync();

  const token = tokenResponse.data;
  if (!token || token === lastRegisteredToken) {
    return token || null;
  }

  await apiClient('/api/me/push-token', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });

  lastRegisteredToken = token;
  return token;
}
