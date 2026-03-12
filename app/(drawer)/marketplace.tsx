import {
    Mitr_400Regular,
    Mitr_500Medium,
    Mitr_600SemiBold,
    useFonts,
} from "@expo-google-fonts/mitr";
import { Ionicons } from "@expo/vector-icons";
import { DrawerActions } from "@react-navigation/native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";

import { universityData as rawUniversityData } from "../../constants/universities";
import { apiRequest } from "../../utils/api";

import FilterPopup, {
    FilterPopupHandle,
    SORT_OPTIONS,
    SortType,
} from "../../components/FilterPopup";

import CartIconWithBadge from "../../components/CartIconWithBadge";
import SheetCard from "../../components/sheetcard";

const SIDEBAR_W = 280;
const CARD_GAP = 10;
const H_PAD = 14;

const SORT_LABELS: Record<SortType, string> = {
  newest:         "ใหม่ที่สุด",
  oldest:         "เก่าที่สุด",
  price_high:     "ราคา: สูง→ต่ำ",
  price_low:      "ราคา: ต่ำ→สูง",
  highest_rating: "คะแนนสูงสุด",
  lowest_rating:  "คะแนนต่ำสุด",
  most_popular:   "ยอดนิยม",
};

const universityData = rawUniversityData.map((u) => ({
  label: u.label,
  value: u.value,
}));

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string;
  averageRating: number;
  seller: { name: string };
  tags: string[];
  updatedAt: string[];
  university?: any;
}

