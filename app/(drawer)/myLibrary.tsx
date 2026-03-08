import { Ionicons } from "@expo/vector-icons";
import { DrawerActions } from "@react-navigation/native";
import * as FileSystem from "expo-file-system/legacy";
import { useFocusEffect, useNavigation, useRouter } from "expo-router"; // ✅ 1. เพิ่ม useFocusEffect
import * as Sharing from "expo-sharing";
import React, { useCallback, useState } from "react"; // ✅ เอา useEffect ออกเพราะไม่ได้ใช้แล้ว
import {
  ActivityIndicator, Alert, FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import SheetCard from "../../components/sheetcard";
import { apiRequest } from "../../utils/api";

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
  fileUrl?: string;
}


export default function MyLibraryScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const [likedSheets, setLikedSheets] = useState<string[]>([]);
  const [sheets, setSheets] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPurchasedSheets = async () => {
    try {
      setError(null);

      const response = await apiRequest(
        "/products/purchased?page=0&size=9",
        { method: "GET" }
      );

      if (!response.ok) throw new Error(`Server Error: ${response.status}`);

      const data = await response.json();

      // ✅ รองรับ Page<SheetCardResponse>
      setSheets(data.content || []);
    } catch (err) {
      console.error("MyLibrary Fetch Error:", err);
      setError("ไม่สามารถดึงข้อมูลชั้นหนังสือได้");
    } finally {
      setLoading(false);
      setRefreshing(false); // ปิดสถานะ refresh เมื่อโหลดเสร็จ
    }
  };

  // ✅ 2. เปลี่ยนมาใช้ useFocusEffect เพื่อให้โหลดใหม่ทุกครั้งที่กดเข้าหน้านี้จาก Sidebar
  useFocusEffect(
    useCallback(() => {
      fetchPurchasedSheets();
    }, [])
  );

  // ✅ ฟังก์ชัน Pull to Refresh ทำงานได้ปกติเพราะมีการ setRefreshing(false) ใน finally แล้ว
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPurchasedSheets();
  }, []);

  const handleDownload = async (id: string) => {
    try {
      const response = await apiRequest(`/products/${id}/download`, {
        method: "GET",
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "ไม่สามารถดาวน์โหลดไฟล์ได้");
      }

      const data = await response.json();
      const url = data.fileUrl;
      const sheetName = data.sheetName;

      if (!url || !sheetName) {
        throw new Error("ข้อมูลไฟล์ไม่ถูกต้อง");
      }

      console.log("Downloading from:", url);
      console.log("Sheet name:", sheetName);

      const safeName = sheetName.replace(/[<>:"/\\|?*]+/g, "");
      const fileName = `${safeName}.pdf`;
      const fileUri = FileSystem.documentDirectory + fileName;

      // ✅ เช็คไฟล์ซ้ำ
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        console.log("File already exists:", fileUri);

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        }
        return;
      }

      const downloadResumable =
        FileSystem.createDownloadResumable(url, fileUri);

      const result = await downloadResumable.downloadAsync();

      if (!result?.uri) {
        throw new Error("Download failed");
      }

      console.log("File saved to:", result.uri);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(result.uri);
      } else {
        Alert.alert("Downloaded", "ไฟล์ถูกดาวน์โหลดแล้ว");
      }
    } catch (err: any) {
      console.log("Download error:", err);
      Alert.alert("Error", err.message);
    }
  };

  const toggleLike = (id: string) => {
    setLikedSheets((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const renderEmptyState = () => {
    if (loading) return null;

    if (error) {
      return (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.retryBtn}>
            <Text style={styles.retryText}>ลองใหม่อีกครั้ง</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.center}>
        <Ionicons name="library-outline" size={80} color="#CCC" />
        <Text style={styles.emptyText}>
          คุณยังไม่มีชีทในชั้นหนังสือเลย
        </Text>
        <TouchableOpacity
          style={styles.exploreBtn}
          onPress={() => router.push("/marketplace")}
        >
          <Text style={styles.exploreText}>ไปหาชีทอ่านกันเลย</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <Ionicons name="menu" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ชั้นหนังสือของฉัน</Text>
        <View style={{ width: 28 }} />
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingInfo}>
            กำลังโหลดหนังสือของคุณ...
          </Text>
        </View>
      ) : (
        <FlatList
          data={sheets}
          renderItem={({ item }) => (
            <SheetCard
              item={item}
              isThreeColumns={true}
              isOwned={true}

              isLiked={likedSheets.includes(item.id)}
              onLikePress={() => toggleLike(item.id)}

              onPress={() => {
                router.push({
                  pathname: "/sheet/openPDF",
                  params: { id: item.id.toString() },
                });
              }}

              onDownloadPress={() => handleDownload(item.id)}
            />
          )}
          keyExtractor={(item) => item.id}
          numColumns={3}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#6C63FF"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#FFF",
    paddingTop: 50,
    paddingBottom: 15,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 20,
    paddingTop: 10,
  },
  columnWrapper: { justifyContent: "flex-start" },
  emptyText: { color: "#999", marginTop: 10, fontSize: 16 },
  loadingInfo: { marginTop: 12, color: "#64748B", fontSize: 14 },
  errorText: { color: "#B91C1C", fontSize: 14, marginBottom: 15 },
  retryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: "#B91C1C",
    borderRadius: 8,
  },
  retryText: { color: "#FFF", fontWeight: "bold", fontSize: 14 },
  exploreBtn: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#6C63FF",
    borderRadius: 25,
  },
  exploreText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
  },
});