import { StyleSheet, Text } from 'react-native';

export function ErrorMessage({ message }: { message: string | null | undefined }) {
    if (!message) return null;
    return <Text style={styles.error}>{message}</Text>;
}

const styles = StyleSheet.create({
    error: { 
        color: '#c62828', 
        marginVertical: 4 
    },
});