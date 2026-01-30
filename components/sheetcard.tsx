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
    imageUrl: string;
    ratingAverage: number;
    seller: { name: string };
    tags: string[];
  };
  isThreeColumns?: boolean;
}

const SheetCard: React.FC<SheetCardProps> = ({
  item,
  isThreeColumns = false,
}) => {
  const router = useRouter();
  if (!item) return null;

  const cardWidth = isThreeColumns ? (width - 48) / 3 : "48%";

  return (
    <TouchableOpacity
      style={[styles.card, { width: cardWidth }]}
      activeOpacity={0.85}
      onPress={() =>
        router.push({
          pathname: "/sheet/[id]",
          params: { id: item.id.toString() },
        } as any)
      }
    >
      {/* ⭐ Rating */}
      <View style={styles.ratingBadge}>
        <Ionicons name="star" size={11} color="#FBBF24" />
        <Text style={styles.ratingText}>
          {item.ratingAverage?.toFixed(1) || "0.0"}
        </Text>
      </View>

      {/* 🖼 Image */}
      <Image
        source={{ uri: item.imageUrl || "https://via.placeholder.com/150" }}
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

        {/* 💰 Price */}
        <View style={styles.bottomSection}>
          <Text style={styles.price}>฿{item.price.toLocaleString()}</Text>
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
    height: 215, // 🔹 ลดความสูงรวม
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },

  cardImage: {
    width: "100%",
    height: 95, // 🔹 ภาพเตี้ยลง
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

  sellerBadge: {
    position: "absolute",
    top: 78,
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
    marginBottom: 4,
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
    alignItems: "flex-end",
  },

  price: {
    fontSize: 16, // 🔹 ลดจาก 22 ให้ balance
    fontWeight: "900",
    color: "#4F46E5",
  },
});

export default SheetCard;
