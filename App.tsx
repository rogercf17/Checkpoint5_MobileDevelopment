import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import type { RootStackParamList } from './src/types/navigation';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ConversationsScreen from './src/screens/ConversationsScreen';
import UsersScreen from './src/screens/UsersScreen';
import ChatScreen from './src/screens/ChatScreen';
import { useEffect } from 'react';

const Stack = createNativeStackNavigator<RootStackParamList>();

function LoadingScreen() {
  return <View style={styles.loading}><Text>Carregando...</Text></View>;
}

function AppNavigator() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;

  return (
    <Stack.Navigator>
      {user ? (
        <>
          <Stack.Screen name="Conversations" component={ConversationsScreen} options={{ title: 'Conversas' }} />
          <Stack.Screen name="Users" component={UsersScreen} options={{ title: 'Usuários' }} />
          <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Conversa' }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Entrar' }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Criar conta' }} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
        <StatusBar style="auto" />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
