import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
      const orderRes = await apiRequest('/order/user', { method: 'GET' });
      const refundRes = await apiRequest('/payments/refunds/user', { method: 'GET' });

      if (orderRes.ok) {
        const ordersData = await orderRes.json();
        let refundsData = [];
        if (refundRes.ok) {
          refundsData = await refundRes.json();
        }

        const refundMap = new Map();
        refundsData.forEach((r: any) => {
          refundMap.set(r.orderItemId, r.status);
        });

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

        const sortedData = enrichedOrders.sort((a: any, b: any) =>
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
    Alert.alert(
      'ยกเลิกออเดอร์',
      'คุณต้องการยกเลิกออเดอร์นี้ใช่หรือไม่?',
      [
        { text: 'ไม่ใช่', style: 'cancel' },
        { text: 'ยืนยันยกเลิก', style: 'destructive', onPress: () => confirmCancelOrder(orderId) },
      ]
    );
  }, []);

  const confirmCancelOrder = async (orderId: string) => {
    try {
      setCancellingId(orderId);
      const response = await apiRequest(`/order/${orderId}/cancel`, { method: 'PATCH' });
      if (response.ok) {
        Alert.alert('สำเร็จ', 'ยกเลิกออเดอร์เรียบร้อยแล้ว');
        fetchOrders();
      }
    } catch (error) {
      Alert.alert('เกิดข้อผิดพลาด', 'กรุณาลองใหม่อีกครั้ง');
    } finally {
      setCancellingId(null);
    }
  };

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
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          uploadedEvidenceUrl = uploadData.url;
        }
      }

      const payload = {
        orderItemId: refundTarget.itemId,
        reason: refundReason,
        bankName,
        bankAccountName,
        bankAccountNumber,
        evidenceUrl: uploadedEvidenceUrl
      };

      const response = await apiRequest("/payments/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        Alert.alert("สำเร็จ", "ส่งคำขอคืนเงินเรียบร้อยแล้ว");
        setRefundModalVisible(false);
        fetchOrders();
      }
    } catch (error) {
      Alert.alert("ข้อผิดพลาด", "เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PAID': return { text: 'ชำระแล้ว', color: '#10B981', bg: '#D1FAE5' };
      case 'PENDING': return { text: 'รอชำระเงิน', color: '#D97706', bg: '#FEF9C3' };
      case 'CANCELLED': return { text: 'ยกเลิกแล้ว', color: '#EF4444', bg: '#FEE2E2' };
      default: return { text: status, color: '#64748B', bg: '#F1F5F9' };
    }
  };

  const OrderCard = useCallback(({ item }: { item: Order }) => {
    const statusInfo = getStatusInfo(item.status);
    const isPending = item.status === 'PENDING';
    const isPaid = item.status === 'PAID';
    const canRefund = isRefundable(item.createdAt);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.orderIdText}>#{item.orderId.substring(0, 8).toUpperCase()}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.text}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {item.items.map((sheet, index) => {
          const itemId = sheet.id || sheet.orderItemId || sheet.sheetId;
          return (
            <View key={index} style={styles.sheetRowContainer}>
              <View style={styles.sheetRow}>
                <View style={styles.sheetIconBox}><Ionicons name="document-text" size={20} color="#6366F1" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetName} numberOfLines={1}>{sheet.sheetName}</Text>
                  <Text style={styles.sellerName}>{sheet.sellerName}</Text>
                </View>
                <Text style={styles.sheetPrice}>฿{Number(sheet.price).toLocaleString()}</Text>
              </View>
              {isPaid && (
                <View style={styles.refundRow}>
                  {sheet.refundStatus === 'PENDING' ? <Text style={styles.refundedText}>กำลังตรวจสอบการคืนเงิน</Text> :
                    (sheet.refundStatus === 'REFUNDED' || sheet.isRefunded) ? <Text style={[styles.refundedText, { color: '#10B981' }]}>คืนเงินสำเร็จ</Text> :
                      sheet.refundStatus === 'REJECTED' ? <Text style={[styles.refundedText, { color: '#EF4444' }]}>ถูกปฏิเสธการคืนเงิน</Text> :
                        canRefund ? (
                          <TouchableOpacity style={styles.refundBtn} onPress={() => openRefundModal(item.orderId, itemId, sheet.sheetName)}>
                            <Text style={styles.refundBtnText}>ขอคืนเงิน</Text>
                          </TouchableOpacity>
                        ) : <Text style={styles.expiredRefundText}>หมดเขตขอคืนเงิน</Text>}
                </View>
              )}
            </View>
          );
        })}

        <View style={styles.divider} />
        <View style={styles.cardFooter}>
          <Text style={styles.totalLabel}>ยอดสุทธิ</Text>
          <Text style={styles.totalAmount}>฿{Number(item.totalPrice).toLocaleString()}</Text>
        </View>

        {isPending && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => handleCancelOrder(item.orderId)}>
              <Text style={styles.cancelText}>ยกเลิก</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.payNowButton} onPress={() => router.push({ pathname: '/checkout', params: { orderId: item.orderId, price: item.totalPrice.toString(), type: 're-payment' } } as any)}>
              <Text style={styles.payNowText}>ชำระเงิน</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }, [cancellingId]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#292524" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>ประวัติการสั่งซื้อ</Text>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.push('/refund-status' as any)}
        >
          <View style={styles.refundStatusBtn}>
            <Ionicons name="receipt-outline" size={20} color="#6366F1" />
            <Text style={styles.refundStatusText}>สถานะคืนเงิน</Text>
          </View>
        </TouchableOpacity>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.orderId}
        renderItem={({ item }) => <OrderCard item={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchOrders()} colors={['#6C63FF']} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={72} color="#E2E8F0" />
            <Text style={styles.emptyTitle}>ยังไม่มีรายการสั่งซื้อ</Text>
          </View>
        }
      />

      <Modal visible={refundModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ width: '100%', alignItems: 'center' }}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>ขอคืนเงิน</Text>
                <TouchableOpacity onPress={() => setRefundModalVisible(false)}><Ionicons name="close" size={24} color="#64748B" /></TouchableOpacity>
              </View>
              <Text style={styles.modalSubtitle}>วิชา: {refundTarget?.sheetName}</Text>

              <TextInput style={[styles.input, { height: 80 }]} placeholder="ระบุเหตุผล *" multiline value={refundReason} onChangeText={setRefundReason} />
              <TextInput style={styles.input} placeholder="ธนาคาร *" value={bankName} onChangeText={setBankName} />
              <TextInput style={styles.input} placeholder="เลขที่บัญชี *" keyboardType="numeric" value={bankAccountNumber} onChangeText={setBankAccountNumber} />
              <TextInput style={styles.input} placeholder="ชื่อบัญชี *" value={bankAccountName} onChangeText={setBankAccountName} />

              <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
                <Ionicons name="image-outline" size={20} color="#6366F1" />
                <Text style={styles.imagePickerText}>{evidenceFile ? "เปลี่ยนรูปภาพ" : "แนบหลักฐาน (สลิป)"}</Text>
              </TouchableOpacity>

              {evidenceFile && <Image source={{ uri: evidenceFile.uri }} style={styles.imagePreview} />}

              <TouchableOpacity style={[styles.submitRefundBtn, isSubmittingRefund && styles.disabledButton]} onPress={submitRefund} disabled={isSubmittingRefund}>
                <Text style={styles.submitRefundText}>{isSubmittingRefund ? "กำลังส่ง..." : "ส่งคำขอคืนเงิน"}</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingTop: 50, paddingBottom: 15, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerButton: { padding: 8, minWidth: 45 },
  headerTitle: { fontSize: 18, fontFamily: 'Mitr', fontWeight: '600', color: '#292524' },
  refundStatusBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99 },
  refundStatusText: { marginLeft: 4, fontSize: 12, fontFamily: 'Mitr', color: '#6366F1', fontWeight: '600' },
  listContent: { padding: 16 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderIdText: { fontSize: 15, fontFamily: 'Mitr', fontWeight: '600', color: '#292524' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 99 },
  statusText: { fontSize: 12, fontFamily: 'Mitr', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 16 },
  sheetRowContainer: { marginBottom: 16 },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sheetIconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  sheetName: { fontSize: 15, fontFamily: 'Mitr', fontWeight: '500', color: '#292524', flex: 1 },
  sellerName: { fontSize: 12, fontFamily: 'Mitr', color: '#64748B' },
  sheetPrice: { fontSize: 15, fontFamily: 'Mitr', color: '#292524', fontWeight: '600' },
  refundRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  refundBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#FFF5F5', borderWidth: 1, borderColor: '#FECACA' },
  refundBtnText: { color: '#EF4444', fontSize: 12, fontFamily: 'Mitr', fontWeight: '600' },
  refundedText: { color: '#D97706', fontSize: 12, fontFamily: 'Mitr', fontWeight: '500' },
  expiredRefundText: { color: '#94A3B8', fontSize: 12, fontFamily: 'Mitr' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 15, fontFamily: 'Mitr', color: '#64748B' },
  totalAmount: { fontSize: 20, fontFamily: 'Mitr', fontWeight: '600', color: '#6366F1' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelButton: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#FECACA' },
  cancelText: { color: '#EF4444', fontFamily: 'Mitr', fontWeight: '600' },
  payNowButton: { flex: 1.5, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: '#6366F1' },
  payNowText: { color: '#FFF', fontFamily: 'Mitr', fontWeight: '600' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyTitle: { marginTop: 16, fontSize: 18, fontFamily: 'Mitr', color: '#475569' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', maxWidth: 400, backgroundColor: '#FFF', borderRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 20, fontFamily: 'Mitr', fontWeight: '600' },
  modalSubtitle: { fontSize: 14, fontFamily: 'Mitr', color: '#64748B', marginBottom: 20 },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    fontFamily: 'Mitr'
  },
  imagePickerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, backgroundColor: '#EEF2FF', borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#C7D2FE', marginBottom: 12 },
  imagePickerText: { marginLeft: 8, color: '#6366F1', fontFamily: 'Mitr', fontSize: 14 },
  imagePreview: { width: 100, height: 130, borderRadius: 12, alignSelf: 'center', marginBottom: 12 },
  submitRefundBtn: { backgroundColor: '#6366F1', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  submitRefundText: { color: '#FFF', fontSize: 16, fontFamily: 'Mitr', fontWeight: '600' },
  disabledButton: { opacity: 0.5 }
});