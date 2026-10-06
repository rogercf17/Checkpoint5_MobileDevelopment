import { firestore, rtdb, HttpError } from './firebaseAdmin';

type RtdbMessage = {
  senderId: string;
  conversationType: 'direct' | 'group';
  target?: { type: 'conversation' } | { type: 'member'; memberId: string };
  mentionedUserIds?: string[];
};

export type Resolved = { recipients: string[]; title: string };

// Os destinatários são sempre calculados aqui, nunca vindos do app.
export async function resolveRecipients(uid: string, cid: string, mid: string): Promise<Resolved> {
  const snap = await rtdb.ref(`messages/${cid}/${mid}`).get();
  if (!snap.exists()) throw new HttpError(404, 'Mensagem não encontrada');
  const msg = snap.val() as RtdbMessage;
  if (msg.senderId !== uid) throw new HttpError(403, 'Remetente não confere');
  if (cid.startsWith('direct_') !== (msg.conversationType === 'direct')) {
    throw new HttpError(400, 'Tipo de conversa inconsistente');
  }

  const me = await firestore.collection('users').doc(uid).get();
  const senderName = (me.data()?.name as string | undefined) ?? 'Alguém';

  if (msg.conversationType === 'direct') {
    const d = await firestore.collection('directConversations').doc(cid).get();
    const ids = (d.data()?.participantIds ?? []) as string[];
    if (!ids.includes(uid)) throw new HttpError(403, 'Sem acesso à conversa');
    return { recipients: ids.filter((id) => id !== uid), title: senderName };
  }

  const g = await firestore.collection('groups').doc(cid).get();
  if (!g.exists) throw new HttpError(404, 'Grupo não encontrado');
  const group = g.data() as { name: string; memberIds: string[]; notificationPolicy: string };
  if (!group.memberIds.includes(uid)) throw new HttpError(403, 'Você não é integrante');

  const mentioned = new Set<string>([
    ...(msg.mentionedUserIds ?? []),
    ...(msg.target?.type === 'member' ? [msg.target.memberId] : []),
  ]);
  let ids: string[] = []; // direct_messages_only e disabled não notificam mensagens de grupo
  if (group.notificationPolicy === 'all_group_messages') ids = group.memberIds;
  if (group.notificationPolicy === 'mentioned_members') ids = group.memberIds.filter((m) => mentioned.has(m));
  return { recipients: ids.filter((id) => id !== uid), title: group.name };
}
