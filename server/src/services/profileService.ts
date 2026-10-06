import { firestore, HttpError } from './firebaseAdmin';

export type FullProfile = {
  id: string;
  name: string;
  photoUrl: string;
  email: string | null;
  phone: string | null;
  birthDate: string | null;
};

const directId = (a: string, b: string): string => `direct_${[a, b].sort().join('_')}`;

async function shareConversation(me: string, target: string): Promise<boolean> {
  if (me === target) return true;

  const direct = await firestore.collection('directConversations').doc(directId(me, target)).get();
  if (direct.exists) return true;

  const groups = await firestore.collection('groups').where('memberIds', 'array-contains', me).get();
  return groups.docs.some((g) => ((g.data().memberIds ?? []) as string[]).includes(target));
}

export async function getProfile(me: string, target: string): Promise<FullProfile> {
  if (!(await shareConversation(me, target))) {
    throw new HttpError(403, 'Você não tem conversa nem grupo em comum com este usuário');
  }
  const [pub, priv] = await Promise.all([
    firestore.collection('users').doc(target).get(),
    firestore.collection('userPrivate').doc(target).get(),
  ]);
  if (!pub.exists) throw new HttpError(404, 'Usuário não encontrado');
  const p = pub.data() as { name?: string; photoUrl?: string };
  const q = (priv.data() ?? {}) as { email?: string; phone?: string; birthDate?: string };
  return {
    id: target,
    name: p.name ?? '',
    photoUrl: p.photoUrl ?? '',
    email: q.email ?? null,
    phone: q.phone ?? null,
    birthDate: q.birthDate ?? null,
  };
}
