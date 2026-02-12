import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
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

import { apiRequest } from '../utils/api';

interface CartItem {
  id: string;
  sheetName: string;
  price: string;
  sellerName: string;
}

export default function CartScreen() {
  const router = useRouter();
  const navigation = useNavigation();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCartData = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/cart/user', {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json();
        const items: CartItem[] = (data.items || []).map((item: any) => ({
          id: String(item.id),
          sheetName: item.sheetName ?? 'ไม่ระบุชื่อสินค้า',
          price: String(item.price ?? '0'),
          sellerName: item.sellerName ?? '-'
        }));
        setCartItems(items);
        setSelectedIds(items.map(i => i.id));
      } else {
        console.error('Fetch failed status:', response.status);
      }
    } catch (err) {
      console.error('Fetch cart error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartData();
  }, []);

  // ฟังก์ชันลบสินค้าแบบลบได้ทันที (Immediate Delete)
  const handleRemoveItem = async (cartItemId: string) => {
    console.log("---------------------------------------");
    console.log("STEP 1: Starting immediate delete for ID:", cartItemId);

    try {
      console.log("STEP 2: Sending DELETE request to /cart");
      const response = await apiRequest(`/cart`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItemIds: [cartItemId],
        }),
      });

      console.log("STEP 3: Server Response:", response.status);

      if (response.ok) {
        console.log("STEP 4: Delete Success! Updating UI");
        setCartItems(prev => prev.filter(item => item.id !== cartItemId));
        setSelectedIds(prev => prev.filter(id => id !== cartItemId));
      } else {
        const errorMsg = await response.text();
        console.error("Delete failed:", errorMsg);
        // แสดง Alert เฉพาะกรณีที่ลบไม่สำเร็จจริงๆ
        Alert.alert("ผิดพลาด", "ลบสินค้าไม่สำเร็จ");
      }
    } catch (error) {
      console.error("Network error:", error);
      Alert.alert("Error", "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const totalPrice = cartItems
    .filter(item => selectedIds.includes(item.id))
    .reduce((sum, item) => sum + Number(item.price || 0), 0);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ตะกร้าของฉัน ({cartItems.length})</Text>
        <View style={{ width: 28 }} />
      </View>

      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isSelected = selectedIds.includes(item.id);
          return (
            <View style={[styles.cartItem, isSelected && styles.selected]}>
              <TouchableOpacity onPress={() => toggleSelect(item.id)} hitSlop={{right: 15}}>
                <Ionicons 
                  name={isSelected ? "checkbox" : "square-outline"} 
                  size={24} 
                  color="#6C63FF" 
                />
              </TouchableOpacity>
              
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>{item.sheetName}</Text>
                <Text style={styles.itemPrice}>฿{item.price}</Text>
                <Text style={styles.sellerName}>ผู้ขาย: {item.sellerName}</Text>
              </View>

              <TouchableOpacity 
                onPress={() => handleRemoveItem(item.id)}
                style={styles.deleteBtn}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              >
                <Ionicons name="trash-outline" size={22} color="#EF4444" />
              </TouchableOpacity>
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
            style={[styles.checkoutBtn, selectedIds.length === 0 && { backgroundColor: '#CBD5E1' }]}
            disabled={selectedIds.length === 0}
            onPress={() => Alert.alert("ชำระเงิน", "กำลังดำเนินการ...")}
          >
            <Text style={styles.checkoutText}>ชำระเงิน ({selectedIds.length})</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 16, 
    paddingTop: 50, 
    backgroundColor: '#FFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9' 
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  cartItem: { 
    flexDirection: 'row', 
    padding: 15, 
    backgroundColor: '#FFF', 
    marginHorizontal: 10, 
    marginVertical: 5, 
    borderRadius: 12, 
    alignItems: 'center', 
    elevation: 2 
  },
  selected: { backgroundColor: '#F5F3FF', borderColor: '#6C63FF', borderWidth: 1 },
  itemInfo: { marginLeft: 15, flex: 1 },
  itemTitle: { fontWeight: 'bold', fontSize: 15 },
  itemPrice: { color: '#6C63FF', fontWeight: '900', marginTop: 5, fontSize: 17 },
  sellerName: { fontSize: 12, color: '#64748B', marginTop: 2 },
  deleteBtn: { padding: 5 },
  footer: { padding: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#EEE' },
  totalAmount: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'right' },
  checkoutBtn: { backgroundColor: '#6C63FF', padding: 16, borderRadius: 12, alignItems: 'center' },
  checkoutText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});