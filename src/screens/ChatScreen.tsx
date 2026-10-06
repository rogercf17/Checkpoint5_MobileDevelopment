import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../hooks/useChat';
import { ChatInput } from '../components/ChatInput';
import { Loading } from '../components/Loading';
import { ErrorMessage } from '../components/ErrorMessage';
import { getPublicUser } from '../services/chatService';
import type { PublicUser } from '../types/user';

 type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

export default function ChatScreen({ route, navigation }: Props) {
  const { user } = useAuth();
  const { conversationId, conversationType } = route.params;
  const { messages, loading, error, sending, sendWarning, send } = useChat({
    conversationId,
    conversationType,
    senderId: user?.uid ?? '',
  });
  const [otherUser, setOtherUser] = useState<PublicUser | null>(null);

  useEffect(() => {
    if (conversationType !== 'direct' || !user) return undefined;
    const ids = conversationId.replace('direct_', '').split('_');
    const otherId = ids.find((id) => id !== user.uid);
    if (!otherId) return undefined;
    let active = true;
    void getPublicUser(otherId).then((profile) => {
      if (active) setOtherUser(profile);
    });
    return () => { active = false; };
  }, [conversationId, conversationType, user]);

  useEffect(() => {
    navigation.setOptions({ title: conversationType === 'group' ? 'Grupo' : otherUser?.name ?? 'Conversa' });
  }, [conversationType, navigation, otherUser?.name]);

  const data = useMemo(() => [...messages].reverse(), [messages]);
  const handleSend = useCallback(async (text: string) => {
    await send(text);
  }, [send]);

  return (
    <View style={styles.container}>
      {loading ? <Loading /> : (
        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={data}
          inverted
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text style={styles.empty}>Nenhuma mensagem ainda.</Text>}
          renderItem={({ item }) => {
            const mine = item.senderId === user?.uid;
            return (
              <View style={[styles.row, mine ? styles.mineRow : styles.otherRow]}>
                <View style={[styles.bubble, mine ? styles.mineBubble : styles.otherBubble]}>
                  {conversationType === 'group' && !mine ? <Text style={styles.author}>{item.senderId}</Text> : null}
                  <Text style={styles.message}>{item.text}</Text>
                </View>
              </View>
            );
          }}
        />
      )}
      <ErrorMessage message={error} />
      {sendWarning ? <Text style={styles.warning}>{sendWarning}</Text> : null}
      <ChatInput disabled={sending || !user} onSend={handleSend} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7' },
  list: { flex: 1 },
  listContent: { padding: 12, gap: 8 },
  row: { width: '100%' },
  mineRow: { alignItems: 'flex-end' },
  otherRow: { alignItems: 'flex-start' },
  bubble: { maxWidth: '82%', borderRadius: 16, paddingHorizontal: 13, paddingVertical: 9 },
  mineBubble: { backgroundColor: '#1E6BFF', borderBottomRightRadius: 4 },
  otherBubble: { backgroundColor: '#E4E4E4', borderBottomLeftRadius: 4 },
  message: { color: '#111' },
  author: { fontSize: 11, fontWeight: '700', marginBottom: 3, color: '#555' },
  empty: { textAlign: 'center', marginTop: 40, color: '#666' },
  warning: { paddingHorizontal: 12, paddingVertical: 6, color: '#8A5A00', backgroundColor: '#FFF3CD' },
});