export default function MarketplaceScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { width: screenWidth } = useWindowDimensions();
  const isLargeScreen = screenWidth >= 768;

  const [fontsLoaded] = useFonts({ Mitr_400Regular, Mitr_500Medium, Mitr_600SemiBold });

  const filterRef = useRef<FilterPopupHandle>(null);
  const [sortType, setSortType] = useState<SortType>("newest");
  const [filterSidebarOpen, setFilterSidebarOpen] = useState(false);

  const [sheets, setSheets] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [isLastPage, setIsLastPage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { search: searchParam } = useLocalSearchParams<{ search?: string }>();

  const [searchQuery, setSearchQuery] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [selectedUniId, setSelectedUniId] = useState<string | number | null>(null);
  const [showUniModal, setShowUniModal] = useState(false);

  const selectedUniLabel = selectedUniId
    ? universityData.find((u) => u.value === selectedUniId)?.label ?? "มหาวิทยาลัย"
    : null;

  // Derive effective list width from screenWidth, accounting for the sidebar when open.
  const effectiveWidth = isLargeScreen && filterSidebarOpen ? screenWidth - SIDEBAR_W : screenWidth;

  const numColumns =
    effectiveWidth >= 1280 ? 5
    : effectiveWidth >= 1024 ? 4
    : effectiveWidth >= 768  ? 3
    : 2;

  const parseDate = (dateVal: any) => {
    if (!dateVal) return 0;
    if (Array.isArray(dateVal)) {
      const [year, month, day, hour = 0, minute = 0, second = 0] = dateVal;
      return new Date(year, month - 1, day, hour, minute, second).getTime();
    }
    return new Date(dateVal).getTime() || 0;
  };

  const sortByUpdatedAt = (list: Product[], type: SortType): Product[] => {
    if (!list || list.length === 0) return [];
    const sortedList = [...list].sort((a, b) => {
      switch (type) {
        case "newest":
          return parseDate(b.updatedAt) - parseDate(a.updatedAt);
        case "oldest":
          return parseDate(a.updatedAt) - parseDate(b.updatedAt);
        case "price_high":
          return (Number(b.price) || 0) - (Number(a.price) || 0);
        case "price_low":
          return (Number(a.price) || 0) - (Number(b.price) || 0);
        case "highest_rating":
          return (Number(b.averageRating) || 0) - (Number(a.averageRating) || 0);
        case "lowest_rating":
          return (Number(a.averageRating) || 0) - (Number(b.averageRating) || 0);
        case "most_popular":
          return (Number(b.averageRating) || 0) - (Number(a.averageRating) || 0);
        default:
          return 0;
      }
    });
    return sortedList;
  };

  const sortedSheets = useMemo(() => {
    let filteredList = sheets;

    if (submittedSearch && submittedSearch.trim() !== "") {
      const kw = submittedSearch.trim().toLowerCase();
      filteredList = filteredList.filter(sheet =>
        sheet.title?.toLowerCase().includes(kw)
      );
    }

    if (selectedUniId && selectedUniId !== 'all' && selectedUniId !== 'ทั้งหมด') {
      filteredList = filteredList.filter(sheet => sheet.university?.id === Number(selectedUniId));
    }

    return sortByUpdatedAt(filteredList, sortType);
  }, [sheets, sortType, selectedUniId, submittedSearch]);

  const fetchSheets = async (
    pageNum: number,
    isRefresh = false,
    searchTxt = submittedSearch,
  ) => {
    if ((isLastPage && !isRefresh) || (loadingMore && !isRefresh)) return;

    try {
      if (pageNum > 0) setLoadingMore(true);

      const currentSize = pageNum === 0 ? 12 : 6;

      // The backend has no /search endpoint; title filtering is done client-side.
      const url = `/products?page=${pageNum}&size=${currentSize}&isPublished=true`;

      // ไม่ต้องใส่ URL เต็ม ใส่แค่ path ข้างหลัง (/products...)
      // ไม่ต้องทำ Header เอง apiRequest จัดการให้
      const response = await apiRequest(url, { method: 'GET' });

      if (!response.ok) throw new Error(`Server Error: ${response.status}`);

      const data = await response.json();

      if (data && data.content) {
        setSheets((prev) => (isRefresh ? data.content : [...prev, ...data.content]));
        setIsLastPage(data.last);
        setPage(pageNum);
        setError(null);

        // 🗺️ Diagnostic: Extract unique universities from API response
        if (isRefresh || pageNum === 0) {
          const uniMap = new Map<number, string>();
          data.content.forEach((s: any) => {
            if (s.university?.id != null) {
              uniMap.set(s.university.id, s.university.name);
            }
          });
          console.log('🗺️ DB UNIVERSITIES MAP:', JSON.stringify(Array.from(uniMap.entries()).map(([id, name]) => ({ id, name }))));
        }
      }
    } catch (err) {
      console.error("Marketplace Fetch Error:", err);
      setError("ไม่สามารถดึงข้อมูลได้");
      setLoading(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // Apply search keyword passed via navigation params (e.g. from Home screen)
  useEffect(() => {
    if (searchParam) {
      setSearchQuery(searchParam);
      setSubmittedSearch(searchParam);
    }
  }, [searchParam]);

  useEffect(() => {
    setLoading(true);
    setIsLastPage(false);
    setSheets([]); // Force UI flush so user sees immediate feedback
    fetchSheets(0, true, submittedSearch);
  }, [submittedSearch]);

  const handleSearch = () => {
    setSubmittedSearch(searchQuery);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSubmittedSearch("");
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setIsLastPage(false);
    fetchSheets(0, true, submittedSearch);
  }, [submittedSearch, selectedUniId]);

  const handleLoadMore = () => {
    if (!loadingMore && !isLastPage && !loading) {
      fetchSheets(page + 1);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerDecCircle1} />
        <View style={styles.bannerDecCircle2} />
        <View>
          <Text style={styles.bannerTitle}>ซื้อชีทสรุป</Text>
          <Text style={styles.bannerSubtitle}>GrowthSheet — ชีทจากรุ่นพี่เพื่อเสริมความเข้าใจ</Text>
        </View>
        <View style={styles.bannerIcon}>
          <Ionicons name="book" size={24} color="#6366F1" />
        </View>
      </View>

      {/* Action row */}
      <View style={styles.topActionRow}>
        <Text style={styles.resultsCount}>
          {searchQuery
            ? `ผลการค้นหา "${searchQuery}"`
            : `แสดง ${sortedSheets.length} รายการ`}
        </Text>
        <TouchableOpacity
          style={[styles.filterBtn, filterSidebarOpen && styles.filterBtnActive]}
          onPress={() => {
            if (isLargeScreen) {
              setFilterSidebarOpen((v) => !v);
            } else {
              filterRef.current?.show();
            }
          }}
        >
          <Ionicons name="options-outline" size={15} color={filterSidebarOpen ? "#fff" : "#6366F1"} />
          <Text style={[styles.filterBtnText, filterSidebarOpen && styles.filterBtnTextActive]}>
            ตัวกรอง
          </Text>
          {sortType !== "newest" && !filterSidebarOpen && <View style={styles.activeDot} />}
        </TouchableOpacity>
      </View>

      {/* Filter Row chips */}
      <View style={styles.activeFiltersRow}>
        <TouchableOpacity
          style={[styles.uniChip, selectedUniId !== null && styles.uniChipActive]}
          onPress={() => setShowUniModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="school-outline" size={13} color={selectedUniId !== null ? "#fff" : "#6C63FF"} />
          <Text
            style={[styles.uniChipText, selectedUniId !== null && styles.uniChipTextActive]}
            numberOfLines={1}
          >
            {selectedUniLabel ?? "ค้นหาตามมหาวิทยาลัย"}
          </Text>
          <Ionicons name="chevron-down" size={11} color={selectedUniId !== null ? "#fff" : "#6C63FF"} />
        </TouchableOpacity>

        {selectedUniId !== null && (
          <TouchableOpacity
            style={styles.clearUniBtn}
            onPress={() => {
              setSelectedUniId(null);
            }}
          >
            <Ionicons name="close-circle" size={16} color="#F43F5E" />
          </TouchableOpacity>
        )}

        {/* Active sort chip */}
        {sortType !== "newest" && (
          <View style={styles.activeSortChip}>
            <Ionicons name="swap-vertical-outline" size={12} color="#6366F1" />
            <Text style={styles.activeSortText}>{SORT_LABELS[sortType]}</Text>
            <TouchableOpacity
              onPress={() => {
                setSortType("newest");
                // ไม่ต้อง setSheets ตรงนี้ เพราะใช้ useMemo แล้ว
              }}
            >
              <Ionicons name="close-circle" size={13} color="#6366F1" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.retryBtn}>
            <Text style={styles.retryText}>ลองใหม่</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderFooter = () => {
    if (loadingMore)
      return <ActivityIndicator style={{ margin: 20 }} color="#6366F1" />;
    if (isLastPage && sheets.length > 0) {
      return (
        <View style={styles.footer}>
          <Text style={styles.footerText}>โหลดชีทครบแล้ว 🎉</Text>
        </View>
      );
    }
    return <View style={{ height: 80 }} />;
  };

  const renderSidebar = () => (
    <View style={styles.filterSidebar}>
      <View style={styles.sidebarHeader}>
        <Text style={styles.sidebarTitle}>เรียงลำดับ</Text>
        <TouchableOpacity onPress={() => setFilterSidebarOpen(false)}>
          <Ionicons name="close" size={20} color="#94A3B8" />
        </TouchableOpacity>
      </View>
      {SORT_OPTIONS.map(({ label, value, icon }) => {
        const isActive = sortType === value;
        return (
          <TouchableOpacity
            key={value}
            style={[styles.sidebarItem, isActive && styles.sidebarItemActive]}
            onPress={() => {
              setSortType(value);
              // ไม่ต้อง setSheets เพราะใช้ useMemo
            }}
          >
            <View style={[styles.sidebarIconWrap, isActive && styles.sidebarIconActive]}>
              <Ionicons name={icon} size={16} color={isActive ? "#6366F1" : "#94A3B8"} />
            </View>
            <Text style={[styles.sidebarItemText, isActive && styles.sidebarItemTextActive]}>
              {label}
            </Text>
            {isActive && <Ionicons name="checkmark-circle" size={18} color="#6366F1" />}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <Ionicons name="menu" size={24} color="#3730A3" />
        </TouchableOpacity>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={15} color="#B2B3F4" />
          <TextInput
            placeholder="ค้นหาชื่อวิชา, ชื่อชีท, หรือรหัสวิชา"
            style={styles.searchInput}
            placeholderTextColor="#B2B3F4"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={17} color="#C7D2FE" />
            </TouchableOpacity>
          )}
        </View>

        <CartIconWithBadge
          iconSize={22}
          iconColor="#6366F1"
          containerStyle={styles.cartBtn}
        />
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingInfo}>กำลังค้นหา...</Text>
        </View>
      ) : (
        <View style={styles.mainRow}>
          {/* Grid area — flex:1 so sidebar pushes it */}
          <View style={styles.listArea}>
            <FlatList
              key={numColumns.toString()}
              data={sortedSheets}
              renderItem={({ item }) => (
                <SheetCard item={item} />
              )}
              keyExtractor={(item) => String(item.id)}
              numColumns={numColumns}
              columnWrapperStyle={{ gap: CARD_GAP, paddingHorizontal: H_PAD, justifyContent: 'center' }}
              contentContainerStyle={styles.listContent}
              ListHeaderComponent={renderHeader}
              ListFooterComponent={renderFooter}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.1}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#6366F1"
                />
              }
            />
          </View>

          {/* Sidebar push (large screen only) */}
          {isLargeScreen && filterSidebarOpen && renderSidebar()}
        </View>
      )}

      {/* Font Check Overlay Container */}
      {!fontsLoaded && (
        <View style={styles.absoluteCenterOverlay}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      )}

      {/* Mobile filter popup */}
      <FilterPopup
        ref={filterRef}
        selected={sortType}
        onSelect={(value) => {
          setSortType(value);
        }}
      />

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
                const active = selectedUniId === uni.value;
                return (
                  <TouchableOpacity
                    key={uni.value?.toString() || index.toString()}
                    style={[styles.uniRow, active && styles.uniRowActive]}
                    onPress={() => { console.log('🎯 SETTING selectedUniId to:', uni.value); setSelectedUniId(uni.value); setShowUniModal(false); }}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5FF" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  absoluteCenterOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: "#F5F5FF", justifyContent: "center", alignItems: "center", zIndex: 999 },
  loadingInfo: {
    marginTop: 12,
    color: "#6366F1",
    fontSize: 13,
    fontFamily: "Mitr_400Regular",
  },

  // Top bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2FF",
    gap: 10,
  },
  menuBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#F4F4FF",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 40,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#E0E0FF",
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Mitr_400Regular",
    color: "#292524",
  },
  cartBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },

  // Layout
  mainRow: { flex: 1, flexDirection: "row" },
  listArea: { flex: 1 },

  // Header
  headerContainer: { paddingHorizontal: H_PAD, paddingTop: 14, paddingBottom: 4 },
  banner: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E0E7FF",
    padding: 18,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    overflow: "hidden",
    shadowColor: "#6366F1",
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  bannerDecCircle1: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#EEF2FF",
    top: -40,
    right: 60,
  },
  bannerDecCircle2: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E0E7FF",
    bottom: -30,
    right: -10,
  },
  bannerTitle: {
    color: "#3730A3",
    fontSize: 22,
    fontFamily: "Mitr_600SemiBold",
    lineHeight: 28,
  },
  bannerSubtitle: {
    color: "#6366F1",
    fontSize: 12,
    fontFamily: "Mitr_400Regular",
    marginTop: 2,
  },
  bannerIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },

  topActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  resultsCount: {
    fontSize: 13,
    fontFamily: "Mitr_400Regular",
    color: "#292524",
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 5,
  },
  filterBtnActive: {
    backgroundColor: "#6366F1",
  },
  filterBtnText: {
    fontSize: 14,
    fontFamily: "Mitr_500Medium",
    color: "#6366F1",
  },
  filterBtnTextActive: {
    color: "#FFF",
  },
  activeFiltersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  uniChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5,
    borderColor: "#C7D2FE", backgroundColor: "#EEF2FF", maxWidth: 180,
  },
  uniChipActive: { backgroundColor: "#6C63FF", borderColor: "#6C63FF" },
  uniChipText: { fontSize: 13, fontFamily: "Mitr_500Medium", color: "#6C63FF", flex: 1 },
  uniChipTextActive: { color: "#fff" },

  clearUniBtn: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 2,
  },

  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#F43F5E",
  },
  activeSortChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  activeSortText: {
    fontSize: 12,
    fontFamily: "Mitr_400Regular",
    color: "#6366F1",
  },

  errorBox: {
    marginTop: 10,
    padding: 14,
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    alignItems: "center",
  },
  errorText: { color: "#B91C1C", fontSize: 13, fontFamily: "Mitr_400Regular" },
  retryBtn: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: "#B91C1C",
    borderRadius: 20,
  },
  retryText: { color: "#FFF", fontFamily: "Mitr_500Medium", fontSize: 12 },

  listContent: { paddingBottom: 20 },
  footer: { padding: 40, alignItems: "center" },
  footerText: {
    color: "#6366F1",
    fontSize: 13,
    fontFamily: "Mitr_400Regular",
  },

  // Filter push sidebar
  filterSidebar: {
    width: SIDEBAR_W,
    backgroundColor: "#FFF",
    borderLeftWidth: 1,
    borderLeftColor: "#EEF2FF",
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  sidebarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sidebarTitle: {
    fontSize: 16,
    fontFamily: "Mitr_600SemiBold",
    color: "#3730A3",
  },
  sidebarItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 10,
    marginBottom: 4,
  },
  sidebarItemActive: { backgroundColor: "#EEF2FF" },
  sidebarIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  sidebarIconActive: { backgroundColor: "#E0E7FF" },
  sidebarItemText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Mitr_400Regular",
    color: "#475569",
  },
  sidebarItemTextActive: {
    color: "#6366F1",
    fontFamily: "Mitr_500Medium",
  },

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
  modalTitle: { fontSize: 16, fontFamily: "Mitr_600SemiBold", color: "#1E293B" },

  uniRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#F8FAFC",
  },
  uniRowActive: { backgroundColor: "#EEF2FF" },
  uniRowText: { fontSize: 14, fontFamily: "Mitr_400Regular", color: "#475569", flex: 1 },
  uniRowTextActive: { color: "#4F46E5", fontFamily: "Mitr_600SemiBold" },
});