import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

interface SheetCardProps {
  item: {
    id: string | number;
    title: string;
    description: string;
    price: number;
    imageUrl: string;
    ratingAverage: number;
    seller: { name: string };
    tags: string[];
  };
  isThreeColumns?: boolean;
}

const SheetCard: React.FC<SheetCardProps> = ({ item, isThreeColumns = false }) => {
  const router = useRouter();
  if (!item) return null;

  const cardWidth = isThreeColumns ? (width - 48) / 3 : '48%';

  return (
    <TouchableOpacity 
      style={[styles.card, { width: cardWidth }]} 
      onPress={() => router.push({ pathname: '/sheet/[id]', params: { id: item.id.toString() } } as any)}
    >
      <View style={styles.ratingBadge}>
        <Ionicons name="star" size={10} color="#FBBF24" />
        <Text style={styles.ratingText}>
          {item.ratingAverage?.toFixed(1) || "0.0"}
        </Text>
      </View>

      <Image 
        source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }} 
        style={styles.cardImage} 
        resizeMode="cover"
      />
      
      <View style={styles.authorBadge}>
        <Text style={styles.authorText} numberOfLines={1}>
           พี่{item.seller?.name || 'คนนี้'}ตึงมาก
        </Text>
      </View>

      <View style={styles.cardContent}>
        <View>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>

          <Text style={styles.descriptionText} numberOfLines={1}>
            {item.description}
          </Text>
        </View>
        
        <View style={styles.tagWrapper}>
          {item.tags && item.tags.map((tag, index) => (
            <View key={index} style={styles.tagPill}>
              <Text style={styles.tagText} numberOfLines={1}>#{tag}</Text>
            </View>
          ))}
        </View>

        {/* ส่วนราคามีการปรับ margin ให้ขยับขึ้น */}
        <View style={styles.bottomSection}>
           <Text style={styles.price}>฿{item.price}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: { 
    backgroundColor: '#FFF', 
    borderRadius: 12, 
    marginBottom: 14, 
    marginRight: 8, 
    overflow: 'hidden', 
    borderWidth: 1.5, 
    borderColor: '#EEF2FF', 
    height: 220, 
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardImage: { 
    width: '100%', 
    height: 105, 
    backgroundColor: '#F8FAFC' 
  },
  ratingBadge: { 
    position: 'absolute', 
    top: 6, 
    left: 6, 
    backgroundColor: 'rgba(255,255,255,0.95)', 
    paddingHorizontal: 5, 
    paddingVertical: 2, 
    borderRadius: 10, 
    flexDirection: 'row', 
    alignItems: 'center', 
    zIndex: 10,
    borderWidth: 0.5,
    borderColor: '#E2E8F0'
  },
  ratingText: { fontSize: 13, fontWeight: 'bold', marginLeft: 2, color: '#1E293B' },
  authorBadge: { 
    position: 'absolute', 
    top: 80, 
    right: 2, 
    backgroundColor: '#FFF', 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 6, 
    elevation: 4, 
    zIndex: 15,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  authorText: { fontSize: 12, color: '#6366F1', fontWeight: 'bold' },
  cardContent: { 
    padding: 8, 
    flex: 1, 
    justifyContent: 'flex-start' // เปลี่ยนจาก space-between เพื่อคุมระยะห่างเอง
  },
  cardTitle: { 
    paddingTop: 6,
    marginTop: 5,
    fontSize: 14, 
    fontWeight: '800', 
    color: '#1E293B', 
    lineHeight: 14,
    paddingBottom: 4 // ลดจาก 12 เพื่อให้ราคาขยับขึ้น
  },
  descriptionText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 12,
    marginTop: 2,
    paddingBottom: 4 // ลดจาก 12 เพื่อให้ราคาขยับขึ้น
  },
  tagWrapper: {
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 3,
    marginVertical: 2,
    maxHeight: 40, 
    overflow: 'hidden'
  },
  tagPill: { 
    backgroundColor: '#DBEAFE', 
    paddingHorizontal: 6, 
    paddingVertical: 1, 
    borderRadius: 4,
  },
  tagText: { color: '#2563EB', fontSize: 12, fontWeight: 'bold' },
  bottomSection: { 
    alignItems: 'flex-end',
    marginTop: 'auto', // ใช้ดันขึ้นไปด้านบนตามพื้นที่ที่เหลือ
    paddingBottom: 4   // เว้นระยะจากขอบล่างสุดเล็กน้อย
  },
  price: { 
    fontSize: 22, 
    fontWeight: '900', 
    color: '#4F46E5',
    marginBottom: 2 // ขยับราคาขึ้นจากเส้นล่าง
  },
});

export default SheetCard;