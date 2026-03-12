import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "../../styles/withdrawal.styles";
import { apiRequest } from "../../utils/api";
import { getUserIdFromSessionToken } from "../../utils/token";

// ===== Types (ปรับให้ตรงกับ Java Backend) =====
interface SellerBalanceResponse {
  netRevenue: number;
  withdrawn: number;
  available: number; // ตรงกับชื่อฟิลด์ใน WithdrawalService.java
}

interface WithdrawalHistoryItem {
  id: string;
  amount: number;
  status: string; 
  createdAt: string;
}

// ===== Helper: format date =====
function formatThaiDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const buddhistYear = d.getFullYear() + 543;
    return `${day} / ${month} / ${buddhistYear}`;
  } catch {
    return dateStr;
  }
}

function getStatusLabel(status: string): string {
  switch (status?.toUpperCase()) {
    case "COMPLETED": return "สำเร็จ";
    case "PENDING": return "รอตรวจสอบ";
    case "REJECTED": return "ถูกปฏิเสธ";
    default: return status;
  }
}

function getStatusVariant(status: string) {
  switch (status?.toUpperCase()) {
    case "COMPLETED": return "Completed";
    case "PENDING": return "Pending";
    case "REJECTED": return "Rejected";
    default: return "Completed";
  }
}

