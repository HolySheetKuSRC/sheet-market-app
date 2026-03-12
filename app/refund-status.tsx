import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    Modal,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { apiRequest } from '../utils/api';
import { getUserIdFromSessionToken } from '../utils/token';

const { width } = Dimensions.get('window');

// ===== Types (ตรงกับ RefundResponseDto.java) =====
interface RefundResponse {
  id: string;
  orderItemId: string;
  userId: string;
  sheetName: string;      
  sheetFileUrl: string;
  reason: string;
  evidenceUrl: string;    // รูปหลักฐานจาก User
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
  status: 'PENDING' | 'REFUNDED' | 'REJECTED';
  refundSlipUrl: string;  // รูปสลิปโอนคืนจาก Admin
  adminId: string;
  adminComment: string;
  createdAt: string;
  updatedAt: string;
}

function formatThaiDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const buddhistYear = d.getFullYear() + 543;
    return `${day}/${month}/${buddhistYear} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} น.`;
  } catch { return dateStr; }
}

function getStatusInfo(status: string) {
  switch (status?.toUpperCase()) {
    case 'REFUNDED':
      return { label: 'คืนเงินสำเร็จ', color: '#10B981', bg: '#D1FAE5', icon: 'checkmark-circle' as const };
    case 'PENDING':
      return { label: 'รอตรวจสอบ', color: '#D97706', bg: '#FEF9C3', icon: 'time' as const };
    case 'REJECTED':
      return { label: 'ถูกปฏิเสธ', color: '#EF4444', bg: '#FEE2E2', icon: 'close-circle' as const };
    default:
      return { label: status, color: '#64748B', bg: '#F1F5F9', icon: 'help-circle' as const };
  }
}

