import { StyleSheet, Text, View } from 'react-native';

export function EmptyState({ message }: { message: string }) {
    return (
        <View style={styles.box}>
            <Text style={styles.text}>{message}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    box: { 
        flex: 1, 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: 24 
    },
    text: { 
        color: '#777', 
        textAlign: 'center' 
    },
});