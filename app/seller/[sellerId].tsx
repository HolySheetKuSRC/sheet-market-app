import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import SheetCard from '../../components/sheetcard';
import { apiRequest } from '../../utils/api';

const { width } = Dimensions.get('window');
const NUM_COLUMNS = 5;

// ─── Types ───────────────────────────────────────────────
interface SellerProfile {
  id: string;
  name: string;
  userPhotoUrl?: string | null;
  bio?: string | null;
  university?: string | null;
}

interface SalesVolume {
  success: boolean;
  salesVolume: number;
}

interface SheetPage {
  content: any[];
  totalElements: number;
  totalPages: number;
  number: number; // current page
}

// ─── Component ───────────────────────────────────────────
export default function SellerProfilePage() {
  const { sellerId } = useLocalSearchParams<{ sellerId: string }>();
  const router = useRouter();

  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [salesVolume, setSalesVolume] = useState<number>(0);
  const [sheets, setSheets] = useState<any[]>([]);
  const [totalSheets, setTotalSheets] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [statsLoaded, setStatsLoaded] = useState(false);

  // ── Initial Load (Promise.all 3 APIs) ─────────────────
  useEffect(() => {
    if (!sellerId) return;
    loadAll();
  }, [sellerId]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [profileRes, salesRes, sheetsRes] = await Promise.all([
        apiRequest(`/users/${sellerId}`, { method: 'GET' }),
        apiRequest(`/payments/sellers/${sellerId}/sales-volume`, { method: 'GET' }),
        apiRequest(
          `/products/sellers/${sellerId}/sheets?isPublished=true&page=0&size=10`,
          { method: 'GET' }
        ),
      ]);

      if (profileRes.ok) {
        setProfile(await profileRes.json());
      }

      if (salesRes.ok) {
        const salesData: SalesVolume = await salesRes.json();
        setSalesVolume(salesData.salesVolume ?? 0);
      }

      if (sheetsRes.ok) {
        const pageData: SheetPage = await sheetsRes.json();
        setSheets(pageData.content);
        setTotalSheets(pageData.totalElements);
        setTotalPages(pageData.totalPages);
        setCurrentPage(0);
      }
    } catch (e) {
      console.error('SellerProfile loadAll Error:', e);
    } finally {
      setLoading(false);
      setStatsLoaded(true);
    }
  };

  // ── Load More (Pagination) ─────────────────────────────
  const loadMoreSheets = async () => {
    if (loadingMore || currentPage + 1 >= totalPages) return;
    const nextPage = currentPage + 1;
    setLoadingMore(true);
    try {
      const res = await apiRequest(
        `/products/sellers/${sellerId}/sheets?isPublished=true&page=${nextPage}&size=10`,
        { method: 'GET' }
      );
      if (res.ok) {
        const pageData: SheetPage = await res.json();
        setSheets((prev) => [...prev, ...pageData.content]);
        setCurrentPage(nextPage);
      }
    } catch (e) {
      console.error('Load More Error:', e);
    } finally {
      setLoadingMore(false);
    }
  };

  // ─── Avatar helper ────────────────────────────────────
  const avatarColors = ['#6C63FF', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];
  const getAvatarColor = (name: string) =>
    avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  // ─── Header Component (แสดงเหนือ FlatList) ────────────
  const ListHeader = () => (
    <View>
      {/* ── Profile Banner ── */}
      <View style={styles.bannerBg}>
        {/* Decorative circles */}
        <View style={styles.bannerCircle1} />
        <View style={styles.bannerCircle2} />

        {/* Avatar */}
        <View style={styles.avatarWrapper}>
          {profile?.userPhotoUrl ? (
            <Image source={{ uri: profile.userPhotoUrl }} style={styles.avatarImg} />
          ) : (
            <View
              style={[
                styles.avatarFallback,
                { backgroundColor: getAvatarColor(profile?.name ?? '') },
              ]}
            >
              <Text style={styles.avatarInitials}>
                {getInitials(profile?.name ?? '')}
              </Text>
            </View>
          )}
          {/* Online dot */}
          <View style={styles.onlineDot} />
        </View>

        <Text style={styles.sellerName}>{profile?.name ?? '...'}</Text>
        {profile?.university && (
          <Text style={styles.sellerUniversity}>{profile.university}</Text>
        )}
        {profile?.bio && (
          <Text style={styles.sellerBio} numberOfLines={2}>
            {profile.bio}
          </Text>
        )}
      </View>

      {/* ── Stats Row ── */}
      <View style={styles.statsRow}>
        <StatBox
          icon="file-document-multiple-outline"
          value={statsLoaded ? String(totalSheets) : '—'}
          label="ชีทที่เปิดขาย"
          color="#6C63FF"
          bgColor="#EEF2FF"
        />
        <View style={styles.statsDivider} />
        <StatBox
          icon="cart-check"
          value={statsLoaded ? String(salesVolume) : '—'}
          label="ยอดขายรวม"
          color="#10B981"
          bgColor="#ECFDF5"
        />
      </View>

      {/* ── Section Title ── */}
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>ชีทสรุปทั้งหมด</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{totalSheets}</Text>
        </View>
      </View>
    </View>
  );

  // ─── Footer Loader ─────────────────────────────────────
  const ListFooter = () =>
    loadingMore ? (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color="#6C63FF" />
      </View>
    ) : null;

  // ─── Empty State ───────────────────────────────────────
  const ListEmpty = () =>
    !loading ? (
      <View style={styles.emptyState}>
        <MaterialCommunityIcons name="file-search-outline" size={48} color="#C4C9D4" />
        <Text style={styles.emptyText}>ยังไม่มีชีทที่เปิดขาย</Text>
      </View>
    ) : null;

  // ─── Render ───────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.fullCenter}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>โปรไฟล์ผู้ขาย</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Sheet Grid */}
      <FlatList
        data={sheets}
        keyExtractor={(item) => String(item.id)}
        numColumns={NUM_COLUMNS}
        ListHeaderComponent={<ListHeader />}
        ListFooterComponent={<ListFooter />}
        ListEmptyComponent={<ListEmpty />}
        onEndReached={loadMoreSheets}
        onEndReachedThreshold={0.3}
        contentContainerStyle={styles.flatListContent}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <SheetCard item={item} />
        )}
      />
    </View>
  );
}