export default function RefundStatusScreen() {
  const router = useRouter();
  const [refunds, setRefunds] = useState<RefundResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // State สำหรับเก็บรูปภาพที่จะแสดงแบบเต็มจอ
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchRefunds = async () => {
    try {
      const userId = await getUserIdFromSessionToken();
      if (!userId) return;

      const response = await apiRequest('/payments/refunds/user', {
        headers: { 'X-USER-ID': userId },
      });

      if (response.ok) {
        const data: RefundResponse[] = await response.json();
        const sortedData = data.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setRefunds(sortedData);
      }
    } catch (err) {
      console.error('Error fetching refunds:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => {
    setLoading(true);
    fetchRefunds();
  }, []));

  const renderRefundItem = ({ item }: { item: RefundResponse }) => {
    const statusInfo = getStatusInfo(item.status);

    return (
      <View style={styles.card}>
        {/* Header Status */}
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
            <Ionicons name={statusInfo.icon} size={14} color={statusInfo.color} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          </View>
          <Text style={styles.dateText}>{formatThaiDate(item.createdAt)}</Text>
        </View>

        {/* Sheet Information */}
        <View style={styles.sheetSection}>
          <View style={styles.sheetIconBox}>
            <Ionicons name="document-text" size={24} color="#6366F1" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sheetName} numberOfLines={1}>{item.sheetName || 'วิชาที่ขอคืนเงิน'}</Text>
            <Text style={styles.orderId}>Order Item: {item.orderItemId?.substring(0, 8)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Text Details */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>เหตุผล:</Text>
          <Text style={styles.detailValue}>{item.reason}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>โอนไปยัง:</Text>
          <Text style={styles.detailValue}>{item.bankName} - {item.bankAccountNumber}</Text>
        </View>

        {/* Image Section (ปรับให้กดดูเต็มจอได้) */}
        <View style={styles.imageGrid}>
          {item.evidenceUrl && (
            <TouchableOpacity 
              style={styles.imageItem} 
              activeOpacity={0.8}
              onPress={() => setSelectedImage(item.evidenceUrl)}
            >
              <Text style={styles.imageTitle}>รูปหลักฐานของคุณ</Text>
              <Image 
                source={{ uri: item.evidenceUrl }} 
                style={styles.imagePreview}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}
          
          {item.status === 'REFUNDED' && item.refundSlipUrl && (
            <TouchableOpacity 
              style={styles.imageItem}
              activeOpacity={0.8}
              onPress={() => setSelectedImage(item.refundSlipUrl)}
            >
              <Text style={[styles.imageTitle, { color: '#10B981' }]}>สลิปโอนคืนจากแอดมิน</Text>
              <Image 
                source={{ uri: item.refundSlipUrl }} 
                style={[styles.imagePreview, { borderColor: '#BBF7D0', borderWidth: 1 }]}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Admin Feedback */}
        {item.adminComment && (
          <View style={[styles.adminBox, item.status === 'REJECTED' ? styles.adminBoxRejected : styles.adminBoxSuccess]}>
            <Text style={styles.adminLabel}>หมายเหตุจากแอดมิน:</Text>
            <Text style={styles.adminText}>{item.adminComment}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#292524" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>สถานะการคืนเงิน</Text>
        <TouchableOpacity style={styles.navBtn} onPress={() => { setLoading(true); fetchRefunds(); }}>
          <Ionicons name="refresh" size={20} color="#6366F1" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : (
        <FlatList
          data={refunds}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRefunds(); }} />}
          renderItem={renderRefundItem}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={80} color="#E2E8F0" />
              <Text style={styles.emptyText}>ไม่พบประวัติการคืนเงิน</Text>
            </View>
          }
        />
      )}

      {/* Modal สำหรับแสดงรูปภาพแบบเต็มจอ */}
      <Modal 
        visible={!!selectedImage} 
        transparent={true} 
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modalBackground}>
          <TouchableOpacity 
            style={styles.closeModalBtn} 
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close" size={32} color="#FFF" />
          </TouchableOpacity>
          
          {selectedImage && (
            <Image 
              source={{ uri: selectedImage }} 
              style={styles.fullScreenImage} 
              resizeMode="contain" 
            />
          )}
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingTop: 50, 
    paddingBottom: 16, 
    backgroundColor: '#FFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9' 
  },
  headerTitle: { fontSize: 18, fontFamily: 'Mitr', fontWeight: '600', color: '#292524' },
  navBtn: { padding: 4 },
  list: { padding: 16 },
  card: { 
    backgroundColor: '#FFF', 
    borderRadius: 24, 
    padding: 16, 
    marginBottom: 16, 
    elevation: 3, 
    shadowColor: '#000', 
    shadowOpacity: 0.08, 
    shadowRadius: 12 
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, gap: 4 },
  statusText: { fontSize: 13, fontFamily: 'Mitr', fontWeight: '600' },
  dateText: { fontSize: 12, fontFamily: 'Mitr', color: '#94A3B8' },
  sheetSection: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sheetIconBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  sheetName: { fontSize: 16, fontFamily: 'Mitr', fontWeight: '600', color: '#1E293B' },
  orderId: { fontSize: 12, fontFamily: 'Mitr', color: '#64748B' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 16 },
  detailRow: { flexDirection: 'row', marginBottom: 8 },
  detailLabel: { width: 70, fontSize: 14, fontFamily: 'Mitr', color: '#94A3B8' },
  detailValue: { flex: 1, fontSize: 14, fontFamily: 'Mitr', color: '#334155' },
  // Image Styles
  imageGrid: { flexDirection: 'row', gap: 12, marginTop: 12 },
  imageItem: { flex: 1 },
  imageTitle: { fontSize: 11, fontFamily: 'Mitr', color: '#94A3B8', marginBottom: 6 },
  imagePreview: { width: '100%', height: 150, borderRadius: 12, backgroundColor: '#F1F5F9' },
  // Admin Box Styles
  adminBox: { marginTop: 16, padding: 14, borderRadius: 16 },
  adminBoxRejected: { backgroundColor: '#FFF1F2' },
  adminBoxSuccess: { backgroundColor: '#F0FDF4' },
  adminLabel: { fontSize: 12, fontFamily: 'Mitr', fontWeight: '600', color: '#475569', marginBottom: 4 },
  adminText: { fontSize: 13, fontFamily: 'Mitr', color: '#475569', lineHeight: 18 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, alignItems: 'center', marginTop: 100, gap: 16 },
  emptyText: { fontSize: 16, fontFamily: 'Mitr', color: '#94A3B8' },
  
  // Modal Styles
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeModalBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  fullScreenImage: {
    width: '100%',
    height: '80%',
  }
});