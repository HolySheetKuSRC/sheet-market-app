import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ReportModal from "../../components/report-modal";
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
  status: string;
  isPublished: boolean;
  pageCount: number;
  createdAt: string;
  updatedAt: string;
  salesCount?: number;
}

interface PageResponse {
  content: SheetItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  last: boolean;
}

// ===== Filter tabs (เอา "ทั้งหมด" ออก) =====
const STATUS_FILTERS = [
  { label: "อนุมัติแล้ว", value: "APPROVED" },
  { label: "รออนุมัติ", value: "PENDING" },
  { label: "ถูกปฏิเสธ", value: "REJECTED" },
  { label: "ถูกระงับ", value: "SUSPENDED" },
  { label: "ที่ถูกลบ", value: "DELETED" },
] as const;

// ===== Helpers =====
function getStatusLabel(status: string): string {
  switch (status?.toUpperCase()) {
    case "APPROVED": return "อนุมัติแล้ว";
    case "PENDING": return "รออนุมัติ";
    case "REJECTED": return "ถูกปฏิเสธ";
    case "SUSPENDED": return "ถูกระงับ";
    case "DELETED": return "ที่ถูกลบ";
    default: return status;
  }
}

function getStatusStyle(status: string) {
  switch (status?.toUpperCase()) {
    case "APPROVED":
      return { badge: styles.statusApproved, text: styles.statusTextApproved };
    case "PENDING":
      return { badge: styles.statusPending, text: styles.statusTextPending };
    case "REJECTED":
      return { badge: styles.statusRejected, text: styles.statusTextRejected };
    case "SUSPENDED":
      return {
        badge: { ...styles.statusRejected, backgroundColor: "#FEF2F2", borderColor: "#EF4444" },
        text: { ...styles.statusTextRejected, color: "#DC2626" },
      };
    case "DELETED":
      return {
        badge: { backgroundColor: "#F1F5F9", borderColor: "#CBD5E1" },
        text: { color: "#64748B" },
      };
    default:
      return { badge: styles.statusPending, text: styles.statusTextPending };
  }
}

