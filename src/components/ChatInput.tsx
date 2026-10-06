import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type Props = { disabled?: boolean; onSend: (text: string) => Promise<void> };

export function ChatInput({ disabled = false, onSend }: Props) {
  const [text, setText] = useState('');

  const submit = useCallback(async () => {
    const value = text.trim();
    if (!value || disabled) return;
    await onSend(value);
    setText('');
  }, [disabled, onSend, text]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Digite uma mensagem..."
        value={text}
        onChangeText={setText}
        multiline
        editable={!disabled}
      />
      <Pressable style={[styles.button, (!text.trim() || disabled) && styles.disabled]} onPress={() => void submit()} disabled={!text.trim() || disabled}>
        <Text style={styles.buttonText}>{disabled ? '...' : 'Enviar'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 10, borderTopWidth: 1, borderTopColor: '#EEE' },
  input: { flex: 1, maxHeight: 100, borderWidth: 1, borderColor: '#CCC', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10 },
  button: { paddingHorizontal: 14, paddingVertical: 11, borderRadius: 18, backgroundColor: '#1E6BFF' },
  disabled: { opacity: 0.5 },
  buttonText: { color: '#FFF', fontWeight: '700' },
});
