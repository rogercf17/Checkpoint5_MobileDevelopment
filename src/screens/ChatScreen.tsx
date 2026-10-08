import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import type { MessageTarget } from '../types/chat';
import type { PublicUser } from '../types/user';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../hooks/useChat';
import { useGroup } from '../hooks/useGroup';
import { useMemberProfiles } from '../hooks/useMemberProfiles';
import { getPublicUser } from '../services/chatService';
import { Avatar } from '../components/Avatar';
import { ChatInput } from '../components/ChatInput';
import { ErrorMessage } from '../components/ErrorMessage';
import { Loading } from '../components/Loading';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

export default function ChatScreen({ route, navigation }: Props) {
  const { user } = useAuth();
  const { conversationId, conversationType } = route.params;
  const isGroup = conversationType === 'group';
  const { messages, loading, error, sending, sendWarning, send } = useChat({
    conversationId,
    conversationType,
    senderId: user?.uid ?? '',
  });
  const { group } = useGroup(isGroup ? conversationId : undefined);
  const memberIds = useMemo(() => group?.memberIds ?? [], [group]);
  const profiles = useMemberProfiles(memberIds);
  const [otherUser, setOtherUser] = useState<PublicUser | null>(null);
  const [mentioned, setMentioned] = useState<string[]>([]);

  useEffect(() => {
    if (isGroup || !user) return undefined;
    const otherId = conversationId.replace('direct_', '').split('_').find((id) => id !== user.uid);
    if (!otherId) return undefined;
    let active = true;
    void getPublicUser(otherId).then((p) => { if (active) setOtherUser(p); });
    return () => { active = false; };
  }, [conversationId, isGroup, user]);

  
  useEffect(() => {
    const title = isGroup ? group?.name ?? 'Grupo' : otherUser?.name ?? 'Conversa';
    const photo = isGroup ? group?.photoUrl : otherUser?.photoUrl;
    const onPress = () => {
      if (isGroup) navigation.navigate('GroupMembers', { groupId: conversationId });
      else if (otherUser) navigation.navigate('Profile', { userId: otherUser.id });
    };
    navigation.setOptions({
      headerTitle: () => (
        <Pressable style={styles.headerTitle} onPress={onPress}>
          <Avatar uri={photo} size={32} />
          <Text style={styles.headerText}>{title}</Text>
        </Pressable>
      ),
    });
  }, [conversationId, group, isGroup, navigation, otherUser]);

  const toggleMention = useCallback((uid: string) => {
    setMentioned((old) => (old.includes(uid) ? old.filter((id) => id !== uid) : [...old, uid]));
  }, []);

  const handleSend = useCallback(async (text: string) => {
    const target: MessageTarget =
      mentioned.length === 1 ? { type: 'member', memberId: mentioned[0] } : { type: 'conversation' };
    await send(text, target, mentioned);
    setMentioned([]);
  }, [mentioned, send]);

  const data = useMemo(() => [...messages].reverse(), [messages]);
  const others = useMemo(() => memberIds.filter((id) => id !== user?.uid), [memberIds, user?.uid]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
                  {isGroup && !mine ? (
                    <Text style={styles.author}>{profiles[item.senderId]?.name ?? '...'}</Text>
                  ) : null}
                  <Text style={mine ? styles.mineText : styles.message}>{item.text}</Text>
                </View>
              </View>
            );
          }}
        />
      )}
      <ErrorMessage message={error} />
      {sendWarning ? <Text style={styles.warning}>{sendWarning}</Text> : null}
      {isGroup && others.length > 0 ? (
        <View style={styles.chips}>
          <Text style={styles.chipsLabel}>Citar:</Text>
          {others.map((id) => (
            <Pressable key={id} style={[styles.chip, mentioned.includes(id) && styles.chipOn]} onPress={() => toggleMention(id)}>
              <Text style={mentioned.includes(id) ? styles.chipTextOn : styles.chipText}>{profiles[id]?.name ?? '...'}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <ChatInput disabled={sending || !user} onSend={handleSend} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7' },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerText: { fontSize: 17, fontWeight: '700' },
  list: { flex: 1 },
  listContent: { padding: 12, gap: 8 },
  row: { width: '100%' },
  mineRow: { alignItems: 'flex-end' },
  otherRow: { alignItems: 'flex-start' },
  bubble: { maxWidth: '82%', borderRadius: 16, paddingHorizontal: 13, paddingVertical: 9 },
  mineBubble: { backgroundColor: '#1E6BFF', borderBottomRightRadius: 4 },
  otherBubble: { backgroundColor: '#E4E4E4', borderBottomLeftRadius: 4 },
  message: { color: '#111' },
  mineText: { color: '#FFF' },
  author: { fontSize: 11, fontWeight: '700', marginBottom: 3, color: '#555' },
  empty: { textAlign: 'center', marginTop: 40, color: '#666' },
  warning: { paddingHorizontal: 12, paddingVertical: 6, color: '#8A5A00', backgroundColor: '#FFF3CD' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingTop: 6 },
  chipsLabel: { color: '#666', fontSize: 12 },
  chip: { borderWidth: 1, borderColor: '#BBB', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4 },
  chipOn: { backgroundColor: '#1E6BFF', borderColor: '#1E6BFF' },
  chipText: { color: '#333', fontSize: 12 },
  chipTextOn: { color: '#FFF', fontSize: 12 },
});