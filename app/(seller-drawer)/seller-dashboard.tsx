import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "../../styles/seller-dashboard.styles"; // Import จากไฟล์ที่แยกไว้

export default function SellerDashboardScreen() {
  const router = useRouter();

  const recentTransactions = [
    {
      id: "1",
      type: "sale",
      title: "ทำยังไงให้ผ่าน SE Midterm",
      subtitle: "ซื้อโดย User#1293 | 5 นาทีที่ผ่านมา",
      amount: "+69฿",
    },
    {
      id: "2",
      type: "sale",
      title: "ทำยังไงให้ผ่าน SE Midterm",
      subtitle: "ซื้อโดย User#1293 | 10 นาทีที่ผ่านมา",
      amount: "+69฿",
    },
    {
      id: "3",
      type: "review",
      title: "รีวิวใหม่ 5 ดาว",
      subtitle: "“เขียนรู้เรื่องมากครับ กลัวไม่ผ่านสุดๆเลย”",
      amount: null,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>แดชบอร์ดผู้ขาย</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={20} color="#555" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.pillButton}
            onPress={() => router.replace("/(drawer)/home")}
          >
            <Ionicons name="storefront-outline" size={16} color="#555" />
            <Text style={styles.pillButtonText}>หน้าผู้ซื้อ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.pillButtonPrimary}
            onPress={() => router.push("/(seller-drawer)/create-sheet")} // แก้ path ให้ตรงกับโครงสร้าง expo-router ของคุณ
          >
            <Ionicons name="add" size={18} color="#7A82FF" />
            <Text style={styles.pillButtonTextPrimary}>ขายชีท</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.summaryContainer}>
          <View style={styles.row}>
            <View style={[styles.card, styles.cardPurple]}>
              <View style={[styles.iconBox, styles.iconBoxWhite]}>
                <Ionicons name="bag-handle-outline" size={20} color="#7A82FF" />
              </View>
              <Text style={styles.cardTitleText}>ยอดขายวันนี้</Text>
              <Text style={styles.cardValuePurple}>฿236</Text>
            </View>
            <View style={[styles.card, styles.cardWhite]}>
              <View style={[styles.iconBox, styles.iconBoxOutline]}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={20}
                  color="#7A82FF"
                />
              </View>
              <Text style={styles.cardTitleText}>รีวิวใหม่</Text>
              <Text style={styles.cardValuePurple}>+2</Text>
            </View>
          </View>

          <View style={[styles.card, styles.cardDark]}>
            <View style={styles.totalBalanceHeader}>
              <View style={styles.iconBoxWhite}>
                <Ionicons name="cash-outline" size={20} color="#7A82FF" />
              </View>
              <TouchableOpacity style={styles.withdrawButton}>
                <Text style={styles.withdrawButtonText}>ถอนเงิน</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.cardTitleWhite}>ยอดเงินทั้งหมด</Text>
            <Text style={styles.cardValueWhite}>฿555</Text>
          </View>
        </View>

        <View style={styles.recentSection}>
          <Text style={styles.recentTitle}>รายการล่าสุด</Text>
          {recentTransactions.map((item) => (
            <View key={item.id} style={styles.listItem}>
              <View
                style={[
                  styles.listIconBox,
                  item.type === "review"
                    ? styles.listIconBoxYellow
                    : styles.listIconBoxPurple,
                ]}
              >
                <Ionicons
                  name={
                    item.type === "review"
                      ? "star-outline"
                      : "document-text-outline"
                  }
                  size={20}
                  color={item.type === "review" ? "#F59E0B" : "#7A82FF"}
                />
              </View>
              <View style={styles.listTextContainer}>
                <Text style={styles.listTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.listSubtitle} numberOfLines={1}>
                  {item.subtitle}
                </Text>
              </View>
              {item.amount && (
                <Text style={styles.listAmount}>{item.amount}</Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
