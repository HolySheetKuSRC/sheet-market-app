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

interface JwtPayload {
  sub: string;
}

interface CartItem {
  id: string;           // ✅ frontend-safe id
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

  // ===============================
  // Fetch cart (SAFE FOR MOCK)
  // ===============================
  const fetchCartData = async () => {
    try {
      setLoading(true);
      const token = await getAccessToken();
      const decoded: JwtPayload = jwtDecode(token!);

      const response = await fetch(`${CART_API_URL}/api/cart/user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-USER-ID': decoded.sub,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();

        // ✅ normalize data ไม่กรองทิ้ง
        const items: CartItem[] = (data.items || []).map(
          (item: any, index: number) => {
            const id =
              item.id ??
              item.cartItemId ??
              item._id ??
              `mock-${index}`; // ✅ fallback key

            return {
              id: String(id),
              sheetName: item.sheetName ?? 'ไม่ระบุชื่อสินค้า',
              price: item.price ?? '0',
              sellerName: item.sellerName ?? '-'
            };
          }
        );

        setCartItems(items);
        setSelectedIds(items.map(i => i.id));
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

  // ===============================
  // Select
  // ===============================
  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === cartItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(cartItems.map(i => i.id));
    }
  };

  // ===============================
  // Remove item
  // ===============================
  const handleRemoveItem = async (cartItemId: string) => {
    Alert.alert(
      "ลบสินค้า",
      "ต้องการลบสินค้านี้ออกจากตะกร้าหรือไม่?",
      [
        { text: "ยกเลิก", style: "cancel" },
        {
          text: "ลบ",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await getAccessToken();
              const decoded: JwtPayload = jwtDecode(token!);

              const response = await fetch(
                `${CART_API_URL}/api/cart/${cartItemId}`,
                {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-USER-ID': decoded.sub
                  }
                }
              );

              if (response.ok) {
                setCartItems(prev =>
                  prev.filter(item => item.id !== cartItemId)
                );
                setSelectedIds(prev =>
                  prev.filter(id => id !== cartItemId)
                );
              } else {
                Alert.alert("ผิดพลาด", "ลบสินค้าไม่สำเร็จ");
              }
            } catch {
              Alert.alert("Error", "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
            }
          }
        }
      ]
    );
  };

  // ===============================
  // Total price
  // ===============================
  const totalPrice = cartItems
    .filter(item => selectedIds.includes(item.id))
    .reduce((sum, item) => sum + Number(item.price || 0), 0);

  // ===============================
  // UI
  // ===============================
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          ตะกร้าของฉัน ({cartItems.length})
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Select all */}
      {cartItems.length > 0 && (
        <View style={styles.selectAllRow}>
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={toggleSelectAll}
          >
            <Ionicons
              name={
                selectedIds.length === cartItems.length
                  ? "checkbox"
                  : "square-outline"
              }
              size={24}
              color="#6C63FF"
            />
            <Text style={styles.selectAllText}>เลือกทั้งหมด</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Cart list */}
      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isSelected = selectedIds.includes(item.id);

          return (
            <View style={[styles.cartItem, isSelected && styles.selected]}>
              <TouchableOpacity onPress={() => toggleSelect(item.id)}>
                <Ionicons
                  name={isSelected ? "checkbox" : "square-outline"}
                  size={24}
                  color="#6C63FF"
                />
              </TouchableOpacity>

              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>{item.sheetName}</Text>
                <Text style={styles.itemPrice}>฿{item.price}</Text>
                <Text style={styles.sellerName}>
                  ผู้ขาย: {item.sellerName}
                </Text>
              </View>

              <TouchableOpacity onPress={() => handleRemoveItem(item.id)}>
                <Ionicons
                  name="trash-outline"
                  size={22}
                  color="#EF4444"
                />
              </TouchableOpacity>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={{ color: '#94A3B8', marginTop: 20 }}>
              ไม่มีสินค้าในตะกร้า
            </Text>
          </View>
        }
      />

      {/* Footer */}
      {cartItems.length > 0 && (
        <View style={styles.footer}>
          <Text style={styles.totalAmount}>
            ยอดสุทธิ: ฿{totalPrice.toLocaleString()}
          </Text>
          <TouchableOpacity
            style={[
              styles.checkoutBtn,
              selectedIds.length === 0 && { backgroundColor: '#CBD5E1' }
            ]}
            disabled={selectedIds.length === 0}
            onPress={() => router.replace('/(drawer)/home' as any)}
          >
            <Text style={styles.checkoutText}>
              ชำระเงิน ({selectedIds.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ===============================
// Styles
// ===============================
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

  selectAllRow: {
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE'
  },
  checkboxRow: { flexDirection: 'row', alignItems: 'center' },
  selectAllText: { marginLeft: 10, fontWeight: '600' },

  cartItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#FFF',
    margin: 10,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2
  },
  selected: {
    backgroundColor: '#F5F3FF',
    borderColor: '#6C63FF',
    borderWidth: 1
  },

  itemInfo: { marginLeft: 15, flex: 1 },
  itemTitle: { fontWeight: 'bold', fontSize: 15 },
  itemPrice: {
    color: '#6C63FF',
    fontWeight: '900',
    marginTop: 5,
    fontSize: 17
  },
  sellerName: { fontSize: 12, color: '#64748B', marginTop: 2 },

  footer: {
    padding: 20,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE'
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'right'
  },
  checkoutBtn: {
    backgroundColor: '#6C63FF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  checkoutText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});
