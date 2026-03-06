import { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput
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

  if (!res.ok) {
    throw new Error("Failed to fetch pending reviews");
  }

  return res.json();
};

export default function PendingReviewScreen() {
  const navigation = useNavigation();

  const [data, setData] = useState<PendingReviewResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSheet, setSelectedSheet] =
    useState<PendingReviewResponse | null>(null);

  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(0);

  useEffect(() => {
    loadPending();
  }, []);

  const loadPending = async () => {
    try {
      const res = await getPendingReviews();
      setData(res);
    } catch (error) {
      console.log("error", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = data.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  const closeModal = () => {
    setModalVisible(false);
    setRating(0);
    setReviewText("");
  };

  const submitReview = () => {
    console.log("review", rating, reviewText);

    if (selectedSheet) {
      setData((prev) =>
        prev.filter((s) => s.sheetId !== selectedSheet.sheetId)
      );
    }

    closeModal();
  };

  return (
    <View style={styles.container}>
      {/* TOP BAR */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <Ionicons name="menu" size={26} color="#333" />
        </TouchableOpacity>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color="#999" />
          <TextInput
            placeholder="ค้นหาชีท..."
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <Ionicons name="star-outline" size={24} color="#6C63FF" />
      </View>

      <ScrollView>
        <View style={styles.grid}>
          {filtered.map((item) => (
            <View key={item.sheetId} style={styles.card}>
              <Image source={{ uri: item.thumbnailUrl }} style={styles.image} />

              <View style={styles.rating}>
                <Ionicons name="star" size={12} color="#F5B400" />
                <Text style={styles.ratingText}>
                  {item.averageRating?.toFixed(1) ?? "0"}
                </Text>
              </View>

              <View style={styles.body}>
                <Text style={styles.title}>{item.title}</Text>

                <Text style={styles.desc}>{item.description}</Text>

                <View style={styles.tags}>
                  <Text style={styles.tag}>{item.category}</Text>
                  <Text style={styles.tag}>{item.courseName}</Text>
                </View>

                <TouchableOpacity
                  style={styles.reviewBtn}
                  onPress={() => {
                    setSelectedSheet(item);
                    setModalVisible(true);
                  }}
                >
                  <Text style={styles.reviewText}>รีวิว</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* REVIEW MODAL */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* HEADER */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>เขียนรีวิว</Text>

              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={22} color="#333" />
              </TouchableOpacity>
            </View>

            {selectedSheet && (
              <>
                <Image
                  source={{ uri: selectedSheet.thumbnailUrl }}
                  style={styles.modalImage}
                />

                <Text style={styles.modalSheetTitle}>
                  {selectedSheet.title}
                </Text>
              </>
            )}

            <Text style={styles.reviewLabel}>
              คุณรู้สึกอย่างไรกับชีทนี้
            </Text>

            <TextInput
              style={styles.reviewInput}
              multiline
              value={reviewText}
              onChangeText={setReviewText}
              placeholder="เขียนรีวิว..."
            />

            <Text style={styles.ratingLabel}>ให้คะแนน</Text>

            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((i) => (
                <TouchableOpacity key={i} onPress={() => setRating(i)}>
                  <Ionicons
                    name={i <= rating ? "star" : "star-outline"}
                    size={30}
                    color="#F5B400"
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={submitReview}>
              <Text style={styles.submitText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6FA"
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 45,
    paddingBottom: 15,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9"
  },

  searchBar: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    marginHorizontal: 10,
    paddingHorizontal: 12,
    height: 38,
    alignItems: "center"
  },

  searchInput: {
    flex: 1,
    marginLeft: 6,
    fontSize: 13
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    padding: 12
  },

  card: {
    width: "32%",
    backgroundColor: "#FFF",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E6E8F0"
  },

  image: {
    width: "100%",
    height: 110
  },

  rating: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "#FFF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center"
  },

  ratingText: {
    fontSize: 10,
    fontWeight: "600",
    marginLeft: 3
  },

  body: {
    padding: 8
  },

  title: {
    fontSize: 12,
    fontWeight: "600"
  },

  desc: {
    fontSize: 10,
    color: "#777",
    marginVertical: 4
  },

  tags: {
    flexDirection: "row",
    marginBottom: 6
  },

  tag: {
    fontSize: 9,
    backgroundColor: "#E8F2FF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 4
  },

  reviewBtn: {
    backgroundColor: "#5A6AF0",
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center"
  },

  reviewText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600"
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center"
  },

  modalCard: {
    width: 320,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "700"
  },

  modalImage: {
    width: 100,
    height: 120,
    alignSelf: "center",
    borderRadius: 8,
    marginTop: 10
  },

  modalSheetTitle: {
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 12,
    marginTop: 6
  },

  reviewLabel: {
    fontWeight: "600",
    marginBottom: 6
  },

  reviewInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    height: 110,
    padding: 10,
    textAlignVertical: "top",
    marginBottom: 10
  },

  ratingLabel: {
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 6
  },

  starRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16
  },

  submitBtn: {
    backgroundColor: "#5A6AF0",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center"
  },

  submitText: {
    color: "#FFF",
    fontWeight: "600"
  }
});