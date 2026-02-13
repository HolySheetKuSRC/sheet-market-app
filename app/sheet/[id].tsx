import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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

// ✅ เรียกใช้ตัวกลาง apiRequest เพื่อจัดการ token และการ refresh อัตโนมัติ
import { apiRequest } from '../../utils/api';

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

export default function SheetDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [sheet, setSheet] = useState<SheetDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [isInCart, setIsInCart] = useState(false); // ✅ สถานะเช็คว่าอยู่ในตะกร้าไหม
  const [cartItemId, setCartItemId] = useState<string | null>(null); // ✅ เก็บ ID ของรายการในตะกร้าสำหรับลบ
  const [relatedSheets, setRelatedSheets] = useState<any[]>([]);

  // ✅ ฟังก์ชันเช็คสถานะตะกร้าจาก /cart/user พร้อม Console Log ละเอียด
  const checkCartStatus = async () => {
    console.log("-----------------------------------------");
    console.log(`🔍 Checking Cart Status for Sheet ID: ${id}`);

    try {
      const response = await apiRequest('/cart/user', { method: 'GET' });
      
      if (response.ok) {
        const data = await response.json();
        const items = data.items || [];
        
        console.log(`📦 Cart Items Count: ${items.length}`);

        // เทียบ sheetId ที่เปิดอยู่กับรายการใน cart
        const foundItem = items.find((item: any) => {
             const itemIdInCart = item.product?.id || item.sheetId || item.id; 
             return String(itemIdInCart) === String(id);
        });
        
        if (foundItem) {
          console.log(`✅ FOUND! This sheet is in cart. CartItemID: ${foundItem.id}`);
          setIsInCart(true);
          setCartItemId(String(foundItem.id));
        } else {
          console.log("❌ NOT FOUND in cart.");
          setIsInCart(false);
          setCartItemId(null);
        }
      } else {
          console.log(`⚠️ Fetch cart failed. Status: ${response.status}`);
      }
    } catch (error) {
      console.error("Check Cart Error:", error);
    }
  };

  const fetchSheetDetail = async () => {
    try {
      setLoading(true);
      const response = await apiRequest(`/products/${id}`, { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        setSheet(data);
      }
      
      const relatedRes = await apiRequest(`/products?page=0&size=6`, { method: 'GET' });
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

  // ✅ 1. ใช้ useEffect เพื่อโหลดข้อมูลสินค้า (ทำแค่ครั้งแรก หรือเมื่อ id เปลี่ยน)
  useEffect(() => { 
    if (id) {
      console.log("🚀 Page Loaded/ID Changed. Fetching Detail...");
      fetchSheetDetail();
    } 
  }, [id]);

  // ✅ 2. ใช้ useFocusEffect เพื่อเช็คสถานะตะกร้าทุกครั้งที่หน้าจอแสดงผล (กลับมาจากหน้า Cart ก็จะเช็คใหม่)
  useFocusEffect(
    useCallback(() => {
      if (id) {
        console.log("👀 Screen Focused. Updating Cart Status...");
        checkCartStatus();
      }
    }, [id])
  );

  // ✅ ฟังก์ชัน Toggle: ADD/REMOVE และเรียกเช็คสถานะใหม่ทุกครั้ง
  const handleToggleCart = async () => {
    if (!sheet?.id) return;
    
    console.log(`🖱️ Button Clicked. Current State: isInCart = ${isInCart}`);

    try {
      setAddingToCart(true);

      if (isInCart && cartItemId) {
        // --- กรณีลบออก ---
        console.log(`🗑️ Removing CartItem ID: ${cartItemId}`);
        
        const response = await apiRequest(`/cart`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cartItemIds: [cartItemId],
          }),
        });

        if (response.ok) {
          Alert.alert("สำเร็จ", "นำออกจากตะกร้าแล้ว");
          await checkCartStatus(); 
        } else {
           const errorText = await response.text();
           console.log("Delete Failed:", errorText);
        }

      } else {
        // --- กรณีเพิ่มเข้า ---
        console.log(`➕ Adding Sheet ID: ${sheet.id}`);

        const response = await apiRequest('/cart/add', {
          method: 'POST',
          body: JSON.stringify({ sheetId: String(sheet.id) })
        });

        if (response.ok) {
          Alert.alert("สำเร็จ", "เพิ่มลงในตะกร้าแล้ว", [
            { text: "เลือกซื้อต่อ", style: "cancel" },
            { text: "ไปที่ตะกร้า", onPress: () => router.push('/cart' as any) }
          ]);
          await checkCartStatus(); 
        } else if (response.status === 401) {
          router.push('/login' as any);
        } else {
            const errorText = await response.text();
            console.log("Add Failed:", errorText);
        }
      }
    } catch (error) {
      console.error("Cart Toggle Error:", error);
    } finally {
      setAddingToCart(false);
    }
  };

  // ✅ แก้ไข handleBuyNow: นำทางไปยังหน้า Checkout พร้อมส่ง Params
  const handleBuyNow = () => {
    if (!sheet) return;

    console.log("🛒 Navigating to Checkout with Sheet:", sheet.id);

    // ส่งข้อมูลผ่าน router params ไปยังหน้า app/checkout.tsx
    router.push({
      pathname: '/checkout',
      params: {
        sheetId: String(sheet.id),
        title: sheet.title,
        price: String(sheet.price),
        sellerName: sheet.seller?.name || 'ไม่ระบุชื่อผู้ขาย',
        type: 'direct' // ระบุว่าเป็นการซื้อตรง (Direct Buy)
      }
    } as any);
  };

  if (loading || !sheet) return (
    <View style={styles.center}><ActivityIndicator size="large" color="#6C63FF" /></View>
  );

  return (
    <View style={styles.container}>
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
            {sheet.tags?.map((tag, i) => (
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
              <Text style={styles.statValue}>{sheet.ratingAverage?.toFixed(1) || 0} ⭐</Text>
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

          <View style={styles.aiCard}>
            <View style={styles.aiHeader}>
              <MaterialCommunityIcons name="robot" size={20} color="#A855F7" />
              <Text style={styles.aiTitle}> AI Summary</Text>
            </View>
            <Text style={styles.bulletText}>• วิเคราะห์เนื้อหาสำคัญให้อัตโนมัติ</Text>
            <Text style={styles.bulletText}>• เหมาะสำหรับอ่านทบทวน</Text>
          </View>

          <View style={styles.divider} />
          <Text style={styles.sectionHeader}>ชีทสรุปที่ใกล้เคียงกัน</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.relatedScrollContent}>
            {relatedSheets.map((item) => (
              <View key={item.id} style={styles.relatedCardWrapper}>
                <SheetCard item={item} isThreeColumns={true} />
              </View>
            ))}
          </ScrollView>
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>ราคาพิเศษ</Text>
            <Text style={styles.priceValue}>฿{sheet.price?.toFixed(0)}</Text>
        </View>
        <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[
                styles.cartBtn, 
                addingToCart && { opacity: 0.6 },
                isInCart && { backgroundColor: '#6C63FF' } // ✅ เปลี่ยนสีพื้นหลังเป็นม่วงเข้ม (Hover Style)
              ]} 
              onPress={handleToggleCart}
              disabled={addingToCart}
            >
                {addingToCart ? (
                    <ActivityIndicator color={isInCart ? "#FFF" : "#6C63FF"} size="small" />
                ) : (
                    <Ionicons 
                        // ✅ แก้ตรงนี้: ถ้าอยู่ในตะกร้าใช้ "cart" (ทึบ), ถ้าไม่อยู่ใช้ "cart-outline" (โปร่ง)
                        name={isInCart ? "cart" : "cart-outline"} 
                        size={24} 
                        color={isInCart ? "#FFF" : "#6C63FF"} 
                    />
                )}
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
  aiCard: { backgroundColor: '#F5F3FF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#DDD6FE', marginBottom: 20 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  aiTitle: { fontWeight: 'bold', color: '#7C3AED', fontSize: 15 },
  bulletText: { fontSize: 13, color: '#4B5563', marginBottom: 5 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 25 },
  relatedScrollContent: { paddingRight: 20, flexDirection: 'row' },
  relatedCardWrapper: { width: (width - 48) / 3, marginRight: 10 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 34, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9', elevation: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  priceContainer: { flex: 0.8 },
  priceLabel: { fontSize: 12, color: '#64748B' },
  priceValue: { fontSize: 28, fontWeight: '800', color: '#6C63FF' },
  actionButtons: { flex: 2, flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  cartBtn: { width: 54, height: 54, borderRadius: 15, borderWidth: 1.5, borderColor: '#6C63FF', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F3FF' },
  buyBtn: { flex: 1, backgroundColor: '#6C63FF', height: 54, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', elevation: 4 },
  buyText: { color: '#FFF', fontWeight: 'bold', fontSize: 16, marginRight: 8 },
});