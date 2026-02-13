import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { apiRequest } from '../utils/api';

export default function CheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const { itemsData, price, type, sheetId, title, sellerName, orderId: paramOrderId } = params;
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  // ✅ จัดการข้อมูลสินค้า (รองรับทั้งจากตระกร้า และซื้อทันที)
  const displayItems = useMemo(() => {
    if ((type === 're-payment' || type === 'cart') && itemsData) {
      try {
        return typeof itemsData === 'string' ? JSON.parse(itemsData) : itemsData;
      } catch (e) {
        return [];
      }
    } 
    return [{ id: sheetId, sheetName: title, sellerName: sellerName, price: price }];
  }, [itemsData, type, sheetId, title, sellerName, price]);

  const handleCreatePayment = async () => {
    if (loading) return;

    try {
      setLoading(true);
      let finalOrderId = Array.isArray(paramOrderId) ? paramOrderId[0] : paramOrderId;

      // --- ส่วนที่ 1: ตรวจสอบ/สร้าง Order (กรณี Quick Buy หรือ Cart) ---
      if (!finalOrderId) {
        let targetCartItemIds: string[] = [];

        if (type === 'cart') {
          targetCartItemIds = displayItems.map((item: any) => item.id);
        } else {
          // กรณี Quick Buy: เพิ่มลงตะกร้าก่อน
          await apiRequest('/cart', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sheetId: sheetId }) 
          });

          const cartResponse = await apiRequest('/cart/user', { method: 'GET' });
          const cartData = await cartResponse.json();
          const addedItem = cartData.items?.find((item: any) => 
              (item.sheet && item.sheet.id === sheetId) || item.sheetId === sheetId
          );
          if (!addedItem) throw new Error("ไม่พบสินค้าในระบบตะกร้า");
          targetCartItemIds = [addedItem.id];
        }

        // สร้าง Order ใหม่
        const orderResponse = await apiRequest('/order/checkout', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cartItemIds: targetCartItemIds })
        });
        
        if (!orderResponse.ok) throw new Error("สร้างรายการสั่งซื้อไม่สำเร็จ");
        const orderData = await orderResponse.json();
        finalOrderId = orderData.id;
      }

      console.log("📌 กำลังขอ QR Code สำหรับ Order ID:", finalOrderId);

      // --- ส่วนที่ 2: สร้าง Payment Charge (ขอ QR Code) ---
      // ✅ แก้ไขสำคัญ: ส่งเป็น JSON String ของ UUID โดยตรง (ไม่ใช่ Object)
      // ตาม Backend: @RequestBody UUID orderId
      const paymentResponse = await apiRequest('/payments/create-charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalOrderId), 
      });

      const paymentData = await paymentResponse.json();

      if (!paymentResponse.ok) {
        // หากเจอ Error 401/500 จาก Backend (Internal Server Error)
        throw new Error(paymentData.message || "ระบบ Backend ขัดข้อง (ตรวจสอบการเชื่อมต่อระหว่าง Service)");
      }

      // --- ส่วนที่ 3: รับข้อมูล QR Code ---
      // Backend คืนค่า success, qr_url, และอื่นๆ
      if (paymentData.success && paymentData.qr_url) {
        setQrCodeUrl(paymentData.qr_url);
      } else {
        throw new Error(paymentData.message || "ไม่ได้รับ QR Code จากระบบ");
      }

    } catch (error: any) {
      console.error("Payment Process Error:", error);
      Alert.alert("ผิดพลาด", error.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ชำระเงิน</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>สรุปรายการสั่งซื้อ</Text>
        {displayItems.map((item: any, index: number) => (
          <View key={index} style={styles.orderCard}>
            <View style={styles.sheetInfo}>
              <Text style={styles.sheetTitle}>{item.sheetName || item.title}</Text>
              <Text style={styles.sellerName}>ผู้ขาย: {item.sellerName || 'ไม่ระบุ'}</Text>
            </View>
            <Text style={styles.sheetPrice}>฿{Number(item.price).toLocaleString()}</Text>
          </View>
        ))}

        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>ยอดชำระสุทธิ</Text>
          <Text style={styles.totalValue}>฿{Number(price).toLocaleString()}</Text>
        </View>

        {qrCodeUrl ? (
          <View style={styles.qrContainer}>
            <Text style={styles.sectionTitle}>สแกนเพื่อชำระเงิน</Text>
            <View style={styles.qrWrapper}>
              <Image source={{ uri: qrCodeUrl }} style={styles.qrImage} />
            </View>
            <Text style={styles.qrInstruction}>
              กรุณาสแกน QR Code ผ่านแอปธนาคาร{"\n"}ยอดชำระ: ฿{Number(price).toLocaleString()}
            </Text>
          </View>
        ) : (
          <View style={styles.paymentMethodSection}>
            <Text style={styles.sectionTitle}>วิธีการชำระเงิน</Text>
            <View style={styles.paymentOption}>
              <Ionicons name="qr-code-outline" size={24} color="#6C63FF" />
              <Text style={styles.paymentOptionText}>Thai QR / PromptPay</Text>
              <Ionicons name="checkmark-circle" size={24} color="#6C63FF" />
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {!qrCodeUrl ? (
          <TouchableOpacity 
            style={[styles.payButton, loading && { opacity: 0.7 }]}
            onPress={handleCreatePayment}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.payButtonText}>ขอ QR Code ชำระเงิน</Text>}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.payButton, { backgroundColor: '#10B981' }]}
            onPress={() => router.replace('/order')}
          >
            <Text style={styles.payButtonText}>ตรวจสอบสถานะ / ไปที่คลัง</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  content: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: 12 },
  orderCard: { flexDirection: 'row', backgroundColor: '#FFF', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, elevation: 2 },
  sheetInfo: { flex: 1 },
  sheetTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  sellerName: { fontSize: 13, color: '#64748B', marginTop: 4 },
  sheetPrice: { fontSize: 16, fontWeight: 'bold', color: '#6C63FF' },
  totalContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20, borderTopWidth: 1, borderTopColor: '#E2E8F0', marginTop: 10 },
  totalLabel: { fontSize: 16, color: '#475569' },
  totalValue: { fontSize: 24, fontWeight: '900', color: '#6C63FF' },
  paymentMethodSection: { marginTop: 10 },
  paymentOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#6C63FF' },
  paymentOptionText: { flex: 1, marginLeft: 12, fontWeight: '600', color: '#1E293B' },
  footer: { padding: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingBottom: 40 },
  payButton: { backgroundColor: '#6C63FF', padding: 18, borderRadius: 15, alignItems: 'center' },
  payButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  qrContainer: { alignItems: 'center', backgroundColor: '#FFF', padding: 20, borderRadius: 16, marginTop: 10, elevation: 2 },
  qrWrapper: { padding: 10, backgroundColor: '#FFF', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', marginVertical: 15 },
  qrImage: { width: 250, height: 250, resizeMode: 'contain' },
  qrInstruction: { textAlign: 'center', color: '#64748B', lineHeight: 22, fontSize: 14 }
});