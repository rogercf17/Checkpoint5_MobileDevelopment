import { firestore, rtdb, HttpError } from './firebaseAdmin';

export type NotificationPolicy =
  | 'all_group_messages'
  | 'mentioned_members'
  | 'direct_messages_only'
  | 'disabled';

const POLICIES: NotificationPolicy[] = [
  'all_group_messages',
  'mentioned_members',
  'direct_messages_only',
  'disabled',
];

type GroupDoc = {
  name: string;
  photoUrl: string;
  ownerId: string;
  memberIds: string[];
  memberLimit: number;
  notificationPolicy: NotificationPolicy;
  createdAt: number;
  updatedAt: number;
};

export type CreateGroupInput = {
  name?: unknown;
  photoUrl?: unknown;
  memberLimit?: unknown;
  notificationPolicy?: unknown;
  memberIds?: unknown;
};

export type UpdateGroupInput = {
  name?: unknown;
  photoUrl?: unknown;
  memberLimit?: unknown;
  notificationPolicy?: unknown;
};

function parseName(v: unknown): string {
  if (typeof v !== 'string' || !v.trim()) throw new HttpError(400, 'Informe o nome do grupo');
  if (v.trim().length > 60) throw new HttpError(400, 'O nome do grupo deve ter até 60 caracteres');
  return v.trim();
}

function parsePhoto(v: unknown): string {
  if (v === undefined || v === null || v === '') return '';
  if (typeof v !== 'string' || !/^https:\/\//.test(v)) throw new HttpError(400, 'URL da foto inválida');
  return v;
}

function parseLimit(v: unknown): number {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 2) {
    throw new HttpError(400, 'O limite deve ser um número inteiro maior ou igual a 2');
  }
  return v;
}

function parsePolicy(v: unknown): NotificationPolicy {
  if (typeof v !== 'string' || !POLICIES.includes(v as NotificationPolicy)) {
    throw new HttpError(400, 'Política de notificação inválida');
  }
  return v as NotificationPolicy;
}

// Espelho de membros no Realtime Database: as regras do RTDB não enxergam o Firestore.
export async function syncMembers(groupId: string, members: string[]): Promise<void> {
  const map: Record<string, true> = {};
  members.forEach((m) => {
    map[m] = true;
  });
  await rtdb.ref(`groupMembers/${groupId}`).set(map);
}

export async function createGroup(
  callerUid: string,
  input: CreateGroupInput,
): Promise<{ id: string; memberIds: string[] }> {
  const name = parseName(input.name);
  const photoUrl = parsePhoto(input.photoUrl);
  const memberLimit = parseLimit(input.memberLimit);
  const notificationPolicy = parsePolicy(input.notificationPolicy ?? 'all_group_messages');

  if (!Array.isArray(input.memberIds) || input.memberIds.some((m) => typeof m !== 'string')) {
    throw new HttpError(400, 'Lista de integrantes inválida');
  }
  // O dono entra automaticamente; remove duplicados.
  const others = [...new Set((input.memberIds as string[]).filter((m) => m !== callerUid))];
  const memberIds = [callerUid, ...others];

  if (memberIds.length < 2) throw new HttpError(400, 'O grupo precisa ter pelo menos 2 integrantes');
  if (memberIds.length > memberLimit) throw new HttpError(409, 'Número de integrantes maior que o limite');

  // Todos os integrantes precisam ser usuários cadastrados.
  const refs = memberIds.map((id) => firestore.collection('users').doc(id));
  const snaps = await firestore.getAll(...refs);
  if (snaps.some((s) => !s.exists)) throw new HttpError(404, 'Um dos usuários selecionados não existe');

  const now = Date.now();
  const gRef = firestore.collection('groups').doc();
  const data: GroupDoc = {
    name,
    photoUrl,
    ownerId: callerUid,
    memberIds,
    memberLimit,
    notificationPolicy,
    createdAt: now,
    updatedAt: now,
  };
  await gRef.create(data);
  await syncMembers(gRef.id, memberIds);
  return { id: gRef.id, memberIds };
}

