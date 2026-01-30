import { Ionicons } from "@expo/vector-icons";
import { DrawerActions } from "@react-navigation/native";
import { useNavigation, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import FilterPopup, {
  FilterPopupHandle,
  SortType,
} from "../../components/FilterPopup";

import SheetCard from "../../components/sheetcard";

const { width } = Dimensions.get("window");

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  ratingAverage: number;
  seller: { name: string };
  tags: string[];
  updatedAt: string[];
}

export default function MarketplaceScreen() {
  const router = useRouter();
  const navigation = useNavigation();

  const filterRef = useRef<FilterPopupHandle>(null);
  const [sortType, setSortType] = useState<SortType>("newest");

  const [sheets, setSheets] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [isLastPage, setIsLastPage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. เพิ่ม State สำหรับเก็บคำค้นหา
  const [searchQuery, setSearchQuery] = useState("");

  const sortByUpdatedAt = (list: Product[], type: SortType) => {
    return [...list].sort((a, b) => {
      const timeA = new Date(a.updatedAt as any).getTime();
      const timeB = new Date(b.updatedAt as any).getTime();
      return type === "newest" ? timeB - timeA : timeA - timeB;
    });
  };

  // 2. ปรับปรุง fetchSheets ให้ส่งตัวแปรค้นหาไปยัง API
  const fetchSheets = async (
    pageNum: number,
    isRefresh = false,
    searchTxt = searchQuery,
  ) => {
    if ((isLastPage && !isRefresh) || (loadingMore && !isRefresh)) return;

    try {
      if (pageNum > 0) setLoadingMore(true);
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;

      const currentSize = pageNum === 0 ? 12 : 6;

      // ต่อ Query String สำหรับการค้นหา (Encode เพื่อรองรับภาษาไทย)
      const searchParam = searchTxt
        ? `&search=${encodeURIComponent(searchTxt)}`
        : "";
      const response = await fetch(
        `${apiUrl}/api/products?page=${pageNum}&size=${currentSize}${searchParam}`,
      );

      if (!response.ok) throw new Error(`Server Error: ${response.status}`);

      const data = await response.json();

      if (data && data.content) {
        const sorted = sortByUpdatedAt(data.content, sortType);

        setSheets((prev) => (isRefresh ? sorted : [...prev, ...sorted]));
        setIsLastPage(data.last);
        setPage(pageNum);
        setError(null);
      }
    } catch (err) {
      console.error("Marketplace Fetch Error:", err);
      setError("ไม่สามารถดึงข้อมูลได้");
      setIsLastPage(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchSheets(0, true);
  }, []);

  // 3. ฟังก์ชันจัดการเมื่อกดค้นหาหรือล้างค่า
  const handleSearch = () => {
    setLoading(true);
    setIsLastPage(false);
    fetchSheets(0, true, searchQuery);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setLoading(true);
    setIsLastPage(false);
    fetchSheets(0, true, "");
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setIsLastPage(false);
    fetchSheets(0, true, searchQuery);
  }, [searchQuery]);

  const handleLoadMore = () => {
    if (!loadingMore && !isLastPage && !loading) {
      fetchSheets(page + 1);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.banner}>
        <View>
          <Text style={styles.bannerTitle}>Marketplace</Text>
          <Text style={styles.bannerSubtitle}>
            GrowthSheet ชีทสรุปจากรุ่นพี่
          </Text>
        </View>
        <Ionicons name="flash" size={32} color="rgba(255,255,255,0.4)" />
      </View>

      <View style={styles.topActionRow}>
        <Text style={styles.resultsCount}>
          {searchQuery
            ? `ค้นหา: "${searchQuery}"`
            : `แสดง ${sheets.length} รายการ`}
        </Text>
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => filterRef.current?.show()}
        >
          <Ionicons name="options-outline" size={18} color="#6C63FF" />
          <Text style={styles.filterText}>ตัวกรอง</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.retryBtn}>
            <Text style={styles.retryText}>ลองใหม่อีกครั้ง</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderFooter = () => {
    if (loadingMore)
      return <ActivityIndicator style={{ margin: 20 }} color="#6C63FF" />;
    if (isLastPage && sheets.length > 0) {
      return (
        <View style={styles.footer}>
          <Text style={styles.footerText}>โหลดชีทครบแล้ว</Text>
        </View>
      );
    }
    return <View style={{ height: 80 }} />;
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <Ionicons name="menu" size={26} color="#333" />
        </TouchableOpacity>

        {/* Search Bar Logic */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color="#999" />
          <TextInput
            placeholder="ค้นหาชีทสรุป..."
            style={styles.searchInput}
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch} // ค้นหาเมื่อกด Enter
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={18} color="#CCC" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity onPress={() => router.push("/cart" as any)}>
          <Ionicons name="cart-outline" size={24} color="#6C63FF" />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingInfo}>กำลังค้นหา...</Text>
        </View>
      ) : (
        <FlatList
          data={sheets}
          renderItem={({ item }) => (
            <SheetCard item={item} isThreeColumns={true} />
          )}
          keyExtractor={(item) => item.id}
          numColumns={3}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#6C63FF"
            />
          }
        />
      )}

      <FilterPopup
        ref={filterRef}
        selected={sortType}
        onSelect={(value) => {
          setSortType(value);
          setSheets((prev) => sortByUpdatedAt(prev, value));
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 45,
    paddingBottom: 20,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    marginHorizontal: 10,
    paddingHorizontal: 12,
    height: 38,
    alignItems: "center",
  },
  searchInput: { flex: 1, marginLeft: 6, fontSize: 13, color: "#1F2937" },
  headerContainer: { paddingHorizontal: 16, paddingTop: 15 },
  banner: {
    backgroundColor: "#6C63FF",
    padding: 18,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  bannerTitle: { color: "#FFF", fontSize: 20, fontWeight: "bold" },
  bannerSubtitle: { color: "rgba(255,255,255,0.8)", fontSize: 11 },
  topActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  resultsCount: { fontSize: 13, fontWeight: "600", color: "#64748B" },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  filterText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#6C63FF",
    marginLeft: 4,
  },
  errorBox: {
    marginTop: 10,
    padding: 15,
    backgroundColor: "#FEE2E2",
    borderRadius: 10,
    alignItems: "center",
  },
  errorText: { color: "#B91C1C", fontSize: 13, marginBottom: 10 },
  retryBtn: {
    paddingVertical: 6,
    paddingHorizontal: 15,
    backgroundColor: "#B91C1C",
    borderRadius: 5,
  },
  retryText: { color: "#FFF", fontWeight: "bold", fontSize: 12 },
  listContent: { paddingHorizontal: 8, paddingBottom: 20 },
  columnWrapper: { justifyContent: "flex-start" },
  footer: { padding: 40, alignItems: "center" },
  footerText: { color: "#94A3B8", fontSize: 12, fontWeight: "500" },
  loadingInfo: { marginTop: 12, color: "#64748B", fontSize: 12 },
});
