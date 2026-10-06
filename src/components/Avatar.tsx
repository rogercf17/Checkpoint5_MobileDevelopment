import { Image, StyleSheet, Text, View } from 'react-native';

type Props = { uri?: string | null; size?: number };

export function Avatar({ uri, size = 48 }: Props) {
  const style = { width: size, height: size, borderRadius: size / 2 };
  return (
    <View style={[styles.container, style]}>
      {uri ? (
        <Image source={{ uri }} style={style} />
      ) : (
        <Text style={[styles.initial, { fontSize: Math.max(14, size * 0.4) }]}>?</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#D9D9D9', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  initial: { color: '#555', fontWeight: '700' },
});