export async function updateGroup(groupId: string, callerUid: string, input: UpdateGroupInput): Promise<void> {
  const patch: Partial<GroupDoc> = {};
  if (input.name !== undefined) patch.name = parseName(input.name);
  if (input.photoUrl !== undefined) patch.photoUrl = parsePhoto(input.photoUrl);
  if (input.notificationPolicy !== undefined) patch.notificationPolicy = parsePolicy(input.notificationPolicy);
  const newLimit = input.memberLimit !== undefined ? parseLimit(input.memberLimit) : undefined;
  if (Object.keys(patch).length === 0 && newLimit === undefined) {
    throw new HttpError(400, 'Nada para atualizar');
  }

  const gRef = firestore.collection('groups').doc(groupId);
  await firestore.runTransaction(async (tx) => {
    const g = await tx.get(gRef);
    if (!g.exists) throw new HttpError(404, 'Grupo não encontrado');
    const data = g.data() as GroupDoc;
    if (data.ownerId !== callerUid) throw new HttpError(403, 'Apenas o proprietário pode gerenciar');
    if (newLimit !== undefined) {
      if (newLimit < data.memberIds.length) {
        throw new HttpError(409, 'O limite não pode ser menor que o número atual de integrantes');
      }
      patch.memberLimit = newLimit;
    }
    tx.update(gRef, { ...patch, updatedAt: Date.now() });
  });
}

// Peça-chave da concorrência: a transação do Firestore é reexecutada se outra gravação
// alterar o documento no meio. Duas chamadas simultâneas com 1 vaga = 1 sucesso e 1 "Grupo sem vagas".
export async function addMember(groupId: string, callerUid: string, userId: string): Promise<string[]> {
  const gRef = firestore.collection('groups').doc(groupId);
  const uRef = firestore.collection('users').doc(userId);
  const members = await firestore.runTransaction(async (tx) => {
    const [g, u] = await Promise.all([tx.get(gRef), tx.get(uRef)]);
    if (!g.exists) throw new HttpError(404, 'Grupo não encontrado');
    if (!u.exists) throw new HttpError(404, 'Usuário não encontrado');
    const data = g.data() as GroupDoc;
    if (data.ownerId !== callerUid) throw new HttpError(403, 'Apenas o proprietário pode gerenciar');
    if (data.memberIds.includes(userId)) throw new HttpError(409, 'Usuário já é integrante');
    if (data.memberIds.length >= data.memberLimit) throw new HttpError(409, 'Grupo sem vagas');
    const next = [...data.memberIds, userId];
    tx.update(gRef, { memberIds: next, updatedAt: Date.now() });
    return next;
  });
  await syncMembers(groupId, members);
  return members;
}

export async function removeMember(groupId: string, callerUid: string, userId: string): Promise<string[]> {
  const gRef = firestore.collection('groups').doc(groupId);
  const members = await firestore.runTransaction(async (tx) => {
    const g = await tx.get(gRef);
    if (!g.exists) throw new HttpError(404, 'Grupo não encontrado');
    const data = g.data() as GroupDoc;
    if (data.ownerId !== callerUid) throw new HttpError(403, 'Apenas o proprietário pode gerenciar');
    if (userId === data.ownerId) throw new HttpError(400, 'O proprietário não pode ser removido');
    if (!data.memberIds.includes(userId)) throw new HttpError(404, 'Usuário não é integrante');
    if (data.memberIds.length <= 2) throw new HttpError(409, 'O grupo precisa ter pelo menos 2 integrantes');
    const next = data.memberIds.filter((m) => m !== userId);
    tx.update(gRef, { memberIds: next, updatedAt: Date.now() });
    return next;
  });
  await syncMembers(groupId, members);
  return members;
}
