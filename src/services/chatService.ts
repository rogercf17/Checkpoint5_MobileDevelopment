import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import {
  limitToLast,
  onValue,
  orderByChild,
  push,
  query as rtdbQuery,
  ref,
  set,
} from 'firebase/database';
import { auth, db, rtdb } from './firebase';
import { directConversationId } from '../utils/conversationId';
import type { ChatMessage, ConversationType, MessageTarget } from '../types/chat';
import type { ChatGroup } from '../types/group';
import type { PublicUser } from '../types/user';
import { API_URL } from '../config';

export type DirectConversation = {
  id: string;
  participantIds: string[];
  createdAt: number;
  otherUser: PublicUser | null;
  conversationType: 'direct';
};

export type ConversationItem = DirectConversation | (ChatGroup & { conversationType: 'group' });

export async function ensureDirectConversation(me: string, other: string): Promise<string> {
  if (me === other) throw new Error('Você não pode conversar consigo mesmo.');

  const [a, b] = [me, other].sort();
  const id = directConversationId(me, other);
  const conversationRef = doc(db, 'directConversations', id);
  const snap = await getDoc(conversationRef);

  if (!snap.exists()) {
    await setDoc(conversationRef, {
      participantIds: [a, b],
      createdAt: Date.now(),
    });
  }

  return id;
}

export async function getPublicUser(uid: string): Promise<PublicUser | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<PublicUser, 'id'>) };
}

export async function getUsers(): Promise<PublicUser[]> {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map((item) => ({
    id: item.id,
    ...(item.data() as Omit<PublicUser, 'id'>),
  }));
}

export function listenConversations(
  uid: string,
  onData: (items: ConversationItem[]) => void,
  onError: (error: Error) => void,
): () => void {
  let directItems: DirectConversation[] = [];
  let groupItems: (ChatGroup & { conversationType: 'group' })[] = [];

  const emit = () => {
    const all = [...directItems, ...groupItems].sort((a, b) => b.createdAt - a.createdAt);
    onData(all);
  };

  const directQuery = query(
    collection(db, 'directConversations'),
    where('participantIds', 'array-contains', uid),
  );
  const groupQuery = query(collection(db, 'groups'), where('memberIds', 'array-contains', uid));

  let directUnsubscribe: (() => void) | undefined;
  let groupUnsubscribe: (() => void) | undefined;
  let cancelled = false;

  directUnsubscribe = onSnapshot(
    directQuery,
    async (snap) => {
      try {
        const mapped = await Promise.all(
          snap.docs.map(async (item) => {
            const data = item.data() as { participantIds: string[]; createdAt: number };
            const otherId = data.participantIds.find((id) => id !== uid) ?? '';
            const otherUser = otherId ? await getPublicUser(otherId) : null;
            return {
              id: item.id,
              participantIds: data.participantIds,
              createdAt: data.createdAt,
              otherUser,
              conversationType: 'direct' as const,
            };
          }),
        );
        if (!cancelled) {
          directItems = mapped;
          emit();
        }
      } catch (error) {
        onError(error instanceof Error ? error : new Error('Erro ao carregar conversas.'));
      }
    },
    (error) => onError(error),
  );

  groupUnsubscribe = onSnapshot(
    groupQuery,
    (snap) => {
      groupItems = snap.docs.map((item) => ({
        id: item.id,
        ...(item.data() as Omit<ChatGroup, 'id'>),
        conversationType: 'group' as const,
      }));
      if (!cancelled) emit();
    },
    (error) => onError(error),
  );

  return () => {
    cancelled = true;
    directUnsubscribe?.();
    groupUnsubscribe?.();
  };
}

export function listenMessages(
  cid: string,
  onData: (messages: ChatMessage[]) => void,
  onError: (error: Error) => void,
): () => void {
  const messagesQuery = rtdbQuery(
    ref(rtdb, `messages/${cid}`),
    orderByChild('createdAt'),
    limitToLast(100),
  );

  return onValue(
    messagesQuery,
    (snapshot) => {
      const list: ChatMessage[] = [];
      snapshot.forEach((child) => {
        const value = child.val() as Omit<ChatMessage, 'id' | 'conversationId'>;
        list.push({
          ...value,
          id: child.key ?? '',
          conversationId: cid,
          mentionedUserIds: value.mentionedUserIds ?? [],
        });
      });
      onData(list);
    },
    (error) => onError(error),
  );
}

export async function sendMessage(params: {
  conversationId: string;
  conversationType: ConversationType;
  senderId: string;
  text: string;
  target: MessageTarget;
  mentionedUserIds: string[];
}): Promise<string> {
  const text = params.text.trim();
  if (!text) throw new Error('Digite uma mensagem.');

  const messageRef = push(ref(rtdb, `messages/${params.conversationId}`));
  const messageId = messageRef.key;
  if (!messageId) throw new Error('Não foi possível criar a mensagem.');

  await set(messageRef, {
    conversationType: params.conversationType,
    senderId: params.senderId,
    text,
    target: params.target,
    mentionedUserIds: params.mentionedUserIds,
    createdAt: Date.now(),
  });

  return messageId;
}

export async function notifyMessage(conversationId: string, messageId: string): Promise<void> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Sessão expirada. Entre novamente.');

  const response = await fetch(`${API_URL}/notifications/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ conversationId, messageId }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? 'Não foi possível enviar a notificação.');
  }
}
