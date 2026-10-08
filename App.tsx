import { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import type { RootStackParamList } from './src/types/navigation';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ConversationsScreen from './src/screens/ConversationsScreen';
import UsersScreen from './src/screens/UsersScreen';
import ChatScreen from './src/screens/ChatScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import GroupFormScreen from './src/screens/GroupFormScreen';
import GroupMembersScreen from './src/screens/GroupMembersScreen';
import { useNotifications } from './src/hooks/useNotifications';
import { navigationRef } from './src/utils/navigationRef';

const Stack = createNativeStackNavigator<RootStackParamList>();

function LoadingScreen() {
  return <View style={styles.loading}><Text>Carregando...</Text></View>;
}

function AppNavigator({ navReady }: { navReady: boolean }) {
  const { user, loading } = useAuth();
  const { warning } = useNotifications(user?.uid, navReady);

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.flex}>
      {user && warning ? (
        <View style={styles.banner}><Text style={styles.bannerText}>{warning}</Text></View>
      ) : null}
      <Stack.Navigator>
        {user ? (
          <>
            <Stack.Screen name="Conversations" component={ConversationsScreen} options={{ title: 'Conversas' }} />
            <Stack.Screen name="Users" component={UsersScreen} options={{ title: 'Usuários' }} />
            <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Conversa' }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
            <Stack.Screen name="GroupForm" component={GroupFormScreen} options={{ title: 'Grupo' }} />
            <Stack.Screen name="GroupMembers" component={GroupMembersScreen} options={{ title: 'Integrantes' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Entrar' }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Criar conta' }} />
          </>
        )}
      </Stack.Navigator>
    </View>
  );
}

export default function App() {
  const [navReady, setNavReady] = useState(false);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer ref={navigationRef} onReady={() => setNavReady(true)}>
          <AppNavigator navReady={navReady} />
          <StatusBar style="auto" />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  banner: { backgroundColor: '#FFF3CD', padding: 10, paddingTop: 40 },
  bannerText: { color: '#6B5200', textAlign: 'center' },
});