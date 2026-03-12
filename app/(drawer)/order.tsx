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
      case 'PENDING': return { text: 'รอชำระเงิน', color: '#D97706', bg: '#FEF9C3', icon: 'time-outline' };
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
      <View style={styles.cardContainer}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.orderIdRow}>
              <Text style={styles.orderIdText}>#{item.orderId.substring(0, 8).toUpperCase()}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
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
                    <View style={styles.sheetIconBox}>
                      <Ionicons name="document-text" size={20} color="#6366F1" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sheetName} numberOfLines={1}>{sheet.sheetName}</Text>
                      <Text style={styles.sellerName}>{sheet.sellerName}</Text>
                    </View>
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

          <View style={styles.divider} />

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
                  { transform: [{ scale: pressed ? 0.97 : 1 }] }
                ]}
                onPress={() => handleCancelOrder(item.orderId)}
                disabled={isCancelling}
              >
                <Text style={[styles.cancelText, isCancelling && { color: '#CBD5E1' }]}>
                  {isCancelling ? 'กำลังยกเลิก...' : 'ยกเลิก'}
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.payNowButton,
                  isCancelling && styles.disabledButton,
                  { transform: [{ scale: pressed ? 0.97 : 1 }] }
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
                <Text style={styles.payNowText}>ชำระเงิน</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    );
  }, [cancellingId, handleCancelOrder]);

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#292524" />
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
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingTop: 50, 
    paddingBottom: 15, 
    backgroundColor: '#FFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9' 
  },
  backButton: { padding: 8 },
  headerTitle: { 
    fontSize: 18, 
    fontFamily: 'Mitr', 
    fontWeight: '600', 
    color: '#292524', 
    flex: 1, 
    textAlign: 'center' 
  },
  cardContainer: {
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  card: { 
    backgroundColor: '#FFF', 
    borderRadius: 16, 
    padding: 20, 
    marginBottom: 16, 
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowRadius: 10, 
    shadowOffset: { width: 0, height: 4 }, 
    elevation: 2 
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 0 
  },
  orderIdRow: { flexDirection: 'row', alignItems: 'center' },
  orderIdText: { 
    fontSize: 15, 
    fontFamily: 'Mitr', 
    fontWeight: '600', 
    color: '#292524' 
  },
  statusBadge: { 
    paddingHorizontal: 12, 
    paddingVertical: 4, 
    borderRadius: 99,
  },
  statusText: { 
    fontSize: 12, 
    fontFamily: 'Mitr', 
    fontWeight: '600' 
  },
  divider: { 
    height: 1, 
    backgroundColor: '#F1F5F9', 
    marginVertical: 16 
  },
  sheetRowContainer: { marginBottom: 16 },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sheetIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetName: { 
    fontSize: 15, 
    fontFamily: 'Mitr', 
    fontWeight: '500', 
    color: '#292524', 
    flex: 1 
  },
  sellerName: {
    fontSize: 12,
    fontFamily: 'Mitr',
    color: '#64748B',
    marginTop: 2,
  },
  sheetPrice: { 
    fontSize: 15, 
    fontFamily: 'Mitr', 
    color: '#292524', 
    fontWeight: '600' 
  },
  noItemText: { 
    fontFamily: 'Mitr', 
    color: '#94A3B8', 
    fontSize: 14, 
    marginVertical: 6,
    textAlign: 'center'
  },
  refundRow: { 
    flexDirection: 'row', 
    justifyContent: 'flex-end', 
    marginTop: 8 
  },
  refundBtn: { 
    paddingVertical: 6, 
    paddingHorizontal: 12, 
    borderRadius: 8, 
    backgroundColor: '#FFF5F5', 
    borderWidth: 1, 
    borderColor: '#FECACA' 
  },
  refundBtnText: { 
    color: '#EF4444', 
    fontSize: 12, 
    fontFamily: 'Mitr', 
    fontWeight: '600' 
  },
  refundedText: { 
    color: '#D97706', 
    fontSize: 12, 
    fontFamily: 'Mitr', 
    fontWeight: '500',
  },
  expiredRefundText: { 
    color: '#94A3B8', 
    fontSize: 12, 
    fontFamily: 'Mitr' 
  },
  cardFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
  },
  totalLabel: { 
    fontSize: 15, 
    fontFamily: 'Mitr', 
    color: '#64748B' 
  },
  totalAmount: { 
    fontSize: 20, 
    fontFamily: 'Mitr', 
    fontWeight: '600', 
    color: '#6366F1' 
  },
  actionRow: { 
    flexDirection: 'row', 
    gap: 12, 
    marginTop: 20 
  },
  cancelButton: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 12, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#FECACA', 
    backgroundColor: '#FFF' 
  },
  cancelText: { 
    color: '#EF4444', 
    fontFamily: 'Mitr', 
    fontWeight: '600', 
    fontSize: 15 
  },
  payNowButton: { 
    flex: 1.5, 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 12, 
    borderRadius: 12, 
    backgroundColor: '#6366F1' 
  },
  payNowText: { 
    color: '#FFF', 
    fontFamily: 'Mitr', 
    fontWeight: '600', 
    fontSize: 15 
  },
  disabledButton: { opacity: 0.5 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyTitle: { 
    marginTop: 16, 
    fontSize: 18, 
    fontFamily: 'Mitr', 
    fontWeight: '600', 
    color: '#475569' 
  },
  emptySubtitle: { 
    marginTop: 8, 
    fontSize: 14, 
    fontFamily: 'Mitr', 
    color: '#94A3B8' 
  },

  // ── Modal Styles ──
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { 
    width: '100%', 
    maxWidth: 500,
    backgroundColor: '#FFF', 
    borderRadius: 24, 
    padding: 24, 
    shadowColor: '#000', 
    shadowOpacity: 0.15, 
    shadowRadius: 20, 
    elevation: 5 
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 20, fontFamily: 'Mitr', fontWeight: '600', color: '#292524' },
  modalSubtitle: { fontSize: 14, fontFamily: 'Mitr', color: '#64748B', marginBottom: 20 },
  input: { 
    backgroundColor: '#F8FAFC', 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    borderRadius: 12, 
    padding: 14, 
    marginBottom: 12, 
    fontSize: 14, 
    fontFamily: 'Mitr', 
    color: '#292524' 
  },
  submitRefundBtn: { backgroundColor: '#6366F1', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  submitRefundText: { color: '#FFF', fontSize: 16, fontFamily: 'Mitr', fontWeight: '600' },

  // ── Image Picker Styles ──
  imagePickerContainer: { marginBottom: 12 },
  imagePickerBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 14, 
    backgroundColor: '#EEF2FF', 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#C7D2FE', 
    borderStyle: 'dashed' 
  },
  imagePickerText: { marginLeft: 8, color: '#6366F1', fontFamily: 'Mitr', fontWeight: '500', fontSize: 14 },
  imagePreviewWrapper: { marginTop: 16, position: 'relative', alignSelf: 'center' },
  imagePreview: { width: 140, height: 180, borderRadius: 16, backgroundColor: '#F1F5F9' },
  removeImageBtn: { position: 'absolute', top: -10, right: -10, backgroundColor: '#FFF', borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 }
});