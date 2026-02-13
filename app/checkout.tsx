import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import base64 from 'react-native-base64';

export default function CheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // ✅ รับค่ารองรับทั้งจากหน้า [id] และหน้า Cart
  const { itemsData, price, type, sheetId, title, sellerName } = params;
  const [loading, setLoading] = useState(false);

  const PKEY = process.env.EXPO_PUBLIC_OMISE_PKEY;

  // ✅ จัดการข้อมูลรายการสินค้าที่จะแสดงผล (รองรับทั้งซื้อชิ้นเดียวและจากตะกร้า)
  const displayItems = useMemo(() => {
    if (type === 'cart' && itemsData) {
      // ถ้ามาจากตะกร้า ให้แกะ JSON String ออกมาเป็น Array
      return JSON.parse(itemsData as string);
    } else {
      // ถ้ามาจากหน้า [id] (Quick Buy) ให้จำลองเป็น Array 1 ชิ้น
      return [{
        id: sheetId,
        sheetName: title,
        sellerName: sellerName,
        price: price
      }];
    }
  }, [itemsData, type]);

  const handleCreatePayment = async () => {
    if (!PKEY) {
      Alert.alert("Error", "PKEY is missing");
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
      if (!omiseResponse.ok) throw new Error(sourceData.message);

      console.log("✅ Got Source ID:", sourceData.id);
      Alert.alert("Omise Success", `Source ID: ${sourceData.id}\nยอดชำระ: ฿${price}`);

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
        
        {/* ✅ วนลูปแยก Card สินค้าออกมาแต่ละชิ้น */}
        {displayItems.map((item: any, index: number) => (
          <View key={index} style={styles.orderCard}>
            <View style={styles.sheetInfo}>
              <Text style={styles.sheetTitle}>{item.sheetName || item.title}</Text>
              <Text style={styles.sellerName}>ผู้ขาย: {item.sellerName || 'ไม่ระบุ'}</Text>
            </View>
            
            {/* ✅ แก้ไข: ลบเงื่อนไข type !== 'cart' ออก เพื่อให้แสดงราคาเสมอ */}
            <Text style={styles.sheetPrice}>฿{Number(item.price).toLocaleString()}</Text>
            
          </View>
        ))}

        {/* ส่วนยอดรวม (Summary) */}
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>ยอดชำระสุทธิ</Text>
          <Text style={styles.totalValue}>฿{Number(price).toLocaleString()}</Text>
        </View>

        <View style={styles.paymentMethodSection}>
          <Text style={styles.sectionTitle}>วิธีการชำระเงิน</Text>
          <View style={styles.paymentOption}>
            <Ionicons name="qr-code-outline" size={24} color="#6C63FF" />
            <Text style={styles.paymentOptionText}>Thai QR / PromptPay</Text>
            <Ionicons name="checkmark-circle" size={24} color="#6C63FF" />
          </View>
        </View>
      </ScrollView>

      {/* Footer Button */}
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
});