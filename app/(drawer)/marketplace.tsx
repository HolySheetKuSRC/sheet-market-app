import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Mock Data
const MOCK_SHEETS = [
  { id: '1', title: 'สรุป Calculus 1 Midterm', author: 'พี่คนนี้หิวข้าว', price: 59, rating: 4.5, tag: 'Calculus 1', image: 'https://via.placeholder.com/150' },
  { id: '2', title: 'Algorithm Exam Hack', author: 'The Coder', price: 99, rating: 5.0, tag: 'Algorithm', image: 'https://via.placeholder.com/150' },
  { id: '3', title: 'Calculus 2 Final + Crisis', author: 'InwZa', price: 59, rating: 4.0, tag: 'Calculus 2', image: 'https://via.placeholder.com/150' },
  { id: '4', title: 'Academic Writing Cheat Sheet', author: 'EngMaster', price: 49, rating: 3.0, tag: 'English', image: 'https://via.placeholder.com/150' },
  { id: '5', title: 'Data Struct & C++ Bootcamp', author: 'CodeKung', price: 89, rating: 3.5, tag: 'Programming', image: 'https://via.placeholder.com/150' },
  { id: '6', title: '# Zero to Hero Java', author: 'JavaMan', price: 59, rating: 3.0, tag: 'Java', image: 'https://via.placeholder.com/150' },
  { id: '7', title: 'Physics 1 สรุปสูตรลับ', author: 'หมอเจ็บ', price: 69, rating: 4.8, tag: 'Physics', image: 'https://via.placeholder.com/150' },
  { id: '8', title: 'Discrete Math สำหรับปี 1', author: 'LogicMaster', price: 45, rating: 4.2, tag: 'Discrete', image: 'https://via.placeholder.com/150' },
];

export default function MarketplaceScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  
  // --- ระบบ Pagination ---
  const ITEMS_PER_PAGE = 4;
  const [displaySheets, setDisplaySheets] = useState(MOCK_SHEETS.slice(0, ITEMS_PER_PAGE));
  const [currentPage, setCurrentPage] = useState(1);

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    const end = nextPage * ITEMS_PER_PAGE;
    setDisplaySheets(MOCK_SHEETS.slice(0, end));
    setCurrentPage(nextPage);
  };

  const hasMore = displaySheets.length < MOCK_SHEETS.length;

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.banner}>
        <View>
            <Text style={styles.bannerTitle}>สมัครเป็นผู้ขาย</Text>
        </View>
        <TouchableOpacity style={styles.bannerBtn}>
            <Text style={styles.bannerBtnText}>คลิกเลย</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        <Text style={styles.itemCount}>แสดง {displaySheets.length} จาก {MOCK_SHEETS.length} รายการ</Text>
        <TouchableOpacity style={styles.filterBtn}>
            <Ionicons name="options-outline" size={16} color="#666" />
            <Text style={styles.filterText}>ตัวกรอง</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!hasMore) return <View style={{ height: 50 }} />;
    return (
      <View style={styles.footerContainer}>
        <TouchableOpacity style={styles.loadMoreBtn} onPress={handleLoadMore}>
          <Text style={styles.loadMoreText}>โหลดเพิ่มเติม</Text>
          <Ionicons name="chevron-down" size={18} color="#6C63FF" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
          <Ionicons name="menu" size={28} color="#333" />
        </TouchableOpacity>
        <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#BBB" />
            <TextInput placeholder="ค้นหาชื่อวิชา, ชื่อชีท..." style={styles.searchInput} />
        </View>
        
        {/* --- แก้ไขปุ่มตะกร้าให้กดไปหน้า Cart ได้จริง --- */}
        <TouchableOpacity 
          style={styles.cartBtn} 
          onPress={() => router.push('/cart' as any)}
        >
            <Ionicons name="cart-outline" size={20} color="#6C63FF" />
            <Text style={styles.cartText}>ตะกร้า</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={displaySheets}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => router.push({ pathname: '/sheet/[id]', params: { id: item.id } } as any)}
          >
            <View style={styles.ratingBadge}>
                <Ionicons name="star" size={10} color="#FFD700" />
                <Text style={styles.ratingText}>{item.rating}</Text>
            </View>

            <Image source={{ uri: item.image }} style={styles.cardImage} />
            
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.cardDesc} numberOfLines={2}>สูตรครบ โจทย์เยอะ พร้อมเฉลยละเอียด...</Text>
                
                <View style={styles.tagRow}>
                    <View style={styles.tagBadge}>
                        <Text style={styles.tagBadgeText}>{item.tag}</Text>
                    </View>
                    <Text style={styles.price}>฿{item.price}</Text>
                </View>
            </View>
            
            <View style={styles.authorBadge}>
                <Text style={styles.authorText}>{item.author}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  topBar: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFF', paddingTop: 50, justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  searchBar: { flex: 1, flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 25, paddingHorizontal: 15, paddingVertical: 8, marginHorizontal: 10, alignItems: 'center', borderWidth: 1, borderColor: '#EEE' },
  searchInput: { flex: 1, marginLeft: 8 },
  cartBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20 },
  cartText: { color: '#6C63FF', fontWeight: 'bold', fontSize: 12, marginLeft: 4 },
  headerContainer: { marginBottom: 10 },
  banner: { backgroundColor: '#6C63FF', borderRadius: 12, padding: 25, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  bannerTitle: { fontSize: 24, fontWeight: '900', color: '#FFF' },
  bannerBtn: { backgroundColor: 'transparent', paddingVertical: 5 },
  bannerBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  filterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  itemCount: { fontSize: 12, color: '#333' },
  filterBtn: { flexDirection: 'row', backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, borderWidth: 1, borderColor: '#DDD', alignItems: 'center' },
  filterText: { fontSize: 12, color: '#666', marginLeft: 4 },
  card: { backgroundColor: '#FFF', width: '48%', borderRadius: 12, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#F0F0F0' },
  cardImage: { width: '100%', height: 140, backgroundColor: '#EEE' },
  ratingBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: '#FFF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, flexDirection: 'row', alignItems: 'center', zIndex: 1 },
  ratingText: { fontSize: 10, fontWeight: 'bold', marginLeft: 2 },
  cardContent: { padding: 10 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 4, color: '#333' },
  cardDesc: { fontSize: 10, color: '#999', marginBottom: 8 },
  tagRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tagBadge: { backgroundColor: '#E0F2FE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagBadgeText: { fontSize: 8, color: '#0EA5E9' },
  price: { fontSize: 16, fontWeight: 'bold', color: '#6C63FF' },
  authorBadge: { position: 'absolute', top: 110, right: 10, backgroundColor: '#FFF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, shadowColor: '#000', shadowOpacity: 0.1, elevation: 2 },
  authorText: { fontSize: 10, color: '#6C63FF', fontWeight: 'bold' },
  footerContainer: { paddingVertical: 20, alignItems: 'center', marginBottom: 30 },
  loadMoreBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25, borderWidth: 1, borderColor: '#6C63FF', shadowColor: "#6C63FF", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 2 },
  loadMoreText: { color: '#6C63FF', fontWeight: 'bold', fontSize: 14, marginRight: 8 },
});