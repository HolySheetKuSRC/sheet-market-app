import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "../../styles/seller-dashboard.styles";
import { apiRequest } from "../../utils/api";
import { getUserIdFromSessionToken } from "../../utils/token";

// --- Type ---
type SellerReview = {
  sheetId: string;
  sheetTitle: string;
  thumbnailUrl: string | null;
  reviewId: string;
  rating: number;
  comment: string;
  createdAt: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatarUrl: string | null;
};

type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // current page
};

export default function SellerDashboardScreen() {
  const router = useRouter();
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);

  // --- Reviews state ---
  const [reviews, setReviews] = useState<SellerReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewPage, setReviewPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 10;

  // --- Fetch balance ---
  const fetchBalance = useCallback(async () => {
    try {
      const userId = await getUserIdFromSessionToken();
      if (!userId) return;
      const response = await apiRequest("/payments/withdrawals/balance", {
        headers: { "X-USER-ID": userId },
      });
      if (response.ok) {
        const data = await response.json();
        setBalance(data.availableBalance ?? 0);
      }
    } catch (err) {
      console.error("Error fetching balance:", err);
    } finally {
      setLoadingBalance(false);
    }
  }, []);

  // --- Fetch reviews (pageable) ---
  const fetchReviews = useCallback(
    async (pageToLoad: number) => {
      try {
        setLoadingReviews(true);
        const userId = await getUserIdFromSessionToken();
        if (!userId) return;

        const response = await apiRequest(
          `/products/reviews/seller?page=${pageToLoad}&size=${PAGE_SIZE}`,
          { headers: { "X-USER-ID": userId } }
        );

        if (response.ok) {
          const data: PageResponse<SellerReview> = await response.json();

          // ถ้าโหลดหน้าแรก reset / ถ้าหน้าถัดไป append
          setReviews((prev) =>
            pageToLoad === 0 ? data.content : [...prev, ...data.content]
          );
          setHasMore(pageToLoad < data.totalPages - 1);
          setReviewPage(pageToLoad);
        }
      } catch (err) {
        console.error("Error fetching reviews:", err);
      } finally {
        setLoadingReviews(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchBalance();
    fetchReviews(0);
  }, [fetchBalance, fetchReviews]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>แดชบอร์ดผู้ขาย</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={20} color="#555" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.pillButton}
            onPress={() => router.replace("/(drawer)/home")}
          >
            <Ionicons name="storefront-outline" size={16} color="#555" />
            <Text style={styles.pillButtonText}>หน้าผู้ซื้อ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.pillButtonPrimary}
            onPress={() => router.push("/(seller-drawer)/create-sheet")}
          >
            <Ionicons name="add" size={18} color="#7A82FF" />
            <Text style={styles.pillButtonTextPrimary}>ขายชีท</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Summary Cards — เหมือนเดิม */}
        <View style={styles.summaryContainer}>
          <View style={styles.row}>
            <View style={[styles.card, styles.cardPurple]}>
              <View style={[styles.iconBox, styles.iconBoxWhite]}>
                <Ionicons name="bag-handle-outline" size={20} color="#7A82FF" />
              </View>
              <Text style={styles.cardTitleText}>ยอดขายวันนี้</Text>
              <Text style={styles.cardValuePurple}>฿236</Text>
            </View>
            <View style={[styles.card, styles.cardWhite]}>
              <View style={[styles.iconBox, styles.iconBoxOutline]}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={20}
                  color="#7A82FF"
                />
              </View>
              <Text style={styles.cardTitleText}>รีวิวใหม่</Text>
              <Text style={styles.cardValuePurple}>
                {loadingReviews && reviews.length === 0 ? "-" : reviews.length}
              </Text>
            </View>
          </View>

          <View style={[styles.card, styles.cardDark]}>
            <View style={styles.totalBalanceHeader}>
              <View style={styles.iconBoxWhite}>
                <Ionicons name="cash-outline" size={20} color="#7A82FF" />
              </View>
              <TouchableOpacity
                style={styles.withdrawButton}
                onPress={() => router.push("/(seller-drawer)/withdrawal")}
              >
                <Text style={styles.withdrawButtonText}>ถอนเงิน</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.cardTitleWhite}>ยอดเงินทั้งหมด</Text>
            {loadingBalance ? (
              <ActivityIndicator
                size="small"
                color="#fff"
                style={{ alignSelf: "flex-start", marginTop: 4 }}
              />
            ) : (
              <Text style={styles.cardValueWhite}>
                ฿{balance?.toLocaleString() ?? "0"}
              </Text>
            )}
          </View>
        </View>

        {/* Reviews Section */}
        <View style={styles.recentSection}>
          <Text style={styles.recentTitle}>รีวิวล่าสุด</Text>

          {loadingReviews && reviews.length === 0 ? (
            <ActivityIndicator
              size="small"
              color="#7A82FF"
              style={{ marginTop: 16 }}
            />
          ) : reviews.length === 0 ? (
            <Text style={{ color: "#999", textAlign: "center", marginTop: 16 }}>
              ยังไม่มีรีวิว
            </Text>
          ) : (
            <>
              {reviews.map((item) => (
                <TouchableOpacity
                  key={item.reviewId}
                  style={styles.listItem}
                  // กดแล้วไปหน้า sheet นั้น
                  onPress={() =>
                    router.push(`/sheet/${item.sheetId}`)
                  }
                >
                  <View style={[styles.listIconBox, styles.listIconBoxYellow]}>
                    <Ionicons name="star-outline" size={20} color="#F59E0B" />
                  </View>
                  <View style={styles.listTextContainer}>
                    <Text style={styles.listTitle} numberOfLines={1}>
                      {item.sheetTitle}
                    </Text>
                    <Text style={styles.listSubtitle} numberOfLines={1}>
                      ⭐ {item.rating} · {item.reviewerName} · "{item.comment}"
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}

              {/* Load More */}
              {hasMore && (
                <TouchableOpacity
                  style={styles.pillButton}
                  onPress={() => fetchReviews(reviewPage + 1)}
                  disabled={loadingReviews}
                >
                  {loadingReviews ? (
                    <ActivityIndicator size="small" color="#7A82FF" />
                  ) : (
                    <Text style={styles.pillButtonText}>โหลดเพิ่มเติม</Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}