// ─── StatBox Sub-component ────────────────────────────────
function StatBox({
  icon,
  value,
  label,
  color,
  bgColor,
}: {
  icon: string;
  value: string;
  label: string;
  color: string;
  bgColor: string;
}) {
  return (
    <View style={styles.statBox}>
      <View style={[styles.statIconWrap, { backgroundColor: bgColor }]}>
        <MaterialCommunityIcons name={icon as any} size={22} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────
const CARD_WIDTH_UNUSED = 0; // placeholder kept for StyleSheet ordering — remove with next refactor

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  fullCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 48,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },

  // Banner
  bannerBg: {
    backgroundColor: '#6C63FF',
    paddingTop: 32,
    paddingBottom: 28,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  bannerCircle1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -40,
    right: -40,
  },
  bannerCircle2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -30,
    left: -20,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarImg: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: '#FFF',
  },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  avatarInitials: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 1,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#34D399',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  sellerName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
  },
  sellerUniversity: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 6,
  },
  sellerBio: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 32,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 16,
    padding: 20,
    elevation: 6,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    marginBottom: 20,
  },
  statBox: { flex: 1, alignItems: 'center', gap: 6 },
  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  statsDivider: { width: 1, backgroundColor: '#F1F5F9', marginHorizontal: 8 },

  // Section Title
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  countBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: { fontSize: 12, color: '#6C63FF', fontWeight: '700' },

  // FlatList
  flatListContent: { paddingBottom: 40 },
  columnWrapper: { paddingHorizontal: 16, gap: 10, justifyContent: 'center' },
  cardWrapper: { marginBottom: 12 },

  // Pagination loader
  loadingMore: { paddingVertical: 20, alignItems: 'center' },

  // Empty
  emptyState: { alignItems: 'center', paddingTop: 40, paddingBottom: 20 },
  emptyText: { fontSize: 14, color: '#94A3B8', marginTop: 10 },
});