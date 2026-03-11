import {
  Mitr_400Regular,
  Mitr_500Medium,
  Mitr_600SemiBold,
  useFonts,
} from '@expo-google-fonts/mitr';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import { apiRequest } from '../../utils/api';

interface CartItem {
  id: string;
  sheetName: string;
  price: string;
  sellerName: string;
}

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

// ─── Book Cover Placeholder ───────────────────────────────────────────────────

const BOOK_COLORS = ['#4F46E5', '#7C3AED', '#2563EB', '#0891B2', '#0D9488', '#DC2626'];

function BookCover({ title, colorIndex }: { title: string; colorIndex: number }) {
  const color = BOOK_COLORS[colorIndex % BOOK_COLORS.length];
  const initials = title.substring(0, 2);
  return (
    <View style={[bookStyles.cover, { backgroundColor: color }]}>
      <View style={bookStyles.spine} />
      <Text style={bookStyles.initials}>{initials}</Text>
    </View>
  );
}

export default function CartScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const isTablet = width > 768;

  const [fontsLoaded] = useFonts({ Mitr_400Regular, Mitr_500Medium, Mitr_600SemiBold });

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoCode, setPromoCode] = useState('');

  // ── Data Fetching ──────────────────────────────────────────────────────────

  const fetchCartData = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/cart/user', { method: 'GET' });

      if (response.status === 429) {
        console.warn('Too many requests, retry later');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        const items: CartItem[] = (data.items || []).map((item: any) => ({
          id: String(item.id),
          sheetName: item.sheetName ?? 'ไม่ระบุชื่อสินค้า',
          price: String(item.price ?? '0'),
          sellerName: item.sellerName ?? '-',
        }));
        setCartItems(items);
        setSelectedIds(items.map((i) => i.id));
      } else {
        console.error('Fetch failed status:', response.status);
      }
    } catch (err) {
      console.error('Fetch cart error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartData();
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleRemoveItem = async (cartItemId: string) => {
    console.log('Delete button pressed. cartItemId:', cartItemId);
    try {
      const response = await apiRequest('/cart', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemIds: [cartItemId] }),
      });

      if (response.ok) {
        console.log('Delete success:', cartItemId);
        setCartItems((prev) => prev.filter((item) => item.id !== cartItemId));
        setSelectedIds((prev) => prev.filter((id) => id !== cartItemId));
      } else {
        console.log('Delete failed. status:', response.status);
        Alert.alert('ผิดพลาด', 'ลบสินค้าไม่สำเร็จ');
      }
    } catch (error) {
      console.log('Delete error:', error);
      Alert.alert('Error', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const subtotal = cartItems
    .filter((item) => selectedIds.includes(item.id))
    .reduce((sum, item) => sum + Number(item.price || 0), 0);
  const discount = 0;
  const totalPrice = subtotal - discount;

  const handleCheckout = () => {
    if (selectedIds.length === 0) return;
    const selectedItems = cartItems.filter((item) => selectedIds.includes(item.id));
    router.push({
      pathname: '/checkout',
      params: {
        itemsData: JSON.stringify(selectedItems),
        price: totalPrice.toString(),
        type: 'cart',
      },
    } as any);
  };

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  // ── Item Renderer ──────────────────────────────────────────────────────────

  const renderItem = (item: CartItem, index: number) => {
    const isSelected = selectedIds.includes(item.id);
    return (
      <View
        key={item.id}
        style={[styles.itemCard, isSelected && styles.itemCardSelected]}
      >
        <TouchableOpacity
          onPress={() => toggleSelect(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 15 }}
        >
          <Ionicons
            name={isSelected ? 'checkbox' : 'square-outline'}
            size={22}
            color="#4F46E5"
          />
        </TouchableOpacity>

        <BookCover title={item.sheetName} colorIndex={index} />

        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle} numberOfLines={2}>
            {item.sheetName}
          </Text>
          <Text style={styles.itemSeller}>{item.sellerName}</Text>
          <Text style={styles.itemPrice}>฿{Number(item.price).toLocaleString()}</Text>
        </View>

        <TouchableOpacity
          onPress={() => handleRemoveItem(item.id)}
          style={styles.deleteBtn}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    );
  };

  // ── Summary Card ───────────────────────────────────────────────────────────

  const SummaryCard = () => (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>สรุปรายการสั่งซื้อ</Text>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>ราคารวม</Text>
        <Text style={styles.summaryValue}>฿{subtotal.toLocaleString()}</Text>
      </View>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>ส่วนลด</Text>
        <Text style={[styles.summaryValue, { color: '#10B981' }]}>
          {discount > 0 ? `-฿${discount.toLocaleString()}` : '฿0'}
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.promoRow}>
        <TextInput
          style={styles.promoInput}
          placeholder="โค้ดส่วนลด"
          value={promoCode}
          onChangeText={setPromoCode}
          placeholderTextColor="#C4C9D4"
        />
        <TouchableOpacity style={styles.promoBtn}>
          <Text style={styles.promoBtnText}>ใช้งาน</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <View style={styles.summaryRow}>
        <Text style={styles.netTotalLabel}>ยอดสุทธิ</Text>
        <Text style={styles.netTotalValue}>฿{totalPrice.toLocaleString()}</Text>
      </View>

      <TouchableOpacity
        style={[
          styles.checkoutBtn,
          selectedIds.length === 0 && styles.checkoutBtnDisabled,
        ]}
        disabled={selectedIds.length === 0}
        onPress={handleCheckout}
      >
        <Text style={styles.checkoutText}>ชำระเงิน ({selectedIds.length})</Text>
      </TouchableOpacity>
    </View>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ตะกร้าของฉัน ({cartItems.length})</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Progress Stepper */}
      <View style={styles.stepperWrap}>
        <ProgressStepper activeStep={0} />
      </View>

      {/* Responsive Content */}
      {isTablet ? (
        /* ── Tablet / Desktop: 2-column ── */
        <View style={styles.tabletContent}>
          <FlatList
            data={cartItems}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => renderItem(item, index)}
            style={styles.leftColumn}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <Text style={styles.sectionHeading}>
                ตะกร้าของฉัน ({cartItems.length})
              </Text>
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="cart-outline" size={56} color="#CBD5E1" />
                <Text style={styles.emptyText}>ไม่มีสินค้าในตะกร้า</Text>
              </View>
            }
          />
          <ScrollView
            style={styles.rightColumn}
            contentContainerStyle={styles.rightContent}
          >
            <SummaryCard />
          </ScrollView>
        </View>
      ) : (
        /* ── Mobile: stacked ── */
        <ScrollView contentContainerStyle={styles.mobileContent}>
          <Text style={styles.sectionHeading}>
            ตะกร้าของฉัน ({cartItems.length})
          </Text>
          {cartItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="cart-outline" size={56} color="#CBD5E1" />
              <Text style={styles.emptyText}>ไม่มีสินค้าในตะกร้า</Text>
            </View>
          ) : (
            cartItems.map((item, index) => renderItem(item, index))
          )}
          {cartItems.length > 0 && <SummaryCard />}
        </ScrollView>
      )}
    </View>
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

