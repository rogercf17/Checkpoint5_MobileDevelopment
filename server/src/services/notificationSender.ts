import type { DocumentReference } from 'firebase-admin/firestore';
import { firestore } from './firebaseAdmin';

type Ticket = { status: 'ok' | 'error'; details?: { error?: string } };

export async function sendPush(
  recipients: string[],
  title: string,
  data: { conversationId: string; conversationType: string },
): Promise<number> {
  const devices: { ref: DocumentReference; token: string }[] = [];
  for (const uid of recipients) {
    const snap = await firestore.collection(`users/${uid}/devices`).where('enabled', '==', true).get();
    snap.forEach((d) => devices.push({ ref: d.ref, token: d.get('token') as string }));
  }

  let sent = 0;
  for (let i = 0; i < devices.length; i += 100) { // limite de 100 por requisição
    const chunk = devices.slice(i, i + 100);
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(
        chunk.map((d) => ({
          to: d.token,
          title,
          body: 'Nova mensagem', // sem conteúdo sensível
          data,
          sound: 'default',
          channelId: 'default',
        })),
      ),
    });
    const json = (await res.json()) as { data?: Ticket[] };
    (json.data ?? []).forEach((t, k) => {
      if (t.status === 'ok') sent += 1;
      else if (t.details?.error === 'DeviceNotRegistered') void chunk[k].ref.update({ enabled: false });
    });
  }
  return sent;
}
