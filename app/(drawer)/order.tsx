import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { apiRequest } from '../../utils/api';

interface OrderItem {
  sheetId: string;
  sheetName: string;
  price: number;
  sellerName: string;
}

interface Order {
  orderId: string;
  totalPrice: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'FAILED';
  createdAt: string;
  items: OrderItem[];
}

export default function OrderScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/order/user', { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        const sortedData = data.sort((a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setOrders(sortedData);
      }
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchOrders(); }, []));

  const handleCancelOrder = useCallback((orderId: string) => {
    // ✅ แยก platform: web ใช้ window.confirm, mobile ใช้ Alert
    if (typeof window !== 'undefined' && window.confirm) {
      const confirmed = window.confirm('คุณต้องการยกเลิกออเดอร์นี้ใช่หรือไม่?');
      if (confirmed) confirmCancelOrder(orderId);
    } else {
      Alert.alert(
        'ยกเลิกออเดอร์',
        'คุณต้องการยกเลิกออเดอร์นี้ใช่หรือไม่?',
        [
          { text: 'ไม่ใช่', style: 'cancel' },
          { text: 'ยืนยันยกเลิก', style: 'destructive', onPress: () => confirmCancelOrder(orderId) },
        ]
      );
    }
  }, []);

  const confirmCancelOrder = async (orderId: string) => {
    try {
      setCancellingId(orderId);
      console.log('🔵 Sending cancel request for:', orderId);

      const response = await apiRequest(`/order/${orderId}/cancel`, { method: 'PATCH' });
      console.log('🟡 Response status:', response.status);

      if (response.ok) {
        Alert.alert('สำเร็จ', 'ยกเลิกออเดอร์เรียบร้อยแล้ว');
        setOrders((prev) =>
          prev.map((order) =>
            order.orderId === orderId ? { ...order, status: 'CANCELLED' } : order
          )
        );
      } else {
        const err = await response.json().catch(() => ({}));
        console.log('🔴 Error body:', err);
        Alert.alert('เกิดข้อผิดพลาด', err?.message || `ไม่สามารถยกเลิกได้ (${response.status})`);
      }
    } catch (error) {
      console.error('❌ Error cancelling order:', error);
      Alert.alert('เกิดข้อผิดพลาด', 'กรุณาลองใหม่อีกครั้ง');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PAID': return { text: 'ชำระแล้ว', color: '#10B981', bg: '#D1FAE5', icon: 'checkmark-circle-outline' };
      case 'PENDING': return { text: 'รอชำระเงิน', color: '#F59E0B', bg: '#FEF3C7', icon: 'time-outline' };
      case 'CANCELLED': return { text: 'ยกเลิกแล้ว', color: '#EF4444', bg: '#FEE2E2', icon: 'close-circle-outline' };
      case 'FAILED': return { text: 'ล้มเหลว', color: '#64748B', bg: '#F1F5F9', icon: 'alert-circle-outline' };
      default: return { text: status, color: '#64748B', bg: '#F1F5F9', icon: 'help-circle-outline' };
    }
  };

  // ✅ แยก OrderCard ออกมาเป็น component ต่างหาก → แก้ปัญหา FlatList ไม่ trigger onPress
  const OrderCard = useCallback(({ item }: { item: Order }) => {
    const statusInfo = getStatusInfo(item.status);
    const isCancelling = cancellingId === item.orderId;
    const isPending = item.status === 'PENDING';

    return (
      <View style={styles.card}>

        {/* ── Header ── */}
        <View style={styles.cardHeader}>
          <View style={styles.orderIdRow}>
            <Ionicons name="receipt-outline" size={16} color="#94A3B8" />
            <Text style={styles.orderIdText}>#{item.orderId.substring(0, 8).toUpperCase()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
            <Ionicons name={statusInfo.icon as any} size={12} color={statusInfo.color} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── รายการสินค้า ── */}
        {item.items && item.items.length > 0 ? (
          item.items.map((sheet, index) => (
            <View key={`${item.orderId}-${index}`} style={styles.sheetRow}>
              <Ionicons name="document-text-outline" size={15} color="#94A3B8" />
              <Text style={styles.sheetName} numberOfLines={1}>{sheet.sheetName}</Text>
              <Text style={styles.sheetPrice}>฿{Number(sheet.price).toLocaleString()}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noItemText}>ไม่มีรายการสินค้า</Text>
        )}

        {/* ── Footer: ยอดรวม ── */}
        <View style={styles.cardFooter}>
          <Text style={styles.totalLabel}>ยอดสุทธิ</Text>
          <Text style={styles.totalAmount}>฿{Number(item.totalPrice).toLocaleString()}</Text>
        </View>

        {/* ── Action Buttons (เฉพาะ PENDING) ── */}
        {isPending && item.totalPrice > 0 && (
          <View style={styles.actionRow}>

            {/* ✅ ใช้ Pressable แทน TouchableOpacity เพื่อความแน่ใจ */}
            <Pressable
              style={({ pressed }) => [
                styles.cancelButton,
                isCancelling && styles.disabledButton,
                pressed && { opacity: 0.7 }
              ]}
              onPress={() => {
                console.log('🔴 Cancel button pressed:', item.orderId); // debug
                handleCancelOrder(item.orderId);
              }}
              disabled={isCancelling}
            >
              <Ionicons name="close-outline" size={16} color={isCancelling ? '#CBD5E1' : '#EF4444'} />
              <Text style={[styles.cancelText, isCancelling && { color: '#CBD5E1' }]}>
                {isCancelling ? 'กำลังยกเลิก...' : 'ยกเลิก'}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.payNowButton,
                isCancelling && styles.disabledButton,
                pressed && { opacity: 0.8 }
              ]}
              onPress={() =>
                router.push({
                  pathname: '/checkout',
                  params: {
                    orderId: item.orderId,
                    price: item.totalPrice.toString(),
                    type: 're-payment',
                    itemsData: JSON.stringify(item.items),
                  },
                } as any)
              }
              disabled={isCancelling}
            >
              <Ionicons name="wallet-outline" size={16} color="#FFF" />
              <Text style={styles.payNowText}>ชำระเงิน</Text>
            </Pressable>

          </View>
        )}
      </View>
    );
  }, [cancellingId, handleCancelOrder]);

  return (
    <SafeAreaView style={styles.container}>

      {/* ── Top Bar ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ประวัติการสั่งซื้อ</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.orderId}
        renderItem={({ item }) => <OrderCard item={item} />}  // ✅ ใช้ OrderCard
        contentContainerStyle={[styles.listContent, orders.length === 0 && styles.emptyList]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchOrders(); }}
            colors={['#6C63FF']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={72} color="#E2E8F0" />
            <Text style={styles.emptyTitle}>ยังไม่มีรายการสั่งซื้อ</Text>
            <Text style={styles.emptySubtitle}>ออเดอร์ของคุณจะแสดงที่นี่</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ── Layout ──
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  listContent: { padding: 16, paddingBottom: 32 },
  emptyList: { flexGrow: 1 },

  // ── Header ──
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 15, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', flex: 1, textAlign: 'center' },

  // ── Card ──
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 14, shadowColor: '#94A3B8', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  orderIdRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  orderIdText: { fontSize: 13, fontWeight: '600', color: '#64748B', letterSpacing: 0.5 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 10 },

  // ── Sheet Rows ──
  sheetRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 7, gap: 8 },
  sheetName: { fontSize: 14, color: '#334155', flex: 1 },
  sheetPrice: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  noItemText: { color: '#94A3B8', fontSize: 13, marginVertical: 6 },

  // ── Footer ──
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  totalLabel: { fontSize: 14, color: '#64748B' },
  totalAmount: { fontSize: 20, fontWeight: 'bold', color: '#6C63FF' },

  // ── Action Buttons ──
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  cancelButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: '#EF4444', backgroundColor: '#FFF5F5' },
  cancelText: { color: '#EF4444', fontWeight: '700', fontSize: 14 },
  payNowButton: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: '#6C63FF' },
  payNowText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  disabledButton: { opacity: 0.45 },

  // ── Empty State ──
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyTitle: { marginTop: 14, fontSize: 17, fontWeight: '600', color: '#94A3B8' },
  emptySubtitle: { marginTop: 4, fontSize: 13, color: '#CBD5E1' },
});