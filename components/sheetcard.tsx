import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Pressable,
} from "react-native";

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

  const resolvedWidth: number | string = explicitCardWidth
    ? explicitCardWidth
    : isThreeColumns
    ? (width - 48) / 3
    : "48%";

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
          ...(explicitCardWidth ? { marginRight: 0 } : {}),
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
        <Text
          style={[
            styles.cardTitle,
            variant === "library" && { color: "#292524", fontSize: 17, fontFamily: "Mitr_400Regular" },
          ]}
          numberOfLines={2}
        >
          {item.title}
        </Text>

        <Text
          style={[
            styles.descriptionText,
            variant === "library" && { color: "#979FAF", fontSize: 12 },
          ]}
          numberOfLines={2}
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

        {/* 💰 Price หรือ Download + Like */}
        <View style={styles.bottomSection}>
          {isOwned ? (
            <View style={styles.ownedActions}>
              {/* ⬇️ Download */}
              <TouchableOpacity
                style={[
                  styles.downloadButton,
                  variant === "library" && { backgroundColor: "transparent", paddingVertical: 0 },
                ]}
                onPress={(e) => {
                  e.stopPropagation();
                  onDownloadPress?.();
                }}
                activeOpacity={0.9}
              >
                {variant !== "library" && (
                  <Ionicons name="download-outline" size={14} color="#fff" />
                )}
                <Text
                  style={[
                    styles.downloadText,
                    variant === "library" && { color: "#6366F1", fontSize: 14 },
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

              {/* 🚩 Report (อุทธรณ์/รายงาน) */}
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
            <Text style={styles.price}>฿{item.price.toLocaleString()}</Text>
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

  // ── Square light-purple stage ─────────────────────────────────────────────
  bookStage: {
    width: "100%",
    aspectRatio: 1,           // square container
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
    aspectRatio: 3 / 4,       // A4 portrait cover
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
    flex: 1,
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
    marginTop: 2,
  },

  price: {
    fontSize: 17,
    fontFamily: "Mitr_500Medium",
    color: "#2740C2",
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

  downloadText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Mitr_500Medium",
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