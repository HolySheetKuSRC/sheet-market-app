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
  TouchableOpacity,
  View,
} from "react-native";

import SheetCard from "../../components/sheetcard";
import { apiRequest } from "../../utils/api";
import { universityData as rawUniversityData } from "../../constants/universities";

const universityData: { label: string; value: number }[] = rawUniversityData.map((u) => ({
  label: u.label,
  value: Number(u.value),
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
  { id: 0,  name: "ทั้งหมด",  icon: "apps",           color: "#64748B" },
  { id: 1,  name: "มิดเทอม", icon: "book-outline",    color: "#F59E0B" },
  { id: 2,  name: "ไฟนอล",   icon: "trophy-outline",  color: "#EF4444" },
  { id: 3,  name: "สรุปรวม", icon: "layers-outline",  color: "#10B981" },
];

export default function MyLibraryScreen() {
  const navigation = useNavigation();
  const router     = useRouter();

  const [likedSheets,    setLikedSheets]    = useState<string[]>([]);
  const [sheets,         setSheets]         = useState<Product[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [refreshing,     setRefreshing]     = useState(false);
  const [error,          setError]          = useState<string | null>(null);

  // ── Filter state ──
  const [selectedCategory, setSelectedCategory] = useState(0);          // 0 = ทั้งหมด
  const [selectedUniId,    setSelectedUniId]    = useState<number | null>(null);
  const [showUniModal,     setShowUniModal]     = useState(false);

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

  useFocusEffect(useCallback(() => { fetchPurchasedSheets(); }, []));
  const onRefresh = useCallback(() => { setRefreshing(true); fetchPurchasedSheets(); }, []);

  // ── Download ───────────────────────────────────────────
  const handleDownload = async (id: string) => {
    try {
      const response = await apiRequest(`/products/${id}/download`, { method: "GET" });
      if (!response.ok) throw new Error((await response.text()) || "ไม่สามารถดาวน์โหลดไฟล์ได้");
      const { fileUrl: url, sheetName } = await response.json();
      if (!url || !sheetName) throw new Error("ข้อมูลไฟล์ไม่ถูกต้อง");
      const safeName = sheetName.replace(/[<>:"/\\|?*]+/g, "");
      const fileUri  = FileSystem.documentDirectory + `${safeName}.pdf`;
      const info     = await FileSystem.getInfoAsync(fileUri);
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

  const toggleLike = (id: string) =>
    setLikedSheets((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);

  // ── Filtered lists ─────────────────────────────────────
  const applyFilters = useCallback((list: Product[]) => {
    let result = list;
    if (selectedCategory !== 0)  result = result.filter((s) => s.category?.id === selectedCategory);
    if (selectedUniId    !== null) result = result.filter((s) => s.university?.id === selectedUniId);
    return result;
  }, [selectedCategory, selectedUniId]);

  const favoriteSheets  = useMemo(() => applyFilters(sheets.filter((s) => likedSheets.includes(s.id))), [sheets, likedSheets, applyFilters]);
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
      isThreeColumns
      isOwned
      isLiked={likedSheets.includes(item.id)}
      onLikePress={() => toggleLike(item.id)}
      onPress={() => router.push({ pathname: "/sheet/openPDF", params: { id: item.id } })}
      onDownloadPress={() => handleDownload(item.id)}
    />
  );

  // ── Loading ────────────────────────────────────────────
  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <HeaderBar navigation={navigation} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>กำลังโหลด...</Text>
        </View>
      </View>
    );
  }

  // ── Render ─────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <HeaderBar navigation={navigation} />

      {/* ── Filter Bar ── */}
      <View style={styles.filterBar}>

        {/* Category chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
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

        {/* ❤️ รายการโปรด — ชมพู, เลื่อนซ้าย-ขวา */}
        <View style={styles.favSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.favIconBg}>
                <Ionicons name="heart" size={14} color="#fff" />
              </View>
              <View>
                <Text style={styles.favTitle}>รายการโปรด</Text>
                <Text style={styles.favSubtitle}>ชีทที่คุณกดหัวใจไว้</Text>
              </View>
            </View>
            <View style={styles.favCountBadge}>
              <Text style={styles.favCountText}>{favoriteSheets.length} รายการ</Text>
            </View>
          </View>

          {favoriteSheets.length === 0 ? (
            <View style={styles.favEmpty}>
              <Ionicons name="heart-dislike-outline" size={28} color="#FECDD3" />
              <Text style={styles.favEmptyText}>
                {activeFilters > 0 ? "ไม่มีรายการโปรดที่ตรงกับตัวกรอง" : "ยังไม่มีรายการโปรด"}
              </Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hList}>
              {favoriteSheets.map((item) => (
                <View key={item.id} style={styles.hCard}>{renderCard(item)}</View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* 🛍 รายการที่ซื้อ — ม่วง, grid */}
        <View style={[styles.purchasedSection, { marginTop: 14 }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.purIconBg}>
                <Ionicons name="bag-check" size={14} color="#fff" />
              </View>
              <View>
                <Text style={styles.purTitle}>รายการที่ซื้อ</Text>
                <Text style={styles.purSubtitle}>ชีทที่คุณเป็นเจ้าของ</Text>
              </View>
            </View>
            <View style={styles.purCountBadge}>
              <Text style={styles.purCountText}>{purchasedSheets.length} รายการ</Text>
            </View>
          </View>

          {error ? (
            <View style={styles.center}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={onRefresh} style={styles.retryBtn}>
                <Text style={styles.retryText}>ลองใหม่</Text>
              </TouchableOpacity>
            </View>
          ) : purchasedSheets.length === 0 ? (
            <View style={styles.purEmpty}>
              <Ionicons name="bag-outline" size={40} color="#C7D2FE" />
              <Text style={styles.purEmptyTitle}>
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
              numColumns={3}
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
              {universityData.map((uni) => {
                const active = selectedUniId === uni.value;
                return (
                  <TouchableOpacity
                    key={uni.value}
                    style={[styles.uniRow, active && styles.uniRowActive]}
                    onPress={() => { setSelectedUniId(Number(uni.value)); setShowUniModal(false); }}
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

  // ── Filter Bar ──
  filterBar: {
    backgroundColor: "#fff",
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
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
  favSection: {
    marginTop: 16, marginHorizontal: 12, borderRadius: 20,
    backgroundColor: "#FFF1F2", borderWidth: 1.5, borderColor: "#FECDD3",
    overflow: "hidden", paddingTop: 16, paddingBottom: 16,
  },
  purchasedSection: {
    marginHorizontal: 12, borderRadius: 20,
    backgroundColor: "#F5F3FF", borderWidth: 1.5, borderColor: "#DDD6FE",
    overflow: "hidden", paddingTop: 16, paddingBottom: 8,
  },

  sectionHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, marginBottom: 14,
  },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },

  favIconBg: {
    width: 34, height: 34, borderRadius: 10, backgroundColor: "#F43F5E",
    justifyContent: "center", alignItems: "center",
    shadowColor: "#F43F5E", shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  favTitle:      { fontSize: 15, fontWeight: "800", color: "#BE123C" },
  favSubtitle:   { fontSize: 11, color: "#FDA4AF", marginTop: 1 },
  favCountBadge: { backgroundColor: "#F43F5E", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  favCountText:  { fontSize: 12, fontWeight: "700", color: "#fff" },

  purIconBg: {
    width: 34, height: 34, borderRadius: 10, backgroundColor: "#6C63FF",
    justifyContent: "center", alignItems: "center",
    shadowColor: "#6C63FF", shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  purTitle:      { fontSize: 15, fontWeight: "800", color: "#4338CA" },
  purSubtitle:   { fontSize: 11, color: "#A5B4FC", marginTop: 1 },
  purCountBadge: { backgroundColor: "#6C63FF", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  purCountText:  { fontSize: 12, fontWeight: "700", color: "#fff" },

  hList:   { paddingLeft: 16, paddingRight: 8 },
  hCard:   { marginRight: 8 },
  gridContent:   { paddingHorizontal: 8, paddingTop: 4 },
  columnWrapper: { justifyContent: "flex-start" },

  favEmpty: { alignItems: "center", paddingVertical: 24, gap: 6 },
  favEmptyText:  { fontSize: 13, fontWeight: "600", color: "#FB7185" },

  purEmpty:      { alignItems: "center", paddingVertical: 28, gap: 8 },
  purEmptyTitle: { fontSize: 14, fontWeight: "700", color: "#818CF8" },

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
  uniRowActive:     { backgroundColor: "#EEF2FF" },
  uniRowText:       { fontSize: 14, color: "#475569", flex: 1 },
  uniRowTextActive: { color: "#4F46E5", fontWeight: "700" },

  center:      { padding: 24, alignItems: "center" },
  loadingText: { marginTop: 10, color: "#64748B", fontSize: 14 },
  errorText:   { color: "#B91C1C", fontSize: 14, marginBottom: 12, textAlign: "center" },
  retryBtn:    { paddingVertical: 8, paddingHorizontal: 20, backgroundColor: "#B91C1C", borderRadius: 8 },
  retryText:   { color: "#FFF", fontWeight: "bold", fontSize: 14 },
});