import { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Animated,
  Easing,
  Alert,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiRequest } from "@/utils/api";
import { useNavigation, DrawerActions } from "@react-navigation/native";

export interface PendingReviewResponse {
  sheetId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  averageRating: number;
  category: string;
  courseName: string;
}

const getPendingReviews = async (): Promise<PendingReviewResponse[]> => {
  const res = await apiRequest("/products/reviews/pendding", {
    method: "GET"
  });
  if (!res.ok) throw new Error("Failed to fetch pending reviews");
  return res.json();
};

function StarRating({ rating, onRate }: { rating: number; onRate?: (r: number) => void }) {
  return (
    <View style={starStyles.row}>
      {[1, 2, 3, 4, 5].map((i) => (
        <TouchableOpacity
          key={i}
          onPress={() => onRate?.(i)}
          activeOpacity={onRate ? 0.7 : 1}
          style={starStyles.star}
        >
          <Ionicons
            name={i <= rating ? "star" : "star-outline"}
            size={onRate ? 32 : 11}
            color={i <= rating ? "#FBBF24" : "#D1D5DB"}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const starStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  star: { marginHorizontal: 3 }
});

export default function PendingReviewScreen() {
  const navigation = useNavigation();
  const [data, setData] = useState<PendingReviewResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState<PendingReviewResponse | null>(null);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(0);
  const modalAnim = useState(new Animated.Value(0))[0];

  useEffect(() => { loadPending(); }, []);

  const loadPending = async () => {
    try {
      const res = await getPendingReviews();
      setData(res);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = data.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  const openModal = (item: PendingReviewResponse) => {
    setSelectedSheet(item);
    setModalVisible(true);
    Animated.spring(modalAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 80,
      friction: 8
    }).start();
  };

  const closeModal = () => {
    Animated.timing(modalAnim, {
      toValue: 0,
      duration: 180,
      easing: Easing.ease,
      useNativeDriver: true
    }).start(() => {
      setModalVisible(false);
      setRating(0);
      setReviewText("");
    });
  };

  const submitReview = async () => {
    if (!selectedSheet) return;

    try {
      const res = await apiRequest(`/products/${selectedSheet.sheetId}/reviews`, {
        method: "POST",
        body: JSON.stringify({
          rating: rating,
          comment: reviewText
        })
      });

      if (!res.ok) {
        throw new Error("Review failed");
      }

      // ลบออกจาก list pending
      setData((prev) =>
        prev.filter((s) => s.sheetId !== selectedSheet.sheetId)
      );

      closeModal();

      // ✅ แจ้งเตือนสำเร็จ
      Alert.alert(
        "สำเร็จ",
        "รีวิวเรียบร้อยแล้ว",
        [{ text: "ตกลง" }]
      );

    } catch (error) {
      console.log(error);

      Alert.alert(
        "เกิดข้อผิดพลาด",
        "ไม่สามารถส่งรีวิวได้"
      );
    }
  };

  const modalScale = modalAnim.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] });
  const modalOpacity = modalAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  return (
    <View style={styles.container}>
      {/* TOP BAR */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <Ionicons name="menu-outline" size={22} color="#374151" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>รายการที่ยังไม่รีวิว</Text>
          {filtered.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{filtered.length}</Text>
            </View>
          )}
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={15} color="#9CA3AF" />
          <TextInput
            placeholder="ค้นหาชีท..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={52} color="#C7D2FE" />
            <Text style={styles.emptyTitle}>รีวิวครบแล้ว!</Text>
            <Text style={styles.emptyDesc}>ไม่มีรายการที่ต้องรีวิวในขณะนี้</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filtered.map((item) => (
              <View key={item.sheetId} style={styles.card}>
                <View style={styles.imageWrapper}>
                  <Image source={{ uri: item.thumbnailUrl }} style={styles.image} />
                  <View style={styles.ratingPill}>
                    <Ionicons name="star" size={10} color="#FBBF24" />
                    <Text style={styles.ratingText}>{item.averageRating?.toFixed(1) ?? "0"}</Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>

                  <View style={styles.tagsRow}>
                    <View style={styles.tagChip}>
                      <Text style={styles.tagText}>{item.category}</Text>
                    </View>
                    <View style={[styles.tagChip, styles.tagChipAlt]}>
                      <Text style={[styles.tagText, styles.tagTextAlt]}>{item.courseName}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.reviewBtn}
                    onPress={() => openModal(item)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="create-outline" size={13} color="#FFF" style={{ marginRight: 5 }} />
                    <Text style={styles.reviewBtnText}>รีวิว</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* REVIEW MODAL */}
      <Modal visible={modalVisible} transparent animationType="none">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
        >
          <Animated.View style={[styles.overlay, { opacity: modalOpacity }]}> 
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalScale }], opacity: modalOpacity }]}>
            {/* MODAL HEADER */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleWrap}>
                <View style={styles.modalTitleAccent} />
                <Text style={styles.modalTitle}>เขียนรีวิว</Text>
              </View>
              <TouchableOpacity onPress={closeModal} style={styles.closeBtn}>
                <Ionicons name="close" size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedSheet && (
              <View style={styles.sheetPreview}>
                <Image source={{ uri: selectedSheet.thumbnailUrl }} style={styles.modalImage} />
                <View style={styles.sheetInfo}>
                  <Text style={styles.sheetTitle}>{selectedSheet.title}</Text>
                  <View style={styles.sheetMeta}>
                    <View style={styles.tagChipSm}>
                      <Text style={styles.tagText}>{selectedSheet.category}</Text>
                    </View>
                    <StarRating rating={selectedSheet.averageRating} />
                  </View>
                </View>
              </View>
            )}

            <View style={styles.divider} />

            <Text style={styles.inputLabel}>ความคิดเห็นของคุณ</Text>
            <TextInput
              style={styles.reviewInput}
              multiline
              value={reviewText}
              onChangeText={setReviewText}
              placeholder="บอกเราว่าคุณชอบหรือไม่ชอบอะไรในชีทนี้..."
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.ratingLabel}>ให้คะแนน</Text>
            <View style={styles.starCenter}>
              <StarRating rating={rating} onRate={setRating} />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                <Text style={styles.cancelText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, rating === 0 && styles.submitDisabled]}
                onPress={submitReview}
                disabled={rating === 0}
              >
                <Ionicons name="send" size={14} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.submitText}>ส่งรีวิว</Text>
              </TouchableOpacity>
            </View>
            </Animated.View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FC"
  },

  /* TOP BAR */
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF0F6",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8
  },
  menuBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center"
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.3
  },
  badge: {
    backgroundColor: "#6366F1",
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center"
  },
  badgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "700"
  },
  searchWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 36,
    gap: 6
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#374151"
  },

  /* SCROLL */
  scrollContent: {
    padding: 14,
    paddingBottom: 30
  },

  /* EMPTY */
  emptyState: {
    alignItems: "center",
    marginTop: 80,
    gap: 10
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#374151"
  },
  emptyDesc: {
    fontSize: 13,
    color: "#9CA3AF"
  },

  /* GRID */
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },

  /* CARD */
  card: {
    width: "31%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#1E1B4B",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F0F0F8"
  },
  imageWrapper: {
    position: "relative"
  },
  image: {
    width: "100%",
    height: 108,
    backgroundColor: "#EEF0F6"
  },
  ratingPill: {
    position: "absolute",
    top: 7,
    left: 7,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3
  },
  ratingText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#374151"
  },
  cardBody: {
    padding: 10,
    gap: 5
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 17
  },
  cardDesc: {
    fontSize: 10,
    color: "#9CA3AF",
    lineHeight: 14
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginVertical: 2
  },
  tagChip: {
    backgroundColor: "#EEF2FF",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2
  },
  tagChipAlt: {
    backgroundColor: "#F0FDF4"
  },
  tagChipSm: {
    backgroundColor: "#EEF2FF",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  tagText: {
    fontSize: 9,
    color: "#6366F1",
    fontWeight: "600"
  },
  tagTextAlt: {
    color: "#16A34A"
  },
  reviewBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6366F1",
    paddingVertical: 7,
    borderRadius: 10,
    marginTop: 4,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6
  },
  reviewBtnText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "700"
  },

  /* MODAL */
  overlay: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.5)",
    justifyContent: "center",
    alignItems: "center"
  },
  modalCard: {
    width: 340,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 22,
    shadowColor: "#1E1B4B",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 20
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16
  },
  modalTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  modalTitleAccent: {
    width: 4,
    height: 20,
    backgroundColor: "#6366F1",
    borderRadius: 3
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.4
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center"
  },

  /* SHEET PREVIEW */
  sheetPreview: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FC",
    borderRadius: 12,
    padding: 10,
    gap: 12,
    marginBottom: 14
  },
  modalImage: {
    width: 58,
    height: 72,
    borderRadius: 8,
    backgroundColor: "#E5E7EB"
  },
  sheetInfo: {
    flex: 1,
    gap: 6
  },
  sheetTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 18
  },
  sheetMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },

  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginBottom: 14
  },

  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
    letterSpacing: 0.1
  },
  reviewInput: {
    backgroundColor: "#F8F9FC",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    height: 100,
    padding: 12,
    textAlignVertical: "top",
    fontSize: 13,
    color: "#374151",
    marginBottom: 16
  },

  ratingLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    textAlign: "center",
    marginBottom: 10
  },
  starCenter: {
    alignItems: "center",
    marginBottom: 20
  },

  modalActions: {
    flexDirection: "row",
    gap: 10
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    alignItems: "center"
  },
  cancelText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280"
  },
  submitBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6366F1",
    paddingVertical: 11,
    borderRadius: 12,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10
  },
  submitDisabled: {
    backgroundColor: "#C7D2FE",
    shadowOpacity: 0
  },
  submitText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFF"
  }
});