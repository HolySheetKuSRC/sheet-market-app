import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { apiRequest } from '../../utils/api';
import { getSessionToken } from '../../utils/token';

interface OrderItem {
  id?: string;
  orderItemId?: string;
  sheetId: string;
  sheetName: string;
  price: number;
  sellerName: string;
  isRefunded?: boolean;
  refundStatus?: 'PENDING' | 'REFUNDED' | 'REJECTED' | null; 
}

interface Order {
  orderId: string;
  totalPrice: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'FAILED';
  createdAt: string;
  items: OrderItem[];
}

// ── ฟังก์ชันเช็คว่ายังอยู่ในระยะ 7 วันหรือไม่ ──
const isRefundable = (createdAt: string) => {
  const orderDate = new Date(createdAt);
  const currentDate = new Date();
  const diffTime = currentDate.getTime() - orderDate.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays <= 7;
};

export default function OrderScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // --- Refund States ---
  const [refundModalVisible, setRefundModalVisible] = useState(false);
  const [refundTarget, setRefundTarget] = useState<{ orderId: string, itemId: string, sheetName: string } | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      // 1. ดึงข้อมูลออเดอร์ทั้งหมด
      const orderRes = await apiRequest('/order/user', { method: 'GET' });
      // 2. ดึงข้อมูลการขอคืนเงินทั้งหมดของ User จาก Payment Service
      // หมายเหตุ: เช็ค Path ให้ตรงกับ Gateway ของคุณด้วยนะครับ
      const refundRes = await apiRequest('/payments/refunds/user', { method: 'GET' });

      if (orderRes.ok) {
        const ordersData = await orderRes.json();
        let refundsData = [];

        if (refundRes.ok) {
          refundsData = await refundRes.json();
        }

        // สร้าง Map เพื่อจับคู่ orderItemId กับสถานะ Refund
        const refundMap = new Map();
        refundsData.forEach((r: any) => {
          // เก็บสถานะล่าสุดของแต่ละ orderItemId
          refundMap.set(r.orderItemId, r.status);
        });

        // แนบ refundStatus เข้าไปในแต่ละ Item
        const enrichedOrders = ordersData.map((order: any) => ({
          ...order,
          items: order.items.map((item: any) => {
            const itemId = item.id || item.orderItemId || item.sheetId;
            return {
              ...item,
              refundStatus: refundMap.get(itemId) || null
            };
          })
        }));

        // เรียงลำดับวันที่
        const sortedData = enrichedOrders.sort((a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setOrders(sortedData);
      } else {
         console.error('❌ Failed to fetch orders', orderRes.status);
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
      const response = await apiRequest(`/order/${orderId}/cancel`, { method: 'PATCH' });

      if (response.ok) {
        Alert.alert('สำเร็จ', 'ยกเลิกออเดอร์เรียบร้อยแล้ว');
        setOrders((prev) =>
          prev.map((order) =>
            order.orderId === orderId ? { ...order, status: 'CANCELLED' } : order
          )
        );
      } else {
        const err = await response.json().catch(() => ({}));
        Alert.alert('เกิดข้อผิดพลาด', err?.message || `ไม่สามารถยกเลิกได้ (${response.status})`);
      }
    } catch (error) {
      console.error('❌ Error cancelling order:', error);
      Alert.alert('เกิดข้อผิดพลาด', 'กรุณาลองใหม่อีกครั้ง');
    } finally {
      setCancellingId(null);
    }
  };

  // --- Refund Methods ---
  const openRefundModal = (orderId: string, itemId: string, sheetName: string) => {
    setRefundTarget({ orderId, itemId, sheetName });
    setRefundReason("");
    setBankName("");
    setBankAccountName("");
    setBankAccountNumber("");
    setEvidenceFile(null); 
    setRefundModalVisible(true);
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("จำเป็นต้องใช้สิทธิ์", "กรุณาอนุญาตให้เข้าถึงรูปภาพเพื่อแนบสลิป");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, 
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setEvidenceFile(result.assets[0]);
    }
  };

  const submitRefund = async () => {
    if (!refundTarget) return;
    if (!refundReason || !bankName || !bankAccountName || !bankAccountNumber) {
      Alert.alert("แจ้งเตือน", "กรุณากรอกข้อมูลที่มีดอกจัน (*) ให้ครบถ้วน");
      return;
    }

    try {
      setIsSubmittingRefund(true);
      let uploadedEvidenceUrl = "";

      if (evidenceFile) {
        const token = await getSessionToken();
        const formData = new FormData();

        formData.append('file', {
          uri: evidenceFile.uri,
          name: evidenceFile.fileName || `slip_${Date.now()}.jpg`,
          type: evidenceFile.mimeType || 'image/jpeg'
        } as any);

        const uploadResponse = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/file/upload-refund-evidence`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (!uploadResponse.ok) {
          throw new Error("ไม่สามารถอัปโหลดรูปภาพหลักฐานได้");
        }

        const uploadData = await uploadResponse.json();
        uploadedEvidenceUrl = uploadData.url; 
      }

      const payload = {
        orderItemId: refundTarget.itemId,
        reason: refundReason,
        bankName: bankName,
        bankAccountName: bankAccountName,
        bankAccountNumber: bankAccountNumber,
        evidenceUrl: uploadedEvidenceUrl 
      };

      const response = await apiRequest("/payments/refunds", { // ปรับ URL ให้ตรงกับ Controller Backend
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        Alert.alert("สำเร็จ", "ส่งคำขอคืนเงินเรียบร้อยแล้ว รอผู้ดูแลระบบตรวจสอบ");
        setRefundModalVisible(false);
        fetchOrders(); // ดึงข้อมูลใหม่เพื่ออัปเดตสถานะ
      } else {
        const err = await response.json().catch(() => ({}));
        Alert.alert("ข้อผิดพลาด", err.message || "ไม่สามารถส่งคำขอคืนเงินได้");
      }
    } catch (error: any) {
      console.error("Refund Submit Error:", error);
      Alert.alert("ข้อผิดพลาด", error.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsSubmittingRefund(false);
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

  const OrderCard = useCallback(({ item }: { item: Order }) => {
    const statusInfo = getStatusInfo(item.status);
    const isCancelling = cancellingId === item.orderId;
    const isPending = item.status === 'PENDING';
    const isPaid = item.status === 'PAID';
    const canRefund = isRefundable(item.createdAt);

    return (
      <View style={styles.card}>
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

        {item.items && item.items.length > 0 ? (
          item.items.map((sheet, index) => {
            const itemId = sheet.id || sheet.orderItemId || sheet.sheetId;
            return (
              <View key={`${item.orderId}-${index}`} style={styles.sheetRowContainer}>
                <View style={styles.sheetRow}>
                  <Ionicons name="document-text-outline" size={15} color="#94A3B8" />
                  <Text style={styles.sheetName} numberOfLines={1}>{sheet.sheetName}</Text>
                  <Text style={styles.sheetPrice}>฿{Number(sheet.price).toLocaleString()}</Text>
                </View>
                {isPaid && (
                  <View style={styles.refundRow}>
                     {sheet.refundStatus === 'PENDING' ? (
                        <Text style={styles.refundedText}>กำลังตรวจสอบการขอคืนเงิน</Text>
                      ) : sheet.refundStatus === 'REFUNDED' || sheet.isRefunded ? (
                        <Text style={[styles.refundedText, { color: '#10B981' }]}>คืนเงินสำเร็จแล้ว</Text>
                      ) : sheet.refundStatus === 'REJECTED' ? (
                         <Text style={[styles.refundedText, { color: '#EF4444' }]}>การขอคืนเงินถูกปฏิเสธ</Text>
                      ) : canRefund ? (
                        <TouchableOpacity
                          style={styles.refundBtn}
                          onPress={() => openRefundModal(item.orderId, itemId, sheet.sheetName)}
                        >
                          <Text style={styles.refundBtnText}>ขอคืนเงิน</Text>
                        </TouchableOpacity>
                      ) : (
                        <Text style={styles.expiredRefundText}>หมดเขตขอคืนเงิน</Text>
                      )}
                  </View>
                )}
              </View>
            );
          })
        ) : (
          <Text style={styles.noItemText}>ไม่มีรายการสินค้า</Text>
        )}

        <View style={styles.cardFooter}>
          <Text style={styles.totalLabel}>ยอดสุทธิ</Text>
          <Text style={styles.totalAmount}>฿{Number(item.totalPrice).toLocaleString()}</Text>
        </View>

        {isPending && item.totalPrice > 0 && (
          <View style={styles.actionRow}>
            <Pressable
              style={({ pressed }) => [
                styles.cancelButton,
                isCancelling && styles.disabledButton,
                pressed && { opacity: 0.7 }
              ]}
              onPress={() => handleCancelOrder(item.orderId)}
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
        renderItem={({ item }) => <OrderCard item={item} />}
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

      {/* ── Refund Modal ── */}
      <Modal visible={refundModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>ขอคืนเงิน</Text>
              <TouchableOpacity onPress={() => setRefundModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle} numberOfLines={1}>
              วิชา: {refundTarget?.sheetName}
            </Text>

            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="ระบุเหตุผลการขอคืนเงิน *"
              placeholderTextColor="#94A3B8"
              multiline
              value={refundReason}
              onChangeText={setRefundReason}
            />
            <TextInput
              style={styles.input}
              placeholder="ธนาคาร *"
              placeholderTextColor="#94A3B8"
              value={bankName}
              onChangeText={setBankName}
            />
            <TextInput
              style={styles.input}
              placeholder="เลขที่บัญชี *"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={bankAccountNumber}
              onChangeText={setBankAccountNumber}
            />
            <TextInput
              style={styles.input}
              placeholder="ชื่อบัญชี *"
              placeholderTextColor="#94A3B8"
              value={bankAccountName}
              onChangeText={setBankAccountName}
            />

            {/* ส่วนเลือกและแสดงรูปภาพหลักฐาน */}
            <View style={styles.imagePickerContainer}>
              <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
                <Ionicons name="image-outline" size={20} color="#6C63FF" />
                <Text style={styles.imagePickerText}>แนบรูปภาพหลักฐาน (สลิปโอนเงิน)</Text>
              </TouchableOpacity>
              {evidenceFile && (
                <View style={styles.imagePreviewWrapper}>
                  <Image source={{ uri: evidenceFile.uri }} style={styles.imagePreview} />
                  <TouchableOpacity style={styles.removeImageBtn} onPress={() => setEvidenceFile(null)}>
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.submitRefundBtn, isSubmittingRefund && styles.disabledButton]}
              onPress={submitRefund}
              disabled={isSubmittingRefund}
            >
              {isSubmittingRefund ? (
                <Text style={styles.submitRefundText}>กำลังอัปโหลดและส่งข้อมูล...</Text>
              ) : (
                <Text style={styles.submitRefundText}>ส่งคำขอคืนเงิน</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  listContent: { padding: 16, paddingBottom: 32 },
  emptyList: { flexGrow: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 15, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', flex: 1, textAlign: 'center' },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 14, shadowColor: '#94A3B8', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  orderIdRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  orderIdText: { fontSize: 13, fontWeight: '600', color: '#64748B', letterSpacing: 0.5 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 10 },
  sheetRowContainer: { marginBottom: 12 },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sheetName: { fontSize: 14, color: '#334155', flex: 1 },
  sheetPrice: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  noItemText: { color: '#94A3B8', fontSize: 13, marginVertical: 6 },
  refundRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
  refundBtn: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6, backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA' },
  refundBtnText: { color: '#EF4444', fontSize: 11, fontWeight: '600' },
  refundedText: { color: '#F59E0B', fontSize: 11, fontWeight: '600', fontStyle: 'italic' },
  expiredRefundText: { color: '#94A3B8', fontSize: 11, fontWeight: '500' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  totalLabel: { fontSize: 14, color: '#64748B' },
  totalAmount: { fontSize: 20, fontWeight: 'bold', color: '#6C63FF' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  cancelButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: '#EF4444', backgroundColor: '#FFF5F5' },
  cancelText: { color: '#EF4444', fontWeight: '700', fontSize: 14 },
  payNowButton: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: '#6C63FF' },
  payNowText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  disabledButton: { opacity: 0.45 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyTitle: { marginTop: 14, fontSize: 17, fontWeight: '600', color: '#94A3B8' },
  emptySubtitle: { marginTop: 4, fontSize: 13, color: '#CBD5E1' },

  // ── Modal Styles ──
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: '#FFF', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  modalSubtitle: { fontSize: 13, color: '#64748B', marginBottom: 16 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 14, color: '#1E293B' },
  submitRefundBtn: { backgroundColor: '#6C63FF', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  submitRefundText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },

  // ── Image Picker Styles ──
  imagePickerContainer: { marginBottom: 16 },
  imagePickerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, backgroundColor: '#EEF2FF', borderRadius: 10, borderWidth: 1, borderColor: '#C7D2FE', borderStyle: 'dashed' },
  imagePickerText: { marginLeft: 8, color: '#6C63FF', fontWeight: '600', fontSize: 14 },
  imagePreviewWrapper: { marginTop: 12, position: 'relative', alignSelf: 'center' },
  imagePreview: { width: 120, height: 160, borderRadius: 12, backgroundColor: '#F1F5F9' },
  removeImageBtn: { position: 'absolute', top: -10, right: -10, backgroundColor: '#FFF', borderRadius: 12 }
});