import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import type { PublicUser } from '../types/user';
import { ensureDirectConversation, getUsers } from '../services/chatService';
import { Avatar } from '../components/Avatar';
import { ErrorMessage } from '../components/ErrorMessage';
import { Loading } from '../components/Loading';
import { useAuth } from '../contexts/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Users'>;

export default function UsersScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [opening, setOpening] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setUsers(await getUsers());
    } catch {
      setError('Não foi possível carregar os usuários.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users
      .filter((item) => item.id !== user?.uid)
      .filter((item) => !term || item.name.toLowerCase().includes(term));
  }, [search, user?.uid, users]);

  const openChat = useCallback(async (other: PublicUser) => {
    if (!user) return;
    setOpening(other.id);
    setError(null);
    try {
      const conversationId = await ensureDirectConversation(user.uid, other.id);
      navigation.navigate('Chat', { conversationId, conversationType: 'direct' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível abrir a conversa.');
    } finally {
      setOpening(null);
    }
  }, [navigation, user]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Buscar usuário..."
        value={search}
        onChangeText={setSearch}
      />
      <ErrorMessage message={error} />
      {loading ? <Loading /> : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text style={styles.empty}>Nenhum usuário encontrado.</Text>}
          renderItem={({ item }) => (
            <Pressable style={styles.item} onPress={() => void openChat(item)} disabled={opening !== null}>
              <Avatar uri={item.photoUrl} />
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.action}>{opening === item.id ? 'Abrindo conversa...' : 'Toque para conversar'}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  search: { borderWidth: 1, borderColor: '#CCC', borderRadius: 10, padding: 12, marginBottom: 12 },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  info: { flex: 1 },
  name: { fontSize: 17, fontWeight: '700' },
  action: { color: '#666', marginTop: 3 },
  empty: { textAlign: 'center', marginTop: 40, color: '#666' },
});
