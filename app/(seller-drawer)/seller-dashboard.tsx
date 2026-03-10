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

import { MonthlyRevenueLineChart } from "../../components/charts/MonthlyRevenueLineChart";
import { SalesPieChart } from "../../components/charts/SalesPieChart";
import { WeeklySalesBarChart } from "../../components/charts/WeeklySalesBarChart";
import { useSellerDashboardSummary } from "../../hooks/useSellerDashboardSummary";

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
  number: number;
};

export default function SellerDashboardScreen() {
  const router = useRouter();

  // --- Summary Hook (ดึงข้อมูล Dashboard ทั้งหมดจบในเส้นเดียว) ---
  const { data: summary, loading: loadingSummary } = useSellerDashboardSummary();

  // --- Reviews state ---
  const [reviews, setReviews] = useState<SellerReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewPage, setReviewPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 10;

  // --- Fetch reviews (pageable) ---
  const fetchReviews = useCallback(async (pageToLoad: number) => {
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
  }, []);

  useEffect(() => {
    fetchReviews(0);
  }, [fetchReviews]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Section (คงเดิม) */}
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
        
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.row}>
            {/* ยอดขายวันนี้ (แก้ให้ดึงจาก Backend) */}
            <View style={[styles.card, styles.cardPurple, { flex: 1, marginRight: 8 }]}>
              <View style={[styles.iconBox, styles.iconBoxWhite]}>
                <Ionicons name="bag-handle-outline" size={20} color="#7A82FF" />
              </View>
              <Text style={styles.cardTitleText}>ยอดขายวันนี้</Text>
              <Text style={styles.cardValuePurple}>
                {loadingSummary ? "-" : `฿${summary?.todaySales?.toLocaleString() ?? 0}`}
              </Text>
            </View>

            {/* จำนวนขายรวมทั้งหมด (เพิ่มใหม่ให้ครอบคลุม API) */}
            <View style={[styles.card, styles.cardWhite, { flex: 1, marginRight: 8 }]}>
              <View style={[styles.iconBox, styles.iconBoxOutline]}>
                <Ionicons name="receipt-outline" size={20} color="#7A82FF" />
              </View>
              <Text style={styles.cardTitleText}>ขายได้ทั้งหมด</Text>
              <Text style={styles.cardValuePurple}>
                {loadingSummary ? "-" : `${summary?.totalOrders ?? 0} ออเดอร์`}
              </Text>
            </View>

            {/* รีวิวใหม่ */}
            <View style={[styles.card, styles.cardWhite, { flex: 1 }]}>
              <View style={[styles.iconBox, styles.iconBoxOutline]}>
                <Ionicons name="chatbubble-ellipses-outline" size={20} color="#7A82FF" />
              </View>
              <Text style={styles.cardTitleText}>รีวิวใหม่</Text>
              <Text style={styles.cardValuePurple}>
                {loadingReviews && reviews.length === 0 ? "-" : reviews.length}
              </Text>
            </View>
          </View>

          {/* ยอดเงินทั้งหมด (แก้ให้ดึงจาก summary.totalBalance แทน) */}
          <View style={[styles.card, styles.cardDark, { marginTop: 12 }]}>
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
            <Text style={styles.cardTitleWhite}>ยอดเงินทั้งหมด (ที่ถอนได้)</Text>
            {loadingSummary ? (
              <ActivityIndicator size="small" color="#fff" style={{ alignSelf: "flex-start", marginTop: 4 }} />
            ) : (
              <Text style={styles.cardValueWhite}>
                ฿{summary?.totalBalance?.toLocaleString() ?? "0"}
              </Text>
            )}
          </View>
        </View>

        {/* ===== Chart Section ===== */}
        {loadingSummary ? (
          <ActivityIndicator size="small" color="#7A82FF" style={{ marginTop: 24 }} />
        ) : summary ? (
          <View style={styles.chartSection}>
            <View style={styles.chartCard}>
              <WeeklySalesBarChart data={summary.weeklySales} />
            </View>
            
            <View style={styles.chartCard}>
              <MonthlyRevenueLineChart data={summary.monthlySales} />
            </View>
            
            <View style={styles.chartCard}>
              <SalesPieChart
                todaySales={summary.todaySales}
                totalBalance={summary.totalBalance}
              />
            </View>
            
            {/* Top Sheet Banner */}
            {summary.topSheetTitle && (
              <View style={styles.topSheetBanner}>
                <Ionicons name="trophy-outline" size={20} color="#F59E0B" />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.topSheetLabel}>ชีทขายดีที่สุด</Text>
                  <Text style={styles.topSheetTitle} numberOfLines={1}>
                    {summary.topSheetTitle}
                  </Text>
                </View>
                <Text style={styles.topSheetRevenue}>
                  ฿{summary.topSheetRevenue?.toLocaleString()}
                </Text>
              </View>
            )}
          </View>
        ) : null}

        {/* ===== Sheet Performances Section (เพิ่มใหม่) ===== */}
        {!loadingSummary && summary?.sheetPerformances && summary.sheetPerformances.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.recentTitle}>ผลงานชีทสรุป (ยอดขายรายตัว)</Text>
            {summary.sheetPerformances.map((perf, index) => (
              <View key={index} style={styles.listItem}>
                 <View style={[styles.listIconBox, { backgroundColor: "#E0E7FF" }]}>
                  <Ionicons name="document-text-outline" size={20} color="#4F46E5" />
                </View>
                <View style={styles.listTextContainer}>
                  <Text style={styles.listTitle} numberOfLines={1}>
                    {perf.sheetName}
                  </Text>
                  <Text style={styles.listSubtitle}>
                    ขายได้ {perf.salesCount} ออเดอร์
                  </Text>
                </View>
                <Text style={{ fontWeight: "bold", color: "#333" }}>
                  ฿{perf.totalRevenue.toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* ===== Reviews Section ===== */}
        <View style={styles.recentSection}>
          <Text style={styles.recentTitle}>รีวิวล่าสุด</Text>

          {loadingReviews && reviews.length === 0 ? (
            <ActivityIndicator size="small" color="#7A82FF" style={{ marginTop: 16 }} />
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
                  onPress={() => router.push(`/sheet/${item.sheetId}`)}
                >
                  <View style={[styles.listIconBox, styles.listIconBoxYellow]}>
                    <Ionicons name="star-outline" size={20} color="#F59E0B" />
                  </View>
                  <View style={styles.listTextContainer}>
                    <Text style={styles.listTitle} numberOfLines={1}>
                      {item.sheetTitle}
                    </Text>
                    <Text style={styles.listSubtitle} numberOfLines={2}>
                      ⭐ {item.rating} · {item.reviewerName} · "{item.comment}"
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}

              {hasMore && (
                <TouchableOpacity
                  style={[styles.pillButton, { alignSelf: "center", marginTop: 12 }]}
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