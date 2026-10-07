import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';
import { listenConversations, type ConversationItem } from '../services/chatService';
import { Avatar } from '../components/Avatar';
import { ErrorMessage } from '../components/ErrorMessage';
import { Loading } from '../components/Loading';

type Props = NativeStackScreenProps<RootStackParamList, 'Conversations'>;

export default function ConversationsScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const [items, setItems] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return undefined;
    setLoading(true);
    return listenConversations(
      user.uid,
      (next) => { setItems(next); setLoading(false); },
      (nextError) => { setError(nextError.message); setLoading(false); },
    );
  }, [user]);

  const open = useCallback((item: ConversationItem) => {
    navigation.navigate('Chat', { conversationId: item.id, conversationType: item.conversationType });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Conversas</Text>
        <View style={styles.actions}>
          <Pressable onPress={() => navigation.navigate('Users')}><Text style={styles.link}>Usuários</Text></Pressable>
          <Pressable onPress={() => navigation.navigate('GroupForm')}><Text style={styles.link}>Novo grupo</Text></Pressable>
          <Pressable onPress={() => void logout()}><Text style={styles.logout}>Sair</Text></Pressable>
        </View>
      </View>
      <ErrorMessage message={error} />
      {loading ? <Loading /> : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text style={styles.empty}>Nenhuma conversa ainda. Toque em Usuários para iniciar uma ou crie um grupo.</Text>}
          renderItem={({ item }) => {
            const isGroup = item.conversationType === 'group';
            const title = isGroup ? item.name : item.otherUser?.name ?? 'Usuário';
            const photo = isGroup ? item.photoUrl : item.otherUser?.photoUrl;
            return (
              <Pressable style={styles.item} onPress={() => open(item)}>
                <Avatar uri={photo} />
                <View style={styles.info}>
                  <Text style={styles.name}>{title}</Text>
                  <Text style={styles.type}>{isGroup ? 'Grupo' : 'Individual'}</Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { marginBottom: 12, gap: 8 },
  title: { fontSize: 26, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 14 },
  link: { color: '#1E6BFF', fontWeight: '700' },
  logout: { color: '#C62828', fontWeight: '700' },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  info: { flex: 1 },
  name: { fontSize: 17, fontWeight: '700' },
  type: { color: '#666', marginTop: 3 },
  empty: { textAlign: 'center', color: '#666', marginTop: 50, lineHeight: 22 },
});