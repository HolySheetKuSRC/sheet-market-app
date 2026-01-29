import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
// ตรวจสอบว่า Path และตัวพิมพ์เล็ก-ใหญ่ตรงกับในเครื่องคุณ
import SheetCard from '../../components/sheetcard';

// 1. กำหนด Interface ให้ตรงกับ JSON จาก Java Spring Boot
interface Sheet {
  id: string | number;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  ratingAverage: number;
  seller: {
    name: string;
  };
  tags: string[];
}

export default function MarketplaceScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  
  // 2. กำหนด Type <Sheet[]> เพื่อแก้ Error 'never'
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ฟังก์ชันดึงข้อมูลจาก Backend โดยใช้ EXPO_PUBLIC_API_URL จาก .env
  const fetchSheets = async () => {
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      
      // ตรวจสอบเผื่อลืมตั้งค่า .env
      if (!apiUrl) {
        console.error("ไม่ได้ตั้งค่า EXPO_PUBLIC_API_URL ใน .env");
        return;
      }

      const response = await fetch(`${apiUrl}/api/sheets`); 
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSheets(data);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSheets();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSheets();
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Banner ส่วนลด/ประชาสัมพันธ์ */}
      <View style={styles.banner}>
        <View style={styles.bannerTextContent}>
            <Text style={styles.bannerTitle}>สมัครเป็นผู้ขาย</Text>
            <Text style={styles.bannerSubtitle}>แบ่งปันความรู้และสร้างรายได้</Text>
        </View>
        <TouchableOpacity style={styles.bannerBtn}>
            <Text style={styles.bannerBtnText}>คลิกเลย</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        <Text style={styles.itemCount}>รายการทั้งหมด {sheets.length} รายการ</Text>
        <TouchableOpacity style={styles.filterBtn}>
            <Ionicons name="options-outline" size={16} color="#64748B" />
            <Text style={styles.filterText}>ตัวกรอง</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Top Bar (Header) */}
      <View style={styles.topBar}>
        <TouchableOpacity 
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="menu" size={28} color="#1E293B" />
        </TouchableOpacity>
        
        <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#94A3B8" />
            <TextInput 
              placeholder="ค้นหาชื่อวิชา, ชื่อชีท..." 
              style={styles.searchInput}
              placeholderTextColor="#94A3B8"
            />
        </View>
        
        <TouchableOpacity 
          style={styles.cartBtn} 
          onPress={() => router.push('/cart' as any)}
        >
            <Ionicons name="cart-outline" size={22} color="#4F46E5" />
            <View style={styles.cartBadge} />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
        </View>
      ) : (
        <FlatList
          data={sheets}
          ListHeaderComponent={renderHeader}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => <SheetCard item={item} />}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              tintColor="#4F46E5" 
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>ไม่พบรายการชีทสรุปในขณะนี้</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  topBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    backgroundColor: '#FFF', 
    paddingTop: 60, 
    paddingBottom: 16,
    justifyContent: 'space-between', 
    borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9' 
  },
  searchBar: { 
    flex: 1, 
    flexDirection: 'row', 
    backgroundColor: '#F1F5F9', 
    borderRadius: 12, 
    paddingHorizontal: 12, 
    paddingVertical: 10, 
    marginHorizontal: 12, 
    alignItems: 'center' 
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#1E293B' },
  cartBtn: { 
    padding: 8, 
    backgroundColor: '#EEF2FF', 
    borderRadius: 12, 
    position: 'relative' 
  },
  cartBadge: { 
    position: 'absolute', 
    top: 6, 
    right: 6, 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFF'
  },
  headerContainer: { marginBottom: 10 },
  banner: { 
    backgroundColor: '#4F46E5', 
    borderRadius: 16, 
    padding: 20, 
    marginVertical: 10, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    shadowColor: "#4F46E5",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5
  },
  bannerTextContent: { flex: 1 },
  bannerTitle: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  bannerSubtitle: { fontSize: 12, color: '#E0E7FF', marginTop: 2 },
  bannerBtn: { 
    backgroundColor: '#FFF', 
    paddingVertical: 8, 
    paddingHorizontal: 16, 
    borderRadius: 10 
  },
  bannerBtnText: { color: '#4F46E5', fontWeight: 'bold', fontSize: 14 },
  filterRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 10 
  },
  itemCount: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  filterBtn: { 
    flexDirection: 'row', 
    backgroundColor: '#FFF', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    alignItems: 'center' 
  },
  filterText: { fontSize: 12, color: '#64748B', marginLeft: 4, fontWeight: '600' },
  listContent: { padding: 16 },
  columnWrapper: { justifyContent: 'space-between' },
  loadingText: { marginTop: 10, color: '#64748B', fontSize: 14 },
  emptyText: { color: '#94A3B8', fontSize: 16 },
});