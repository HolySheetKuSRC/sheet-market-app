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
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

export default function CheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const { itemsData, price, type, sheetId, title, sellerName, orderId: paramOrderId } = params;
  const [loading, setLoading] = useState(false);
  // const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

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

  const checkPaymentStatus = async (orderId: string) => {
    try {
      const res = await apiRequest(
        `/payments/order/${orderId}/status`,
        { method: "GET" }
      );

      const data = await res.json();
      
      if (data.status === "PAID") {
        
        router.replace({
          pathname: "../payment-success",
          params: { orderId }
        });
        return true;
      }

      return false;
    } catch (err) {
      return false;
    }
  };

  const handleCreatePayment = async () => {
    if (loading) return;

    try {
      setLoading(true);
      let finalOrderId = Array.isArray(paramOrderId) ? paramOrderId[0] : paramOrderId;

      // ===== สร้าง Order (เหมือนเดิม) =====
      if (!finalOrderId) {
        let targetCartItemIds: string[] = [];

        if (type === 'cart') {
          targetCartItemIds = displayItems.map((item: any) => item.id);
        } else {
          await apiRequest('/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sheetId })
          });

          const cartResponse = await apiRequest('/cart/user', { method: 'GET' });
          const cartData = await cartResponse.json();

          const addedItem = cartData.items?.find((item: any) =>
            (item.sheet && item.sheet.id === sheetId) || item.sheetId === sheetId
          );

          if (!addedItem) throw new Error("ไม่พบสินค้าในตะกร้า");
          targetCartItemIds = [addedItem.id];
        }

        const orderResponse = await apiRequest('/order/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cartItemIds: targetCartItemIds })
        });

        const orderData = await orderResponse.json();
        finalOrderId = orderData.id;
      }

      console.log("Create Stripe Checkout for:", finalOrderId);

      // ===== เรียก Checkout Session (ใหม่) =====
      const res = await apiRequest(
        `/payments/create-checkout-session/${finalOrderId}`,
        { method: 'POST' }
      );

      const data = await res.json();

      if (!res.ok || !data.checkout_url) {
        throw new Error(data.message || "ไม่สามารถสร้างหน้าชำระเงินได้");
      }

      // ===== เปิด Safari =====
      const result = await WebBrowser.openAuthSessionAsync(
        data.checkout_url,
        "growthsheet://payment"
      );

      // 🔥 Polling เช็คสถานะทุก 2 วิ สูงสุด 30 วิ
      let attempts = 0;
      const maxAttempts = 15;

      const interval = setInterval(async () => {
        attempts++;

        const isPaid = await checkPaymentStatus(finalOrderId);

        if (isPaid || attempts >= maxAttempts) {
          clearInterval(interval);
          setLoading(false);
        }
      }, 2000);

    } catch (error: any) {
      Alert.alert("ผิดพลาด", error.message);
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
              <Text style={styles.sellerName}>
                ผู้ขาย: {item.sellerName || 'ไม่ระบุ'}
              </Text>
            </View>
            <Text style={styles.sheetPrice}>
              ฿{Number(item.price).toLocaleString()}
            </Text>
          </View>
        ))}

        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>ยอดชำระสุทธิ</Text>
          <Text style={styles.totalValue}>
            ฿{Number(price).toLocaleString()}
          </Text>
        </View>

        {/* วิธีการชำระเงิน */}
        <View style={styles.paymentMethodSection}>
          <Text style={styles.sectionTitle}>วิธีการชำระเงิน</Text>
          <View style={styles.paymentOption}>
            <Ionicons name="qr-code-outline" size={24} color="#6C63FF" />
            <Text style={styles.paymentOptionText}>
              PromptPay (ผ่าน Stripe)
            </Text>
            <Ionicons name="checkmark-circle" size={24} color="#6C63FF" />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payButton, loading && { opacity: 0.7 }]}
          onPress={handleCreatePayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.payButtonText}>
              ไปหน้าชำระเงิน
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
  // return (
  //   <SafeAreaView style={styles.container}>
  //     <View style={styles.header}>
  //       <TouchableOpacity onPress={() => router.back()}>
  //         <Ionicons name="arrow-back" size={24} color="#333" />
  //       </TouchableOpacity>
  //       <Text style={styles.headerTitle}>ชำระเงิน</Text>
  //       <View style={{ width: 24 }} />
  //     </View>

  //     <ScrollView contentContainerStyle={styles.content}>
  //       <Text style={styles.sectionTitle}>สรุปรายการสั่งซื้อ</Text>
  //       {displayItems.map((item: any, index: number) => (
  //         <View key={index} style={styles.orderCard}>
  //           <View style={styles.sheetInfo}>
  //             <Text style={styles.sheetTitle}>{item.sheetName || item.title}</Text>
  //             <Text style={styles.sellerName}>ผู้ขาย: {item.sellerName || 'ไม่ระบุ'}</Text>
  //           </View>
  //           <Text style={styles.sheetPrice}>฿{Number(item.price).toLocaleString()}</Text>
  //         </View>
  //       ))}

  //       <View style={styles.totalContainer}>
  //         <Text style={styles.totalLabel}>ยอดชำระสุทธิ</Text>
  //         <Text style={styles.totalValue}>฿{Number(price).toLocaleString()}</Text>
  //       </View>

  //       {qrCodeUrl ? (
  //         <View style={styles.qrContainer}>
  //           <Text style={styles.sectionTitle}>สแกนเพื่อชำระเงิน</Text>
  //           <View style={styles.qrWrapper}>
  //             <Image source={{ uri: qrCodeUrl }} style={styles.qrImage} />
  //           </View>
  //           <Text style={styles.qrInstruction}>
  //             กรุณาสแกน QR Code ผ่านแอปธนาคาร{"\n"}ยอดชำระ: ฿{Number(price).toLocaleString()}
  //           </Text>
  //         </View>
  //       ) : (
  //         <View style={styles.paymentMethodSection}>
  //           <Text style={styles.sectionTitle}>วิธีการชำระเงิน</Text>
  //           <View style={styles.paymentOption}>
  //             <Ionicons name="qr-code-outline" size={24} color="#6C63FF" />
  //             <Text style={styles.paymentOptionText}>Thai QR / PromptPay</Text>
  //             <Ionicons name="checkmark-circle" size={24} color="#6C63FF" />
  //           </View>
  //         </View>
  //       )}
  //     </ScrollView>

  //     <View style={styles.footer}>
  //       {!qrCodeUrl ? (
  //         <TouchableOpacity 
  //           style={[styles.payButton, loading && { opacity: 0.7 }]}
  //           onPress={handleCreatePayment}
  //           disabled={loading}
  //         >
  //           {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.payButtonText}>ขอ QR Code ชำระเงิน</Text>}
  //         </TouchableOpacity>
  //       ) : (
  //         <TouchableOpacity 
  //           style={[styles.payButton, { backgroundColor: '#10B981' }]}
  //           onPress={() => router.replace('/order')}
  //         >
  //           <Text style={styles.payButtonText}>ตรวจสอบสถานะ / ไปที่คลัง</Text>
  //         </TouchableOpacity>
  //       )}
  //     </View>
  //   </SafeAreaView>
  // );
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