import { useCallback, useState } from 'react';
import { Button, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { login } from '../services/authService';
import { getErrorMessage } from '../utils/firebaseErros';
import { ErrorMessage } from '../components/ErrorMessage';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleLogin= useCallback(async () => {
        if (!email.trim() || !password) {
            setError('Informe e-mail e senha.');
            return;
        }
        setError(null);
        setLoading(true);
        try {
            await login(email, password);
        }
        catch (error) {
            setError(getErrorMessage(error));
        }
        finally {
            setLoading(false);
        }
    }, [email, password]);

    return (
       <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <Text style={styles.title}>Entrar</Text>
            <TextInput
                style={styles.input}
                placeholder="E-mail"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
            />
            <TextInput
                style={styles.input}
                placeholder="Senha"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />
            <ErrorMessage message={error} />
            <Button title={loading ? 'Entrando...' : 'Entrar'} onPress={handleLogin} disabled={loading} />
            <Button title="Criar conta" onPress={() => navigation.navigate('Register')} />
        </KeyboardAvoidingView> 
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        justifyContent: 'center', 
        padding: 24, 
        gap: 10 
    },
    title: { 
        fontSize: 28, 
        fontWeight: '700', 
        marginBottom: 12 
    },
    input: { 
        borderWidth: 1, 
        borderColor: '#ccc', 
        borderRadius: 8, 
        padding: 12 
    },
});