export default function WithdrawalScreen() {
  const [balance, setBalance] = useState<SellerBalanceResponse | null>(null);
  const [history, setHistory] = useState<WithdrawalHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // ===== Fetch Balance (แก้ไขการแกะ JSON) =====
  const fetchBalance = useCallback(async () => {
    try {
      const userId = await getUserIdFromSessionToken();
      if (!userId) return;

      const response = await apiRequest("/payments/withdrawals/balance", {
        headers: { "X-USER-ID": userId },
      });

      if (response.ok) {
        const json = await response.json();
        // เนื่องจาก Backend ส่ง SellerBalanceResponse มาโดยตรง ไม่ได้หุ้ม success/data
        setBalance(json);
      }
    } catch (err) {
      console.error("Error fetching balance:", err);
    }
  }, []);

  // ===== Fetch History =====
  const fetchHistory = useCallback(
    async (pageNum: number, append: boolean = false) => {
      try {
        const userId = await getUserIdFromSessionToken();
        if (!userId) return;

        const response = await apiRequest(
          `/payments/withdrawals/history?page=${pageNum}&size=10`,
          { headers: { "X-USER-ID": userId } },
        );

        if (response.ok) {
          const json = await response.json();
          // สำหรับ Page<T> ของ Spring ข้อมูลจะอยู่ที่ json.content
          const items: WithdrawalHistoryItem[] = json.content || [];
          
          if (append) {
            setHistory((prev) => [...prev, ...items]);
          } else {
            setHistory(items);
          }
          setHasMore(!json.last);
        }
      } catch (err) {
        console.error("Error fetching history:", err);
      }
    },
    [],
  );

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);
      await Promise.all([fetchBalance(), fetchHistory(0)]);
      setLoading(false);
    };
    init();
  }, [fetchBalance, fetchHistory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(0);
    await Promise.all([fetchBalance(), fetchHistory(0)]);
    setRefreshing(false);
  }, [fetchBalance, fetchHistory]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    await fetchHistory(nextPage, true);
    setPage(nextPage);
    setLoadingMore(false);
  }, [hasMore, loadingMore, page, fetchHistory]);

  const handleWithdraw = () => {
    setWithdrawAmount("");
    setModalError(null);
    setModalVisible(true);
  };

  const submitWithdrawal = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!withdrawAmount || isNaN(amount) || amount <= 0) {
      setModalError("กรุณาใส่จำนวนเงินที่ถูกต้อง");
      return;
    }
    // ใช้ .available ให้ตรงกับ Interface ใหม่
    if (balance && amount > balance.available) {
      setModalError("จำนวนเงินเกินยอดที่ถอนได้");
      return;
    }

    try {
      setWithdrawing(true);
      setModalError(null);
      const userId = await getUserIdFromSessionToken();
      if (!userId) {
        setModalError("ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่");
        return;
      }

      const response = await apiRequest("/payments/withdrawals/request", {
        method: "POST",
        headers: {
          "X-USER-ID": userId,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setModalVisible(false);
        if (Platform.OS === "web") {
          alert(data.message || "สร้างคำขอถอนเงินเรียบร้อย");
        } else {
          Alert.alert("สำเร็จ", data.message || "สร้างคำขอถอนเงินเรียบร้อย");
        }
        setPage(0);
        await Promise.all([fetchBalance(), fetchHistory(0)]);
      } else {
        setModalError(data.message || "เกิดข้อผิดพลาด กรุณาลองใหม่");
      }
    } catch (err) {
      console.error("Withdrawal error:", err);
      setModalError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setWithdrawing(false);
    }
  };

  const renderHistoryItem = ({ item }: { item: WithdrawalHistoryItem }) => {
    const variant = getStatusVariant(item.status);
    return (
      <View style={[
        styles.historyItem,
        variant === "Completed" && styles.historyItemCompleted,
        variant === "Pending" && styles.historyItemPending,
        variant === "Rejected" && styles.historyItemRejected,
      ]}>
        <View style={[
          styles.historyIconBox,
          variant === "Completed" && styles.historyIconCompleted,
          variant === "Pending" && styles.historyIconPending,
          variant === "Rejected" && styles.historyIconRejected,
        ]}>
          <Ionicons name="logo-usd" size={20} color="#fff" />
        </View>
        <View style={styles.historyTextContainer}>
          <Text style={styles.historyDate}>วันที่ : {formatThaiDate(item.createdAt)}</Text>
          <Text style={styles.historyStatus}>สถานะ : {getStatusLabel(item.status)}</Text>
        </View>
        <Text style={[
          styles.historyAmount,
          variant === "Completed" && styles.historyAmountCompleted,
          variant === "Pending" && styles.historyAmountPending,
          variant === "Rejected" && styles.historyAmountRejected,
        ]}>
          {item.amount}฿
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <>
            <View style={styles.balanceCard}>
              <View style={styles.balanceIconBox}>
                <Ionicons name="wallet-outline" size={28} color="#fff" />
              </View>
              <Text style={styles.balanceLabel}>ยอดเงินที่ถอนได้</Text>
              <Text style={styles.balanceAmount}>
                ฿{balance?.available?.toLocaleString() ?? "0"}
              </Text>
              <TouchableOpacity style={styles.withdrawBtn} onPress={handleWithdraw} activeOpacity={0.8}>
                <Text style={styles.withdrawBtnText}>ถอนเลย</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.historyTitle}>ประวัติการถอนเงิน</Text>
            {error && <Text style={styles.errorText}>{error}</Text>}
          </>
        }
        renderItem={renderHistoryItem}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color="#6C63FF" style={{ paddingVertical: 20 }} /> : null}
        ListEmptyComponent={!loading ? <Text style={styles.emptyText}>ยังไม่มีประวัติการถอนเงิน</Text> : null}
      />

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => !withdrawing && setModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => !withdrawing && setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => { }}>
              <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <View style={styles.modalIconBox}>
                      <Ionicons name="cash-outline" size={28} color="#fff" />
                    </View>
                    <Text style={styles.modalTitle}>ถอนเงิน</Text>
                    <TouchableOpacity style={styles.modalCloseBtn} onPress={() => !withdrawing && setModalVisible(false)}>
                      <Ionicons name="close" size={22} color="#888" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.modalBalanceRow}>
                    <Text style={styles.modalBalanceLabel}>ยอดเงินที่ถอนได้</Text>
                    <Text style={styles.modalBalanceValue}>฿{balance?.available?.toLocaleString() ?? "0"}</Text>
                  </View>

                  <Text style={styles.modalInputLabel}>จำนวนเงินที่ต้องการถอน (บาท)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="0.00"
                    placeholderTextColor="#bbb"
                    keyboardType="numeric"
                    value={withdrawAmount}
                    onChangeText={(text) => {
                      setWithdrawAmount(text);
                      setModalError(null);
                    }}
                    editable={!withdrawing}
                  />

                  {modalError && <Text style={styles.modalErrorText}>{modalError}</Text>}

                  <View style={styles.modalBtnRow}>
                    <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)} disabled={withdrawing}>
                      <Text style={styles.modalCancelBtnText}>ยกเลิก</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalSubmitBtn, withdrawing && { opacity: 0.6 }]}
                      onPress={submitWithdrawal}
                      disabled={withdrawing}
                    >
                      {withdrawing ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.modalSubmitBtnText}>ยืนยันถอนเงิน</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}