// ─── Book Cover Styles ────────────────────────────────────────────────────────

const bookStyles = StyleSheet.create({
  cover: {
    width: 52,
    height: 68,
    borderRadius: 4,
    marginHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  spine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 7,
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  initials: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    fontFamily: 'Mitr_600SemiBold',
  },
});

// ─── Main Styles ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: 'black',
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
  listContent: { gap: 12, paddingBottom: 24 },
  rightColumn: { width: 320 },
  rightContent: { paddingBottom: 24 },

  // Mobile layout
  mobileContent: { padding: 16, gap: 12, paddingBottom: 32 },
  sectionHeading: {
    fontSize: 20,
    fontWeight: '600',
    color: 'black',
    fontFamily: 'Mitr_600SemiBold',
    marginBottom: 4,
  },

  // Cart Item Card
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  itemCardSelected: {
    borderWidth: 1.5,
    borderColor: '#4F46E5',
    backgroundColor: '#F5F3FF',
  },
  itemInfo: { flex: 1 },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Mitr_500Medium',
    lineHeight: 20,
  },
  itemSeller: {
    fontSize: 12,
    color: '#979FAF',
    marginTop: 3,
    fontFamily: 'Mitr_400Regular',
  },
  itemPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2740C2',
    marginTop: 6,
    fontFamily: 'Mitr_600SemiBold',
  },
  deleteBtn: { padding: 8 },

  // Empty state
  emptyContainer: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { color: '#94A3B8', fontSize: 15, fontFamily: 'Mitr_400Regular' },

  // Summary Card
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'black',
    fontFamily: 'Mitr_600SemiBold',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: { fontSize: 15, color: '#64748B', fontFamily: 'Mitr_400Regular' },
  summaryValue: { fontSize: 15, fontWeight: '500', color: '#334155', fontFamily: 'Mitr_500Medium' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },

  // Promo Code
  promoRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  promoInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: 'Mitr_400Regular',
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
  },
  promoBtn: {
    backgroundColor: '#EEF2FF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  promoBtnText: { fontSize: 14, fontWeight: '600', color: '#4F46E5', fontFamily: 'Mitr_500Medium' },

  // Net Total
  netTotalLabel: {
    fontSize: 17,
    fontWeight: '500',
    color: 'black',
    fontFamily: 'Mitr_500Medium',
  },
  netTotalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2740C2',
    fontFamily: 'Mitr_600SemiBold',
  },

  // Checkout Button (pill-shaped)
  checkoutBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
    marginTop: 16,
  },
  checkoutBtnDisabled: { backgroundColor: '#CBD5E1' },
  checkoutText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Mitr_600SemiBold',
  },
});