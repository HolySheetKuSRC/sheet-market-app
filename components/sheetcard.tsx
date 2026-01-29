import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// แก้ไข Interface ให้ตรงกับหน้า Marketplace และรองรับข้อมูลจาก Java Spring Boot
interface SheetCardProps {
  item: {
    id: string | number; // รองรับทั้ง String UUID หรือ Long ID จาก Java
    title: string;
    description: string;
    price: number;
    imageUrl: string;
    ratingAverage: number;
    seller: {
      name: string;
    };
    tags: string[];
  };
}

const SheetCard: React.FC<SheetCardProps> = ({ item }) => {
  const router = useRouter();

  // ป้องกันกรณี item เป็น undefined
  if (!item) return null;

  return (
    <TouchableOpacity 
      style={styles.card} 
      // แก้ไขการส่ง id ให้เป็น string เสมอเพื่อความชัวร์ในการทำ Dynamic Route
      onPress={() => router.push({ pathname: '/sheet/[id]', params: { id: item.id.toString() } } as any)}
    >
      {/* Rating Badge - ปรับให้ดูเนียนขึ้น */}
      <View style={styles.ratingBadge}>
        <Ionicons name="star" size={10} color="#FFD700" />
        <Text style={styles.ratingText}>
          {typeof item.ratingAverage === 'number' ? item.ratingAverage.toFixed(1) : "0.0"}
        </Text>
      </View>

      {/* Image - เพิ่ม Default Image กรณี URL พัง หรือไม่มีรูป */}
      <Image 
        source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }} 
        style={styles.cardImage} 
        resizeMode="cover"
      />
      
      {/* Author/Seller Badge */}
      <View style={styles.authorBadge}>
        <Text style={styles.authorText} numberOfLines={1}>
          {item.seller?.name || 'Unknown'}
        </Text>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title || "ไม่มีชื่อหัวข้อ"}
        </Text>
        <Text style={styles.cardDesc} numberOfLines={2}>
          {item.description || "ไม่มีคำอธิบายเพิ่มเติม..."}
        </Text>
        
        <View style={styles.tagRow}>
          <View style={styles.tagBadge}>
            <Text style={styles.tagBadgeText}>
              {item.tags && item.tags.length > 0 ? item.tags[0] : 'ทั่วไป'}
            </Text>
          </View>
          <Text style={styles.price}>฿{item.price ?? 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: { 
    backgroundColor: '#FFF', 
    width: '48%', 
    borderRadius: 12, 
    marginBottom: 16, 
    overflow: 'hidden', 
    borderWidth: 1, 
    borderColor: '#F1F5F9', // ปรับสีขอบให้ซอฟต์ลง
    position: 'relative',
    // เพิ่ม Shadow เล็กน้อยให้ดูมีมิติ (iOS)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    // Android Shadow
    elevation: 2,
  },
  cardImage: { 
    width: '100%', 
    height: 140, 
    backgroundColor: '#F8FAFC' 
  },
  ratingBadge: { 
    position: 'absolute', 
    top: 10, 
    left: 10, 
    backgroundColor: 'rgba(255,255,255,0.95)', 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    borderRadius: 6, 
    flexDirection: 'row', 
    alignItems: 'center', 
    zIndex: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    elevation: 3,
  },
  ratingText: { 
    fontSize: 10, 
    fontWeight: 'bold', 
    marginLeft: 3,
    color: '#334155'
  },
  cardContent: { padding: 12 },
  cardTitle: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    marginBottom: 4, 
    color: '#1E293B', 
    minHeight: 40 
  },
  cardDesc: { 
    fontSize: 11, 
    color: '#64748B', 
    marginBottom: 10, 
    minHeight: 32,
    lineHeight: 16
  },
  tagRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginTop: 'auto'
  },
  tagBadge: { 
    backgroundColor: '#EEF2FF', 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    borderRadius: 5 
  },
  tagBadgeText: { 
    fontSize: 9, 
    color: '#6366F1', 
    fontWeight: '700' 
  },
  price: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: '#4F46E5' 
  },
  authorBadge: { 
    position: 'absolute', 
    top: 115, 
    right: 8, 
    backgroundColor: '#FFF', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 12, 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    elevation: 4,
    zIndex: 5,
    maxWidth: '80%'
  },
  authorText: { 
    fontSize: 10, 
    color: '#4F46E5', 
    fontWeight: '700' 
  },
});

export default SheetCard;