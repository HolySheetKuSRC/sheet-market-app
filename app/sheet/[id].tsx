import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import SheetCard from '../../components/sheetcard';

const { width } = Dimensions.get('window');

interface SheetDetailData {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  previewUrl: string | null;
  university?: { name: string };
  category?: { name: string };
  tags: string[];
  ratingCount: number;
  ratingAverage: number;
  seller: { name: string };
  pageCount: number | null;
  createdAt: string;
  updatedAt: string;
}

interface Review {
  id: string;
  user: string;
  rating: number;
  comment: string;
  date: string;
}

export default function SheetDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [sheet, setSheet] = useState<SheetDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedSheets, setRelatedSheets] = useState<any[]>([]);

  const MOCK_REVIEWS: Review[] = [
    { id: '1', user: 'Somchai', rating: 5, comment: 'เนื้อหาสรุปดีมากครับ อ่านเข้าใจง่าย ภาพประกอบชัดเจน', date: '2 วันที่แล้ว' },
    { id: '2', user: 'Manee', rating: 4, comment: 'ช่วยให้สอบผ่านมิดเทอมได้จริงค่ะ ขอบคุณมาก', date: '1 สัปดาห์ที่แล้ว' }
  ];

  // 1. ฟังก์ชันจำลองการกดซื้อ
  const handleBuyNow = () => {
    Alert.alert(
      "ยืนยันการสั่งซื้อ",
      `คุณต้องการซื้อ "${sheet?.title}" ในราคา ฿${sheet?.price?.toFixed(0)} ใช่หรือไม่?`,
      [
        { text: "ยกเลิก", style: "cancel" },
        { 
          text: "ยืนยัน", 
          onPress: () => {
            Alert.alert("สำเร็จ!", "ซื้อชีทเรียบร้อยแล้ว คุณสามารถดูได้ที่หน้า 'ชีทของฉัน'");
          }
        }
      ]
    );
  };

  // 2. ฟังก์ชันจำลองการเพิ่มลงตะกร้า
  const handleAddToCart = () => {
    Alert.alert("สำเร็จ", "เพิ่มชีทสรุปลงในตะกร้าแล้ว");
  };

  const formatDateThai = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const fetchSheetDetail = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/products/${id}`);
      
      let data: SheetDetailData;

      if (response.ok) {
        data = await response.json();
      } else {
        data = {
          id: id as string,
          title: "Anatomy: ระบบกระดูกและกล้ามเนื้อ (Mock)",
          description: "ภาพวาดประกอบสวยงาม จำง่าย เหมาะสำหรับสายสุขภาพ",
          price: 199.00,
          imageUrl: "https://img.freepik.com/free-vector/human-internal-organ-with-liver-structure_1308-102213.jpg", 
          previewUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          university: { name: "Mahidol University (MU)" },
          tags: ["สรุป", "anatomy", "mahidol", "แพทย์"],
          ratingCount: 12,
          ratingAverage: 4.5,
          seller: { name: "aomsin" },
          pageCount: 30,
          createdAt: "2026-01-28T22:44:30.488005",
          updatedAt: "2026-01-28T22:44:30.488005"
        };
      }

      data.imageUrl = "https://img.freepik.com/free-vector/human-internal-organ-with-liver-structure_1308-102213.jpg";
      setSheet(data);

      const relatedRes = await fetch(`${apiUrl}/api/products?page=0&size=6`);
      if (relatedRes.ok) {
        const relatedData = await relatedRes.json();
        setRelatedSheets(relatedData.content.filter((item: any) => item.id !== id));
      }
    } catch (error) {
      console.error("Fetch Detail Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchSheetDetail();
  }, [id]);

  if (loading || !sheet) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#6C63FF" />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>รายละเอียดชีท</Text>
        <View style={styles.headerActions}>
           <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/cart' as any)}>
            <Ionicons name="cart-outline" size={22} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.mainImageWrapper}>
          <Image source={{ uri: sheet.imageUrl }} style={styles.mainImage} resizeMode="cover" />
          <TouchableOpacity style={styles.previewBadge}>
            <Ionicons name="eye-outline" size={14} color="#FFF" />
            <Text style={styles.previewText}>ดูตัวอย่างไฟล์ PDF</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.title}>{sheet.title}</Text>
          
          <View style={styles.tagRow}>
            {sheet.tags.map((tag, i) => (
              <View key={i} style={styles.tagPill}><Text style={styles.tagText}>#{tag}</Text></View>
            ))}
          </View>

          <View style={styles.sellerRow}>
            <View style={styles.avatarPlaceholder}><Ionicons name="person" size={20} color="#6C63FF" /></View>
            <View>
              <Text style={styles.sellerName}>{sheet.seller?.name}</Text>
              <Text style={styles.sellerInfo}>{sheet.university?.name}</Text>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{sheet.ratingAverage.toFixed(1)} ⭐</Text>
              <Text style={styles.statLabel}>{sheet.ratingCount} รีวิว</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{sheet.pageCount ?? '-'}</Text>
              <Text style={styles.statLabel}>จำนวนหน้า</Text>
            </View>
          </View>

          <Text style={styles.sectionHeader}>รายละเอียด</Text>
          <Text style={styles.description}>{sheet.description}</Text>
          <Text style={styles.updateDateText}>อัปเดตล่าสุด {formatDateThai(sheet.updatedAt)}</Text>
          
          <View style={styles.aiCard}>
            <View style={styles.aiHeader}>
              <MaterialCommunityIcons name="robot" size={20} color="#A855F7" />
              <Text style={styles.aiTitle}> AI Summary (วิเคราะห์เนื้อหา)</Text>
            </View>
            <Text style={styles.bulletText}>• สรุปประเด็นสำคัญของ {sheet.title}</Text>
            <Text style={styles.bulletText}>• เหมาะสำหรับอ่านทบทวนก่อนสอบมิดเทอม</Text>
          </View>

          <View style={styles.divider} />

          {/* รีวิวจากเพื่อนๆ */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>รีวิวจากเพื่อนๆ</Text>
            <TouchableOpacity><Text style={styles.seeAllText}>ดูทั้งหมด</Text></TouchableOpacity>
          </View>

          {MOCK_REVIEWS.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewUser}>
                  <Text style={styles.userName}>{review.user}</Text>
                  <View style={styles.starRow}>
                    {[...Array(5)].map((_, i) => (
                      <Ionicons key={i} name="star" size={12} color={i < review.rating ? "#FBBF24" : "#E2E8F0"} />
                    ))}
                  </View>
                </View>
                <Text style={styles.reviewDate}>{review.date}</Text>
              </View>
              <Text style={styles.reviewComment}>{review.comment}</Text>
            </View>
          ))}

          <View style={styles.divider} />

          {/* ชีทสรุปที่ใกล้เคียงกัน - แนวนอน */}
          <Text style={styles.sectionHeader}>ชีทสรุปที่ใกล้เคียงกัน</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.relatedScrollContent}
          >
            {relatedSheets.map((item) => (
              <View key={item.id} style={styles.relatedCardWrapper}>
                <SheetCard item={item} isThreeColumns={true} />
              </View>
            ))}
          </ScrollView>
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>ราคาพิเศษ</Text>
            <Text style={styles.priceValue}>฿{sheet.price.toFixed(0)}</Text>
        </View>
        
        <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.cartBtn} onPress={handleAddToCart}>
                <Ionicons name="cart-outline" size={24} color="#6C63FF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.buyBtn} onPress={handleBuyNow}>
                <Text style={styles.buyText}>ซื้อชีทนี้</Text>
                <Ionicons name="flash" size={18} color="#FFF" />
            </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 45, paddingBottom: 10, paddingHorizontal: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { padding: 8, borderRadius: 20, backgroundColor: '#F3F4F6' },
  scrollContent: { paddingBottom: 20 },
  mainImageWrapper: { width: width, height: 450, backgroundColor: '#F8FAFC' },
  mainImage: { width: '100%', height: '100%' },
  previewBadge: { position: 'absolute', bottom: 20, alignSelf: 'center', backgroundColor: 'rgba(108, 99, 255, 0.9)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 25, flexDirection: 'row', alignItems: 'center', elevation: 5 },
  previewText: { color: '#FFF', fontSize: 12, marginLeft: 6, fontWeight: 'bold' },
  contentContainer: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1E293B', marginBottom: 10 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 15 },
  tagPill: { backgroundColor: '#F3F4FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  tagText: { color: '#6366F1', fontSize: 11, fontWeight: '600' },
  sellerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  sellerName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  sellerInfo: { fontSize: 12, color: '#64748B' },
  statsContainer: { flexDirection: 'row', backgroundColor: '#F9FAFB', padding: 15, borderRadius: 12, justifyContent: 'space-around', marginBottom: 25 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  statLabel: { fontSize: 11, color: '#64748B', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#E2E8F0', height: '80%' },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#1E293B' },
  description: { fontSize: 14, color: '#475569', lineHeight: 22, marginBottom: 10 },
  updateDateText: { fontSize: 12, color: '#94A3B8', marginBottom: 20 },
  aiCard: { backgroundColor: '#F5F3FF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#DDD6FE', marginBottom: 20 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  aiTitle: { fontWeight: 'bold', color: '#7C3AED', fontSize: 15 },
  bulletText: { fontSize: 13, color: '#4B5563', marginBottom: 5 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 25 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  seeAllText: { fontSize: 13, color: '#6C63FF', fontWeight: 'bold' },
  reviewCard: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, marginBottom: 12 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  reviewUser: { flexDirection: 'row', alignItems: 'center' },
  userName: { fontSize: 14, fontWeight: 'bold', color: '#333', marginRight: 8 },
  starRow: { flexDirection: 'row' },
  reviewDate: { fontSize: 11, color: '#94A3B8' },
  reviewComment: { fontSize: 13, color: '#4B5563', lineHeight: 20 },

  // สไตล์สำหรับ Scroll แนวนอน
  relatedScrollContent: {
    paddingRight: 20,
    flexDirection: 'row',
  },
  relatedCardWrapper: {
    width: (width - 48) / 3, 
    marginRight: 10,
  },

  // Bottom Bar
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 34, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9', elevation: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  priceContainer: { flex: 0.8 },
  priceLabel: { fontSize: 12, color: '#64748B' },
  priceValue: { fontSize: 28, fontWeight: '800', color: '#6C63FF' },
  actionButtons: { flex: 2, flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  cartBtn: { width: 54, height: 54, borderRadius: 15, borderWidth: 1.5, borderColor: '#6C63FF', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F3FF' },
  buyBtn: { flex: 1, backgroundColor: '#6C63FF', height: 54, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', elevation: 4 },
  buyText: { color: '#FFF', fontWeight: 'bold', fontSize: 16, marginRight: 8 },
});