import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    FlatList,
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
      console.error("❌ Error fetching orders:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchOrders(); }, []));

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PAID': return { text: 'ชำระแล้ว', color: '#10B981', bg: '#D1FAE5' }; 
      case 'PENDING': return { text: 'รอชำระเงิน', color: '#F59E0B', bg: '#FEF3C7' }; 
      case 'CANCELLED': return { text: 'ยกเลิก', color: '#EF4444', bg: '#FEE2E2' }; 
      default: return { text: status, color: '#64748B', bg: '#F1F5F9' };
    }
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const statusInfo = getStatusInfo(item.status);
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.dateText}>ออเดอร์: #{item.orderId.substring(0, 8)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />
        
        {item.items && item.items.length > 0 ? (
          item.items.map((sheet, index) => (
            <View key={`${item.orderId}-${index}`} style={styles.sheetRow}>
              <Ionicons name="document-text-outline" size={16} color="#64748B" />
              <Text style={styles.sheetName} numberOfLines={1}>
                {sheet.sheetName}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.noItemText}>ไม่มีรายการสินค้า</Text>
        )}

        <View style={styles.cardFooter}>
          <Text style={styles.totalLabel}>ยอดสุทธิ</Text>
          <Text style={styles.totalAmount}>฿{Number(item.totalPrice).toLocaleString()}</Text>
        </View>

        {item.status === 'PENDING' && item.totalPrice > 0 && (
           <TouchableOpacity 
             style={styles.payNowButton}
             onPress={() => {
                router.push({
                  pathname: '/checkout',
                  params: {
                    orderId: item.orderId,
                    price: item.totalPrice.toString(),
                    type: 're-payment',
                    itemsData: JSON.stringify(item.items) // ✅ ส่งรายการสินค้าไปด้วย
                  }
                } as any);
             }}
           >
             <Text style={styles.payNowText}>ชำระเงินต่อ</Text>
           </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
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
        renderItem={renderOrderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchOrders();}} colors={['#6C63FF']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyText}>ยังไม่มีรายการสั่งซื้อ</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 15, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', flex: 1, textAlign: 'center' },
  listContent: { padding: 16 },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  dateText: { fontSize: 14, color: '#64748B' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 8 },
  sheetRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  sheetName: { fontSize: 14, color: '#333', marginLeft: 6, flex: 1 },
  noItemText: { color: '#94A3B8', fontSize: 12, marginVertical: 5 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  totalLabel: { fontSize: 14, color: '#64748B' },
  totalAmount: { fontSize: 18, fontWeight: 'bold', color: '#6C63FF' },
  payNowButton: { marginTop: 12, backgroundColor: '#6C63FF', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  payNowText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { marginTop: 10, color: '#94A3B8', fontSize: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});