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
  
  // orderId จะถูกส่งมาจากหน้า order.tsx ในกรณี "ชำระเงินต่อ"
  const { itemsData, price, type, sheetId, title, sellerName, orderId: paramOrderId } = params;
  const [loading, setLoading] = useState(false);
  
  // State สำหรับเก็บ QR Code ที่ได้จาก Backend
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  // ✅ จัดการข้อมูลรายการสินค้าที่จะแสดงผล (รองรับทั้ง Re-payment, Cart และ Quick Buy)
  const displayItems = useMemo(() => {
    // กรณีมาจากหน้า order.tsx หรือจากตะกร้า จะส่ง itemsData เป็น JSON String มาให้
    if ((type === 're-payment' || type === 'cart') && itemsData) {
      try {
        return JSON.parse(itemsData as string);
      } catch (e) {
        console.error("Parse itemsData error:", e);
        return [];
      }
    } 
    
    // กรณีมาจากหน้า [id] (Quick Buy)
    return [{
      id: sheetId,
      sheetName: title,
      sellerName: sellerName,
      price: price
    }];
  }, [itemsData, type, sheetId, title, sellerName, price]);

  const handleCreatePayment = async () => {
    try {
      setLoading(true);
      let finalOrderId = paramOrderId as string;

      // --- ส่วนที่ 1: ตรวจสอบ/สร้าง Order ---
      if (!finalOrderId) {
        let targetCartItemIds: string[] = [];

        if (type === 'cart') {
          targetCartItemIds = displayItems.map((item: any) => item.id);
        } else {
          // กรณี Quick Buy: ต้องเพิ่มลงตะกร้าก่อน
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

        // ยิง API สร้าง Order
        const orderResponse = await apiRequest('/order/checkout', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cartItemIds: targetCartItemIds 
            })
        });
        
        if (!orderResponse.ok) {
          const errorData = await orderResponse.json();
          throw new Error(errorData.message || "สร้างรายการสั่งซื้อไม่สำเร็จ");
        }

        const orderData = await orderResponse.json();
        finalOrderId = orderData.id;
        console.log("✅ Order Created ID:", finalOrderId);
      } else {
        console.log("🔄 Re-paying for Order ID:", finalOrderId);
      }

      // --- ส่วนที่ 2: สร้าง Payment Charge (ขอ QR Code) ---
      const paymentResponse = await apiRequest('/payments/create-charge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalOrderId), 
      });

      const paymentData = await paymentResponse.json();

      if (!paymentResponse.ok) {
        throw new Error(paymentData.message || "สร้างการชำระเงินไม่สำเร็จ");
      }

      // --- ส่วนที่ 3: แสดงผล QR Code ---
      if (paymentData.success && paymentData.qr_url) {
        setQrCodeUrl(paymentData.qr_url);
        Alert.alert("สำเร็จ", "กรุณาสแกน QR Code เพื่อชำระเงิน");
      } else {
        throw new Error("ไม่ได้รับ QR Code จากระบบ");
      }

    } catch (error: any) {
      console.error("Payment Error:", error);
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
        
        {/* ✅ แสดงรายการสินค้าจากการแมปข้อมูล (รองรับทุกกรณีรวมถึง re-payment) */}
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
              <Image 
                source={{ uri: qrCodeUrl }} 
                style={styles.qrImage} 
              />
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
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.payButtonText}>
                {type === 're-payment' ? 'ขอ QR Code ชำระเงิน' : `ยืนยันการชำระเงิน ฿${Number(price).toLocaleString()}`}
              </Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.payButton, { backgroundColor: '#10B981' }]}
            onPress={() => {
                Alert.alert("แจ้งเตือน", "ระบบกำลังตรวจสอบยอดเงิน สินค้าจะถูกเพิ่มเข้าคลังอัตโนมัติเมื่อชำระเสร็จสิ้น");
                router.replace('/order'); 
            }}
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
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
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
    marginTop: 10,
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
  footer: { padding: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingBottom: 40 },
  payButton: { backgroundColor: '#6C63FF', padding: 18, borderRadius: 15, alignItems: 'center' },
  payButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  qrContainer: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    marginTop: 10,
    elevation: 2,
  },
  qrWrapper: {
    padding: 10,
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 15,
  },
  qrImage: {
    width: 250,
    height: 250,
    resizeMode: 'contain',
  },
  qrInstruction: {
    textAlign: 'center',
    color: '#64748B',
    lineHeight: 22,
    fontSize: 14,
  }
});