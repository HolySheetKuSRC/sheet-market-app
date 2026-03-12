import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import CartIconWithBadge from '../../components/CartIconWithBadge';
import SheetCard from '../../components/sheetcard';

import { apiRequest } from '../../utils/api';

interface SheetDetailData {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  previewUrl: string | null;
  university?: { name: string };
  category?: { name: string };
  tags: string[];
  ratingCount: number;
  ratingAverage: number;
  pageCount: number | null;
  createdAt: string;
  updatedAt: string;
  seller: {
    id: string;
    name: string;
    userPhotoUrl?: string | null;
  };
}

interface UserDTO {
  id: string;
  name: string;
  userPhotoUrl?: string | null;
}

interface ReviewData {
  id: string;
  sheetId: string;
  user: UserDTO;
  comment: string;
  rating: number;
  createdAt: string; 
}

export default function SheetDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [sheet, setSheet] = useState<SheetDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [cartItemId, setCartItemId] = useState<string | null>(null);
  const [relatedSheets, setRelatedSheets] = useState<any[]>([]);
  const [sellerProfile, setSellerProfile] = useState<{
    id: string;
    name: string;
    userPhotoUrl?: string | null;
    bio?: string | null;
  } | null>(null);

  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [aiData, setAiData] = useState<any>(null);

  // ✅ คำนวณค่าจาก Reviews State โดยตรง (Derived Values)
  const reviewCount = reviews.length;
  const reviewAverage = reviewCount > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount 
    : 0;

  const fetchSellerProfile = async (sellerId: string) => {
    try {
      const res = await apiRequest(`/users/${sellerId}`, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        setSellerProfile(data);
      }
    } catch (e) {
      console.error('Fetch Seller Profile Error:', e);
    }
  };

  // ✅ ฟังก์ชันดึงชีทที่ใกล้เคียง (อิงจาก tags)
  const fetchRelatedSheets = async (tags: string[]) => {
    if (!tags || tags.length === 0) return;
    try {
      // ส่ง query เป็น tags เพื่อให้ backend ค้นหาชีทที่มีแท็กตรงกัน (เฉพาะที่ publish แล้ว)
      const response = await apiRequest(`/products?tags=${tags.join(',')}&size=6&isPublished=true`, { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        const sheets = data.content || [];
        // กรองเอาชีทปัจจุบันออก และกรองเฉพาะที่ publish แล้ว
        const filteredSheets = sheets.filter((item: any) =>
          String(item.id) !== String(id) &&
          (item.isPublished === true || item.status === 'PUBLISHED')
        );
        setRelatedSheets(filteredSheets);
      }
    } catch (error) {
      console.error("Fetch Related Sheets Error:", error);
    }
  };

  const checkCartStatus = async () => {
    try {
      const response = await apiRequest('/cart/user', { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        const items = data.items || [];
        const foundItem = items.find((item: any) => {
          const itemIdInCart = item.product?.id || item.sheetId || item.id;
          return String(itemIdInCart) === String(id);
        });
        if (foundItem) {
          setIsInCart(true);
          setCartItemId(String(foundItem.id));
        } else {
          setIsInCart(false);
          setCartItemId(null);
        }
      }
    } catch (error) {
      console.error("Check Cart Error:", error);
    }
  };

  const fetchSheetDetail = async () => {
    try {
      setLoading(true);
      const response = await apiRequest(`/products/${id}`, { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        setSheet(data);

        // ดึงโปรไฟล์คนขาย
        if (data.seller?.id) {
          fetchSellerProfile(data.seller.id);
        }

        // ✅ เรียกดึงชีทใกล้เคียงโดยใช้ tags ของชีทนี้
        if (data.tags && data.tags.length > 0) {
          fetchRelatedSheets(data.tags);
        }
      }
    } catch (error) {
      console.error("Fetch Detail Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const response = await apiRequest(`/products/${id}/reviews`, { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      }
    } catch (error) {
      console.error("Fetch Reviews Error:", error);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchSheetDetail();
      fetchReviews();
    }
  }, [id]);

  useEffect(() => {
    const fetchAI = async () => {
      try {
        const res = await fetch(`http://165.232.171.127/sheets/jobs/by-sheet/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'completed' && data.result) {
            setAiData(data.result);
          }
        }
      } catch (error) {
        console.log('AI Data not available', error);
      }
    };
    if (id) fetchAI();
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      if (id) {
        checkCartStatus();
      }
    }, [id])
  );

  const handleToggleCart = async () => {
    if (!sheet?.id) return;
    try {
      setAddingToCart(true);
      if (isInCart && cartItemId) {
        const response = await apiRequest(`/cart`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cartItemIds: [cartItemId] }),
        });
        if (response.ok) {
          Alert.alert("สำเร็จ", "นำออกจากตะกร้าแล้ว");
          await checkCartStatus();
        }
      } else {
        const response = await apiRequest('/cart/add', {
          method: 'POST',
          body: JSON.stringify({ sheetId: String(sheet.id) })
        });
        if (response.ok) {
          Alert.alert("สำเร็จ", "เพิ่มลงในตะกร้าแล้ว", [
            { text: "เลือกซื้อต่อ", style: "cancel" },
            { text: "ไปที่ตะกร้า", onPress: () => router.push('/cart' as any) }
          ]);
          await checkCartStatus();
        } else if (response.status === 401) {
          router.push('/login' as any);
        }
      }
    } catch (error) {
      console.error("Cart Toggle Error:", error);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = () => {
    if (!sheet) return;
    router.push({
      pathname: '/checkout',
      params: {
        sheetId: String(sheet.id),
        title: sheet.title,
        price: String(sheet.price),
        sellerName: sheet.seller?.name || 'ไม่ระบุชื่อผู้ขาย',
        type: 'direct'
      }
    } as any);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderStars = (rating: number, size: number = 14) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Ionicons
        key={i}
        name={i < Math.floor(rating) ? 'star' : i < rating ? 'star-half' : 'star-outline'}
        size={size}
        color="#FBBF24"
        style={{ marginRight: 1 }}
      />
    ));
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const avatarColors = ['#6C63FF', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];
  const getAvatarColor = (name: string) => {
    const index = (name?.charCodeAt(0) || 0) % avatarColors.length;
    return avatarColors[index];
  };

  if (loading || !sheet) return (
    <View style={styles.center}><ActivityIndicator size="large" color="#6C63FF" /></View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>รายละเอียดชีท</Text>
        <View style={styles.headerActions}>
          <CartIconWithBadge
            iconSize={22}
            iconColor="#333"
            containerStyle={styles.iconBtn}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Centered Max-Width Container (iPad-First) ── */}
        <View style={styles.centeredContainer}>

          {/* Top Section: 2-Column Layout */}
          <View style={styles.topRow}>

            {/* Left Column: Cover Image */}
            <View style={styles.leftColumn}>
              <View style={styles.mainImageWrapper}>
                <Image source={{ uri: sheet.imageUrl }} style={styles.mainImage} resizeMode="contain" />
                <View style={styles.mainImageBottomFade} />
              </View>
              <TouchableOpacity style={styles.previewBadge}>
                <Ionicons name="eye-outline" size={14} color="#FFF" />
                <Text style={styles.previewText}>ดูตัวอย่างไฟล์ PDF</Text>
              </TouchableOpacity>
            </View>

            {/* Right Column: Details & Actions */}
            <View style={styles.rightColumn}>
              <Text style={styles.title}>{sheet.title}</Text>
              <View style={styles.tagRow}>
                {sheet.tags?.map((tag, i) => (
                  <View key={i} style={styles.tagPill}><Text style={styles.tagText}>#{tag}</Text></View>
                ))}
              </View>

              {/* Seller */}
              <TouchableOpacity
                style={styles.sellerRow}
                onPress={() => {
                  if (sheet.seller?.id) {
                    router.push(`/seller/${sheet.seller.id}` as any);
                  }
                }}
                activeOpacity={0.7}
              >
                {sellerProfile?.userPhotoUrl ? (
                  <Image source={{ uri: sellerProfile.userPhotoUrl }} style={styles.sellerAvatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={20} color="#6C63FF" />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.sellerName}>{sheet.seller?.name}</Text>
                  <Text style={styles.sellerInfo}>{sheet.university?.name}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>

              {/* Stats */}
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{reviewAverage.toFixed(1)} ⭐</Text>
                  <Text style={styles.statLabel}>{reviewCount} รีวิว</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{sheet.pageCount ?? '-'}</Text>
                  <Text style={styles.statLabel}>จำนวนหน้า</Text>
                </View>
              </View>

              {/* Price + Action Buttons (Right Column) */}
              <View style={styles.inlinePriceActions}>
                <View>
                  <Text style={styles.priceLabel}>ราคาพิเศษ</Text>
                  <Text style={styles.priceValue}>฿{sheet.price?.toFixed(0)}</Text>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.cartBtn, addingToCart && { opacity: 0.6 }, isInCart && { backgroundColor: '#6C63FF' }]}
                    onPress={handleToggleCart}
                    disabled={addingToCart}
                  >
                    {addingToCart ? (
                      <ActivityIndicator color={isInCart ? "#FFF" : "#6C63FF"} size="small" />
                    ) : (
                      <Ionicons name={isInCart ? "cart" : "cart-outline"} size={24} color={isInCart ? "#FFF" : "#6C63FF"} />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.buyBtn} onPress={handleBuyNow}>
                    <Text style={styles.buyText}>ซื้อชีทนี้</Text>
                    <Ionicons name="flash" size={18} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* ── AI Summary Box (conditional) ── */}
          {aiData && (
            <View style={styles.aiContainer}>
              <Text style={styles.aiSummaryTitle}>✨ AI Summary</Text>
              <Text style={styles.aiSummaryText}>{aiData.summary}</Text>
              {aiData.tags && aiData.tags.length > 0 && (
                <View style={styles.aiTagsRow}>
                  {aiData.tags.map((tag: string, i: number) => (
                    <View key={i} style={styles.aiTagPill}>
                      <Text style={styles.aiTagText}>#{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Description */}
          <Text style={styles.sectionHeader}>รายละเอียด</Text>
          <Text style={styles.description}>{sheet.description}</Text>

          {/* Reviews Section */}
          <View style={styles.divider} />
          <View style={styles.reviewsHeader}>
            <View>
              <Text style={styles.sectionHeader}>รีวิวจากผู้ซื้อ</Text>
              <Text style={styles.reviewsSubtitle}>{reviewCount} ความคิดเห็น</Text>
            </View>
            {reviewCount > 0 && (
              <View style={styles.overallRatingBadge}>
                <Text style={styles.overallRatingValue}>{reviewAverage.toFixed(1)}</Text>
                <Ionicons name="star" size={14} color="#FBBF24" />
              </View>
            )}
          </View>

          {reviewsLoading ? (
            <View style={styles.reviewsLoading}>
              <ActivityIndicator size="small" color="#6C63FF" />
              <Text style={styles.reviewsLoadingText}>กำลังโหลดรีวิว...</Text>
            </View>
          ) : reviews.length === 0 ? (
            <View style={styles.emptyReviews}>
              <View style={styles.emptyReviewsIcon}>
                <MaterialCommunityIcons name="comment-text-outline" size={32} color="#C4C9D4" />
              </View>
              <Text style={styles.emptyReviewsText}>ยังไม่มีรีวิว</Text>
              <Text style={styles.emptyReviewsSubtext}>เป็นคนแรกที่รีวิวชีทนี้!</Text>
            </View>
          ) : (
            <View style={styles.reviewsList}>
              {reviews.map((review, index) => (
                <View key={review.id} style={[styles.reviewCard, index === reviews.length - 1 && { marginBottom: 0 }]}>
                  <View style={styles.reviewCardHeader}>
                    {review.user?.userPhotoUrl ? (
                      <Image source={{ uri: review.user.userPhotoUrl }} style={styles.reviewAvatar} />
                    ) : (
                      <View style={[styles.reviewAvatarFallback, { backgroundColor: getAvatarColor(review.user?.name) }]}>
                        <Text style={styles.reviewAvatarInitials}>{getInitials(review.user?.name)}</Text>
                      </View>
                    )}
                    <View style={styles.reviewUserInfo}>
                      <Text style={styles.reviewUserName} numberOfLines={1}>{review.user?.name}</Text>
                      <Text style={styles.reviewDate}>{formatDate(review.createdAt)}</Text>
                    </View>
                    <View style={styles.reviewRatingPill}>
                      <Ionicons name="star" size={11} color="#FBBF24" />
                      <Text style={styles.reviewRatingPillText}>{review.rating.toFixed(1)}</Text>
                    </View>
                  </View>
                  <View style={styles.reviewStarsRow}>{renderStars(review.rating)}</View>
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.divider} />
          <Text style={styles.sectionHeader}>ชีทสรุปที่ใกล้เคียงกัน</Text>
          {relatedSheets.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.relatedScrollContent}>
              {relatedSheets.map((item) => (
                <View key={item.id} style={styles.relatedCardWrapper}>
                  <SheetCard item={item} isThreeColumns={true} />
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text style={{ color: '#94A3B8', fontSize: 13, marginTop: 10 }}>ยังไม่มีชีทสรุปที่ใกล้เคียงกันในขณะนี้</Text>
          )}

        </View>{/* end centeredContainer */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>ราคาพิเศษ</Text>
          <Text style={styles.priceValue}>฿{sheet.price?.toFixed(0)}</Text>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.cartBtn, addingToCart && { opacity: 0.6 }, isInCart && { backgroundColor: '#6C63FF' }]}
            onPress={handleToggleCart}
            disabled={addingToCart}
          >
            {addingToCart ? (
              <ActivityIndicator color={isInCart ? "#FFF" : "#6C63FF"} size="small" />
            ) : (
              <Ionicons name={isInCart ? "cart" : "cart-outline"} size={24} color={isInCart ? "#FFF" : "#6C63FF"} />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.buyBtn} onPress={handleBuyNow}>
            <Text style={styles.buyText}>ซื้อชีทนี้</Text>
            <Ionicons name="flash" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 45, paddingBottom: 10, paddingHorizontal: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { padding: 8, borderRadius: 20, backgroundColor: '#F3F4F6' },
  scrollContent: { paddingBottom: 20 },

  // ── iPad-First Centered Layout ──
  centeredContainer: { width: '100%', maxWidth: 900, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 24 },
  topRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 24, marginBottom: 28 },
  leftColumn: { width: 300, minWidth: 260 },
  rightColumn: { flex: 1, minWidth: 260, paddingLeft: 8, justifyContent: 'flex-start' },

  // Image
  mainImageWrapper: { width: '100%', aspectRatio: 3 / 4, borderRadius: 16, overflow: 'hidden', backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 10 },
  mainImage: { width: '100%', height: '100%' },
  mainImageBottomFade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, backgroundColor: 'rgba(0,0,0,0.04)' },
  previewBadge: { marginTop: 14, alignSelf: 'center', backgroundColor: 'rgba(108, 99, 255, 0.9)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 25, flexDirection: 'row', alignItems: 'center', elevation: 5 },
  previewText: { color: '#FFF', fontSize: 12, marginLeft: 6, fontWeight: 'bold' },

  // Right column content
  title: { fontSize: 22, fontWeight: 'bold', color: '#1E293B', marginBottom: 10 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 15 },
  tagPill: { backgroundColor: '#F3F4FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  tagText: { color: '#6366F1', fontSize: 11, fontWeight: '600' },
  sellerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  sellerName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  sellerInfo: { fontSize: 12, color: '#64748B' },
  statsContainer: { flexDirection: 'row', backgroundColor: '#F9FAFB', padding: 15, borderRadius: 12, justifyContent: 'space-around', marginBottom: 20 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  statLabel: { fontSize: 11, color: '#64748B', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#E2E8F0', height: '80%' },

  // Inline price + action buttons (right column)
  inlinePriceActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, gap: 12 },

  // ── AI Summary Box ──
  aiContainer: { backgroundColor: '#F3E8FF', borderWidth: 1, borderColor: '#D8B4FE', borderRadius: 16, padding: 18, marginBottom: 24 },
  aiSummaryTitle: { fontSize: 16, fontWeight: 'bold', color: '#7C3AED', marginBottom: 10 },
  aiSummaryText: { fontSize: 14, color: '#1E293B', lineHeight: 22, marginBottom: 12 },
  aiTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  aiTagPill: { backgroundColor: '#EDE9FE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  aiTagText: { color: '#8B5CF6', fontSize: 12, fontWeight: '600' },

  // Content
  sectionHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 4, color: '#1E293B' },
  description: { fontSize: 14, color: '#475569', lineHeight: 22, marginBottom: 10 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 25 },
  relatedScrollContent: { paddingRight: 20, flexDirection: 'row', gap: 12 },
  relatedCardWrapper: { marginRight: 0 },

  // ── Bottom Bar ──
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 34, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9', elevation: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  priceContainer: { flex: 0.8 },
  priceLabel: { fontSize: 12, color: '#64748B' },
  priceValue: { fontSize: 28, fontWeight: '800', color: '#6C63FF' },
  actionButtons: { flex: 2, flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  cartBtn: { width: 54, height: 54, borderRadius: 15, borderWidth: 1.5, borderColor: '#6C63FF', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F3FF' },
  buyBtn: { flex: 1, backgroundColor: '#6C63FF', height: 54, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', elevation: 4 },
  buyText: { color: '#FFF', fontWeight: 'bold', fontSize: 16, marginRight: 8 },

  // Reviews
  reviewsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  reviewsSubtitle: { fontSize: 12, color: '#94A3B8', marginTop: 2, marginBottom: 0 },
  overallRatingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 4 },
  overallRatingValue: { fontSize: 14, fontWeight: '700', color: '#92400E' },
  reviewsLoading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 30, gap: 10 },
  reviewsLoadingText: { color: '#94A3B8', fontSize: 13 },
  emptyReviews: { alignItems: 'center', paddingVertical: 30 },
  emptyReviewsIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  emptyReviewsText: { fontSize: 15, fontWeight: '600', color: '#94A3B8', marginBottom: 4 },
  emptyReviewsSubtext: { fontSize: 12, color: '#CBD5E1' },
  reviewsList: { gap: 12 },
  reviewCard: { backgroundColor: '#FAFAFA', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 12 },
  reviewCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  reviewAvatar: { width: 42, height: 42, borderRadius: 21, marginRight: 12, borderWidth: 2, borderColor: '#E0E7FF' },
  reviewAvatarFallback: { width: 42, height: 42, borderRadius: 21, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  reviewAvatarInitials: { color: '#FFF', fontWeight: '700', fontSize: 15, letterSpacing: 0.5 },
  reviewUserInfo: { flex: 1 },
  reviewUserName: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  reviewDate: { fontSize: 11, color: '#94A3B8' },
  reviewRatingPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, gap: 3 },
  reviewRatingPillText: { fontSize: 11, fontWeight: '700', color: '#92400E' },
  reviewStarsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  reviewComment: { fontSize: 13, color: '#475569', lineHeight: 20 },
  sellerAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12, borderWidth: 2, borderColor: '#E0E7FF' },
});