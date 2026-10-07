import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from './Avatar';
import type { PublicUser } from '../types/user';

type Props = {
  user: PublicUser;
  isOwner: boolean;
  canRemove: boolean;
  busy: boolean;
  onPress: (uid: string) => void;
  onRemove: (uid: string) => void;
};

export const GroupMemberItem = memo(function GroupMemberItem({
  user, isOwner, canRemove, busy, onPress, onRemove,
}: Props) {
  return (
    <View style={styles.row}>
      <Pressable style={styles.main} onPress={() => onPress(user.id)}>
        <Avatar uri={user.photoUrl} />
        <View style={styles.info}>
          <Text style={styles.name}>{user.name}</Text>
          {isOwner ? <Text style={styles.badge}>Proprietário</Text> : null}
        </View>
      </Pressable>
      {canRemove ? (
        <Pressable onPress={() => onRemove(user.id)} disabled={busy}>
          <Text style={styles.remove}>{busy ? '...' : 'Remover'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700' },
  badge: { color: '#1E6BFF', fontSize: 12, fontWeight: '700', marginTop: 2 },
  remove: { color: '#C62828', fontWeight: '700' },
});