export default function MySheetsScreen() {
  const router = useRouter();
  const [sheets, setSheets] = useState<SheetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSheets, setLoadingSheets] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // ตั้งค่าเริ่มต้นให้เป็น APPROVED แทน null เพราะเราเอา "ทั้งหมด" ออกไปแล้ว
  const [activeFilter, setActiveFilter] = useState<string>("APPROVED"); 
  
  const [totalElements, setTotalElements] = useState(0);
  // เอา all ออกจาก state
  const [statusCounts, setStatusCounts] = useState({
    approved: 0, pending: 0, rejected: 0, suspended: 0, deleted: 0,
  });

  const [appealModalVisible, setAppealModalVisible] = useState(false);
  const [appealSheetId, setAppealSheetId] = useState<string | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [sheetToDelete, setSheetToDelete] = useState<SheetItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const screenWidth = Dimensions.get("window").width;
  const numColumns = screenWidth > 900 ? 3 : screenWidth > 600 ? 3 : 2;
  const cardWidth = (screenWidth - 32 - (numColumns - 1) * 12) / numColumns;

  // ===== Fetch Sheets =====
  const fetchSheets = useCallback(
    async (pageNum: number, status: string, append: boolean = false) => {
      try {
        const userId = await getUserIdFromSessionToken();
        if (!userId) {
          setError("ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่");
          return;
        }

        let url = `/products/seller/sheet-applications?page=${pageNum}&size=10`;

        if (status === "SUSPENDED") {
          url += `&suspended=true`;
        } else if (status === "DELETED") {
          url += `&isDeleted=true`;
        } else {
          url += `&isDeleted=false&status=${status}`;
        }

        const response = await apiRequest(url, { headers: { "X-USER-ID": userId } });

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
          if (!append) setSheets([]);
          setError("ไม่สามารถโหลดข้อมูลได้");
        }
      } catch (err) {
        console.error("Error fetching sheets:", err);
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      }
    },
    []
  );

  // ===== Fetch Status Counts =====
  const fetchStatusCounts = useCallback(async () => {
    try {
      const userId = await getUserIdFromSessionToken();
      if (!userId) return;

      const headers = { "X-USER-ID": userId };

      // เอา Request สำหรับ 'all' ออก
      const [approvedRes, pendingRes, rejectedRes, suspendedRes, deletedRes] =
        await Promise.all([
          apiRequest(`/products/seller/sheet-applications?page=0&size=1&status=APPROVED&isDeleted=false`, { headers }),
          apiRequest(`/products/seller/sheet-applications?page=0&size=1&status=PENDING&isDeleted=false`, { headers }),
          apiRequest(`/products/seller/sheet-applications?page=0&size=1&status=REJECTED&isDeleted=false`, { headers }),
          apiRequest(`/products/seller/sheet-applications?page=0&size=1&suspended=true`, { headers }),
          apiRequest(`/products/seller/sheet-applications?page=0&size=1&isDeleted=true`, { headers }),
        ]);

      const parse = async (res: Response) => {
        if (res.ok) {
          const data = await res.json();
          return data.totalElements ?? 0;
        }
        return 0;
      };

      const [approved, pending, rejected, suspended, deleted] = await Promise.all([
        parse(approvedRes), parse(pendingRes), parse(rejectedRes), parse(suspendedRes), parse(deletedRes),
      ]);

      setStatusCounts({ approved, pending, rejected, suspended, deleted });
    } catch (err) {
      console.error("Error fetching status counts:", err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      // เริ่มต้นดึงข้อมูลสถานะ "APPROVED" เป็นค่าเริ่มต้น
      await Promise.all([fetchSheets(0, "APPROVED"), fetchStatusCounts()]);
      setLoading(false);
    };
    init();
  }, [fetchSheets, fetchStatusCounts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(0);
    await Promise.all([fetchSheets(0, activeFilter), fetchStatusCounts()]);
    setRefreshing(false);
  }, [fetchSheets, activeFilter, fetchStatusCounts]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    await fetchSheets(nextPage, activeFilter, true);
    setPage(nextPage);
    setLoadingMore(false);
  }, [hasMore, loadingMore, page, fetchSheets, activeFilter]);

  const handleFilterChange = async (status: string) => {
    if (activeFilter === status) return;
    setActiveFilter(status);
    setPage(0);
    setSheets([]);
    setLoadingSheets(true);
    await fetchSheets(0, status);
    setLoadingSheets(false);
  };

  const handleDeleteSheet = async () => {
    if (!sheetToDelete) return;
    setDeleting(true);
    try {
      const userId = await getUserIdFromSessionToken();
      if (!userId) return;
      const response = await apiRequest(`/products/${sheetToDelete.id}`, {
        method: "DELETE",
        headers: { "X-USER-ID": userId },
      });
      if (response.ok) {
        setSheets((prev) => prev.filter((s) => s.id !== sheetToDelete.id));
        setTotalElements((prev) => prev - 1);
        fetchStatusCounts();
        setDeleteModalVisible(false);
        setSheetToDelete(null);
      } else {
        alert("ไม่สามารถลบชีทได้");
      }
    } catch (err) {
      console.error("Error deleting sheet:", err);
    } finally {
      setDeleting(false);
    }
  };

  const renderSheetCard = ({ item }: { item: SheetItem }) => {
    const statusStyle = getStatusStyle(item.status);
    
    // Logic การแสดงปุ่มด้านขวาบนรูปภาพ
    let actionButton = null;
    
    // 🌟 แก้ไขตรงนี้: เช็คจาก activeFilter แทน item.status 🌟
    if (activeFilter === "SUSPENDED") {
      actionButton = (
        <TouchableOpacity 
          style={[styles.editButton, { backgroundColor: "#FEF2F2", borderColor: "#FECACA" }]} 
          onPress={(e) => { e.stopPropagation(); setAppealSheetId(item.id); setAppealModalVisible(true); }}
        >
          <Ionicons name="warning-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      );
    } 
    // ถ้าผู้ใช้กดอยู่ที่แท็บ APPROVED ก็ให้แสดงปุ่มลบได้เลย
    else if (activeFilter === "APPROVED") {
      actionButton = (
        <TouchableOpacity 
          style={[styles.editButton, { borderColor: "#FEE2E2" }]} 
          onPress={(e) => { e.stopPropagation(); setSheetToDelete(item); setDeleteModalVisible(true); }}
        >
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.card, { width: cardWidth }]}
        activeOpacity={0.9}
        onPress={() => router.push({ pathname: "/sheet/[id]", params: { id: item.id } } as any)}
      >
        <View style={styles.cardImageWrapper}>
          <Image source={{ uri: item.image || "https://via.placeholder.com/300x200" }} style={styles.cardImage} resizeMode="cover" />
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color="#FBBF24" />
            <Text style={styles.ratingText}>{item.averageRating?.toFixed(1) || "0.0"}</Text>
          </View>
          
          {/* Render Action Button ถ้ามี */}
          {actionButton}

        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
          {item.tags?.length > 0 && (
            <View style={styles.tagWrapper}>
              {item.tags.slice(0, 2).map((tag, idx) => (
                <View key={idx} style={styles.tagPill}><Text style={styles.tagText}>{tag}</Text></View>
              ))}
            </View>
          )}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
            <Ionicons name="bag-check-outline" size={14} color="#10B981" />
            <Text style={{ fontSize: 12, color: "#10B981", marginLeft: 4, fontWeight: "500" }}>ขายแล้ว {item.salesCount ?? 0} ออเดอร์</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.price}>฿{item.price?.toLocaleString() ?? "0"}</Text>
            <View style={[styles.statusBadge, statusStyle.badge]}>
              <Text style={[styles.statusText, statusStyle.text]}>
                {/* ถ้าอยู่แท็บ DELETED ให้บังคับโชว์ label ว่า "ที่ถูกลบ" แม้ status จะเป็น APPROVED ก็ตาม */}
                {activeFilter === "DELETED" ? "ที่ถูกลบ" : getStatusLabel(item.status)}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#6C63FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={sheets}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        key={numColumns}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <>
            <View style={styles.pageHeader}><Text style={styles.pageTitle}>ชีทของฉัน</Text></View>
            
            {/* Stats Row: เอา card 'ทั้งหมด' ออก */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}><Text style={[styles.statValue, { color: "#16A34A" }]}>{statusCounts.approved}</Text><Text style={styles.statLabel}>อนุมัติ</Text></View>
              <View style={styles.statCard}><Text style={[styles.statValue, { color: "#CA8A04" }]}>{statusCounts.pending}</Text><Text style={styles.statLabel}>รออนุมัติ</Text></View>
              <View style={styles.statCard}><Text style={[styles.statValue, { color: "#DC2626" }]}>{statusCounts.rejected}</Text><Text style={styles.statLabel}>ปฏิเสธ</Text></View>
              <View style={styles.statCard}><Text style={[styles.statValue, { color: "#EF4444" }]}>{statusCounts.suspended}</Text><Text style={styles.statLabel}>ถูกระงับ</Text></View>
              <View style={styles.statCard}><Text style={[styles.statValue, { color: "#64748B" }]}>{statusCounts.deleted}</Text><Text style={styles.statLabel}>ที่ถูกลบ</Text></View>
            </View>
            
            <View style={styles.filterContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollContent}>
                {STATUS_FILTERS.map((filter) => (
                  <TouchableOpacity key={filter.label} style={[styles.filterTab, activeFilter === filter.value && styles.filterTabActive]} onPress={() => handleFilterChange(filter.value)}>
                    <Text style={[styles.filterTabText, activeFilter === filter.value && styles.filterTabTextActive]}>{filter.label}</Text>
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
        ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color="#6C63FF" style={{ paddingVertical: 20 }} /> : null}
        ListEmptyComponent={loadingSheets ? <View style={{ paddingVertical: 40, alignItems: "center" }}><ActivityIndicator size="large" color="#6C63FF" /></View> : !loading ? <View style={styles.emptyContainer}><Ionicons name="document-text-outline" size={64} color="#CBD5E1" style={styles.emptyIcon} /><Text style={styles.emptyText}>ยังไม่มีชีทที่ขาย</Text><Text style={styles.emptySubText}>เริ่มสร้างชีทใหม่เพื่อเริ่มต้นขายกันเลย!</Text></View> : null}
      />
      <ReportModal visible={appealModalVisible} onClose={() => setAppealModalVisible(false)} sheetId={appealSheetId} type="APPEAL" onSuccess={onRefresh} />
      <Modal visible={deleteModalVisible} transparent animationType="fade" onRequestClose={() => !deleting && setDeleteModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} activeOpacity={1} onPress={() => !deleting && setDeleteModalVisible(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}><Ionicons name="trash-outline" size={32} color="#EF4444" /></View>
            <Text style={styles.modalTitle}>ยืนยันการลบชีท</Text>
            <Text style={styles.modalMessage}>คุณต้องการลบชีท "{sheetToDelete?.title}" ใช่หรือไม่?{"\n"}การดำเนินการนี้ไม่สามารถย้อนกลับได้</Text>
            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setDeleteModalVisible(false)} disabled={deleting}><Text style={styles.cancelButtonText}>ยกเลิก</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.deleteButton]} onPress={handleDeleteSheet} disabled={deleting}>{deleting ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.deleteButtonText}>ยืนยันการลบ</Text>}</TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}