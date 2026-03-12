import {
    Mitr_400Regular,
    Mitr_500Medium,
    Mitr_600SemiBold,
    useFonts,
} from '@expo-google-fonts/mitr';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';
import { apiRequest } from '../utils/api';

// ─── Progress Stepper ─────────────────────────────────────────────────────────

const STEPS = ['ตะกร้า', 'ชำระเงิน', 'เสร็จสิ้น'];

function ProgressStepper({ activeStep }: { activeStep: number }) {
  return (
    <View style={stepStyles.container}>
      {STEPS.map((step, index) => {
        const isActive = index === activeStep;
        const isDone = index < activeStep;
        return (
          <React.Fragment key={index}>
            <View style={stepStyles.stepWrapper}>
              <View
                style={[
                  stepStyles.circle,
                  isActive && stepStyles.circleActive,
                  isDone && stepStyles.circleDone,
                ]}
              >
                {isDone ? (
                  <Ionicons name="checkmark" size={14} color="#FFF" />
                ) : (
                  <Text
                    style={[
                      stepStyles.circleText,
                      (isActive || isDone) && stepStyles.circleTextActive,
                    ]}
                  >
                    {index + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  stepStyles.stepLabel,
                  isActive && stepStyles.stepLabelActive,
                ]}
              >
                {step}
              </Text>
            </View>
            {index < STEPS.length - 1 && (
              <View
                style={[
                  stepStyles.connector,
                  isDone && stepStyles.connectorDone,
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

// ─── Checkout Screen ──────────────────────────────────────────────────────────

export default function CheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const isTablet = width > 768;

  const [fontsLoaded] = useFonts({ Mitr_400Regular, Mitr_500Medium, Mitr_600SemiBold });

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
      console.log(data);

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
      let finalOrderId: string | undefined = Array.isArray(paramOrderId)
        ? paramOrderId[0]
        : (paramOrderId as string | undefined);

      // Expo Router stringifies undefined route params as the literal "undefined" string.
      // Treat those as absent so the order-creation branch runs correctly.
      if (finalOrderId === 'undefined' || finalOrderId === '') finalOrderId = undefined;

      // ===== สร้าง Order (เหมือนเดิม) =====
      if (!finalOrderId) {
        let targetCartItemIds: string[] = [];

        if (type === 'cart') {
          // ถ้ามาจากหน้าตะกร้า มั่นใจว่า item.id คือ CartItem ID (ไม่ใช่ Sheet ID)
          targetCartItemIds = displayItems.map((item: any) => item.id);
        } else {
          // ถ้ากด "ซื้อทันที" เราจะใช้ Response จากการ Add เพื่อเอา ID มาเลย (แม่นยำกว่าไป Get ใหม่)
          const addResponse = await apiRequest('/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sheetId })
          });

          // 🚨 เช็คว่า Add ลงตะกร้าสำเร็จไหม
          if (!addResponse.ok) {
            throw new Error("ไม่สามารถเพิ่มสินค้าลงตะกร้าได้");
          }

          const addData = await addResponse.json();

          // หา Item ที่เพิ่งเพิ่มเข้าไปในตะกร้า
          const addedItem = addData.items?.find((item: any) => item.sheetId === sheetId);

          if (!addedItem || !addedItem.id) {
            throw new Error("เกิดข้อผิดพลาดในการระบุรหัสสินค้าในตะกร้า");
          }

          targetCartItemIds = [addedItem.id];
        }

        console.log("กำลังจะ Checkout ด้วย Cart Item IDs:", targetCartItemIds);

        // ===== สร้าง Order =====
        const orderResponse = await apiRequest('/order/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cartItemIds: targetCartItemIds })
        });

        const orderData = await orderResponse.json();

        // 🚨 สำคัญมาก: ต้องดัก Error ตรงนี้ ป้องกันไม่ให้ทะลุไปหา Payment Service!
        if (!orderResponse.ok) {
          console.error("Order Checkout Error:", orderData);
          throw new Error(orderData.message || "ไม่สามารถสร้างรายการสั่งซื้อได้ (กรุณาลองใหม่)");
        }

        const orderIdFromRes = orderData.orderId || orderData.id || orderData.data?.orderId || orderData.data?.id;
        finalOrderId = orderIdFromRes;
      }

      // Safety guard — prevent firing the request with a missing/undefined order ID
      if (!finalOrderId) {
        console.error("Missing Order ID");
        throw new Error("ไม่พบ Order ID กรุณาลองใหม่");
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

  // ── Payment Method Card (Left column) ──────────────────────────────────────

  const PaymentMethodCard = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>สรุปรายการสั่งซื้อ</Text>

      {displayItems.map((item: any, index: number) => (
        <View key={index} style={styles.orderItemRow}>
          <View style={styles.orderItemDot} />
          <Text style={styles.orderItemName} numberOfLines={2}>
            {item.sheetName || item.title}
          </Text>
          <Text style={styles.orderItemPrice}>
            ฿{Number(item.price).toLocaleString()}
          </Text>
        </View>
      ))}

      <View style={styles.divider} />

      <Text style={[styles.cardTitle, { marginTop: 4 }]}>วิธีการชำระเงิน</Text>
      <View style={styles.paymentOptionRow}>
        <View style={styles.paymentIconWrap}>
          <Ionicons name="qr-code-outline" size={28} color="#4F46E5" />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.paymentMethodName}>PromptPay (ผ่าน Stripe)</Text>
          <Text style={styles.paymentMethodDesc}>สแกน QR Code ผ่านแอปธนาคาร</Text>
        </View>
        <Ionicons name="checkmark-circle" size={22} color="#4F46E5" />
      </View>
    </View>
  );

  // ── Confirmation Card (Right column) ───────────────────────────────────────

  const ConfirmationCard = () => (
    <View style={styles.confirmCard}>
      <Text style={styles.confirmTitle}>ยอดชำระสุทธิ</Text>
      <Text style={styles.confirmAmount}>฿{Number(price).toLocaleString()}</Text>

      <View style={styles.divider} />

      <View style={styles.secureRow}>
        <Ionicons name="shield-checkmark-outline" size={16} color="#10B981" />
        <Text style={styles.secureText}>ชำระเงินปลอดภัยผ่าน SSL</Text>
      </View>
      <View style={styles.secureRow}>
        <Ionicons name="lock-closed-outline" size={16} color="#4F46E5" />
        <Text style={styles.secureText}>ขับเคลื่อนโดย Stripe</Text>
      </View>

      <TouchableOpacity
        style={[styles.payButton, loading && { opacity: 0.7 }]}
        onPress={handleCreatePayment}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.payButtonText}>ไปหน้าชำระเงิน</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ชำระเงิน</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress Stepper */}
      <View style={styles.stepperWrap}>
        <ProgressStepper activeStep={1} />
      </View>

      {/* Responsive Content */}
      {isTablet ? (
        /* ── Tablet / Desktop: 2-column ── */
        <View style={styles.tabletContent}>
          <ScrollView
            style={styles.leftColumn}
            contentContainerStyle={styles.columnContent}
          >
            <PaymentMethodCard />
          </ScrollView>
          <ScrollView
            style={styles.rightColumn}
            contentContainerStyle={styles.columnContent}
          >
            <ConfirmationCard />
          </ScrollView>
        </View>
      ) : (
        /* ── Mobile: stacked ── */
        <ScrollView contentContainerStyle={styles.mobileContent}>
          <PaymentMethodCard />
          <ConfirmationCard />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Step Styles ──────────────────────────────────────────────────────────────

const stepStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    backgroundColor: '#FFF',
  },
  stepWrapper: { alignItems: 'center' },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleActive: { backgroundColor: '#4F46E5' },
  circleDone: { backgroundColor: '#4F46E5' },
  circleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#979FAF',
    fontFamily: 'Mitr_500Medium',
  },
  circleTextActive: { color: '#FFF' },
  stepLabel: {
    fontSize: 12,
    color: '#979FAF',
    marginTop: 4,
    fontFamily: 'Mitr_400Regular',
  },
  stepLabelActive: { color: '#4F46E5', fontFamily: 'Mitr_600SemiBold' },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginTop: 15,
    marginHorizontal: 4,
  },
  connectorDone: { backgroundColor: '#4F46E5' },
});

// ─── Main Styles ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F6FA' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 8,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Mitr_600SemiBold',
  },
  stepperWrap: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  // Tablet layout
  tabletContent: {
    flex: 1,
    flexDirection: 'row',
    padding: 24,
    gap: 20,
    backgroundColor: '#F5F6FA',
  },
  leftColumn: { flex: 2 },
  rightColumn: { width: 320 },
  columnContent: { paddingBottom: 24, gap: 16 },

  // Mobile layout
  mobileContent: { padding: 16, gap: 16, paddingBottom: 40 },

  // Shared card
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: 'black',
    fontFamily: 'Mitr_600SemiBold',
    marginBottom: 14,
  },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 14 },

  // Order items
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  orderItemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4F46E5',
    flexShrink: 0,
  },
  orderItemName: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
    fontFamily: 'Mitr_400Regular',
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2740C2',
    fontFamily: 'Mitr_500Medium',
  },

  // Payment method row
  paymentOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  paymentIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentMethodName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Mitr_500Medium',
  },
  paymentMethodDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontFamily: 'Mitr_400Regular',
  },

  // Confirmation Card
  confirmCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
  },
  confirmTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: 'black',
    fontFamily: 'Mitr_500Medium',
    marginBottom: 8,
  },
  confirmAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#2740C2',
    fontFamily: 'Mitr_600SemiBold',
    marginBottom: 4,
  },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  secureText: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: 'Mitr_400Regular',
  },

  // Pay Button (black pill per Figma)
  payButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
    marginTop: 16,
  },
  payButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Mitr_600SemiBold',
  },
});