import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from './firebase';
import { DEVICE_ID_KEY } from './authService';
import type { NotificationData } from '../types/notification';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export type RegisterResult =
  | { status: 'ok'; token: string }
  | { status: 'denied' | 'unsupported' | 'error'; message: string };

export async function registerDevice(uid: string): Promise<RegisterResult> {
  if (!Device.isDevice) {
    return { status: 'unsupported', message: 'Notificações push exigem um dispositivo físico.' };
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Mensagens',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  let granted = (await Notifications.getPermissionsAsync()).granted;
  if (!granted) granted = (await Notifications.requestPermissionsAsync()).granted;
  if (!granted) {
    return { status: 'denied', message: 'Permissão de notificações negada. Ative nas configurações do aparelho.' };
  }

  try {
    const projectId =
      (Constants.expoConfig?.extra?.eas?.projectId as string | undefined) ??
      Constants.easConfig?.projectId;
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log('[push] projectId:', projectId, '| token:', token);
    const deviceId = token.replace(/[^a-zA-Z0-9]/g, '_');

    await setDoc(doc(db, `users/${uid}/devices/${deviceId}`), {
      token,
      platform: Platform.OS,
      enabled: true,
      updatedAt: Date.now(),
    });
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);

    return { status: 'ok', token };
  } catch {
    return { status: 'error', message: 'Não foi possível registrar o dispositivo para notificações.' };
  }
}

// Lê e valida o payload (data) recebido na notificação
export function parseNotificationData(raw: Record<string, unknown>): NotificationData | null {
  const { conversationId, conversationType } = raw;
  if (typeof conversationId !== 'string' || !conversationId) return null;
  if (conversationType !== 'direct' && conversationType !== 'group') return null;
  return { conversationId, conversationType };
}