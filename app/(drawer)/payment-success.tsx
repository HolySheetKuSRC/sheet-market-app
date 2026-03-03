import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams();

  const isTablet = Dimensions.get("window").width >= 768;

  return (
    <View style={styles.wrapper}>
      <View style={[styles.card, isTablet && styles.cardTablet]}>
        
        <Ionicons
          name="checkmark-circle"
          size={isTablet ? 160 : 110}
          color="#10B981"
          style={styles.icon}
        />

        <Text style={[styles.title, isTablet && styles.titleTablet]}>
          ชำระเงินสำเร็จ 🎉
        </Text>

        <Text style={[styles.subtitle, isTablet && styles.subtitleTablet]}>
          คำสั่งซื้อของคุณได้รับการยืนยันแล้ว{"\n"}
          ระบบกำลังเตรียมไฟล์ให้คุณในคลังสินค้า
        </Text>

        {orderId && (
          <View style={styles.orderBadge}>
            <Text style={styles.orderText}>
              หมายเลขคำสั่งซื้อ:{" "}
              <Text style={styles.orderBold}>{orderId}</Text>
            </Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.replace("./marketplace")}
          >
            <Ionicons name="bag-outline" size={20} color="#fff" />
            <Text style={styles.primaryText}>เลือกซื้อสินค้าเพิ่มเติม</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.replace("/myLibrary")}
          >
            <Ionicons name="book-outline" size={20} color="#2563EB" />
            <Text style={styles.secondaryText}>ไปที่คลังของฉัน</Text>
          </TouchableOpacity>

          {/* <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.replace("/marketplace")}
          >
            <Text style={styles.linkText}>เลือกซื้อสินค้าเพิ่มเติม</Text>
          </TouchableOpacity> */}

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.replace("/home")}
          >
            <View style={styles.homeRow}>
              <Ionicons name="home-outline" size={16} color="#64748B" />
              <Text style={styles.linkText}>กลับหน้าหลัก</Text>
            </View>
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    width: "100%",
    maxWidth: 420,
    borderRadius: 30,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  cardTablet: {
    maxWidth: 700,
    padding: 60,
  },
  icon: {
    marginBottom: 25,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#0F172A",
    textAlign: "center",
  },
  titleTablet: {
    fontSize: 40,
  },
  subtitle: {
    fontSize: 15,
    color: "#64748B",
    marginTop: 10,
    textAlign: "center",
    lineHeight: 22,
  },
  subtitleTablet: {
    fontSize: 18,
  },
  orderBadge: {
    backgroundColor: "#F1F5F9",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 30,
    marginTop: 20,
  },
  orderText: {
    fontSize: 13,
    color: "#475569",
  },
  orderBold: {
    fontWeight: "bold",
    color: "#0F172A",
  },
  buttonContainer: {
    width: "100%",
    marginTop: 35,
    gap: 15,
  },
  primaryButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: "#2563EB",
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  secondaryText: {
    color: "#2563EB",
    fontWeight: "600",
    fontSize: 16,
  },
  linkButton: {
    alignItems: "center",
  },
  linkText: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 5,
  },
  homeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});