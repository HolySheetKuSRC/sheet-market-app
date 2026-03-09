import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "../../styles/my-sheets.styles";
import { apiRequest } from "../../utils/api";
import { getUserIdFromSessionToken } from "../../utils/token";

// ===== Types =====
interface SheetItem {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string;
  averageRating: number;
  seller: { id: string; name: string } | null;
  tags: string[];
  status: string; // PENDING, APPROVED, REJECTED
  isPublished: boolean;
  pageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface PageResponse {
  content: SheetItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  last: boolean;
}

// ===== Filter tabs =====
const STATUS_FILTERS = [
  { label: "ทั้งหมด", value: null },
  { label: "รออนุมัติ", value: "PENDING" },
  { label: "อนุมัติแล้ว", value: "APPROVED" },
  { label: "ถูกปฏิเสธ", value: "REJECTED" },
] as const;

// ===== Helpers =====
function getStatusLabel(status: string): string {
  switch (status?.toUpperCase()) {
    case "APPROVED":
      return "อนุมัติแล้ว";
    case "PENDING":
      return "รออนุมัติ";
    case "REJECTED":
      return "ถูกปฏิเสธ";
    default:
      return status;
  }
}

function getStatusStyle(status: string) {
  switch (status?.toUpperCase()) {
    case "APPROVED":
      return {
        badge: styles.statusApproved,
        text: styles.statusTextApproved,
      };
    case "PENDING":
      return {
        badge: styles.statusPending,
        text: styles.statusTextPending,
      };
    case "REJECTED":
      return {
        badge: styles.statusRejected,
        text: styles.statusTextRejected,
      };
    default:
      return {
        badge: styles.statusPending,
        text: styles.statusTextPending,
      };
  }
}

export default function MySheetsScreen() {
  const router = useRouter();
  const [sheets, setSheets] = useState<SheetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [totalElements, setTotalElements] = useState(0);

  const screenWidth = Dimensions.get("window").width;
  const numColumns = screenWidth > 900 ? 3 : screenWidth > 600 ? 3 : 2;
  const cardWidth =
    (screenWidth - 32 - (numColumns - 1) * 12) / numColumns;

  // ===== Fetch Sheets =====
  const fetchSheets = useCallback(
    async (pageNum: number, status: string | null, append: boolean = false) => {
      try {
        const userId = await getUserIdFromSessionToken();
        if (!userId) {
          setError("ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่");
          return;
        }

        let url = `/products/seller/sheet-applications?page=${pageNum}&size=10`;
        if (status) {
          url += `&status=${status}`;
        }

        const response = await apiRequest(url, {
          headers: { "X-USER-ID": userId },
        });

        if (response.ok) {
          const data: PageResponse = await response.json();
          const items = data.content || [];
          if (append) {
            setSheets((prev) => [...prev, ...items]);
          } else {
            setSheets(items);
          }
          setHasMore(!data.last);
          setTotalElements(data.totalElements || 0);
          setError(null);
        } else {
          console.warn("Failed to fetch sheets:", response.status);
          if (!append) {
            setSheets([]);
          }
          setError("ไม่สามารถโหลดข้อมูลได้");
        }
      } catch (err) {
        console.error("Error fetching sheets:", err);
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      }
    },
    []
  );

  // ===== Initial Load =====
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchSheets(0, activeFilter);
      setLoading(false);
    };
    init();
  }, [fetchSheets, activeFilter]);

  // ===== Pull-to-refresh =====
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(0);
    await fetchSheets(0, activeFilter);
    setRefreshing(false);
  }, [fetchSheets, activeFilter]);

  // ===== Load more =====
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    await fetchSheets(nextPage, activeFilter, true);
    setPage(nextPage);
    setLoadingMore(false);
  }, [hasMore, loadingMore, page, fetchSheets, activeFilter]);

  // ===== Switch filter =====
  const handleFilterChange = (status: string | null) => {
    setActiveFilter(status);
    setPage(0);
    setSheets([]);
    setLoading(true);
  };

  // ===== Count by status =====
  const approvedCount = sheets.filter(
    (s) => s.status?.toUpperCase() === "APPROVED"
  ).length;
  const pendingCount = sheets.filter(
    (s) => s.status?.toUpperCase() === "PENDING"
  ).length;
  const rejectedCount = sheets.filter(
    (s) => s.status?.toUpperCase() === "REJECTED"
  ).length;

  // ===== Render a single sheet card =====
  const renderSheetCard = ({ item }: { item: SheetItem }) => {
    const statusStyle = getStatusStyle(item.status);

    return (
      <TouchableOpacity
        style={[styles.card, { width: cardWidth }]}
        activeOpacity={0.9}
        onPress={() =>
          router.push({
            pathname: "/sheet/[id]",
            params: { id: item.id.toString() },
          } as any)
        }
      >
        {/* Image area */}
        <View style={styles.cardImageWrapper}>
          <Image
            source={{
              uri: item.image || "https://via.placeholder.com/300x200?text=Sheet",
            }}
            style={styles.cardImage}
            resizeMode="cover"
          />

          {/* Rating badge */}
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color="#FBBF24" />
            <Text style={styles.ratingText}>
              {item.averageRating?.toFixed(1) || "0.0"}
            </Text>
          </View>

          {/* Edit button */}
          <TouchableOpacity
            style={styles.editButton}
            onPress={(e) => {
              e.stopPropagation();
              // Future: navigate to edit page
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={18} color="#6C63FF" />
          </TouchableOpacity>
        </View>

        {/* Card content */}
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description}
          </Text>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <View style={styles.tagWrapper}>
              {item.tags.slice(0, 2).map((tag, index) => (
                <View key={index} style={styles.tagPill}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Price + Status */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>
              ฿{item.price?.toLocaleString() ?? "0"}
            </Text>
            <View style={[styles.statusBadge, statusStyle.badge]}>
              <Text style={[styles.statusText, statusStyle.text]}>
                {getStatusLabel(item.status)}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
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
        data={sheets}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        key={numColumns}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <>
            {/* Page Title */}
            <View style={styles.pageHeader}>
              <Text style={styles.pageTitle}>ชีทของฉัน</Text>
            </View>

            {/* Stats Row (only when showing all) */}
            {activeFilter === null && sheets.length > 0 && (
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{totalElements}</Text>
                  <Text style={styles.statLabel}>ทั้งหมด</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { color: "#16A34A" }]}>
                    {approvedCount}
                  </Text>
                  <Text style={styles.statLabel}>อนุมัติ</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { color: "#CA8A04" }]}>
                    {pendingCount}
                  </Text>
                  <Text style={styles.statLabel}>รออนุมัติ</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { color: "#DC2626" }]}>
                    {rejectedCount}
                  </Text>
                  <Text style={styles.statLabel}>ปฏิเสธ</Text>
                </View>
              </View>
            )}

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterScrollContent}
              >
                {STATUS_FILTERS.map((filter) => (
                  <TouchableOpacity
                    key={filter.label}
                    style={[
                      styles.filterTab,
                      activeFilter === filter.value && styles.filterTabActive,
                    ]}
                    onPress={() => handleFilterChange(filter.value)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.filterTabText,
                        activeFilter === filter.value &&
                        styles.filterTabTextActive,
                      ]}
                    >
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}
          </>
        }
        renderItem={renderSheetCard}
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
            <View style={styles.emptyContainer}>
              <Ionicons
                name="document-text-outline"
                size={64}
                color="#CBD5E1"
                style={styles.emptyIcon}
              />
              <Text style={styles.emptyText}>ยังไม่มีชีทที่ขาย</Text>
              <Text style={styles.emptySubText}>
                เริ่มสร้างชีทใหม่เพื่อเริ่มต้นขายกันเลย!
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
