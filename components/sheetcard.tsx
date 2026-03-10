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
} from "react-native";

const { width } = Dimensions.get("window");

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
  isThreeColumns?: boolean;
  onPress?: () => void;
  isOwned?: boolean;
  onDownloadPress?: () => void;
  isLiked?: boolean;
  onLikePress?: () => void;
  onReportPress?: () => void;
}

const SheetCard: React.FC<SheetCardProps> = ({
  item,
  isThreeColumns = false,
  onPress,
  isOwned = false,
  onDownloadPress,
  isLiked = false,
  onLikePress,
  onReportPress,
}) => {
  const router = useRouter();
  if (!item) return null;

  const cardWidth = isThreeColumns ? (width - 48) / 3 : "48%";

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
    <TouchableOpacity
      style={[styles.card, { width: cardWidth }]}
      activeOpacity={0.9}
      onPress={handlePress}
    >
      {/* ⭐ Rating */}
      <View style={styles.ratingBadge}>
        <Ionicons name="star" size={11} color="#FBBF24" />
        <Text style={styles.ratingText}>
          {item.averageRating?.toFixed(1) || "0.0"}
        </Text>
      </View>

      {/* 🏷 OWNED Badge */}
      {isOwned && (
        <View style={styles.ownedBadge}>
          <Text style={styles.ownedText}>OWNED</Text>
        </View>
      )}

      {/* 🖼 Image */}
      <Image
        source={{ uri: item.image || "https://via.placeholder.com/150" }}
        style={styles.cardImage}
        resizeMode="cover"
      />

      {/* 👤 Seller */}
      <View style={styles.sellerBadge}>
        <Text style={styles.sellerText} numberOfLines={1}>
          โดย {item.seller?.name || "ไม่ระบุผู้ขาย"}
        </Text>
      </View>

      {/* 📦 Content */}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>

        <Text style={styles.descriptionText} numberOfLines={1}>
          {item.description}
        </Text>

        {/* 🏷 Tags */}
        <View style={styles.tagWrapper}>
          {item.tags?.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tagPill}>
              <Text style={styles.tagText} numberOfLines={1}>
                #{tag}
              </Text>
            </View>
          ))}
        </View>

        {/* 💰 Price หรือ Download + Like */}
        <View style={styles.bottomSection}>
          {isOwned ? (
            <View style={styles.ownedActions}>
              {/* ⬇️ Download */}
              <TouchableOpacity
                style={styles.downloadButton}
                onPress={(e) => {
                  e.stopPropagation();
                  onDownloadPress?.();
                }}
                activeOpacity={0.9}
              >
                <Ionicons name="download-outline" size={14} color="#fff" />
                <Text style={styles.downloadText}>ดาวน์โหลด</Text>
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
          ) : (
            <Text style={styles.price}>฿{item.price.toLocaleString()}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    marginBottom: 12,
    marginRight: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EEF2FF",
    height: 230,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },

  cardImage: {
    width: "100%",
    height: 100,
    backgroundColor: "#F8FAFC",
  },

  ratingBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 10,
    borderWidth: 0.5,
    borderColor: "#E2E8F0",
  },

  ratingText: {
    fontSize: 11,
    fontWeight: "bold",
    marginLeft: 2,
    color: "#1E293B",
  },

  ownedBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#22C55E",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    zIndex: 10,
  },

  ownedText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },

  sellerBadge: {
    position: "absolute",
    top: 82,
    right: 6,
    backgroundColor: "#FFF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    zIndex: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },

  sellerText: {
    fontSize: 10,
    color: "#6366F1",
    fontWeight: "700",
  },

  cardContent: {
    padding: 8,
    flex: 1,
  },

  cardTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1E293B",
    lineHeight: 14,
    marginBottom: 2,
  },

  descriptionText: {
    fontSize: 11,
    color: "#64748B",
    lineHeight: 12,
    marginBottom: 4,
  },

  tagWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 6,
    maxHeight: 28,
    overflow: "hidden",
  },

  tagPill: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },

  tagText: {
    color: "#2563EB",
    fontSize: 10,
    fontWeight: "700",
  },

  bottomSection: {
    marginTop: "auto",
  },

  price: {
    fontSize: 16,
    fontWeight: "900",
    color: "#4F46E5",
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
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
    shadowColor: "#4F46E5",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },

  downloadText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },

  // ❤️ Like button — outline เมื่อยังไม่ like, เติมสีเมื่อ like แล้ว
  likeButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
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