import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import type { NotificationPolicy } from '../types/group';
import type { PublicUser } from '../types/user';
import { useAuth } from '../contexts/AuthContext';
import { useGroup } from '../hooks/useGroup';
import { getUsers } from '../services/chatService';
import { createGroup, updateGroup } from '../services/groupService';
import { pickImage, uploadImage } from '../services/imageService';
import { getErrorMessage } from '../utils/firebaseErros';
import { POLICY_OPTIONS } from '../utils/policies';
import { Avatar } from '../components/Avatar';
import { ErrorMessage } from '../components/ErrorMessage';
import { Loading } from '../components/Loading';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<RootStackParamList, 'GroupForm'>;

export default function GroupFormScreen({ route, navigation }: Props) {
  const groupId = route.params?.groupId;
  const editing = Boolean(groupId);
  const { user } = useAuth();
  const { group, loading: groupLoading, error: groupError } = useGroup(groupId);

  const [name, setName] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [limitText, setLimitText] = useState('10');
  const [policy, setPolicy] = useState<NotificationPolicy>('all_group_messages');
  const [selected, setSelected] = useState<string[]>([]);
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);

  const insets = useSafeAreaInsets();

  useEffect(() => {
    navigation.setOptions({ title: editing ? 'Editar grupo' : 'Novo grupo' });
  }, [editing, navigation]);

  // edição: preenche o formulário uma única vez
  useEffect(() => {
    if (!group || initialized.current) return;
    initialized.current = true;
    setName(group.name);
    setPhotoUrl(group.photoUrl);
    setLimitText(String(group.memberLimit));
    setPolicy(group.notificationPolicy);
  }, [group]);

  // criação: lista de usuários para selecionar
  useEffect(() => {
    if (editing) return;
    getUsers().then(setUsers).catch(() => setError('Não foi possível carregar os usuários.'));
  }, [editing]);

  const limit = /^\d+$/.test(limitText) ? Number(limitText) : Number.NaN;
  const total = editing ? group?.memberIds.length ?? 0 : selected.length + 1; // +1 = dono
  const slots = Number.isNaN(limit) ? 0 : limit - total;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users
      .filter((u) => u.id !== user?.uid)
      .filter((u) => !term || u.name.toLowerCase().includes(term));
  }, [search, user?.uid, users]);

  const toggle = useCallback((uid: string) => {
    setSelected((old) => (old.includes(uid) ? old.filter((id) => id !== uid) : [...old, uid]));
  }, []);

  const handlePhoto = useCallback(async () => {
    try {
      const uri = await pickImage();
      if (uri) setPhotoUri(uri);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }, []);

  const validate = useCallback((): string | null => {
    if (!name.trim()) return 'Informe o nome do grupo.';
    if (Number.isNaN(limit) || limit < 2) return 'O limite deve ser um número inteiro maior ou igual a 2.';
    if (editing) {
      const current = group?.memberIds.length ?? 0;
      if (limit < current) return `O limite não pode ser menor que o número atual de integrantes (${current}).`;
    } else {
      if (selected.length < 1) return 'Selecione pelo menos 1 integrante.';
      if (selected.length + 1 > limit) return 'Integrantes (incluindo você) acima do limite do grupo.';
    }
    return null;
  }, [name, limit, editing, group, selected]);

  const handleSave = useCallback(async () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const finalPhoto = photoUri ? await uploadImage(photoUri) : photoUrl;
      if (editing && groupId) {
        await updateGroup(groupId, { name: name.trim(), photoUrl: finalPhoto, memberLimit: limit, notificationPolicy: policy });
        navigation.goBack();
      } else {
        const out = await createGroup({ name: name.trim(), photoUrl: finalPhoto, memberLimit: limit, notificationPolicy: policy, memberIds: selected });
        navigation.replace('Chat', { conversationId: out.id, conversationType: 'group' });
      }
    } catch (e) {
      setError(getErrorMessage(e)); // ex.: "Grupo sem vagas"
    } finally {
      setSaving(false);
    }
  }, [validate, photoUri, photoUrl, editing, groupId, name, limit, policy, selected, navigation]);

  if (editing && groupLoading) return <Loading message="Carregando grupo..." />;
  if (editing && (groupError || !group)) return <ErrorMessage message={groupError ?? 'Grupo não encontrado.'} />;
  if (editing && group && group.ownerId !== user?.uid) {
    return <ErrorMessage message="Apenas o proprietário pode editar o grupo." />;
  }

  const header = (
    <View style={styles.form}>
      <View style={styles.photoBox}>
        {photoUri ? <Image source={{ uri: photoUri }} style={styles.photo} /> : <Avatar uri={photoUrl} size={96} />}
        <Button title="Escolher foto do grupo" onPress={handlePhoto} />
      </View>

      <Text style={styles.label}>Nome do grupo</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ex.: Turma 3SIA" maxLength={60} />

      <Text style={styles.label}>Limite de integrantes</Text>
      <TextInput style={styles.input} value={limitText} onChangeText={setLimitText} keyboardType="numeric" maxLength={4} />
      <Text style={[styles.counter, slots < 0 && styles.counterBad]}>
        {total}/{Number.isNaN(limit) ? '?' : limit} integrantes - {Math.max(slots, 0)} {slots === 1 ? 'vaga' : 'vagas'}
      </Text>

      <Text style={styles.label}>Política de notificação</Text>
      {POLICY_OPTIONS.map((opt) => (
        <Pressable key={opt.value} style={[styles.policy, policy === opt.value && styles.policyOn]} onPress={() => setPolicy(opt.value)}>
          <Text style={styles.policyTitle}>{policy === opt.value ? '◉ ' : '○ '}{opt.label}</Text>
          <Text style={styles.policyDesc}>{opt.description}</Text>
        </Pressable>
      ))}

      {!editing ? (
        <>
          <Text style={styles.label}>Integrantes (você entra como proprietário)</Text>
          <TextInput style={styles.input} value={search} onChangeText={setSearch} placeholder="Buscar usuário..." />
        </>
      ) : (
        <Text style={styles.hint}>Para adicionar ou remover integrantes, use a tela de integrantes do grupo.</Text>
      )}
    </View>
  );

  const footer = (
    <View style={styles.form}>
      <ErrorMessage message={error} />
      <View style={{ paddingBottom: Math.max(insets.bottom, 10) }}>
        <Button title={saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar grupo'} onPress={() => void handleSave()} disabled={saving} />
      </View>
    </View>
  );

  return (
    <FlatList
      data={editing ? [] : filtered}
      keyExtractor={(u) => u.id}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={header}
      ListFooterComponent={footer}
      renderItem={({ item }) => {
        const on = selected.includes(item.id);
        return (
          <Pressable style={styles.user} onPress={() => toggle(item.id)}>
            <Text style={styles.check}>{on ? '☑' : '☐'}</Text>
            <Avatar uri={item.photoUrl} size={40} />
            <Text style={styles.userName}>{item.name}</Text>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  form: { padding: 16, gap: 6 },
  photoBox: { alignItems: 'center', gap: 8, marginBottom: 8 },
  photo: { width: 96, height: 96, borderRadius: 48 },
  label: { fontWeight: '700', marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#CCC', borderRadius: 8, padding: 12 },
  counter: { color: '#1E6BFF', fontWeight: '700' },
  counterBad: { color: '#C62828' },
  policy: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 10 },
  policyOn: { borderColor: '#1E6BFF', backgroundColor: '#EEF4FF' },
  policyTitle: { fontWeight: '700' },
  policyDesc: { color: '#666', marginTop: 2 },
  hint: { color: '#666', marginTop: 10 },
  user: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingHorizontal: 16 },
  check: { fontSize: 22 },
  userName: { fontSize: 16 },
});