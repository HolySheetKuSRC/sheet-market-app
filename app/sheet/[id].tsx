import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SheetDetail() {
  const { id } = useLocalSearchParams(); // รับ ID
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>รายละเอียดสินค้า</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        <Image source={{ uri: 'https://via.placeholder.com/300' }} style={styles.image} />
        <Text style={styles.sheetTitle}>สรุปวิชา ID: {id}</Text>
        <Text style={styles.description}>
            รายละเอียดชีทสรุปแบบครบถ้วน อ่านเข้าใจง่าย เหมาะสำหรับคนเวลาน้อย...
        </Text>
        <Text style={styles.price}>฿59</Text>
        
        <TouchableOpacity style={styles.buyButton}>
            <Text style={styles.buyText}>ซื้อเลย</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', padding: 20, paddingTop: 50, justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold' },
  content: { padding: 20, alignItems: 'center' },
  image: { width: '100%', height: 250, borderRadius: 15, backgroundColor: '#EEE', marginBottom: 20 },
  sheetTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  description: { textAlign: 'center', color: '#666', marginBottom: 20 },
  price: { fontSize: 32, fontWeight: 'bold', color: '#6C63FF', marginBottom: 20 },
  buyButton: { backgroundColor: '#6C63FF', paddingVertical: 15, paddingHorizontal: 60, borderRadius: 30 },
  buyText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
});