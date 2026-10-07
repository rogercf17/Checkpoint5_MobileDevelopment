import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { getFullProfile, type FullProfile } from '../services/profileService';
import { getErrorMessage } from '../utils/firebaseErros';
import { Avatar } from '../components/Avatar';
import { Loading } from '../components/Loading';
import { ErrorMessage } from '../components/ErrorMessage';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const NOT_INFORMED = 'Não informado';

function formatPhone(v: string | null): string {
  if (!v) return NOT_INFORMED;
  const d = v.replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return v;
}

export default function ProfileScreen({ route }: Props) {
  const { userId } = route.params;
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getFullProfile(userId)
      .then((p) => { if (active) setProfile(p); })
      .catch((e) => { if (active) setError(getErrorMessage(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [userId]);

  if (loading) return <Loading message="Carregando perfil..." />;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ErrorMessage message={error} />
      {profile ? (
        <>
          <Avatar uri={profile.photoUrl} size={120} />
          <Text style={styles.name}>{profile.name || NOT_INFORMED}</Text>
          <View style={styles.card}>
            <Text style={styles.label}>E-mail</Text>
            <Text style={styles.value}>{profile.email || NOT_INFORMED}</Text>
            <Text style={styles.label}>Celular</Text>
            <Text style={styles.value}>{formatPhone(profile.phone)}</Text>
            <Text style={styles.label}>Nascimento</Text>
            <Text style={styles.value}>{profile.birthDate || NOT_INFORMED}</Text>
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: 24, gap: 12 },
  name: { fontSize: 24, fontWeight: '800' },
  card: { alignSelf: 'stretch', backgroundColor: '#F4F4F4', borderRadius: 12, padding: 16, gap: 4 },
  label: { color: '#666', fontSize: 12, marginTop: 8 },
  value: { fontSize: 16 },
});