import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import type { PublicUser } from '../types/user';
import { useAuth } from '../contexts/AuthContext';
import { useGroup } from '../hooks/useGroup';
import { useMemberProfiles } from '../hooks/useMemberProfiles';
import { getUsers } from '../services/chatService';
import { addMember, removeMember } from '../services/groupService';
import { getErrorMessage } from '../utils/firebaseErros';
import { policyLabel } from '../utils/policies';
import { Avatar } from '../components/Avatar';
import { ErrorMessage } from '../components/ErrorMessage';
import { GroupMemberItem } from '../components/GroupMemberItem';
import { Loading } from '../components/Loading';

type Props = NativeStackScreenProps<RootStackParamList, 'GroupMembers'>;

export default function GroupMembersScreen({ route, navigation }: Props) {
  const { groupId } = route.params;
  const { user } = useAuth();
  const { group, loading, error } = useGroup(groupId);
  const memberIds = useMemo(() => group?.memberIds ?? [], [group]);
  const profiles = useMemberProfiles(memberIds);
  const [allUsers, setAllUsers] = useState<PublicUser[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const isOwner = Boolean(group && user && group.ownerId === user.uid);

  useEffect(() => {
    navigation.setOptions({ title: 'Integrantes' });
  }, [navigation]);

  // só o proprietário precisa da lista de usuários (para adicionar)
  useEffect(() => {
    if (!isOwner) return;
    getUsers().then(setAllUsers).catch(() => setActionError('Não foi possível carregar os usuários.'));
  }, [isOwner]);

  const members = useMemo<PublicUser[]>(() => {
    const list = memberIds.map(
      (id) => profiles[id] ?? { id, name: 'Carregando...', photoUrl: '', createdAt: 0 },
    );
    return list.sort((a, b) => Number(b.id === group?.ownerId) - Number(a.id === group?.ownerId));
  }, [memberIds, profiles, group?.ownerId]);

  const candidates = useMemo(
    () => allUsers.filter((u) => !memberIds.includes(u.id)),
    [allUsers, memberIds],
  );
  const slots = group ? group.memberLimit - group.memberIds.length : 0;

  const doRemove = useCallback(async (uid: string) => {
    setBusy(uid);
    setActionError(null);
    try {
      await removeMember(groupId, uid);
    } catch (e) {
      setActionError(getErrorMessage(e));
    } finally {
      setBusy(null);
    }
  }, [groupId]);

  const handleRemove = useCallback((uid: string) => {
    Alert.alert('Remover integrante', 'Deseja remover este integrante do grupo?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => { void doRemove(uid); } },
    ]);
  }, [doRemove]);

  const handleAdd = useCallback(async (uid: string) => {
    setBusy(uid);
    setActionError(null);
    try {
      await addMember(groupId, uid);
    } catch (e) {
      setActionError(getErrorMessage(e)); // ex.: "Grupo sem vagas"
    } finally {
      setBusy(null);
    }
  }, [groupId]);

  const openProfile = useCallback((uid: string) => {
    navigation.navigate('Profile', { userId: uid });
  }, [navigation]);

  if (loading) return <Loading message="Carregando grupo..." />;
  if (error || !group) return <ErrorMessage message={error ?? 'Grupo não encontrado.'} />;

  const header = (
    <View style={styles.header}>
      <Avatar uri={group.photoUrl} size={80} />
      <Text style={styles.groupName}>{group.name}</Text>
      <Text style={styles.meta}>
        {group.memberIds.length}/{group.memberLimit} integrantes - {slots} {slots === 1 ? 'vaga' : 'vagas'}
      </Text>
      <Text style={styles.meta}>Notificações: {policyLabel(group.notificationPolicy)}</Text>
      {isOwner ? <Button title="Editar grupo" onPress={() => navigation.navigate('GroupForm', { groupId })} /> : null}
      <ErrorMessage message={actionError} />
    </View>
  );

  const footer = isOwner ? (
    <View style={styles.footer}>
      <Text style={styles.sectionTitle}>Adicionar integrante</Text>
      {slots <= 0 ? <Text style={styles.noSlots}>Grupo sem vagas. Aumente o limite para adicionar.</Text> : null}
      {candidates.length === 0 ? <Text style={styles.meta}>Nenhum outro usuário disponível.</Text> : null}
      {candidates.map((u) => (
        <View key={u.id} style={styles.candidate}>
          <Avatar uri={u.photoUrl} size={40} />
          <Text style={styles.candidateName}>{u.name}</Text>
          <Pressable onPress={() => void handleAdd(u.id)} disabled={slots <= 0 || busy !== null}>
            <Text style={[styles.add, (slots <= 0 || busy !== null) && styles.addOff]}>
              {busy === u.id ? '...' : 'Adicionar'}
            </Text>
          </Pressable>
        </View>
      ))}
    </View>
  ) : null;

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={members}
      keyExtractor={(m) => m.id}
      ListHeaderComponent={header}
      ListFooterComponent={footer}
      renderItem={({ item }) => (
        <GroupMemberItem
          user={item}
          isOwner={item.id === group.ownerId}
          canRemove={isOwner && item.id !== group.ownerId}
          busy={busy === item.id}
          onPress={openProfile}
          onRemove={handleRemove}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  header: { alignItems: 'center', gap: 6, marginBottom: 12 },
  groupName: { fontSize: 22, fontWeight: '800' },
  meta: { color: '#666' },
  footer: { marginTop: 16, gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  noSlots: { color: '#C62828', fontWeight: '700' },
  candidate: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  candidateName: { flex: 1, fontSize: 16 },
  add: { color: '#1E6BFF', fontWeight: '700' },
  addOff: { opacity: 0.4 },
});