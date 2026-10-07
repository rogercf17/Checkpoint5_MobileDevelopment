import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { apiFetch } from './apiClient';
import { getErrorMessage } from '../utils/firebaseErros';
import type { ChatGroup, NotificationPolicy } from '../types/group';

export type CreateGroupInput = {
  name: string;
  photoUrl: string;
  memberLimit: number;
  notificationPolicy: NotificationPolicy;
  memberIds: string[]; 
};

export type UpdateGroupInput = {
  name?: string;
  photoUrl?: string;
  memberLimit?: number;
  notificationPolicy?: NotificationPolicy;
};

export const createGroup = (input: CreateGroupInput) =>
  apiFetch<{ id: string; memberIds: string[] }>('/groups', { method: 'POST', body: input });

export const updateGroup = (groupId: string, input: UpdateGroupInput) =>
  apiFetch<{ ok: boolean }>(`/groups/${groupId}`, { method: 'PATCH', body: input });

export const addMember = (groupId: string, userId: string) =>
  apiFetch<{ memberIds: string[] }>(`/groups/${groupId}/members`, { method: 'POST', body: { userId } });

export const removeMember = (groupId: string, userId: string) =>
  apiFetch<{ memberIds: string[] }>(`/groups/${groupId}/members/${userId}`, { method: 'DELETE' });

export function listenGroup(
  groupId: string,
  onData: (group: ChatGroup | null) => void,
  onError: (error: Error) => void,
): () => void {
  return onSnapshot(
    doc(db, 'groups', groupId),
    (snap) => {
      onData(snap.exists() ? { id: snap.id, ...(snap.data() as Omit<ChatGroup, 'id'>) } : null);
    },
    (err) => {
      onError(
        new Error(err.code === 'permission-denied' ? 'Você não tem acesso a este grupo.' : getErrorMessage(err)),
      );
    },
  );
}