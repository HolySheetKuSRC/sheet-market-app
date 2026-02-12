import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
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
import base64 from 'react-native-base64';
import { apiRequest } from '../utils/api'; // ตรวจสอบ path ของ api.ts อีกครั้ง

export default function CheckoutScreen() {
  const router = useRouter();
  const { sheetId, title, price, sellerName } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  // ดึงค่าจาก ENV (EXPO_PUBLIC_OMISE_PKEY)
  const PKEY = process.env.EXPO_PUBLIC_OMISE_PKEY;

  const handleCreatePayment = async () => {
    if (!PKEY) {
      Alert.alert("Error", "ไม่พบข้อมูล PKEY ในระบบ");
      return;
    }

    try {
      setLoading(true);

      // STEP 1: ขอ Source ID จาก Omise API (PromptPay)
      const omiseResponse = await fetch('https://api.omise.co/sources', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${base64.encode(PKEY + ':')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(Number(price) * 100), // แปลงเป็นหน่วยสตางค์
          currency: 'thb',
          type: 'promptpay',
        }),
      });

      const sourceData = await omiseResponse.json();
      
      if (!omiseResponse.ok) throw new Error(sourceData.message || "Omise Error");

      console.log("✅ Got Source ID:", sourceData.id);

      // STEP 2: ส่ง Source ID ไปที่ Backend (Spring Boot)
      const backendResponse = await apiRequest('/api/order/checkout', {
        method: 'POST',
        body: JSON.stringify({
          sheetId: sheetId,
          sourceId: sourceData.id,
          amount: price
        }),
      });

      if (backendResponse.ok) {
        const orderData = await backendResponse.json();
        // Backend ควรส่ง paymentUrl (QR Code) กลับมาให้
        setQrCodeUrl(orderData.paymentUrl); 
      } else {
        Alert.alert("Error", "ไม่สามารถสร้างรายการคำสั่งซื้อได้ (CORS?)");
      }

    } catch (error: any) {
      Alert.alert("การชำระเงินล้มเหลว", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ชำระเงิน</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>สรุปรายการสั่งซื้อ</Text>
        
        <View style={styles.orderCard}>
          <View style={styles.sheetInfo}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <Text style={styles.sellerName}>ผู้ขาย: {sellerName}</Text>
          </View>
          <Text style={styles.sheetPrice}>฿{Number(price).toLocaleString()}</Text>
        </View>

        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>ยอดชำระสุทธิ</Text>
          <Text style={styles.totalValue}>฿{Number(price).toLocaleString()}</Text>
        </View>

        {/* ส่วนแสดง QR Code เมื่อสร้างสำเร็จ */}
        {qrCodeUrl ? (
          <View style={styles.qrSection}>
            <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>Thai QR Payment</Text>
            <View style={styles.qrCard}>
              <Image source={{ uri: qrCodeUrl }} style={styles.qrImage} />
              <Text style={styles.qrHint}>สแกน QR Code เพื่อชำระเงิน</Text>
              <ActivityIndicator size="small" color="#6C63FF" style={{ marginTop: 10 }} />
              <Text style={styles.waitingText}>กำลังรอการยืนยันยอดเงิน...</Text>
            </View>
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

      {/* Footer Button (ซ่อนเมื่อมี QR Code แล้ว) */}
      {!qrCodeUrl && (
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
                ยืนยันการชำระเงิน ฿{Number(price).toLocaleString()}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  content: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: 12 },
  orderCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    elevation: 2,
  },
  sheetInfo: { flex: 1 },
  sheetTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  sellerName: { fontSize: 13, color: '#64748B', marginTop: 4 },
  sheetPrice: { fontSize: 16, fontWeight: 'bold', color: '#6C63FF' },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  totalLabel: { fontSize: 16, color: '#475569' },
  totalValue: { fontSize: 24, fontWeight: '900', color: '#6C63FF' },
  paymentMethodSection: { marginTop: 10 },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6C63FF',
  },
  paymentOptionText: { flex: 1, marginLeft: 12, fontWeight: '600', color: '#1E293B' },
  qrSection: { marginTop: 10, alignItems: 'center' },
  qrCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    width: '100%',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  qrImage: { width: 250, height: 250 },
  qrHint: { marginTop: 15, color: '#64748B', fontSize: 14 },
  waitingText: { color: '#6C63FF', marginTop: 5, fontWeight: '600', fontSize: 12 },
  footer: { padding: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingBottom: 40 },
  payButton: { backgroundColor: '#6C63FF', padding: 18, borderRadius: 15, alignItems: 'center' },
  payButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});