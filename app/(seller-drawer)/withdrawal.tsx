import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "../../styles/withdrawal.styles";
import { apiRequest } from "../../utils/api";
import { getUserIdFromSessionToken } from "../../utils/token";

// ===== Types =====
interface SellerBalanceResponse {
  totalBalance: number;
  pendingBalance: number;
  availableBalance: number;
}

interface WithdrawalHistoryItem {
  id: string;
  amount: number;
  status: string; // COMPLETED, PENDING, REJECTED
  createdAt: string;
}

// ===== Helper: format date to DD / MM / YYYY (พ.ศ.) =====
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

// ===== Helper: translate status =====
function getStatusLabel(status: string): string {
  switch (status?.toUpperCase()) {
    case "COMPLETED":
      return "สำเร็จ";
    case "PENDING":
      return "รอตรวจสอบ";
    case "REJECTED":
      return "ถูกปฏิเสธ";
    default:
      return status;
  }
}

// ===== Helper: get style variant by status =====
function getStatusVariant(status: string) {
  switch (status?.toUpperCase()) {
    case "COMPLETED":
      return "Completed";
    case "PENDING":
      return "Pending";
    case "REJECTED":
      return "Rejected";
    default:
      return "Completed";
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

  // ===== Fetch Balance =====
  const fetchBalance = useCallback(async () => {
    try {
      const userId = await getUserIdFromSessionToken();
      if (!userId) {
        setError("ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่");
        return;
      }
      const response = await apiRequest("/payments/withdrawals/balance", {
        headers: { "X-USER-ID": userId },
      });
      if (response.ok) {
        const data: SellerBalanceResponse = await response.json();
        setBalance(data);
      } else {
        console.warn("Failed to fetch balance:", response.status);
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
          const data = await response.json();
          const items: WithdrawalHistoryItem[] = data.content || [];
          if (append) {
            setHistory((prev) => [...prev, ...items]);
          } else {
            setHistory(items);
          }
          setHasMore(!data.last);
        } else {
          console.warn("Failed to fetch history:", response.status);
        }
      } catch (err) {
        console.error("Error fetching history:", err);
      }
    },
    [],
  );

  // ===== Initial Load =====
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);
      await Promise.all([fetchBalance(), fetchHistory(0)]);
      setLoading(false);
    };
    init();
  }, [fetchBalance, fetchHistory]);

  // ===== Pull-to-refresh =====
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(0);
    await Promise.all([fetchBalance(), fetchHistory(0)]);
    setRefreshing(false);
  }, [fetchBalance, fetchHistory]);

  // ===== Load more (pagination) =====
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    await fetchHistory(nextPage, true);
    setPage(nextPage);
    setLoadingMore(false);
  }, [hasMore, loadingMore, page, fetchHistory]);

  // ===== Withdraw action (placeholder) =====
  const handleWithdraw = () => {
    if (Platform.OS === "web") {
      alert("ฟีเจอร์ถอนเงินจะพร้อมใช้งานเร็ว ๆ นี้");
    } else {
      Alert.alert("ถอนเงิน", "ฟีเจอร์ถอนเงินจะพร้อมใช้งานเร็ว ๆ นี้");
    }
  };

  // ===== Render history item =====
  const renderHistoryItem = ({
    item,
  }: {
    item: WithdrawalHistoryItem;
  }) => {
    const variant = getStatusVariant(item.status);
    return (
      <View
        style={[
          styles.historyItem,
          variant === "Completed" && styles.historyItemCompleted,
          variant === "Pending" && styles.historyItemPending,
          variant === "Rejected" && styles.historyItemRejected,
        ]}
      >
        <View
          style={[
            styles.historyIconBox,
            variant === "Completed" && styles.historyIconCompleted,
            variant === "Pending" && styles.historyIconPending,
            variant === "Rejected" && styles.historyIconRejected,
          ]}
        >
          <Ionicons name="logo-usd" size={20} color="#fff" />
        </View>

        <View style={styles.historyTextContainer}>
          <Text style={styles.historyDate}>
            วันที่ : {formatThaiDate(item.createdAt)}
          </Text>
          <Text style={styles.historyStatus}>
            สถานะ : {getStatusLabel(item.status)}
          </Text>
        </View>

        <Text
          style={[
            styles.historyAmount,
            variant === "Completed" && styles.historyAmountCompleted,
            variant === "Pending" && styles.historyAmountPending,
            variant === "Rejected" && styles.historyAmountRejected,
          ]}
        >
          +{item.amount}฿
        </Text>
      </View>
    );
  };

  // ===== Loading state =====
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <>
            {/* ===== Balance Card ===== */}
            <View style={styles.balanceCard}>
              <View style={styles.balanceIconBox}>
                <Ionicons name="wallet-outline" size={28} color="#fff" />
              </View>
              <Text style={styles.balanceLabel}>ยอดเงินทั้งหมด</Text>
              <Text style={styles.balanceAmount}>
                ฿{balance?.availableBalance?.toLocaleString() ?? "0"}
              </Text>
              <TouchableOpacity
                style={styles.withdrawBtn}
                onPress={handleWithdraw}
                activeOpacity={0.8}
              >
                <Text style={styles.withdrawBtnText}>ถอนเลย</Text>
              </TouchableOpacity>
            </View>

            {/* ===== History Title ===== */}
            <Text style={styles.historyTitle}>ประวัติการถอนเงิน</Text>

            {error && <Text style={styles.errorText}>{error}</Text>}
          </>
        }
        renderItem={renderHistoryItem}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator
              size="small"
              color="#6C63FF"
              style={{ paddingVertical: 20 }}
            />
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.emptyText}>ยังไม่มีประวัติการถอนเงิน</Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
