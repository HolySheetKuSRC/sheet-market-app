import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import { jwtDecode } from "jwt-decode";
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { getAccessToken } from './utils/token';

const CART_API_URL = process.env.EXPO_PUBLIC_CART_API_URL;

interface JwtPayload { sub: string; }

export default function CartScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ใช้ sheetId เป็นตัวอ้างอิงตาม JSON ที่ส่งมา
  const [selectedSheetIds, setSelectedSheetIds] = useState<string[]>([]);

  const fetchCartData = async () => {
    try {
      setLoading(true);
      const token = await getAccessToken();
      const decoded: JwtPayload = jwtDecode(token!);
      const userId = decoded.sub;

      const response = await fetch(`${CART_API_URL}/api/cart/user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-USER-ID': userId,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json(); 
        
        // ดึง items จากก้อนวัตถุตามรูปภาพ JSON ที่คุณส่งมา
        const items = data.items || []; 
        setCartItems(items);
        
        // เลือกสินค้าทั้งหมดที่มี sheetId เป็นค่าเริ่มต้น
        const allIds = items.map((item: any) => item.sheetId).filter((id: any) => id);
        setSelectedSheetIds(allIds);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCartData(); }, []);

  const toggleSelect = (sheetId: string) => {
    setSelectedSheetIds(prev => 
      prev.includes(sheetId) ? prev.filter(id => id !== sheetId) : [...prev, sheetId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedSheetIds.length === cartItems.length && cartItems.length > 0) {
      setSelectedSheetIds([]);
    } else {
      setSelectedSheetIds(cartItems.map(item => item.sheetId));
    }
  };

  const handleCheckout = async () => {
    // กรองเฉพาะค่าที่มีอยู่จริง ไม่เป็น undefined
    const validIds = selectedSheetIds.filter(id => id);

    if (validIds.length === 0) {
      Alert.alert("แจ้งเตือน", "กรุณาเลือกสินค้าอย่างน้อย 1 รายการ");
      return;
    }

    try {
      const token = await getAccessToken();
      const decoded: JwtPayload = jwtDecode(token!);

      console.log("🚀 SENDING IDs TO CHECKOUT:", validIds);

      const response = await fetch(`${CART_API_URL}/api/order/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-USER-ID': decoded.sub
        },
        body: JSON.stringify({
          // ส่งเป็น List<UUID> ตามที่ Backend ต้องการ (โดยใช้ sheetId แทน cartItemId)
          cartItemIds: validIds 
        })
      });

      if (response.ok) {
        Alert.alert("สำเร็จ", "สั่งซื้อเรียบร้อยแล้ว");
        router.replace('/(drawer)/home' as any);
      } else {
        const errData = await response.json();
        console.error("Checkout Error:", errData);
        Alert.alert("ไม่สำเร็จ", "Backend ปฏิเสธคำขอสั่งซื้อ (ID อาจไม่ตรงกัน)");
      }
    } catch (error) {
      Alert.alert("Error", "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    }
  };

  const totalPrice = cartItems
    .filter(item => selectedSheetIds.includes(item.sheetId))
    .reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#6C63FF" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={28} /></TouchableOpacity>
        <Text style={styles.headerTitle}>ตะกร้าของฉัน ({cartItems.length})</Text>
        <View style={{ width: 28 }} />
      </View>

      {cartItems.length > 0 && (
        <View style={styles.selectAllRow}>
          <TouchableOpacity style={styles.checkboxRow} onPress={toggleSelectAll}>
            <Ionicons 
              name={selectedSheetIds.length === cartItems.length ? "checkbox" : "square-outline"} 
              size={24} color="#6C63FF" 
            />
            <Text style={styles.selectAllText}>เลือกทั้งหมด</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={cartItems}
        keyExtractor={(item, index) => item.sheetId || index.toString()}
        renderItem={({ item }) => {
          const isSelected = selectedSheetIds.includes(item.sheetId);
          return (
            <View style={[styles.cartItem, isSelected && styles.selected]}>
              <TouchableOpacity onPress={() => toggleSelect(item.sheetId)}>
                <Ionicons name={isSelected ? "checkbox" : "square-outline"} size={24} color="#6C63FF" />
              </TouchableOpacity>
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>{item.sheetName}</Text>
                <Text style={styles.itemPrice}>฿{item.price}</Text>
                <Text style={styles.sellerName}>ผู้ขาย: {item.sellerName}</Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={{ color: '#94A3B8', marginTop: 20 }}>ไม่มีสินค้าในตะกร้า</Text>
          </View>
        }
      />

      {cartItems.length > 0 && (
        <View style={styles.footer}>
          <Text style={styles.totalAmount}>ยอดสุทธิ: ฿{totalPrice.toLocaleString()}</Text>
          <TouchableOpacity 
            style={[styles.checkoutBtn, selectedSheetIds.length === 0 && { backgroundColor: '#CBD5E1' }]} 
            onPress={handleCheckout}
            disabled={selectedSheetIds.length === 0}
          >
             <Text style={styles.checkoutText}>ชำระเงิน ({selectedSheetIds.length})</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, paddingTop: 50, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  selectAllRow: { padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center' },
  selectAllText: { marginLeft: 10, fontWeight: '600' },
  cartItem: { flexDirection: 'row', padding: 15, backgroundColor: '#FFF', margin: 10, borderRadius: 12, alignItems: 'center', elevation: 2 },
  selected: { backgroundColor: '#F5F3FF', borderColor: '#6C63FF', borderWidth: 1 },
  itemInfo: { marginLeft: 15, flex: 1 },
  itemTitle: { fontWeight: 'bold', fontSize: 15, color: '#1E293B' },
  itemPrice: { color: '#6C63FF', fontWeight: '900', marginTop: 5, fontSize: 17 },
  sellerName: { fontSize: 12, color: '#64748B', marginTop: 2 },
  footer: { padding: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#EEE' },
  totalAmount: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'right', color: '#1E293B' },
  checkoutBtn: { backgroundColor: '#6C63FF', padding: 16, borderRadius: 12, alignItems: 'center' },
  checkoutText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});