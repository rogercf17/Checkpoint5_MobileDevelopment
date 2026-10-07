import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { parseNotificationData, registerDevice, type RegisterResult } from '../services/notificationService';
import { navigationRef } from '../utils/navigationRef';

// uid: usuário logado (undefined = deslogado). navReady: NavigationContainer pronto.
export function useNotifications(uid: string | undefined, navReady: boolean) {
  const [result, setResult] = useState<RegisterResult | null>(null);
  const response = Notifications.useLastNotificationResponse();
  const handledId = useRef<string | null>(null);

  // registra o token ao logar
  useEffect(() => {
    if (!uid) {
      setResult(null);
      return;
    }
    let active = true;
    void registerDevice(uid).then((r) => {
      if (active) setResult(r);
    });
    return () => {
      active = false;
    };
  }, [uid]);

  // toque na notificação (app em segundo plano ou fechado) abre a conversa
  useEffect(() => {
    if (!uid || !navReady || !response) return;
    const id = response.notification.request.identifier;
    if (handledId.current === id) return;
    const data = response.notification.request.content.data;
    if (!data) return;
    const parsedData = parseNotificationData(data);
    if (!parsedData) return;
    handledId.current = id;
    navigationRef.navigate('Chat', parsedData);
  }, [uid, navReady, response]);

  const warning = result && result.status !== 'ok' ? result.message : null;
  return { warning };
}