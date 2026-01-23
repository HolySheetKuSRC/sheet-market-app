// app/favorite.tsx
import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function FavoriteScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>ชีทที่ฉันอยากได้ (Favorites)</Text>
      <Link href="/" style={styles.link}>กลับหน้าหลัก</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold' },
  link: { marginTop: 20, color: 'blue' }
});