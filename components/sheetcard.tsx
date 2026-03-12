import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { apiRequest } from "../utils/api";

const { width } = Dimensions.get("window");

// Cycling tag colours (indigo → violet → blue → emerald → amber → pink)
const TAG_COLORS = ["#6366F1", "#8B5CF6", "#3B82F6", "#059669", "#D97706", "#EC4899"];

interface SheetCardProps {
  item: {
    id: string | number;
    title: string;
    description: string;
    price: number;
    image: string;
    averageRating: number;
    seller: { name: string };
    tags: string[];
  };
  /** Explicit px width from parent grid — overrides isThreeColumns when provided */
  cardWidth?: number;
  isThreeColumns?: boolean;
  onPress?: () => void;
  isOwned?: boolean;
  onDownloadPress?: () => void;
  isLiked?: boolean;
  onLikePress?: () => void;
  onReportPress?: () => void;
  /** Visual variant of the card */
  variant?: "marketplace" | "library";
}

const SheetCard: React.FC<SheetCardProps> = ({
  item,
  cardWidth: explicitCardWidth,
  isThreeColumns = false,
  onPress,
  isOwned = false,
  onDownloadPress,
  isLiked = false,
  onLikePress,
  onReportPress,
  variant = "marketplace",
}) => {
  const router = useRouter();
  if (!item) return null;

  const [addingToCart, setAddingToCart] = useState(false);

  const handleAddToCart = async () => {
    try {
      setAddingToCart(true);
      const res = await apiRequest('/cart/add', {
        method: 'POST',
        body: JSON.stringify({ sheetId: String(item.id) }),
      });
      if (res.ok) {
        Alert.alert('สำเร็จ', 'เพิ่มลงในตะกร้าแล้ว', [
          { text: 'เลือกซื้อต่อ', style: 'cancel' },
          { text: 'ไปที่ตะกร้า', onPress: () => router.push('/cart' as any) },
        ]);
      } else if (res.status === 401) {
        router.push('/login' as any);
      } else {
        Alert.alert('ผิดพลาด', 'ไม่สามารถเพิ่มลงตะกร้าได้');
      }
    } catch {
      Alert.alert('ผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = () => {
    router.push({
      pathname: '/checkout',
      params: {
        sheetId: String(item.id),
        title: item.title,
        price: String(item.price),
        sellerName: item.seller?.name ?? '',
        type: 'direct',
      },
    } as any);
  };

  // Fixed widths — iPad-first. Callers can still override with cardWidth prop.
  const resolvedWidth: number = explicitCardWidth ?? (width >= 768 ? 220 : 165);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push({
        pathname: "/sheet/[id]",
        params: { id: item.id.toString() },
      } as any);
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          width: resolvedWidth as any,
          marginRight: 0,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
      onPress={handlePress}
    >
      {/* 📚 Purple stage — the "table" the book rests on */}
      <View style={styles.bookStage}>
        {/* ⭐ Rating badge floats over stage */}
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={11} color="#FBBF24" />
          <Text style={styles.ratingText}>
            {item.averageRating?.toFixed(1) ?? "0.0"}
          </Text>
        </View>

        {/* 🏷 OWNED Badge */}
        {isOwned && (
          <View style={styles.ownedBadge}>
            <Text style={styles.ownedText}>OWNED</Text>
          </View>
        )}

        {/* 📖 Physical book image — portrait aspect, centered, drop-shadowed */}
        <Image
          source={{ uri: item.image || "https://via.placeholder.com/300x400" }}
          style={styles.bookImage}
          resizeMode="cover"
        />
      </View>

      {/* 👤 Seller row */}
      <View style={styles.sellerRow}>
        <Ionicons name="person-circle-outline" size={13} color="#6366F1" />
        <Text
          style={[
            styles.sellerText,
            variant === "library" && { color: "#6366F1" }, // Library overrides to purple
          ]}
          numberOfLines={1}
        >
          {item.seller?.name || "ไม่ระบุผู้ขาย"}
        </Text>
      </View>

      {/* 📦 Content */}
      <View style={styles.cardContent}>

        {/* ── Flexible text area — groups title / description / tags ─────────────── */}
        <View style={styles.cardTextArea}>
          <Text
            style={[
              styles.cardTitle,
              variant === "library" && { color: "#292524", fontSize: 17, fontFamily: "Mitr_400Regular" },
            ]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {item.title}
          </Text>

          <Text
            style={[
              styles.descriptionText,
              variant === "library" && { color: "#979FAF", fontSize: 12 },
            ]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {item.description}
          </Text>

          {/* 🏷 Tags */}
          {item.tags && item.tags.length > 0 && (
            <View style={styles.tagWrapper}>
              {item.tags.slice(0, 2).map((tag, index) => (
                <View
                  key={index}
                  style={[styles.tagPill, { backgroundColor: TAG_COLORS[index % TAG_COLORS.length] }]}
                >
                  <Text style={styles.tagText} numberOfLines={1}>
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Footer: price+buttons (marketplace) or download+like (library) ── */}
        <View style={styles.cardFooter}>
          {isOwned ? (
            <View style={styles.ownedActions}>
              {/* ⬇️ Download — proper visible style in both variants */}
              <TouchableOpacity
                style={[
                  styles.downloadButton,
                  variant === "library" && styles.downloadButtonLibrary,
                ]}
                onPress={(e) => {
                  e.stopPropagation();
                  onDownloadPress?.();
                }}
                activeOpacity={0.9}
              >
                <Ionicons
                  name="download-outline"
                  size={14}
                  color={variant === "library" ? "#6366F1" : "#fff"}
                />
                <Text
                  style={[
                    styles.downloadText,
                    variant === "library" && styles.downloadTextLibrary,
                  ]}
                >
                  ดาวน์โหลด
                </Text>
              </TouchableOpacity>

              {/* ❤️ Like */}
              <TouchableOpacity
                style={[styles.likeButton, isLiked && styles.likeButtonActive]}
                onPress={(e) => {
                  e.stopPropagation();
                  onLikePress?.();
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isLiked ? "heart" : "heart-outline"}
                  size={16}
                  color={isLiked ? "#fff" : "#F43F5E"}
                />
              </TouchableOpacity>

              {/* 🚩 Report */}
              {onReportPress && (
                <TouchableOpacity
                  style={styles.reportButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    onReportPress();
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="flag" size={14} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          ) : variant === "library" ? null : (
            <>
              <Text style={styles.price}>฿{item.price.toLocaleString()}</Text>
              {/* ── Action row: Cart icon + Buy Now ───────────────────────────── */}
              <View style={styles.actionRow}>
                {/* 🛒 Add to Cart */}
                <TouchableOpacity
                  style={styles.cartButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleAddToCart();
                  }}
                  activeOpacity={0.8}
                  disabled={addingToCart}
                >
                  {addingToCart ? (
                    <ActivityIndicator size="small" color="#6366F1" />
                  ) : (
                    <Ionicons name="cart-outline" size={16} color="#6366F1" />
                  )}
                </TouchableOpacity>

                {/* ⚡ Buy Now */}
                <TouchableOpacity
                  style={styles.buyButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleBuyNow();
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.buyText}>ซื้อเลย</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    marginBottom: 14,
    marginRight: 8,
    overflow: "visible",
    shadowColor: "#4338CA",
    shadowOpacity: 0.09,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 10,
    elevation: 4,
  },

  // ── Portrait light-purple stage — scales with card width ──────────────────
  bookStage: {
    width: "100%",
    aspectRatio: 3 / 4,       // portrait A4 proportion — taller than wide on all screens
    backgroundColor: "#EEF2FF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Portrait book image — centred, drop-shadowed ──────────────────────────
  bookImage: {
    width: "58%",
    aspectRatio: 3 / 4,       // matches stage proportion — no distortion
    borderRadius: 6,
    backgroundColor: "#C7D2FE",
    shadowColor: "#1E1B4B",
    shadowOffset: { width: 3, height: 5 },
    shadowOpacity: 0.32,
    shadowRadius: 10,
    elevation: 10,
  },

  ratingBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 10,
    gap: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },

  ratingText: {
    fontSize: 12,
    fontFamily: "Mitr_400Regular",
    color: "#1E293B",
  },

  ownedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#22C55E",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    zIndex: 10,
  },

  ownedText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Mitr_500Medium",
    letterSpacing: 0.5,
  },

  sellerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 2,
  },

  sellerText: {
    fontSize: 12,
    fontFamily: "Mitr_400Regular",
    color: "#6366F1",
    flex: 1,
  },

  cardContent: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 4,
    // No flex:1 here — card height is content-driven (no fixed parent height).
    // Using flex:1 + justifyContent:space-between without a fixed parent collapses
    // the flex child to 0 in Yoga's second pass, causing content to overflow the
    // card's white background (visible due to overflow:'visible' for shadows).
  },

  // Lock text area to a fixed height so every card in the same row has
  // identical button positions regardless of text length.
  cardTextArea: {
    minHeight: 112,
  },

  // Footer follows text area in normal flow; top padding provides visual breathing room
  cardFooter: {
    paddingTop: 8,
  },

  cardTitle: {
    fontSize: 14,
    fontFamily: "Mitr_400Regular",
    color: "#292524",
    lineHeight: 20,
    marginBottom: 3,
  },

  descriptionText: {
    fontSize: 11,
    fontFamily: "Mitr_400Regular",
    color: "#979FAF",
    lineHeight: 16,
    marginBottom: 6,
  },

  tagWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 8,
  },

  tagPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },

  tagText: {
    color: "white",
    fontSize: 10,
    fontFamily: "Mitr_400Regular",
  },

  bottomSection: {
    // kept for library/owned variant compatibility — no extra margin needed
  },

  price: {
    fontSize: 17,
    fontFamily: "Mitr_500Medium",
    color: "#2740C2",
  },

  // ── Buy / Cart action row ──────────────────────────────────────────
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },

  cartButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#6366F1",
    backgroundColor: "#F5F3FF",
  },

  buyButton: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },

  buyText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Mitr_500Medium",
  },

  // ✅ Download + Like เคียงกัน
  ownedActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  downloadButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4F46E5",
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
  },

  // Library variant: softer indigo pill instead of solid dark indigo
  downloadButtonLibrary: {
    backgroundColor: "#EEF2FF",
    borderWidth: 1.5,
    borderColor: "#C7D2FE",
  },

  downloadText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Mitr_500Medium",
  },

  // Library variant text colour
  downloadTextLibrary: {
    color: "#6366F1",
  },

  likeButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#F43F5E",
    backgroundColor: "#FFF",
  },

  likeButtonActive: {
    backgroundColor: "#F43F5E",
    borderColor: "#F43F5E",
  },

  reportButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FEE2E2", // Light red background
  },
});

export default SheetCard;