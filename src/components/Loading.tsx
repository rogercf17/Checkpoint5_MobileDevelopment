import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export function Loading({ message }: { message?: string }) {
    return (
        <View style={styles.box}>
            <ActivityIndicator size="large" />
            {message ? <Text style={styles.text}>{message}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    box: { 
        flex: 1, 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 12 
    },
    text: { 
        color: '#555' 
    },
});