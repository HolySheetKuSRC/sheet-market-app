import { Ionicons } from "@expo/vector-icons";
import { DrawerActions } from "@react-navigation/native";
import * as FileSystem from "expo-file-system/legacy";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  LayoutChangeEvent,
} from "react-native";

import ReportModal from "../../components/report-modal";
import SheetCard from "../../components/sheetcard";
import { universityData as rawUniversityData } from "../../constants/universities";
import { apiRequest } from "../../utils/api";

const universityData = rawUniversityData.map((u) => ({
  label: u.label,
  value: u.value,
}));

interface Category {
  id: number;
  name: string;
}
interface University {
  id: number;
  name: string;
}
interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string;
  averageRating: number;
  seller: { id: string; name: string };
  university: University;
  category: Category;
  hashtags: string[];
  isPublished: boolean;
  fileUrl?: string;
}

const CATEGORIES = [
  { id: 0, name: "ทั้งหมด", icon: "apps", color: "#64748B" },
  { id: 1, name: "มิดเทอม", icon: "book-outline", color: "#F59E0B" },
  { id: 2, name: "ไฟนอล", icon: "trophy-outline", color: "#EF4444" },
  { id: 3, name: "สรุปรวม", icon: "layers-outline", color: "#10B981" },
];

export default function MyLibraryScreen() {
  const navigation = useNavigation();
  const router = useRouter();

  const [likedSheets, setLikedSheets] = useState<string[]>([]);
  const [sheets, setSheets] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Filter state ──
  const [selectedCategory, setSelectedCategory] = useState(0);          // 0 = ทั้งหมด
  const [selectedUniId, setSelectedUniId] = useState<string | number | null>(null);
  const [showUniModal, setShowUniModal] = useState(false);

  // ── Report Modal state ──
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportSheetId, setReportSheetId] = useState<string | null>(null);

  // ── Search & Grid Layout state ──
  const [searchQuery, setSearchQuery] = useState("");
  const [listWidth, setListWidth] = useState(0);

  const numColumns =
    listWidth >= 1024 ? 5
    : listWidth >= 768  ? 4
    : listWidth >= 480  ? 3
    : 2;

  const cardWidth =
    listWidth > 0
      ? Math.floor((listWidth - 14 * 2 - 10 * (numColumns - 1)) / numColumns)
      : 160;

  const handleListLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && w !== listWidth) setListWidth(w);
  };

  // ── Fetch ──────────────────────────────────────────────
  const fetchPurchasedSheets = async () => {
    try {
      setError(null);
      const response = await apiRequest("/products/purchased?page=0&size=50", { method: "GET" });
      if (!response.ok) throw new Error(`Server Error: ${response.status}`);
      const data = await response.json();
      setSheets(data.content || []);
    } catch {
      setError("ไม่สามารถดึงข้อมูลชั้นหนังสือได้");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ── Fetch Liked Sheets ──
  const fetchLikedSheets = async () => {
    try {
      // ดึงชีทที่ user เคย like ไว้ (ใส่ size เยอะๆ ไว้ก่อนเพื่อเก็บ ID มาให้ครบ)
      const response = await apiRequest("/products/liked?page=0&size=100", { method: "GET" });
      if (response.ok) {
        const data = await response.json();
        // ดึงมาเฉพาะ ID เพื่อเอามาเก็บใน likedSheets state
        const likedIds = data.content.map((item: Product) => item.id);
        setLikedSheets(likedIds);
      }
    } catch (err) {
      console.error("Fetch Liked Sheets Error:", err);
    }
  };

  useFocusEffect(useCallback(() => { fetchPurchasedSheets(); fetchLikedSheets();}, []));
  const onRefresh = useCallback(() => { setRefreshing(true); fetchPurchasedSheets();  fetchLikedSheets();}, []);

  // ── Download ───────────────────────────────────────────
  const handleDownload = async (id: string) => {
    try {
      const response = await apiRequest(`/products/${id}/download`, { method: "GET" });
      if (!response.ok) throw new Error((await response.text()) || "ไม่สามารถดาวน์โหลดไฟล์ได้");
      const { fileUrl: url, sheetName } = await response.json();
      if (!url || !sheetName) throw new Error("ข้อมูลไฟล์ไม่ถูกต้อง");
      const safeName = sheetName.replace(/[<>:"/\\|?*]+/g, "");
      const fileUri = FileSystem.documentDirectory + `${safeName}.pdf`;
      const info = await FileSystem.getInfoAsync(fileUri);
      if (info.exists) {
        if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(fileUri);
        return;
      }
      const result = await FileSystem.createDownloadResumable(url, fileUri).downloadAsync();
      if (!result?.uri) throw new Error("Download failed");
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(result.uri);
      else Alert.alert("Downloaded", "ไฟล์ถูกดาวน์โหลดแล้ว");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  // ── Toggle Like (เชื่อม Backend) ──
  const toggleLike = async (id: string) => {
    // 1. อัปเดต UI ทันทีให้ผู้ใช้รู้สึกว่าแอปตอบสนองไว
    setLikedSheets((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);

    try {
      // 2. ยิง API เพื่อบันทึกลง Database
      const response = await apiRequest(`/products/${id}/like`, { method: "POST" });

      if (!response.ok) {
        throw new Error("บันทึก Like ไม่สำเร็จ");
      }
    } catch (error) {
      console.error("Toggle Like Error:", error);
      // 3. ถ้า API พัง ให้ Rollback state กลับไปค่าเดิม
      setLikedSheets((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
    }
  };

  // ── Filtered lists ─────────────────────────────────────
  const applyFilters = useCallback((list: Product[]) => {
    let result = list;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
    }
    if (selectedCategory !== 0) result = result.filter((s) => s.category?.id === selectedCategory);
    if (selectedUniId !== null) result = result.filter((s) => s.university?.name === selectedUniId);
    return result;
  }, [selectedCategory, selectedUniId, searchQuery]);

  const favoriteSheets = useMemo(() => applyFilters(sheets.filter((s) => likedSheets.includes(s.id))), [sheets, likedSheets, applyFilters]);
  const purchasedSheets = useMemo(() => applyFilters(sheets), [sheets, applyFilters]);

  // selected university label
  const selectedUniLabel = selectedUniId
    ? universityData.find((u) => u.value === selectedUniId)?.label ?? "มหาวิทยาลัย"
    : null;

  // active filter count
  const activeFilters = (selectedCategory !== 0 ? 1 : 0) + (selectedUniId !== null ? 1 : 0);

  // ── Card renderer ──────────────────────────────────────
  const renderCard = (item: Product) => (
    <SheetCard
      key={item.id}
      item={{ ...item, tags: item.hashtags }}
      variant="library"
      cardWidth={cardWidth}
      isOwned
      isLiked={likedSheets.includes(item.id)}
      onLikePress={() => toggleLike(item.id)}
      onReportPress={() => {
        setReportSheetId(item.id);
        setReportModalVisible(true);
      }}
      onPress={() => router.push({ pathname: "/sheet/openPDF", params: { id: item.id } })}
      onDownloadPress={() => handleDownload(item.id)}
    />
  );

  // ── Render ─────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Loading Overlay */}
      {loading && !refreshing && (
        <View style={styles.absoluteCenterOverlay}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>กำลังโหลด...</Text>
        </View>
      )}
      <HeaderBar navigation={navigation} />

      {/* ── Search Bar ── */}
      <View style={styles.searchBarWrapper}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={15} color="#B2B3F4" />
          <TextInput
            placeholder="ค้นหาชื่อวิชา..."
            style={styles.searchInput}
            placeholderTextColor="#B2B3F4"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={17} color="#C7D2FE" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Filter Bar ── */}
      <View style={styles.filterBar}>

        {/* Category chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          <Text style={styles.filterLabel}>ตัวกรอง</Text>
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.chip, active && { backgroundColor: cat.color, borderColor: cat.color }]}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={13}
                  color={active ? "#fff" : "#94A3B8"}
                />
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* University filter button */}
          <TouchableOpacity
            style={[styles.chip, styles.uniChip, selectedUniId !== null && styles.uniChipActive]}
            onPress={() => setShowUniModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="school-outline" size={13} color={selectedUniId !== null ? "#fff" : "#6C63FF"} />
            <Text style={[styles.chipText, styles.uniChipText, selectedUniId !== null && styles.chipTextActive]} numberOfLines={1}>
              {selectedUniLabel ?? "มหาวิทยาลัย"}
            </Text>
            <Ionicons name="chevron-down" size={11} color={selectedUniId !== null ? "#fff" : "#6C63FF"} />
          </TouchableOpacity>
        </ScrollView>

        {/* Clear filters */}
        {activeFilters > 0 && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => { setSelectedCategory(0); setSelectedUniId(null); }}
          >
            <Ionicons name="close-circle" size={16} color="#F43F5E" />
            <Text style={styles.clearText}>ล้าง ({activeFilters})</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Content ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F43F5E" />}
      >

        {/* ❤️ รายการโปรดของฉัน */}
        <View style={styles.sectionContainer} onLayout={handleListLayout}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>รายการโปรดของฉัน</Text>
            <Text style={styles.itemCountText}>แสดง {favoriteSheets.length} รายการ</Text>
          </View>

          {favoriteSheets.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="heart-dislike-outline" size={28} color="#FECDD3" />
              <Text style={styles.emptyText}>
                {activeFilters > 0 ? "ไม่มีรายการโปรดที่ตรงกับตัวกรอง" : "ยังไม่มีรายการโปรด"}
              </Text>
            </View>
          ) : (
            <FlatList
              data={favoriteSheets}
              renderItem={({ item }) => renderCard(item)}
              keyExtractor={(item) => item.id}
              numColumns={numColumns}
              key={`fav-${numColumns}`}
              columnWrapperStyle={styles.columnWrapper}
              contentContainerStyle={styles.gridContent}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* 🛍 ชีทที่ซื้อจากร้านค้า */}
        <View style={[styles.sectionContainer, { marginTop: 14 }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ชีทที่ซื้อจากร้านค้า</Text>
            <Text style={styles.itemCountText}>แสดง {purchasedSheets.length} รายการ</Text>
          </View>

          {error ? (
            <View style={styles.center}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={onRefresh} style={styles.retryBtn}>
                <Text style={styles.retryText}>ลองใหม่</Text>
              </TouchableOpacity>
            </View>
          ) : purchasedSheets.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="bag-outline" size={40} color="#C7D2FE" />
              <Text style={styles.emptyTitle}>
                {activeFilters > 0 ? "ไม่มีชีทที่ตรงกับตัวกรอง" : "ยังไม่มีชีทที่ซื้อ"}
              </Text>
              {activeFilters === 0 && (
                <TouchableOpacity style={styles.exploreBtn} onPress={() => router.push("/marketplace")}>
                  <Ionicons name="storefront-outline" size={14} color="#fff" />
                  <Text style={styles.exploreText}>ไปที่ Marketplace</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <FlatList
              data={purchasedSheets}
              renderItem={({ item }) => renderCard(item)}
              keyExtractor={(item) => item.id}
              numColumns={numColumns}
              key={`pur-${numColumns}`}
              columnWrapperStyle={styles.columnWrapper}
              contentContainerStyle={styles.gridContent}
              scrollEnabled={false}
            />
          )}
        </View>



        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── University Modal ── */}
      <Modal visible={showUniModal} transparent animationType="slide" onRequestClose={() => setShowUniModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>เลือกมหาวิทยาลัย</Text>
              <TouchableOpacity onPress={() => setShowUniModal(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* ล้างตัวกรองมหาลัย */}
            <TouchableOpacity
              style={[styles.uniRow, selectedUniId === null && styles.uniRowActive]}
              onPress={() => { setSelectedUniId(null); setShowUniModal(false); }}
            >
              <Ionicons name="apps-outline" size={16} color={selectedUniId === null ? "#6C63FF" : "#94A3B8"} />
              <Text style={[styles.uniRowText, selectedUniId === null && styles.uniRowTextActive]}>
                ทุกมหาวิทยาลัย
              </Text>
              {selectedUniId === null && <Ionicons name="checkmark" size={16} color="#6C63FF" style={{ marginLeft: "auto" }} />}
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false}>
              {universityData.map((uni, index) => {
                const isAll = uni.value === 'all';
                const safeValue = isAll ? null : (isNaN(Number(uni.value)) ? uni.value : Number(uni.value));
                const active = selectedUniId === safeValue;
                return (
                  <TouchableOpacity
                    key={uni.value?.toString() || index.toString()}
                    style={[styles.uniRow, active && styles.uniRowActive]}
                    onPress={() => { setSelectedUniId(safeValue); setShowUniModal(false); }}
                  >
                    <Ionicons name="school-outline" size={16} color={active ? "#6C63FF" : "#94A3B8"} />
                    <Text style={[styles.uniRowText, active && styles.uniRowTextActive]} numberOfLines={1}>
                      {uni.label}
                    </Text>
                    {active && <Ionicons name="checkmark" size={16} color="#6C63FF" style={{ marginLeft: "auto" }} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Report Modal ── */}
      <ReportModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        sheetId={reportSheetId}
        type="REPORT"
      />
    </View>
  );
}

// ── Sub-component: Header ──────────────────────────────
function HeaderBar({ navigation }: { navigation: any }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())} style={styles.menuBtn}>
        <Ionicons name="menu" size={24} color="#1E293B" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>ชั้นหนังสือของฉัน</Text>
      <View style={{ width: 40 }} />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F5F9" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  absoluteCenterOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: "#F1F5F9", justifyContent: "center", alignItems: "center", zIndex: 999 },
  loadingText: { marginTop: 12, fontSize: 13, color: "#6C63FF" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14,
    backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#F1F5F9",
  },
  menuBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "#F8FAFC", justifyContent: "center", alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#1E293B" },

  // ── Search Bar ──
  searchBarWrapper: { paddingHorizontal: 16, paddingTop: 10, backgroundColor: "#fff" },
  searchBar: {
    flexDirection: "row", backgroundColor: "#F4F4FF", borderRadius: 14,
    paddingHorizontal: 12, height: 40, alignItems: "center", gap: 8,
    borderWidth: 1, borderColor: "#E0E0FF",
  },
  searchInput: { flex: 1, fontSize: 13, fontFamily: "Mitr_400Regular", color: "#292524" },

  // ── Filter Bar ──
  filterBar: {
    backgroundColor: "#fff",
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  filterLabel: { color: "#6366F1", fontSize: 17, fontFamily: "Mitr_500Medium", marginRight: 4 },
  chipRow: { paddingHorizontal: 12, gap: 8, alignItems: "center" },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5, borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  chipText: { fontSize: 12, fontWeight: "700", color: "#94A3B8" },
  chipTextActive: { color: "#fff" },

  uniChip: { borderColor: "#C7D2FE", backgroundColor: "#EEF2FF", maxWidth: 160 },
  uniChipActive: { backgroundColor: "#6C63FF", borderColor: "#6C63FF" },
  uniChipText: { color: "#6C63FF", flex: 1 },

  clearBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    marginHorizontal: 12, marginTop: 8,
    alignSelf: "flex-start",
  },
  clearText: { fontSize: 12, fontWeight: "700", color: "#F43F5E" },

  // ── Sections ──
  sectionContainer: {
    marginTop: 16, paddingBottom: 8,
  },
  sectionHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20, fontFamily: "Mitr_600SemiBold", color: "#000",
  },
  itemCountText: {
    fontSize: 14, fontFamily: "Mitr_400Regular", color: "#292524",
  },

  gridContent: { paddingHorizontal: 14, paddingTop: 4, paddingBottom: 20 },
  columnWrapper: { justifyContent: "flex-start", gap: 10 },

  emptyContainer: { alignItems: "center", paddingVertical: 32, gap: 8 },
  emptyTitle: { fontSize: 14, fontFamily: "Mitr_600SemiBold", color: "#818CF8" },
  emptyText: { fontSize: 13, fontFamily: "Mitr_400Regular", color: "#94A3B8" },

  exploreBtn: {
    flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4,
    paddingVertical: 10, paddingHorizontal: 22, backgroundColor: "#6C63FF", borderRadius: 25,
  },
  exploreText: { color: "#FFF", fontWeight: "700", fontSize: 14 },

  // ── University Modal ──
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 8, paddingBottom: 32, maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: "#F1F5F9",
  },
  modalTitle: { fontSize: 16, fontWeight: "800", color: "#1E293B" },

  uniRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#F8FAFC",
  },
  uniRowActive: { backgroundColor: "#EEF2FF" },
  uniRowText: { fontSize: 14, color: "#475569", flex: 1 },
  uniRowTextActive: { color: "#4F46E5", fontWeight: "700" },

  errorText: { color: "#B91C1C", fontSize: 14, marginBottom: 12, textAlign: "center" },
  retryBtn: { paddingVertical: 8, paddingHorizontal: 20, backgroundColor: "#B91C1C", borderRadius: 8 },
  retryText: { color: "#FFF", fontWeight: "bold", fontSize: 14 },
});