import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// ข้อมูลจำลอง (Mock Data) สำหรับหน้าตะกร้า
const INITIAL_CART = [
  { id: '1', title: 'สรุป Calculus 1 Midterm', price: 59, image: 'https://via.placeholder.com/150' },
  { id: '2', title: 'Algorithm Exam Hack', price: 99, image: 'https://via.placeholder.com/150' },
];

export default function CartScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [cartItems, setCartItems] = useState(INITIAL_CART);

  // คำนวณราคารวมทั้งหมดในตะกร้า
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);

  // ฟังก์ชันลบสินค้าออกจากตะกร้า
  const removeItem = (id: string) => {
    setCartItems(cartItems.filter((item) => item.id !== id));
  };

  /**
   * FIX: Logic การย้อนกลับแบบแม่นยำ
   * เราจะใช้ navigation.goBack() เสมอถ้าทำได้
   * และจะเช็คพฤติกรรมการเข้าหน้าจาก Sidebar ด้วย
   */
  const handleBack = () => {
    // ตรวจสอบว่ามี Stack ให้ย้อนกลับได้จริงหรือไม่
    if (navigation.canGoBack()) {
      navigation.goBack(); 
    } else {
      // กรณีเดียวที่จะตกมาที่นี่คือเปิดแอปมาแล้วเข้าหน้า Cart เป็นหน้าแรกสุด
      // ให้ใช้ push แทน replace เพื่อไม่ให้เสียโครงสร้าง Drawer
      router.push('/(drawer)/home' as any); 
    }
  };

  return (
    <View style={styles.container}>
      {/* Header ส่วนหัวพร้อมปุ่มย้อนกลับ */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ตะกร้าของฉัน ({cartItems.length})</Text>
        <View style={{ width: 28 }} /> 
      </View>

      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            <Image source={{ uri: item.image }} style={styles.itemImage} />
            <View style={styles.itemInfo}>
              <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.itemPrice}>฿{item.price}</Text>
            </View>
            <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={22} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={80} color="#CCC" />
            <Text style={styles.emptyText}>ตะกร้าของคุณยังว่างเปล่า</Text>
            <TouchableOpacity 
              style={styles.shopBtn}
              onPress={() => router.push('/(drawer)/marketplace' as any)}
            >
              <Text style={styles.shopBtnText}>ไปเลือกซื้อชีทกันเลย</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* ส่วนสรุปราคาและปุ่มชำระเงินด้านล่าง */}
      {cartItems.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalText}>ราคารวมทั้งหมด</Text>
            <Text style={styles.totalAmount}>฿{totalPrice}</Text>
          </View>
          <TouchableOpacity 
            style={styles.checkoutBtn}
            onPress={() => Alert.alert('Payment', 'ระบบชำระเงินกำลังจะมาเร็วๆ นี้!')}
          >
            <Text style={styles.checkoutBtnText}>ชำระเงิน</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingHorizontal: 16, 
    paddingTop: 60, 
    paddingBottom: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  listContent: { padding: 16, paddingBottom: 120 },
  cartItem: { 
    flexDirection: 'row', 
    backgroundColor: '#FFF', 
    padding: 12, 
    borderRadius: 16, 
    marginBottom: 12, 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2
  },
  itemImage: { width: 70, height: 70, borderRadius: 10, backgroundColor: '#EEE' },
  itemInfo: { flex: 1, marginLeft: 15 },
  itemTitle: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  itemPrice: { fontSize: 18, color: '#6C63FF', fontWeight: '900', marginTop: 5 },
  deleteBtn: { padding: 8 },
  footer: { 
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF', 
    padding: 20, 
    paddingBottom: 35,
    borderTopWidth: 1, 
    borderTopColor: '#EEE',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  totalText: { fontSize: 16, color: '#64748B' },
  totalAmount: { fontSize: 22, fontWeight: '900', color: '#333' },
  checkoutBtn: { 
    backgroundColor: '#6C63FF', 
    paddingVertical: 16, 
    borderRadius: 16, 
    alignItems: 'center',
    shadowColor: '#6C63FF',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  checkoutBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#94A3B8', marginTop: 15, fontSize: 16, fontWeight: '600' },
  shopBtn: { marginTop: 20, backgroundColor: '#EEF2FF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  shopBtnText: { color: '#6C63FF', fontWeight: 'bold' }
});