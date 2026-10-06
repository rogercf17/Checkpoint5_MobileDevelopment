import { useCallback, useState } from 'react';
import { Button, Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { register } from '../services/authService';
import { pickImage } from '../services/imageService';
import { getErrorMessage } from '../utils/firebaseErros';
import {
  maskDate,
  onlyDigits,
  validateRegister,
  type FormErrors,
  type RegisterForm,
} from '../utils/validators';
import { ErrorMessage } from '../components/ErrorMessage';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;
const initialForm: RegisterForm = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    birthDate: '',
    photoUri: null,
};

export default function RegisterScreen({ navigation }: Props) {
    const [form, setForm] = useState<RegisterForm>(initialForm);
    const [errors, setErrors] = useState<FormErrors>({});
    const [apiError, setApiError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const setField = useCallback(
        <K extends keyof RegisterForm>(key: K, value: RegisterForm[K]) =>
            setForm((old) => ({ ...old, [key]: value })),
        [],
    );

    const handlePhoto = useCallback(async () => {
        try {
            const uri = await pickImage();
            if (uri) setField('photoUri', uri);
        }
        catch (error) {
            setApiError(getErrorMessage(error));
        }
    }, [setField]);

    const handleSubmit = useCallback(async () => {
        const found = validateRegister(form);
        setErrors(found);
        setApiError(null);
        if (Object.keys(found).length > 0 || !form.photoUri) return;
        setLoading(true);
        try {
            await register({
                name: form.name,
                email: form.email,
                password: form.password,
                phone: onlyDigits(form.phone),
                birthDate: maskDate(form.birthDate),
                photoUri: form.photoUri,
            });
            // sucesso: o AuthContext leva para a stack logada

        }
        catch (error) {
            setApiError(getErrorMessage(error));
        }
        finally {
            setLoading(false);
        }
    }, [form]);

    return(
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>Criar conta</Text>
        
            <View style={styles.photoBox}>
                {form.photoUri ? (
                <Image source={{ uri: form.photoUri }} style={styles.photo} />
                ) : (
                <View style={[styles.photo, styles.photoEmpty]} />
                )}
                <Button title="Escolher foto" onPress={handlePhoto} />
            </View>
            <ErrorMessage message={errors.photoUri} />
        
            <TextInput style={styles.input} placeholder="Nome" value={form.name}
                onChangeText={(v) => setField('name', v)} />
            <ErrorMessage message={errors.name} />
        
            <TextInput style={styles.input} placeholder="E-mail" autoCapitalize="none"
                keyboardType="email-address" value={form.email}
                onChangeText={(v) => setField('email', v)} />
            <ErrorMessage message={errors.email} />
        
            <TextInput style={styles.input} placeholder="Senha" secureTextEntry value={form.password}
                onChangeText={(v) => setField('password', v)} />
            <ErrorMessage message={errors.password} />
        
            <TextInput style={styles.input} placeholder="Confirmar senha" secureTextEntry
                value={form.confirmPassword} onChangeText={(v) => setField('confirmPassword', v)} />
            <ErrorMessage message={errors.confirmPassword} />
        
            <TextInput style={styles.input} placeholder="Celular (DDD + número)" keyboardType="phone-pad"
                maxLength={15} value={form.phone} onChangeText={(v) => setField('phone', v)} />
            <ErrorMessage message={errors.phone} />
        
            <TextInput style={styles.input} placeholder="Nascimento (dd/mm/aaaa)" keyboardType="numeric"
                maxLength={10} value={form.birthDate}
                onChangeText={(v) => setField('birthDate', maskDate(v))} />
            <ErrorMessage message={errors.birthDate} />
        
            <ErrorMessage message={apiError} />
            <Button title={loading ? 'Criando conta...' : 'Cadastrar'} onPress={handleSubmit}
                disabled={loading} />
            <Button title="Já tenho conta" onPress={() => navigation.goBack()} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { 
        padding: 24, 
        gap: 6 
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
    photoBox: { 
        alignItems: 'center', 
        gap: 8, 
        marginBottom: 8 
    },
    photo: { 
        width: 96, 
        height: 96, 
        borderRadius: 48 
    },
    photoEmpty: { 
        backgroundColor: '#ddd' 
    },
});
